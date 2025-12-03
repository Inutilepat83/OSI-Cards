/**
 * Component Lifecycle Helpers
 *
 * Utilities for working with Angular component lifecycle hooks
 * in a more functional and composable way.
 *
 * Features:
 * - Lifecycle observables
 * - Decorator-based hooks
 * - Composable lifecycle logic
 * - Type-safe hooks
 *
 * @example
 * ```typescript
 * import { OnInit$, AfterViewInit$ } from '@osi-cards/utils';
 *
 * @Component({...})
 * class MyComponent {
 *   private init$ = OnInit$(this);
 *   private afterViewInit$ = AfterViewInit$(this);
 *
 *   constructor() {
 *     this.init$.subscribe(() => {
 *       console.log('Component initialized');
 *     });
 *   }
 * }
 * ```
 */

import { Subject, Observable, take } from 'rxjs';
import { OnInit, OnDestroy, AfterViewInit, AfterContentInit, OnChanges, SimpleChanges } from '@angular/core';

/**
 * Lifecycle hook symbol keys
 */
const LIFECYCLE_HOOKS = {
  INIT: Symbol('__onInit$__'),
  DESTROY: Symbol('__onDestroy$__'),
  AFTER_VIEW_INIT: Symbol('__afterViewInit$__'),
  AFTER_CONTENT_INIT: Symbol('__afterContentInit$__'),
  CHANGES: Symbol('__onChanges$__'),
} as const;

/**
 * Get or create lifecycle subject
 */
function getLifecycleSubject<T>(
  instance: any,
  hook: symbol,
  lifecycleMethod: string
): Subject<T> {
  if (!instance[hook]) {
    instance[hook] = new Subject<T>();

    // Hook into lifecycle method
    const original = instance[lifecycleMethod];
    instance[lifecycleMethod] = function (...args: any[]) {
      instance[hook].next(args[0] as T);

      if (original && typeof original === 'function') {
        original.apply(instance, args);
      }
    };
  }

  return instance[hook];
}

/**
 * Get OnInit observable for component
 *
 * @param instance - Component instance
 * @returns Observable that emits when ngOnInit is called
 *
 * @example
 * ```typescript
 * @Component({...})
 * class MyComponent implements OnInit {
 *   private init$ = OnInit$(this);
 *
 *   constructor() {
 *     this.init$.subscribe(() => {
 *       console.log('Component initialized');
 *     });
 *   }
 *
 *   ngOnInit() {
 *     // Observable will emit here
 *   }
 * }
 * ```
 */
export function OnInit$(instance: OnInit): Observable<void> {
  return getLifecycleSubject<void>(instance, LIFECYCLE_HOOKS.INIT, 'ngOnInit')
    .asObservable()
    .pipe(take(1));
}

/**
 * Get OnDestroy observable for component
 *
 * @param instance - Component instance
 * @returns Observable that emits when ngOnDestroy is called
 *
 * @example
 * ```typescript
 * @Component({...})
 * class MyComponent implements OnDestroy {
 *   private destroy$ = OnDestroy$(this);
 *
 *   ngOnDestroy() {
 *     // Observable will emit here
 *   }
 * }
 * ```
 */
export function OnDestroy$(instance: OnDestroy): Observable<void> {
  return getLifecycleSubject<void>(instance, LIFECYCLE_HOOKS.DESTROY, 'ngOnDestroy')
    .asObservable()
    .pipe(take(1));
}

/**
 * Get AfterViewInit observable for component
 *
 * @param instance - Component instance
 * @returns Observable that emits when ngAfterViewInit is called
 */
export function AfterViewInit$(instance: AfterViewInit): Observable<void> {
  return getLifecycleSubject<void>(instance, LIFECYCLE_HOOKS.AFTER_VIEW_INIT, 'ngAfterViewInit')
    .asObservable()
    .pipe(take(1));
}

/**
 * Get AfterContentInit observable for component
 *
 * @param instance - Component instance
 * @returns Observable that emits when ngAfterContentInit is called
 */
export function AfterContentInit$(instance: AfterContentInit): Observable<void> {
  return getLifecycleSubject<void>(instance, LIFECYCLE_HOOKS.AFTER_CONTENT_INIT, 'ngAfterContentInit')
    .asObservable()
    .pipe(take(1));
}

/**
 * Get OnChanges observable for component
 *
 * @param instance - Component instance
 * @returns Observable that emits when ngOnChanges is called
 *
 * @example
 * ```typescript
 * @Component({...})
 * class MyComponent implements OnChanges {
 *   private changes$ = OnChanges$(this);
 *
 *   constructor() {
 *     this.changes$.subscribe(changes => {
 *       console.log('Input changed:', changes);
 *     });
 *   }
 *
 *   ngOnChanges(changes: SimpleChanges) {
 *     // Observable will emit here
 *   }
 * }
 * ```
 */
export function OnChanges$(instance: OnChanges): Observable<SimpleChanges> {
  return getLifecycleSubject<SimpleChanges>(instance, LIFECYCLE_HOOKS.CHANGES, 'ngOnChanges')
    .asObservable();
}

/**
 * Run callback when component initializes
 *
 * @param instance - Component instance
 * @param callback - Callback to run
 *
 * @example
 * ```typescript
 * constructor() {
 *   onInit(this, () => {
 *     console.log('Component initialized');
 *   });
 * }
 * ```
 */
export function onInit(instance: OnInit, callback: () => void): void {
  OnInit$(instance).subscribe(callback);
}

/**
 * Run callback when component is destroyed
 *
 * @param instance - Component instance
 * @param callback - Callback to run
 */
export function onDestroy(instance: OnDestroy, callback: () => void): void {
  OnDestroy$(instance).subscribe(callback);
}

/**
 * Run callback after view is initialized
 *
 * @param instance - Component instance
 * @param callback - Callback to run
 */
export function afterViewInit(instance: AfterViewInit, callback: () => void): void {
  AfterViewInit$(instance).subscribe(callback);
}

/**
 * Run callback after content is initialized
 *
 * @param instance - Component instance
 * @param callback - Callback to run
 */
export function afterContentInit(instance: AfterContentInit, callback: () => void): void {
  AfterContentInit$(instance).subscribe(callback);
}

/**
 * Run callback on input changes
 *
 * @param instance - Component instance
 * @param callback - Callback to run with changes
 */
export function onChanges(
  instance: OnChanges,
  callback: (changes: SimpleChanges) => void
): void {
  OnChanges$(instance).subscribe(callback);
}

/**
 * Run callback on specific input change
 *
 * @param instance - Component instance
 * @param inputName - Name of input to watch
 * @param callback - Callback to run with new value
 *
 * @example
 * ```typescript
 * @Component({...})
 * class MyComponent {
 *   @Input() userId!: string;
 *
 *   constructor() {
 *     onInputChange(this, 'userId', (newId) => {
 *       console.log('User ID changed:', newId);
 *     });
 *   }
 * }
 * ```
 */
export function onInputChange<T = any>(
  instance: OnChanges,
  inputName: string,
  callback: (value: T, previousValue: T | undefined) => void
): void {
  OnChanges$(instance).subscribe(changes => {
    const change = changes[inputName];
    if (change) {
      callback(change.currentValue, change.previousValue);
    }
  });
}

/**
 * Run callback when specific input changes (first time only)
 *
 * @param instance - Component instance
 * @param inputName - Name of input to watch
 * @param callback - Callback to run
 */
export function onFirstInputChange<T = any>(
  instance: OnChanges,
  inputName: string,
  callback: (value: T) => void
): void {
  OnChanges$(instance)
    .pipe(take(1))
    .subscribe(changes => {
      const change = changes[inputName];
      if (change) {
        callback(change.currentValue);
      }
    });
}

/**
 * Wait for lifecycle event
 *
 * @param instance - Component instance
 * @param lifecycle - Lifecycle hook name
 * @returns Promise that resolves when lifecycle hook is called
 *
 * @example
 * ```typescript
 * async ngOnInit() {
 *   await waitForLifecycle(this, 'AfterViewInit');
 *   // View is now initialized
 *   this.doSomethingWithView();
 * }
 * ```
 */
export async function waitForLifecycle(
  instance: any,
  lifecycle: 'OnInit' | 'AfterViewInit' | 'AfterContentInit' | 'OnDestroy'
): Promise<void> {
  switch (lifecycle) {
    case 'OnInit':
      return OnInit$(instance).toPromise();
    case 'AfterViewInit':
      return AfterViewInit$(instance).toPromise();
    case 'AfterContentInit':
      return AfterContentInit$(instance).toPromise();
    case 'OnDestroy':
      return OnDestroy$(instance).toPromise();
  }
}

/**
 * Combine multiple lifecycle hooks
 *
 * @param instance - Component instance
 * @param lifecycles - Array of lifecycle names
 * @returns Observable that emits for any of the specified lifecycles
 *
 * @example
 * ```typescript
 * const viewReady$ = combineLifecycles(
 *   this,
 *   ['AfterViewInit', 'AfterContentInit']
 * );
 *
 * viewReady$.subscribe(() => {
 *   console.log('View or content ready');
 * });
 * ```
 */
export function combineLifecycles(
  instance: any,
  lifecycles: Array<'OnInit' | 'AfterViewInit' | 'AfterContentInit'>
): Observable<void> {
  const observables: Observable<void>[] = [];

  lifecycles.forEach(lifecycle => {
    switch (lifecycle) {
      case 'OnInit':
        observables.push(OnInit$(instance));
        break;
      case 'AfterViewInit':
        observables.push(AfterViewInit$(instance));
        break;
      case 'AfterContentInit':
        observables.push(AfterContentInit$(instance));
        break;
    }
  });

  return new Observable<void>(subscriber => {
    observables.forEach(obs => {
      obs.subscribe(() => subscriber.next());
    });
  });
}

/**
 * Lifecycle timing decorator
 *
 * Measures time spent in lifecycle hooks.
 *
 * @param hookName - Name of lifecycle hook to measure
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   @MeasureLifecycle('OnInit')
 *   ngOnInit() {
 *     // Time will be logged
 *   }
 * }
 * ```
 */
export function MeasureLifecycle(hookName: string): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const start = performance.now();
      const result = originalMethod.apply(this, args);
      const duration = performance.now() - start;

      console.log(`[Lifecycle] ${hookName} took ${duration.toFixed(2)}ms`);

      return result;
    };

    return descriptor;
  };
}

