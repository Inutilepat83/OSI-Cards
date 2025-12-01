/**
 * Scoped Service Providers
 *
 * Provides utilities for creating component-scoped service instances.
 * Use these when services need to be isolated per component instance.
 *
 * @example
 * ```typescript
 * @Component({
 *   providers: [
 *     provideScopedAnimationService(),
 *     provideScopedSelectionService()
 *   ]
 * })
 * export class MyComponent {
 *   private animationService = inject(ScopedAnimationService);
 * }
 * ```
 *
 * @module providers/scoped-providers
 */

import {
  Provider,
  InjectionToken,
  inject,
  signal,
  computed,
  DestroyRef,
  OnDestroy
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Observable } from 'rxjs';

// ============================================================================
// SCOPED ANIMATION SERVICE
// ============================================================================

/**
 * Token for scoped animation service
 */
export const SCOPED_ANIMATION_SERVICE = new InjectionToken<ScopedAnimationService>(
  'SCOPED_ANIMATION_SERVICE'
);

/**
 * Animation item state
 */
export interface AnimationItemState {
  id: string;
  state: 'pending' | 'entering' | 'entered' | 'exiting' | 'exited';
  index: number;
  timestamp: number;
}

/**
 * Component-scoped animation management service
 */
export class ScopedAnimationService implements OnDestroy {
  private readonly _items = signal<Map<string, AnimationItemState>>(new Map());
  private readonly _isAnimating = signal(false);
  private readonly _staggerDelayMs = signal(40);
  private readonly _animationDurationMs = signal(300);

  private timeouts: ReturnType<typeof setTimeout>[] = [];

  /**
   * All tracked items
   */
  readonly items = this._items.asReadonly();

  /**
   * Whether any animations are running
   */
  readonly isAnimating = this._isAnimating.asReadonly();

  /**
   * Number of items being animated
   */
  readonly animatingCount = computed(() => {
    let count = 0;
    for (const item of this._items().values()) {
      if (item.state === 'entering' || item.state === 'exiting') {
        count++;
      }
    }
    return count;
  });

  /**
   * Configure stagger delay
   */
  setStaggerDelay(ms: number): void {
    this._staggerDelayMs.set(ms);
  }

  /**
   * Configure animation duration
   */
  setAnimationDuration(ms: number): void {
    this._animationDurationMs.set(ms);
  }

  /**
   * Register an item for animation
   */
  register(id: string, index: number): void {
    this._items.update(items => {
      const newItems = new Map(items);
      newItems.set(id, {
        id,
        state: 'pending',
        index,
        timestamp: Date.now()
      });
      return newItems;
    });
  }

  /**
   * Start entrance animation for an item
   */
  animateIn(id: string): void {
    const item = this._items().get(id);
    if (!item) return;

    this._isAnimating.set(true);

    this._items.update(items => {
      const newItems = new Map(items);
      newItems.set(id, { ...item, state: 'entering', timestamp: Date.now() });
      return newItems;
    });

    const delay = item.index * this._staggerDelayMs() + this._animationDurationMs();
    const timeout = setTimeout(() => {
      this._items.update(items => {
        const newItems = new Map(items);
        const current = newItems.get(id);
        if (current?.state === 'entering') {
          newItems.set(id, { ...current, state: 'entered', timestamp: Date.now() });
        }
        return newItems;
      });
      this.checkAnimationComplete();
    }, delay);

    this.timeouts.push(timeout);
  }

  /**
   * Start exit animation for an item
   */
  animateOut(id: string): Promise<void> {
    return new Promise(resolve => {
      const item = this._items().get(id);
      if (!item) {
        resolve();
        return;
      }

      this._isAnimating.set(true);

      this._items.update(items => {
        const newItems = new Map(items);
        newItems.set(id, { ...item, state: 'exiting', timestamp: Date.now() });
        return newItems;
      });

      const timeout = setTimeout(() => {
        this._items.update(items => {
          const newItems = new Map(items);
          newItems.delete(id);
          return newItems;
        });
        this.checkAnimationComplete();
        resolve();
      }, this._animationDurationMs());

      this.timeouts.push(timeout);
    });
  }

  /**
   * Get animation class for an item
   */
  getAnimationClass(id: string): string {
    const item = this._items().get(id);
    if (!item) return '';

    switch (item.state) {
      case 'entering': return 'animate-enter';
      case 'entered': return 'animate-entered';
      case 'exiting': return 'animate-exit';
      default: return '';
    }
  }

  /**
   * Get stagger delay style for an item
   */
  getStaggerDelay(id: string): string {
    const item = this._items().get(id);
    if (!item) return '0ms';
    return `${item.index * this._staggerDelayMs()}ms`;
  }

  /**
   * Reset all animation states
   */
  reset(): void {
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts = [];
    this._items.set(new Map());
    this._isAnimating.set(false);
  }

  ngOnDestroy(): void {
    this.reset();
  }

  private checkAnimationComplete(): void {
    const hasAnimating = Array.from(this._items().values()).some(
      item => item.state === 'entering' || item.state === 'exiting'
    );
    this._isAnimating.set(hasAnimating);
  }
}

/**
 * Provide scoped animation service for a component
 */
export function provideScopedAnimationService(): Provider {
  return {
    provide: SCOPED_ANIMATION_SERVICE,
    useClass: ScopedAnimationService
  };
}

// ============================================================================
// SCOPED SELECTION SERVICE
// ============================================================================

/**
 * Token for scoped selection service
 */
export const SCOPED_SELECTION_SERVICE = new InjectionToken<ScopedSelectionService<unknown>>(
  'SCOPED_SELECTION_SERVICE'
);

/**
 * Component-scoped selection management service
 */
export class ScopedSelectionService<T> implements OnDestroy {
  private readonly _selectedItems = signal<Set<T>>(new Set());
  private readonly _lastSelected = signal<T | null>(null);
  private readonly _multiSelect = signal(true);

  private readonly _selectionChange$ = new Subject<Set<T>>();

  /**
   * Selected items
   */
  readonly selectedItems = this._selectedItems.asReadonly();

  /**
   * Last selected item
   */
  readonly lastSelected = this._lastSelected.asReadonly();

  /**
   * Number of selected items
   */
  readonly selectedCount = computed(() => this._selectedItems().size);

  /**
   * Whether any items are selected
   */
  readonly hasSelection = computed(() => this._selectedItems().size > 0);

  /**
   * Selection change observable
   */
  readonly selectionChange$: Observable<Set<T>> = this._selectionChange$.asObservable();

  /**
   * Enable/disable multi-select
   */
  setMultiSelect(enabled: boolean): void {
    this._multiSelect.set(enabled);
    if (!enabled && this._selectedItems().size > 1) {
      // Keep only last selected
      const last = this._lastSelected();
      if (last) {
        this._selectedItems.set(new Set([last]));
        this._selectionChange$.next(this._selectedItems());
      }
    }
  }

  /**
   * Check if an item is selected
   */
  isSelected(item: T): boolean {
    return this._selectedItems().has(item);
  }

  /**
   * Select an item
   */
  select(item: T): void {
    this._selectedItems.update(items => {
      const newItems = this._multiSelect() ? new Set(items) : new Set<T>();
      newItems.add(item);
      return newItems;
    });
    this._lastSelected.set(item);
    this._selectionChange$.next(this._selectedItems());
  }

  /**
   * Deselect an item
   */
  deselect(item: T): void {
    this._selectedItems.update(items => {
      const newItems = new Set(items);
      newItems.delete(item);
      return newItems;
    });
    if (this._lastSelected() === item) {
      this._lastSelected.set(null);
    }
    this._selectionChange$.next(this._selectedItems());
  }

  /**
   * Toggle item selection
   */
  toggle(item: T): void {
    if (this.isSelected(item)) {
      this.deselect(item);
    } else {
      this.select(item);
    }
  }

  /**
   * Select multiple items
   */
  selectAll(items: T[]): void {
    this._selectedItems.set(new Set(items));
    if (items.length > 0) {
      this._lastSelected.set(items[items.length - 1] ?? null);
    }
    this._selectionChange$.next(this._selectedItems());
  }

  /**
   * Clear all selections
   */
  clear(): void {
    this._selectedItems.set(new Set());
    this._lastSelected.set(null);
    this._selectionChange$.next(this._selectedItems());
  }

  /**
   * Get selected items as array
   */
  getSelectedArray(): T[] {
    return Array.from(this._selectedItems());
  }

  ngOnDestroy(): void {
    this._selectionChange$.complete();
  }
}

/**
 * Provide scoped selection service for a component
 */
export function provideScopedSelectionService<T>(): Provider {
  return {
    provide: SCOPED_SELECTION_SERVICE,
    useClass: ScopedSelectionService<T>
  };
}

// ============================================================================
// SCOPED STATE SERVICE
// ============================================================================

/**
 * Token for scoped state service
 */
export const SCOPED_STATE_SERVICE = new InjectionToken<ScopedStateService<unknown>>(
  'SCOPED_STATE_SERVICE'
);

/**
 * Component-scoped state management service
 */
export class ScopedStateService<T extends object> implements OnDestroy {
  private readonly _state = signal<T>({} as T);
  private readonly _history: T[] = [];
  private readonly _maxHistory = 10;

  private readonly _stateChange$ = new Subject<T>();

  /**
   * Current state
   */
  readonly state = this._state.asReadonly();

  /**
   * State change observable
   */
  readonly stateChange$: Observable<T> = this._stateChange$.asObservable();

  /**
   * Initialize state
   */
  initialize(initialState: T): void {
    this._state.set(initialState);
    this._history.length = 0;
  }

  /**
   * Update state
   */
  update(updates: Partial<T>): void {
    const current = this._state();
    this._history.push(current);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    const newState = { ...current, ...updates };
    this._state.set(newState);
    this._stateChange$.next(newState);
  }

  /**
   * Set state completely
   */
  set(newState: T): void {
    const current = this._state();
    this._history.push(current);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    this._state.set(newState);
    this._stateChange$.next(newState);
  }

  /**
   * Undo last state change
   */
  undo(): boolean {
    const previous = this._history.pop();
    if (previous) {
      this._state.set(previous);
      this._stateChange$.next(previous);
      return true;
    }
    return false;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this._history.length > 0;
  }

  /**
   * Reset state to initial value
   */
  reset(initialState: T): void {
    this._history.length = 0;
    this._state.set(initialState);
    this._stateChange$.next(initialState);
  }

  /**
   * Get a slice of state
   */
  select<K extends keyof T>(key: K): T[K] {
    return this._state()[key];
  }

  ngOnDestroy(): void {
    this._stateChange$.complete();
  }
}

/**
 * Provide scoped state service for a component
 */
export function provideScopedStateService<T extends object>(): Provider {
  return {
    provide: SCOPED_STATE_SERVICE,
    useClass: ScopedStateService<T>
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  provideScopedAnimationService,
  provideScopedSelectionService,
  provideScopedStateService,
  SCOPED_ANIMATION_SERVICE,
  SCOPED_SELECTION_SERVICE,
  SCOPED_STATE_SERVICE,
  ScopedAnimationService,
  ScopedSelectionService,
  ScopedStateService
};



