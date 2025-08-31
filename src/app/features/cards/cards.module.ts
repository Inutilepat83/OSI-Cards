import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { CardsRoutingModule } from './cards-routing.module';

import { ParticleSystemComponent } from './components/particle-system/particle-system.component';
import { InfoSectionComponent } from './components/sections/info-section.component';
import { ChartSectionComponent } from './components/sections/chart-section.component';
import { MapSectionComponent } from './components/sections/map-section.component';
import { CardsContainerComponent } from './components/cards-container/cards-container.component';

@NgModule({
  declarations: [
    CardsContainerComponent,
    ParticleSystemComponent,
    InfoSectionComponent,
    ChartSectionComponent,
    MapSectionComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    CardsRoutingModule
  ]
})
export class CardsModule {}


