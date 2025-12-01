import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DocsPreloadingStrategy implements PreloadingStrategy {
  private readonly criticalRoutes = new Set([
    'docs/getting-started',
    'docs/installation',
    'docs/best-practices',
  ]);

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // Always preload critical documentation routes
    if (route.path && this.criticalRoutes.has(route.path)) {
      return load();
    }

    // Preload other docs routes with a delay using requestIdleCallback
    if (route.path?.startsWith('docs/')) {
      return timer(2000).pipe(
        mergeMap(() => {
          if (typeof requestIdleCallback !== 'undefined') {
            return new Observable((observer) => {
              requestIdleCallback(
                () => {
                  load().subscribe({
                    next: (m) => observer.next(m),
                    error: (e) => observer.error(e),
                    complete: () => observer.complete(),
                  });
                },
                { timeout: 5000 }
              );
            });
          }
          return load();
        })
      );
    }

    // Don't preload non-docs routes
    return of(null);
  }
}
