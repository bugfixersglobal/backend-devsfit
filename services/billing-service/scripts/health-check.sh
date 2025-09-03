#!/bin/bash

# Health check script for Billing Service
# This script checks if the billing service is running and healthy

SERVICE_NAME="billing-service"
SERVICE_URL="http://localhost:3004"
HEALTH_ENDPOINT="/health"
DETAILED_HEALTH_ENDPOINT="/health/detailed"

echo "🏥 Checking health of $SERVICE_NAME..."

# Check if service is running
if ! curl -s -f "$SERVICE_URL$HEALTH_ENDPOINT" > /dev/null; then
    echo "❌ $SERVICE_NAME is not responding"
    exit 1
fi

echo "✅ $SERVICE_NAME is responding"

# Get detailed health information
HEALTH_INFO=$(curl -s "$SERVICE_URL$DETAILED_HEALTH_ENDPOINT")

if [ $? -eq 0 ]; then
    echo "📊 Health Information:"
    echo "$HEALTH_INFO" | jq '.' 2>/dev/null || echo "$HEALTH_INFO"
else
    echo "⚠️  Could not retrieve detailed health information"
fi

# Check Redis connection (if Redis is available)
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is available"
    else
        echo "⚠️  Redis is not responding"
    fi
fi

echo "🎉 Health check completed successfully"
