import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';

// Controllers
import { AppController } from './app.controller';
import { AdminController } from './controllers/admin.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { PackagesController } from './controllers/packages.controller';
import { UsersController } from './controllers/users.controller';
import { BillingController } from './controllers/billing.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { HealthController } from './controllers/health.controller';

// Services
import { AppService } from './app.service';
import { MicroserviceClientService } from './services/microservice-client.service';
import { PackageService } from './services/package.service';
import { UserService } from './services/user.service';
import { BillingService } from './services/billing.service';
import { AnalyticsService } from './services/analytics.service';
import { HealthService } from './services/health.service';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // HTTP client for microservice communication
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
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
    AppController,
    AdminController,
    DashboardController,
    PackagesController,
    UsersController,
    BillingController,
    AnalyticsController,
    HealthController,
  ],

  providers: [
    // Core Services
    AppService,
    MicroserviceClientService,

    // Business Services
    PackageService,
    UserService,
    BillingService,
    AnalyticsService,
    HealthService,

    // Guards
    JwtAuthGuard,
    AdminGuard,
  ],

  exports: [
    MicroserviceClientService,
  ],
})
export class AppModule {}
