import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { TerminusModule } from '@nestjs/terminus';

// Controllers
import { SubscriptionController } from './controllers/subscription.controller';

// Services
import { SubscriptionService } from './services/subscription.service';
import { PrismaService } from './services/prisma.service';

// Repositories
import { CompanySubscriptionRepository } from './repositories/company-subscription.repository';

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
    }),

    // Health checks
    TerminusModule,
  ],

  controllers: [
    SubscriptionController,
  ],

  providers: [
    // Core Services
    PrismaService,
    SubscriptionService,

    // Repositories (Data Access Layer)
    CompanySubscriptionRepository,
  ],

  exports: [
    // Export services that might be used by other modules
    PrismaService,
    SubscriptionService,
    CompanySubscriptionRepository,
  ],
})
export class AppModule {}
