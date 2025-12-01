/**
 * Base classes for common component logic
 * Reduces code duplication across components
 */

import { DestroyRef, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

/**
 * Base component class with common functionality
 */
export abstract class BaseComponent {
  protected readonly destroyRef = inject(DestroyRef);
  protected readonly destroyed$ = new Subject<void>();

  constructor() {
    // Setup cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.destroyed$.next();
      this.destroyed$.complete();
    });
  }

  /**
   * Take until destroyed operator
   */
  protected takeUntilDestroyed<T>() {
    return takeUntil<T>(this.destroyed$);
  }
}

/**
 * Base service class with common functionality
 */
export abstract class BaseService {
  protected readonly destroyed$ = new Subject<void>();

  /**
   * Cleanup method to be called when service is destroyed
   */
  destroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
