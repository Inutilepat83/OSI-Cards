import { ApplicationConfig } from '@angular/core';
import { provideRouter, PreloadAllModules, withPreloading } from '@angular/router';
import { SelectivePreloadStrategy } from './core/strategies/selective-preload.strategy';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideZoneChangeDetection } from '@angular/core';

import { routes } from './app.routes';
import { reducers } from './store/app.state';
import { CardsEffects } from './store/cards/cards.effects';
import { CARD_DATA_PROVIDER } from './core/services/card-data/card-data.service';
import { ToonCardProvider } from './core/services/card-data/toon-card-provider.service';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { HttpCacheInterceptor } from './core/interceptors/http-cache.interceptor';

export const config: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules) // Use PreloadAllModules for now, can switch to SelectivePreloadStrategy
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
      useClass: ToonCardProvider
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
    }
  ]
};
