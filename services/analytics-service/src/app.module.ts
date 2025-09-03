import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { TerminusModule } from '@nestjs/terminus';

// Configuration
import analyticsConfig from './config/analytics.config';

// Services
import { PrismaService } from './services/prisma.service';
import { AnalyticsService } from './services/analytics.service';
import { CacheService } from './services/cache.service';
import { MetricsService } from './services/metrics.service';

// Controllers
import { AnalyticsController } from './controllers/analytics.controller';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [analyticsConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot({
      throttlers: [{
        ttl: 60000,
        limit: 100,
      }],
    }),

    // Caching
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes in milliseconds
    }),

    // Health checks
    TerminusModule,
  ],

  controllers: [AnalyticsController, HealthController],

  providers: [
    // Database
    PrismaService,

    // Services
    AnalyticsService,
    CacheService,
    MetricsService,
  ],

  exports: [
    PrismaService,
    AnalyticsService,
  ],
})
export class AppModule {}
