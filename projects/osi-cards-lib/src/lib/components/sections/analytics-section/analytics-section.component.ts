import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent } from '../base-section.component';
import { SectionUtilsService } from '../../../services';

type AnalyticsField = CardField & {
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  percentage?: number;
};

@Component({
  selector: 'app-analytics-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './analytics-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsSectionComponent extends BaseSectionComponent<AnalyticsField> {
  readonly Math = Math;
  protected readonly utils = inject(SectionUtilsService);

  get fields(): AnalyticsField[] {
    return this.getFields() as AnalyticsField[];
  }

  onFieldClick(field: AnalyticsField): void {
    this.emitFieldInteraction(field);
  }

  getTrendIcon(field: AnalyticsField): string {
    return this.utils.getTrendIcon(field.trend ?? this.utils.calculateTrend(field.change));
  }

  getTrendClass(field: AnalyticsField): string {
    return this.utils.getTrendClass(field.trend ?? field.change);
  }

  formatChange(change?: number): string {
    return this.utils.formatChange(change);
  }

  /**
   * Get display value, hiding "Streaming…" placeholder text
   * Inline implementation to avoid TypeScript override conflicts
   */
  getDisplayValue(field: AnalyticsField): string {
    const value = field.value;
    if (value === 'Streaming…' || value === 'Streaming...') {
      return '';
    }
    return value != null ? String(value) : '';
  }

  /**
   * Check if percentage should be shown in meta
   * Only show if percentage exists and is not already included in the value
   */
  shouldShowPercentage(field: AnalyticsField): boolean {
    if (field.percentage === undefined) {
      return false;
    }
    
    const value = this.getDisplayValue(field);
    if (!value) {
      return false;
    }
    
    // Check if the value already contains the percentage
    // Remove % signs and compare numbers
    const valueWithoutPercent = value.replace(/%/g, '').trim();
    const percentageStr = String(field.percentage);
    
    // If value already contains the percentage number, don't show it again
    return !valueWithoutPercent.includes(percentageStr);
  }

  override trackField(index: number, field: AnalyticsField): string {
    return field.id ?? `${field.label}-${index}`;
  }

  /**
   * Generate accessible label for a metric field
   * Includes value, percentage if available, and change/trend info
   */
  getMetricAriaLabel(field: AnalyticsField): string {
    const parts: string[] = [];
    
    // Label and value
    parts.push(`${field.label}: ${this.getDisplayValue(field) || 'No value'}`);
    
    // Percentage if available
    if (field.percentage !== undefined) {
      parts.push(`${field.percentage}%`);
    }
    
    // Change/trend info
    if (field.change !== undefined) {
      const trend = field.trend ?? this.utils.calculateTrend(field.change);
      const trendText = trend === 'up' ? 'increased' : trend === 'down' ? 'decreased' : 'unchanged';
      parts.push(`${trendText} by ${this.formatChange(field.change)}`);
    }
    
    return parts.join(', ');
  }
}
