import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';
import { CardField } from '../../../../../models';

type QuotationField = CardField & {
  quote: string;
  author?: string;
  source?: string;
  date?: string;
};

@Component({
  selector: 'app-quotation-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './quotation-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuotationSectionComponent extends BaseSectionComponent<QuotationField> {
  get fields(): QuotationField[] {
    return super.getFields() as QuotationField[];
  }

  override get hasFields(): boolean {
    return super.hasFields;
  }

  override trackField(index: number, field: QuotationField): string {
    return field.id || `${field.quote?.substring(0, 20)}-${index}` || String(index);
  }

  onQuotationClick(field: QuotationField): void {
    this.emitFieldInteraction(field, { sectionTitle: this.section.title });
  }

  /**
   * Get display quote, hiding "Streaming…" placeholder text
   */
  getDisplayQuote(field: QuotationField): string {
    const quote = field.quote || field.value;
    if (quote === 'Streaming…' || quote === 'Streaming...') {
      return '';
    }
    if (quote != null) {
      return String(quote);
    }
    return '';
  }
}

