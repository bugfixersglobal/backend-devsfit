#!/bin/bash

# ===================
# DEVSFIT VPS FIX SCRIPT
# ===================

set -e  # Exit on any error

echo "🔧 Starting Devsfit VPS Fix Script..."

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

# Navigate to project directory
print_status "Navigating to project directory..."
cd /opt/devsfit

# Fix 1: Create .env files if they don't exist
print_status "Creating .env files..."

if [ ! -f ".env.staging" ]; then
    print_status "Creating .env.staging..."
    cp deployment-scripts/staging.env .env.staging
    print_success ".env.staging created"
else
    print_success ".env.staging already exists"
fi

if [ ! -f ".env.production" ]; then
    print_status "Creating .env.production..."
    cp deployment-scripts/production.env .env.production
    print_success ".env.production created"
else
    print_success ".env.production already exists"
fi

# Fix 2: Update .dockerignore files to not exclude Dockerfiles
print_status "Fixing .dockerignore files..."

# Find all .dockerignore files and remove Dockerfile* exclusion
find services -name ".dockerignore" -exec sed -i '/^Dockerfile\*$/d' {} \;

print_success "Fixed .dockerignore files"

# Fix 3: Ensure proper permissions
print_status "Setting proper permissions..."
sudo chown -R $USER:$USER /opt/devsfit
chmod +x deploy-vps.sh

print_success "Permissions set"

# Fix 4: Clean up any existing containers
print_status "Cleaning up existing containers..."
docker-compose -f docker-compose.staging.yml down 2>/dev/null || true
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

print_success "Cleanup completed"

# Fix 5: Remove any orphaned containers
print_status "Removing orphaned containers..."
docker container prune -f

print_success "Orphaned containers removed"

# Fix 6: Clean up Docker images
print_status "Cleaning up unused Docker images..."
docker image prune -f

print_success "Docker images cleaned"

# Fix 7: Test Docker build for one service
print_status "Testing Docker build for api-gateway..."
cd services/api-gateway
docker build -f Dockerfile.dev -t test-build . --no-cache
docker rmi test-build
cd ../..

print_success "Docker build test passed"

# Fix 8: Create necessary directories
print_status "Creating necessary directories..."
mkdir -p staging/uploads production/uploads logs backups
sudo chown -R $USER:$USER staging production logs backups

print_success "Directories created"

# Fix 9: Check Docker and Docker Compose versions
print_status "Checking Docker versions..."
docker --version
docker-compose --version

print_success "Docker versions checked"

# Fix 10: Test staging deployment
print_status "Testing staging deployment..."
docker-compose -f docker-compose.staging.yml --env-file .env.staging up -d --build

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Check if services are running
print_status "Checking service status..."
docker-compose -f docker-compose.staging.yml ps

# Test health endpoints
print_status "Testing health endpoints..."
sleep 10

# Test staging services
if curl -f http://localhost:3000/health 2>/dev/null; then
    print_success "API Gateway (staging) is healthy"
else
    print_warning "API Gateway (staging) is not responding yet"
fi

if curl -f http://localhost:3020/health 2>/dev/null; then
    print_success "Auth Service (staging) is healthy"
else
    print_warning "Auth Service (staging) is not responding yet"
fi

print_success "Staging deployment test completed"

# Fix 11: Show final status
print_status "Final status check..."
echo ""
echo "=== CONTAINER STATUS ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== DOCKER COMPOSE STATUS ==="
docker-compose -f docker-compose.staging.yml ps

echo ""
print_success "VPS Fix Script completed!"
echo ""
echo "Next steps:"
echo "1. Check the logs: docker-compose -f docker-compose.staging.yml logs -f"
echo "2. Test production: ./deploy-vps.sh production"
echo "3. Check health: ./deploy-vps.sh health"
echo ""
echo "If you still have issues, check the logs and ensure all environment variables are properly set."
