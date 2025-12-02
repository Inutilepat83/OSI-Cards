import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Offline storage configuration
 */
export interface OfflineStorageConfig {
  /** Database name */
  dbName?: string;
  /** Database version */
  dbVersion?: number;
  /** Store name for cards */
  storeName?: string;
}

/**
 * Stored card data
 */
export interface StoredCard {
  /** Card ID */
  id: string;
  /** Card data */
  data: unknown;
  /** Timestamp when stored */
  timestamp: number;
  /** Expiry timestamp */
  expires?: number;
  /** Whether card is synced with server */
  synced: boolean;
}

/**
 * Offline Storage Service
 *
 * Provides IndexedDB-based offline storage for cards.
 * Enables PWA functionality with offline card viewing.
 *
 * @example
 * ```typescript
 * const offline = inject(OfflineStorageService);
 *
 * // Store a card
 * await offline.storeCard('card-123', cardData);
 *
 * // Retrieve when offline
 * const card = await offline.getCard('card-123');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class OfflineStorageService {
  private readonly document = inject(DOCUMENT);
  private db: IDBDatabase | null = null;
  private readonly config: Required<OfflineStorageConfig> = {
    dbName: 'osi-cards-offline',
    dbVersion: 1,
    storeName: 'cards'
  };

  /**
   * Initialize the database
   */
  async init(config?: OfflineStorageConfig): Promise<void> {
    if (config) {
      Object.assign(this.config, config);
    }

    if (!this.isIndexedDBAvailable()) {
      console.warn('IndexedDB not available');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const store = db.createObjectStore(this.config.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }

  /**
   * Store a card for offline access
   */
  async storeCard(id: string, data: unknown, expiresIn?: number): Promise<void> {
    await this.ensureDb();

    const storedCard: StoredCard = {
      id,
      data,
      timestamp: Date.now(),
      expires: expiresIn ? Date.now() + expiresIn : undefined,
      synced: true
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.put(storedCard);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store card'));
    });
  }

  /**
   * Get a card from offline storage
   */
  async getCard(id: string): Promise<StoredCard | null> {
    await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as StoredCard | undefined;

        // Check if expired
        if (result?.expires && Date.now() > result.expires) {
          this.deleteCard(id);
          resolve(null);
          return;
        }

        resolve(result || null);
      };
      request.onerror = () => reject(new Error('Failed to get card'));
    });
  }

  /**
   * Get all stored cards
   */
  async getAllCards(): Promise<StoredCard[]> {
    await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as StoredCard[];
        // Filter out expired cards
        const now = Date.now();
        const valid = results.filter(card => !card.expires || card.expires > now);
        resolve(valid);
      };
      request.onerror = () => reject(new Error('Failed to get all cards'));
    });
  }

  /**
   * Delete a card from storage
   */
  async deleteCard(id: string): Promise<void> {
    await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete card'));
    });
  }

  /**
   * Clear all stored cards
   */
  async clearAll(): Promise<void> {
    await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear storage'));
    });
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{ count: number; totalSize: number }> {
    const cards = await this.getAllCards();
    const totalSize = new Blob([JSON.stringify(cards)]).size;

    return {
      count: cards.length,
      totalSize
    };
  }

  /**
   * Check if a card exists
   */
  async hasCard(id: string): Promise<boolean> {
    const card = await this.getCard(id);
    return card !== null;
  }

  /**
   * Mark a card as needing sync
   */
  async markForSync(id: string): Promise<void> {
    const card = await this.getCard(id);
    if (card) {
      card.synced = false;
      await this.storeCard(id, card.data);
    }
  }

  /**
   * Get cards that need syncing
   */
  async getUnsyncedCards(): Promise<StoredCard[]> {
    const cards = await this.getAllCards();
    return cards.filter(card => !card.synced);
  }

  /**
   * Clean up expired cards
   */
  async cleanup(): Promise<number> {
    const cards = await this.getAllCards();
    const now = Date.now();
    let deleted = 0;

    for (const card of cards) {
      if (card.expires && card.expires < now) {
        await this.deleteCard(card.id);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Check if IndexedDB is available
   */
  private isIndexedDBAvailable(): boolean {
    try {
      return typeof indexedDB !== 'undefined';
    } catch {
      return false;
    }
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDb(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not available');
    }
  }
}



