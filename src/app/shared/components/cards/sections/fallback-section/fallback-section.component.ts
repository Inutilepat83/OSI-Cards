import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';

/**
 * Fallback Section Component
 * 
 * Generic fallback component for sections with unknown or unmatched types.
 * Provides a safe default rendering when section type cannot be resolved.
 * Inherits all base functionality from BaseSectionComponent.
 * 
 * This component is used when:
 * - Section type is not recognized
 * - Section type resolver returns 'fallback' or 'unknown'
 * - Section type is missing and cannot be inferred
 * 
 * @example
 * ```html
 * <app-fallback-section [section]="unknownSection"></app-fallback-section>
 * ```
 */
@Component({
  selector: 'app-fallback-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './fallback-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FallbackSectionComponent extends BaseSectionComponent<CardField> {
  // Fallback section - minimal implementation, inherits all base functionality
}
