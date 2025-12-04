/**
 * Breadcrumb Service
 *
 * Service for managing breadcrumb navigation.
 *
 * @example
 * ```typescript
 * const breadcrumb = inject(BreadcrumbService);
 *
 * breadcrumb.setBreadcrumbs([
 *   { label: 'Home', url: '/' },
 *   { label: 'Users', url: '/users' }
 * ]);
 * ```
 */

import { Injectable, signal } from '@angular/core';

export interface Breadcrumb {
  label: string;
  url?: string;
  icon?: string;
  queryParams?: Record<string, any>;
}

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private breadcrumbs = signal<Breadcrumb[]>([]);

  readonly currentBreadcrumbs = this.breadcrumbs.asReadonly();

  setBreadcrumbs(breadcrumbs: Breadcrumb[]): void {
    this.breadcrumbs.set(breadcrumbs);
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.update((crumbs) => [...crumbs, breadcrumb]);
  }

  removeLast(): void {
    this.breadcrumbs.update((crumbs) => crumbs.slice(0, -1));
  }

  clear(): void {
    this.breadcrumbs.set([]);
  }

  getBreadcrumbs(): Breadcrumb[] {
    return this.breadcrumbs();
  }
}
