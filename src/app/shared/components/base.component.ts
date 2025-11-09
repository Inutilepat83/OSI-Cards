import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Base component class providing common functionality for all components
 * - Automatic cleanup with destroyed$ subject
 * - Common lifecycle patterns
 * 
 * Usage:
 * ```typescript
 * export class MyComponent extends BaseComponent implements OnDestroy {
 *   constructor(private cdr: ChangeDetectorRef) {
 *     super();
 *   }
 * 
 *   ngOnDestroy(): void {
 *     super.ngOnDestroy();
 *     // Additional cleanup
 *   }
 * }
 * ```
 */
@Injectable()
export class BaseComponent {
  protected readonly destroyed$ = new Subject<void>();

  /**
   * Cleanup on component destruction
   * Call this in your component's ngOnDestroy method
   */
  protected ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}

