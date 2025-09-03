import { Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    return await this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  // Note: reset() method is not available in cache-manager v7
  // Use del() for individual keys or implement custom reset logic if needed
  async clearAll(): Promise<void> {
    // This is a placeholder - implement based on your cache store
    // For Redis, you might want to use FLUSHDB or similar
    console.log('Cache clear requested - implement based on your cache store');
  }
}
