import { Routes } from '@angular/router';
import { homeRoutes } from './features/home/home.routes';

/**
 * Main application routes
 * Uses feature-based routing for better organization
 */
export const routes: Routes = [
  // Home feature routes
  ...homeRoutes,

  // Product routes
  {
    path: 'features',
    loadComponent: () =>
      import('./features/features-page/features-page.component').then(
        (m) => m.FeaturesPageComponent
      ),
  },
  {
    path: 'templates',
    loadComponent: () =>
      import('./features/templates/templates.component').then((m) => m.TemplatesComponent),
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./features/pricing/pricing.component').then((m) => m.PricingComponent),
  },

  // Resources routes
  {
    path: 'api',
    loadComponent: () => import('./features/api/api.component').then((m) => m.ApiComponent),
  },
  {
    path: 'support',
    loadComponent: () =>
      import('./features/support/support.component').then((m) => m.SupportComponent),
  },
  // NgDoc documentation routes
  // Routes are auto-generated from page files
  {
    path: 'docs',
    loadComponent: () =>
      import('./features/documentation/docs-wrapper.component').then((m) => m.DocsWrapperComponent),
    loadChildren: () =>
      import('./features/documentation/ng-doc.routes').then((m) => m.NG_DOC_ROUTING),
  },

  // Company routes
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'blog',
    loadComponent: () => import('./features/blog/blog.component').then((m) => m.BlogComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact.component').then((m) => m.ContactComponent),
  },

  // Cards route (legacy - consider moving to feature)
  {
    path: 'cards',
    loadComponent: () =>
      import('./shared/components/cards/cards-container/cards-container.component').then(
        (m) => m.CardsContainerComponent
      ),
    data: { preload: false }, // Don't preload cards route
  },

  // Health check route
  {
    path: 'health',
    loadComponent: () =>
      import('./shared/components/health-check/health-check.component').then(
        (m) => m.HealthCheckComponent
      ),
    data: { preload: false },
  },

  // iLibrary Integration Simulator
  {
    path: 'ilibrary',
    loadComponent: () =>
      import('./features/ilibrary/ilibrary.component').then((m) => m.IlibraryComponent),
    data: { preload: false },
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
    redirectTo: '',
  },
];
