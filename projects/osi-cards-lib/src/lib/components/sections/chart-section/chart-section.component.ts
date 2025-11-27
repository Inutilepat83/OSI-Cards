import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent } from '../base-section.component';

type ChartField = CardField & {
  value: number;
  color?: string;
};

@Component({
  selector: 'app-chart-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './chart-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartSectionComponent extends BaseSectionComponent<ChartField> {

  private readonly palette: string[] = ['#FF7900', '#FF9A3C', '#CC5F00', '#FFB873', '#FFD8B0'];

  get chartType(): string {
    return (this.section.chartType ?? 'bar').toLowerCase();
  }

  get fields(): ChartField[] {
    const data = super.getFields();
    return data
      .filter((field): field is ChartField => typeof field.value === 'number')
      .map((field) => ({ ...field, value: Number(field.value) }));
  }

  override get hasFields(): boolean {
    return this.fields.length > 0;
  }

  get hasData(): boolean {
    return this.fields.length > 0;
  }

  get maxValue(): number {
    if (!this.hasData) {
      return 0;
    }
    return Math.max(...this.fields.map((field) => field.value));
  }

  get totalValue(): number {
    if (!this.hasData) {
      return 0;
    }
    return this.fields.reduce((total, field) => total + field.value, 0);
  }

  onFieldClick(field: ChartField): void {
    this.emitFieldInteraction(field);
  }

  getBarWidth(field: ChartField): string {
    if (!this.maxValue) {
      return '0%';
    }
    const percentage = Math.min((field.value / this.maxValue) * 100, 100);
    return `${percentage}%`;
  }

  getPercentage(field: ChartField): string {
    if (!this.totalValue) {
      return '0%';
    }
    return `${((field.value / this.totalValue) * 100).toFixed(1)}%`;
  }

  getChartIcon(): string {
    switch (this.chartType) {
      case 'pie':
      case 'doughnut':
        return 'pie-chart';
      case 'line':
        return 'trending-up';
      default:
        return 'bar-chart-3';
    }
  }

  getColor(field: ChartField, index: number): string {
    return field.color ?? (this.palette[index % this.palette.length] || '#FF7900');
  }

  /**
   * Get display value, hiding "Streaming…" placeholder text
   * Inline implementation to avoid TypeScript override conflicts
   */
  getDisplayValue(field: ChartField): string {
    const value = field.value;
    // Chart values are numbers, but check string representation just in case
    if (typeof value === 'string' && (value === 'Streaming…' || value === 'Streaming...')) {
      return '';
    }
    return String(value ?? '');
  }

  override trackField(index: number, field: ChartField): string {
    return field.id ?? `${field.label ?? field.title}-${index}`;
  }
}
