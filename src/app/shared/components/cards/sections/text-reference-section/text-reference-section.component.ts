import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';
import { CardField } from '../../../../../models';

type TextReferenceField = CardField & {
  text: string;
  referenceText?: string; // Use referenceText instead of reference to avoid conflict with CardField.reference
  source?: string;
  url?: string;
  date?: string;
  category?: string;
};

@Component({
  selector: 'app-text-reference-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './text-reference-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextReferenceSectionComponent extends BaseSectionComponent<TextReferenceField> {
  get fields(): TextReferenceField[] {
    return super.getFields() as TextReferenceField[];
  }

  override get hasFields(): boolean {
    return super.hasFields;
  }

  onReferenceClick(field: TextReferenceField): void {
    this.emitFieldInteraction(field, { sectionTitle: this.section.title });
  }

  openReference(field: TextReferenceField, event: Event): void {
    if (field.url) {
      event.stopPropagation();
      window.open(field.url, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Get display text, hiding "Streaming…" placeholder text
   * Inline implementation to avoid TypeScript override conflicts
   */
  getDisplayText(field: TextReferenceField): string {
    const text = field.text || field.value;
    if (text === 'Streaming…' || text === 'Streaming...') {
      return '';
    }
    return text != null ? String(text) : '';
  }
}
