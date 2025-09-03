#!/bin/bash

# ===================
# DAILY BACKUP SCRIPT
# ===================

set -e

BACKUP_DIR="/backups/daily"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="devsfit_daily_$TIMESTAMP"
RETENTION_DAYS=7

echo "🔄 Starting daily backup process..."

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# ===================
# DATABASE BACKUPS
# ===================

echo "💾 Backing up databases..."

# Function to backup a database
backup_database() {
    local db_name=$1
    local container_name=$2
    
    echo "  📊 Backing up $db_name..."
    docker exec "$container_name" pg_dump -U postgres -d "$db_name" --verbose --no-owner --no-acl \
        | gzip > "$BACKUP_DIR/$BACKUP_NAME/${db_name}_backup.sql.gz"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo "  ✅ $db_name backup completed"
    else
        echo "  ❌ $db_name backup failed"
        exit 1
    fi
}

# Backup all databases
backup_database "devsfit_auth" "devsfit-postgres-primary-prod"
backup_database "devsfit_user" "devsfit-postgres-primary-prod"
backup_database "devsfit_package" "devsfit-postgres-primary-prod"
backup_database "devsfit_billing" "devsfit-postgres-primary-prod"
backup_database "devsfit_payment" "devsfit-postgres-primary-prod"
backup_database "devsfit_company" "devsfit-postgres-primary-prod"
backup_database "grafana" "devsfit-postgres-primary-prod"

# ===================
# REDIS BACKUP
# ===================

echo "🔴 Backing up Redis..."
docker exec devsfit-redis-master-prod redis-cli --pass "$REDIS_PASSWORD" BGSAVE
sleep 10

# Wait for background save to complete
while [ $(docker exec devsfit-redis-master-prod redis-cli --pass "$REDIS_PASSWORD" LASTSAVE) -eq $(docker exec devsfit-redis-master-prod redis-cli --pass "$REDIS_PASSWORD" LASTSAVE) ]; do
    echo "  ⏳ Waiting for Redis BGSAVE to complete..."
    sleep 5
done

docker cp devsfit-redis-master-prod:/data/dump.rdb "$BACKUP_DIR/$BACKUP_NAME/redis_dump.rdb"
echo "  ✅ Redis backup completed"

# ===================
# CONFIGURATION BACKUP
# ===================

echo "⚙️  Backing up configuration files..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME/config_backup.tar.gz" \
    /opt/devsfit/production/.env \
    /opt/devsfit/production/docker-compose.production.yml \
    /opt/devsfit/production/deployment-scripts/ \
    /opt/devsfit/production/infrastructure/

echo "  ✅ Configuration backup completed"

# ===================
# FILE UPLOADS BACKUP
# ===================

echo "📁 Backing up uploaded files..."
if [ -d "/opt/devsfit/uploads" ]; then
    tar -czf "$BACKUP_DIR/$BACKUP_NAME/uploads_backup.tar.gz" /opt/devsfit/uploads/
    echo "  ✅ Uploads backup completed"
else
    echo "  ⚠️  No uploads directory found"
fi

# ===================
# MONITORING DATA BACKUP
# ===================

echo "📊 Backing up monitoring data..."
docker run --rm -v prometheus-data:/source -v "$BACKUP_DIR/$BACKUP_NAME":/backup alpine \
    tar -czf /backup/prometheus_data.tar.gz -C /source .

docker run --rm -v grafana-data:/source -v "$BACKUP_DIR/$BACKUP_NAME":/backup alpine \
    tar -czf /backup/grafana_data.tar.gz -C /source .

echo "  ✅ Monitoring data backup completed"

# ===================
# BACKUP VERIFICATION
# ===================

echo "🔍 Verifying backups..."
BACKUP_SIZE=$(du -sh "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
FILE_COUNT=$(find "$BACKUP_DIR/$BACKUP_NAME" -type f | wc -l)

if [ "$FILE_COUNT" -lt 5 ]; then
    echo "❌ Backup verification failed: too few files ($FILE_COUNT)"
    exit 1
fi

echo "  ✅ Backup verification passed: $FILE_COUNT files, $BACKUP_SIZE total"

# ===================
# COMPRESS FINAL BACKUP
# ===================

echo "🗜️  Compressing final backup..."
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

FINAL_SIZE=$(du -sh "$BACKUP_NAME.tar.gz" | cut -f1)
echo "  ✅ Final backup created: $BACKUP_NAME.tar.gz ($FINAL_SIZE)"

# ===================
# CLEANUP OLD BACKUPS
# ===================

echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "devsfit_daily_*.tar.gz" -mtime +$RETENTION_DAYS -delete
REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "devsfit_daily_*.tar.gz" | wc -l)
echo "  ✅ Cleanup completed: $REMAINING_BACKUPS backups remaining"

# ===================
# UPLOAD TO CLOUD (Optional)
# ===================

if [ -n "$AWS_S3_BUCKET" ]; then
    echo "☁️  Uploading to S3..."
    aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" "s3://$AWS_S3_BUCKET/backups/daily/"
    echo "  ✅ S3 upload completed"
fi

# ===================
# NOTIFICATION
# ===================

echo "📧 Sending notification..."
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Daily backup completed successfully: $BACKUP_NAME.tar.gz ($FINAL_SIZE)\"}" \
        "$SLACK_WEBHOOK_URL"
fi

echo "🎉 Daily backup process completed successfully!"
echo "📦 Backup file: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "📏 Size: $FINAL_SIZE"
echo "📅 Retention: $RETENTION_DAYS days"
