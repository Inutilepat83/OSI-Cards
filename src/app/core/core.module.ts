import { NgModule, ErrorHandler, Optional, SkipSelf } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { EnhancedGlobalErrorHandler } from './error/enhanced-global-error-handler';
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor';
import { LoadingInterceptor } from './interceptors/loading.interceptor';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { SecurityInterceptor } from './interceptors/security.interceptor';
import { PerformanceMonitoringInterceptor } from './interceptors/performance-monitoring.interceptor';

// Service Interfaces and Implementations
import {
  LOGGING_SERVICE,
  NOTIFICATION_SERVICE,
  CACHE_SERVICE,
  CONFIGURATION_SERVICE,
} from './interfaces/injection-tokens';
import { PrimeNgNotificationService } from './services/primeng-notification.service';
import { MemoryCacheService } from './services/memory-cache.service';
import { LocalConfigurationService } from './services/local-configuration.service';
import { LoggingService } from './services/logging.service';

// Enhanced Services
import {
  LoggerService,
  EnhancedErrorHandlerService,
  AsyncOperationService,
} from './services/enhanced-logging.service';
import { EnhancedCacheService, ConfigurationService } from './services/enhanced-cache.service';
import {
  NotificationService,
  ToastService,
  ProgressNotificationService,
} from './services/notification.service';
import { PerformanceOptimizationService } from './performance/performance-optimization.service';

// Existing Services
import { StateService } from './state/state.service';
import { PerformanceService } from './performance/performance.service';
import { ConfigService } from './config/config.service';
import { LocalCardConfigurationService } from './services/local-card-configuration.service';
import { LocalInitializationService } from './services/local-initialization.service';
import { MagneticTiltService } from './services/magnetic-tilt.service';
import { MouseTrackingService } from './services/mouse-tracking.service';
import { I18nService } from './services/i18n.service';
import { ThemeService } from './services/theme.service';
import { SecurityService } from './services/security.service';
import { ValidationService } from './services/validation.service';
import { ConditionalServiceLoader } from './services/conditional-service-loader.service';

// Custom Translation Loader
export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`/assets/i18n/${lang}.json`);
  }
}

// Translation loader factory
export function HttpLoaderFactory(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

@NgModule({
  imports: [
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [
    // Enhanced Error Handler
    {
      provide: ErrorHandler,
      useClass: EnhancedGlobalErrorHandler,
    },

    // Service Interface Implementations
    {
      provide: LOGGING_SERVICE,
      useClass: LoggingService,
    },
    {
      provide: NOTIFICATION_SERVICE,
      useClass: PrimeNgNotificationService,
    },
    {
      provide: CACHE_SERVICE,
      useClass: MemoryCacheService,
    },
    {
      provide: CONFIGURATION_SERVICE,
      useClass: LocalConfigurationService,
    },

    // HTTP Interceptors (order matters!)
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: AuthInterceptor,
    //   multi: true,
    // },
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: LoadingInterceptor,
    //   multi: true,
    // },
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: CacheInterceptor,
    //   multi: true,
    // },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggingInterceptor,
      multi: true,
    },
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: SecurityInterceptor,
    //   multi: true,
    // },
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: PerformanceMonitoringInterceptor,
    //   multi: true,
    // },

    // Enhanced Services
    LoggerService,
    EnhancedErrorHandlerService,
    AsyncOperationService,
    EnhancedCacheService,
    ConfigurationService,
    NotificationService,
    ToastService,
    ProgressNotificationService,
    PerformanceOptimizationService,

    // Essential Services (always loaded)
    StateService,
    PerformanceService,
    ConfigService,
    LocalCardConfigurationService,
    LocalInitializationService,
    MagneticTiltService,
    MouseTrackingService,
    I18nService,
    ThemeService,
    SecurityService,
    ValidationService,

    // Conditionally loaded services (loaded on demand)
    ConditionalServiceLoader,

    // PrimeNG MessageService for toast notifications
    MessageService,
  ],
})
export class CoreModule {
  constructor(
    @Optional() @SkipSelf() parentModule: CoreModule,
    private conditionalLoader: ConditionalServiceLoader,
    private logger: LoggingService // added LoggingService
  ) {
    // Prevent multiple instantiation
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only.');
    }

    this.logger.log('CoreModule', 'Enhanced Core module initialized');

    // Conditionally load accessibility service
    this.conditionalLoader
      .loadAccessibility()
      .then(accessibility => {
        if (accessibility && typeof accessibility.initialize === 'function') {
          accessibility.initialize();
        }
      })
      .catch(err => {
        this.logger.warn('CoreModule', 'Accessibility service not available', err);
      });
  }
}
