import { Routes } from '@angular/router';
import { homeRoutes } from './features/home/home.routes';

/**
 * Main application routes
 * Uses feature-based routing for better organization
 */
export const routes: Routes = [
  // Home feature routes
  ...homeRoutes,
  
  // Cards route (legacy - consider moving to feature)
  {
    path: 'cards',
    loadComponent: () => import('./shared/components/cards/cards-container/cards-container.component').then(m => m.CardsContainerComponent),
    data: { preload: false } // Don't preload cards route
  },
  
  // Card detail route - uncomment when CardDetailComponent is created
  // {
  //   path: 'card/:id',
  //   loadComponent: () => import('./features/card-detail/card-detail.component').then(m => m.CardDetailComponent),
  //   canActivate: [cardExistsGuard],
  //   resolve: { card: cardResolver },
  //   data: { preload: false }
  // },
  
  // Wildcard route - redirect to home
  { 
    path: '**', 
    redirectTo: '' 
  }
];
