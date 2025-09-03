#!/bin/bash
# Staging Environment Deployment Script

set -e

echo "🚀 DEPLOYING TO STAGING ENVIRONMENT"
echo "===================================="

# Configuration
ENVIRONMENT="staging"
DOCKER_COMPOSE_FILE="deployment-scripts/docker-compose.staging.yml"
ENV_FILE="deployment-scripts/staging.env"
BACKUP_DIR="/opt/devsfit/staging/backups"
LOG_FILE="/opt/devsfit/staging/logs/deployment.log"

# Create necessary directories
mkdir -p $BACKUP_DIR
mkdir -p /opt/devsfit/staging/logs
mkdir -p /opt/devsfit/staging/uploads

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    echo "📄 Loading staging environment variables..."
    export $(cat $ENV_FILE | grep -v '^#' | xargs)
else
    echo "❌ ERROR: Staging environment file not found: $ENV_FILE"
    exit 1
fi

# Function to log messages
log() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" | tee -a $LOG_FILE
}

# Function to check if service is healthy
check_service_health() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    log "🔍 Checking health of $service_name on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:$port/health" > /dev/null; then
            log "✅ $service_name is healthy!"
            return 0
        else
            log "⏳ Attempt $attempt/$max_attempts: $service_name not ready yet..."
            sleep 10
            attempt=$((attempt + 1))
        fi
    done
    
    log "❌ $service_name failed health check after $max_attempts attempts"
    return 1
}

# Pre-deployment checks
log "🔍 Running pre-deployment checks..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log "❌ ERROR: Docker is not running"
    exit 1
fi

# Check if Docker Compose file exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    log "❌ ERROR: Docker Compose file not found: $DOCKER_COMPOSE_FILE"
    exit 1
fi

# Check available disk space
DISK_SPACE=$(df / | awk 'NR==2 {print $4}')
if [ "$DISK_SPACE" -lt 5242880 ]; then  # Less than 5GB
    log "⚠️  WARNING: Low disk space available: $(($DISK_SPACE / 1024 / 1024))GB"
fi

# Backup existing data (if any)
log "💾 Creating backup of existing staging data..."
if docker-compose -f $DOCKER_COMPOSE_FILE ps | grep -q "Up"; then
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres-staging pg_dump -U $POSTGRES_USER devsfit_staging | gzip > "$BACKUP_DIR/pre_deployment_$(date +%Y%m%d_%H%M%S).sql.gz"
    log "✅ Backup created successfully"
else
    log "ℹ️  No existing containers running, skipping backup"
fi

# Stop existing containers
log "🛑 Stopping existing staging containers..."
docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans

# Pull latest images
log "📥 Pulling latest staging images..."
docker-compose -f $DOCKER_COMPOSE_FILE pull

# Start infrastructure services first
log "🏗️  Starting infrastructure services..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d postgres-staging redis-staging rabbitmq-staging

# Wait for infrastructure to be ready
log "⏳ Waiting for infrastructure services to be ready..."
sleep 30

# Check infrastructure health
log "🔍 Checking infrastructure health..."
if ! check_service_health "postgres-staging" 5432; then
    log "❌ PostgreSQL staging failed health check"
    exit 1
fi

# Start microservices
log "🚀 Starting microservices..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d api-gateway-staging auth-service-staging user-service-staging package-service-staging billing-service-staging payment-service-staging

# Wait for microservices to start
log "⏳ Waiting for microservices to start..."
sleep 60

# Check microservices health
log "🔍 Checking microservices health..."
SERVICES=(
    "api-gateway-staging:3000"
    "auth-service-staging:3020"
    "user-service-staging:3002"
    "package-service-staging:3003"
    "billing-service-staging:3004"
    "payment-service-staging:3005"
)

ALL_HEALTHY=true
for SERVICE_ENDPOINT in "${SERVICES[@]}"; do
    SERVICE_NAME=$(echo "$SERVICE_ENDPOINT" | cut -d':' -f1)
    PORT=$(echo "$SERVICE_ENDPOINT" | cut -d':' -f2)
    
    if ! check_service_health "$SERVICE_NAME" "$PORT"; then
        ALL_HEALTHY=false
    fi
done

# Start monitoring services
log "📊 Starting monitoring services..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d prometheus-staging grafana-staging jaeger-staging

# Start load balancer
log "⚖️  Starting load balancer..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d nginx-staging

# Final health check
log "🔍 Running final health check..."
sleep 30

if $ALL_HEALTHY; then
    log "🎉 STAGING DEPLOYMENT COMPLETED SUCCESSFULLY!"
    log "📊 Services available at:"
    log "   - API Gateway: https://api-staging.devsfit.com"
    log "   - Monitoring: https://monitoring-staging.devsfit.com"
    log "   - Grafana: https://monitoring-staging.devsfit.com/grafana"
    log "   - Jaeger: https://monitoring-staging.devsfit.com/jaeger"
    
    # Send notification (if configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"✅ Staging deployment completed successfully!\"}" \
            $SLACK_WEBHOOK_URL
    fi
    
    exit 0
else
    log "❌ STAGING DEPLOYMENT FAILED!"
    log "🔍 Checking container logs..."
    docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=50
    
    # Send notification (if configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"❌ Staging deployment failed! Check logs for details.\"}" \
            $SLACK_WEBHOOK_URL
    fi
    
    exit 1
fi
