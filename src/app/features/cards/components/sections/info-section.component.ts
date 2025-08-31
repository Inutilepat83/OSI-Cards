import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CardSection, CardField } from '../../../../models/card.model';

@Component({
  selector: 'app-info-section',
  templateUrl: './info-section.component.html',
  styleUrls: ['./info-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoSectionComponent {
  @Input() section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<any>();

  trackByFn(index: number, item: CardField): string {
    return item.id || index.toString();
  }

  onFieldClick(field: CardField): void {
    this.fieldInteraction.emit({
      field: field,
      section: this.section,
      action: 'click',
    });
  }
}
