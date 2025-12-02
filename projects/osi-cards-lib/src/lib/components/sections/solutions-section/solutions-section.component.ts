import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';

/**
 * Solutions Section Component
 *
 * Displays solution offerings, use cases, and service information.
 * Features: benefits, complexity indicators, delivery timeframes.
 */
@Component({
  selector: 'lib-solutions-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solutions-section.component.html',
  styleUrl: './solutions-section.scss'
})
export class SolutionsSectionComponent extends BaseSectionComponent {

  /**
   * Get complexity class
   */
  getComplexityClass(complexity?: string): string {
    if (!complexity) return '';
    return `complexity--${complexity}`;
  }
}
