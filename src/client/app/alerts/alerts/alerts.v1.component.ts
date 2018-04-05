import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EntityService, EntityServiceFactory } from 'ngrx-data';

import { Observable } from 'rxjs/Observable';

import { FilterObserver } from '../../shared/filter';
import { Alert, MasterDetailCommands } from '../../core';

// Simpler version;
// How it could be if the app didn't toggle between local and remote API endpoints
// Instead of creating a AlertService, use the EntityServiceFactory to create it.

@Component({
  selector: 'app-alerts-v1',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertsV1Component implements MasterDetailCommands<Alert>, OnInit {
  commands = this;
  selectedAlert: Alert;

  filterObserver: FilterObserver;
  filteredAlerts$: Observable<Alert[]>;
  alertsService: EntityService<Alert>;
  loading$: Observable<boolean>;

  constructor(entityServiceFactory: EntityServiceFactory) {
    this.alertsService = entityServiceFactory.create<Alert>('Alert');
    this.filteredAlerts$ = this.alertsService.filteredEntities$;
    this.loading$ = this.alertsService.loading$;

    /** User's filter pattern */
    this.filterObserver = {
      filter$: this.alertsService.filter$,
      setFilter: this.alertsService.setFilter.bind(this)
    };
  }

  ngOnInit() {
    this.getAlerts();
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
