import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of, BehaviorSubject } from 'rxjs';

// Mock services for testing
export class MockFeatureFlagService {
  private flags = new BehaviorSubject({
    virtualScrolling: true,
    webWorkers: true,
    analytics: true,
    offlineMode: true,
    betaFeatures: false
  } as Record<string, boolean>);

  isEnabled(flag: string): boolean {
    return this.flags.value[flag] || false;
  }

  getFlag$(flag: string) {
    return this.flags.pipe();
  }

  updateFlag(flag: string, value: boolean): void {
    const current = this.flags.value;
    this.flags.next({ ...current, [flag]: value });
  }
}

export class MockMemoryManagementService {
  private subscriptions = new Set();
  private objectPool = new Map();

  trackSubscription(subscription: any): void {
    this.subscriptions.add(subscription);
  }

  getObject(type: string): any {
    return this.objectPool.get(type) || {};
  }

  returnObject(type: string, obj: any): void {
    this.objectPool.set(type, obj);
  }

  cleanup(): void {
    this.subscriptions.clear();
    this.objectPool.clear();
  }

  getMemoryUsage() {
    return {
      used: 50,
      total: 100,
      percentage: 50
    };
  }
}

export class MockPerformanceService {
  private metrics = new BehaviorSubject({
    loadTime: 1500,
    renderTime: 100,
    memoryUsage: 50
  });

  startMeasurement(name: string): void {
    console.log(`Mock: Started measurement ${name}`);
  }

  endMeasurement(name: string): number {
    console.log(`Mock: Ended measurement ${name}`);
    return 100;
  }

  getMetrics$() {
    return this.metrics.asObservable();
  }

  recordMetric(name: string, value: number): void {
    const current = this.metrics.value;
    this.metrics.next({ ...current, [name]: value });
  }
}

export class MockEventBusService {
  private events = new BehaviorSubject<{ event: string; data?: any; timestamp: number } | null>(null);

  emit(event: string, data?: any): void {
    this.events.next({ event, data, timestamp: Date.now() });
  }

  on(event: string) {
    return this.events.pipe();
  }

  off(event: string): void {
    console.log(`Mock: Unsubscribed from ${event}`);
  }
}

export class MockWebWorkerService {
  private workers = new Map();

  async executeTask(workerName: string, data: any): Promise<any> {
    // Simulate async work
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ processed: true, data });
      }, 100);
    });
  }

  createWorker(name: string): any {
    const worker = {
      postMessage: (data: any) => console.log(`Mock worker ${name}:`, data),
      onmessage: null,
      terminate: () => console.log(`Mock worker ${name} terminated`)
    };
    this.workers.set(name, worker);
    return worker;
  }

  terminateWorker(name: string): void {
    this.workers.delete(name);
  }
}

export class MockPwaService {
  private status = new BehaviorSubject({
    isInstallable: false,
    isInstalled: true,
    updateAvailable: false,
    isOnline: true
  });

  pwaStatus$ = this.status.asObservable();
  updateAvailable$ = of(null);
  updateActivated$ = of(null);

  async installApp(): Promise<boolean> {
    return Promise.resolve(true);
  }

  async applyUpdate(): Promise<boolean> {
    return Promise.resolve(true);
  }

  async checkForUpdate(): Promise<boolean> {
    return Promise.resolve(false);
  }

  getInstallationInstructions(): string[] {
    return ['Mock instruction 1', 'Mock instruction 2'];
  }

  getOfflineCapabilities(): string[] {
    return ['Mock capability 1', 'Mock capability 2'];
  }
}

// Testing utilities
export class TestingUtilities {
  static createMockStore(initialState: any = {}) {
    return TestBed.configureTestingModule({
      providers: [
        provideMockStore({ initialState })
      ]
    }).inject(MockStore);
  }

  static createComponent<T>(componentType: any, options: {
    providers?: any[];
    imports?: any[];
    declarations?: any[];
  } = {}) {
    const testBed = TestBed.configureTestingModule({
      declarations: options.declarations || [],
      imports: options.imports || [],
      providers: [
        ...this.getDefaultMockProviders(),
        ...(options.providers || [])
      ]
    });

    const fixture = testBed.createComponent(componentType);
    const component = fixture.componentInstance;
    
    return { fixture, component, testBed };
  }

  static getDefaultMockProviders() {
    return [
      { provide: 'FeatureFlagService', useClass: MockFeatureFlagService },
      { provide: 'MemoryManagementService', useClass: MockMemoryManagementService },
      { provide: 'PerformanceService', useClass: MockPerformanceService },
      { provide: 'EventBusService', useClass: MockEventBusService },
      { provide: 'WebWorkerService', useClass: MockWebWorkerService },
      { provide: 'PwaService', useClass: MockPwaService }
    ];
  }

  static async waitForAsync(fn: () => any, timeout = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Async operation timeout')), timeout);
      
      try {
        const result = fn();
        if (result && typeof result.then === 'function') {
          result.then(resolve).catch(reject).finally(() => clearTimeout(timer));
        } else {
          clearTimeout(timer);
          resolve(result);
        }
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  static mockLocalStorage() {
    let store: Record<string, string> = {};
    
    const mockStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => store[key] = value,
      removeItem: (key: string) => delete store[key],
      clear: () => store = {},
      get length() { return Object.keys(store).length; },
      key: (index: number) => Object.keys(store)[index] || null
    };

    Object.defineProperty(window, 'localStorage', { value: mockStorage });
    Object.defineProperty(window, 'sessionStorage', { value: mockStorage });
    
    return mockStorage;
  }

  static mockIndexedDB() {
    const mockDB = {
      open: () => Promise.resolve({
        transaction: () => ({
          objectStore: () => ({
            add: () => Promise.resolve(),
            get: () => Promise.resolve({}),
            put: () => Promise.resolve(),
            delete: () => Promise.resolve(),
            getAll: () => Promise.resolve([])
          })
        })
      })
    };

    Object.defineProperty(window, 'indexedDB', { value: mockDB });
    return mockDB;
  }

  static createMockHTTPResponse(data: any, status = 200) {
    return {
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: new Headers(),
      body: JSON.stringify(data),
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      ok: status >= 200 && status < 300
    };
  }

  static simulateUserEvent(element: HTMLElement, eventType: string, eventData: any = {}) {
    const event = new Event(eventType, { bubbles: true, cancelable: true });
    Object.assign(event, eventData);
    element.dispatchEvent(event);
  }

  static simulateAsyncError(errorMessage = 'Test error') {
    return Promise.reject(new Error(errorMessage));
  }
}

// Performance testing utilities
export class PerformanceTestingUtilities {
  static measureRenderTime(fn: () => void): number {
    const start = performance.now();
    fn();
    return performance.now() - start;
  }

  static async measureAsyncTime(fn: () => Promise<any>): Promise<number> {
    const start = performance.now();
    await fn();
    return performance.now() - start;
  }

  static simulateHighMemoryUsage(): void {
    // Create large objects to simulate memory pressure
    const largeArray = new Array(1000000).fill('test data');
    setTimeout(() => {
      // Cleanup after test
      largeArray.length = 0;
    }, 100);
  }

  static simulateSlowNetwork(delay = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Custom matchers for Jest/Jasmine
export const customMatchers = {
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveBeenCalledWithObject(received: any, expected: any) {
    const pass = received.calls.some((call: any) => {
      return JSON.stringify(call.args[0]) === JSON.stringify(expected);
    });
    
    if (pass) {
      return {
        message: () => `expected function not to have been called with object`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected function to have been called with object`,
        pass: false,
      };
    }
  }
};

// Test data factories
export class TestDataFactory {
  static createCard(overrides: any = {}) {
    return {
      id: 'test-card-1',
      title: 'Test Card',
      type: 'company',
      category: 'business',
      content: {
        name: 'Test Company',
        description: 'A test company for testing purposes'
      },
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        version: 1
      },
      ...overrides
    };
  }

  static createCards(count = 5) {
    return Array.from({ length: count }, (_, index) => 
      this.createCard({
        id: `test-card-${index + 1}`,
        title: `Test Card ${index + 1}`,
        content: {
          name: `Test Company ${index + 1}`,
          description: `Test description ${index + 1}`
        }
      })
    );
  }

  static createUser(overrides: any = {}) {
    return {
      id: 'test-user-1',
      email: 'test@example.com',
      name: 'Test User',
      preferences: {
        theme: 'light',
        notifications: true,
        analytics: true
      },
      ...overrides
    };
  }

  static createAnalyticsEvent(overrides: any = {}) {
    return {
      id: 'test-event-1',
      type: 'card_view',
      timestamp: Date.now(),
      data: {
        cardId: 'test-card-1',
        duration: 1000
      },
      ...overrides
    };
  }
}
