import { Injectable, isDevMode } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

interface CacheEntry {
  data: any;
  timestamp: number;
  url: string;
}

/**
 * IndexedDB-based persistent cache service
 * Provides long-term storage for HTTP responses across browser sessions
 * Note: Cache is disabled in development mode for fresh data on every request
 */
@Injectable({
  providedIn: 'root',
})
export class IndexedDBCacheService {
  private readonly DB_NAME = 'osi-cards-cache';
  private readonly STORE_NAME = 'http-cache';
  private readonly DB_VERSION = 1;
  private db: IDBDatabase | null = null;
  private readonly cacheDisabled = isDevMode(); // Disable cache in dev mode

  /**
   * Initialize IndexedDB database
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Get cached entry from IndexedDB
   * Returns null immediately in dev mode (cache disabled)
   */
  get(url: string): Observable<CacheEntry | null> {
    // Skip cache read in dev mode
    if (this.cacheDisabled) {
      return of(null);
    }
    return from(this.initDB()).pipe(
      map((db) => {
        return new Promise<CacheEntry | null>((resolve, reject) => {
          const transaction = db.transaction([this.STORE_NAME], 'readonly');
          const store = transaction.objectStore(this.STORE_NAME);
          const request = store.get(url);

          request.onsuccess = () => {
            resolve(request.result || null);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      }),
      switchMap((promise) => from(promise)),
      catchError(() => of(null))
    );
  }

  /**
   * Set cached entry in IndexedDB
   * No-op in dev mode (cache disabled)
   */
  set(url: string, data: any, timestamp: number): Observable<boolean> {
    // Skip cache write in dev mode
    if (this.cacheDisabled) {
      return of(true);
    }
    return from(this.initDB()).pipe(
      map((db) => {
        return new Promise<boolean>((resolve, reject) => {
          const transaction = db.transaction([this.STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);
          const entry: CacheEntry = { url, data, timestamp };
          const request = store.put(entry);

          request.onsuccess = () => {
            resolve(true);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      }),
      switchMap((promise) => from(promise)),
      catchError(() => of(false))
    );
  }

  /**
   * Delete cached entry from IndexedDB
   */
  delete(url: string): Observable<boolean> {
    return from(this.initDB()).pipe(
      map((db) => {
        return new Promise<boolean>((resolve, reject) => {
          const transaction = db.transaction([this.STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);
          const request = store.delete(url);

          request.onsuccess = () => {
            resolve(true);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      }),
      switchMap((promise) => from(promise)),
      catchError(() => of(false))
    );
  }

  /**
   * Clear all cached entries older than specified timestamp
   */
  clearOlderThan(timestamp: number): Observable<number> {
    return from(this.initDB()).pipe(
      map((db) => {
        return new Promise<number>((resolve, reject) => {
          const transaction = db.transaction([this.STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);
          const index = store.index('timestamp');
          const request = index.openCursor(IDBKeyRange.upperBound(timestamp));
          let deletedCount = 0;

          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
              cursor.delete();
              deletedCount++;
              cursor.continue();
            } else {
              resolve(deletedCount);
            }
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      }),
      switchMap((promise) => from(promise)),
      catchError(() => of(0))
    );
  }

  /**
   * Clear all cached entries
   */
  clearAll(): Observable<boolean> {
    return from(this.initDB()).pipe(
      map((db) => {
        return new Promise<boolean>((resolve, reject) => {
          const transaction = db.transaction([this.STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.STORE_NAME);
          const request = store.clear();

          request.onsuccess = () => {
            resolve(true);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      }),
      switchMap((promise) => from(promise)),
      catchError(() => of(false))
    );
  }
}
