import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CardSection } from '@osi-cards/models';
import { ClipboardService, ToastService } from '@osi-cards/services';
import { SectionLayoutPreferenceService } from '@osi-cards/services';
import { LucideIconsModule } from '@osi-cards/icons';
import { safeDebugFetch } from '@osi-cards/utils';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

/**
 * Overview Section Component
 *
 * Displays high-level summaries, executive dashboards, and key highlights.
 * Supports newline characters in field values for better text formatting.
 */
@Component({
  selector: 'lib-overview-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, LucideIconsModule],
  templateUrl: './overview-section.component.html',
  styleUrl: './overview-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly toastService = inject(ToastService);

  // Signal to track copy state for visual feedback
  readonly isCopied = signal(false);

  ngOnInit(): void {
    // #region agent log
    if (typeof window !== 'undefined') {
      safeDebugFetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
        location: 'overview-section.component.ts:28',
        message: 'OverviewSectionComponent: ngOnInit',
        data: {
          sectionType: this.section?.type,
          sectionTitle: this.section?.title,
          fieldsCount: this.section?.fields?.length || 0,
          itemsCount: this.section?.items?.length || 0,
          fields: this.section?.fields,
          hasFields: this.hasFields,
          getFieldsResult: this.getFields(),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'H1',
      });
    }
    // #endregion

    // Register layout preference function for this section type
    this.layoutService.register('overview', (section: CardSection, availableColumns: number) => {
      return this.calculateOverviewLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for overview section based on content.
   * Overview sections: 1 col default, can expand to 2
   */
  private calculateOverviewLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const fields = section.fields ?? [];
    const fieldCount = fields.length;

    // Overview sections: 1 col default, can expand to 2
    let preferredColumns: 1 | 2 | 3 | 4 = 1;
    if (fieldCount >= 6) {
      preferredColumns = 2;
    }

    // Respect explicit preferences
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 1) as 1 | 2 | 3 | 4,
      maxColumns: Math.min((section.maxColumns ?? 2) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 15,
      expandOnContent: {
        fieldCount: 6, // Expand to 2 columns at 6+ fields
      },
    };
  }

  /**
   * Get layout preferences for overview section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateOverviewLayoutPreferences(this.section, availableColumns);
  }

  /**
   * Format field value, converting newlines to HTML breaks
   * For single text blocks (empty label), also style uppercase section headers
   */
  formatFieldValue(field: any): string {
    const value = this.getFieldValue(field);
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);

    // If this is a single text block (no label), style uppercase headers
    if (!field.label) {
      // Split by lines and process each line
      const lines = stringValue.split('\n');
      const processedLines = lines.map((line, index) => {
        const trimmed = line.trim();
        // Check if line is an uppercase header (all caps, reasonable length, no lowercase letters)
        if (
          trimmed.length > 0 &&
          trimmed.length <= 50 &&
          trimmed === trimmed.toUpperCase() &&
          /^[A-Z\s&•\-]+$/.test(trimmed) &&
          trimmed.length >= 2
        ) {
          // This is a section header
          return `<span class="section-header">${trimmed}</span>`;
        }
        return line;
      });
      // Convert newlines to <br> tags for HTML rendering
      return processedLines.join('<br>');
    }

    // Convert newlines to <br> tags for HTML rendering
    return stringValue.replace(/\n/g, '<br>');
  }

  /**
   * Copy section content to clipboard
   */
  async onCopySection(): Promise<void> {
    const fields = this.getFields();
    if (!fields || fields.length === 0) {
      return;
    }

    // Build text content from all fields
    const textParts: string[] = [];

    // Add title if available
    if (this.section.title) {
      textParts.push(this.section.title);
    }

    // Add description if available
    if (this.section.description) {
      textParts.push(this.section.description);
    }

    // Add field content
    fields.forEach((field) => {
      const value = this.getFieldValue(field);
      if (value !== null && value !== undefined) {
        const stringValue = String(value);
        if (field.label) {
          textParts.push(`${field.label}: ${stringValue}`);
        } else {
          textParts.push(stringValue);
        }
      }
    });

    const textToCopy = textParts.join('\n\n');

    try {
      await this.clipboardService.copy(textToCopy);

      // Show success toast notification
      this.toastService.success('Copied!', { duration: 2000 });

      // Visual feedback: change icon to checkmark temporarily
      this.isCopied.set(true);

      // Reset icon after 2 seconds
      setTimeout(() => {
        this.isCopied.set(false);
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to copy section content to clipboard', errorMessage);
      this.toastService.error('Failed to copy', { duration: 3000 });
    }
  }
}
