/*
 * In contrast with alerts.component.spec.ts, these tests mock the ngrx-data EntityEffects.
 *
 * If you don't have a AlertsService and want to talk to the store directly in your component,
 * you might consider this technique which intercepts the persist$ effect and mocks its behavior.
 *
 * This example is heavier than alerts.component.spec.ts,
 * in part because it digs into EntityEffects but mostly because it
 * inspects various implementation details such as the reducers and the dispatcher
 * which you probably wouldn't look at in real tests.
 *
 * This spec also demonstrates an alternative style that replaces BeforeEach() with
 * test setup function calls.
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
import { provideMockActions } from '@ngrx/effects/testing'; // interesting but not used

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

describe('AlertsComponent (mock effects)', () => {
  describe('class-only', () => {
    it('can instantiate component', () => {
      alertsComponentClassSetup();
      const component: AlertsComponent = TestBed.get(AlertsComponent);
      expect(component).toBeDefined();
    });

    it('should initialize component with getAll() [no helper]', () => {
      const {
        createAlertAction,
        initialAlerts,
        setPersistResponses
      } = alertsComponentClassSetup();

      const getAllSuccessAction = createAlertAction(
        EntityOp.QUERY_ALL_SUCCESS,
        initialAlerts
      );

      let subscriptionCalled = false;

      const component: AlertsComponent = TestBed.get(AlertsComponent);
      component.ngOnInit();

      component.loading$
        .pipe(first())
        .subscribe(loading =>
          expect(loading).toBe(true, 'loading while getting all')
        );

      setPersistResponses(getAllSuccessAction);

      component.filteredAlerts$.subscribe(alerts => {
        subscriptionCalled = true;
        expect(alerts.length).toBe(initialAlerts.length);
      });

      component.loading$
        .pipe(first())
        .subscribe(loading =>
          expect(loading).toBe(false, 'loading after getting all')
        );

      expect(subscriptionCalled).toBe(true, 'should have gotten alerts');
    });

    it('should initialize component with getAll() [using helper]', () => {
      const { component, initialAlerts } = getInitializedComponentClass();

      let subscriptionCalled = false;

      component.filteredAlerts$.subscribe(alerts => {
        subscriptionCalled = true;
        expect(alerts.length).toBe(initialAlerts.length);
      });

      expect(subscriptionCalled).toBe(true, 'should have gotten alerts');
    });

    it('should filter alerts when filter value changes', () => {
      const { component, createAlertAction } = getInitializedComponentClass();

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
      const {
        component,
        createAlertAction,
        dispatchSpy,
        alertReducerSpy,
        initialAlerts,
        setPersistResponses
      } = getInitializedComponentClass();

      let subscriptionCalled = false;

      component.delete(initialAlerts[1]); // 'B'

      const success = createAlertAction(
        EntityOp.SAVE_DELETE_ONE_OPTIMISTIC_SUCCESS
      );

      setPersistResponses(success);

      // Optimistic so works even before the effect actions completes
      component.filteredAlerts$.subscribe(alerts => {
        subscriptionCalled = true;
        expect(alerts.length).toBe(initialAlerts.length - 1);
      });

      expect(subscriptionCalled).toBe(true, 'subscription was called');
      expect(dispatchSpy.calls.count()).toBe(
        1,
        'can only see the direct dispatch to the store!'
      );
      expect(alertReducerSpy.calls.count()).toBe(2, 'HroReducer called twice');
    });

    it('should add a alert', () => {
      const {
        component,
        createAlertAction,
        initialAlerts,
        setPersistResponses
      } = getInitializedComponentClass();

      let subscriptionCalled = false;

      const testAlert: Alert = {
        id: undefined,
        symbol: 'Test',
        email: 'Say test'
      };

      component.add(testAlert);

      const success = createAlertAction(EntityOp.SAVE_ADD_ONE_SUCCESS, {
        ...testAlert,
        id: 42
      });

      setPersistResponses(success);

      component.filteredAlerts$.subscribe(alerts => {
        subscriptionCalled = true;
        expect(alerts.length).toBe(initialAlerts.length + 1);
      });

      expect(subscriptionCalled).toBe(true, 'subscription was called');
    });
  });

  describe('class+template', () => {
    beforeEach(alertsComponentDeclarationsSetup);

    it('should display all alerts', () => {
      const {
        component,
        fixture,
        initialAlerts,
        view
      } = getInitializedComponent();
      const itemEls = view.querySelectorAll('ul.alerts li');
      expect(itemEls.length).toBe(initialAlerts.length);
    });
  });
});

// region Effects-mocking CLASS-ONLY test helpers

function alertsComponentClassSetup() {
  TestBed.configureTestingModule({
    imports: [
      StoreModule.forRoot({}),
      EffectsModule.forRoot([]),
      EntityStoreModule
    ],
    providers: [
      Actions,
      AppSelectors,
      AlertsComponent, // When testing class-only
      AlertsService,
      { provide: HttpClient, useValue: null },
      { provide: NgrxDataToastService, useValue: null }
    ]
  });

  // Component listens for toggle between local and remote DB
  const appSelectorsDataSource = new BehaviorSubject('local');
  const appSelectors: AppSelectors = TestBed.get(AppSelectors);
  spyOn(appSelectors, 'dataSource$').and.returnValue(appSelectorsDataSource);

  // Create Alert entity actions as ngrx-data will do it
  const entityActionFactory: EntityActionFactory = TestBed.get(
    EntityActionFactory
  );
  function createAlertAction(op: EntityOp, payload?: any) {
    return entityActionFactory.create('Alert', op, payload);
  }

  // Spy on EntityEffects
  const effects: EntityEffects = TestBed.get(EntityEffects);
  let persistResponsesSubject: Subject<Action>;

  const persistSpy = spyOn(effects, 'persist').and.callFake(
    (action: EntityAction) => (persistResponsesSubject = new Subject<Action>())
  );

  // Control EntityAction responses from EntityEffects spy
  function setPersistResponses(...actions: Action[]) {
    actions.forEach(action => persistResponsesSubject.next(action));
    persistResponsesSubject.complete();
  }

  // Sample Alert test data
  const initialAlerts = [
    { id: 1, symbol: 'A', email: 'A says' },
    { id: 3, symbol: 'B', email: 'B says' },
    { id: 2, symbol: 'C', email: 'C says' }
  ];

  // Spy on dispatches to the store (not very useful)
  const testStore: Store<EntityCache> = TestBed.get(Store);
  const dispatchSpy = spyOn(testStore, 'dispatch').and.callThrough();

  return {
    appSelectorsDataSource,
    createAlertAction,
    dispatchSpy,
    effects,
    entityActionFactory,
    initialAlerts,
    persistResponsesSubject,
    persistSpy,
    setPersistResponses,
    testStore
  };
}

/**
 * Create and initialize the component for CLASS-ONLY tests.
 * Initialization gets all Alerts.
 */
function getInitializedComponentClass() {
  const setup = alertsComponentClassSetup();
  const {
    createAlertAction,
    dispatchSpy,
    initialAlerts,
    setPersistResponses
  } = setup;

  const getAllSuccessAction = createAlertAction(
    EntityOp.QUERY_ALL_SUCCESS,
    initialAlerts
  );

  // When testing the class-only, can inject it as if it were a service
  const component: AlertsComponent = TestBed.get(AlertsComponent);
  component.ngOnInit();

  setPersistResponses(getAllSuccessAction);

  dispatchSpy.calls.reset(); // don't count the getAll actions

  const alertReducerSpy = spyOnAlertReducer();

  return { ...setup, component, alertReducerSpy };
}

function spyOnAlertReducer() {
  const entityReducerFactory: EntityReducerFactory = TestBed.get(
    EntityReducerFactory
  );
  const alertReducer: EntityCollectionReducer<
    Alert
  > = entityReducerFactory.getOrCreateReducer<Alert>('Alert');
  const alertReducerSpy = jasmine
    .createSpy('AlertReducer', alertReducer)
    .and.callThrough();
  // re-register the spy version
  entityReducerFactory.registerReducer<Alert>('Alert', alertReducerSpy);
  return alertReducerSpy;
}

// endregion Effects-mocking CLASS-ONLY test helpers

// region Effects-mocking CLASS+TEMPLATE test helpers

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

/**
 * Create and initialize the component CLASS-AND-TEMPLATE tests.
 * Initialization gets all Alerts.
 */
function getInitializedComponent() {
  const setup = alertsComponentClassSetup();
  const { createAlertAction, initialAlerts, setPersistResponses } = setup;

  const fixture = TestBed.createComponent(AlertsComponent);
  const component = fixture.componentInstance;
  const view: HTMLElement = fixture.nativeElement;

  fixture.detectChanges(); // triggers ngOnInit() which gets all alerts.

  const getAllSuccessAction = createAlertAction(
    EntityOp.QUERY_ALL_SUCCESS,
    initialAlerts
  );
  setPersistResponses(getAllSuccessAction);

  fixture.detectChanges(); // populate view with alerts from store.

  return { ...setup, component, fixture, view };
}

// endregion Effects-mocking CLASS+TEMPLATE test helpers
