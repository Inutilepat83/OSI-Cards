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
import { QuotationSectionComponent } from '../sections/quotation-section/quotation-section.component';
import { TextReferenceSectionComponent } from '../sections/text-reference-section/text-reference-section.component';
import { BrandColorsSectionComponent } from '../sections/brand-colors-section/brand-colors-section.component';

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
    FallbackSectionComponent,
    QuotationSectionComponent,
    TextReferenceSectionComponent,
    BrandColorsSectionComponent
  ],
  templateUrl: './section-renderer.component.html',
  styleUrls: ['./section-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionRendererComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();

  // Removed @HostBinding - will be set in template instead to avoid setAttribute errors
  get sectionTypeAttribute(): string {
    if (!this.section) {
      return 'unknown';
    }
    try {
      const typeLabel = (this.section.type ?? '').trim();
      const resolved = this.resolvedType;
      return (typeLabel || resolved || 'unknown').toLowerCase();
    } catch {
      return 'unknown';
    }
  }

  get sectionIdAttribute(): string | null {
    if (!this.section?.id) {
      return null;
    }
    try {
      return String(this.section.id);
    } catch {
      return null;
    }
  }

  get resolvedType(): string {
    if (!this.section) {
      return 'unknown';
    }
    try {
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
    if (type === 'quotation' || type === 'quote') {
      return 'quotation';
    }
    if (type === 'text-reference' || type === 'reference' || type === 'text-ref') {
      return 'text-reference';
    }
    if (type === 'brand-colors' || type === 'brands' || type === 'colors') {
      return 'brand-colors';
    }
    if (!type) {
      if (title.includes('overview')) {
        return 'overview';
      }
      return 'fallback';
    }
    return type;
    } catch {
      return 'unknown';
    }
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
