/**
 * Angular Signals Utilities
 * 
 * Modern reactive state management utilities leveraging Angular Signals.
 * Provides type-safe, performant state management patterns.
 * 
 * @example
 * ```typescript
 * import { createSignalStore, createAsyncSignal, createLinkedSignal } from 'osi-cards-lib';
 * 
 * // Create a signal-based store
 * const store = createSignalStore({
 *   cards: [] as AICardConfig[],
 *   isLoading: false,
 *   error: null as Error | null
 * });
 * 
 * // Use in component
 * const cards = store.select(s => s.cards);
 * store.update(s => ({ ...s, isLoading: true }));
 * ```
 */

import { signal, computed, Signal, WritableSignal, effect, untracked } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subject, BehaviorSubject, from } from 'rxjs';
import { map, distinctUntilChanged, shareReplay, catchError, startWith } from 'rxjs/operators';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Async signal state
 */
export interface AsyncSignalState<T> {
  value: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Store action for logging/debugging
 */
export interface StoreAction<T> {
  type: string;
  payload?: unknown;
  prevState: T;
  nextState: T;
  timestamp: number;
}

/**
 * Signal store options
 */
export interface SignalStoreOptions<T> {
  /** Enable action logging */
  enableLogging?: boolean;
  /** Enable undo/redo support */
  enableHistory?: boolean;
  /** Maximum history size */
  maxHistorySize?: number;
  /** Custom equality function */
  equals?: (a: T, b: T) => boolean;
  /** Persist state to storage */
  persist?: {
    key: string;
    storage?: Storage;
  };
}

// ============================================================================
// ASYNC SIGNAL
// ============================================================================

/**
 * Create an async signal that tracks loading/error states
 * 
 * @param source - Observable or Promise source
 * @param initialValue - Initial value while loading
 * @returns Object with value, loading, and error signals
 */
export function createAsyncSignal<T>(
  source: Observable<T> | Promise<T>,
  initialValue: T | null = null
): {
  value: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  state: Signal<AsyncSignalState<T>>;
  reload: (newSource: Observable<T> | Promise<T>) => void;
} {
  const valueSignal = signal<T | null>(initialValue);
  const loadingSignal = signal(true);
  const errorSignal = signal<Error | null>(null);
  
  const stateSignal = computed<AsyncSignalState<T>>(() => ({
    value: valueSignal(),
    loading: loadingSignal(),
    error: errorSignal()
  }));

  const loadSource = (src: Observable<T> | Promise<T>) => {
    loadingSignal.set(true);
    errorSignal.set(null);
    
    const observable = src instanceof Promise ? from(src) : src;
    
    observable.pipe(
      catchError(error => {
        errorSignal.set(error instanceof Error ? error : new Error(String(error)));
        return [];
      })
    ).subscribe({
      next: (value) => {
        valueSignal.set(value);
        loadingSignal.set(false);
      },
      error: (error) => {
        errorSignal.set(error instanceof Error ? error : new Error(String(error)));
        loadingSignal.set(false);
      },
      complete: () => {
        loadingSignal.set(false);
      }
    });
  };

  loadSource(source);

  return {
    value: valueSignal.asReadonly(),
    loading: loadingSignal.asReadonly(),
    error: errorSignal.asReadonly(),
    state: stateSignal,
    reload: loadSource
  };
}

// ============================================================================
// SIGNAL STORE
// ============================================================================

/**
 * Create a signal-based store with selectors and history support
 * 
 * @param initialState - Initial store state
 * @param options - Store options
 * @returns Store with state management methods
 */
export function createSignalStore<T extends object>(
  initialState: T,
  options: SignalStoreOptions<T> = {}
) {
  const {
    enableLogging = false,
    enableHistory = false,
    maxHistorySize = 50,
    equals = (a, b) => JSON.stringify(a) === JSON.stringify(b),
    persist
  } = options;

  // Load persisted state
  let loadedState = initialState;
  if (persist) {
    try {
      const storage = persist.storage ?? localStorage;
      const stored = storage.getItem(persist.key);
      if (stored) {
        loadedState = { ...initialState, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore storage errors
    }
  }

  const state = signal<T>(loadedState);
  const history: T[] = enableHistory ? [loadedState] : [];
  const historyIndex = signal(0);
  const actionLog: StoreAction<T>[] = [];

  // Persist state changes
  if (persist) {
    effect(() => {
      const currentState = state();
      try {
        const storage = persist.storage ?? localStorage;
        storage.setItem(persist.key, JSON.stringify(currentState));
      } catch {
        // Ignore storage errors
      }
    });
  }

  /**
   * Select a slice of state
   */
  function select<R>(selector: (state: T) => R): Signal<R> {
    return computed(() => selector(state()));
  }

  /**
   * Update state
   */
  function update(updater: (state: T) => T, actionType = 'UPDATE'): void {
    const prevState = untracked(() => state());
    const nextState = updater(prevState);
    
    if (!equals(prevState, nextState)) {
      state.set(nextState);
      
      if (enableHistory) {
        // Clear redo stack
        history.splice(historyIndex() + 1);
        history.push(nextState);
        
        // Limit history size
        while (history.length > maxHistorySize) {
          history.shift();
        }
        
        historyIndex.set(history.length - 1);
      }
      
      if (enableLogging) {
        const action: StoreAction<T> = {
          type: actionType,
          prevState,
          nextState,
          timestamp: Date.now()
        };
        actionLog.push(action);
        console.log('[SignalStore]', actionType, { prevState, nextState });
      }
    }
  }

  /**
   * Set entire state
   */
  function set(newState: T, actionType = 'SET'): void {
    update(() => newState, actionType);
  }

  /**
   * Reset to initial state
   */
  function reset(): void {
    update(() => initialState, 'RESET');
    if (enableHistory) {
      history.length = 0;
      history.push(initialState);
      historyIndex.set(0);
    }
  }

  /**
   * Undo last change
   */
  function undo(): boolean {
    if (!enableHistory) return false;
    
    const currentIndex = historyIndex();
    if (currentIndex > 0) {
      historyIndex.set(currentIndex - 1);
      const prevState = history[currentIndex - 1];
      if (prevState) {
        state.set(prevState);
      }
      return true;
    }
    return false;
  }

  /**
   * Redo last undone change
   */
  function redo(): boolean {
    if (!enableHistory) return false;
    
    const currentIndex = historyIndex();
    if (currentIndex < history.length - 1) {
      historyIndex.set(currentIndex + 1);
      const nextState = history[currentIndex + 1];
      if (nextState) {
        state.set(nextState);
      }
      return true;
    }
    return false;
  }

  /**
   * Check if undo is available
   */
  const canUndo = computed(() => enableHistory && historyIndex() > 0);

  /**
   * Check if redo is available
   */
  const canRedo = computed(() => enableHistory && historyIndex() < history.length - 1);

  return {
    state: state.asReadonly(),
    select,
    update,
    set,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
    getActionLog: () => [...actionLog]
  };
}

// ============================================================================
// LINKED SIGNAL
// ============================================================================

/**
 * Create a linked signal that derives from a source signal
 * with optional transformation and local overrides
 * 
 * @param source - Source signal to derive from
 * @param transform - Transformation function
 * @returns Linked signal with override capability
 */
export function createLinkedSignal<T, R>(
  source: Signal<T>,
  transform: (value: T) => R
): {
  value: Signal<R>;
  override: (value: R) => void;
  reset: () => void;
  isOverridden: Signal<boolean>;
} {
  const overrideValue = signal<R | null>(null);
  const isOverridden = signal(false);
  
  const value = computed(() => {
    if (isOverridden()) {
      return overrideValue() as R;
    }
    return transform(source());
  });

  return {
    value,
    override: (newValue: R) => {
      overrideValue.set(newValue);
      isOverridden.set(true);
    },
    reset: () => {
      overrideValue.set(null);
      isOverridden.set(false);
    },
    isOverridden: isOverridden.asReadonly()
  };
}

// ============================================================================
// SIGNAL EFFECTS
// ============================================================================

/**
 * Create a debounced effect
 * 
 * @param signalFn - Function returning the signal to watch
 * @param callback - Callback to run on change
 * @param delay - Debounce delay in ms
 */
export function debouncedEffect<T>(
  signalFn: () => T,
  callback: (value: T) => void,
  delay = 300
): void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  effect(() => {
    const value = signalFn();
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      callback(value);
    }, delay);
  });
}

/**
 * Create a throttled effect
 * 
 * @param signalFn - Function returning the signal to watch
 * @param callback - Callback to run on change
 * @param limit - Throttle limit in ms
 */
export function throttledEffect<T>(
  signalFn: () => T,
  callback: (value: T) => void,
  limit = 100
): void {
  let lastRun = 0;
  let pendingValue: T | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  effect(() => {
    const value = signalFn();
    const now = Date.now();
    
    if (now - lastRun >= limit) {
      lastRun = now;
      callback(value);
    } else {
      pendingValue = value;
      
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          timeoutId = null;
          lastRun = Date.now();
          if (pendingValue !== null) {
            callback(pendingValue);
            pendingValue = null;
          }
        }, limit - (now - lastRun));
      }
    }
  });
}

// ============================================================================
// OBSERVABLE INTEROP
// ============================================================================

/**
 * Convert a signal to an observable with distinct values
 * 
 * @param sig - Signal to convert
 * @returns Observable that emits on signal changes
 */
export function signalToObservable<T>(sig: Signal<T>): Observable<T> {
  return toObservable(sig).pipe(
    distinctUntilChanged(),
    shareReplay(1)
  );
}

/**
 * Create a two-way binding between signal and BehaviorSubject
 * 
 * @param sig - Writable signal
 * @param subject - BehaviorSubject to sync with
 */
export function syncSignalWithSubject<T>(
  sig: WritableSignal<T>,
  subject: BehaviorSubject<T>
): { unsubscribe: () => void } {
  // Sync signal -> subject
  const signalEffect = effect(() => {
    const value = sig();
    if (value !== subject.getValue()) {
      subject.next(value);
    }
  });

  // Sync subject -> signal
  const subscription = subject.subscribe(value => {
    if (value !== untracked(() => sig())) {
      sig.set(value);
    }
  });

  return {
    unsubscribe: () => {
      signalEffect.destroy();
      subscription.unsubscribe();
    }
  };
}

// ============================================================================
// FACTORY HELPERS
// ============================================================================

/**
 * Create a signal with initial value from a function
 * (useful for expensive initializations)
 * 
 * @param factory - Function returning initial value
 * @returns Writable signal
 */
export function lazySignal<T>(factory: () => T): WritableSignal<T> {
  let initialized = false;
  let cachedValue: T;
  
  return signal(undefined as T, {
    equal: (a, b) => {
      if (!initialized) {
        initialized = true;
        cachedValue = factory();
        return false;
      }
      return Object.is(a, b);
    }
  });
}

/**
 * Create a collection signal with common array operations
 * 
 * @param initialItems - Initial items
 * @returns Collection signal with utility methods
 */
export function createCollectionSignal<T extends { id: string | number }>(
  initialItems: T[] = []
) {
  const items = signal<T[]>(initialItems);
  
  return {
    items: items.asReadonly(),
    count: computed(() => items().length),
    isEmpty: computed(() => items().length === 0),
    
    add: (item: T) => {
      items.update(current => [...current, item]);
    },
    
    remove: (id: string | number) => {
      items.update(current => current.filter(item => item.id !== id));
    },
    
    update: (id: string | number, updates: Partial<T>) => {
      items.update(current => 
        current.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      );
    },
    
    find: (id: string | number): Signal<T | undefined> => {
      return computed(() => items().find(item => item.id === id));
    },
    
    filter: (predicate: (item: T) => boolean): Signal<T[]> => {
      return computed(() => items().filter(predicate));
    },
    
    set: (newItems: T[]) => {
      items.set(newItems);
    },
    
    clear: () => {
      items.set([]);
    },
    
    reorder: (fromIndex: number, toIndex: number) => {
      items.update(current => {
        const result = [...current];
        const [removed] = result.splice(fromIndex, 1);
        if (removed) {
          result.splice(toIndex, 0, removed);
        }
        return result;
      });
    }
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { Signal, WritableSignal };

