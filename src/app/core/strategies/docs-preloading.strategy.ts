import { Injectable, inject } from '@angular/core';
import { PreloadingStrategy, Route, Router } from '@angular/router';
import { Observable, of, timer, EMPTY } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';

/**
 * Priority levels for documentation preloading
 */
enum PreloadPriority {
  CRITICAL = 0,    // Core pages loaded immediately
  HIGH = 1,        // Important pages loaded after critical
  MEDIUM = 2,      // Standard pages loaded during idle
  LOW = 3,         // Less common pages loaded last
  NONE = -1        // Never preload
}

/**
 * Route priority configuration
 */
interface RoutePriorityConfig {
  path: string;
  priority: PreloadPriority;
}

/**
 * Smart Documentation Preloading Strategy
 * 
 * Implements intelligent preloading for documentation routes:
 * - Critical pages (getting-started, installation) load immediately
 * - High-priority pages load after a short delay
 * - Medium/low priority pages load during browser idle time
 * - Uses requestIdleCallback for non-critical preloading
 * - Respects Save-Data header and slow connections
 */
@Injectable({
  providedIn: 'root'
})
export class DocsPreloadingStrategy implements PreloadingStrategy {
  private preloadedRoutes = new Set<string>();
  private preloadQueue: Array<{ route: Route; load: () => Observable<unknown> }> = [];
  private isProcessingQueue = false;

  /**
   * Route priority configuration
   * Higher priority = earlier preload
   */
  private readonly routePriorities: RoutePriorityConfig[] = [
    // Critical - load immediately
    { path: 'docs/getting-started', priority: PreloadPriority.CRITICAL },
    { path: 'docs/installation', priority: PreloadPriority.CRITICAL },
    
    // High priority - load after critical
    { path: 'docs/library-usage', priority: PreloadPriority.HIGH },
    { path: 'docs/llm-integration', priority: PreloadPriority.HIGH },
    { path: 'docs/best-practices', priority: PreloadPriority.HIGH },
    
    // Medium priority - load during idle
    { path: 'docs/section-types', priority: PreloadPriority.MEDIUM },
    { path: 'docs/schemas', priority: PreloadPriority.MEDIUM },
    { path: 'docs/components', priority: PreloadPriority.MEDIUM },
    { path: 'docs/streaming', priority: PreloadPriority.MEDIUM },
    
    // Low priority - load last
    { path: 'docs/services', priority: PreloadPriority.LOW },
    { path: 'docs/integration', priority: PreloadPriority.LOW },
    { path: 'docs/advanced', priority: PreloadPriority.LOW },
    { path: 'docs/utilities', priority: PreloadPriority.LOW },
    { path: 'docs/library-docs', priority: PreloadPriority.LOW },
  ];

  /**
   * Delay timings for each priority level (in ms)
   */
  private readonly priorityDelays: Record<PreloadPriority, number> = {
    [PreloadPriority.CRITICAL]: 0,
    [PreloadPriority.HIGH]: 1000,
    [PreloadPriority.MEDIUM]: 3000,
    [PreloadPriority.LOW]: 5000,
    [PreloadPriority.NONE]: -1,
  };

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // Skip if already preloaded
    const routePath = this.getFullPath(route);
    if (this.preloadedRoutes.has(routePath)) {
      return of(null);
    }

    // Check if preloading should be skipped
    if (this.shouldSkipPreload(route)) {
      return of(null);
    }

    // Check for Save-Data header or slow connection
    if (this.isDataSaverEnabled() || this.isSlowConnection()) {
      // Only preload critical routes on slow connections
      const priority = this.getRoutePriority(route);
      if (priority !== PreloadPriority.CRITICAL) {
        return of(null);
      }
    }

    const priority = this.getRoutePriority(route);
    
    if (priority === PreloadPriority.NONE) {
      return of(null);
    }

    // Get delay based on priority
    const delay = this.priorityDelays[priority];

    // Mark as preloaded to prevent duplicates
    this.preloadedRoutes.add(routePath);

    // For critical and high priority, use timer-based delay
    if (priority <= PreloadPriority.HIGH) {
      return timer(delay).pipe(
        mergeMap(() => this.executePreload(route, load)),
        catchError(() => of(null))
      );
    }

    // For medium and low priority, queue for idle-time preloading
    this.queueForIdlePreload(route, load, priority);
    return of(null);
  }

  /**
   * Manually trigger preload of a specific route path
   * Used by hover-based prefetching
   */
  preloadRoute(path: string): void {
    if (this.preloadedRoutes.has(path)) {
      return;
    }

    // Mark as preloaded
    this.preloadedRoutes.add(path);

    // Dynamically import the route chunk
    this.importRouteChunk(path);
  }

  /**
   * Check if a route has been preloaded
   */
  isPreloaded(path: string): boolean {
    return this.preloadedRoutes.has(path);
  }

  /**
   * Get all preloaded routes
   */
  getPreloadedRoutes(): string[] {
    return Array.from(this.preloadedRoutes);
  }

  private executePreload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    const routePath = this.getFullPath(route);
    console.debug(`[DocsPreload] Preloading: ${routePath}`);
    return load().pipe(
      catchError((err) => {
        console.debug(`[DocsPreload] Failed to preload: ${routePath}`, err);
        return of(null);
      })
    );
  }

  private queueForIdlePreload(
    route: Route, 
    load: () => Observable<unknown>,
    priority: PreloadPriority
  ): void {
    this.preloadQueue.push({ route, load });
    
    // Sort queue by priority
    this.preloadQueue.sort((a, b) => {
      const priorityA = this.getRoutePriority(a.route);
      const priorityB = this.getRoutePriority(b.route);
      return priorityA - priorityB;
    });

    // Start processing if not already
    if (!this.isProcessingQueue) {
      this.processIdleQueue();
    }
  }

  private processIdleQueue(): void {
    if (this.preloadQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;

    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(
        (deadline) => {
          // Process items while we have time
          while (deadline.timeRemaining() > 10 && this.preloadQueue.length > 0) {
            const item = this.preloadQueue.shift();
            if (item) {
              this.executePreload(item.route, item.load).subscribe();
            }
          }
          
          // Continue processing if queue not empty
          if (this.preloadQueue.length > 0) {
            this.processIdleQueue();
          } else {
            this.isProcessingQueue = false;
          }
        },
        { timeout: 10000 } // Max 10 second timeout
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        const item = this.preloadQueue.shift();
        if (item) {
          this.executePreload(item.route, item.load).subscribe();
        }
        
        if (this.preloadQueue.length > 0) {
          this.processIdleQueue();
        } else {
          this.isProcessingQueue = false;
        }
      }, 100);
    }
  }

  private getRoutePriority(route: Route): PreloadPriority {
    const routePath = this.getFullPath(route);
    
    // Check explicit priority config
    const config = this.routePriorities.find(c => routePath.includes(c.path));
    if (config) {
      return config.priority;
    }

    // Check route data for preload setting
    if (route.data?.['preload'] === false) {
      return PreloadPriority.NONE;
    }

    // Default to medium priority for doc routes
    if (routePath.includes('docs')) {
      return PreloadPriority.MEDIUM;
    }

    // Don't preload non-doc routes by default
    return PreloadPriority.NONE;
  }

  private getFullPath(route: Route): string {
    return route.path || '';
  }

  private shouldSkipPreload(route: Route): boolean {
    // Skip if explicitly disabled
    if (route.data?.['preload'] === false) {
      return true;
    }

    // Skip if not a documentation route (unless explicitly enabled)
    const path = this.getFullPath(route);
    if (!path.includes('docs') && route.data?.['preload'] !== true) {
      return true;
    }

    return false;
  }

  private isDataSaverEnabled(): boolean {
    if (typeof navigator === 'undefined') return false;
    
    // Check for Save-Data header via Connection API
    const connection = (navigator as any).connection;
    return connection?.saveData === true;
  }

  private isSlowConnection(): boolean {
    if (typeof navigator === 'undefined') return false;
    
    const connection = (navigator as any).connection;
    if (!connection) return false;

    // Consider 2G or slow-2g as slow
    const effectiveType = connection.effectiveType;
    return effectiveType === 'slow-2g' || effectiveType === '2g';
  }

  private importRouteChunk(path: string): void {
    // Map common doc paths to their chunk imports
    const chunkImports: Record<string, () => Promise<unknown>> = {
      'docs/getting-started': () => import('../../features/documentation/getting-started/page.component'),
      'docs/installation': () => import('../../features/documentation/installation/page.component'),
      'docs/library-usage': () => import('../../features/documentation/library-usage/page.component'),
      'docs/llm-integration': () => import('../../features/documentation/llm-integration/page.component'),
      'docs/best-practices': () => import('../../features/documentation/best-practices/page.component'),
    };

    const importFn = chunkImports[path];
    if (importFn) {
      importFn().catch(() => {
        // Silently fail - chunk might not exist or already loaded
      });
    }
  }
}

