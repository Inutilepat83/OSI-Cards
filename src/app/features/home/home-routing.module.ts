import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './components/home-page/home-page.component';
import { PerformanceDashboardComponent } from '../../shared/components/performance-dashboard.component';
import { OfflineDashboardComponent } from '../../shared/components/offline-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
  },
  {
    path: 'performance',
    component: PerformanceDashboardComponent,
  },
  {
    path: 'offline',
    component: OfflineDashboardComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
