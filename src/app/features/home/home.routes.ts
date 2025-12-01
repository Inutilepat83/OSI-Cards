import { Routes } from '@angular/router';

/**
 * Home feature routes
 * Lazy loaded for better code splitting
 */
export const homeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home-page/home-page.component').then((m) => m.HomePageComponent),
    data: { preload: true },
  },
];
