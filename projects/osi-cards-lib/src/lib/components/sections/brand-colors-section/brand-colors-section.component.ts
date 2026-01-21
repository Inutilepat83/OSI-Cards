import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, isDevMode, ChangeDetectionStrategy } from '@angular/core';
import { CardSection } from '../../../models';
import { SectionLayoutPreferenceService } from '../../../services';
import { safeDebugFetch } from '../../../utils';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
// #region agent log - Track module evaluation start
if (typeof window !== 'undefined') {
  safeDebugFetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
    location: 'brand-colors-section.component.ts:1',
    message: 'Module evaluation START - brand-colors-section.component.ts',
    data: { timestamp: Date.now(), moduleId: 'brand-colors' },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run2',
    hypothesisId: 'C',
  });
}
// #endregion
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
// #region agent log - Check BaseSectionComponent after import
const baseClassCheck = {
  imported: typeof BaseSectionComponent !== 'undefined',
  isConstructor: typeof BaseSectionComponent === 'function',
  isUndefined: typeof BaseSectionComponent === 'undefined',
  isNull: BaseSectionComponent === null,
  name: BaseSectionComponent?.name || 'undefined',
  hasStaticProp: !!BaseSectionComponent?.__DEBUG_BASE_CLASS_DEFINED,
  globalAvailable: !!(typeof window !== 'undefined' && (window as any).__BaseSectionComponent),
  globalForcedAvailable: !!(
    typeof window !== 'undefined' && (window as any).__BaseSectionComponentForced
  ),
  referencesMatch:
    typeof window !== 'undefined' &&
    (window as any).__BaseSectionComponent === BaseSectionComponent,
};
if (baseClassCheck.isUndefined || baseClassCheck.isNull || !baseClassCheck.isConstructor) {
  console.error('[FATAL] BaseSectionComponent is invalid after import!', baseClassCheck);
  if (typeof window !== 'undefined' && (window as any).__BaseSectionComponent) {
    console.error(
      '[FATAL] Global fallback exists but cannot use in extends clause - this is the root cause!'
    );
  }
}
console.log('[DEBUG] BaseSectionComponent import check:', baseClassCheck);
if (typeof window !== 'undefined') {
  safeDebugFetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
    location: 'brand-colors-section.component.ts:11',
    message: 'Import BaseSectionComponent - checking value',
    data: baseClassCheck,
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run3',
    hypothesisId: 'B',
  });
}
// #endregion

/**
 * Brand Colors Section Component
 *
 * Displays color swatches with names, hex/RGB values, and usage descriptions.
 * Perfect for brand identity, design systems, and style guides.
 */
@Component({
  selector: 'lib-brand-colors-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './brand-colors-section.component.html',
  styleUrl: './brand-colors-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandColorsSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register(
      'brand-colors',
      (section: CardSection, availableColumns: number) => {
        return this.calculateBrandColorsLayoutPreferences(section, availableColumns);
      }
    );
  }

  /**
   * Calculate layout preferences for brand colors section based on content.
   * Brand colors sections: 2 cols default, can shrink to 1, expands to 3 for many colors
   */
  private calculateBrandColorsLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const fields = section.fields ?? [];
    const fieldCount = fields.length;

    // Brand colors sections: 2 cols default, can shrink to 1, expands to 3 for many colors
    let preferredColumns: 1 | 2 | 3 | 4 = 2;
    if (fieldCount >= 6 && availableColumns >= 3) {
      preferredColumns = 3;
    }
    if (fieldCount <= 2) {
      preferredColumns = 1;
    }

    // Respect explicit preferences
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 1) as 1 | 2 | 3 | 4,
      maxColumns: Math.min((section.maxColumns ?? 3) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 22, // Higher priority for shrinking (promotes side-by-side placement)
      expandOnContent: {
        fieldCount: 6, // Expand to 3 columns at 6+ colors
      },
    };
  }

  /**
   * Get layout preferences for brand colors section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateBrandColorsLayoutPreferences(this.section, availableColumns);
  }
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
        // Only warn in development mode - clipboard failures are non-critical
        if (isDevMode()) {
          console.warn('Failed to copy color', err);
        }
      }
    }
  }
}
