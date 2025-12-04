import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared Section Header Component
 *
 * Provides consistent header structure across all section types.
 * Displays section title (as specified heading level) and optional description.
 *
 * @example
 * ```html
 * <lib-section-header
 *   [title]="section.title"
 *   [description]="section.description"
 *   [level]="3">
 * </lib-section-header>
 * ```
 */
@Component({
  selector: 'lib-section-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderComponent {
  /**
   * Section title text
   */
  @Input() title?: string;

  /**
   * Optional section description
   */
  @Input() description?: string;

  /**
   * Heading level (h1-h6)
   * @default 3
   */
  @Input() level: 1 | 2 | 3 | 4 | 5 | 6 = 3;

  /**
   * Additional CSS classes for the header container
   */
  @Input() headerClass?: string;

  /**
   * Additional CSS classes for the title
   */
  @Input() titleClass?: string;

  /**
   * Additional CSS classes for the description
   */
  @Input() descriptionClass?: string;

  /**
   * Get the heading tag name based on level
   */
  get headingTag(): string {
    return `h${this.level}`;
  }
}
