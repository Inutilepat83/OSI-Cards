import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';

// Components
import { AICardRendererComponent } from './components/ai-card-renderer.component';
import { TiltWrapperComponent } from './components/tilt-wrapper/tilt-wrapper.component';

@NgModule({
  declarations: [
    AICardRendererComponent,
    TiltWrapperComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // Material Modules
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,

    // PrimeNG Modules
    ButtonModule,
    InputTextareaModule,
    ToastModule,
    CardModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // Material Modules
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,

    // PrimeNG Modules
    ButtonModule,
    InputTextareaModule,
    ToastModule,
    CardModule,

    // Components
    AICardRendererComponent,
    TiltWrapperComponent
  ]
})
export class SharedModule {}

