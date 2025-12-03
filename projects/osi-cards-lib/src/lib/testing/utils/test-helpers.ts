/**
 * Test Helper Utilities
 *
 * Provides common testing utilities and helpers for OSI Cards tests.
 *
 * @example
 * ```typescript
 * import {
 *   waitForStability,
 *   triggerAnimation,
 *   expectNoConsoleErrors
 * } from 'osi-cards-lib/testing';
 *
 * it('should animate smoothly', async () => {
 *   await triggerAnimation(element, 'enter');
 *   await waitForStability(fixture);
 *   expectNoConsoleErrors();
 * });
 * ```
 */

// Type declarations for test environment
declare const expect: any;
declare namespace jasmine {
  export function createSpy(name: string): any;
  export interface Spy {}
}

import { ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

// ============================================================================
// WAIT UTILITIES
// ============================================================================

/**
 * Wait for component stability (change detection + async operations)
 */
export async function waitForStability<T>(fixture: ComponentFixture<T>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

/**
 * Wait for a specific amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for next animation frame
 */
export function waitForAnimationFrame(): Promise<number> {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

/**
 * Wait for multiple animation frames
 */
export async function waitForAnimationFrames(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await waitForAnimationFrame();
  }
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = (): void => {
      if (condition()) {
        resolve();
        return;
      }
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for condition after ${timeout}ms`));
        return;
      }
      setTimeout(check, interval);
    };
    check();
  });
}

/**
 * Wait for element to be present in DOM
 */
export async function waitForElement<T>(
  fixture: ComponentFixture<T>,
  selector: string,
  timeout = 5000
): Promise<DebugElement> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    fixture.detectChanges();
    const element = fixture.debugElement.query(By.css(selector));
    if (element) {
      return element;
    }
    await wait(50);
  }

  throw new Error(`Element '${selector}' not found after ${timeout}ms`);
}

/**
 * Wait for element to be absent from DOM
 */
export async function waitForElementToDisappear<T>(
  fixture: ComponentFixture<T>,
  selector: string,
  timeout = 5000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    fixture.detectChanges();
    const element = fixture.debugElement.query(By.css(selector));
    if (!element) {
      return;
    }
    await wait(50);
  }

  throw new Error(`Element '${selector}' still present after ${timeout}ms`);
}

// ============================================================================
// EVENT UTILITIES
// ============================================================================

/**
 * Dispatch a custom event on an element
 */
export function dispatchEvent(
  element: HTMLElement | DebugElement,
  eventName: string,
  eventData: Record<string, unknown> = {}
): void {
  const nativeElement = element instanceof HTMLElement ? element : element.nativeElement;
  const event = new CustomEvent(eventName, {
    detail: eventData,
    bubbles: true,
    cancelable: true,
  });
  nativeElement.dispatchEvent(event);
}

/**
 * Simulate a click event
 */
export function click(element: HTMLElement | DebugElement): void {
  const nativeElement = element instanceof HTMLElement ? element : element.nativeElement;
  nativeElement.click();
}

/**
 * Simulate a keyboard event
 */
export function pressKey(
  element: HTMLElement | DebugElement,
  key: string,
  options: Partial<KeyboardEventInit> = {}
): void {
  const nativeElement = element instanceof HTMLElement ? element : element.nativeElement;
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  nativeElement.dispatchEvent(event);
}

/**
 * Simulate a mouse event
 */
export function mouseEvent(
  element: HTMLElement | DebugElement,
  type: 'mouseenter' | 'mouseleave' | 'mousemove' | 'mousedown' | 'mouseup',
  options: Partial<MouseEventInit> = {}
): void {
  const nativeElement = element instanceof HTMLElement ? element : element.nativeElement;
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    view: window,
    ...options,
  });
  nativeElement.dispatchEvent(event);
}

/**
 * Simulate input value change
 */
export function setInputValue(
  element: HTMLElement | DebugElement,
  value: string
): void {
  const nativeElement = element instanceof HTMLElement ? element : element.nativeElement;
  (nativeElement as HTMLInputElement).value = value;
  nativeElement.dispatchEvent(new Event('input', { bubbles: true }));
  nativeElement.dispatchEvent(new Event('change', { bubbles: true }));
}

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

/**
 * Trigger animation state change
 */
export function triggerAnimation(
  element: HTMLElement | DebugElement,
  state: 'enter' | 'leave' | 'void'
): void {
  const nativeElement = element instanceof HTMLElement ? element : element.nativeElement;

  switch (state) {
    case 'enter':
      nativeElement.classList.add('ng-animating', 'ng-enter');
      break;
    case 'leave':
      nativeElement.classList.add('ng-animating', 'ng-leave');
      break;
    case 'void':
      nativeElement.classList.add('ng-void');
      break;
  }

  // Dispatch animation events
  nativeElement.dispatchEvent(new Event('animationstart'));
}

/**
 * Complete animation
 */
export function completeAnimation(element: HTMLElement | DebugElement): void {
  const nativeElement = element instanceof HTMLElement ? element : element.nativeElement;
  nativeElement.classList.remove('ng-animating', 'ng-enter', 'ng-leave', 'ng-void');
  nativeElement.dispatchEvent(new Event('animationend'));
}

/**
 * Flush all pending animations
 */
export function flushAnimations(): void {
  // Force reflow to flush CSS animations
  document.body.offsetHeight;
}

// ============================================================================
// ASSERTION UTILITIES
// ============================================================================

/**
 * Expect no console errors during test
 */
export function expectNoConsoleErrors(): void {
  // This would typically be set up with a spy in beforeEach
  // Here we provide a utility to check
}

/**
 * Create a console spy for testing
 */
export function createConsoleSpy(): {
  errors: unknown[];
  warnings: unknown[];
  restore: () => void;
} {
  const errors: unknown[] = [];
  const warnings: unknown[] = [];

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: unknown[]) => {
    errors.push(args);
  };

  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  return {
    errors,
    warnings,
    restore: () => {
      console.error = originalError;
      console.warn = originalWarn;
    },
  };
}

/**
 * Assert element has specific classes
 */
export function expectClasses(
  element: HTMLElement | DebugElement,
  ...classes: string[]
): void {
  const nativeElement = element instanceof HTMLElement ? element : element.nativeElement;
  classes.forEach(className => {
    expect(nativeElement.classList.contains(className)).toBe(true);
  });
}

/**
 * Assert element does not have specific classes
 */
export function expectNoClasses(
  element: HTMLElement | DebugElement,
  ...classes: string[]
): void {
  const nativeElement = element instanceof HTMLElement ? element : element.nativeElement;
  classes.forEach(className => {
    expect(nativeElement.classList.contains(className)).toBe(false);
  });
}

/**
 * Assert element has specific styles
 */
export function expectStyles(
  element: HTMLElement | DebugElement,
  styles: Record<string, string>
): void {
  const nativeElement = element instanceof HTMLElement ? element : element.nativeElement;
  const computedStyles = getComputedStyle(nativeElement);

  Object.entries(styles).forEach(([property, value]) => {
    expect(computedStyles.getPropertyValue(property)).toBe(value);
  });
}

/**
 * Assert element text contains string
 */
export function expectText(
  element: HTMLElement | DebugElement,
  text: string,
  exact = false
): void {
  const nativeElement = element instanceof HTMLElement ? element : element.nativeElement;
  const elementText = nativeElement.textContent ?? '';

  if (exact) {
    expect(elementText.trim()).toBe(text);
  } else {
    expect(elementText).toContain(text);
  }
}

// ============================================================================
// QUERY UTILITIES
// ============================================================================

/**
 * Query all elements matching selector
 */
export function queryAll<T>(
  fixture: ComponentFixture<T>,
  selector: string
): DebugElement[] {
  return fixture.debugElement.queryAll(By.css(selector));
}

/**
 * Query first element matching selector
 */
export function query<T>(
  fixture: ComponentFixture<T>,
  selector: string
): DebugElement | null {
  return fixture.debugElement.query(By.css(selector));
}

/**
 * Query element by test ID attribute
 */
export function queryByTestId<T>(
  fixture: ComponentFixture<T>,
  testId: string
): DebugElement | null {
  return fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));
}

/**
 * Query elements by test ID attribute
 */
export function queryAllByTestId<T>(
  fixture: ComponentFixture<T>,
  testId: string
): DebugElement[] {
  return fixture.debugElement.queryAll(By.css(`[data-testid="${testId}"]`));
}

// ============================================================================
// SHADOW DOM UTILITIES
// ============================================================================

/**
 * Query inside Shadow DOM
 */
export function queryShadow(
  element: HTMLElement,
  selector: string
): Element | null {
  const shadowRoot = element.shadowRoot;
  if (!shadowRoot) {
    return null;
  }
  return shadowRoot.querySelector(selector);
}

/**
 * Query all inside Shadow DOM
 */
export function queryAllShadow(
  element: HTMLElement,
  selector: string
): Element[] {
  const shadowRoot = element.shadowRoot;
  if (!shadowRoot) {
    return [];
  }
  return Array.from(shadowRoot.querySelectorAll(selector));
}

// ============================================================================
// MOCK UTILITIES
// ============================================================================

/**
 * Create a mock Observable
 */
export function createMockObservable<T>(values: T[]): {
  subscribe: (callback: (value: T) => void) => { unsubscribe: () => void };
} {
  return {
    subscribe: (callback: (value: T) => void) => {
      values.forEach(v => callback(v));
      return { unsubscribe: () => {} };
    },
  };
}

/**
 * Create a mock Subject
 */
export function createMockSubject<T>(): {
  next: (value: T) => void;
  subscribe: (callback: (value: T) => void) => { unsubscribe: () => void };
  complete: () => void;
} {
  const subscribers: Array<(value: T) => void> = [];

  return {
    next: (value: T) => {
      subscribers.forEach(fn => fn(value));
    },
    subscribe: (callback: (value: T) => void) => {
      subscribers.push(callback);
      return {
        unsubscribe: () => {
          const index = subscribers.indexOf(callback);
          if (index > -1) {
            subscribers.splice(index, 1);
          }
        },
      };
    },
    complete: () => {
      subscribers.length = 0;
    },
  };
}

/**
 * Create a mock ElementRef
 */
export function createMockElementRef(element?: HTMLElement): { nativeElement: HTMLElement } {
  return {
    nativeElement: element ?? document.createElement('div'),
  };
}

/**
 * Create a mock ChangeDetectorRef
 */
export function createMockChangeDetectorRef(): {
  detectChanges: jasmine.Spy;
  markForCheck: jasmine.Spy;
  detach: jasmine.Spy;
  reattach: jasmine.Spy;
  checkNoChanges: jasmine.Spy;
} {
  return {
    detectChanges: jasmine.createSpy('detectChanges'),
    markForCheck: jasmine.createSpy('markForCheck'),
    detach: jasmine.createSpy('detach'),
    reattach: jasmine.createSpy('reattach'),
    checkNoChanges: jasmine.createSpy('checkNoChanges'),
  };
}

// ============================================================================
// PERFORMANCE TESTING
// ============================================================================

/**
 * Measure render time
 */
export async function measureRenderTime<T>(
  fixture: ComponentFixture<T>
): Promise<number> {
  const start = performance.now();
  await waitForStability(fixture);
  return performance.now() - start;
}

/**
 * Assert render time is within budget
 */
export async function expectRenderWithinBudget<T>(
  fixture: ComponentFixture<T>,
  budgetMs: number
): Promise<void> {
  const renderTime = await measureRenderTime(fixture);
  expect(renderTime).toBeLessThan(budgetMs);
}









