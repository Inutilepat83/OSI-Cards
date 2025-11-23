import { Provider, EnvironmentProviders } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { reducers } from '../../store/app.state';
import { CardsEffects } from '../../store/cards/cards.effects';
import { CARD_DATA_PROVIDER } from '../services/card-data/card-data.service';
import { JsonFileCardProvider } from '../services/card-data/json-file-card-provider.service';
import { ErrorInterceptor } from '../interceptors/error.interceptor';
import { HttpCacheInterceptor } from '../interceptors/http-cache.interceptor';
import { RateLimitInterceptor } from '../interceptors/rate-limit.interceptor';
import { AppConfigService } from '../services/app-config.service';

/**
 * Configuration options for OSI Cards
 */
export interface OSICardsConfig {
  apiUrl?: string;
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  enableDevTools?: boolean;
  cardDataProvider?: any;
}

/**
 * Provide OSI Cards with configuration
 * 
 * @example
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideOSICards({
 *       enableLogging: true,
 *       logLevel: 'info'
 *     })
 *   ]
 * };
 * ```
 */
export function provideOSICards(config: OSICardsConfig = {}): (Provider | EnvironmentProviders)[] {
  const {
    enableLogging = true,
    logLevel = 'info',
    enableDevTools = false,
    cardDataProvider
  } = config;

  const providers: (Provider | EnvironmentProviders)[] = [
    provideAnimations(),
    provideHttpClient(),
    provideStore(reducers),
    provideEffects([CardsEffects]),
    {
      provide: CARD_DATA_PROVIDER,
      useClass: cardDataProvider || JsonFileCardProvider
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
    }
  ];

  // Configure AppConfigService if needed
  if (enableLogging || logLevel) {
    providers.push({
      provide: AppConfigService,
      useFactory: () => {
        const service = new AppConfigService();
        if (enableLogging !== undefined) {
          // Update config if needed
        }
        return service;
      }
    });
  }

  // Add DevTools in development
  if (enableDevTools) {
    providers.push(
      provideStoreDevtools({
        maxAge: 25,
        logOnly: false
      })
    );
  }

  return providers;
}

