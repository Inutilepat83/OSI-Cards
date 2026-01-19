import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CardSection } from '@osi-cards/models';
import { SectionLayoutPreferenceService } from '@osi-cards/services';
import { BadgeComponent, EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

/**
 * Product Section Component
 *
 * Displays product information, features, specifications, and pricing.
 * Perfect for product catalogs, feature lists, and service offerings.
 */
@Component({
  selector: 'lib-product-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, BadgeComponent],
  templateUrl: './product-section.component.html',
  styleUrl: './product-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('product', (section: CardSection, availableColumns: number) => {
      return this.calculateProductLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for product section based on content.
   * Product sections: 2 cols default, can shrink to 1, expands based on item count
   */
  private calculateProductLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const items = section.items ?? [];
    const itemCount = items.length;

    // Product sections: 2 cols default, can shrink to 1, expands based on item count
    let preferredColumns: 1 | 2 | 3 | 4 = 2;
    if (itemCount >= 5 && availableColumns >= 3) {
      preferredColumns = 3;
    }
    if (itemCount <= 2) {
      preferredColumns = 1;
    }

    // Respect explicit preferences
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 1) as 1 | 2 | 3 | 4,
      maxColumns: Math.min((section.maxColumns ?? 3) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 22, // Higher priority for shrinking (promotes side-by-side placement)
      expandOnContent: {
        itemCount: 5, // Expand to 3 columns at 5+ products
      },
    };
  }

  /**
   * Get layout preferences for product section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateProductLayoutPreferences(this.section, availableColumns);
  }
  /**
   * Get status class (deprecated)
   */
  getStatusClass(status?: string): string {
    if (!status) return '';
    return `product-status--${status}`;
  }

  /**
   * Map status to badge variant
   */
  getStatusVariant(status?: string): 'success' | 'warning' | 'error' | 'primary' | 'default' {
    if (!status) return 'default';
    const statusLower = status.toLowerCase();
    if (statusLower === 'available' || statusLower === 'in-stock') return 'success';
    if (statusLower === 'active' || statusLower === 'new') return 'primary';
    if (statusLower === 'low-stock' || statusLower === 'limited') return 'warning';
    if (statusLower === 'out-of-stock' || statusLower === 'discontinued') return 'error';
    return 'default';
  }
}
