import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, fromEvent, merge, of, timer } from 'rxjs';
import { map, startWith, catchError, tap } from 'rxjs/operators';
import { SwUpdate, SwPush } from '@angular/service-worker';
import { LoggingService } from './logging.service';

export interface OfflineQueueItem {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: Date;
  retryCount: number;
  priority: 'low' | 'normal' | 'high';
  maxRetries: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItems: number;
  lastSyncTime: Date | null;
  backgroundSyncEnabled: boolean;
  cacheSize: number;
  storageQuota: number;
}

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: Date;
  expiresAt: Date;
  version: number;
  size: number;
}

@Injectable({
  providedIn: 'root',
})
export class OfflineSupportService {
  private offlineQueue: OfflineQueueItem[] = [];
  private cache: Map<string, CacheEntry> = new Map();
  private backgroundSyncInterval?: number;
  private readonly CACHE_PREFIX = 'osi-cards-cache-';
  private readonly QUEUE_KEY = 'osi-cards-offline-queue';
  private readonly CACHE_KEY = 'osi-cards-cache-index';

  private syncStatus$ = new BehaviorSubject<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingItems: 0,
    lastSyncTime: null,
    backgroundSyncEnabled: false,
    cacheSize: 0,
    storageQuota: 0,
  });

  constructor(
    private http: HttpClient,
    private swUpdate: SwUpdate,
    private swPush: SwPush,
    private logger: LoggingService
  ) {
    this.initializeOfflineDetection();
    this.initializeServiceWorkerUpdates();
    this.initializeBackgroundSync();
    this.loadOfflineQueue();
    this.loadCache();
    this.updateStorageQuota();
  }

  /**
   * Get sync status as observable
   */
  getSyncStatus$(): Observable<SyncStatus> {
    return this.syncStatus$.asObservable();
  }

  /**
   * Get current sync status
   */
  getCurrentSyncStatus(): SyncStatus {
    return this.syncStatus$.value;
  }

  /**
   * Check if application is online
   */
  isOnline(): boolean {
    return this.syncStatus$.value.isOnline;
  }

  /**
   * Queue request for offline execution
   */
  queueRequest(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): void {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: this.generateId(),
      timestamp: new Date(),
      retryCount: 0,
      priority: item.priority || 'normal',
      maxRetries: item.maxRetries || 3,
    };

    this.offlineQueue.push(queueItem);
    this.saveOfflineQueue();
    this.updateSyncStatus();

    // Try to sync immediately if online
    if (this.isOnline()) {
      this.syncPendingRequests();
    }
  }

  /**
   * Sync all pending requests
   */
  async syncPendingRequests(): Promise<void> {
    if (this.syncStatus$.value.isSyncing || !this.isOnline()) {
      return;
    }

    this.updateSyncStatus({ isSyncing: true });

    // Sort by priority (high first)
    const pendingItems = [...this.offlineQueue].sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    for (const item of pendingItems) {
      try {
        await this.executeQueuedRequest(item);
        this.removeFromQueue(item.id);
      } catch (error) {
        this.logger.error('OfflineSupportService', 'Failed to sync request', error);
        item.retryCount++;

        if (item.retryCount >= item.maxRetries) {
          this.removeFromQueue(item.id);
          this.logger.warn(
            'OfflineSupportService',
            `Request failed after ${item.maxRetries} retries, removing from queue`
          );
        }
      }
    }

    this.updateSyncStatus({
      isSyncing: false,
      lastSyncTime: new Date(),
    });
  }

  /**
   * Get offline queue items
   */
  getOfflineQueue(): OfflineQueueItem[] {
    return [...this.offlineQueue];
  }

  /**
   * Clear offline queue
   */
  clearOfflineQueue(): void {
    this.offlineQueue = [];
    this.saveOfflineQueue();
    this.updateSyncStatus();
  }

  /**
   * Cache data for offline use with expiration
   */
  cacheData(key: string, data: any, ttlMinutes: number = 1440): void {
    // 24 hours default
    try {
      const cacheEntry: CacheEntry = {
        key,
        data,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
        version: 1,
        size: this.calculateDataSize(data),
      };

      this.cache.set(key, cacheEntry);
      this.saveCacheEntry(key, cacheEntry);
      this.updateCacheSize();
      this.cleanExpiredCache();
    } catch (error) {
      this.logger.error('OfflineSupportService', 'Failed to cache data', error);
    }
  }

  /**
   * Get cached data
   */
  getCachedData<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key);

      if (entry && entry.expiresAt > new Date()) {
        return entry.data;
      } else if (entry) {
        // Remove expired entry
        this.cache.delete(key);
        this.removeCacheEntry(key);
      }
    } catch (error) {
      this.logger.error('OfflineSupportService', 'Failed to get cached data', error);
    }

    return null;
  }

  /**
   * Check if data is cached and valid
   */
  isCached(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && entry.expiresAt > new Date();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(key: string): void {
    this.cache.delete(key);
    this.removeCacheEntry(key);
    this.updateCacheSize();
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
    this.clearAllCacheEntries();
    this.updateCacheSize();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalEntries: number; totalSize: number; hitRate: number } {
    const totalEntries = this.cache.size;
    const totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);

    // Simple hit rate calculation (would need more tracking for accuracy)
    return { totalEntries, totalSize, hitRate: 0.8 }; // Placeholder
  }

  /**
   * Make HTTP request with offline support and caching
   */
  makeOfflineAwareRequest<T>(
    method: string,
    url: string,
    body?: any,
    headers?: Record<string, string>,
    cacheKey?: string,
    cacheTtl?: number
  ): Observable<T> {
    if (!this.isOnline()) {
      // Try to return cached data if available
      if (cacheKey) {
        const cached = this.getCachedData<T>(cacheKey);
        if (cached !== null) {
          return of(cached);
        }
      }

      // Queue request for later
      this.queueRequest({ url, method, body, headers, priority: 'high', maxRetries: 3 });
      return of(null as any);
    }

    return this.http
      .request<T>(method, url, {
        body,
        headers,
      })
      .pipe(
        tap(response => {
          // Cache successful responses
          if (cacheKey && response) {
            this.cacheData(cacheKey, response, cacheTtl);
          }
        }),
        catchError(error => {
          if (!navigator.onLine) {
            // Try cached data on network error
            if (cacheKey) {
              const cached = this.getCachedData<T>(cacheKey);
              if (cached !== null) {
                return of(cached);
              }
            }

            // Queue request if we went offline during request
            this.queueRequest({ url, method, body, headers, priority: 'high', maxRetries: 3 });
            return of(null as any);
          }
          throw error;
        })
      );
  }

  /**
   * Enable background sync
   */
  enableBackgroundSync(intervalMinutes: number = 5): void {
    this.disableBackgroundSync();

    this.backgroundSyncInterval = window.setInterval(
      () => {
        if (this.isOnline() && this.offlineQueue.length > 0) {
          this.syncPendingRequests();
        }
      },
      intervalMinutes * 60 * 1000
    );

    this.updateSyncStatus({ backgroundSyncEnabled: true });
  }

  /**
   * Disable background sync
   */
  disableBackgroundSync(): void {
    if (this.backgroundSyncInterval) {
      clearInterval(this.backgroundSyncInterval);
      this.backgroundSyncInterval = undefined;
    }
    this.updateSyncStatus({ backgroundSyncEnabled: false });
  }

  /**
   * Force immediate sync
   */
  forceSync(): Promise<void> {
    return this.syncPendingRequests();
  }

  /**
   * Initialize offline/online detection
   */
  private initializeOfflineDetection(): void {
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    merge(online$, offline$)
      .pipe(startWith(navigator.onLine))
      .subscribe(isOnline => {
        this.updateSyncStatus({ isOnline });

        if (isOnline) {
          // Sync pending requests when coming back online
          setTimeout(() => this.syncPendingRequests(), 1000);
        }
      });
  }

  /**
   * Initialize service worker updates
   */
  private initializeServiceWorkerUpdates(): void {
    if (this.swUpdate.isEnabled) {
      // Check for updates every hour
      timer(0, 60 * 60 * 1000).subscribe(() => {
        this.swUpdate.checkForUpdate();
      });

      // Handle available updates
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          if (confirm('A new version is available. Reload to update?')) {
            window.location.reload();
          }
        }
      });

      // Handle unrecoverable state
      this.swUpdate.unrecoverable.subscribe(() => {
        this.logger.error('OfflineSupportService', 'Service worker in unrecoverable state');
      });
    }
  }

  /**
   * Initialize background sync
   */
  private initializeBackgroundSync(): void {
    // Enable background sync by default
    this.enableBackgroundSync();
  }

  /**
   * Execute queued request
   */
  private async executeQueuedRequest(item: OfflineQueueItem): Promise<any> {
    return this.http
      .request(item.method, item.url, {
        body: item.body,
        headers: item.headers,
      })
      .toPromise();
  }

  /**
   * Remove item from queue
   */
  private removeFromQueue(id: string): void {
    this.offlineQueue = this.offlineQueue.filter(item => item.id !== id);
    this.saveOfflineQueue();
    this.updateSyncStatus();
  }

  /**
   * Update sync status
   */
  private updateSyncStatus(updates: Partial<SyncStatus> = {}): void {
    const current = this.syncStatus$.value;
    this.syncStatus$.next({
      ...current,
      ...updates,
      pendingItems: this.offlineQueue.length,
    });
  }

  /**
   * Save offline queue to storage
   */
  private saveOfflineQueue(): void {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.offlineQueue));
    } catch (error) {
      this.logger.error('OfflineSupportService', 'Failed to save offline queue', error);
    }
  }

  /**
   * Load offline queue from storage
   */
  private loadOfflineQueue(): void {
    try {
      const saved = localStorage.getItem(this.QUEUE_KEY);
      if (saved) {
        this.offlineQueue = JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        this.updateSyncStatus();
      }
    } catch (error) {
      this.logger.error('OfflineSupportService', 'Failed to load offline queue', error);
    }
  }

  /**
   * Save cache entry to storage
   */
  private saveCacheEntry(key: string, entry: CacheEntry): void {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${key}`;
      localStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
      this.logger.error('OfflineSupportService', 'Failed to save cache entry', error);
    }
  }

  /**
   * Remove cache entry from storage
   */
  private removeCacheEntry(key: string): void {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${key}`;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      this.logger.error('OfflineSupportService', 'Failed to remove cache entry', error);
    }
  }

  /**
   * Clear all cache entries from storage
   */
  private clearAllCacheEntries(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      this.logger.error('OfflineSupportService', 'Failed to clear cache entries', error);
    }
  }

  /**
   * Load cache from storage
   */
  private loadCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const cacheKey = key.replace(this.CACHE_PREFIX, '');
          const entry = JSON.parse(localStorage.getItem(key)!);
          entry.timestamp = new Date(entry.timestamp);
          entry.expiresAt = new Date(entry.expiresAt);
          this.cache.set(cacheKey, entry);
        }
      });
      this.updateCacheSize();
    } catch (error) {
      this.logger.error('OfflineSupportService', 'Failed to load cache', error);
    }
  }

  /**
   * Update cache size
   */
  private updateCacheSize(): void {
    const totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    this.updateSyncStatus({ cacheSize: totalSize });
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.expiresAt <= now) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.removeCacheEntry(key);
    });

    if (expiredKeys.length > 0) {
      this.updateCacheSize();
    }
  }

  /**
   * Update storage quota information
   */
  private async updateStorageQuota(): Promise<void> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        this.updateSyncStatus({
          storageQuota: estimate.quota || 0,
        });
      }
    } catch (error) {
      this.logger.error('OfflineSupportService', 'Failed to get storage quota', error);
    }
  }

  /**
   * Calculate data size in bytes
   */
  private calculateDataSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
