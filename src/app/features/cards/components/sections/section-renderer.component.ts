import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../../../models/card.model';
import { OverviewSectionComponent } from './overview-section.component';
import { ListSectionComponent } from './list-section.component';
import { AnalyticsSectionComponent } from './analytics-section.component';
import { ContactSectionComponent } from './contact-section.component';
import { ProductSectionComponent } from './product-section.component';
import { SolutionsSectionComponent } from './solutions-section.component';
import { EventSectionComponent } from './event-section.component';
import { FinancialsSectionComponent } from './financials-section.component';
import { NetworkSectionComponent } from './network-section.component';

@Component({
  selector: 'app-section-renderer',
  standalone: true,
  imports: [
    CommonModule,
    OverviewSectionComponent,
    ListSectionComponent,
    AnalyticsSectionComponent,
    ContactSectionComponent,
    ProductSectionComponent,
    SolutionsSectionComponent,
    EventSectionComponent,
    FinancialsSectionComponent,
    NetworkSectionComponent,
  ],
  template: `
    <ng-container [ngSwitch]="section.type">
      <app-info-section *ngSwitchCase="'info'" [section]="section"></app-info-section>
      <app-overview-section *ngSwitchCase="'overview'" [section]="section"></app-overview-section>
      <app-list-section *ngSwitchCase="'list'" [section]="section"></app-list-section>
      <app-chart-section *ngSwitchCase="'chart'" [section]="section"></app-chart-section>
      <app-analytics-section
        *ngSwitchCase="'analytics'"
        [section]="section"
      ></app-analytics-section>
      <app-map-section *ngSwitchCase="'map'" [section]="section"></app-map-section>
      <app-contact-section *ngSwitchCase="'contact'" [section]="section"></app-contact-section>
      <app-product-section *ngSwitchCase="'product'" [section]="section"></app-product-section>
      <app-solutions-section
        *ngSwitchCase="'solutions'"
        [section]="section"
      ></app-solutions-section>
      <app-event-section *ngSwitchCase="'event'" [section]="section"></app-event-section>
      <app-financials-section
        *ngSwitchCase="'financials'"
        [section]="section"
      ></app-financials-section>
      <app-network-section *ngSwitchCase="'network'" [section]="section"></app-network-section>

      <!-- Placeholder for unimplemented section types -->
      <div *ngSwitchDefault class="section-placeholder">
        <h4>{{ section.title }}</h4>
        <p>Section type "{{ section.type }}" not yet implemented</p>
        <small>Coming soon...</small>
      </div>
    </ng-container>
  `,
  styles: [
    `
      .section-placeholder {
        padding: 2rem;
        text-align: center;
        background: #f8f9fa;
        border: 2px dashed #dee2e6;
        border-radius: 8px;
        color: #6c757d;
      }

      .section-placeholder h4 {
        margin: 0 0 0.5rem 0;
        color: #495057;
      }

      .section-placeholder p {
        margin: 0 0 0.5rem 0;
        font-style: italic;
      }

      .section-placeholder small {
        color: #9ca3af;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionRendererComponent {
  @Input() section!: CardSection;
}
