import { Routes } from '@angular/router';

export const CARDS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/cards-container/cards-container.component').then(m => m.CardsContainerComponent)
  }
];
