/**
 * Translation Pipe
 *
 * Pipe for translating text in templates using the I18nService.
 * Automatically updates when locale changes.
 *
 * @example
 * ```html
 * <button>{{ 'common.save' | translate }}</button>
 * <span>{{ 'common.greeting' | translate: { name: 'John' } }}</span>
 * ```
 */

import { ChangeDetectorRef, inject, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { I18nService, TranslationParams } from '../../core/services/i18n.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false, // Not pure to react to locale changes
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);
  private subscription?: Subscription;
  private lastKey = '';
  private lastParams: TranslationParams | undefined;
  private lastValue = '';

  transform(key: string, params?: TranslationParams): string {
    // If key or params changed, update subscription
    if (key !== this.lastKey || params !== this.lastParams) {
      this.lastKey = key;
      this.lastParams = params;

      // Unsubscribe from previous subscription
      if (this.subscription) {
        this.subscription.unsubscribe();
      }

      // Subscribe to locale changes
      this.subscription = this.i18n.locale$.subscribe(() => {
        this.lastValue = this.i18n.translate(key, params);
        this.cdr.markForCheck();
      });

      // Get initial value
      this.lastValue = this.i18n.translate(key, params);
    }

    return this.lastValue;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
