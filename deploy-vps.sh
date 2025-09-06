#!/bin/bash

# ===================
# DEVSFIT VPS DEPLOYMENT SCRIPT
# ===================

set -e  # Exit on any error

echo "🚀 Starting Devsfit VPS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Navigate to project directory
print_status "Navigating to project directory..."
cd /opt/devsfit

# Check if .env files exist
if [ ! -f ".env.staging" ]; then
    print_error ".env.staging file not found!"
    exit 1
fi

if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    exit 1
fi

# Function to deploy staging
deploy_staging() {
    print_status "Deploying staging environment..."
    
    # Stop existing containers
    docker-compose -f docker-compose.staging.yml --env-file .env.staging down || true
    
    # Build and start services
    docker-compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
    
    print_success "Staging deployment completed!"
    
    # Show container status
    print_status "Staging container status:"
    docker-compose -f docker-compose.staging.yml ps
}

# Function to deploy production
deploy_production() {
    print_status "Deploying production environment..."
    
    # Stop existing containers
    docker-compose -f docker-compose.production.yml --env-file .env.production down || true
    
    # Build and start services
    docker-compose -f docker-compose.production.yml --env-file .env.production up -d --build
    
    print_success "Production deployment completed!"
    
    # Show container status
    print_status "Production container status:"
    docker-compose -f docker-compose.production.yml ps
}

# Function to check health
check_health() {
    print_status "Checking service health..."
    
    # Check staging services
    print_status "Checking staging services..."
    curl -f http://localhost:3000/health && print_success "API Gateway (staging) is healthy" || print_error "API Gateway (staging) is not responding"
    curl -f http://localhost:3020/health && print_success "Auth Service (staging) is healthy" || print_error "Auth Service (staging) is not responding"
    curl -f http://localhost:3003/health && print_success "Package Service (staging) is healthy" || print_error "Package Service (staging) is not responding"
    curl -f http://localhost:3004/health && print_success "Billing Service (staging) is healthy" || print_error "Billing Service (staging) is not responding"
    curl -f http://localhost:3005/health && print_success "Payment Service (staging) is healthy" || print_error "Payment Service (staging) is not responding"
    
    # Check production services
    print_status "Checking production services..."
    curl -f http://localhost:3001/health && print_success "API Gateway (production) is healthy" || print_error "API Gateway (production) is not responding"
    curl -f http://localhost:3021/health && print_success "Auth Service (production) is healthy" || print_error "Auth Service (production) is not responding"
    curl -f http://localhost:3006/health && print_success "Package Service (production) is healthy" || print_error "Package Service (production) is not responding"
    curl -f http://localhost:3008/health && print_success "Billing Service (production) is healthy" || print_error "Billing Service (production) is not responding"
    curl -f http://localhost:3009/health && print_success "Payment Service (production) is healthy" || print_error "Payment Service (production) is not responding"
}

# Function to show logs
show_logs() {
    local environment=$1
    print_status "Showing logs for $environment environment..."
    
    if [ "$environment" = "staging" ]; then
        docker-compose -f docker-compose.staging.yml --env-file .env.staging logs -f
    elif [ "$environment" = "production" ]; then
        docker-compose -f docker-compose.production.yml --env-file .env.production logs -f
    else
        print_error "Invalid environment. Use 'staging' or 'production'"
        exit 1
    fi
}

# Main script logic
case "${1:-}" in
    "staging")
        deploy_staging
        ;;
    "production")
        deploy_production
        ;;
    "both")
        deploy_staging
        deploy_production
        ;;
    "health")
        check_health
        ;;
    "logs-staging")
        show_logs "staging"
        ;;
    "logs-production")
        show_logs "production"
        ;;
    *)
        echo "Usage: $0 {staging|production|both|health|logs-staging|logs-production}"
        echo ""
        echo "Commands:"
        echo "  staging         - Deploy staging environment"
        echo "  production      - Deploy production environment"
        echo "  both           - Deploy both environments"
        echo "  health         - Check health of all services"
        echo "  logs-staging   - Show staging logs"
        echo "  logs-production - Show production logs"
        exit 1
        ;;
esac

print_success "Deployment script completed!"
