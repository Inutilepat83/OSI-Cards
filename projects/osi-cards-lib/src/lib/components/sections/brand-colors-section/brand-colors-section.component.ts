import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BaseSectionComponent } from '../base-section.component';

/**
 * Brand Colors Section Component
 *
 * Displays color swatches with names, hex/RGB values, and usage descriptions.
 * Perfect for brand identity, design systems, and style guides.
 */
@Component({
  selector: 'lib-brand-colors-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './brand-colors-section.component.html',
  styleUrl: './brand-colors-section.scss',
})
export class BrandColorsSectionComponent extends BaseSectionComponent {
  /**
   * Check if value is a valid color (hex, rgb, rgba, hsl)
   */
  isValidColor(value: any): boolean {
    if (!value || typeof value !== 'string') return false;

    // Check common color formats
    const hexPattern = /^#([0-9A-F]{3}){1,2}$/i;
    const rgbPattern = /^rgba?\(/i;
    const hslPattern = /^hsla?\(/i;

    return hexPattern.test(value) || rgbPattern.test(value) || hslPattern.test(value);
  }

  /**
   * Copy color value to clipboard
   */
  async copyColor(value: any): Promise<void> {
    if (navigator.clipboard && value && typeof value === 'string') {
      try {
        await navigator.clipboard.writeText(value);
      } catch (err) {
        console.warn('Failed to copy color', err);
      }
    }
  }
}
