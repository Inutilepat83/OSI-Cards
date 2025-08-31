import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

// Core module for singleton services
import { CoreModule } from './core/core.module';
import { AppComponent } from './app.component';

// Routes with lazy loading
const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'cards',
    loadChildren: () => import('./features/cards/cards.module').then(m => m.CardsModule)
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    CoreModule // Import core module for global services
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
