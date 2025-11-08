import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardAction, CardField, CardItem, CardSection } from '../../../../models';
import { InfoSectionComponent, InfoSectionFieldInteraction } from '../sections/info-section.component';
import { AnalyticsSectionComponent } from '../sections/analytics-section/analytics-section.component';
import { FinancialsSectionComponent } from '../sections/financials-section/financials-section.component';
import { ListSectionComponent } from '../sections/list-section/list-section.component';
import { EventSectionComponent } from '../sections/event-section/event-section.component';
import { ProductSectionComponent } from '../sections/product-section/product-section.component';
import { SolutionsSectionComponent } from '../sections/solutions-section/solutions-section.component';
import { ContactCardSectionComponent } from '../sections/contact-card-section/contact-card-section.component';
import { NetworkCardSectionComponent } from '../sections/network-card-section/network-card-section.component';
import { MapSectionComponent } from '../sections/map-section/map-section.component';
import { ChartSectionComponent } from '../sections/chart-section/chart-section.component';
import { OverviewSectionComponent } from '../sections/overview-section/overview-section.component';
import { FallbackSectionComponent } from '../sections/fallback-section/fallback-section.component';

export interface SectionRenderEvent {
  type: 'field' | 'item' | 'action';
  section: CardSection;
  field?: CardField;
  item?: CardItem | CardField;
  action?: CardAction;
  metadata?: Record<string, unknown>;
}

@Component({
  selector: 'app-section-renderer',
  standalone: true,
  imports: [
    CommonModule,
    InfoSectionComponent,
    AnalyticsSectionComponent,
    FinancialsSectionComponent,
    ListSectionComponent,
    EventSectionComponent,
    ProductSectionComponent,
    SolutionsSectionComponent,
    ContactCardSectionComponent,
    NetworkCardSectionComponent,
    MapSectionComponent,
    ChartSectionComponent,
    OverviewSectionComponent,
    FallbackSectionComponent
  ],
  templateUrl: './section-renderer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionRendererComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();

  get resolvedType(): string {
    const type = (this.section.type ?? '').toLowerCase();
    const title = (this.section.title ?? '').toLowerCase();

    if (type === 'info' && title.includes('overview')) {
      return 'overview';
    }
    if (type === 'timeline') {
      return 'event';
    }
    if (type === 'metrics' || type === 'stats') {
      return 'analytics';
    }
    if (type === 'table') {
      return 'list';
    }
    if (type === 'project') {
      return 'info';
    }
    if (type === 'locations') {
      return 'map';
    }
    if (!type) {
      if (title.includes('overview')) {
        return 'overview';
      }
      return 'fallback';
    }
    return type;
  }

  onInfoFieldInteraction(event: InfoSectionFieldInteraction): void {
    this.sectionEvent.emit({
      type: 'field',
      section: this.section,
      field: event.field,
      metadata: { sectionTitle: event.sectionTitle }
    });
  }

  emitFieldInteraction(field: CardField, metadata?: Record<string, unknown>): void {
    this.sectionEvent.emit({
      type: 'field',
      section: this.section,
      field,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title,
        ...metadata
      }
    });
  }

  emitItemInteraction(item: CardItem | CardField, metadata?: Record<string, unknown>): void {
    this.sectionEvent.emit({
      type: 'item',
      section: this.section,
      item,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title,
        ...metadata
      }
    });
  }

  emitActionInteraction(action: CardAction, metadata?: Record<string, unknown>): void {
    this.sectionEvent.emit({
      type: 'action',
      section: this.section,
      action,
      metadata
    });
  }
}
