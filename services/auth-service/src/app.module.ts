import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { TerminusModule } from '@nestjs/terminus';

// Configuration
import authConfig from './config/auth.config';

// Services
import { PrismaService } from './services/prisma.service';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { JwtService } from './services/jwt.service';
import { OtpService } from './services/otp.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { TwoFactorService } from './services/two-factor.service';
import { CacheService } from './services/cache.service';
import { MetricsService } from './services/metrics.service';
import { RoleValidationService } from './services/role-validation.service';

// Repositories
import { UserRepository } from './repositories/user.repository';
import { RoleRepository } from './repositories/role.repository';

// Use Cases
import { RegisterUserUseCase } from './use-cases/register-user.use-case';
import { LoginUserUseCase } from './use-cases/login-user.use-case';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { HealthController } from './controllers/health.controller';
import { TwoFactorController } from './controllers/two-factor.controller';
import { CacheController } from './controllers/cache.controller';
import { ProfessionalRoleController } from './controllers/professional-role.controller';



// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { CacheGuard } from './guards/cache.guard';
import { ProfessionalRoleGuard } from './guards/professional-role.guard';

// Seeders
import { ProfessionalRolesSeeder } from './seeds/professional-roles.seeder';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),

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

  controllers: [AuthController, HealthController, TwoFactorController, CacheController, ProfessionalRoleController],

  providers: [
    // Database
    PrismaService,

    // Repositories
    UserRepository,
    RoleRepository,

    // Use Cases
    RegisterUserUseCase,
    LoginUserUseCase,

    // 2FA Service
    TwoFactorService,

    // Services
    AuthService,
    UserService,
    JwtService,
    OtpService,
    EmailService,
    SmsService,
    TwoFactorService,
    CacheService,
    MetricsService,
    RoleValidationService,

    // Strategies
    JwtStrategy,
    // GoogleStrategy, // Commented out until Google OAuth is configured

    // Guards
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    CacheGuard,
    ProfessionalRoleGuard,

    // Seeders
    ProfessionalRolesSeeder,


  ],

  exports: [
    PrismaService,
    AuthService,
    JwtService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    ProfessionalRoleGuard,
    RoleValidationService,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seeder: ProfessionalRolesSeeder) {}

  async onModuleInit() {
    // Seed professional roles and permissions on startup
    if (process.env.NODE_ENV !== 'test') {
      await this.seeder.seed();
    }
  }
} 