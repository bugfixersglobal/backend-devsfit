#!/bin/bash

# ===================
# HEALTH CHECK SCRIPT
# ===================

set -e

echo "🏥 Starting health checks..."

# Services to check
SERVICES=(
    "api-gateway:3000"
    "auth-service:3020"
    "user-service:3002"
    "package-service:3003"
    "billing-service:3004"
    "payment-service:3005"
    "onboarding-service:3007"
)

# Infrastructure to check
INFRASTRUCTURE=(
    "postgres-auth:5432"
    "redis:6379"
    "rabbitmq:5672"
    "elasticsearch:9200"
)

# Function to check service health
check_service() {
    local service=$1
    local host=$(echo $service | cut -d':' -f1)
    local port=$(echo $service | cut -d':' -f2)
    
    echo "Checking $host:$port..."
    
    # Try HTTP health check first
    if curl -f -s --max-time 10 "http://$host:$port/health" > /dev/null 2>&1; then
        echo "✅ $host HTTP health check passed"
        return 0
    fi
    
    # Fallback to TCP check
    if nc -z -w5 $host $port > /dev/null 2>&1; then
        echo "✅ $host TCP check passed"
        return 0
    fi
    
    echo "❌ $host health check failed"
    return 1
}

# Check infrastructure
echo "🔧 Checking infrastructure services..."
failed_infra=0
for service in "${INFRASTRUCTURE[@]}"; do
    if ! check_service $service; then
        ((failed_infra++))
    fi
done

# Check application services
echo "🚀 Checking application services..."
failed_services=0
for service in "${SERVICES[@]}"; do
    if ! check_service $service; then
        ((failed_services++))
    fi
done

# Summary
echo "📊 Health Check Summary:"
echo "Infrastructure failures: $failed_infra"
echo "Service failures: $failed_services"

if [ $failed_infra -gt 0 ] || [ $failed_services -gt 0 ]; then
    echo "❌ Health checks failed!"
    exit 1
else
    echo "✅ All health checks passed!"
    exit 0
fi
