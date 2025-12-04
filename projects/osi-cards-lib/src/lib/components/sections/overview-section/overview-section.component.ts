import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';
import { SectionHeaderComponent, EmptyStateComponent } from '../../shared';

/**
 * Overview Section Component
 *
 * Displays high-level summaries and executive dashboards.
 * Perfect for company profiles, key highlights, and quick insights.
 */
@Component({
  selector: 'lib-overview-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './overview-section.component.html',
  styleUrl: './overview-section.scss',
})
export class OverviewSectionComponent extends BaseSectionComponent {
  /**
   * Check if field should be highlighted
   */
  isHighlighted(field: any): boolean {
    return field.highlight === true;
  }
}
