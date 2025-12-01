import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Mobile-optimized wrapper component
 * Optimizes touch interactions and mobile layouts
 */
@Component({
  selector: 'app-mobile-optimized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mobile-optimized-content">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .mobile-optimized-content {
        /* Improve touch targets */
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      /* Larger touch targets on mobile */
      @media (max-width: 768px) {
        .mobile-optimized-content button,
        .mobile-optimized-content a,
        .mobile-optimized-content [role='button'] {
          min-height: 44px;
          min-width: 44px;
        }

        /* Improve scrolling */
        .mobile-optimized-content {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileOptimizedComponent {
  @HostBinding('class.mobile-optimized') isMobileOptimized = true;
}
