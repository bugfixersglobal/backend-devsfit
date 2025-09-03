import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { TerminusModule } from '@nestjs/terminus';


// Configuration
import billingConfig from './config/billing.config';

// Services
import { PrismaService } from './services/prisma.service';
import { BillingService } from './services/billing.service';
import { CacheService } from './services/cache.service';
import { MetricsService } from './services/metrics.service';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';

// Repositories
import { InvoiceRepository } from './repositories/invoice.repository';
import { CouponRepository } from './repositories/coupon.repository';

// Controllers
import { BillingController } from './controllers/billing.controller';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [billingConfig],
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

    // JWT Module for authentication

  ],
  controllers: [BillingController, HealthController],
  providers: [
    // Database
    PrismaService,

    // Guards
    JwtAuthGuard,
    SuperAdminGuard,

    // Repositories
    InvoiceRepository,
    CouponRepository,

    // Services
    BillingService,
    CacheService,
    MetricsService,
  ],
  exports: [BillingService, PrismaService, CacheService, MetricsService],
})
export class AppModule {}
