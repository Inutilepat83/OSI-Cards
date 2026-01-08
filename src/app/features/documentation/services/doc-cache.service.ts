import { Injectable, isDevMode } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface CachedDocContent {
  html: string;
  toc: { id: string; text: string; level: number }[];
  contentHash: string;
  timestamp: number;
  demoConfigs?: Record<string, unknown>;
}

const DB_NAME = 'osi-docs-cache';
const STORE_NAME = 'rendered-docs';
const DB_VERSION = 1;
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable({
  providedIn: 'root',
})
export class DocCacheService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private readonly cacheDisabled = isDevMode(); // Disable cache in dev mode for fresh content

  constructor() {
    // Skip IndexedDB initialization in dev mode
    if (typeof indexedDB !== 'undefined' && !this.cacheDisabled) {
      this.dbPromise = this.openDatabase();
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'pageId' });
        }
      };
    });
  }

  hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  get(pageId: string, contentHash: string): Observable<CachedDocContent | null> {
    // Skip cache read in dev mode
    if (this.cacheDisabled || !this.dbPromise) {
      return of(null);
    }

    return from(
      this.dbPromise.then((db) => {
        return new Promise<CachedDocContent | null>((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.get(pageId);

          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const result = request.result as (CachedDocContent & { pageId: string }) | undefined;

            if (!result) {
              resolve(null);
              return;
            }

            // Check if content hash matches and cache is not expired
            const isValid =
              result.contentHash === contentHash && Date.now() - result.timestamp < CACHE_TTL;

            resolve(isValid ? result : null);
          };
        });
      })
    ).pipe(catchError(() => of(null)));
  }

  set(
    pageId: string,
    content: Omit<CachedDocContent, 'contentHash' | 'timestamp'>,
    contentHash: string
  ): Observable<void> {
    // Validate pageId exists and is a valid string
    if (!pageId || typeof pageId !== 'string') {
      console.warn('[DocCache] Invalid pageId provided:', pageId);
      return of(undefined);
    }

    // Skip cache write in dev mode
    if (this.cacheDisabled || !this.dbPromise) {
      return of(undefined);
    }

    return from(
      this.dbPromise.then((db) => {
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);

          // Ensure pageId is explicitly set and not overwritten
          // Construct entry explicitly to avoid any property conflicts
          const entry = {
            pageId: String(pageId), // Explicitly ensure it's a string
            contentHash: String(contentHash),
            timestamp: Date.now(),
            html: content.html || '',
            toc: content.toc || [],
            demoConfigs: content.demoConfigs || {},
          };

          // Validate entry has pageId before storing
          if (!entry.pageId) {
            console.warn('[DocCache] Entry missing pageId:', entry);
            resolve(); // Don't reject, just skip
            return;
          }

          const request = store.put(entry);

          request.onerror = () => {
            // Log but don't reject - cache failures are non-critical
            console.warn('[DocCache] Failed to store entry:', request.error);
            resolve(); // Resolve instead of reject to prevent error propagation
          };
          request.onsuccess = () => resolve();
        });
      })
    ).pipe(catchError(() => of(undefined)));
  }

  clear(): Observable<void> {
    if (!this.dbPromise) {
      return of(undefined);
    }

    return from(
      this.dbPromise.then((db) => {
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.clear();

          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      })
    ).pipe(catchError(() => of(undefined)));
  }
}
