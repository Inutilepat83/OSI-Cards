import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardSection } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

type FinancialField = CardField & {
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  format?: string;
};

interface FinancialFieldInteraction {
  field: FinancialField;
  metadata?: Record<string, unknown>;
}

@Component({
  selector: 'app-financials-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './financials-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinancialsSectionComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<FinancialFieldInteraction>();

  get fields(): FinancialField[] {
    return (this.section.fields as FinancialField[]) ?? [];
  }

  onFieldClick(field: FinancialField): void {
    this.fieldInteraction.emit({
      field,
      metadata: {
        sectionId: this.section.id
      }
    });
  }

  getTrendIcon(field: FinancialField): string | null {
    switch (field.trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'stable':
        return 'minus';
      default:
        return null;
    }
  }

  getChangeClass(field: FinancialField): string {
    if (field.change === undefined || field.change === null) {
      return 'text-muted-foreground';
    }
    if (field.change > 0) {
      return 'text-emerald-400';
    }
    if (field.change < 0) {
      return 'text-rose-400';
    }
    return 'text-amber-400';
  }
}
