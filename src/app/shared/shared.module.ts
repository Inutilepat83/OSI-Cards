import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';

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
import { VirtualListComponent } from './components/virtual-list/virtual-list.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { ErrorBoundaryComponent } from './components/error-boundary/error-boundary.component';
import { GlobalErrorBoundaryComponent } from './components/global-error-boundary.component';
import { PerformanceDashboardComponent } from './components/performance-dashboard.component';
import { OfflineIndicatorComponent } from './components/offline-indicator.component';
import { LazyImageDirective } from './directives/lazy-image.directive';
import { ErrorBoundaryDirective } from './directives/error-boundary.directive';

@NgModule({
  declarations: [
    AICardRendererComponent,
    TiltWrapperComponent,
    VirtualListComponent,
    ThemeToggleComponent,
    ErrorBoundaryComponent,
    GlobalErrorBoundaryComponent,
    PerformanceDashboardComponent,
    OfflineIndicatorComponent,
    LazyImageDirective,
    ErrorBoundaryDirective,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ScrollingModule,

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
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ScrollingModule,

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
    TiltWrapperComponent,
    VirtualListComponent,
    ThemeToggleComponent,
    ErrorBoundaryComponent,
    GlobalErrorBoundaryComponent,
    PerformanceDashboardComponent,
    OfflineIndicatorComponent,
    LazyImageDirective,
    ErrorBoundaryDirective,
  ],
})
export class SharedModule {}
