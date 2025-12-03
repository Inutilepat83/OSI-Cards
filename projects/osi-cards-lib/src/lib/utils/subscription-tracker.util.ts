/**
 * Subscription Auto-Tracking Utility
 *
 * Automatically tracks and cleans up RxJS subscriptions to prevent memory leaks.
 * Provides decorators and utilities for subscription management in Angular components.
 *
 * Features:
 * - Automatic cleanup on destroy
 * - Subscription tracking and debugging
 * - Decorator-based approach
 * - Observable takeUntil integration
 * - Statistics and monitoring
 *
 * @example
 * ```typescript
 * import { AutoUnsubscribe, track } from '@osi-cards/utils';
 *
 * @AutoUnsubscribe()
 * @Component({...})
 * class MyComponent implements OnDestroy {
 *   ngOnInit() {
 *     // Automatically cleaned up
 *     track(this, this.data$.subscribe(data => {...}));
 *   }
 *
 *   ngOnDestroy() {
 *     // Subscriptions automatically unsubscribed
 *   }
 * }
 * ```
 */

import { Observable, Subject, Subscription, takeUntil } from 'rxjs';
import { OnDestroy } from '@angular/core';

/**
 * Symbol for storing subscriptions on component instances
 */
const SUBSCRIPTIONS_KEY = Symbol('__subscriptions__');
const DESTROY_SUBJECT_KEY = Symbol('__destroy$__');

/**
 * Subscription tracker
 *
 * Manages subscriptions for a component and provides cleanup.
 */
export class SubscriptionTracker {
  private subscriptions: Subscription[] = [];
  private namedSubscriptions = new Map<string, Subscription>();
  private active = true;

  /**
   * Track a subscription
   *
   * @param subscription - Subscription to track
   * @param name - Optional name for debugging
   * @returns The subscription (for chaining)
   */
  track(subscription: Subscription, name?: string): Subscription {
    if (!this.active) {
      console.warn('Tracker is no longer active');
      return subscription;
    }

    if (name) {
      // Cancel existing subscription with same name
      const existing = this.namedSubscriptions.get(name);
      if (existing && !existing.closed) {
        existing.unsubscribe();
      }
      this.namedSubscriptions.set(name, subscription);
    }

    this.subscriptions.push(subscription);
    return subscription;
  }

  /**
   * Track multiple subscriptions
   *
   * @param subscriptions - Subscriptions to track
   */
  trackAll(...subscriptions: Subscription[]): void {
    subscriptions.forEach(sub => this.track(sub));
  }

  /**
   * Unsubscribe from a named subscription
   *
   * @param name - Name of subscription to unsubscribe
   * @returns True if subscription was found and unsubscribed
   */
  unsubscribe(name: string): boolean {
    const subscription = this.namedSubscriptions.get(name);
    if (subscription && !subscription.closed) {
      subscription.unsubscribe();
      this.namedSubscriptions.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Unsubscribe from all tracked subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach(sub => {
      if (!sub.closed) {
        sub.unsubscribe();
      }
    });

    this.subscriptions = [];
    this.namedSubscriptions.clear();
    this.active = false;
  }

  /**
   * Get count of active subscriptions
   *
   * @returns Number of active subscriptions
   */
  getActiveCount(): number {
    return this.subscriptions.filter(sub => !sub.closed).length;
  }

  /**
   * Get all named subscription names
   *
   * @returns Array of subscription names
   */
  getNames(): string[] {
    return Array.from(this.namedSubscriptions.keys());
  }

  /**
   * Check if tracker has any active subscriptions
   *
   * @returns True if any subscriptions are active
   */
  hasActive(): boolean {
    return this.getActiveCount() > 0;
  }
}

/**
 * Get or create subscription tracker for an instance
 *
 * @param instance - Component instance
 * @returns Subscription tracker
 */
function getTracker(instance: any): SubscriptionTracker {
  if (!instance[SUBSCRIPTIONS_KEY]) {
    instance[SUBSCRIPTIONS_KEY] = new SubscriptionTracker();
  }
  return instance[SUBSCRIPTIONS_KEY];
}

/**
 * Track a subscription on a component
 *
 * @param instance - Component instance
 * @param subscription - Subscription to track
 * @param name - Optional name for debugging
 * @returns The subscription (for chaining)
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   ngOnInit() {
 *     track(this, this.data$.subscribe(...));
 *     track(this, this.updates$.subscribe(...), 'updates');
 *   }
 * }
 * ```
 */
export function track(
  instance: any,
  subscription: Subscription,
  name?: string
): Subscription {
  const tracker = getTracker(instance);
  return tracker.track(subscription, name);
}

/**
 * Track multiple subscriptions on a component
 *
 * @param instance - Component instance
 * @param subscriptions - Subscriptions to track
 *
 * @example
 * ```typescript
 * trackAll(this,
 *   observable1$.subscribe(...),
 *   observable2$.subscribe(...),
 *   observable3$.subscribe(...)
 * );
 * ```
 */
export function trackAll(
  instance: any,
  ...subscriptions: Subscription[]
): void {
  const tracker = getTracker(instance);
  tracker.trackAll(...subscriptions);
}

/**
 * Unsubscribe from a named subscription
 *
 * @param instance - Component instance
 * @param name - Name of subscription
 * @returns True if subscription was found and unsubscribed
 */
export function untrack(instance: any, name: string): boolean {
  const tracker = getTracker(instance);
  return tracker.unsubscribe(name);
}

/**
 * Get subscription tracker statistics for a component
 *
 * @param instance - Component instance
 * @returns Statistics object
 */
export function getSubscriptionStats(instance: any) {
  const tracker = getTracker(instance);
  return {
    active: tracker.getActiveCount(),
    names: tracker.getNames(),
    hasActive: tracker.hasActive(),
  };
}

/**
 * AutoUnsubscribe decorator
 *
 * Automatically unsubscribes from all tracked subscriptions when
 * component's ngOnDestroy is called.
 *
 * @returns Class decorator
 *
 * @example
 * ```typescript
 * @AutoUnsubscribe()
 * @Component({...})
 * class MyComponent implements OnDestroy {
 *   ngOnInit() {
 *     track(this, this.data$.subscribe(...));
 *   }
 *
 *   ngOnDestroy() {
 *     // Subscriptions automatically unsubscribed
 *   }
 * }
 * ```
 */
export function AutoUnsubscribe(): any {
  return function <T extends { new (...args: any[]): any }>(constructor: T) {
    const original = constructor.prototype.ngOnDestroy;

    constructor.prototype.ngOnDestroy = function () {
      const tracker = getTracker(this);
      tracker.unsubscribeAll();

      if (original && typeof original === 'function') {
        original.apply(this);
      }
    };

    return constructor;
  };
}

/**
 * Get or create destroy subject for takeUntil pattern
 *
 * @param instance - Component instance
 * @returns Destroy subject
 *
 * @example
 * ```typescript
 * class MyComponent implements OnDestroy {
 *   private destroy$ = getDestroySubject(this);
 *
 *   ngOnInit() {
 *     this.data$.pipe(
 *       takeUntil(this.destroy$)
 *     ).subscribe(...);
 *   }
 *
 *   ngOnDestroy() {
 *     // destroy$ automatically completed
 *   }
 * }
 * ```
 */
export function getDestroySubject(instance: any): Subject<void> {
  if (!instance[DESTROY_SUBJECT_KEY]) {
    instance[DESTROY_SUBJECT_KEY] = new Subject<void>();

    // Hook into ngOnDestroy
    const original = instance.ngOnDestroy;
    instance.ngOnDestroy = function () {
      const subject = instance[DESTROY_SUBJECT_KEY];
      if (subject) {
        subject.next();
        subject.complete();
      }

      if (original && typeof original === 'function') {
        original.apply(instance);
      }
    };
  }

  return instance[DESTROY_SUBJECT_KEY];
}

/**
 * Create an observable that completes when component is destroyed
 *
 * @param instance - Component instance
 * @returns Pipeable operator
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   ngOnInit() {
 *     this.data$.pipe(
 *       untilDestroyed(this)
 *     ).subscribe(...);
 *   }
 * }
 * ```
 */
export function untilDestroyed(instance: any) {
  const destroy$ = getDestroySubject(instance);
  return <T>(source: Observable<T>): Observable<T> => {
    return source.pipe(takeUntil(destroy$));
  };
}

/**
 * Subscribe decorator
 *
 * Automatically tracks subscription created by method.
 *
 * @param name - Optional name for subscription
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @AutoUnsubscribe()
 * @Component({...})
 * class MyComponent {
 *   @Subscribe('data')
 *   loadData() {
 *     return this.http.get('/api/data').subscribe(...);
 *   }
 * }
 * ```
 */
export function Subscribe(name?: string): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const result = originalMethod.apply(this, args);

      if (result && typeof result.unsubscribe === 'function') {
        const subName = name || String(propertyKey);
        track(this, result, subName);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Create a managed subscription
 *
 * Returns a tuple of [subscription, unsubscribe function].
 *
 * @param instance - Component instance
 * @param subscription - Subscription to manage
 * @param name - Optional name
 * @returns Tuple of [subscription, unsubscribe]
 *
 * @example
 * ```typescript
 * const [sub, unsub] = managedSubscription(
 *   this,
 *   this.data$.subscribe(...)
 * );
 *
 * // Later: unsub();
 * ```
 */
export function managedSubscription(
  instance: any,
  subscription: Subscription,
  name?: string
): [Subscription, () => void] {
  track(instance, subscription, name);

  const unsubscribe = () => {
    if (!subscription.closed) {
      subscription.unsubscribe();
    }
  };

  return [subscription, unsubscribe];
}

/**
 * Subscription pool for managing related subscriptions
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   private pool = new SubscriptionPool();
 *
 *   ngOnInit() {
 *     this.pool.add('data', this.data$.subscribe(...));
 *     this.pool.add('events', this.events$.subscribe(...));
 *   }
 *
 *   refresh() {
 *     this.pool.unsubscribe('data');
 *     this.pool.add('data', this.data$.subscribe(...));
 *   }
 *
 *   ngOnDestroy() {
 *     this.pool.unsubscribeAll();
 *   }
 * }
 * ```
 */
export class SubscriptionPool {
  private subscriptions = new Map<string, Subscription>();

  /**
   * Add a named subscription to the pool
   *
   * @param name - Subscription name
   * @param subscription - Subscription to add
   */
  add(name: string, subscription: Subscription): void {
    // Unsubscribe from existing with same name
    this.unsubscribe(name);
    this.subscriptions.set(name, subscription);
  }

  /**
   * Unsubscribe from a named subscription
   *
   * @param name - Subscription name
   * @returns True if subscription was found and unsubscribed
   */
  unsubscribe(name: string): boolean {
    const sub = this.subscriptions.get(name);
    if (sub && !sub.closed) {
      sub.unsubscribe();
      this.subscriptions.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach(sub => {
      if (!sub.closed) {
        sub.unsubscribe();
      }
    });
    this.subscriptions.clear();
  }

  /**
   * Check if subscription exists
   *
   * @param name - Subscription name
   * @returns True if subscription exists
   */
  has(name: string): boolean {
    return this.subscriptions.has(name);
  }

  /**
   * Get count of active subscriptions
   *
   * @returns Number of active subscriptions
   */
  size(): number {
    return this.subscriptions.size;
  }
}

