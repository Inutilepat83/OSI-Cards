import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../models/card.model';
import { AppState } from '../store/app.state';

/**
 * Create a mock card configuration for testing
 */
export function createMockCard(config?: Partial<AICardConfig>): AICardConfig {
  return {
    id: `test-card-${Date.now()}`,
    cardTitle: 'Test Card',
    cardType: 'company',
    sections: [],
    ...config
  };
}

/**
 * Create a mock section for testing
 */
export function createMockSection(config?: Partial<CardSection>): CardSection {
  return {
    id: `test-section-${Date.now()}`,
    title: 'Test Section',
    type: 'info',
    fields: [],
    ...config
  };
}

/**
 * Create a mock field for testing
 */
export function createMockField(config?: Partial<CardField>): CardField {
  return {
    id: `test-field-${Date.now()}`,
    label: 'Test Field',
    value: 'Test Value',
    ...config
  };
}

/**
 * Create a mock item for testing
 */
export function createMockItem(config?: Partial<CardItem>): CardItem {
  return {
    id: `test-item-${Date.now()}`,
    title: 'Test Item',
    ...config
  };
}

/**
 * Create a mock action for testing
 */
export function createMockAction(config?: Partial<CardAction>): CardAction {
  return {
    id: `test-action-${Date.now()}`,
    label: 'Test Action',
    type: 'primary',
    ...config
  };
}

/**
 * Create a mock NgRx store (using Jasmine spies)
 */
export function createMockStore<T extends AppState>(initialState?: Partial<T>): Store<T> {
  const defaultState = {
    cards: {
      ids: [],
      entities: {},
      currentCardId: null,
      cardType: 'company' as const,
      cardVariant: 1,
      toonInput: '',
      isGenerating: false,
      isFullscreen: false,
      error: null,
      loading: false
    },
    ...initialState
  } as T;

  const selectSpy = jasmine.createSpy('select').and.callFake((selector: unknown) => {
    if (typeof selector === 'function') {
      const typedSelector = selector as (state: T) => unknown;
      return of(typedSelector(defaultState));
    }
    return of(defaultState);
  });

  const dispatchSpy = jasmine.createSpy('dispatch');
  const pipeSpy = jasmine.createSpy('pipe').and.returnValue(of(defaultState));
  const subscribeSpy = jasmine.createSpy('subscribe').and.callFake((callback: unknown) => {
    if (typeof callback === 'function') {
      (callback as (state: T) => void)(defaultState);
    }
    return { unsubscribe: jasmine.createSpy('unsubscribe') };
  });

  return {
    select: selectSpy,
    dispatch: dispatchSpy,
    pipe: pipeSpy,
    subscribe: subscribeSpy
  } as unknown as Store<T>;
}

/**
 * Create a component fixture with common setup
 */
export function createComponentFixture<T>(
  component: new (...args: unknown[]) => T,
  options?: {
    imports?: unknown[];
    providers?: unknown[];
    declarations?: unknown[];
  }
): ComponentFixture<T> {
  const imports = options?.imports || [];
  const providers = options?.providers || [];
  const declarations = options?.declarations || [];

  TestBed.configureTestingModule({
    imports: [component, ...imports],
    declarations,
    providers
  });

  return TestBed.createComponent(component);
}

/**
 * Wait for async operations to complete
 */
export async function waitForAsync(ms = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a spy object with default methods (using Jasmine spies)
 */
export function createSpyObject<T>(methods: string[]): jasmine.SpyObj<T> {
  const obj: Record<string, jasmine.Spy> = {};
  methods.forEach(method => {
    obj[method] = jasmine.createSpy(method);
  });
  return obj as jasmine.SpyObj<T>;
}

