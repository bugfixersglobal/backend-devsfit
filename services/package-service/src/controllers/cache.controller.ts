import { Controller, Get, Delete, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CacheService, CacheMetrics } from '../services/cache.service';

@ApiTags('Cache Management')
@Controller('cache')
@ApiBearerAuth('BearerAuth')
export class CacheController {
  private readonly logger = new Logger(CacheController.name);

  constructor(private readonly cacheService: CacheService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get cache performance metrics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        application: {
          type: 'object',
          properties: {
            hitRate: { type: 'number', example: 0.95 },
            totalRequests: { type: 'number', example: 1000 },
            cacheHits: { type: 'number', example: 950 },
            cacheMisses: { type: 'number', example: 50 },
            averageResponseTime: { type: 'number', example: 45.2 }
          }
        },
        redis: {
          type: 'object',
          properties: {
            hitRate: { type: 'number', example: 0.95 },
            totalRequests: { type: 'number', example: 1000 }
          }
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  async getMetrics() {
    this.logger.log('Cache metrics requested');
    
    const metrics = this.cacheService.getMetrics();
    
    return {
      application: {
        hitRate: metrics.hitRate,
        totalRequests: metrics.totalRequests,
        cacheHits: metrics.cacheHits,
        cacheMisses: metrics.cacheMisses,
        averageResponseTime: metrics.averageResponseTime,
      },
      redis: {
        hitRate: metrics.hitRate,
        totalRequests: metrics.totalRequests,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear all cache' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache cleared successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Cache cleared successfully' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  async clearCache() {
    this.logger.log('Cache clear requested');
    
    try {
      await this.cacheService.clear();
      
      return {
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
      throw error;
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Check cache health' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache health check',
    schema: {
      type: 'object',
      properties: {
        healthy: { type: 'boolean', example: true },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
        message: { type: 'string', example: 'Cache is healthy' }
      }
    }
  })
  async getHealth() {
    this.logger.log('Cache health check requested');
    
    const health = await this.cacheService.getHealth();
    
    return {
      healthy: health.healthy,
      timestamp: new Date().toISOString(),
      message: health.message,
    };
  }
} 