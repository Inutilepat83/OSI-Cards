import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';

/**
 * Product Section Component
 *
 * Displays product information, features, specifications, and pricing.
 * Perfect for product catalogs, feature lists, and service offerings.
 */
@Component({
  selector: 'lib-product-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-section.component.html',
  styleUrl: './product-section.scss'
})
export class ProductSectionComponent extends BaseSectionComponent {

  /**
   * Get status class
   */
  getStatusClass(status?: string): string {
    if (!status) return '';
    return `product-status--${status}`;
  }
}
