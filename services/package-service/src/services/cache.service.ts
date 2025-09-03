import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheMetrics {
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;
  private metrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    responseTimes: [] as number[],
  };

  constructor(private readonly configService: ConfigService) {
    const redisConfig = {
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6382),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true, // Don't connect immediately
      enableOfflineQueue: false, // Don't queue commands when disconnected
    };

    this.redis = new Redis(redisConfig);

    this.redis.on('connect', () => {
      this.logger.log('✅ Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      // Only log connection errors once to reduce noise
      if ((error as any).code === 'ECONNREFUSED') {
        this.logger.warn('⚠️ Redis not available (connection refused) - caching disabled');
      } else {
        this.logger.error('❌ Redis connection error:', error);
      }
    });

    this.redis.on('ready', () => {
      this.logger.log('✅ Redis ready for commands');
    });

    this.redis.on('close', () => {
      this.logger.log('🔌 Redis connection closed');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const value = await this.redis.get(key);
      const responseTime = Date.now() - startTime;
      
      // Limit response times array to prevent memory leaks
      this.metrics.responseTimes.push(responseTime);
      if (this.metrics.responseTimes.length > 1000) {
        this.metrics.responseTimes = this.metrics.responseTimes.slice(-500);
      }

      if (value) {
        this.metrics.cacheHits++;
        this.logger.debug(`Cache HIT for key: ${key}`);
        try {
          return JSON.parse(value) as T;
        } catch (parseError) {
          this.logger.warn(`Failed to parse cached value for key: ${key}`, parseError);
          return null;
        }
      } else {
        this.metrics.cacheMisses++;
        this.logger.debug(`Cache MISS for key: ${key}`);
        return null;
      }
    } catch (error) {
      // Gracefully handle Redis unavailability
      if ((error as any).code === 'ECONNREFUSED' || (error as any).code === 'ENOTFOUND') {
        this.logger.debug(`Cache unavailable for key: ${key} - falling back to database`);
      } else {
        this.logger.error(`Error getting cache for key ${key}:`, error);
      }
      this.metrics.cacheMisses++;
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const defaultTTL = this.configService.get('CACHE_PACKAGE_TTL', 900); // 15 minutes
      const cacheTTL = ttl || defaultTTL;

      await this.redis.setex(key, cacheTTL, serializedValue);
      this.logger.debug(`Cache SET for key: ${key} with TTL: ${cacheTTL}s`);
    } catch (error) {
      // Gracefully handle Redis unavailability
      if ((error as any).code === 'ECONNREFUSED' || (error as any).code === 'ENOTFOUND') {
        this.logger.debug(`Cache unavailable - skipping set for key: ${key}`);
      } else {
        this.logger.error(`Error setting cache for key ${key}:`, error);
      }
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.debug(`Cache DELETE for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}:`, error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Cache DELETE pattern: ${pattern}, deleted ${keys.length} keys`);
      }
    } catch (error) {
      this.logger.error(`Error deleting cache pattern ${pattern}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.log('✅ Cache cleared successfully');
    } catch (error) {
      this.logger.error('❌ Error clearing cache:', error);
      throw error;
    }
  }

  async getPackageWithCache(packageId: string): Promise<any | null> {
    const cacheKey = `package:${packageId}:details`;
    return this.get(cacheKey);
  }

  async setPackageCache(packageId: string, packageData: any): Promise<void> {
    const cacheKey = `package:${packageId}:details`;
    await this.set(cacheKey, packageData, 900); // 15 minutes TTL
  }

  async invalidatePackageCache(packageId: string): Promise<void> {
    const cacheKey = `package:${packageId}:details`;
    await this.delete(cacheKey);
    this.logger.log(`Invalidated package cache for: ${packageId}`);
  }

  async getPackagesListWithCache(): Promise<any[] | null> {
    const cacheKey = 'packages:list:all';
    return this.get<any[]>(cacheKey);
  }

  async setPackagesListCache(packages: any[]): Promise<void> {
    const cacheKey = 'packages:list:all';
    await this.set(cacheKey, packages, 900); // 15 minutes TTL
  }

  // Alias methods for consistency
  async getPackagesList(): Promise<any[] | null> {
    return this.getPackagesListWithCache();
  }

  async setPackagesList(packages: any[]): Promise<void> {
    return this.setPackagesListCache(packages);
  }

  async getPackageBySlug(slug: string): Promise<any | null> {
    const cacheKey = `package:slug:${slug}`;
    return this.get(cacheKey);
  }

  async setPackageBySlug(slug: string, packageData: any): Promise<void> {
    const cacheKey = `package:slug:${slug}`;
    await this.set(cacheKey, packageData, 1800); // 30 minutes TTL
  }

  async getPackageById(id: string): Promise<any | null> {
    return this.getPackageWithCache(id);
  }

  async setPackageById(id: string, packageData: any): Promise<void> {
    return this.setPackageCache(id, packageData);
  }

  async invalidatePackagesListCache(): Promise<void> {
    const cacheKey = 'packages:list:all';
    await this.delete(cacheKey);
    this.logger.log('Invalidated packages list cache');
  }

  async getSubscriptionWithCache(companyId: string): Promise<any | null> {
    const cacheKey = `subscription:${companyId}:current`;
    return this.get(cacheKey);
  }

  async setSubscriptionCache(companyId: string, subscriptionData: any): Promise<void> {
    const cacheKey = `subscription:${companyId}:current`;
    await this.set(cacheKey, subscriptionData, 600); // 10 minutes TTL
  }

  async invalidateSubscriptionCache(companyId: string): Promise<void> {
    const cacheKey = `subscription:${companyId}:current`;
    await this.delete(cacheKey);
    this.logger.log(`Invalidated subscription cache for company: ${companyId}`);
  }

  async getCouponWithCache(couponCode: string): Promise<any | null> {
    const cacheKey = `coupon:${couponCode}:details`;
    return this.get(cacheKey);
  }

  async setCouponCache(couponCode: string, couponData: any): Promise<void> {
    const cacheKey = `coupon:${couponCode}:details`;
    await this.set(cacheKey, couponData, 1800); // 30 minutes TTL
  }

  async invalidateCouponCache(couponCode: string): Promise<void> {
    const cacheKey = `coupon:${couponCode}:details`;
    await this.delete(cacheKey);
    this.logger.log(`Invalidated coupon cache for: ${couponCode}`);
  }

  getMetrics(): CacheMetrics {
    const totalRequests = this.metrics.totalRequests;
    const cacheHits = this.metrics.cacheHits;
    const cacheMisses = this.metrics.cacheMisses;
    const hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;
    const averageResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;

    return {
      hitRate,
      totalRequests,
      cacheHits,
      cacheMisses,
      averageResponseTime,
    };
  }

  async getHealth(): Promise<{ healthy: boolean; message: string }> {
    try {
      await this.redis.ping();
      return {
        healthy: true,
        message: 'Cache is healthy',
      };
    } catch (error) {
      // Provide more specific error messages
      if ((error as any).code === 'ECONNREFUSED') {
        return {
          healthy: false,
          message: 'Cache unavailable - Redis not running',
        };
      } else if ((error as any).code === 'ENOTFOUND') {
        return {
          healthy: false,
          message: 'Cache unavailable - Redis host not found',
        };
      } else {
        this.logger.error('Cache health check failed:', error);
        return {
          healthy: false,
          message: 'Cache is unhealthy',
        };
      }
    }
  }

  // ===================
  // PURCHASE SESSION CACHE
  // ===================

  async setPurchaseSession(sessionId: string, sessionData: any): Promise<void> {
    const key = `purchase:session:${sessionId}`;
    const ttl = 30 * 60; // 30 minutes
    await this.set(key, sessionData, ttl);
  }

  async getPurchaseSession(sessionId: string): Promise<any | null> {
    const key = `purchase:session:${sessionId}`;
    return this.get(key);
  }

  async deletePurchaseSession(sessionId: string): Promise<void> {
    const key = `purchase:session:${sessionId}`;
    await this.delete(key);
  }

  async updatePurchaseSession(sessionId: string, sessionData: any): Promise<void> {
    const key = `purchase:session:${sessionId}`;
    const ttl = 30 * 60; // 30 minutes
    await this.set(key, sessionData, ttl);
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }
} 