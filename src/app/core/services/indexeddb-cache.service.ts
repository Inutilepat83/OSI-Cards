/**
 * IndexedDB Cache Service
 * Provides persistent caching using IndexedDB for HTTP responses
 */

import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface CacheEntry {
  data: any;
  timestamp: number;
  version?: string;
}

@Injectable({
  providedIn: 'root',
})
export class IndexedDBCacheService {
  private readonly DB_NAME = 'osi-cards-cache';
  private readonly STORE_NAME = 'http-cache';
  private readonly DB_VERSION = 1;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.initDB();
  }

  /**
   * Initialize IndexedDB database
   */
  private initDB(): Promise<IDBDatabase> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      // Check if IndexedDB is available
      if (!('indexedDB' in window)) {
        console.warn('IndexedDB is not available in this browser');
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.warn('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get cached value from IndexedDB
   */
  get(key: string): Observable<CacheEntry | null> {
    return from(
      this.initDB()
        .then((db) => {
          return new Promise<CacheEntry | null>((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => {
              const result = request.result;
              if (result) {
                // Extract data, timestamp, and version from stored entry
                resolve({
                  data: result.data,
                  timestamp: result.timestamp,
                  version: result.version,
                });
              } else {
                resolve(null);
              }
            };

            request.onerror = () => {
              reject(request.error);
            };
          });
        })
        .catch(() => null)
    ).pipe(catchError(() => of(null)));
  }

  /**
   * Set cached value in IndexedDB
   * @param key Cache key
   * @param value Data to cache
   * @param timestamp Timestamp when data was cached
   * @param version Optional version string (e.g., "1.5.40") for cache invalidation
   */
  set(key: string, value: any, timestamp: number, version?: string): Observable<void> {
    return from(
      this.initDB()
        .then((db) => {
          return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const entry: CacheEntry & { key: string } = {
              key,
              data: value,
              timestamp,
              ...(version && { version }),
            };
            const request = store.put(entry);

            request.onsuccess = () => {
              resolve();
            };

            request.onerror = () => {
              reject(request.error);
            };
          });
        })
        .catch(() => undefined)
    ).pipe(
      catchError(() => {
        // Silently fail - in-memory cache is sufficient
        return of(undefined);
      })
    );
  }

  /**
   * Delete cached value from IndexedDB
   */
  delete(key: string): Observable<void> {
    return from(
      this.initDB()
        .then((db) => {
          return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.delete(key);

            request.onsuccess = () => {
              resolve();
            };

            request.onerror = () => {
              reject(request.error);
            };
          });
        })
        .catch(() => undefined)
    ).pipe(
      catchError(() => {
        return of(undefined);
      })
    );
  }

  /**
   * Clear all cached entries
   */
  clear(): Observable<void> {
    return from(
      this.initDB()
        .then((db) => {
          return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
              resolve();
            };

            request.onerror = () => {
              reject(request.error);
            };
          });
        })
        .catch(() => undefined)
    ).pipe(
      catchError(() => {
        return of(undefined);
      })
    );
  }
}
