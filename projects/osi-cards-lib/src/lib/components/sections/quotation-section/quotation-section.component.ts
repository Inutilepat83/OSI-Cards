import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';

/**
 * Quotation Section Component
 *
 * Displays quotes, testimonials, and citations with attribution.
 * Perfect for customer feedback, expert opinions, and highlighted content.
 */
@Component({
  selector: 'lib-quotation-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quotation-section.component.html',
  styleUrl: './quotation-section.scss'
})
export class QuotationSectionComponent extends BaseSectionComponent {

  /**
   * Get quote text
   */
  getQuoteText(field: any): string {
    return field.value || field.quote || field.description || '';
  }

  /**
   * Get author name
   */
  getAuthorName(field: any): string {
    return field.author || field.label || '';
  }
}
