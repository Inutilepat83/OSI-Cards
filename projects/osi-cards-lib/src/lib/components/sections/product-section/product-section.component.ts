import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';
import { SectionHeaderComponent, EmptyStateComponent, BadgeComponent } from '../../shared';

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
})
export class ProductSectionComponent extends BaseSectionComponent {
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
