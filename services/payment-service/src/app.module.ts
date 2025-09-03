import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { TerminusModule } from '@nestjs/terminus';
import * as redisStore from 'cache-manager-redis-store';

// Controllers
import { AppController } from './app.controller';
import { PaymentController } from './controllers/payment.controller';
import { IPNController } from './controllers/ipn.controller';
import { HealthController } from './controllers/health.controller';
import { PaymentMonitoringController } from './controllers/payment-monitoring.controller';

// Services
import { AppService } from './app.service';
import { PrismaService } from './services/prisma.service';
import { PaymentService } from './services/payment.service';
import { SSLCommerzService } from './services/sslcommerz.service';
import { CacheService } from './services/cache.service';
import { MetricsService } from './services/metrics.service';
import { PaymentMonitoringService } from './services/payment-monitoring.service';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// Filters & Interceptors
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),

    // Caching
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default TTL
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      db: process.env.REDIS_DB || 0,
      password: process.env.REDIS_PASSWORD,
    }),

    // Health checks
    TerminusModule,
  ],

  controllers: [
    AppController,
    PaymentController,
    IPNController,
    HealthController,
    PaymentMonitoringController,
  ],

  providers: [
    // Core Services
    AppService,
    PrismaService,
    PaymentService,
    SSLCommerzService,
    CacheService,
    MetricsService,
    PaymentMonitoringService,

    // Guards
    JwtAuthGuard,

    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },

    // Global Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],

  exports: [
    // Export services that might be used by other modules
    PrismaService,
    PaymentService,
    SSLCommerzService,
    CacheService,
    MetricsService,
    PaymentMonitoringService,
  ],
})
export class AppModule {}
