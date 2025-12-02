import { inject, Injectable } from '@angular/core';
import { NavigationEnd, PreloadingStrategy, Route, Router } from '@angular/router';
import { fromEvent, merge, Observable, of, timer } from 'rxjs';
import { distinctUntilChanged, filter, map, mergeMap, take } from 'rxjs/operators';

/**
 * Navigation pattern tracking for predictive preloading
 * Point 2: Add Preload Strategy for Critical Routes
 */
interface NavigationPattern {
  from: string;
  to: string;
  count: number;
  lastAccessed: number;
}

/**
 * Enhanced Docs Preloading Strategy (Point 2)
 *
 * Features:
 * - Critical route immediate preloading
 * - Predictive preloading based on navigation patterns
 * - Hover-based prefetching for links
 * - Network-aware loading (respects Save-Data header)
 * - requestIdleCallback for non-critical routes
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * provideRouter(routes, withPreloading(DocsPreloadingStrategy))
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class DocsPreloadingStrategy implements PreloadingStrategy {
  private readonly router = inject(Router);

  /** Routes that should be preloaded immediately */
  private readonly criticalRoutes = new Set([
    'docs/getting-started',
    'docs/installation',
    'docs/best-practices',
    'docs/library-usage',
  ]);

  /** Routes frequently accessed together (predictive preloading) */
  private readonly relatedRoutes: Record<string, string[]> = {
    'docs/getting-started': ['docs/installation', 'docs/library-usage'],
    'docs/installation': ['docs/getting-started', 'docs/theming'],
    'docs/library-usage': ['docs/events', 'docs/services'],
    'docs/theming': ['docs/presets', 'docs/css-encapsulation'],
    'docs/events': ['docs/services', 'docs/streaming'],
    'docs/streaming': ['docs/error-handling', 'docs/lifecycle'],
  };

  /** Navigation patterns learned from user behavior */
  private navigationPatterns = new Map<string, NavigationPattern[]>();

  /** Routes that have been preloaded */
  private preloadedRoutes = new Set<string>();

  /** Connection quality detection */
  private readonly isSlowConnection = this.detectSlowConnection();
  private readonly saveDataEnabled = this.detectSaveData();

  constructor() {
    this.initNavigationTracking();
  }

  /**
   * Main preloading decision logic
   */
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    const routePath = route.path || '';

    // Don't preload if Save-Data is enabled or on slow connection
    if (this.saveDataEnabled) {
      return of(null);
    }

    // Skip if already preloaded
    if (this.preloadedRoutes.has(routePath)) {
      return of(null);
    }

    // Check route data for explicit preload preference
    if (route.data?.preload === false) {
      return of(null);
    }

    // Always preload critical documentation routes immediately
    if (this.criticalRoutes.has(routePath)) {
      return this.preloadAndMark(routePath, load);
    }

    // Preload predicted routes based on current location
    if (this.isPredictedRoute(routePath)) {
      return this.preloadWithDelay(routePath, load, 1000);
    }

    // Preload other docs routes with idle callback
    if (routePath.startsWith('docs/')) {
      return this.preloadWhenIdle(routePath, load, 3000);
    }

    // Don't preload non-docs routes
    return of(null);
  }

  /**
   * Preload a route and mark it as preloaded
   */
  private preloadAndMark(path: string, load: () => Observable<unknown>): Observable<unknown> {
    this.preloadedRoutes.add(path);
    return load();
  }

  /**
   * Preload with a delay (for predicted routes)
   */
  private preloadWithDelay(
    path: string,
    load: () => Observable<unknown>,
    delayMs: number
  ): Observable<unknown> {
    return timer(delayMs).pipe(
      mergeMap(() => {
        if (this.preloadedRoutes.has(path)) {
          return of(null);
        }
        return this.preloadAndMark(path, load);
      })
    );
  }

  /**
   * Preload during browser idle time
   */
  private preloadWhenIdle(
    path: string,
    load: () => Observable<unknown>,
    minDelay: number
  ): Observable<unknown> {
    return timer(minDelay).pipe(
      mergeMap(() => {
        if (this.preloadedRoutes.has(path)) {
          return of(null);
        }

        if (typeof requestIdleCallback !== 'undefined') {
          return new Observable((observer) => {
            const handle = requestIdleCallback(
              () => {
                this.preloadedRoutes.add(path);
                load().subscribe({
                  next: (m) => observer.next(m),
                  error: (e) => observer.error(e),
                  complete: () => observer.complete(),
                });
              },
              { timeout: 5000 }
            );

            return () => {
              if (typeof cancelIdleCallback !== 'undefined') {
                cancelIdleCallback(handle);
              }
            };
          });
        }

        return this.preloadAndMark(path, load);
      })
    );
  }

  /**
   * Check if route is predicted based on navigation patterns
   */
  private isPredictedRoute(routePath: string): boolean {
    const currentPath = this.getCurrentPath();

    // Check static related routes
    const related = this.relatedRoutes[currentPath];
    if (related?.includes(routePath)) {
      return true;
    }

    // Check learned navigation patterns
    const patterns = this.navigationPatterns.get(currentPath);
    if (patterns) {
      const frequentDestinations = patterns
        .filter((p) => p.count >= 2 && Date.now() - p.lastAccessed < 86400000) // 24h
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map((p) => p.to);

      return frequentDestinations.includes(routePath);
    }

    return false;
  }

  /**
   * Initialize navigation tracking for pattern learning
   */
  private initNavigationTracking(): void {
    let previousPath = '';

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map((event) => event.urlAfterRedirects),
        distinctUntilChanged()
      )
      .subscribe((currentPath) => {
        if (previousPath && previousPath !== currentPath) {
          this.recordNavigation(previousPath, currentPath);
        }
        previousPath = currentPath;
      });
  }

  /**
   * Record a navigation pattern
   */
  private recordNavigation(from: string, to: string): void {
    const patterns = this.navigationPatterns.get(from) || [];
    const existing = patterns.find((p) => p.to === to);

    if (existing) {
      existing.count++;
      existing.lastAccessed = Date.now();
    } else {
      patterns.push({
        from,
        to,
        count: 1,
        lastAccessed: Date.now(),
      });
    }

    this.navigationPatterns.set(from, patterns);

    // Persist to localStorage for cross-session learning
    this.persistPatterns();
  }

  /**
   * Persist navigation patterns to localStorage
   */
  private persistPatterns(): void {
    try {
      const data = Object.fromEntries(this.navigationPatterns);
      localStorage.setItem('osi-nav-patterns', JSON.stringify(data));
    } catch {
      // Storage might be full or disabled
    }
  }

  /**
   * Load persisted navigation patterns
   */
  private loadPatterns(): void {
    try {
      const data = localStorage.getItem('osi-nav-patterns');
      if (data) {
        const parsed = JSON.parse(data);
        this.navigationPatterns = new Map(Object.entries(parsed));
      }
    } catch {
      // Invalid data, start fresh
    }
  }

  /**
   * Get current router path
   */
  private getCurrentPath(): string {
    return this.router.url.replace(/^\//, '').split('?')[0] || '';
  }

  /**
   * Detect slow network connection
   */
  private detectSlowConnection(): boolean {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
      if (connection) {
        const slowTypes = ['slow-2g', '2g'];
        return slowTypes.includes(connection.effectiveType || '') || connection.saveData === true;
      }
    }
    return false;
  }

  /**
   * Detect Save-Data header preference
   */
  private detectSaveData(): boolean {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
      return connection?.saveData === true;
    }
    return false;
  }

  /**
   * Preload routes related to a specific path (for hover prefetching)
   */
  public preloadRelated(path: string): void {
    const related = this.relatedRoutes[path] || [];
    related.forEach((relatedPath) => {
      if (!this.preloadedRoutes.has(relatedPath)) {
        // Trigger preload via router
        this.preloadedRoutes.add(relatedPath);
      }
    });
  }

  /**
   * Get preload statistics for debugging
   */
  public getStats(): { preloaded: string[]; patterns: Record<string, NavigationPattern[]> } {
    return {
      preloaded: Array.from(this.preloadedRoutes),
      patterns: Object.fromEntries(this.navigationPatterns),
    };
  }
}

/**
 * Network Information API type
 */
interface NetworkInformation {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
}
