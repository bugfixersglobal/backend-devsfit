import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../services/cache.service';

@Injectable()
export class CacheGuard implements CanActivate {
  private readonly logger = new Logger(CacheGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    // Invalidate cache for non-GET requests
    if (method !== 'GET') {
      await this.invalidateUserCache(user?.id);
    }

    return true;
  }

  private async invalidateUserCache(userId?: string): Promise<void> {
    if (!userId) return;

    try {
      // Invalidate user-specific cache patterns
      const patterns = [
        `user:${userId}:profile`,
        `user:${userId}:*`,
        `cache:*:${userId}`,
      ];

      for (const pattern of patterns) {
        await this.cacheService.invalidatePattern(pattern);
      }

      this.logger.debug(`Cache invalidated for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache for user: ${userId}`, error);
    }
  }
} 