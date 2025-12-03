import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';
import { SectionHeaderComponent, EmptyStateComponent, BadgeComponent } from '../../shared';

/**
 * Fallback Section Component
 *
 * Default renderer for unknown or unsupported section types.
 * Displays available data in a readable format for debugging.
 */
@Component({
  selector: 'lib-fallback-section',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './fallback-section.component.html',
  styleUrl: './fallback-section.scss'
})
export class FallbackSectionComponent extends BaseSectionComponent {

  /**
   * Get section type display
   */
  getSectionType(): string {
    return this.section?.type || 'unknown';
  }
}
