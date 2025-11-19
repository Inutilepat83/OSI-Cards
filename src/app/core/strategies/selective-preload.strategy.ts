import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * Selective preloading strategy
 * Only preloads routes marked with data.preload = true
 * Delays preloading to avoid blocking initial load
 */
@Injectable({
  providedIn: 'root'
})
export class SelectivePreloadStrategy implements PreloadingStrategy {
  /**
   * Preload routes based on configuration
   * Routes with data.preload = true will be preloaded after a delay
   */
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Check if route should be preloaded
    if (route.data && route.data['preload'] === true) {
      // Delay preloading by 2 seconds to avoid blocking initial load
      return timer(2000).pipe(
        mergeMap(() => load())
      );
    }
    
    // Don't preload routes without the preload flag
    return of(null);
  }
}

