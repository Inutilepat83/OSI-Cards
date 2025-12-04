import { Component, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Section skeleton type definitions
 * Each type has a unique skeleton layout matching its actual content structure
 */
export type SkeletonSectionType =
  | 'info'
  | 'analytics'
  | 'chart'
  | 'list'
  | 'contact-card'
  | 'network-card'
  | 'map'
  | 'event'
  | 'product'
  | 'overview'
  | 'financials'
  | 'solutions'
  | 'quotation'
  | 'generic';

/**
 * Configuration for a skeleton section
 */
export interface SkeletonSection {
  type: SkeletonSectionType;
  title?: string;
}

/**
 * Skeleton layout configuration per section type
 */
interface SkeletonLayout {
  headerLines: number;
  contentRows: number;
  hasProgress?: boolean;
  hasGrid?: boolean;
  gridColumns?: number;
  hasIcon?: boolean;
  hasAvatar?: boolean;
  hasMetrics?: boolean;
}

/**
 * CardSkeletonComponent
 *
 * Displays a skeleton loading state for card generation.
 * Supports different skeleton layouts based on section type for
 * more accurate loading previews.
 *
 * Uses Shadow DOM encapsulation for complete style isolation.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <app-card-skeleton
 *   [cardTitle]="'Loading...'"
 *   [sectionCount]="3">
 * </app-card-skeleton>
 *
 * <!-- With section types -->
 * <app-card-skeleton
 *   [cardTitle]="'Loading Card'"
 *   [sections]="[
 *     { type: 'overview' },
 *     { type: 'analytics' },
 *     { type: 'contact-card' }
 *   ]">
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
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class CardSkeletonComponent {
  /** Optional title to display in the skeleton header */
  @Input() cardTitle = '';

  /** Number of skeleton section placeholders to show (uses generic type) */
  @Input() sectionCount = 0;

  /** Whether the skeleton is in fullscreen mode */
  @Input() isFullscreen = false;

  /**
   * Array of section configurations with specific types
   * When provided, overrides sectionCount and uses type-specific skeletons
   */
  @Input() sections: SkeletonSection[] = [];

  /** Enable animated shimmer effect */
  @Input() animated = true;

  /**
   * Layout configurations for each section type
   * Defines how the skeleton should look for each type
   */
  private readonly sectionLayouts: Record<SkeletonSectionType, SkeletonLayout> = {
    info: { headerLines: 1, contentRows: 4 },
    analytics: { headerLines: 1, contentRows: 2, hasGrid: true, gridColumns: 3, hasMetrics: true },
    chart: { headerLines: 1, contentRows: 1, hasProgress: true },
    list: { headerLines: 1, contentRows: 5 },
    'contact-card': {
      headerLines: 1,
      contentRows: 2,
      hasAvatar: true,
      hasGrid: true,
      gridColumns: 2,
    },
    'network-card': { headerLines: 1, contentRows: 2, hasAvatar: true },
    map: { headerLines: 1, contentRows: 1, hasProgress: true },
    event: { headerLines: 1, contentRows: 3, hasIcon: true },
    product: { headerLines: 1, contentRows: 2, hasGrid: true, gridColumns: 2 },
    overview: { headerLines: 1, contentRows: 6 },
    financials: { headerLines: 1, contentRows: 3, hasMetrics: true, hasGrid: true, gridColumns: 2 },
    solutions: { headerLines: 1, contentRows: 3 },
    quotation: { headerLines: 1, contentRows: 2, hasIcon: true },
    generic: { headerLines: 1, contentRows: 3 },
  };

  /**
   * Get effective sections to render
   * Returns typed sections if provided, otherwise generates generic sections
   */
  get effectiveSections(): SkeletonSection[] {
    if (this.sections.length > 0) {
      return this.sections;
    }

    // Generate generic sections based on count
    return Array.from({ length: this.sectionCount }, () => ({ type: 'generic' as const }));
  }

  /**
   * Get the layout configuration for a section type
   */
  getLayout(type: SkeletonSectionType): SkeletonLayout {
    return this.sectionLayouts[type] || this.sectionLayouts['generic'];
  }

  /**
   * Generate array for ngFor iteration
   */
  range(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }

  /**
   * Get CSS classes for a skeleton section based on type
   */
  getSectionClasses(section: SkeletonSection): string[] {
    const classes = ['skeleton-section', `skeleton-section--${section.type}`];
    if (this.animated) {
      classes.push('skeleton-section--animated');
    }
    return classes;
  }

  /**
   * TrackBy function for sections
   */
  trackBySection(index: number, section: SkeletonSection): string {
    return section.title ?? `section-${index}`;
  }

  /**
   * TrackBy function for index-based iterations
   */
  trackByIndex(index: number): number {
    return index;
  }
}
