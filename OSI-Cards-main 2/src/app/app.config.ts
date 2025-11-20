import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
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
import { JsonCardProvider } from './core/services/card-data/json-card-provider.service';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

export const config: ApplicationConfig = {
  providers: [
    provideRouter(routes),
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
      useClass: JsonCardProvider
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ]
};
