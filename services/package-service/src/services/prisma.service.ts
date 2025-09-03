import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    const nodeEnv = configService.get('NODE_ENV');
    super({
      log: nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit() {
    try {
      // Check if DATABASE_URL is available
      const databaseUrl = this.configService.get('DATABASE_URL');
      if (!databaseUrl) {
        this.logger.warn('⚠️ DATABASE_URL not found - database connection skipped');
        return;
      }

      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Database connection failed:', error.message);
      // Don't throw error to allow service to start without database
      // In production, you might want to throw this error
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error.message);
      return false;
    }
  }
} 