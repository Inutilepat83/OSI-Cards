import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { reducers, metaReducers } from './store';
import { CardsEffects } from './store/cards/cards.effects';

// Card data provider imports
import { CARD_DATA_PROVIDER, JsonCardProvider, WebSocketCardProvider } from './core';

/**
 * Application configuration with optimized card data providers
 * 
 * To switch data providers:
 * - JsonCardProvider: For static JSON file loading (default)
 * - WebSocketCardProvider: For real-time updates via WebSocket
 * - Custom providers: Implement CardDataProvider interface
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    
    // NgRx Store Configuration
    provideStore(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
      },
    }),
    provideEffects(CardsEffects),
    
    // Development tools
    provideStoreDevtools({ 
      maxAge: 25, 
      logOnly: environment.production,
      connectInZone: true
    }),

    // Card Data Provider Configuration
    // Switch between providers by changing the useClass value:
    {
      provide: CARD_DATA_PROVIDER,
      useClass: JsonCardProvider, // Default: JSON file-based loading
      // useClass: WebSocketCardProvider, // Alternative: Real-time WebSocket
    },

    // Individual providers (available for manual switching)
    JsonCardProvider,
    WebSocketCardProvider,
  ],
};

/**
 * Configuration Examples:
 * 
 * 1. Use JSON Provider (current):
 *    { provide: CARD_DATA_PROVIDER, useClass: JsonCardProvider }
 * 
 * 2. Use WebSocket Provider:
 *    { provide: CARD_DATA_PROVIDER, useClass: WebSocketCardProvider }
 * 
 * 3. Use Factory for conditional provider:
 *    {
 *      provide: CARD_DATA_PROVIDER,
 *      useFactory: (http: HttpClient) => {
 *        return environment.useWebSocket 
 *          ? new WebSocketCardProvider() 
 *          : new JsonCardProvider();
 *      },
 *      deps: [HttpClient]
 *    }
 * 
 * 4. Runtime provider switching:
 *    // Inject CardDataService and call switchProvider(newProvider)
 */
