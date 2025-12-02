import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';
import { SectionHeaderComponent, EmptyStateComponent } from '../../shared';

/**
 * Text Reference Section Component
 *
 * Displays reference materials, citations, and documentation links.
 * Perfect for articles, research summaries, and resource libraries.
 */
@Component({
  selector: 'lib-text-reference-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './text-reference-section.component.html',
  styleUrl: './text-reference-section.scss'
})
export class TextReferenceSectionComponent extends BaseSectionComponent {

  /**
   * Get reference title
   */
  getReferenceTitle(field: any): string {
    return field.value || field.title || field.label || 'Reference';
  }

  /**
   * Get reference content
   */
  getReferenceContent(field: any): string {
    return field.text || field.description || '';
  }
}
