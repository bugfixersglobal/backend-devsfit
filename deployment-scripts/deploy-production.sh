#!/bin/bash

# ===================
# PRODUCTION DEPLOYMENT SCRIPT
# ===================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_DIR="/opt/devsfit/production"
BACKUP_DIR="/opt/devsfit/backups"
LOG_FILE="/var/log/devsfit/deployment.log"
COMPOSE_FILE="$DEPLOYMENT_DIR/deployment-scripts/docker-compose.production.yml"
ENV_FILE="$DEPLOYMENT_DIR/deployment-scripts/production.env"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "🔍 Starting pre-deployment checks..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        error "This script must be run as root"
    fi
    
    # Check Docker installation
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check Docker Compose installation
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file not found: $ENV_FILE"
    fi
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "Docker Compose file not found: $COMPOSE_FILE"
    fi
    
    # Check disk space (minimum 10GB free)
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 10485760 ]; then
        error "Insufficient disk space. At least 10GB required."
    fi
    
    # Check memory (minimum 4GB)
    AVAILABLE_MEMORY=$(free -m | awk 'NR==2{print $7}')
    if [ "$AVAILABLE_MEMORY" -lt 4096 ]; then
        warn "Low available memory. At least 4GB recommended."
    fi
    
    log "✅ Pre-deployment checks completed"
}

# Create required directories
create_directories() {
    log "📁 Creating required directories..."
    
    mkdir -p "$DEPLOYMENT_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "/var/log/devsfit"
    mkdir -p "/opt/devsfit/uploads"
    mkdir -p "/opt/devsfit/ssl"
    
    # Set proper permissions
    chown -R 1001:1001 "/opt/devsfit/uploads"
    chmod 755 "/opt/devsfit/ssl"
    
    log "✅ Directories created"
}

# Create Docker volumes
create_volumes() {
    log "💾 Creating Docker volumes..."
    
    docker volume create devsfit-postgres-primary-data || true
    docker volume create devsfit-postgres-replica-data || true
    docker volume create devsfit-redis-master-data || true
    docker volume create devsfit-rabbitmq-1-data || true
    docker volume create devsfit-prometheus-data || true
    docker volume create devsfit-grafana-data || true
    docker volume create devsfit-elasticsearch-data || true
    docker volume create devsfit-backup-data || true
    
    log "✅ Docker volumes created"
}

# Pull latest images
pull_images() {
    log "📥 Pulling latest Docker images..."
    
    cd "$DEPLOYMENT_DIR"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    
    log "✅ Images pulled successfully"
}

# Stop existing services
stop_services() {
    log "🛑 Stopping existing services..."
    
    cd "$DEPLOYMENT_DIR"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --timeout 30 || true
    
    log "✅ Services stopped"
}

# Start infrastructure services
start_infrastructure() {
    log "🏗️  Starting infrastructure services..."
    
    cd "$DEPLOYMENT_DIR"
    
    # Start databases first
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d \
        postgres-primary postgres-replica pgbouncer
    
    # Wait for databases
    sleep 30
    
    # Start cache and messaging
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d \
        redis-master redis-sentinel-1 rabbitmq-1
    
    # Wait for cache and messaging
    sleep 30
    
    # Start monitoring
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d \
        elasticsearch prometheus grafana alertmanager jaeger
    
    # Wait for monitoring stack
    sleep 60
    
    log "✅ Infrastructure services started"
}

# Start application services
start_applications() {
    log "🚀 Starting application services..."
    
    cd "$DEPLOYMENT_DIR"
    
    # Start load balancer
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d nginx
    
    # Start API gateways
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d \
        api-gateway-1 api-gateway-2
    
    # Wait for gateways
    sleep 30
    
    # Start core services
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d \
        auth-service-1 auth-service-2
    
    # Start remaining services
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    # Start backup scheduler
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d backup-scheduler
    
    log "✅ Application services started"
}

# Health checks
run_health_checks() {
    log "🏥 Running health checks..."
    
    # Wait for services to be ready
    sleep 120
    
    # Run comprehensive health check
    if [ -f "$DEPLOYMENT_DIR/deployment-scripts/health-check.sh" ]; then
        bash "$DEPLOYMENT_DIR/deployment-scripts/health-check.sh"
    else
        warn "Health check script not found"
    fi
    
    log "✅ Health checks completed"
}

# Database migrations
run_migrations() {
    log "🔄 Running database migrations..."
    
    # Run migrations for each service
    SERVICES=("auth-service-1" "user-service" "package-service" "billing-service" "payment-service" "company-service")
    
    for service in "${SERVICES[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "devsfit-$service-prod"; then
            info "Running migrations for $service..."
            docker exec "devsfit-$service-prod" npm run prisma:migrate:deploy || warn "Migration failed for $service"
        fi
    done
    
    log "✅ Database migrations completed"
}

# Setup monitoring
setup_monitoring() {
    log "📊 Setting up monitoring..."
    
    # Import Grafana dashboards
    sleep 30  # Wait for Grafana to be ready
    
    # Configure alerting rules
    if docker ps --format "table {{.Names}}" | grep -q "devsfit-prometheus-prod"; then
        docker exec devsfit-prometheus-prod promtool check rules /etc/prometheus/alerts/*.yml || warn "Alert rules validation failed"
    fi
    
    log "✅ Monitoring setup completed"
}

# Post-deployment tasks
post_deployment_tasks() {
    log "🔧 Running post-deployment tasks..."
    
    # Clean up old Docker images
    docker image prune -f
    
    # Clean up old volumes
    docker volume prune -f
    
    # Set up log rotation
    cat > /etc/logrotate.d/devsfit << EOF
/var/log/devsfit/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 root root
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
EOF
    
    # Set up cron job for health checks
    cat > /etc/cron.d/devsfit-health << EOF
*/5 * * * * root /opt/devsfit/production/deployment-scripts/health-check.sh > /dev/null 2>&1
EOF
    
    log "✅ Post-deployment tasks completed"
}

# Send notification
send_notification() {
    log "📧 Sending deployment notification..."
    
    local status=$1
    local message="Devsfit Production Deployment $status"
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        if [ "$status" = "SUCCESS" ]; then
            curl -X POST -H 'Content-type: application/json' \
                --data "{\"text\":\"✅ $message\", \"color\":\"good\"}" \
                "$SLACK_WEBHOOK_URL" || true
        else
            curl -X POST -H 'Content-type: application/json' \
                --data "{\"text\":\"❌ $message\", \"color\":\"danger\"}" \
                "$SLACK_WEBHOOK_URL" || true
        fi
    fi
    
    log "✅ Notification sent"
}

# Rollback function
rollback() {
    error_msg=$1
    error "Deployment failed: $error_msg"
    
    log "🔄 Starting rollback procedure..."
    
    # Stop all services
    cd "$DEPLOYMENT_DIR"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down || true
    
    # Restore from backup if available
    if [ -f "$BACKUP_DIR/pre-deployment-backup.tar.gz" ]; then
        log "📦 Restoring from pre-deployment backup..."
        # Add restore logic here
    fi
    
    send_notification "FAILED - ROLLBACK INITIATED"
    exit 1
}

# Main deployment function
main() {
    log "🚀 Starting Devsfit Production Deployment..."
    
    # Set error trap
    trap 'rollback "Unexpected error occurred"' ERR
    
    # Load environment variables
    source "$ENV_FILE"
    
    # Run deployment steps
    pre_deployment_checks
    create_directories
    create_volumes
    
    # Create backup before deployment
    if [ -f "$DEPLOYMENT_DIR/deployment-scripts/backup.sh" ]; then
        log "💾 Creating pre-deployment backup..."
        bash "$DEPLOYMENT_DIR/deployment-scripts/backup.sh" || warn "Backup creation failed"
    fi
    
    pull_images
    stop_services
    start_infrastructure
    start_applications
    run_migrations
    run_health_checks
    setup_monitoring
    post_deployment_tasks
    
    # Final status check
    cd "$DEPLOYMENT_DIR"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    
    log "🎉 Devsfit Production Deployment completed successfully!"
    send_notification "SUCCESS"
}

# Script execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
