import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { CardsRoutingModule } from './cards-routing.module';

@NgModule({
  declarations: [
    // Components will be declared here when they exist
  ],
  imports: [CommonModule, SharedModule, CardsRoutingModule],
})
export class CardsModule {}
