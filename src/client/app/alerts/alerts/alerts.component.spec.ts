/*
 * Test the component by mocking its injected ngrx-data AlertsService
 *
 * You have a choice of testing the component class alone or the component-and-its-template.
 * The latter requires importing more stuff and a bit more setup.
 */

// region imports
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { Action, StoreModule, Store } from '@ngrx/store';
import { Actions, EffectsModule } from '@ngrx/effects';

import {
  EntityAction,
  EntityActionFactory,
  EntityCache,
  EntityOp,
  EntityEffects,
  EntityCollectionReducer,
  EntityReducerFactory,
  EntityService,
  persistOps
} from 'ngrx-data';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { first, skip } from 'rxjs/operators';

import { AppSelectors } from '../../store/app-config/selectors';
import { EntityStoreModule } from '../../store/entity-store.module';
import { NgrxDataToastService } from '../../store/ngrx-data-toast.service';
import { Alert } from '../../core';
import { AlertsComponent } from './alerts.component';
import { AlertsService } from '../alerts.service';

// Used only to test class/template interaction
import { FilterComponent } from '../../shared/filter/filter.component';
import { AlertListComponent } from '../alert-list/alert-list.component';
import { AlertDetailComponent } from '../alert-detail/alert-detail.component';

// endregion imports

describe('AlertsComponent (mock AlertsService)', () => {
  let appSelectorsDataSource: BehaviorSubject<string>;
  let component: AlertsComponent;
  let alertsService: AlertsService;
  let testStore: Store<EntityCache>;

  let entityActionFactory: EntityActionFactory;
  /** Create Alert entity actions as ngrx-data will do it */
  function createAlertAction(op: EntityOp, payload?: any) {
    return entityActionFactory.create('Alert', op, payload);
  }

  const initialAlerts = [
    { id: 1, symbol: 'A', email: 'A says' },
    { id: 3, symbol: 'B', email: 'B says' },
    { id: 2, symbol: 'C', email: 'C says' }
  ];

  describe('class-only', () => {
    beforeEach(alertsComponentCoreSetup);

    beforeEach(() => {
      component = TestBed.get(AlertsComponent);
      component.ngOnInit(); // triggers getAll alerts
    });

    it('should initialize component with getAll()', () => {
      let subscriptionCalled = false;

      component.filteredAlerts$.subscribe(alerts => {
        subscriptionCalled = true;
        expect(alerts.length).toBe(initialAlerts.length);
      });

      component.loading$
        .pipe(first())
        .subscribe(loading => expect(loading).toBe(false, 'loading after'));

      expect(subscriptionCalled).toBe(true, 'should have gotten alerts');
    });

    it('should filter alerts when filter value changes', () => {
      let subscriptionCalled = false;

      // The data-bound FilterComponent would call the observer like this
      component.filterObserver.setFilter('a'); // case insensitive

      component.filteredAlerts$.subscribe(alerts => {
        subscriptionCalled = true;
        expect(alerts.length).toBe(1);
        expect(alerts[0].symbol).toBe('A');
      });

      expect(subscriptionCalled).toBe(true, 'subscription was called');
    });

    it('should delete a alert', () => {
      let subscriptionCalled = false;

      spyOn(alertsService, 'add').and.callFake(() => {
        const success = createAlertAction(
          EntityOp.SAVE_DELETE_ONE_OPTIMISTIC_SUCCESS
        );
        testStore.dispatch(success);
      });

      component.delete(initialAlerts[1]); // 'B'

      component.filteredAlerts$.subscribe(alerts => {
        subscriptionCalled = true;
        expect(alerts.length).toBe(initialAlerts.length - 1);
      });

      expect(subscriptionCalled).toBe(true, 'subscription was called');
    });

    it('should add a alert', () => {
      let subscriptionCalled = false;

      const testAlert: Alert = {
        id: undefined,
        symbol: 'Test',
        email: 'Say test'
      };

      spyOn(alertsService, 'add').and.callFake(() => {
        const success = createAlertAction(EntityOp.SAVE_ADD_ONE_SUCCESS, {
          ...testAlert,
          id: 42
        });
        testStore.dispatch(success);
      });

      component.add(testAlert);

      component.filteredAlerts$.subscribe(alerts => {
        subscriptionCalled = true;
        expect(alerts.length).toBe(initialAlerts.length + 1);
      });

      expect(subscriptionCalled).toBe(true, 'subscription was called');
    });
  });

  describe('class+template', () => {
    let fixture: ComponentFixture<AlertsComponent>;
    let view: HTMLElement;

    beforeEach(alertsComponentDeclarationsSetup);
    beforeEach(alertsComponentCoreSetup);

    beforeEach(() => {
      fixture = TestBed.createComponent(AlertsComponent);
      component = fixture.componentInstance;
      view = fixture.nativeElement;

      fixture.detectChanges(); // triggers ngOnInit() which gets all alerts.
      fixture.detectChanges(); // populate view with alerts from store.
    });

    it('should display all alerts', () => {
      const itemEls = view.querySelectorAll('ul.alerts li');
      expect(itemEls.length).toBe(initialAlerts.length);
    });
  });

  // region helpers
  function alertsComponentCoreSetup() {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot([]),
        EntityStoreModule
      ],
      providers: [
        AppSelectors,
        AlertsComponent, // When testing class-only
        AlertsService,
        { provide: HttpClient, useValue: null },
        { provide: NgrxDataToastService, useValue: null }
      ]
    });

    // Component listens for toggle between local and remote DB
    appSelectorsDataSource = new BehaviorSubject('local');
    const appSelectors: AppSelectors = TestBed.get(AppSelectors);
    spyOn(appSelectors, 'dataSource$').and.returnValue(appSelectorsDataSource);

    entityActionFactory = TestBed.get(EntityActionFactory);

    alertsService = TestBed.get(AlertsService);
    spyOn(alertsService, 'getAll').and.callFake(() => {
      const getAllSuccessAction = createAlertAction(
        EntityOp.QUERY_ALL_SUCCESS,
        initialAlerts
      );
      testStore.dispatch(getAllSuccessAction);
    });

    testStore = TestBed.get(Store);
  }

  // Call this when testing class/template interaction
  // Not needed when testing class-only
  function alertsComponentDeclarationsSetup() {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [
        FilterComponent,
        AlertsComponent,
        AlertListComponent,
        AlertDetailComponent
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // ignore Angular Material elements
    });
  }

  // endregion helpers
});
