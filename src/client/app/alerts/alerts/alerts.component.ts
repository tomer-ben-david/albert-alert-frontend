import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy
} from '@angular/core';
import { FormControl } from '@angular/forms';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { FilterObserver } from '../../shared/filter';
import { Alert, MasterDetailCommands } from '../../core';
import { AlertsService } from '../alerts.service';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertsComponent
  implements MasterDetailCommands<Alert>, OnInit, OnDestroy {
  commands = this;
  selectedAlert: Alert;
  subscription: Subscription;

  filterObserver: FilterObserver;
  filteredAlerts$: Observable<Alert[]>;
  loading$: Observable<boolean>;

  constructor(public alertsService: AlertsService) {
    this.filterObserver = alertsService.filterObserver;
    this.filteredAlerts$ = this.alertsService.filteredEntities$;
    this.loading$ = this.alertsService.loading$;
  }

  ngOnInit() {
    this.subscription = this.alertsService.getAllOnDataSourceChange.subscribe();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  close() {
    this.selectedAlert = null;
  }

  enableAddMode() {
    this.selectedAlert = <any>{};
  }

  getAlerts() {
    this.alertsService.getAll();
    this.close();
  }

  add(alert: Alert) {
    this.alertsService.add(alert);
  }

  delete(alert: Alert) {
    this.close();
    this.alertsService.delete(alert);
  }

  select(alert: Alert) {
    this.selectedAlert = alert;
  }

  update(alert: Alert) {
    this.alertsService.update(alert);
  }
}
