import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { CacheService } from './cache.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async getBasicHealth() {
    return {
      status: 'ok',
      service: 'package-service',
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  async getDetailedHealth() {
    const basicHealth = await this.getBasicHealth();
    
    // Check database connection
    const databaseHealth = await this.checkDatabase();
    
    // Check Redis connection
    const redisHealth = await this.checkRedis();
    
    // System metrics
    const systemMetrics = this.getSystemMetrics();
    
    const overallStatus = this.determineOverallStatus([
      databaseHealth.status,
      redisHealth.status
    ]);

    return {
      ...basicHealth,
      status: overallStatus,
      checks: {
        database: databaseHealth,
        redis: redisHealth,
      },
      system: systemMetrics,
    };
  }

  async getReadiness() {
    try {
      // Check if all critical dependencies are available
      const databaseHealth = await this.checkDatabase();
      
      if (databaseHealth.status !== 'healthy') {
        throw new Error('Database not ready');
      }

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: databaseHealth.status,
        }
      };
    } catch (error) {
      this.logger.error('Readiness check failed', error);
      throw error;
    }
  }

  async getLiveness() {
    // Simple liveness check - just ensure the service is running
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    // If memory usage is extremely high, consider the service unhealthy
    if (memoryUsageMB > 1000) { // 1GB threshold
      throw new Error('Memory usage too high');
    }

    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      memory: {
        used: memoryUsageMB,
        threshold: 1000
      }
    };
  }

  private async checkDatabase() {
    try {
      // Perform a simple query to check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        responseTime: Date.now(),
        message: 'Database connection is healthy',
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        message: 'Database connection failed',
      };
    }
  }

  private async checkRedis() {
    try {
      const health = await this.cacheService.getHealth();
      
      return {
        status: health.healthy ? 'healthy' : 'unhealthy',
        message: health.message,
        responseTime: Date.now(),
      };
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        message: 'Redis connection failed',
      };
    }
  }

  private getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime: this.getUptime(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
    };
  }

  private getUptime(): number {
    return Date.now() - this.startTime;
  }

  private determineOverallStatus(statuses: string[]): string {
    if (statuses.every(status => status === 'healthy')) {
      return 'healthy';
    }
    
    if (statuses.some(status => status === 'unhealthy')) {
      return 'unhealthy';
    }
    
    return 'degraded';
  }
} 