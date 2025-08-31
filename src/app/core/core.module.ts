import { NgModule, ErrorHandler } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { GlobalErrorHandler } from './error/global-error-handler';
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { StateService } from './state/state.service';
import { PerformanceService } from './performance/performance.service';
import { AccessibilityService } from './accessibility/accessibility.service';
import { ConfigService } from './config/config.service';
import { LocalCardConfigurationService } from './services/local-card-configuration.service';
import { LocalInitializationService } from './services/local-initialization.service';
import { MagneticTiltService } from './services/magnetic-tilt.service';
import { MouseTrackingService } from './services/mouse-tracking.service';

@NgModule({
  providers: [
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggingInterceptor,
      multi: true
    },
    StateService,
    PerformanceService,
    AccessibilityService,
    ConfigService,
    LocalCardConfigurationService,
    LocalInitializationService,
    MagneticTiltService,
    MouseTrackingService
  ]
})
export class CoreModule {
  constructor(
    private accessibilityService: AccessibilityService
  ) {
    console.log('Core module initialized');
    this.accessibilityService.initialize();
  }
}
