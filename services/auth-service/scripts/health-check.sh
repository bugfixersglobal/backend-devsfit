#!/bin/sh

echo "🔍 Health check starting..."

# Wait for PostgreSQL using netcat instead of pg_isready
echo "⏳ Waiting for PostgreSQL..."
until nc -z postgres 5432; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for Redis using netcat instead of redis-cli
echo "⏳ Waiting for Redis..."
until nc -z redis 6379; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

echo "🎉 All services are ready!" 