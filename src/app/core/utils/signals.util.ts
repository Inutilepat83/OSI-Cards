/**
 * Signal Utilities for Angular 20+ (Point 96)
 *
 * Helpers for migrating to signal-based reactivity.
 * Provides utilities for working with Angular signals.
 *
 * @example
 * ```typescript
 * import { toSignalWithDefault, computedAsync, signalState } from './signals.util';
 *
 * // Convert observable to signal with default
 * const data = toSignalWithDefault(data$, []);
 *
 * // Async computed signal
 * const result = computedAsync(() => fetchData(id()));
 *
 * // Signal-based state management
 * const state = signalState({ count: 0, loading: false });
 * state.update(s => ({ ...s, count: s.count + 1 }));
 * ```
 */

import {
  computed,
  type CreateEffectOptions,
  DestroyRef,
  effect,
  inject,
  Injector,
  signal,
  Signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import { toObservable, toSignal, type ToSignalOptions } from '@angular/core/rxjs-interop';
import { from, isObservable, Observable, Subject, takeUntil } from 'rxjs';

// =============================================================================
// TYPES
// =============================================================================

export type SignalValue<T> = T extends Signal<infer U> ? U : never;

export interface AsyncSignalState<T> {
  value: T | undefined;
  loading: boolean;
  error: Error | null;
}

export interface SignalStateOptions<T> {
  /** Initial state */
  initial: T;
  /** Whether to persist to localStorage */
  persist?: boolean;
  /** Storage key for persistence */
  storageKey?: string;
  /** Custom equality function */
  equal?: (a: T, b: T) => boolean;
}

// =============================================================================
// CONVERSION UTILITIES
// =============================================================================

/**
 * Convert Observable to Signal with a required default value
 * Unlike toSignal, this always has a defined value
 */
export function toSignalWithDefault<T>(
  source: Observable<T>,
  initialValue: T,
  options?: Omit<ToSignalOptions<T>, 'initialValue' | 'requireSync'>
): Signal<T> {
  return toSignal(source, { ...options, initialValue }) as Signal<T>;
}

/**
 * Convert a Promise to a Signal
 */
export function fromPromise<T>(promise: Promise<T>, initialValue: T): Signal<T> {
  const sig = signal<T>(initialValue);

  promise
    .then((value) => {
      sig.set(value);
    })
    .catch((error) => {
      console.error('fromPromise error:', error);
    });

  return sig.asReadonly();
}

/**
 * Convert a Signal to Observable
 * Re-export for convenience
 */
export { toObservable };

// =============================================================================
// COMPUTED UTILITIES
// =============================================================================

/**
 * Create a computed signal that handles async operations
 */
export function computedAsync<T>(
  computation: () => Promise<T> | Observable<T>,
  initialValue: T,
  injector?: Injector
): Signal<AsyncSignalState<T>> {
  const state = signal<AsyncSignalState<T>>({
    value: initialValue,
    loading: false,
    error: null,
  });

  const destroyRef = injector ? injector.get(DestroyRef) : inject(DestroyRef);
  const destroy$ = new Subject<void>();

  destroyRef.onDestroy(() => {
    destroy$.next();
    destroy$.complete();
  });

  effect(
    () => {
      const result = computation();

      untracked(() => {
        state.update((s) => ({ ...s, loading: true, error: null }));
      });

      const observable = isObservable(result) ? result : from(result);

      observable.pipe(takeUntil(destroy$)).subscribe({
        next: (value) => {
          state.set({ value, loading: false, error: null });
        },
        error: (error) => {
          state.update((s) => ({ ...s, loading: false, error }));
        },
      });
    },
    { allowSignalWrites: true }
  );

  return state.asReadonly();
}

/**
 * Create a computed signal with memoization
 */
export function computedMemo<T>(computation: () => T, equals?: (a: T, b: T) => boolean): Signal<T> {
  return equals ? computed(computation, { equal: equals }) : computed(computation);
}

/**
 * Create a computed signal that only updates when dependencies change significantly
 */
export function computedDebounced<T>(computation: () => T, delay = 100): Signal<T> {
  const immediate = computed(computation);
  const debounced = signal<T>(untracked(immediate));

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  effect(
    () => {
      const value = immediate();

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        debounced.set(value);
        timeoutId = null;
      }, delay);
    },
    { allowSignalWrites: true }
  );

  return debounced.asReadonly();
}

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * Create a signal-based state container
 */
export function signalState<T extends object>(
  options: SignalStateOptions<T>
): WritableSignal<T> & {
  update: (updater: (state: T) => T) => void;
  select: <K extends keyof T>(key: K) => Signal<T[K]>;
  reset: () => void;
} {
  const { initial, persist, storageKey, equal } = options;

  // Load from storage if persisting
  let initialState = initial;
  if (persist && storageKey) {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        initialState = { ...initial, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore storage errors
    }
  }

  const state = equal ? signal<T>(initialState, { equal }) : signal<T>(initialState);

  // Persist on changes
  if (persist && storageKey) {
    effect(() => {
      const current = state();
      try {
        localStorage.setItem(storageKey, JSON.stringify(current));
      } catch {
        // Ignore storage errors
      }
    });
  }

  // Add utility methods
  const enhanced = state as WritableSignal<T> & {
    update: (updater: (state: T) => T) => void;
    select: <K extends keyof T>(key: K) => Signal<T[K]>;
    reset: () => void;
  };

  enhanced.update = (updater: (state: T) => T) => {
    state.update(updater);
  };

  enhanced.select = <K extends keyof T>(key: K): Signal<T[K]> => {
    return computed(() => state()[key]);
  };

  enhanced.reset = () => {
    state.set(initial);
  };

  return enhanced;
}

/**
 * Create a simple signal store with actions
 */
export function signalStore<
  T extends object,
  A extends Record<string, (state: T, ...args: unknown[]) => T>,
>(
  initialState: T,
  actions: A
): {
  state: Signal<T>;
  actions: {
    [K in keyof A]: (...args: Parameters<A[K]> extends [T, ...infer P] ? P : never) => void;
  };
  select: <K extends keyof T>(key: K) => Signal<T[K]>;
} {
  const state = signal<T>(initialState);

  const boundActions = {} as {
    [K in keyof A]: (...args: Parameters<A[K]> extends [T, ...infer P] ? P : never) => void;
  };

  for (const [name, action] of Object.entries(actions) as [keyof A, A[keyof A]][]) {
    boundActions[name] = ((...args: unknown[]) => {
      state.update((s) => action(s, ...args));
    }) as (typeof boundActions)[typeof name];
  }

  return {
    state: state.asReadonly(),
    actions: boundActions,
    select: <K extends keyof T>(key: K) => computed(() => state()[key]),
  };
}

// =============================================================================
// EFFECT UTILITIES
// =============================================================================

/**
 * Create an effect that runs once and cleans up
 */
export function effectOnce(fn: () => void | (() => void), options?: CreateEffectOptions): void {
  let cleanup: (() => void) | void;
  let hasRun = false;

  effect(() => {
    if (!hasRun) {
      hasRun = true;
      cleanup = fn();
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, options);
}

/**
 * Create an effect that only runs when a condition is true
 */
export function effectWhen(
  condition: () => boolean,
  fn: () => void | (() => void),
  options?: CreateEffectOptions
): void {
  effect(() => {
    if (condition()) {
      return fn();
    }
    return undefined;
  }, options);
}

/**
 * Create an effect that logs signal changes (for debugging)
 */
export function effectDebug<T>(sig: Signal<T>, label = 'Signal'): void {
  effect(() => {
    console.log(`[${label}]`, sig());
  });
}

// =============================================================================
// ARRAY SIGNAL UTILITIES
// =============================================================================

/**
 * Create a signal for array operations
 */
export function signalArray<T>(initial: T[] = []): WritableSignal<T[]> & {
  push: (item: T) => void;
  remove: (predicate: (item: T) => boolean) => void;
  updateAt: (index: number, item: T) => void;
  clear: () => void;
  find: (predicate: (item: T) => boolean) => Signal<T | undefined>;
  filter: (predicate: (item: T) => boolean) => Signal<T[]>;
  length: Signal<number>;
} {
  const arr = signal<T[]>(initial);

  const enhanced = arr as WritableSignal<T[]> & {
    push: (item: T) => void;
    remove: (predicate: (item: T) => boolean) => void;
    updateAt: (index: number, item: T) => void;
    clear: () => void;
    find: (predicate: (item: T) => boolean) => Signal<T | undefined>;
    filter: (predicate: (item: T) => boolean) => Signal<T[]>;
    length: Signal<number>;
  };

  enhanced.push = (item: T) => {
    arr.update((a) => [...a, item]);
  };

  enhanced.remove = (predicate: (item: T) => boolean) => {
    arr.update((a) => a.filter((item) => !predicate(item)));
  };

  enhanced.updateAt = (index: number, item: T) => {
    arr.update((a) => {
      const newArr = [...a];
      newArr[index] = item;
      return newArr;
    });
  };

  enhanced.clear = () => {
    arr.set([]);
  };

  enhanced.find = (predicate: (item: T) => boolean) => {
    return computed(() => arr().find(predicate));
  };

  enhanced.filter = (predicate: (item: T) => boolean) => {
    return computed(() => arr().filter(predicate));
  };

  enhanced.length = computed(() => arr().length);

  return enhanced;
}

// =============================================================================
// MAP SIGNAL UTILITIES
// =============================================================================

/**
 * Create a signal for Map operations
 */
export function signalMap<K, V>(
  initial = new Map<K, V>()
): WritableSignal<Map<K, V>> & {
  getEntry: (key: K) => Signal<V | undefined>;
  setEntry: (key: K, value: V) => void;
  deleteEntry: (key: K) => void;
  clear: () => void;
  has: (key: K) => Signal<boolean>;
  size: Signal<number>;
} {
  const map = signal<Map<K, V>>(new Map(initial));

  const enhanced = map as WritableSignal<Map<K, V>> & {
    getEntry: (key: K) => Signal<V | undefined>;
    setEntry: (key: K, value: V) => void;
    deleteEntry: (key: K) => void;
    clear: () => void;
    has: (key: K) => Signal<boolean>;
    size: Signal<number>;
  };

  enhanced.getEntry = (key: K) => {
    return computed(() => map().get(key));
  };

  enhanced.setEntry = (key: K, value: V) => {
    map.update((m) => {
      const newMap = new Map(m);
      newMap.set(key, value);
      return newMap;
    });
  };

  enhanced.deleteEntry = (key: K) => {
    map.update((m) => {
      const newMap = new Map(m);
      newMap.delete(key);
      return newMap;
    });
  };

  enhanced.clear = () => {
    map.set(new Map());
  };

  enhanced.has = (key: K) => {
    return computed(() => map().has(key));
  };

  enhanced.size = computed(() => map().size);

  return enhanced;
}
