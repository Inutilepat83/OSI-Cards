import { Routes } from '@angular/router';

/**
 * Documentation routes with layout
 * Lazy loaded for optimal bundle size
 */
export const docsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/docs-layout/docs-layout.component').then(m => m.DocsLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./components/docs-index/docs-index.component').then(m => m.DocsIndexComponent)
      },
      {
        path: ':docName',
        loadComponent: () => import('./components/doc-viewer/doc-viewer.component').then(m => m.DocViewerComponent)
      }
    ]
  }
];

