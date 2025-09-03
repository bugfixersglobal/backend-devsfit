import { Controller, Get, Delete, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CacheService } from '../services/cache.service';
import { MetricsService } from '../services/metrics.service';

@ApiTags('Cache Management')
@Controller('cache')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('BearerAuth')
export class CacheController {
  private readonly logger = new Logger(CacheController.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get cache performance metrics' })
  @ApiResponse({ status: 200, description: 'Cache metrics retrieved successfully' })
  async getCacheMetrics() {
    this.logger.log('Cache metrics request received');
    
    try {
      const metrics = this.metricsService.getCacheMetrics();
      const redisStats = await this.metricsService.getRedisStats();
      
      return {
        application: metrics,
        redis: redisStats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting cache metrics', error);
      throw error;
    }
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear all cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache() {
    this.logger.log('Cache clear request received');
    
    try {
      // Clear all cache patterns
      const patterns = [
        'user:*:profile',
        'cache:*',
        'user:*',
      ];

      for (const pattern of patterns) {
        await this.cacheService.invalidatePattern(pattern);
      }

      // Reset metrics
      this.metricsService.resetMetrics();
      
      this.logger.log('Cache cleared successfully');
      return { 
        success: true, 
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error clearing cache', error);
      throw error;
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Check cache health' })
  @ApiResponse({ status: 200, description: 'Cache health check successful' })
  async getCacheHealth() {
    this.logger.log('Cache health check requested');
    
    try {
      // Test cache connection
      const testKey = 'health:check';
      await this.cacheService.setex(testKey, 60, 'ok');
      const result = await this.cacheService.get(testKey);
      await this.cacheService.del(testKey);

      const isHealthy = result === 'ok';
      
      return {
        healthy: isHealthy,
        timestamp: new Date().toISOString(),
        message: isHealthy ? 'Cache is healthy' : 'Cache is not responding',
      };
    } catch (error) {
      this.logger.error('Cache health check failed', error);
      return {
        healthy: false,
        timestamp: new Date().toISOString(),
        message: 'Cache health check failed',
        error: error.message,
      };
    }
  }
} 