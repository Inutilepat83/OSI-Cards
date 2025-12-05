import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { EmptyStateComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

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
  styleUrl: './fallback-section.scss',
})
export class FallbackSectionComponent extends BaseSectionComponent {
  /**
   * Get section type display
   */
  getSectionType(): string {
    return this.section?.type || 'unknown';
  }

  /**
   * Get layout preferences for fallback section.
   * Uses default implementation from BaseSectionComponent.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    // Fallback sections use the default implementation from BaseSectionComponent
    return super.getLayoutPreferences(availableColumns);
  }
}
