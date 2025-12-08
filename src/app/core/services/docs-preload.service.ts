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
   * Includes both DOCUMENTATION_ITEMS and all index.md files
   */
  private readonly allMarkdownFiles: { id: string; path: string }[] = [
    // From DOCUMENTATION_ITEMS
    ...DOCUMENTATION_ITEMS.map((doc) => ({ id: doc.id, path: doc.path })),
    // All index.md files from documentation features
    // These paths are relative to the app root and served as assets
    { id: 'getting-started', path: 'assets/docs/getting-started/index.md' },
    { id: 'installation', path: 'assets/docs/installation/index.md' },
    { id: 'library-usage', path: 'assets/docs/library-usage/index.md' },
    { id: 'best-practices', path: 'assets/docs/best-practices/index.md' },
    { id: 'llm-integration', path: 'assets/docs/llm-integration/index.md' },
    // Section types
    ...[
      'analytics',
      'brand-colors',
      'chart',
      'contact-card',
      'event',
      'faq',
      'fallback',
      'financials',
      'gallery',
      'info',
      'list',
      'map',
      'network-card',
      'news',
      'overview',
      'product',
      'quotation',
      'social-media',
      'solutions',
      'text-reference',
      'timeline',
      'video',
    ].map((type) => ({
      id: `section-${type}`,
      path: `assets/docs/section-types/${type}/index.md`,
    })),
    // Components
    ...[
      'ai-card-renderer',
      'card-actions',
      'card-header',
      'card-preview',
      'card-skeleton',
      'card-streaming-indicator',
      'masonry-grid',
      'section-renderer',
      'osi-cards',
      'osi-cards-container',
    ].map((comp) => ({ id: `component-${comp}`, path: `assets/docs/components/${comp}/index.md` })),
    // Services
    ...[
      'animation-orchestrator',
      'event-middleware-service',
      'icon-service',
      'layout-worker-service',
      'magnetic-tilt-service',
      'section-normalization',
      'section-plugin-registry',
      'section-utils-service',
      'streaming-service',
      'theme-service',
    ].map((svc) => ({ id: `service-${svc}`, path: `assets/docs/services/${svc}/index.md` })),
    // Integration
    ...[
      'agent-systems',
      'angular-18',
      'angular-20',
      'card-generation-prompt',
      'card-validation',
      'dependencies',
      'error-recovery',
      'json-schema-llm',
      'lazy-loading',
      'llm-overview',
      'module-based',
      'npm-installation',
      'prompt-engineering',
      'pwa',
      'quick-start',
      'rate-limiting',
      'ssr',
      'standalone-components',
      'streaming-responses',
      'websocket-integration',
    ].map((int) => ({ id: `integration-${int}`, path: `assets/docs/integration/${int}/index.md` })),
    // Advanced
    ...[
      'accessibility',
      'css-properties',
      'custom-sections',
      'error-patterns',
      'event-middleware',
      'i18n',
      'performance',
      'security',
      'theme-presets',
      'theming-overview',
    ].map((adv) => ({ id: `advanced-${adv}`, path: `assets/docs/advanced/${adv}/index.md` })),
    // Streaming
    ...[
      'card-updates',
      'config',
      'error-handling',
      'lifecycle',
      'overview',
      'progressive-rendering',
      'state',
    ].map((str) => ({ id: `streaming-${str}`, path: `assets/docs/streaming/${str}/index.md` })),
    // Schemas
    ...[
      'ai-card-config',
      'card-action',
      'card-field',
      'card-item',
      'card-section',
      'email-config',
      'type-aliases',
    ].map((sch) => ({ id: `schema-${sch}`, path: `assets/docs/schemas/${sch}/index.md` })),
    // Utilities
    ...[
      'card-type-guards',
      'card-utils',
      'ensure-card-ids',
      'is-valid-section-type',
      'resolve-section-type',
      'sanitize-card-config',
    ].map((util) => ({ id: `utility-${util}`, path: `assets/docs/utilities/${util}/index.md` })),
    // Library docs
    ...['agentic-flow', 'events', 'services', 'theming'].map((lib) => ({
      id: `library-${lib}`,
      path: `assets/docs/library-docs/${lib}/index.md`,
    })),
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
            catchError(() => of('')),
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
