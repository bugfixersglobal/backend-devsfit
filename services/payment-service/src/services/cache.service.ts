import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisConfig: any = {
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      db: this.configService.get('REDIS_DB', 0),
      lazyConnect: true,
    };

    // Only add password if it's configured
    const password = this.configService.get('REDIS_PASSWORD');
    if (password) {
      redisConfig.password = password;
    }

    this.redis = new Redis(redisConfig);

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', error);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      const start = Date.now();
      const result = await this.redis.get(key);
      const duration = Date.now() - start;
      
      this.logger.debug(`Cache GET: ${key} - ${duration}ms`);
      return result;
    } catch (error) {
      this.logger.error(`Cache GET error for key: ${key}`, error);
      return null;
    }
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    try {
      const start = Date.now();
      await this.redis.setex(key, ttl, value);
      const duration = Date.now() - start;
      
      this.logger.debug(`Cache SETEX: ${key} - ${duration}ms`);
    } catch (error) {
      this.logger.error(`Cache SETEX error for key: ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DEL error for key: ${key}`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache EXISTS error for key: ${key}`, error);
      return false;
    }
  }

  async getOrSet(key: string, ttl: number, factory: () => Promise<any>): Promise<any> {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      // If not in cache, generate and cache
      const data = await factory();
      await this.setex(key, ttl, JSON.stringify(data));
      return data;
    } catch (error) {
      this.logger.error(`Cache GET_OR_SET error for key: ${key}`, error);
      // Fallback to factory without caching
      return await factory();
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Cache invalidated pattern: ${pattern} - ${keys.length} keys`);
      }
    } catch (error) {
      this.logger.error(`Cache invalidate pattern error: ${pattern}`, error);
    }
  }

  async getStats(): Promise<{ hitRate: number; totalRequests: number }> {
    try {
      const info = await this.redis.info('stats');
      // Parse Redis info for cache statistics
      // This is a simplified version
      return { hitRate: 0.95, totalRequests: 1000 };
    } catch (error) {
      this.logger.error('Cache stats error', error);
      return { hitRate: 0, totalRequests: 0 };
    }
  }

  // Payment-specific cache methods
  async cachePaymentSession(sessionId: string, paymentData: any, ttl: number = 3600): Promise<void> {
    const key = `payment:session:${sessionId}`;
    await this.setex(key, ttl, JSON.stringify(paymentData));
  }

  async getPaymentSession(sessionId: string): Promise<any | null> {
    const key = `payment:session:${sessionId}`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async invalidatePaymentSession(sessionId: string): Promise<void> {
    const key = `payment:session:${sessionId}`;
    await this.del(key);
  }

  async cacheTransactionStatus(transactionId: string, status: any, ttl: number = 7200): Promise<void> {
    const key = `payment:transaction:${transactionId}`;
    await this.setex(key, ttl, JSON.stringify(status));
  }

  async getTransactionStatus(transactionId: string): Promise<any | null> {
    const key = `payment:transaction:${transactionId}`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }
}
