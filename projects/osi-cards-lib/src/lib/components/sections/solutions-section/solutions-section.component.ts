import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';
import { SectionHeaderComponent, EmptyStateComponent, BadgeComponent } from '../../shared';

/**
 * Solutions Section Component
 *
 * Displays solution offerings, use cases, and service information.
 * Features: benefits, complexity indicators, delivery timeframes.
 */
@Component({
  selector: 'lib-solutions-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, BadgeComponent],
  templateUrl: './solutions-section.component.html',
  styleUrl: './solutions-section.scss'
})
export class SolutionsSectionComponent extends BaseSectionComponent {

  /**
   * Get complexity class (deprecated)
   */
  getComplexityClass(complexity?: string): string {
    if (!complexity) return '';
    return `complexity--${complexity}`;
  }

  /**
   * Map complexity to badge variant
   */
  getComplexityVariant(complexity?: string): 'success' | 'warning' | 'error' | 'default' {
    if (!complexity) return 'default';
    const complexityLower = complexity.toLowerCase();
    if (complexityLower === 'low' || complexityLower === 'simple') return 'success';
    if (complexityLower === 'medium' || complexityLower === 'moderate') return 'warning';
    if (complexityLower === 'high' || complexityLower === 'complex') return 'error';
    return 'default';
  }
}
