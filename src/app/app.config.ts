import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { reducers } from './store/app.state';
import { CardsEffects } from './store/cards/cards.effects';
import { CARD_DATA_PROVIDER } from './core/services/card-data/card-data.service';
import { TemplateCardProvider } from './core/services/card-data/template-card-provider.service';

export const config: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideStore(reducers),
    provideEffects([CardsEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false
    }),
    {
      provide: CARD_DATA_PROVIDER,
      useClass: TemplateCardProvider
    }
  ]
};
