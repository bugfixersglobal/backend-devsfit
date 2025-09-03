# Professional Caching System for Auth Service

## Overview

This auth service implements a professional caching system with Redis for optimal performance in microservice architecture.

## Architecture

### Cache Layers
1. **JWT Level** - Fast user info from JWT token
2. **Redis Level** - Cached user profiles and data
3. **Database Level** - Fresh data when needed

### Endpoints

#### `/auth/me` - Fast User Info
- **Purpose**: Quick user information from JWT
- **Performance**: <10ms response time
- **Use Case**: UI rendering, authorization checks
- **Data Source**: JWT token (no database query)

```typescript
GET /auth/me
Authorization: Bearer <token>

Response:
{
  "id": "user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "status": "ACTIVE",
  "roles": ["USER"],
  "permissions": ["read:profile"]
}
```

#### `/auth/profile` - Cached User Profile
- **Purpose**: Complete user profile with caching
- **Performance**: 50-100ms (cached), 200-500ms (fresh)
- **Use Case**: Profile pages, settings
- **Data Source**: Database + Redis cache

```typescript
GET /auth/profile
Authorization: Bearer <token>

Response:
{
  "id": "user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "status": "ACTIVE",
  "emailVerified": true,
  "phoneVerified": false,
  "twoFactorEnabled": false,
  "roles": ["USER"],
  "permissions": ["read:profile", "write:profile"],
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLoginAt": "2024-01-15T10:30:00Z"
}
```

#### `/auth/profile/fresh` - Fresh User Profile
- **Purpose**: Bypass cache for fresh data
- **Performance**: 200-500ms
- **Use Case**: Critical updates, admin operations
- **Data Source**: Database (bypasses cache)

## Cache Management

### Cache Controller Endpoints

#### GET `/cache/metrics`
Get cache performance metrics:
```json
{
  "application": {
    "hitRate": 0.95,
    "totalRequests": 1000,
    "cacheHits": 950,
    "cacheMisses": 50,
    "averageResponseTime": 45.2
  },
  "redis": {
    "hitRate": 0.95,
    "totalRequests": 1000
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### DELETE `/cache/clear`
Clear all cache:
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### GET `/cache/health`
Check cache health:
```json
{
  "healthy": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "message": "Cache is healthy"
}
```

## Performance Optimization

### Cache Strategy
1. **TTL**: 10 minutes for user profiles
2. **Pattern**: `user:{userId}:profile`
3. **Invalidation**: Automatic on user updates
4. **Fallback**: Database query if cache fails

### Monitoring
- **Hit Rate Target**: >90%
- **Response Time Target**: <100ms
- **Error Rate Target**: <1%

### Cache Keys
- `user:{userId}:profile` - User profile
- `cache:{method}:{url}:{userId}` - Request cache
- `health:check` - Health check

## Configuration

### Environment Variables
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
```

### Cache TTL Settings
- **User Profile**: 600 seconds (10 minutes)
- **Request Cache**: 300 seconds (5 minutes)
- **Health Check**: 60 seconds (1 minute)

## Error Handling

### Cache Failures
- **Graceful Degradation**: Falls back to database
- **Logging**: Detailed error logs
- **Monitoring**: Cache health checks

### Circuit Breaker
- **Redis Down**: Continue without cache
- **Performance**: Monitor response times
- **Recovery**: Automatic when Redis is back

## Best Practices

### When to Use Each Endpoint

#### Use `/auth/me` for:
- Header/navbar user info
- Quick authorization checks
- UI state management
- Real-time user status

#### Use `/auth/profile` for:
- Profile pages
- Settings pages
- User management
- Detailed user information

#### Use `/auth/profile/fresh` for:
- Critical updates
- Admin operations
- Data verification
- After user updates

### Cache Invalidation
- **Automatic**: On user updates
- **Manual**: Via cache controller
- **Pattern-based**: User-specific invalidation

## Monitoring and Alerts

### Metrics to Monitor
1. **Cache Hit Rate**: Should be >90%
2. **Response Time**: Should be <100ms
3. **Error Rate**: Should be <1%
4. **Redis Memory**: Monitor usage

### Alerts
- Cache hit rate <80%
- Response time >200ms
- Redis connection failures
- High error rates

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

#### Cache Inconsistency
- Clear cache manually
- Check invalidation logic
- Verify user updates

### Debug Commands
```bash
# Check Redis connection
redis-cli ping

# Monitor cache operations
redis-cli monitor

# Check memory usage
redis-cli info memory
```

## Future Enhancements

1. **Distributed Caching**: Redis Cluster
2. **Advanced Metrics**: Prometheus integration
3. **Cache Warming**: Pre-populate cache
4. **Multi-level Caching**: L1 + L2 cache
5. **Cache Compression**: Reduce memory usage 