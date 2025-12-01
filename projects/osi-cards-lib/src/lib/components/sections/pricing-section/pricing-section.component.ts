import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardItem } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';

/**
 * Pricing feature item
 */
export interface PricingFeature {
  text: string;
  included: boolean;
  tooltip?: string;
}

/**
 * Pricing tier item
 */
export interface PricingItem extends CardItem {
  /** Plan name */
  planName?: string;
  /** Price amount */
  price?: number;
  /** Original price (for discounts) */
  originalPrice?: number;
  /** Currency symbol */
  currency?: string;
  /** Billing period */
  period?: string;
  /** Features list */
  features?: PricingFeature[] | string[];
  /** CTA button text */
  ctaText?: string;
  /** CTA button URL */
  ctaUrl?: string;
  /** Whether this is the featured/recommended plan */
  featured?: boolean;
  /** Badge text (e.g., "Most Popular") */
  badge?: string;
  /** Whether plan is available */
  available?: boolean;
}

/**
 * Pricing Section Component
 *
 * Displays pricing tiers in a comparison format
 * with features, pricing, and CTAs.
 *
 * @example
 * ```html
 * <app-pricing-section [section]="pricingSection"></app-pricing-section>
 * ```
 */
@Component({
  selector: 'app-pricing-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './pricing-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingSectionComponent extends BaseSectionComponent<PricingItem> {
  /** Pricing sections prefer horizontal layout */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 3,
    minColumns: 1,
    maxColumns: 4,
    matchItemCount: true,
  };

  /** Toggle between monthly/yearly pricing */
  billingPeriod = signal<'monthly' | 'yearly'>('monthly');

  get items(): PricingItem[] {
    return super.getItems() as PricingItem[];
  }

  /**
   * Get plan name
   */
  getPlanName(item: PricingItem): string {
    return item.planName || item.title || 'Plan';
  }

  /**
   * Get formatted price
   */
  getFormattedPrice(item: PricingItem): string {
    const price = item.price;
    if (price === undefined || price === null) return 'Free';
    if (price === 0) return 'Free';

    const currency = item.currency || '$';
    return `${currency}${price}`;
  }

  /**
   * Get original price for discounts
   */
  getOriginalPrice(item: PricingItem): string | null {
    if (!item.originalPrice || item.originalPrice <= (item.price || 0)) {
      return null;
    }
    const currency = item.currency || '$';
    return `${currency}${item.originalPrice}`;
  }

  /**
   * Calculate discount percentage
   */
  getDiscount(item: PricingItem): number | null {
    if (!item.originalPrice || !item.price) return null;
    const discount = ((item.originalPrice - item.price) / item.originalPrice) * 100;
    return Math.round(discount);
  }

  /**
   * Get billing period
   */
  getPeriod(item: PricingItem): string {
    return item.period || '/month';
  }

  /**
   * Get normalized features list
   */
  getFeatures(item: PricingItem): PricingFeature[] {
    if (!item.features) return [];

    return item.features.map(feature => {
      if (typeof feature === 'string') {
        return { text: feature, included: true };
      }
      return feature;
    });
  }

  /**
   * Get CTA text
   */
  getCtaText(item: PricingItem): string {
    if (item.available === false) return 'Coming Soon';
    return item.ctaText || 'Get Started';
  }

  /**
   * Check if item is featured
   */
  isFeatured(item: PricingItem): boolean {
    return item.featured === true;
  }

  /**
   * Toggle billing period
   */
  toggleBillingPeriod(): void {
    this.billingPeriod.update(current =>
      current === 'monthly' ? 'yearly' : 'monthly'
    );
  }

  /**
   * Handle CTA click
   */
  onCtaClick(item: PricingItem, event: Event): void {
    event.stopPropagation();

    this.emitItemInteraction(item, {
      sectionTitle: this.section.title,
      action: 'cta-click',
      planName: this.getPlanName(item),
      price: item.price
    });

    // Navigate if URL provided
    if (item.ctaUrl && item.available !== false) {
      window.open(item.ctaUrl, '_blank', 'noopener');
    }
  }

  override trackItem(index: number, item: PricingItem): string {
    return item.id ?? `pricing-${index}-${item.planName || ''}`;
  }
}

