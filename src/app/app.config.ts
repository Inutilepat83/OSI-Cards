import { ApplicationConfig, isDevMode, inject, APP_INITIALIZER } from '@angular/core';
import { provideRouter, PreloadAllModules, withPreloading } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { reducers } from './store/app.state';
import { CardsEffects } from './store/cards/cards.effects';
import { CARD_DATA_PROVIDER } from './core/services/card-data/card-data.service';
import { JsonFileCardProvider } from './core/services/card-data/json-file-card-provider.service';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { HttpCacheInterceptor } from './core/interceptors/http-cache.interceptor';
import { RateLimitInterceptor } from './core/interceptors/rate-limit.interceptor';
import { WebVitalsService } from './core/services/web-vitals.service';

export const config: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules)
    ),
    provideHttpClient(),
    // Optimize change detection with event coalescing and run coalescing
    provideZoneChangeDetection({
      eventCoalescing: true,
      runCoalescing: true
    }),
    provideStore(reducers),
    provideEffects([CardsEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false
    }),
    {
      provide: CARD_DATA_PROVIDER,
      useClass: JsonFileCardProvider
    },
    // Initialize Web Vitals monitoring
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const webVitals = inject(WebVitalsService);
        return () => webVitals.initialize();
      },
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpCacheInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RateLimitInterceptor,
      multi: true
    },
    // Service Worker for offline support and PWA features
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
