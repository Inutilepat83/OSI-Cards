import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/admin.component').then(m => m.AdminComponent),
    title: 'OSI Cards - Administration'
  }
];
