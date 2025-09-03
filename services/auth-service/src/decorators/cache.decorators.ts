import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key_metadata';
export const CACHE_TTL_METADATA = 'cache_ttl_metadata';
export const CACHE_SKIP_METADATA = 'cache_skip_metadata';

export interface CacheOptions {
  key?: string;
  ttl?: number;
  skip?: boolean;
}

export const CacheKey = (key: string) => SetMetadata(CACHE_KEY_METADATA, key);
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);
export const SkipCache = () => SetMetadata(CACHE_SKIP_METADATA, true);

export const Cache = (options: CacheOptions) => {
  const metadata = [];
  
  if (options.key) {
    metadata.push(SetMetadata(CACHE_KEY_METADATA, options.key));
  }
  
  if (options.ttl) {
    metadata.push(SetMetadata(CACHE_TTL_METADATA, options.ttl));
  }
  
  if (options.skip) {
    metadata.push(SetMetadata(CACHE_SKIP_METADATA, true));
  }
  
  return metadata;
}; 