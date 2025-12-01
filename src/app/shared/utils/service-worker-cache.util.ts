/**
 * Service worker caching utilities
 * Enhance service worker to cache card configurations and assets intelligently
 */

export interface CacheStrategy {
  name: string;
  maxAge: number; // in milliseconds
  maxEntries?: number;
  strategy:
    | 'cache-first'
    | 'network-first'
    | 'stale-while-revalidate'
    | 'network-only'
    | 'cache-only';
}

/**
 * Cache configuration for different resource types
 */
export const CACHE_STRATEGIES: Record<string, CacheStrategy> = {
  'card-configs': {
    name: 'card-configs',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 100,
    strategy: 'stale-while-revalidate',
  },
  assets: {
    name: 'assets',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 500,
    strategy: 'cache-first',
  },
  api: {
    name: 'api',
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50,
    strategy: 'network-first',
  },
};

/**
 * Get cache strategy for a URL
 */
export function getCacheStrategy(url: string): CacheStrategy {
  const defaultStrategy: CacheStrategy = {
    strategy: 'network-first',
    maxAge: 3600000,
    name: 'default',
  };

  if (url.includes('/assets/configs/')) {
    const cardConfigs = CACHE_STRATEGIES['card-configs'];
    if (cardConfigs) {
      return cardConfigs;
    }
    const api = CACHE_STRATEGIES.api;
    return api ?? defaultStrategy;
  }
  if (url.includes('/assets/')) {
    const assets = CACHE_STRATEGIES.assets;
    if (assets) {
      return assets;
    }
    const api = CACHE_STRATEGIES.api;
    return api ?? { strategy: 'cache-first', maxAge: 86400000, name: 'assets-fallback' };
  }
  if (url.includes('/api/')) {
    const api = CACHE_STRATEGIES.api;
    return api ?? defaultStrategy;
  }
  const api = CACHE_STRATEGIES.api;
  return api ?? defaultStrategy; // Default
}

/**
 * Check if cache entry is expired
 */
export function isCacheExpired(timestamp: number, maxAge: number): boolean {
  return Date.now() - timestamp > maxAge;
}

/**
 * Clean expired cache entries
 */
export async function cleanExpiredCacheEntries(cacheName: string, maxAge: number): Promise<number> {
  if (!('caches' in window)) {
    return 0;
  }

  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    let cleaned = 0;

    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const timestamp = new Date(dateHeader).getTime();
          if (isCacheExpired(timestamp, maxAge)) {
            await cache.delete(key);
            cleaned++;
          }
        }
      }
    }

    return cleaned;
  } catch (error) {
    console.error('Failed to clean cache:', error);
    return 0;
  }
}
