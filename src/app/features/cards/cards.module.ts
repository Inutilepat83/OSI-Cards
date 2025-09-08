import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { CardsRoutingModule } from './cards-routing.module';

import { ParticleSystemComponent } from './components/particle-system/particle-system.component';
import { InfoSectionComponent } from './components/sections/info-section.component';
import { ChartSectionComponent } from './components/sections/chart-section.component';
import { MapSectionComponent } from './components/sections/map-section.component';
import { SingleCardComponent } from './components/single-card/single-card.component';
import { TimelineSectionComponent } from './components/sections/timeline-section.component';
import { MetricsSectionComponent } from './components/sections/metrics-section.component';
import { TableSectionComponent } from './components/sections/table-section.component';
import { ProgressSectionComponent } from './components/sections/progress-section.component';

@NgModule({
  declarations: [
    ParticleSystemComponent,
    InfoSectionComponent,
    ChartSectionComponent,
    MapSectionComponent,
    SingleCardComponent,
    TimelineSectionComponent,
    MetricsSectionComponent,
    TableSectionComponent,
    ProgressSectionComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    CardsRoutingModule
  ],
  exports: [
    InfoSectionComponent,
    ChartSectionComponent,
    MapSectionComponent,
    TimelineSectionComponent,
    MetricsSectionComponent,
    TableSectionComponent,
    ProgressSectionComponent
  ]
})
export class CardsModule {}


