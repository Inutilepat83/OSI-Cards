import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';

// Essential Material Imports (commonly used)
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

// Essential PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';

// Core Components (lightweight)
import { TiltWrapperComponent } from './components/tilt-wrapper/tilt-wrapper.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { ErrorBoundaryComponent } from './components/error-boundary/error-boundary.component';
import { LazyImageDirective } from './directives/lazy-image.directive';
import { ErrorBoundaryDirective } from './directives/error-boundary.directive';

/**
 * Core shared module with essential components
 * Heavy components are lazy-loaded separately
 */
@NgModule({
  declarations: [
    TiltWrapperComponent,
    ThemeToggleComponent,
    ErrorBoundaryComponent,
    LazyImageDirective,
    ErrorBoundaryDirective,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ScrollingModule,

    // Essential Material Modules
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,

    // Essential PrimeNG Modules
    ButtonModule,
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
    MatIconModule,

    // PrimeNG Modules
    ButtonModule,
    ToastModule,
    CardModule,

    // Core Components
    TiltWrapperComponent,
    ThemeToggleComponent,
    ErrorBoundaryComponent,
    LazyImageDirective,
    ErrorBoundaryDirective,
  ],
})
export class SharedModule {}

/**
 * Extended Material module - imports additional modules
 */
@NgModule({
  imports: [CommonModule],
  exports: [],
})
export class MaterialExtensionsModule {
  static async forRoot() {
    // These will be loaded when the module is actually imported
    return {
      ngModule: MaterialExtensionsModule,
      providers: [],
    };
  }
}

/**
 * Heavy components module - lazy loaded
 */
@NgModule({
  declarations: [],
  imports: [CommonModule, SharedModule],
  exports: [],
})
export class HeavyComponentsModule {
  static async load() {
    const [
      { AICardRendererComponent },
      { VirtualListComponent },
      { GlobalErrorBoundaryComponent },
      { PerformanceDashboardComponent },
    ] = await Promise.all([
      import('./components/ai-card-renderer.component'),
      import('./components/virtual-list/virtual-list.component'),
      import('./components/global-error-boundary.component'),
      import('./components/performance-dashboard.component'),
    ]);

    return {
      AICardRendererComponent,
      VirtualListComponent,
      GlobalErrorBoundaryComponent,
      PerformanceDashboardComponent,
    };
  }
}
