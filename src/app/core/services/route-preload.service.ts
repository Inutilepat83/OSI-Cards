import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Route Preload Service
 *
 * Preloads routes for faster navigation.
 */
@Injectable({
  providedIn: 'root',
})
export class RoutePreloadService {
  constructor(private readonly router: Router) {}

  /**
   * Preload all routes
   */
  async preloadAllRoutes(): Promise<void> {
    // Implementation can be added as needed
  }
}
