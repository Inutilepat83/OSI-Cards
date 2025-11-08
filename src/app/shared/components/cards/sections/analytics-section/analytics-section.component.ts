import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';
import { SectionUtilsService } from '../../../../services/section-utils.service';

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
}
