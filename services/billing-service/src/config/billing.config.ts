import { registerAs } from '@nestjs/config';

export default registerAs('billing', () => ({
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production',
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },

  // Application Configuration
  app: {
    port: parseInt(process.env.PORT || '3004'),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  // Service Communication
  services: {
    packageServiceUrl: process.env.PACKAGE_SERVICE_URL || 'http://package-service:3003',
    paymentServiceUrl: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005',
    subscriptionServiceUrl: process.env.SUBSCRIPTION_SERVICE_URL || 'http://subscription-service:3006',
  },

  // Billing Configuration
  billing: {
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
    defaultTaxRate: parseFloat(process.env.DEFAULT_TAX_RATE || '0.00'),
    invoiceNumberPrefix: process.env.INVOICE_NUMBER_PREFIX || 'INV',
    couponCodePrefix: process.env.COUPON_CODE_PREFIX || 'COUPON',
  },

  // Tax Configuration
  tax: {
    enabled: process.env.TAX_ENABLED === 'true',
    rates: JSON.parse(process.env.TAX_RATES || '{"US": 0.00, "CA": 0.13, "EU": 0.20}'),
  },

  // Monitoring Configuration
  monitoring: {
    prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '9465'),
    tracingEnabled: process.env.TRACING_ENABLED === 'true',
    metricsEnabled: process.env.METRICS_ENABLED === 'true',
  },

  // Rate Limiting Configuration
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // requests per window
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300000'), // 5 minutes
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
  },
}));
