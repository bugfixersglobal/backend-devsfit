import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';

export interface CacheMetrics {
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    responseTimes: [] as number[],
  };

  constructor(private readonly cacheService: CacheService) {}

  recordCacheHit(key: string, duration: number): void {
    this.metrics.cacheHits++;
    this.metrics.totalRequests++;
    this.metrics.responseTimes.push(duration);
    
    this.logger.debug(`Cache hit: ${key} - ${duration}ms`);
  }

  recordCacheMiss(key: string, duration: number): void {
    this.metrics.cacheMisses++;
    this.metrics.totalRequests++;
    this.metrics.responseTimes.push(duration);
    
    this.logger.debug(`Cache miss: ${key} - ${duration}ms`);
  }

  recordCacheSet(key: string, duration: number): void {
    this.logger.debug(`Cache set: ${key} - ${duration}ms`);
  }

  getCacheMetrics(): CacheMetrics {
    const hitRate = this.metrics.totalRequests > 0 
      ? this.metrics.cacheHits / this.metrics.totalRequests 
      : 0;

    const averageResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;

    return {
      hitRate,
      totalRequests: this.metrics.totalRequests,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      averageResponseTime,
    };
  }

  async getRedisStats(): Promise<any> {
    try {
      return await this.cacheService.getStats();
    } catch (error) {
      this.logger.error('Error getting Redis stats', error);
      return { hitRate: 0, totalRequests: 0 };
    }
  }

  resetMetrics(): void {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      responseTimes: [],
    };
    this.logger.log('Metrics reset');
  }
}
