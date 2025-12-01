import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardItem } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';

/**
 * Rating/Review item
 */
export interface RatingItem extends CardItem {
  /** Rating value (0-5) */
  rating?: number;
  /** Maximum rating */
  maxRating?: number;
  /** Review text */
  review?: string;
  /** Reviewer name */
  reviewer?: string;
  /** Reviewer avatar URL */
  avatar?: string;
  /** Review date */
  date?: string;
  /** Verified purchase */
  verified?: boolean;
  /** Helpful count */
  helpfulCount?: number;
}

/**
 * Rating Section Component
 *
 * Displays ratings and reviews with star indicators,
 * reviewer information, and helpful voting.
 *
 * @example
 * ```html
 * <app-rating-section [section]="ratingSection"></app-rating-section>
 * ```
 */
@Component({
  selector: 'app-rating-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './rating-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RatingSectionComponent extends BaseSectionComponent<RatingItem> {
  /** Rating sections work well in 2 columns */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 2,
    minColumns: 1,
    maxColumns: 2,
    expandOnItemCount: 4,
  };

  get items(): RatingItem[] {
    return super.getItems() as RatingItem[];
  }

  /**
   * Get rating value
   */
  getRating(item: RatingItem): number {
    return item.rating ?? 0;
  }

  /**
   * Get maximum rating
   */
  getMaxRating(item: RatingItem): number {
    return item.maxRating ?? 5;
  }

  /**
   * Get star array for rendering
   * Accepts either a RatingItem or a partial object with just rating
   */
  getStars(item: RatingItem | { rating: number; maxRating?: number }): ('full' | 'half' | 'empty')[] {
    const rating = item.rating ?? 0;
    const maxRating = item.maxRating ?? 5;
    const stars: ('full' | 'half' | 'empty')[] = [];

    for (let i = 1; i <= maxRating; i++) {
      if (i <= rating) {
        stars.push('full');
      } else if (i - 0.5 <= rating) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }

    return stars;
  }

  /**
   * Get review text
   */
  getReview(item: RatingItem): string {
    return item.review || item.description || '';
  }

  /**
   * Get reviewer name
   */
  getReviewer(item: RatingItem): string {
    return item.reviewer || item.title || 'Anonymous';
  }

  /**
   * Get formatted date
   */
  getFormattedDate(item: RatingItem): string {
    if (!item.date) return '';

    try {
      const date = new Date(item.date);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return item.date;
    }
  }

  /**
   * Get initials for avatar fallback
   */
  getInitials(item: RatingItem): string {
    const name = this.getReviewer(item);
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  /**
   * Calculate average rating across all items
   */
  get averageRating(): number {
    if (this.items.length === 0) return 0;

    const total = this.items.reduce((sum, item) => sum + this.getRating(item), 0);
    return Math.round((total / this.items.length) * 10) / 10;
  }

  /**
   * Get rating distribution
   */
  get ratingDistribution(): { rating: number; count: number; percentage: number }[] {
    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const count = this.items.filter(item => Math.round(this.getRating(item)) === rating).length;
      return {
        rating,
        count,
        percentage: this.items.length > 0 ? (count / this.items.length) * 100 : 0
      };
    });
    return distribution;
  }

  onItemClick(item: RatingItem): void {
    this.emitItemInteraction(item, {
      sectionTitle: this.section.title,
      rating: this.getRating(item)
    });
  }

  override trackItem(index: number, item: RatingItem): string {
    return item.id ?? `rating-${index}-${item.reviewer || ''}`;
  }
}

