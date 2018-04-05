import { Injectable } from '@angular/core';
import { EntityServiceBase, EntityServiceFactory } from 'ngrx-data';

import { shareReplay, tap } from 'rxjs/operators';

import { AppSelectors } from '../store/app-config';
import { Alert } from '../core';
import { FilterObserver } from '../shared/filter';

@Injectable()
export class AlertsService extends EntityServiceBase<Alert> {
  filterObserver: FilterObserver;

  /** Run `getAll` if the datasource changes. */
  getAllOnDataSourceChange = this.appSelectors
    .dataSource$()
    .pipe(tap(_ => this.getAll()), shareReplay(1));

  constructor(
    entityServiceFactory: EntityServiceFactory,
    private appSelectors: AppSelectors
  ) {
    super('Alert', entityServiceFactory);

    /** User's filter pattern */
    this.filterObserver = {
      filter$: this.filter$,
      setFilter: this.setFilter.bind(this)
    };
  }
}
