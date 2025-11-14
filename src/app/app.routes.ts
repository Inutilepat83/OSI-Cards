import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/components/home-page/home-page.component').then(m => m.HomePageComponent)
  },
  {
    path: 'cards',
    loadComponent: () => import('./shared/components/cards/cards-container/cards-container.component').then(m => m.CardsContainerComponent)
  },
  { path: '**', redirectTo: '' }
];
