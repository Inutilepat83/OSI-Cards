import { Routes } from '@angular/router';

/**
 * Ng-doc routes
 * Auto-generated from page files
 * This file is generated automatically - do not edit manually
 */

export const NG_DOC_ROUTING: Routes = [
  {
    path: '',
    redirectTo: 'getting-started',
    pathMatch: 'full'
  },
  {
    path: 'best-practices',
    loadComponent: () => import('./best-practices/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
  },
  {
    path: 'getting-started',
    loadComponent: () => import('./getting-started/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
  },
  {
    path: 'installation',
    loadComponent: () => import('./installation/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
  },
  {
    path: 'library-usage',
    loadComponent: () => import('./library-usage/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
  },
  {
    path: 'llm-integration',
    loadComponent: () => import('./llm-integration/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
  },
  {
    path: 'library-docs',
    children: [
      {
        path: '',
        redirectTo: 'agentic-flow',
        pathMatch: 'full'
      },
      {
        path: 'agentic-flow',
        loadComponent: () => import('./library-docs/agentic-flow/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'events',
        loadComponent: () => import('./library-docs/events/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'services',
        loadComponent: () => import('./library-docs/services/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'theming',
        loadComponent: () => import('./library-docs/theming/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
    ]
  },
  {
    path: 'section-types',
    children: [
      {
        path: '',
        redirectTo: 'analytics',
        pathMatch: 'full'
      },
      {
        path: 'analytics',
        loadComponent: () => import('./section-types/analytics/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'base',
        loadComponent: () => import('./section-types/base/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'brand-colors',
        loadComponent: () => import('./section-types/brand-colors/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'chart',
        loadComponent: () => import('./section-types/chart/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'contact-card',
        loadComponent: () => import('./section-types/contact-card/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'event',
        loadComponent: () => import('./section-types/event/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'financials',
        loadComponent: () => import('./section-types/financials/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'info',
        loadComponent: () => import('./section-types/info/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'list',
        loadComponent: () => import('./section-types/list/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'map',
        loadComponent: () => import('./section-types/map/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'network-card',
        loadComponent: () => import('./section-types/network-card/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'news',
        loadComponent: () => import('./section-types/news/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'overview',
        loadComponent: () => import('./section-types/overview/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'product',
        loadComponent: () => import('./section-types/product/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'quotation',
        loadComponent: () => import('./section-types/quotation/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'social-media',
        loadComponent: () => import('./section-types/social-media/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'solutions',
        loadComponent: () => import('./section-types/solutions/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
      {
        path: 'text-reference',
        loadComponent: () => import('./section-types/text-reference/page.component').then(m => m.default).catch(() => import('./ng-doc-page.component').then(m => m.NgDocPageComponent))
      },
    ]
  },
];
