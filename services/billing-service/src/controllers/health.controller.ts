import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../services/prisma.service';
import { CacheService } from '../services/cache.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check() {
    return this.health.check([
      // Database health check
      () => this.prisma.$queryRaw`SELECT 1`,
      // Redis health check
      async () => {
        try {
          await this.cacheService.get('health-check');
          return { redis: { status: 'up' } };
        } catch (error) {
          throw new Error('Redis is not available');
        }
      },
      // External service health checks (if needed)
      // () => this.http.pingCheck('external-service', 'https://api.external.com'),
    ]);
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async getDetailedHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'billing-service',
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      dependencies: {
        database: 'postgres',
        cache: 'redis',
        monitoring: 'prometheus',
        tracing: 'jaeger',
      },
    };
  }
}
