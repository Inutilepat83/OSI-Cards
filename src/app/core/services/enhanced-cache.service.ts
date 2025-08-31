import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ICacheService } from '../interfaces/app.interfaces';
import { CacheItem } from '../types/common.types';
import { LoggerService } from './enhanced-logging.service';

@Injectable({
  providedIn: 'root',
})
export class EnhancedCacheService implements ICacheService {
  private cache = new Map<string, CacheItem>();
  private cacheHits = 0;
  private cacheRequests = 0;
  private readonly logger = this.loggerService.createChildLogger('Cache');
  private readonly maxSize: number = 100;
  private readonly defaultTtl: number = 5 * 60 * 1000; // 5 minutes

  constructor(private loggerService: LoggerService) {
    this.startCleanupTimer();
  }

  get<T>(key: string): T | null {
    this.cacheRequests++;

    const item = this.cache.get(key);
    if (!item) {
      this.logger.debug(`Cache miss for key: ${key}`);
      return null;
    }

    if (this.isExpired(item)) {
      this.logger.debug(`Cache item expired for key: ${key}`);
      this.cache.delete(key);
      return null;
    }

    this.cacheHits++;
    item.accessCount++;
    this.logger.debug(`Cache hit for key: ${key}`);
    return item.value as T;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const expirationTime = ttl || this.defaultTtl;
    const expiresAt = new Date(Date.now() + expirationTime);

    const item: CacheItem<T> = {
      key,
      value,
      expiresAt,
      createdAt: new Date(),
      accessCount: 0,
    };

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, item);
    this.logger.debug(`Cache item set for key: ${key}, expires at: ${expiresAt}`);
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Cache item deleted for key: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.info(`Cache cleared, removed ${size} items`);
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (this.isExpired(item)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): CacheStats {
    const hitRate = this.cacheRequests > 0 ? (this.cacheHits / this.cacheRequests) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.cacheHits,
      requests: this.cacheRequests,
      hitRate: Math.round(hitRate * 100) / 100,
      items: this.getCacheItems(),
    };
  }

  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    this.logger.info(`Invalidated ${invalidated} cache items matching pattern: ${pattern}`);
    return invalidated;
  }

  private isExpired(item: CacheItem): boolean {
    return new Date() > item.expiresAt;
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey: string | null = null;
    let lruAccessCount = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < lruAccessCount) {
        lruAccessCount = item.accessCount;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.logger.debug(`Evicted LRU cache item: ${lruKey}`);
    }
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredItems();
    }, 60000); // Cleanup every minute
  }

  private cleanupExpiredItems(): void {
    let expiredCount = 0;
    const now = new Date();

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.debug(`Cleaned up ${expiredCount} expired cache items`);
    }
  }

  private getCacheItems(): CacheItemInfo[] {
    return Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      size: this.estimateSize(item.value),
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
      accessCount: item.accessCount,
      isExpired: this.isExpired(item),
    }));
  }

  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 0;
    }
  }
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  requests: number;
  hitRate: number;
  items: CacheItemInfo[];
}

export interface CacheItemInfo {
  key: string;
  size: number;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  isExpired: boolean;
}

// Configuration service with validation
@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  private config$ = new BehaviorSubject<AppConfiguration | null>(null);
  private readonly logger = this.loggerService.createChildLogger('Config');

  constructor(
    private loggerService: LoggerService,
    private cacheService: EnhancedCacheService
  ) {
    this.loadConfiguration();
  }

  getConfig(): Observable<AppConfiguration | null> {
    return this.config$.asObservable();
  }

  getConfigValue<T>(path: string, defaultValue?: T): T | undefined {
    const config = this.config$.value;
    if (!config) return defaultValue;

    return this.getNestedValue(config, path) ?? defaultValue;
  }

  updateConfig(updates: Partial<AppConfiguration>): void {
    const currentConfig = this.config$.value;
    if (!currentConfig) {
      this.logger.error('Cannot update config - no config loaded');
      return;
    }

    const newConfig = { ...currentConfig, ...updates };

    if (this.validateConfiguration(newConfig)) {
      this.config$.next(newConfig);
      this.saveConfiguration(newConfig);
      this.logger.info('Configuration updated successfully');
    } else {
      this.logger.error('Configuration validation failed');
    }
  }

  resetToDefaults(): void {
    const defaultConfig = this.getDefaultConfiguration();
    this.config$.next(defaultConfig);
    this.saveConfiguration(defaultConfig);
    this.logger.info('Configuration reset to defaults');
  }

  private loadConfiguration(): void {
    try {
      // Try to load from cache first
      let config = this.cacheService.get<AppConfiguration>('app-config');

      if (!config) {
        // Load from localStorage as fallback
        const stored = localStorage.getItem('osiCards.config');
        if (stored) {
          config = JSON.parse(stored);
          this.cacheService.set('app-config', config, 30 * 60 * 1000); // 30 minutes
        }
      }

      if (!config || !this.validateConfiguration(config)) {
        config = this.getDefaultConfiguration();
        this.logger.info('Using default configuration');
      }

      this.config$.next(config);
      this.logger.info('Configuration loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load configuration', error);
      this.config$.next(this.getDefaultConfiguration());
    }
  }

  private saveConfiguration(config: AppConfiguration): void {
    try {
      localStorage.setItem('osiCards.config', JSON.stringify(config));
      this.cacheService.set('app-config', config, 30 * 60 * 1000);
    } catch (error) {
      this.logger.error('Failed to save configuration', error);
    }
  }

  private validateConfiguration(config: any): config is AppConfiguration {
    // Basic validation
    return (
      config &&
      typeof config === 'object' &&
      config.api &&
      config.ui &&
      config.features &&
      typeof config.api.baseUrl === 'string' &&
      typeof config.ui.theme === 'string'
    );
  }

  private getDefaultConfiguration(): AppConfiguration {
    return {
      api: {
        baseUrl: 'https://api.osicards.com',
        timeout: 30000,
        retries: 3,
        retryDelay: 1000,
      },
      ui: {
        theme: 'auto',
        animations: true,
        transitions: true,
        language: 'en',
      },
      features: {
        tiltEffects: true,
        particleSystem: true,
        analytics: true,
        errorReporting: true,
        darkMode: true,
        exportFeatures: true,
        advancedCharts: false,
        realTimeUpdates: false,
        cloudSync: false,
        aiSuggestions: false,
      },
      performance: {
        enablePerformanceMonitoring: true,
        enableMemoryMonitoring: false,
        lazyLoadThreshold: 200,
        cacheSize: 100,
      },
      security: {
        enableCSP: true,
        enableHSTS: true,
        rateLimiting: true,
        sanitizeInputs: true,
        logSecurityEvents: true,
      },
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

export interface AppConfiguration {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
    retryDelay: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    animations: boolean;
    transitions: boolean;
    language: string;
  };
  features: {
    tiltEffects: boolean;
    particleSystem: boolean;
    analytics: boolean;
    errorReporting: boolean;
    darkMode: boolean;
    exportFeatures: boolean;
    advancedCharts: boolean;
    realTimeUpdates: boolean;
    cloudSync: boolean;
    aiSuggestions: boolean;
  };
  performance: {
    enablePerformanceMonitoring: boolean;
    enableMemoryMonitoring: boolean;
    lazyLoadThreshold: number;
    cacheSize: number;
  };
  security: {
    enableCSP: boolean;
    enableHSTS: boolean;
    rateLimiting: boolean;
    sanitizeInputs: boolean;
    logSecurityEvents: boolean;
  };
}
