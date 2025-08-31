import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

// NgRx imports
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { reducers } from './core/store/app.reducer';
import { CardsEffects } from './core/store/cards/cards.effects';

// Translation imports
import { TranslateModule } from '@ngx-translate/core';

// Core module for singleton services
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';

// Routes with optimized lazy loading and bundle splitting
const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule),
  },
  {
    path: 'cards',
    loadChildren: () => import('./features/cards/cards.module').then(m => m.CardsModule),
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(routes),

    // Translation module
    TranslateModule.forRoot({
      defaultLanguage: 'en',
    }),

    // NgRx Store
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot([CardsEffects]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: false,
    }),

    CoreModule,
    SharedModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }), // Import core module for global services
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
