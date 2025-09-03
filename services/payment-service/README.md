# Payment Service

Payment management microservice for Devsfit gym management system with full integration support for Redis, OpenTelemetry, and monitoring.

## 🚀 Features

- **Payment Processing**: SSLCommerz integration for payment processing
- **Redis Caching**: Advanced caching with Redis backend
- **OpenTelemetry**: Complete observability with tracing and metrics
- **Monitoring**: Prometheus metrics and health checks
- **Git Hooks**: Husky integration for code quality
- **Rate Limiting**: Built-in throttling protection
- **Security**: Helmet, CORS, and validation

## 📦 Dependencies

### Core Dependencies
- `@nestjs/*` - NestJS framework
- `@prisma/client` - Database ORM
- `axios` - HTTP client

### Redis & Caching
- `ioredis` - Redis client
- `cache-manager` - Cache management
- `cache-manager-redis-store` - Redis store for cache-manager

### OpenTelemetry & Monitoring
- `@opentelemetry/*` - Complete OpenTelemetry suite
- `prom-client` - Prometheus metrics

### Development
- `husky` - Git hooks
- `winston` - Advanced logging
- `typescript` - TypeScript support

## 🔧 Configuration

### Environment Variables

```env
# Service Configuration
NODE_ENV=development
PORT=3005

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# SSLCommerz Configuration
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_SANDBOX=true

# OpenTelemetry
JAEGER_ENDPOINT=http://jaeger:4318/v1/traces
```

## 🏗️ Architecture

### Services
- `PaymentService` - Core payment processing logic
- `SSLCommerzService` - SSLCommerz gateway integration
- `CacheService` - Redis-based caching with payment-specific methods
- `MetricsService` - Prometheus metrics collection
- `PrismaService` - Database operations

### Cache Integration
The service includes payment-specific cache methods:
- `cachePaymentSession()` - Cache payment session data
- `getPaymentSession()` - Retrieve cached session
- `cacheTransactionStatus()` - Cache transaction status
- `getTransactionStatus()` - Retrieve transaction status

### Metrics
Custom Prometheus metrics for payment operations:
- `payment_requests_total` - Total payment requests
- `payment_errors_total` - Payment errors
- `transaction_status_changes_total` - Status changes
- `payment_request_duration_seconds` - Request duration
- `active_payment_sessions` - Active sessions count

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run start:dev
```

### Testing
```bash
# Run tests
npm test

# Test caching
npm run test:caching

# Run e2e tests
npm run test:e2e
```

### Database
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate
```

## 📊 Monitoring

### Health Check
```
GET /health
```

### Metrics
```
GET /metrics
```

### API Documentation
```
GET /api/docs
```

## 🔍 OpenTelemetry

The service includes comprehensive OpenTelemetry integration:

- **Auto-instrumentation**: HTTP, Express, PostgreSQL, Redis
- **Custom metrics**: Payment-specific Prometheus metrics
- **Tracing**: Distributed tracing with Jaeger
- **Resource attributes**: Service name, version, environment

### Metrics Endpoint
- Development: Console output
- Production: Jaeger endpoint

## 💾 Redis Integration

### Cache Features
- **Session Management**: Payment session caching
- **Transaction Status**: Transaction status caching
- **Pattern Invalidation**: Bulk cache invalidation
- **Statistics**: Cache hit rates and performance metrics

### Cache Keys
- `payment:session:{sessionId}` - Payment session data
- `payment:transaction:{transactionId}` - Transaction status

## 🛡️ Security

- **Rate Limiting**: 100 requests per minute
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Validation**: Request validation with class-validator

## 📝 Git Hooks

Husky pre-commit hooks ensure code quality:
- Linting with ESLint
- Type checking with TypeScript
- Test execution

## 🔄 API Endpoints

### Payment Processing
- `POST /api/v1/payments/initiate` - Initiate payment
- `POST /api/v1/payments/validate` - Validate payment
- `POST /api/v1/payments/ipn` - IPN endpoint

### Health & Monitoring
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

## 🧪 Testing

### Cache Testing
```bash
npm run test:caching
```

This will test:
- Basic Redis operations
- Payment-specific cache methods
- Pattern invalidation
- Cache statistics

## 📈 Performance

The service is optimized for:
- **Caching**: Redis-based caching reduces database load
- **Monitoring**: Real-time metrics and tracing
- **Scalability**: Stateless design with external caching
- **Reliability**: Graceful error handling and fallbacks

## 🔧 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server is running
   - Verify connection settings in `.env`

2. **OpenTelemetry Errors**
   - Check Jaeger endpoint configuration
   - Verify network connectivity

3. **Payment Gateway Errors**
   - Verify SSLCommerz credentials
   - Check sandbox/production mode

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [OpenTelemetry Documentation](https://opentelemetry.io/)
- [Redis Documentation](https://redis.io/documentation)
- [SSLCommerz Documentation](https://developer.sslcommerz.com/)
