import { Injectable, inject } from '@angular/core';
import { Observable, from, of, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap, tap, shareReplay } from 'rxjs/operators';

/**
 * Cached document entry structure
 */
interface DocCacheEntry {
  /** Unique identifier (usually the content hash or page path) */
  id: string;
  /** Rendered HTML content */
  html: string;
  /** Table of contents data */
  toc: TocItem[];
  /** Demo configurations parsed from content */
  demoConfigs: Record<string, unknown>;
  /** Content hash for cache invalidation */
  contentHash: string;
  /** Timestamp when cached */
  timestamp: number;
  /** Version for cache migration */
  version: number;
}

/**
 * Table of contents item
 */
interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Cache statistics
 */
interface CacheStats {
  totalEntries: number;
  totalSize: number;
  oldestEntry: number;
  newestEntry: number;
}

/**
 * Documentation Cache Service
 * 
 * Provides persistent caching for rendered documentation content
 * using IndexedDB. Features:
 * 
 * - Stores rendered HTML and TOC data
 * - Content-hash based invalidation
 * - Automatic cleanup of stale entries
 * - Memory cache layer for instant access
 * - Size monitoring and limits
 * 
 * @example
 * ```typescript
 * const cache = inject(DocCacheService);
 * 
 * // Check cache first
 * cache.get('docs/getting-started', contentHash).subscribe(entry => {
 *   if (entry) {
 *     // Use cached content
 *     this.html = entry.html;
 *     this.toc = entry.toc;
 *   } else {
 *     // Render and cache
 *     const rendered = this.renderMarkdown(content);
 *     cache.set('docs/getting-started', rendered, contentHash);
 *   }
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class DocCacheService {
  private readonly DB_NAME = 'osi-docs-cache';
  private readonly STORE_NAME = 'rendered-docs';
  private readonly DB_VERSION = 1;
  private readonly CACHE_VERSION = 1;
  private readonly MAX_ENTRIES = 100;
  private readonly MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  private db: IDBDatabase | null = null;
  private dbReady$ = new BehaviorSubject<boolean>(false);
  
  /** In-memory cache for instant access */
  private memoryCache = new Map<string, DocCacheEntry>();
  private readonly MAX_MEMORY_ENTRIES = 20;

  constructor() {
    this.initDB();
  }

  /**
   * Initialize the IndexedDB database
   */
  private async initDB(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      console.debug('[DocCache] IndexedDB not available');
      this.dbReady$.next(true); // Allow fallback to memory cache
      return;
    }

    try {
      this.db = await this.openDatabase();
      this.dbReady$.next(true);
      
      // Run cleanup in background
      this.cleanupStaleEntries();
    } catch (error) {
      console.debug('[DocCache] Failed to initialize IndexedDB:', error);
      this.dbReady$.next(true); // Allow fallback to memory cache
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('contentHash', 'contentHash', { unique: false });
        }
      };
    });
  }

  /**
   * Get cached documentation entry
   * 
   * @param pageId - Page identifier (e.g., 'docs/getting-started')
   * @param contentHash - Hash of the source content for validation
   * @returns Cached entry or null if not found/invalid
   */
  get(pageId: string, contentHash: string): Observable<DocCacheEntry | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(pageId);
    if (memoryEntry && memoryEntry.contentHash === contentHash) {
      return of(memoryEntry);
    }

    // Wait for DB to be ready, then check IndexedDB
    return this.dbReady$.pipe(
      switchMap(ready => {
        if (!ready || !this.db) {
          return of(null);
        }
        return this.getFromIndexedDB(pageId, contentHash);
      }),
      tap(entry => {
        // Update memory cache if found
        if (entry) {
          this.addToMemoryCache(pageId, entry);
        }
      }),
      catchError(() => of(null))
    );
  }

  private getFromIndexedDB(pageId: string, contentHash: string): Observable<DocCacheEntry | null> {
    if (!this.db) return of(null);

    return from(new Promise<DocCacheEntry | null>((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(pageId);

        request.onsuccess = () => {
          const entry = request.result as DocCacheEntry | undefined;
          
          // Validate entry
          if (!entry) {
            resolve(null);
            return;
          }

          // Check content hash
          if (entry.contentHash !== contentHash) {
            resolve(null);
            return;
          }

          // Check version
          if (entry.version !== this.CACHE_VERSION) {
            resolve(null);
            return;
          }

          // Check age
          if (Date.now() - entry.timestamp > this.MAX_AGE_MS) {
            resolve(null);
            return;
          }

          resolve(entry);
        };

        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    }));
  }

  /**
   * Cache rendered documentation
   * 
   * @param pageId - Page identifier
   * @param data - Rendered content data
   * @param contentHash - Hash of the source content
   */
  set(
    pageId: string,
    data: { html: string; toc: TocItem[]; demoConfigs: Record<string, unknown> },
    contentHash: string
  ): Observable<boolean> {
    const entry: DocCacheEntry = {
      id: pageId,
      html: data.html,
      toc: data.toc,
      demoConfigs: data.demoConfigs,
      contentHash,
      timestamp: Date.now(),
      version: this.CACHE_VERSION
    };

    // Always update memory cache
    this.addToMemoryCache(pageId, entry);

    // Update IndexedDB
    return this.dbReady$.pipe(
      switchMap(ready => {
        if (!ready || !this.db) {
          return of(true); // Success with memory cache only
        }
        return this.setInIndexedDB(entry);
      }),
      catchError(() => of(false))
    );
  }

  private setInIndexedDB(entry: DocCacheEntry): Observable<boolean> {
    if (!this.db) return of(false);

    return from(new Promise<boolean>((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(entry);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    }));
  }

  /**
   * Delete a cached entry
   */
  delete(pageId: string): Observable<boolean> {
    // Remove from memory cache
    this.memoryCache.delete(pageId);

    if (!this.db) return of(true);

    return from(new Promise<boolean>((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(pageId);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    })).pipe(catchError(() => of(false)));
  }

  /**
   * Clear all cached documentation
   */
  clearAll(): Observable<boolean> {
    // Clear memory cache
    this.memoryCache.clear();

    if (!this.db) return of(true);

    return from(new Promise<boolean>((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    })).pipe(catchError(() => of(false)));
  }

  /**
   * Get cache statistics
   */
  getStats(): Observable<CacheStats> {
    const defaultStats: CacheStats = {
      totalEntries: this.memoryCache.size,
      totalSize: 0,
      oldestEntry: Date.now(),
      newestEntry: 0
    };

    if (!this.db) return of(defaultStats);

    return from(new Promise<CacheStats>((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const entries = request.result as DocCacheEntry[];
          
          let totalSize = 0;
          let oldestEntry = Date.now();
          let newestEntry = 0;

          entries.forEach(entry => {
            totalSize += entry.html.length + JSON.stringify(entry.toc).length;
            oldestEntry = Math.min(oldestEntry, entry.timestamp);
            newestEntry = Math.max(newestEntry, entry.timestamp);
          });

          resolve({
            totalEntries: entries.length,
            totalSize,
            oldestEntry,
            newestEntry
          });
        };

        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    })).pipe(catchError(() => of(defaultStats)));
  }

  /**
   * Preload a page into cache (called during idle time)
   */
  preload(pageId: string, content: string, renderFn: (content: string) => { html: string; toc: TocItem[]; demoConfigs: Record<string, unknown> }): void {
    const contentHash = this.hashContent(content);
    
    // Check if already cached
    this.get(pageId, contentHash).subscribe(entry => {
      if (!entry) {
        // Render and cache during idle time
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => {
            const rendered = renderFn(content);
            this.set(pageId, rendered, contentHash).subscribe();
          });
        } else {
          setTimeout(() => {
            const rendered = renderFn(content);
            this.set(pageId, rendered, contentHash).subscribe();
          }, 100);
        }
      }
    });
  }

  /**
   * Generate a simple hash for content
   */
  hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  private addToMemoryCache(pageId: string, entry: DocCacheEntry): void {
    // Enforce memory cache size limit
    if (this.memoryCache.size >= this.MAX_MEMORY_ENTRIES) {
      // Remove oldest entry
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }
    
    this.memoryCache.set(pageId, entry);
  }

  private cleanupStaleEntries(): void {
    if (!this.db) return;

    const cutoff = Date.now() - this.MAX_AGE_MS;

    try {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor(IDBKeyRange.upperBound(cutoff));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    } catch (error) {
      console.debug('[DocCache] Failed to cleanup stale entries:', error);
    }

    // Also enforce max entries limit
    this.enforceMaxEntries();
  }

  private enforceMaxEntries(): void {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        const count = countRequest.result;
        if (count > this.MAX_ENTRIES) {
          this.removeOldestEntries(count - this.MAX_ENTRIES);
        }
      };
    } catch (error) {
      console.debug('[DocCache] Failed to enforce max entries:', error);
    }
  }

  private removeOldestEntries(count: number): void {
    if (!this.db || count <= 0) return;

    try {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor();
      let removed = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && removed < count) {
          cursor.delete();
          removed++;
          cursor.continue();
        }
      };
    } catch (error) {
      console.debug('[DocCache] Failed to remove oldest entries:', error);
    }
  }
}

