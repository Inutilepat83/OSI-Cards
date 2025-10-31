import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardSection } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

type AnalyticsField = CardField & {
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  percentage?: number;
};

interface AnalyticsFieldInteraction {
  field: AnalyticsField;
  metadata?: Record<string, unknown>;
}

@Component({
  selector: 'app-analytics-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './analytics-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsSectionComponent {
  readonly Math = Math;

  @Input({ required: true }) section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<AnalyticsFieldInteraction>();

  get fields(): AnalyticsField[] {
    return (this.section.fields as AnalyticsField[]) ?? [];
  }

  onFieldClick(field: AnalyticsField): void {
    this.fieldInteraction.emit({
      field,
      metadata: {
        sectionTitle: this.section.title
      }
    });
  }

  getTrendIcon(field: AnalyticsField): string {
    switch (field.trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'stable':
        return 'minus';
      default:
        return 'bar-chart-3';
    }
  }

  getTrendClass(field: AnalyticsField): string {
    switch (field.trend) {
      case 'up':
        return 'trend--up';
      case 'down':
        return 'trend--down';
      case 'stable':
        return 'trend--stable';
      default:
        return 'trend--neutral';
    }
  }
}
