import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * OsiCardsContainerComponent
 * 
 * A wrapper component that automatically applies the `.osi-cards-container` class
 * to encapsulate OSI Cards styles and prevent CSS leakage into the host application.
 * 
 * @example
 * ```html
 * <osi-cards-container>
 *   <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
 * </osi-cards-container>
 * ```
 * 
 * @example
 * With theme support:
 * ```html
 * <osi-cards-container [theme]="'night'">
 *   <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
 * </osi-cards-container>
 * ```
 */
@Component({
  selector: 'osi-cards-container',
  standalone: true,
  template: `
    <div [class]="containerClass" [attr.data-theme]="theme">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .osi-cards-container {
      /* Container inherits host styles - no additional styling needed */
      /* All OSI Cards styles are scoped within this class */
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OsiCardsContainerComponent {
  /**
   * Theme to apply to the container.
   * Can be 'day', 'night', or undefined (default).
   */
  theme?: 'day' | 'night';

  /**
   * Computed container class name.
   * Always includes 'osi-cards-container' base class.
   */
  get containerClass(): string {
    return 'osi-cards-container';
  }
}

