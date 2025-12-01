/**
 * Component Composition Utilities
 *
 * Provides reusable composition patterns for Angular components.
 * These utilities help extract shared logic without inheritance.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private destroyRef = inject(DestroyRef);
 *
 *   // Use composition for common patterns
 *   visibility = useVisibility();
 *   loading = useLoadingState();
 *   keyboard = useKeyboardNavigation();
 * }
 * ```
 *
 * @module utils/component-composition
 */

import { computed, signal, Signal } from '@angular/core';

// ============================================================================
// VISIBILITY COMPOSITION
// ============================================================================

/**
 * Visibility state interface
 */
export interface VisibilityState {
  isVisible: Signal<boolean>;
  show: () => void;
  hide: () => void;
  toggle: () => void;
}

/**
 * Create visibility state for a component
 *
 * @param initialValue - Initial visibility state (default: true)
 * @returns Visibility state object with signals and methods
 *
 * @example
 * ```typescript
 * const visibility = useVisibility(false);
 * visibility.show();
 * console.log(visibility.isVisible()); // true
 * ```
 */
export function useVisibility(initialValue = true): VisibilityState {
  const _isVisible = signal(initialValue);

  return {
    isVisible: _isVisible.asReadonly(),
    show: () => _isVisible.set(true),
    hide: () => _isVisible.set(false),
    toggle: () => _isVisible.update((v) => !v),
  };
}

// ============================================================================
// LOADING STATE COMPOSITION
// ============================================================================

/**
 * Loading state interface
 */
export interface LoadingState {
  isLoading: Signal<boolean>;
  error: Signal<Error | null>;
  hasError: Signal<boolean>;
  startLoading: () => void;
  stopLoading: () => void;
  setError: (error: Error | null) => void;
  reset: () => void;
}

/**
 * Create loading state for async operations
 *
 * @returns Loading state object with signals and methods
 *
 * @example
 * ```typescript
 * const loading = useLoadingState();
 * loading.startLoading();
 * try {
 *   await fetchData();
 *   loading.stopLoading();
 * } catch (e) {
 *   loading.setError(e);
 * }
 * ```
 */
export function useLoadingState(): LoadingState {
  const _isLoading = signal(false);
  const _error = signal<Error | null>(null);
  const _hasError = computed(() => _error() !== null);

  return {
    isLoading: _isLoading.asReadonly(),
    error: _error.asReadonly(),
    hasError: _hasError,
    startLoading: () => {
      _isLoading.set(true);
      _error.set(null);
    },
    stopLoading: () => _isLoading.set(false),
    setError: (error: Error | null) => {
      _error.set(error);
      _isLoading.set(false);
    },
    reset: () => {
      _isLoading.set(false);
      _error.set(null);
    },
  };
}

// ============================================================================
// KEYBOARD NAVIGATION COMPOSITION
// ============================================================================

/**
 * Keyboard navigation options
 */
export interface KeyboardNavigationOptions {
  /** Items to navigate through */
  items: Signal<readonly unknown[]>;
  /** Custom key handlers */
  keyHandlers?: Record<string, () => void>;
  /** Enable wrap-around navigation */
  wrap?: boolean;
  /** Orientation (vertical = arrow up/down, horizontal = arrow left/right) */
  orientation?: 'vertical' | 'horizontal' | 'both';
}

/**
 * Keyboard navigation state interface
 */
export interface KeyboardNavigationState {
  focusedIndex: Signal<number>;
  focusedItem: Signal<unknown | null>;
  focusNext: () => void;
  focusPrevious: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  focusIndex: (index: number) => void;
  handleKeyDown: (event: KeyboardEvent) => void;
}

/**
 * Create keyboard navigation state
 *
 * @param options - Navigation options
 * @returns Keyboard navigation state object
 *
 * @example
 * ```typescript
 * const items = signal(['a', 'b', 'c']);
 * const nav = useKeyboardNavigation({ items, wrap: true });
 * nav.focusNext();
 * ```
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions): KeyboardNavigationState {
  const { items, keyHandlers = {}, wrap = true, orientation = 'vertical' } = options;
  const _focusedIndex = signal(0);

  const focusedItem = computed(() => {
    const index = _focusedIndex();
    const list = items();
    return index >= 0 && index < list.length ? list[index] : null;
  });

  const nextKeys =
    orientation === 'horizontal'
      ? ['ArrowRight']
      : orientation === 'vertical'
        ? ['ArrowDown']
        : ['ArrowDown', 'ArrowRight'];

  const prevKeys =
    orientation === 'horizontal'
      ? ['ArrowLeft']
      : orientation === 'vertical'
        ? ['ArrowUp']
        : ['ArrowUp', 'ArrowLeft'];

  const focusNext = () => {
    const length = items().length;
    if (length === 0) return;

    _focusedIndex.update((index) => {
      const next = index + 1;
      if (next >= length) {
        return wrap ? 0 : length - 1;
      }
      return next;
    });
  };

  const focusPrevious = () => {
    const length = items().length;
    if (length === 0) return;

    _focusedIndex.update((index) => {
      const prev = index - 1;
      if (prev < 0) {
        return wrap ? length - 1 : 0;
      }
      return prev;
    });
  };

  const focusFirst = () => _focusedIndex.set(0);
  const focusLast = () => _focusedIndex.set(Math.max(0, items().length - 1));

  const focusIndex = (index: number) => {
    const length = items().length;
    if (index >= 0 && index < length) {
      _focusedIndex.set(index);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    // Check custom handlers first
    if (keyHandlers[event.key]) {
      event.preventDefault();
      keyHandlers[event.key]?.();
      return;
    }

    // Built-in handlers
    if (nextKeys.includes(event.key)) {
      event.preventDefault();
      focusNext();
    } else if (prevKeys.includes(event.key)) {
      event.preventDefault();
      focusPrevious();
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusFirst();
    } else if (event.key === 'End') {
      event.preventDefault();
      focusLast();
    }
  };

  return {
    focusedIndex: _focusedIndex.asReadonly(),
    focusedItem,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    focusIndex,
    handleKeyDown,
  };
}

// ============================================================================
// SELECTION STATE COMPOSITION
// ============================================================================

/**
 * Selection state interface
 */
export interface SelectionState<T> {
  selectedItems: Signal<Set<T>>;
  isSelected: (item: T) => boolean;
  select: (item: T) => void;
  deselect: (item: T) => void;
  toggle: (item: T) => void;
  selectAll: (items: T[]) => void;
  deselectAll: () => void;
  selectedCount: Signal<number>;
}

/**
 * Create selection state for multiple items
 *
 * @param multiSelect - Allow multiple selections (default: true)
 * @returns Selection state object
 *
 * @example
 * ```typescript
 * const selection = useSelectionState<string>();
 * selection.select('item1');
 * selection.toggle('item2');
 * console.log(selection.selectedItems()); // Set(['item1', 'item2'])
 * ```
 */
export function useSelectionState<T>(multiSelect = true): SelectionState<T> {
  const _selectedItems = signal(new Set<T>());
  const selectedCount = computed(() => _selectedItems().size);

  const isSelected = (item: T) => _selectedItems().has(item);

  const select = (item: T) => {
    _selectedItems.update((set) => {
      const newSet = multiSelect ? new Set(set) : new Set<T>();
      newSet.add(item);
      return newSet;
    });
  };

  const deselect = (item: T) => {
    _selectedItems.update((set) => {
      const newSet = new Set(set);
      newSet.delete(item);
      return newSet;
    });
  };

  const toggle = (item: T) => {
    if (isSelected(item)) {
      deselect(item);
    } else {
      select(item);
    }
  };

  const selectAll = (items: T[]) => {
    _selectedItems.set(new Set(items));
  };

  const deselectAll = () => {
    _selectedItems.set(new Set());
  };

  return {
    selectedItems: _selectedItems.asReadonly(),
    isSelected,
    select,
    deselect,
    toggle,
    selectAll,
    deselectAll,
    selectedCount,
  };
}

// ============================================================================
// HOVER STATE COMPOSITION
// ============================================================================

/**
 * Hover state interface
 */
export interface HoverState {
  isHovered: Signal<boolean>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * Create hover state for an element
 *
 * @returns Hover state object
 */
export function useHoverState(): HoverState {
  const _isHovered = signal(false);

  return {
    isHovered: _isHovered.asReadonly(),
    onMouseEnter: () => _isHovered.set(true),
    onMouseLeave: () => _isHovered.set(false),
  };
}

// ============================================================================
// FOCUS STATE COMPOSITION
// ============================================================================

/**
 * Focus state interface
 */
export interface FocusState {
  isFocused: Signal<boolean>;
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * Create focus state for an element
 *
 * @returns Focus state object
 */
export function useFocusState(): FocusState {
  const _isFocused = signal(false);

  return {
    isFocused: _isFocused.asReadonly(),
    onFocus: () => _isFocused.set(true),
    onBlur: () => _isFocused.set(false),
  };
}

// ============================================================================
// TOGGLE STATE COMPOSITION
// ============================================================================

/**
 * Toggle state interface
 */
export interface ToggleState {
  isOn: Signal<boolean>;
  toggle: () => void;
  setOn: () => void;
  setOff: () => void;
}

/**
 * Create a simple toggle state
 *
 * @param initialValue - Initial toggle state
 * @returns Toggle state object
 */
export function useToggleState(initialValue = false): ToggleState {
  const _isOn = signal(initialValue);

  return {
    isOn: _isOn.asReadonly(),
    toggle: () => _isOn.update((v) => !v),
    setOn: () => _isOn.set(true),
    setOff: () => _isOn.set(false),
  };
}

// ============================================================================
// EXPANDABLE STATE COMPOSITION
// ============================================================================

/**
 * Expandable state interface
 */
export interface ExpandableState {
  isExpanded: Signal<boolean>;
  expand: () => void;
  collapse: () => void;
  toggle: () => void;
  expandedHeight: Signal<number | null>;
  setExpandedHeight: (height: number) => void;
}

/**
 * Create expandable/collapsible state
 *
 * @param initialExpanded - Initial expanded state
 * @returns Expandable state object
 */
export function useExpandableState(initialExpanded = false): ExpandableState {
  const _isExpanded = signal(initialExpanded);
  const _expandedHeight = signal<number | null>(null);

  return {
    isExpanded: _isExpanded.asReadonly(),
    expand: () => _isExpanded.set(true),
    collapse: () => _isExpanded.set(false),
    toggle: () => _isExpanded.update((v) => !v),
    expandedHeight: _expandedHeight.asReadonly(),
    setExpandedHeight: (height: number) => _expandedHeight.set(height),
  };
}

// ============================================================================
// DEBOUNCED VALUE COMPOSITION
// ============================================================================

/**
 * Debounced value state interface
 */
export interface DebouncedValueState<T> {
  value: Signal<T>;
  debouncedValue: Signal<T>;
  setValue: (value: T) => void;
}

/**
 * Create a debounced value state
 *
 * @param initialValue - Initial value
 * @param delayMs - Debounce delay in milliseconds
 * @returns Debounced value state object
 */
export function useDebouncedValue<T>(initialValue: T, delayMs = 300): DebouncedValueState<T> {
  const _value = signal(initialValue);
  const _debouncedValue = signal(initialValue);

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const setValue = (value: T) => {
    _value.set(value);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      _debouncedValue.set(value);
      timeoutId = null;
    }, delayMs);
  };

  return {
    value: _value.asReadonly(),
    debouncedValue: _debouncedValue.asReadonly(),
    setValue,
  };
}

// ============================================================================
// COUNTER COMPOSITION
// ============================================================================

/**
 * Counter state interface
 */
export interface CounterState {
  count: Signal<number>;
  increment: (amount?: number) => void;
  decrement: (amount?: number) => void;
  reset: () => void;
  setCount: (value: number) => void;
}

/**
 * Create a counter state
 *
 * @param initialValue - Initial count value
 * @returns Counter state object
 */
export function useCounter(initialValue = 0): CounterState {
  const _count = signal(initialValue);

  return {
    count: _count.asReadonly(),
    increment: (amount = 1) => _count.update((c) => c + amount),
    decrement: (amount = 1) => _count.update((c) => c - amount),
    reset: () => _count.set(initialValue),
    setCount: (value: number) => _count.set(value),
  };
}

// ============================================================================
// PAGINATION COMPOSITION
// ============================================================================

/**
 * Pagination options
 */
export interface PaginationOptions {
  totalItems: Signal<number>;
  pageSize?: number;
}

/**
 * Pagination state interface
 */
export interface PaginationState {
  currentPage: Signal<number>;
  pageSize: Signal<number>;
  totalPages: Signal<number>;
  hasNextPage: Signal<boolean>;
  hasPrevPage: Signal<boolean>;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setPageSize: (size: number) => void;
}

/**
 * Create pagination state
 *
 * @param options - Pagination options
 * @returns Pagination state object
 */
export function usePagination(options: PaginationOptions): PaginationState {
  const { totalItems, pageSize: initialPageSize = 10 } = options;

  const _currentPage = signal(1);
  const _pageSize = signal(initialPageSize);

  const totalPages = computed(() => Math.max(1, Math.ceil(totalItems() / _pageSize())));

  const hasNextPage = computed(() => _currentPage() < totalPages());
  const hasPrevPage = computed(() => _currentPage() > 1);

  const goToPage = (page: number) => {
    const total = totalPages();
    const validPage = Math.max(1, Math.min(page, total));
    _currentPage.set(validPage);
  };

  const nextPage = () => {
    if (hasNextPage()) {
      _currentPage.update((p) => p + 1);
    }
  };

  const prevPage = () => {
    if (hasPrevPage()) {
      _currentPage.update((p) => p - 1);
    }
  };

  const firstPage = () => _currentPage.set(1);
  const lastPage = () => _currentPage.set(totalPages());

  const setPageSize = (size: number) => {
    _pageSize.set(size);
    // Adjust current page if it would be out of bounds
    const newTotal = Math.ceil(totalItems() / size);
    if (_currentPage() > newTotal) {
      _currentPage.set(Math.max(1, newTotal));
    }
  };

  return {
    currentPage: _currentPage.asReadonly(),
    pageSize: _pageSize.asReadonly(),
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
  };
}

// ============================================================================
// ASYNC STATE COMPOSITION
// ============================================================================

/**
 * Async state interface
 */
export interface AsyncState<T> {
  data: Signal<T | null>;
  isLoading: Signal<boolean>;
  error: Signal<Error | null>;
  isSuccess: Signal<boolean>;
  isError: Signal<boolean>;
  execute: (promise: Promise<T>) => Promise<T>;
  reset: () => void;
}

/**
 * Create async state for managing promise-based operations
 *
 * @returns Async state object
 */
export function useAsyncState<T>(): AsyncState<T> {
  const _data = signal<T | null>(null);
  const _isLoading = signal(false);
  const _error = signal<Error | null>(null);

  const isSuccess = computed(() => _data() !== null && _error() === null);
  const isError = computed(() => _error() !== null);

  const execute = async (promise: Promise<T>): Promise<T> => {
    _isLoading.set(true);
    _error.set(null);

    try {
      const result = await promise;
      _data.set(result);
      return result;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      _error.set(error);
      throw error;
    } finally {
      _isLoading.set(false);
    }
  };

  const reset = () => {
    _data.set(null);
    _isLoading.set(false);
    _error.set(null);
  };

  return {
    data: _data.asReadonly(),
    isLoading: _isLoading.asReadonly(),
    error: _error.asReadonly(),
    isSuccess,
    isError,
    execute,
    reset,
  };
}
