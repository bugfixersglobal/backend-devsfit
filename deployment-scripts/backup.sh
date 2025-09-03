#!/bin/bash

# ===================
# BACKUP SCRIPT
# ===================

set -e

BACKUP_DIR="/opt/devsfit/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="devsfit_backup_$TIMESTAMP"

echo "📦 Starting backup process..."

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Database backups
echo "💾 Backing up databases..."
docker exec devsfit-postgres-auth pg_dump -U postgres devsfit_auth > "$BACKUP_DIR/$BACKUP_NAME/auth_db.sql"
docker exec devsfit-postgres-user pg_dump -U postgres devsfit_user > "$BACKUP_DIR/$BACKUP_NAME/user_db.sql"
docker exec devsfit-postgres-package pg_dump -U postgres devsfit_package > "$BACKUP_DIR/$BACKUP_NAME/package_db.sql"
docker exec devsfit-postgres-billing pg_dump -U postgres devsfit_billing > "$BACKUP_DIR/$BACKUP_NAME/billing_db.sql"

# Redis backup
echo "🔴 Backing up Redis..."
docker exec devsfit-redis redis-cli BGSAVE
sleep 5
docker cp devsfit-redis:/data/dump.rdb "$BACKUP_DIR/$BACKUP_NAME/redis_dump.rdb"

# Application configuration
echo "⚙️  Backing up configuration..."
cp -r /opt/devsfit/production/.env "$BACKUP_DIR/$BACKUP_NAME/"
cp -r /opt/devsfit/production/docker-compose.production.yml "$BACKUP_DIR/$BACKUP_NAME/"

# Compress backup
echo "🗜️  Compressing backup..."
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

# Keep only last 7 backups
echo "🧹 Cleaning old backups..."
ls -t "$BACKUP_DIR"/*.tar.gz | tail -n +8 | xargs -r rm

echo "✅ Backup completed: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
