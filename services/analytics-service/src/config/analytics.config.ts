import { registerAs } from '@nestjs/config';

export default registerAs('analytics', () => ({
  // Application Configuration
  app: {
    port: parseInt(process.env.PORT || '3011'),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

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
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-analytics-service',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Analytics Configuration
  analytics: {
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '365'),
    batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '1000'),
    realTimeEnabled: process.env.ANALYTICS_REAL_TIME_ENABLED === 'true',
    cacheTtl: parseInt(process.env.ANALYTICS_CACHE_TTL || '300'),
    processingInterval: parseInt(process.env.ANALYTICS_PROCESSING_INTERVAL || '300000'),
    maxConcurrentJobs: parseInt(process.env.ANALYTICS_MAX_CONCURRENT_JOBS || '5'),
    dataCleanupEnabled: process.env.ANALYTICS_DATA_CLEANUP_ENABLED === 'true',
    dataCleanupInterval: parseInt(process.env.ANALYTICS_DATA_CLEANUP_INTERVAL || '86400000'),
  },

  // Elasticsearch Configuration
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'devsfit_analytics',
  },

  // Service URLs
  services: {
    packageService: process.env.PACKAGE_SERVICE_URL || 'http://localhost:3004',
    paymentService: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
    subscriptionService: process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3005',
    billingService: process.env.BILLING_SERVICE_URL || 'http://localhost:3007',
    purchaseFlowService: process.env.PURCHASE_FLOW_SERVICE_URL || 'http://localhost:3010',
    userService: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    companyService: process.env.COMPANY_SERVICE_URL || 'http://localhost:3003',
    attendanceService: process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:3005',
  },

  // CORS Configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3004',
      'http://localhost:3006',
      'http://localhost:3005',
      'http://localhost:3007',
      'http://localhost:3010',
    ],
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || 'logs/analytics-service.log',
  },

  // OpenTelemetry Configuration
  telemetry: {
    enabled: process.env.OTEL_ENABLED === 'true',
    serviceName: process.env.OTEL_SERVICE_NAME || 'analytics-service',
    serviceVersion: process.env.OTEL_SERVICE_VERSION || '1.0.0',
    tracesEndpoint: process.env.OTEL_TRACES_ENDPOINT || 'http://localhost:4317',
    metricsEndpoint: process.env.OTEL_METRICS_ENDPOINT || 'http://localhost:4317',
  },

  // Rate Limiting Configuration
  rateLimiting: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000'),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300000'),
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS || '1000'),
  },
}));
