import { Component, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * CardSkeletonComponent
 * 
 * Displays a skeleton loading state for card generation.
 * Uses Shadow DOM encapsulation for complete style isolation.
 * 
 * @example
 * ```html
 * <app-card-skeleton 
 *   [cardTitle]="'Loading...'" 
 *   [sectionCount]="3">
 * </app-card-skeleton>
 * ```
 */
@Component({
  selector: 'app-card-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-skeleton.component.html',
  styleUrls: ['../../styles/bundles/_card-skeleton.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom
})
export class CardSkeletonComponent {
  /** Optional title to display in the skeleton header */
  @Input() cardTitle = '';
  
  /** Number of skeleton section placeholders to show */
  @Input() sectionCount = 0;
  
  /** Whether the skeleton is in fullscreen mode */
  @Input() isFullscreen = false;
}






