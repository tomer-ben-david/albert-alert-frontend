import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AlertsComponent } from './alerts/alerts.component';
import { AlertsV1Component } from './alerts/alerts.v1.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: AlertsComponent }
];
// const routes: Routes = [{ path: '', pathMatch: 'full', component: AlertsV1Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AlertsRoutingModule {}
