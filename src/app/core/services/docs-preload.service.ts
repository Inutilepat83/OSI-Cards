import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DOCUMENTATION_ITEMS } from '../../features/documentation/documentation.config';
import { DocCacheService } from '../../features/documentation/services/doc-cache.service';

/**
 * Service to preload all documentation files at app startup
 * Ensures instant access when navigating to documentation pages
 */
@Injectable({
  providedIn: 'root',
})
export class DocsPreloadService {
  private readonly http = inject(HttpClient);
  private readonly docCache = inject(DocCacheService);

  // In-memory cache shared across the app
  private readonly contentCache = new Map<string, string>();

  /**
   * All markdown files to preload
   * Only preload files from DOCUMENTATION_ITEMS that actually exist
   * Other files can be added back when they are actually created
   */
  private readonly allMarkdownFiles: { id: string; path: string }[] = [
    // Only preload files from DOCUMENTATION_ITEMS that actually exist
    ...DOCUMENTATION_ITEMS.map((doc) => ({ id: doc.id, path: doc.path })),
    // Note: Removed hardcoded index.md files that don't exist
    // These can be added back when the files are actually created
  ];

  /**
   * Preload all documentation files
   * Non-blocking - runs in background
   */
  preloadAll(): void {
    const loadPromises = this.allMarkdownFiles.map((doc) => {
      // Check in-memory cache first
      if (this.contentCache.has(doc.id)) {
        return of(null);
      }

      // Check IndexedDB cache
      return this.docCache.get(doc.id, '').pipe(
        switchMap((cached) => {
          if (cached?.html) {
            // Store in memory cache for instant access
            // Note: html field contains markdown content
            this.contentCache.set(doc.id, cached.html);
            return of(null);
          }

          // Fetch from network and cache
          return this.http.get(doc.path, { responseType: 'text' }).pipe(
            catchError((err) => {
              // Silently handle 404s and network errors - documentation files may not exist yet
              // Only log non-404 errors in debug mode
              const status = err?.status;
              if (status !== 404 && status !== 0 && status !== undefined) {
                console.debug(`[DocsPreload] Error loading ${doc.path}:`, err);
              }
              return of('');
            }),
            switchMap((content) => {
              if (content) {
                // Store in memory cache (instant access)
                this.contentCache.set(doc.id, content);
                // Store in IndexedDB cache for persistence
                // Note: storing markdown in html field
                const contentHash = this.docCache.hashContent(content);
                this.docCache.set(
                  doc.id,
                  {
                    html: content, // Actually markdown content
                    toc: [],
                    demoConfigs: {},
                  },
                  contentHash
                );
              }
              return of(null);
            })
          );
        })
      );
    });

    // Load all docs in parallel (non-blocking background)
    if (loadPromises.length > 0) {
      forkJoin(loadPromises).subscribe({
        next: () => {
          console.log(
            `[DocsPreload] Preloaded ${this.allMarkdownFiles.length} documentation files`
          );
        },
        error: (err) => {
          console.warn('[DocsPreload] Some documentation files failed to preload:', err);
        },
      });
    }
  }

  /**
   * Get cached content (for use by documentation component)
   */
  getCachedContent(docId: string): string | null {
    return this.contentCache.get(docId) || null;
  }

  /**
   * Set cached content (for use by documentation component)
   */
  setCachedContent(docId: string, content: string): void {
    this.contentCache.set(docId, content);
  }

  /**
   * Check if content is cached
   */
  hasCachedContent(docId: string): boolean {
    return this.contentCache.has(docId);
  }
}
