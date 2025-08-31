import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { ToastModule } from 'primeng/toast';
import { HomeRoutingModule } from './home-routing.module';

import { HomePageComponent } from './components/home-page/home-page.component';
import { LanguageSelectorComponent } from '../../shared/components/language-selector.component';

@NgModule({
  declarations: [HomePageComponent],
  imports: [CommonModule, SharedModule, HomeRoutingModule, ToastModule, LanguageSelectorComponent],
})
export class HomeModule {}
