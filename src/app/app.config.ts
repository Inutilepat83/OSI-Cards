import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  ErrorHandler,
  inject,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withPreloading } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { DocsPreloadingStrategy } from './core/strategies/docs-preloading.strategy';
// NgDoc imports removed - using custom documentation system for Angular 20 compatibility

import { ThemeService } from '../../projects/osi-cards-lib/src/lib/themes/theme.service';
import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/error-handlers/global-error-handler';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { HttpCacheInterceptor } from './core/interceptors/http-cache.interceptor';
import { InputValidationInterceptor } from './core/interceptors/input-validation.interceptor';
import { RateLimitInterceptor } from './core/interceptors/rate-limit.interceptor';
import { SecurityHeadersInterceptor } from './core/interceptors/security-headers.interceptor';
import { CARD_DATA_PROVIDER } from './core/services/card-data/card-data.service';
import { JsonFileCardProvider } from './core/services/card-data/json-file-card-provider.service';
import { DocsPreloadService } from './core/services/docs-preload.service';
import { RoutePreloadService } from './core/services/route-preload.service';
import { StatePersistenceService } from './core/services/state-persistence.service';
import { WebVitalsService } from './core/services/web-vitals.service';
import { CARD_REPOSITORY } from './domain';
import { NgRxCardRepository } from './infrastructure/repositories/ngrx-card-repository.service';
import { metaReducers, reducers } from './store/app.state';
import { CardsEffects } from './store/cards/cards.effects';
import { StatePersistenceEffects } from './store/state-persistence.effects';

export const config: ApplicationConfig = {
  providers: [
    // Global error handler
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes, withPreloading(DocsPreloadingStrategy)),
    // Documentation uses custom components (no NgDoc for Angular 20 compatibility)
    // Optimize change detection with event coalescing and run coalescing
    provideZoneChangeDetection({
      eventCoalescing: true,
      runCoalescing: true,
    }),
    provideStore(reducers, { metaReducers }),
    provideEffects([CardsEffects, StatePersistenceEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false,
    }),
    {
      provide: CARD_DATA_PROVIDER,
      useClass: JsonFileCardProvider,
    },
    // Provide CardRepository for domain layer
    {
      provide: CARD_REPOSITORY,
      useClass: NgRxCardRepository,
    },
    // Restore persisted state before app initialization
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const persistence: StatePersistenceService = inject(StatePersistenceService);
        return () => {
          return persistence
            .restoreState()
            .toPromise()
            .then((restoredState: unknown) => {
              if (restoredState) {
                // State restoration is handled by StatePersistenceEffects
                // This just ensures state is loaded from persistence
                if (isDevMode()) {
                  console.warn('[AppInit] State restored from persistence');
                }
              }
              return Promise.resolve();
            })
            .catch((error: unknown) => {
              console.warn('[AppInit] Failed to restore state:', error);
              return Promise.resolve();
            });
        };
      },
      multi: true,
    },
    // Initialize Web Vitals monitoring
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const webVitals = inject(WebVitalsService);
        return () => webVitals.initialize();
      },
      multi: true,
    },
    // Initialize Theme Service - must complete before Angular bootstraps
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        // Inject ThemeService - constructor runs immediately and calls initializeTheme()
        const themeService = inject(ThemeService);

        // Return function that Angular calls before bootstrap
        // At this point, ThemeService constructor has already run and initialized the theme
        return () => {
          // Verify theme is initialized - if not, force initialization
          // This ensures theme is applied before any components render
          const currentTheme = themeService.getCurrentTheme();
          const resolvedTheme = themeService.getResolvedTheme();

          if (!currentTheme || !resolvedTheme) {
            // Fallback: ensure theme is set (shouldn't happen, but safety check)
            themeService.setTheme('system');
          }
        };
      },
      multi: true,
    },
    // Preload all documentation markdown content and routes at startup
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const docsPreloadService = inject(DocsPreloadService);
        const routePreloadService: RoutePreloadService = inject(RoutePreloadService);
        return async () => {
          // Preload all documentation markdown files in background
          docsPreloadService.preloadAll();

          // Preload all routes immediately at startup
          // Start in next tick to not block app initialization
          void Promise.resolve().then(() => {
            void routePreloadService.preloadAllRoutes().catch((err: unknown) => {
              console.warn('[RoutePreload] Error preloading routes:', err);
            });
          });
        };
      },
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpCacheInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RateLimitInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SecurityHeadersInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: InputValidationInterceptor,
      multi: true,
    },
    // Service Worker for offline support and PWA features
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
