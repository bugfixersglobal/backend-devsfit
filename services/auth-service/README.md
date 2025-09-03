# Auth Service - Professional Caching System

## Overview

This auth service implements a professional caching system with Redis for optimal performance in microservice architecture.

## Features

### 🚀 Performance Optimized Endpoints

#### `/auth/me` - Fast User Info
- **Response Time**: <10ms
- **Data Source**: JWT token (no database query)
- **Use Case**: UI rendering, authorization checks

#### `/auth/profile` - Cached User Profile  
- **Response Time**: 50-100ms (cached), 200-500ms (fresh)
- **Data Source**: Database + Redis cache
- **Use Case**: Profile pages, settings

#### `/auth/profile/fresh` - Fresh User Profile
- **Response Time**: 200-500ms
- **Data Source**: Database (bypasses cache)
- **Use Case**: Critical updates, admin operations

### 📊 Cache Management

- **Cache Metrics**: `/cache/metrics`
- **Cache Health**: `/cache/health`
- **Cache Clear**: `/cache/clear`

### 🎯 Performance Targets

- **Cache Hit Rate**: >90%
- **Response Time**: <100ms
- **Error Rate**: <1%

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Configure Redis and database settings
```

### 3. Start with Redis
```bash
# Using Docker Compose
docker-compose -f docker-compose.cache.yml up -d

# Or start Redis manually
redis-server
```

### 4. Run the Service
```bash
npm run start:dev
```

### 5. Test Caching System
```bash
npm run test:caching
```

## Architecture

### Cache Layers
1. **JWT Level** - Fast user info from JWT token
2. **Redis Level** - Cached user profiles and data  
3. **Database Level** - Fresh data when needed

### Cache Strategy
- **TTL**: 10 minutes for user profiles
- **Pattern**: `user:{userId}:profile`
- **Invalidation**: Automatic on user updates
- **Fallback**: Database query if cache fails

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

### User Profile
- `GET /auth/me` - Fast user info (JWT)
- `GET /auth/profile` - Cached user profile
- `GET /auth/profile/fresh` - Fresh user profile

### Cache Management
- `GET /cache/metrics` - Cache performance metrics
- `GET /cache/health` - Cache health check
- `DELETE /cache/clear` - Clear all cache

## Configuration

### Environment Variables
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0

# Cache TTL (seconds)
CACHE_USER_PROFILE_TTL=600
CACHE_REQUEST_TTL=300
```

## Monitoring

### Cache Metrics
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/cache/metrics
```

### Health Check
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/cache/health
```

## Performance Testing

### Run Performance Test
```bash
npm run test:caching
```

### Expected Results
- `/auth/me`: <50ms
- `/auth/profile`: <100ms (cached)
- Cache Hit Rate: >80%

## Troubleshooting

### Common Issues

#### High Cache Miss Rate
- Check Redis connection
- Verify cache keys
- Monitor memory usage

#### Slow Response Times
- Check database performance
- Monitor Redis latency
- Review cache TTL settings

### Debug Commands
```bash
# Check Redis connection
redis-cli ping

# Monitor cache operations
redis-cli monitor

# Check memory usage
redis-cli info memory
```

## Development

### Adding New Cached Endpoints
```typescript
@Get('example')
@UseGuards(JwtAuthGuard)
async getExample(@UserId() userId: string) {
  return this.authService.getUserProfileWithCache(userId);
}
```

### Cache Invalidation
```typescript
// Invalidate user cache
await this.authService.invalidateUserCache(userId);
```

## Production Deployment

### Redis Configuration
- Use Redis Cluster for high availability
- Configure persistence (AOF/RDB)
- Set appropriate memory limits
- Enable monitoring

### Performance Monitoring
- Monitor cache hit rates
- Track response times
- Set up alerts for cache failures
- Use distributed tracing

## Documentation

For detailed documentation, see [CACHING_SYSTEM.md](./CACHING_SYSTEM.md) 