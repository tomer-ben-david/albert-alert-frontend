import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../shared/shared.module';

import { AlertsRoutingModule } from './alerts-routing.module';
import { AlertDetailComponent } from './alert-detail/alert-detail.component';
import { AlertsComponent } from './alerts/alerts.component';
import { AlertsV1Component } from './alerts/alerts.v1.component';
import { AlertListComponent } from './alert-list/alert-list.component';
import { AlertsService } from './alerts.service';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AlertsRoutingModule,
    SharedModule
  ],
  declarations: [
    AlertsComponent,
    AlertsV1Component,
    AlertDetailComponent,
    AlertListComponent
  ],
  providers: [AlertsService]
})
export class AlertsModule {}
