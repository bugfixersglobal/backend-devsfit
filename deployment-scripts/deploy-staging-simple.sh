#!/bin/bash
# Simple Staging Deployment Script

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

# Function to log messages
log() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" | tee -a $LOG_FILE
}

# Load environment variables safely
load_env() {
    if [ -f "$ENV_FILE" ]; then
        echo "📄 Loading staging environment variables..."
        # Read the file line by line and export only valid variables
        while IFS= read -r line; do
            # Skip comments and empty lines
            if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "$line" ]]; then
                # Check if line contains = and doesn't start with space
                if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
                    export "$line"
                    echo "Loaded: ${line%%=*}"
                fi
            fi
        done < "$ENV_FILE"
    else
        echo "❌ ERROR: Staging environment file not found: $ENV_FILE"
        exit 1
    fi
}

# Load environment variables
load_env

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

# Stop existing containers
log "🛑 Stopping existing staging containers..."
docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans || true

# Pull latest images
log "📥 Pulling latest staging images..."
docker-compose -f $DOCKER_COMPOSE_FILE pull

# Start infrastructure services first
log "🏗️  Starting infrastructure services..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d postgres-staging redis-staging rabbitmq-staging

# Wait for infrastructure to be ready
log "⏳ Waiting for infrastructure services to be ready..."
sleep 30

# Start microservices
log "🚀 Starting microservices..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# Wait for services to start
log "⏳ Waiting for services to start..."
sleep 60

# Run health checks
log "🔍 Running health checks..."
./deployment-scripts/health-check.sh

# Show deployment status
log "📊 Deployment status:"
docker-compose -f $DOCKER_COMPOSE_FILE ps

log "✅ Staging deployment completed successfully!"
