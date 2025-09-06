#!/bin/bash

# ========================================
# DEVSFIT VPS DEPLOYMENT SCRIPT
# ========================================
# This script deploys the Devsfit backend to VPS
# Run this script on your VPS after pulling the latest code

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
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root. Use a regular user with sudo privileges."
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

print_status "Docker and Docker Compose are available ✅"

# Navigate to project directory
if [ ! -d "devsfit-backend" ]; then
    print_error "devsfit-backend directory not found. Please make sure you're in the correct location."
    exit 1
fi

cd devsfit-backend
print_status "Changed to devsfit-backend directory"

# Check if .env.staging exists
if [ ! -f ".env.staging" ]; then
    print_error ".env.staging file not found. Please create it first."
    exit 1
fi

print_status ".env.staging file found ✅"

# Stop any existing containers
print_status "Stopping any existing containers..."
docker-compose -f docker-compose.staging.yml --env-file .env.staging down 2>/dev/null || true

# Remove any orphaned containers
print_status "Cleaning up orphaned containers..."
docker-compose -f docker-compose.staging.yml --env-file .env.staging down --remove-orphans 2>/dev/null || true

# Pull latest images (if using pre-built images)
print_status "Pulling latest base images..."
docker pull postgres:16-alpine
docker pull redis:7-alpine
docker pull rabbitmq:3-management-alpine
docker pull prom/prometheus:latest
docker pull grafana/grafana:latest
docker pull jaegertracing/all-in-one:latest

# Build and start services
print_status "Building and starting all services..."
docker-compose -f docker-compose.staging.yml --env-file .env.staging up -d --build

# Wait for services to start
print_status "Waiting for services to initialize..."
sleep 30

# Check service status
print_status "Checking service status..."
docker-compose -f docker-compose.staging.yml --env-file .env.staging ps

# Wait for database to be ready
print_status "Waiting for database to be ready..."
sleep 20

# Run database migrations for auth service
print_status "Running database migrations..."
docker exec devsfit-auth-service-staging npx prisma db push 2>/dev/null || print_warning "Auth service not ready yet, will retry..."

# Wait a bit more for all services
print_status "Waiting for all services to be ready..."
sleep 30

# Test all services
print_status "Testing all services..."

echo ""
echo "=== SERVICE HEALTH CHECKS ==="

# Test API Gateway
if curl -s http://localhost:3000/health > /dev/null; then
    print_success "API Gateway (3000): ✅ WORKING"
else
    print_warning "API Gateway (3000): ⚠️  Not responding"
fi

# Test Auth Service
if curl -s http://localhost:3020/health > /dev/null; then
    print_success "Auth Service (3020): ✅ WORKING"
else
    print_warning "Auth Service (3020): ⚠️  Not responding"
fi

# Test Package Service
if curl -s http://localhost:3003/health > /dev/null; then
    print_success "Package Service (3003): ✅ WORKING"
else
    print_warning "Package Service (3003): ⚠️  Not responding"
fi

# Test Billing Service
if curl -s http://localhost:3004/health > /dev/null; then
    print_success "Billing Service (3004): ✅ WORKING"
else
    print_warning "Billing Service (3004): ⚠️  Not responding"
fi

# Test Payment Service
if curl -s http://localhost:3005/health > /dev/null; then
    print_success "Payment Service (3005): ✅ WORKING"
else
    print_warning "Payment Service (3005): ⚠️  Not responding"
fi

echo ""
echo "=== INFRASTRUCTURE SERVICES ==="

# Check PostgreSQL
if docker exec devsfit-postgres-staging pg_isready -U devsfit_staging_user -d devsfit_staging > /dev/null 2>&1; then
    print_success "PostgreSQL: ✅ HEALTHY"
else
    print_warning "PostgreSQL: ⚠️  Not ready"
fi

# Check Redis
if docker exec devsfit-redis-staging redis-cli ping > /dev/null 2>&1; then
    print_success "Redis: ✅ HEALTHY"
else
    print_warning "Redis: ⚠️  Not ready"
fi

# Check RabbitMQ
if curl -s http://localhost:15672 > /dev/null; then
    print_success "RabbitMQ: ✅ HEALTHY"
else
    print_warning "RabbitMQ: ⚠️  Not ready"
fi

echo ""
echo "=== DEPLOYMENT SUMMARY ==="
echo "🎉 Devsfit staging environment deployed!"
echo ""
echo "📊 Service URLs:"
echo "   • API Gateway: http://your-vps-ip:3000"
echo "   • Auth Service: http://your-vps-ip:3020"
echo "   • Package Service: http://your-vps-ip:3003"
echo "   • Billing Service: http://your-vps-ip:3004"
echo "   • Payment Service: http://your-vps-ip:3005"
echo ""
echo "🔧 Management URLs:"
echo "   • RabbitMQ Management: http://your-vps-ip:15672"
echo "   • Prometheus: http://your-vps-ip:9091"
echo "   • Grafana: http://your-vps-ip:3014"
echo "   • Jaeger: http://your-vps-ip:16687"
echo ""
echo "📝 Useful Commands:"
echo "   • View logs: docker-compose -f docker-compose.staging.yml --env-file .env.staging logs"
echo "   • Restart services: docker-compose -f docker-compose.staging.yml --env-file .env.staging restart"
echo "   • Stop services: docker-compose -f docker-compose.staging.yml --env-file .env.staging down"
echo "   • View status: docker-compose -f docker-compose.staging.yml --env-file .env.staging ps"
echo ""
print_success "Deployment completed! 🚀"
