import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Card Skeleton Component
 *
 * Loading skeleton component that displays animated placeholders while card data
 * is being loaded. Provides visual feedback and prevents layout shift during loading.
 *
 * Features:
 * - Animated skeleton placeholders for card title and sections
 * - Staggered animations for multiple sections
 * - Fullscreen mode support
 * - Empty state handling
 *
 * @example
 * ```html
 * <app-card-skeleton
 *   [cardTitle]="'Loading...'"
 *   [sectionCount]="3"
 *   [isFullscreen]="false">
 * </app-card-skeleton>
 * ```
 */
@Component({
  selector: 'app-card-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-skeleton.component.html',
  styleUrls: ['./card-skeleton.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSkeletonComponent {
  @Input() cardTitle = '';
  @Input() sectionCount = 0;
  @Input() isFullscreen = false;
  @Input() actionCount = 0;
}
