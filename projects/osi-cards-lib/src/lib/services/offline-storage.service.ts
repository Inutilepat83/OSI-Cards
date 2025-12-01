/**
 * Offline-First Storage Service (Improvement Plan Point #29)
 * 
 * Provides IndexedDB-based persistence for cards with background sync
 * capabilities. Enables offline-first architecture for OSI Cards.
 * 
 * @example
 * ```typescript
 * import { OfflineStorageService } from 'osi-cards-lib';
 * 
 * const storage = inject(OfflineStorageService);
 * 
 * // Save a card
 * await storage.saveCard(card);
 * 
 * // Get a card
 * const card = await storage.getCard(cardId);
 * 
 * // Get all cards
 * const cards = await storage.getAllCards();
 * 
 * // Sync with server
 * await storage.syncWithServer();
 * ```
 */

import { 
  Injectable, 
  InjectionToken, 
  inject, 
  PLATFORM_ID,
  DestroyRef,
  signal,
  Signal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AICardConfig } from '../models';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Offline storage configuration
 */
export interface OfflineStorageConfig {
  /** Database name */
  dbName: string;
  /** Database version */
  dbVersion: number;
  /** Store name for cards */
  cardStoreName: string;
  /** Store name for sync queue */
  syncQueueStoreName: string;
  /** Enable background sync */
  enableBackgroundSync: boolean;
  /** Sync interval (ms) */
  syncInterval: number;
  /** Max sync retries */
  maxSyncRetries: number;
  /** Cache expiry time (ms) */
  cacheExpiry: number;
  /** Debug logging */
  debug: boolean;
}

/**
 * Default offline storage configuration
 */
export const DEFAULT_OFFLINE_CONFIG: OfflineStorageConfig = {
  dbName: 'osi-cards-db',
  dbVersion: 1,
  cardStoreName: 'cards',
  syncQueueStoreName: 'sync-queue',
  enableBackgroundSync: true,
  syncInterval: 30000,
  maxSyncRetries: 3,
  cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  debug: false
};

/**
 * Injection token for offline storage configuration
 */
export const OSI_OFFLINE_CONFIG = new InjectionToken<OfflineStorageConfig>(
  'OSI_OFFLINE_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULT_OFFLINE_CONFIG
  }
);

// ============================================================================
// TYPES
// ============================================================================

/**
 * Stored card record
 */
export interface StoredCard {
  id: string;
  card: AICardConfig;
  createdAt: number;
  updatedAt: number;
  syncedAt: number | null;
  version: number;
  dirty: boolean;
}

/**
 * Sync queue item
 */
export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  cardId: string;
  data?: AICardConfig;
  createdAt: number;
  retries: number;
  lastError?: string;
}

/**
 * Sync status
 */
export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: number | null;
  pendingCount: number;
  errorCount: number;
}

// ============================================================================
// INDEXEDDB HELPER
// ============================================================================

/**
 * IndexedDB wrapper for type-safe operations
 */
class IndexedDBStore<T> {
  private db: IDBDatabase | null = null;
  
  constructor(
    private readonly dbName: string,
    private readonly dbVersion: number,
    private readonly storeName: string,
    private readonly keyPath: string = 'id'
  ) {}
  
  /**
   * Open the database
   */
  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create cards store
        if (!db.objectStoreNames.contains('cards')) {
          const cardsStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardsStore.createIndex('updatedAt', 'updatedAt');
          cardsStore.createIndex('dirty', 'dirty');
        }
        
        // Create sync queue store
        if (!db.objectStoreNames.contains('sync-queue')) {
          const syncStore = db.createObjectStore('sync-queue', { keyPath: 'id' });
          syncStore.createIndex('createdAt', 'createdAt');
          syncStore.createIndex('cardId', 'cardId');
        }
      };
    });
  }
  
  /**
   * Get a record by key
   */
  async get(key: string): Promise<T | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
  
  /**
   * Get all records
   */
  async getAll(): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
  
  /**
   * Get records by index
   */
  async getByIndex(indexName: string, value: IDBValidKey): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
  
  /**
   * Put a record
   */
  async put(record: T): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(record);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  /**
   * Delete a record
   */
  async delete(key: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  /**
   * Clear all records
   */
  async clear(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  /**
   * Count records
   */
  async count(): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.count();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
  
  /**
   * Close the database
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// ============================================================================
// OFFLINE STORAGE SERVICE
// ============================================================================

/**
 * Offline Storage Service
 * 
 * Provides IndexedDB-based persistence for cards with sync capabilities.
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private readonly config = inject(OSI_OFFLINE_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  
  private cardStore: IndexedDBStore<StoredCard> | null = null;
  private syncStore: IndexedDBStore<SyncQueueItem> | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  
  private readonly syncStatusSubject = new BehaviorSubject<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncAt: null,
    pendingCount: 0,
    errorCount: 0
  });
  
  private readonly isOnlineSignal = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);
  private readonly isSyncingSignal = signal(false);
  private readonly pendingCountSignal = signal(0);
  
  /** Observable of sync status */
  readonly syncStatus$: Observable<SyncStatus> = this.syncStatusSubject.asObservable();
  
  /** Signal indicating online status */
  readonly isOnline: Signal<boolean> = this.isOnlineSignal.asReadonly();
  
  /** Signal indicating sync in progress */
  readonly isSyncing: Signal<boolean> = this.isSyncingSignal.asReadonly();
  
  /** Signal with pending sync count */
  readonly pendingCount: Signal<number> = this.pendingCountSignal.asReadonly();
  
  /**
   * Check if IndexedDB is supported
   */
  get isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 
           typeof indexedDB !== 'undefined';
  }
  
  /**
   * Initialize the storage
   */
  async initialize(): Promise<void> {
    if (!this.isSupported) return;
    
    this.cardStore = new IndexedDBStore<StoredCard>(
      this.config.dbName,
      this.config.dbVersion,
      this.config.cardStoreName
    );
    
    this.syncStore = new IndexedDBStore<SyncQueueItem>(
      this.config.dbName,
      this.config.dbVersion,
      this.config.syncQueueStoreName
    );
    
    await this.cardStore.open();
    await this.syncStore.open();
    
    // Setup online/offline listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
    
    // Start background sync
    if (this.config.enableBackgroundSync) {
      this.startBackgroundSync();
    }
    
    // Update pending count
    await this.updatePendingCount();
    
    this.destroyRef.onDestroy(() => {
      this.stopBackgroundSync();
      this.cardStore?.close();
      this.syncStore?.close();
    });
  }
  
  // ============================================================================
  // CARD OPERATIONS
  // ============================================================================
  
  /**
   * Save a card to local storage
   */
  async saveCard(card: AICardConfig): Promise<void> {
    if (!this.cardStore) {
      throw new Error('Storage not initialized');
    }
    
    const id = card.id ?? this.generateId();
    const now = Date.now();
    
    const existing = await this.cardStore.get(id);
    
    const storedCard: StoredCard = {
      id,
      card: { ...card, id },
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      syncedAt: null,
      version: (existing?.version ?? 0) + 1,
      dirty: true
    };
    
    await this.cardStore.put(storedCard);
    
    // Queue for sync
    await this.queueSync(
      existing ? 'update' : 'create',
      id,
      storedCard.card
    );
    
    if (this.config.debug) {
      console.log('[OfflineStorage] Card saved:', id);
    }
  }
  
  /**
   * Get a card by ID
   */
  async getCard(id: string): Promise<AICardConfig | null> {
    if (!this.cardStore) return null;
    
    const stored = await this.cardStore.get(id);
    return stored?.card ?? null;
  }
  
  /**
   * Get all cards
   */
  async getAllCards(): Promise<AICardConfig[]> {
    if (!this.cardStore) return [];
    
    const stored = await this.cardStore.getAll();
    return stored.map(s => s.card);
  }
  
  /**
   * Get cards that need syncing
   */
  async getDirtyCards(): Promise<StoredCard[]> {
    if (!this.cardStore) return [];
    return this.cardStore.getByIndex('dirty', 1) as Promise<StoredCard[]>;
  }
  
  /**
   * Delete a card
   */
  async deleteCard(id: string): Promise<void> {
    if (!this.cardStore) return;
    
    await this.cardStore.delete(id);
    await this.queueSync('delete', id);
    
    if (this.config.debug) {
      console.log('[OfflineStorage] Card deleted:', id);
    }
  }
  
  /**
   * Clear all cards
   */
  async clearAll(): Promise<void> {
    if (!this.cardStore) return;
    await this.cardStore.clear();
    await this.syncStore?.clear();
    await this.updatePendingCount();
  }
  
  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================
  
  /**
   * Queue a sync operation
   */
  private async queueSync(
    type: 'create' | 'update' | 'delete',
    cardId: string,
    data?: AICardConfig
  ): Promise<void> {
    if (!this.syncStore) return;
    
    const item: SyncQueueItem = {
      id: this.generateId(),
      type,
      cardId,
      data,
      createdAt: Date.now(),
      retries: 0
    };
    
    await this.syncStore.put(item);
    await this.updatePendingCount();
  }
  
  /**
   * Process sync queue
   */
  async syncWithServer(syncFn?: (item: SyncQueueItem) => Promise<void>): Promise<void> {
    if (!this.syncStore || !this.isOnlineSignal()) return;
    
    this.isSyncingSignal.set(true);
    this.updateSyncStatus();
    
    try {
      const queue = await this.syncStore.getAll();
      let errorCount = 0;
      
      for (const item of queue) {
        try {
          if (syncFn) {
            await syncFn(item);
          } else {
            // Default: just mark as synced (no actual server call)
            if (this.config.debug) {
              console.log('[OfflineStorage] Would sync:', item);
            }
          }
          
          // Remove from queue on success
          await this.syncStore.delete(item.id);
          
          // Mark card as synced
          if (item.type !== 'delete' && this.cardStore) {
            const stored = await this.cardStore.get(item.cardId);
            if (stored) {
              stored.dirty = false;
              stored.syncedAt = Date.now();
              await this.cardStore.put(stored);
            }
          }
        } catch (error) {
          errorCount++;
          
          // Update retry count
          item.retries++;
          item.lastError = error instanceof Error ? error.message : String(error);
          
          if (item.retries >= this.config.maxSyncRetries) {
            // Move to dead letter queue or remove
            await this.syncStore.delete(item.id);
            console.error('[OfflineStorage] Sync failed after max retries:', item);
          } else {
            await this.syncStore.put(item);
          }
        }
      }
      
      this.syncStatusSubject.next({
        ...this.syncStatusSubject.value,
        lastSyncAt: Date.now(),
        errorCount
      });
      
    } finally {
      this.isSyncingSignal.set(false);
      await this.updatePendingCount();
      this.updateSyncStatus();
    }
  }
  
  // ============================================================================
  // BACKGROUND SYNC
  // ============================================================================
  
  /**
   * Start background sync
   */
  private startBackgroundSync(): void {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(() => {
      if (this.isOnlineSignal() && !this.isSyncingSignal()) {
        this.syncWithServer();
      }
    }, this.config.syncInterval);
  }
  
  /**
   * Stop background sync
   */
  private stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  // ============================================================================
  // HELPERS
  // ============================================================================
  
  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Handle coming online
   */
  private handleOnline(): void {
    this.isOnlineSignal.set(true);
    this.updateSyncStatus();
    
    if (this.config.debug) {
      console.log('[OfflineStorage] Online - triggering sync');
    }
    
    // Trigger sync when coming online
    this.syncWithServer();
  }
  
  /**
   * Handle going offline
   */
  private handleOffline(): void {
    this.isOnlineSignal.set(false);
    this.updateSyncStatus();
    
    if (this.config.debug) {
      console.log('[OfflineStorage] Offline');
    }
  }
  
  /**
   * Update pending count
   */
  private async updatePendingCount(): Promise<void> {
    if (!this.syncStore) return;
    const count = await this.syncStore.count();
    this.pendingCountSignal.set(count);
    this.updateSyncStatus();
  }
  
  /**
   * Update sync status
   */
  private updateSyncStatus(): void {
    this.syncStatusSubject.next({
      isOnline: this.isOnlineSignal(),
      isSyncing: this.isSyncingSignal(),
      lastSyncAt: this.syncStatusSubject.value.lastSyncAt,
      pendingCount: this.pendingCountSignal(),
      errorCount: this.syncStatusSubject.value.errorCount
    });
  }
  
  /**
   * Clean expired cached cards
   */
  async cleanExpiredCache(): Promise<number> {
    if (!this.cardStore) return 0;
    
    const now = Date.now();
    const cards = await this.cardStore.getAll();
    let cleaned = 0;
    
    for (const card of cards) {
      if (!card.dirty && card.syncedAt && 
          (now - card.syncedAt) > this.config.cacheExpiry) {
        await this.cardStore.delete(card.id);
        cleaned++;
      }
    }
    
    if (this.config.debug && cleaned > 0) {
      console.log(`[OfflineStorage] Cleaned ${cleaned} expired cards`);
    }
    
    return cleaned;
  }
}

// All types and constants are exported inline above

