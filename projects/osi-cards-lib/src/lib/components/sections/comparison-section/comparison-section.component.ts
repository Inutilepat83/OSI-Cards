import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardItem } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';

/**
 * Comparison feature row
 */
export interface ComparisonFeature {
  /** Feature name */
  name: string;
  /** Feature description */
  description?: string;
  /** Category for grouping */
  category?: string;
  /** Values for each item being compared */
  values: (boolean | string | number | null)[];
}

/**
 * Comparison item (column header)
 */
export interface ComparisonItem extends CardItem {
  /** Price or value */
  price?: string;
  /** Badge text (e.g., "Recommended") */
  badge?: string;
  /** Whether this is highlighted */
  highlighted?: boolean;
  /** Features specific to this item */
  features?: Record<string, boolean | string | number>;
}

/**
 * Comparison Section Component
 *
 * Displays a feature comparison table for products,
 * plans, or any comparable items.
 *
 * @example
 * ```html
 * <app-comparison-section [section]="comparisonSection"></app-comparison-section>
 * ```
 */
@Component({
  selector: 'app-comparison-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './comparison-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComparisonSectionComponent extends BaseSectionComponent<ComparisonItem> {
  /** Comparison sections need full width */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 4,
    minColumns: 2,
    maxColumns: 4,
  };

  /** Selected item index for mobile highlight */
  selectedIndex = signal<number>(0);

  get items(): ComparisonItem[] {
    return super.getItems() as ComparisonItem[];
  }

  /**
   * Get features from section metadata
   */
  get features(): ComparisonFeature[] {
    const sectionFeatures = this.section.meta?.['features'] as ComparisonFeature[] | undefined;
    if (sectionFeatures && Array.isArray(sectionFeatures)) {
      return sectionFeatures;
    }

    // Auto-generate features from items
    return this.generateFeaturesFromItems();
  }

  /**
   * Get feature categories
   */
  get categories(): string[] {
    const cats = new Set<string>();
    this.features.forEach(f => {
      if (f.category) cats.add(f.category);
    });
    return Array.from(cats);
  }

  /**
   * Get features by category
   */
  getFeaturesByCategory(category: string | null): ComparisonFeature[] {
    if (!category) {
      return this.features.filter(f => !f.category);
    }
    return this.features.filter(f => f.category === category);
  }

  /**
   * Generate features from item data
   */
  private generateFeaturesFromItems(): ComparisonFeature[] {
    const featureMap = new Map<string, (boolean | string | number | null)[]>();

    this.items.forEach((item, index) => {
      if (item.features) {
        Object.entries(item.features).forEach(([key, value]) => {
          if (!featureMap.has(key)) {
            featureMap.set(key, new Array(this.items.length).fill(null));
          }
          const values = featureMap.get(key);
          if (values) {
            values[index] = value;
          }
        });
      }
    });

    return Array.from(featureMap.entries()).map(([name, values]) => ({
      name,
      values
    }));
  }

  /**
   * Get feature value for a specific item
   */
  getFeatureValue(feature: ComparisonFeature, itemIndex: number): boolean | string | number | null {
    return feature.values[itemIndex] ?? null;
  }

  /**
   * Check if value is boolean
   */
  isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
  }

  /**
   * Check if value is truthy (for styling)
   */
  isTruthy(value: unknown): boolean {
    return value === true || (typeof value === 'string' && value.length > 0) || (typeof value === 'number' && value > 0);
  }

  /**
   * Format value for display
   */
  formatValue(value: boolean | string | number | null): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    return String(value);
  }

  /**
   * Select item (for mobile view)
   */
  selectItem(index: number): void {
    this.selectedIndex.set(index);
  }

  /**
   * Check if item is highlighted
   */
  isHighlighted(item: ComparisonItem): boolean {
    return item.highlighted === true;
  }

  onItemClick(item: ComparisonItem, index: number): void {
    this.emitItemInteraction(item, {
      sectionTitle: this.section.title,
      itemIndex: index
    });
  }

  override trackItem(index: number, item: ComparisonItem): string {
    return item.id ?? `comparison-${index}-${item.title || ''}`;
  }
}

