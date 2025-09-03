import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { TerminusModule } from '@nestjs/terminus';

// Controllers
import { AppController } from './app.controller';
import { SuperAdminController } from './controllers/super-admin.controller';
import { ModuleController } from './controllers/module.controller';
import { PublicController } from './controllers/public.controller';
import { HealthController } from './controllers/health.controller';
import { CacheController } from './controllers/cache.controller';

// Services
import { AppService } from './app.service';
import { PrismaService } from './config/prisma.service';
import { SuperAdminService } from './services/super-admin.service';
import { PublicPackageService } from './services/public-package.service';
import { CacheService } from './services/cache.service';
import { HealthService } from './services/health.service';

// Repositories
import { ModuleRepository } from './repositories/module.repository';

// Use Cases
import { CreateModuleUseCase } from './use-cases/create-module.use-case';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { InternalServiceGuard } from './guards/internal-service.guard';

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
    }),

    // Health checks
    TerminusModule,
  ],

  controllers: [
    AppController,
    SuperAdminController,
    PublicController,
    HealthController,
    CacheController,
  ],

  providers: [
    // Core Services
    AppService,
    PrismaService,

    // Business Services
    SuperAdminService,
    PublicPackageService,
    CacheService,
    HealthService,

    // Repositories
    ModuleRepository,

    // Use Cases
    CreateModuleUseCase,

    // Guards
    JwtAuthGuard,
    SuperAdminGuard,
    InternalServiceGuard,

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
    SuperAdminService,
    ModuleRepository,
    CreateModuleUseCase,
  ],
})
export class AppModule {}