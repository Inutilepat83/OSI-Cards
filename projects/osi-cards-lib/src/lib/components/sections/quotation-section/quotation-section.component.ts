import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';
import { CardField } from '../../../models';

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
  /** Narrow text works best in single column */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 1,
    minColumns: 1,
    maxColumns: 2,
    expandOnDescriptionLength: 200,
  };
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
   * Inline implementation to avoid TypeScript override conflicts
   */
  getDisplayQuote(field: QuotationField): string {
    const quote = field.quote || field.value;
    if (quote === 'Streaming…' || quote === 'Streaming...') {
      return '';
    }
    return quote != null ? String(quote) : '';
  }
}

