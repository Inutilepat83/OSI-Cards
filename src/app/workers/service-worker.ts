// Conditionally import service worker types
let SwPush: any;
let SwUpdate: any;

async function loadServiceWorkerModule() {
  try {
    const swModule = await import('@angular/service-worker');
    SwPush = swModule.SwPush;
    SwUpdate = swModule.SwUpdate;
    return swModule;
  } catch (error) {
    // Service worker not available
    SwPush = null;
    SwUpdate = null;
    return null;
  }
}

// Initialize the module
loadServiceWorkerModule().catch(() => {
  // Ignore initialization errors
});
import { BehaviorSubject, fromEvent, timer, of } from 'rxjs';
import { switchMap, catchError, filter, takeUntil, tap } from 'rxjs/operators';

export interface CacheStrategy {
  name: string;
  urls: string[];
  strategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate' | 'networkOnly' | 'cacheOnly';
  cacheName?: string;
  maxEntries?: number;
  maxAgeSeconds?: number;
}

export interface SyncTask {
  id: string;
  type: 'card-sync' | 'analytics-sync' | 'settings-sync';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface ServiceWorkerConfig {
  cacheStrategies: CacheStrategy[];
  syncStrategies: string[];
  notificationConfig: {
    enabled: boolean;
    vapidKey?: string;
  };
  updateCheckInterval: number;
  backgroundSyncEnabled: boolean;
}

declare const self: ServiceWorkerGlobalScope;

class ServiceWorkerManager {
  private cacheStrategies = new Map<string, CacheStrategy>();
  private pendingSyncTasks = new Map<string, SyncTask>();
  private isOnline = true;
  private config: ServiceWorkerConfig;

  constructor() {
    this.config = {
      cacheStrategies: [
        {
          name: 'api-cache',
          urls: ['/api/**'],
          strategy: 'networkFirst',
          cacheName: 'api-cache-v1',
          maxEntries: 100,
          maxAgeSeconds: 300 // 5 minutes
        },
        {
          name: 'assets-cache',
          urls: ['/assets/**', '/**/*.{js,css,html,png,jpg,svg,ico}'],
          strategy: 'cacheFirst',
          cacheName: 'assets-cache-v1',
          maxEntries: 200,
          maxAgeSeconds: 86400 // 24 hours
        },
        {
          name: 'cards-cache',
          urls: ['/api/cards/**'],
          strategy: 'staleWhileRevalidate',
          cacheName: 'cards-cache-v1',
          maxEntries: 50,
          maxAgeSeconds: 1800 // 30 minutes
        }
      ],
      syncStrategies: ['card-sync', 'analytics-sync', 'settings-sync'],
      notificationConfig: {
        enabled: true
      },
      updateCheckInterval: 60000, // 1 minute
      backgroundSyncEnabled: true
    };

    this.initializeServiceWorker();
  }

  private initializeServiceWorker(): void {
    // Initialize cache strategies
    this.config.cacheStrategies.forEach(strategy => {
      this.cacheStrategies.set(strategy.name, strategy);
    });

    // Setup event listeners
    self.addEventListener('install', this.handleInstall.bind(this));
    self.addEventListener('activate', this.handleActivate.bind(this));
    self.addEventListener('fetch', this.handleFetch.bind(this));
    self.addEventListener('sync', this.handleBackgroundSync.bind(this));
    self.addEventListener('push', this.handlePushNotification.bind(this));
    self.addEventListener('notificationclick', this.handleNotificationClick.bind(this));
    (self as any).addEventListener('message', this.handleMessage.bind(this));

    // Network status monitoring
    self.addEventListener('online', () => this.handleNetworkChange(true));
    self.addEventListener('offline', () => this.handleNetworkChange(false));
  }

  private async handleInstall(event: ExtendableEvent): Promise<void> {
    console.log('Service Worker installing...');
    
    event.waitUntil(
      this.preCache().then(() => {
        console.log('Service Worker installation complete');
        return self.skipWaiting();
      })
    );
  }

  private async handleActivate(event: ExtendableEvent): Promise<void> {
    console.log('Service Worker activating...');
    
    event.waitUntil(
      Promise.all([
        this.cleanupOldCaches(),
        self.clients.claim()
      ]).then(() => {
        console.log('Service Worker activation complete');
      })
    );
  }

  private handleFetch(event: FetchEvent): void {
    const url = new URL(event.request.url);
    const strategy = this.selectCacheStrategy(event.request);

    if (strategy) {
      event.respondWith(this.executeStrategy(strategy, event.request));
    }
  }

  private async handleBackgroundSync(event: any): Promise<void> {
    console.log('Background sync triggered:', event.tag);

    if (event.tag === 'card-sync') {
      event.waitUntil(this.syncCards());
    } else if (event.tag === 'analytics-sync') {
      event.waitUntil(this.syncAnalytics());
    } else if (event.tag === 'settings-sync') {
      event.waitUntil(this.syncSettings());
    }
  }

  private async handlePushNotification(event: PushEvent): Promise<void> {
    if (!event.data) return;

    try {
      const data = event.data.json();
      const options: NotificationOptions = {
        body: data.body,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        data: data.data,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        tag: data.tag || 'default'
      };

      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (error) {
      console.error('Error handling push notification:', error);
    }
  }

  private handleNotificationClick(event: NotificationEvent): void {
    event.notification.close();

    const data = event.notification.data;
    const action = event.action;

    event.waitUntil(
      this.handleNotificationAction(action, data)
    );
  }

  private handleMessage(event: MessageEvent): void {
    const { type, payload } = event.data;

    switch (type) {
      case 'SYNC_REQUEST':
        this.queueSyncTask(payload);
        break;
      case 'CACHE_UPDATE':
        this.updateCache(payload);
        break;
      case 'CONFIG_UPDATE':
        this.updateConfig(payload);
        break;
      default:
        console.warn('Unknown message type:', type);
    }
  }

  private handleNetworkChange(isOnline: boolean): void {
    this.isOnline = isOnline;
    
    if (isOnline) {
      this.processPendingSyncTasks();
    }

    // Notify clients about network status change
    this.broadcastToClients({
      type: 'NETWORK_STATUS_CHANGE',
      payload: { isOnline }
    });
  }

  private selectCacheStrategy(request: Request): CacheStrategy | null {
    const url = new URL(request.url);
    
    for (const strategy of this.cacheStrategies.values()) {
      for (const pattern of strategy.urls) {
        if (this.matchesPattern(url.pathname, pattern)) {
          return strategy;
        }
      }
    }
    
    return null;
  }

  private matchesPattern(path: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\//g, '\\/');
    
    return new RegExp(`^${regexPattern}$`).test(path);
  }

  private async executeStrategy(strategy: CacheStrategy, request: Request): Promise<Response> {
    const cache = await caches.open(strategy.cacheName || strategy.name);

    switch (strategy.strategy) {
      case 'cacheFirst':
        return this.cacheFirst(cache, request);
      case 'networkFirst':
        return this.networkFirst(cache, request);
      case 'staleWhileRevalidate':
        return this.staleWhileRevalidate(cache, request);
      case 'networkOnly':
        return this.networkOnly(request);
      case 'cacheOnly':
        return this.cacheOnly(cache, request);
      default:
        return fetch(request);
    }
  }

  private async cacheFirst(cache: Cache, request: Request): Promise<Response> {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      throw new Error(`Network error: ${error}`);
    }
  }

  private async networkFirst(cache: Cache, request: Request): Promise<Response> {
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  private async staleWhileRevalidate(cache: Cache, request: Request): Promise<Response> {
    const cached = await cache.match(request);
    
    const networkPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => {
      // Ignore network errors for stale-while-revalidate
    });

    return (cached as Response) || await networkPromise;
  }

  private async networkOnly(request: Request): Promise<Response> {
    return fetch(request);
  }

  private async cacheOnly(cache: Cache, request: Request): Promise<Response> {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw new Error('No cached response available');
  }

  private async preCache(): Promise<void> {
    const cachePromises = this.config.cacheStrategies.map(async strategy => {
      const cache = await caches.open(strategy.cacheName || strategy.name);
      // Pre-cache critical resources here if needed
    });

    await Promise.all(cachePromises);
  }

  private async cleanupOldCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    const currentCaches = new Set(
      this.config.cacheStrategies.map(s => s.cacheName || s.name)
    );

    const deletePromises = cacheNames
      .filter(name => !currentCaches.has(name))
      .map(name => caches.delete(name));

    await Promise.all(deletePromises);
  }

  private queueSyncTask(task: Omit<SyncTask, 'timestamp' | 'retryCount'>): void {
    const syncTask: SyncTask = {
      ...task,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.pendingSyncTasks.set(task.id, syncTask);

    if (this.isOnline) {
      this.processSyncTask(syncTask);
    }
  }

  private async processPendingSyncTasks(): Promise<void> {
    const tasks = Array.from(this.pendingSyncTasks.values());
    
    for (const task of tasks) {
      await this.processSyncTask(task);
    }
  }

  private async processSyncTask(task: SyncTask): Promise<void> {
    try {
      await this.executeSyncTask(task);
      this.pendingSyncTasks.delete(task.id);
    } catch (error) {
      task.retryCount++;
      
      if (task.retryCount >= task.maxRetries) {
        console.error(`Sync task ${task.id} failed after ${task.maxRetries} retries:`, error);
        this.pendingSyncTasks.delete(task.id);
      } else {
        console.warn(`Sync task ${task.id} failed, retry ${task.retryCount}/${task.maxRetries}:`, error);
      }
    }
  }

  private async executeSyncTask(task: SyncTask): Promise<void> {
    switch (task.type) {
      case 'card-sync':
        await this.syncCards();
        break;
      case 'analytics-sync':
        await this.syncAnalytics();
        break;
      case 'settings-sync':
        await this.syncSettings();
        break;
      default:
        throw new Error(`Unknown sync task type: ${task.type}`);
    }
  }

  private async syncCards(): Promise<void> {
    // Implementation for card synchronization
    console.log('Syncing cards...');
  }

  private async syncAnalytics(): Promise<void> {
    // Implementation for analytics synchronization
    console.log('Syncing analytics...');
  }

  private async syncSettings(): Promise<void> {
    // Implementation for settings synchronization
    console.log('Syncing settings...');
  }

  private async handleNotificationAction(action: string, data: any): Promise<void> {
    const windowClients = await self.clients.matchAll({ type: 'window' });
    
    if (windowClients.length > 0) {
      // Focus existing window
      await windowClients[0].focus();
      windowClients[0].postMessage({
        type: 'NOTIFICATION_ACTION',
        payload: { action, data }
      });
    } else {
      // Open new window
      await self.clients.openWindow(`/?action=${action}&data=${encodeURIComponent(JSON.stringify(data))}`);
    }
  }

  private updateCache(payload: any): void {
    // Implementation for cache updates
    console.log('Updating cache:', payload);
  }

  private updateConfig(payload: Partial<ServiceWorkerConfig>): void {
    this.config = { ...this.config, ...payload };
    console.log('Service Worker config updated:', this.config);
  }

  private broadcastToClients(message: any): void {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage(message);
      });
    });
  }
}

// Initialize the service worker
new ServiceWorkerManager();
