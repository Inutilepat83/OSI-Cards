/**
 * Layout State Manager
 *
 * Manages layout state in a predictable, testable way.
 * Extracted from MasonryGridComponent to improve maintainability.
 *
 * Responsibilities:
 * - Track layout state (idle, measuring, calculating, ready)
 * - Store section positions
 * - Manage column heights
 * - Track layout history for undo/redo (future feature)
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MasonryGridComponent {
 *   private stateManager = new LayoutStateManager();
 *
 *   updateLayout(result: LayoutResult) {
 *     this.stateManager.updatePositions(result.positions);
 *     this.stateManager.updateColumnHeights(result.columnHeights);
 *     this.stateManager.setState('ready');
 *   }
 * }
 * ```
 */

import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { PositionedSection } from './layout-calculation.service';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Layout state
 */
export type LayoutState = 'idle' | 'measuring' | 'calculating' | 'ready' | 'error';

/**
 * Section position
 */
export interface Position {
  /** Left position */
  left: string;
  /** Top position */
  top: number;
  /** Width */
  width: string;
  /** Column span */
  colSpan: number;
}

/**
 * Complete state snapshot
 */
export interface StateSnapshot {
  state: LayoutState;
  positions: Map<string, Position>;
  columnHeights: number[];
  timestamp: number;
  columns: number;
  containerWidth: number;
}

/**
 * State change event
 */
export interface StateChangeEvent {
  from: LayoutState;
  to: LayoutState;
  timestamp: number;
}

// ============================================================================
// STATE MANAGER
// ============================================================================

export class LayoutStateManager {
  // Internal state
  private _state: LayoutState = 'idle';
  private _positions = new Map<string, Position>();
  private _columnHeights: number[] = [];
  private _columns = 0;
  private _containerWidth = 0;
  private _history: StateSnapshot[] = [];
  private _maxHistorySize = 10;

  // Observables
  private stateSubject = new BehaviorSubject<LayoutState>('idle');
  private positionsSubject = new BehaviorSubject<Map<string, Position>>(new Map());
  private columnHeightsSubject = new BehaviorSubject<number[]>([]);
  private stateChangeSubject = new BehaviorSubject<StateChangeEvent | null>(null);

  /** Observable of layout state */
  readonly state$ = this.stateSubject.asObservable();

  /** Observable of positions */
  readonly positions$ = this.positionsSubject.asObservable();

  /** Observable of column heights */
  readonly columnHeights$ = this.columnHeightsSubject.asObservable();

  /** Observable of state changes */
  readonly stateChanges$ = this.stateChangeSubject.asObservable().pipe(
    map((event) => event),
    distinctUntilChanged()
  );

  /** Observable of ready state */
  readonly isReady$ = this.state$.pipe(
    map((state) => state === 'ready'),
    distinctUntilChanged()
  );

  /** Observable of error state */
  readonly hasError$ = this.state$.pipe(
    map((state) => state === 'error'),
    distinctUntilChanged()
  );

  // ============================================================================
  // STATE QUERIES
  // ============================================================================

  /**
   * Get current state
   */
  get state(): LayoutState {
    return this._state;
  }

  /**
   * Check if layout is ready
   */
  isReady(): boolean {
    return this._state === 'ready';
  }

  /**
   * Check if layout is calculating
   */
  isCalculating(): boolean {
    return this._state === 'calculating';
  }

  /**
   * Check if layout is measuring
   */
  isMeasuring(): boolean {
    return this._state === 'measuring';
  }

  /**
   * Check if layout is idle
   */
  isIdle(): boolean {
    return this._state === 'idle';
  }

  /**
   * Check if layout has error
   */
  hasError(): boolean {
    return this._state === 'error';
  }

  /**
   * Get position for section
   *
   * @param key - Section key
   * @returns Position or null if not found
   */
  getPosition(key: string): Position | null {
    return this._positions.get(key) || null;
  }

  /**
   * Get all positions
   */
  getAllPositions(): Map<string, Position> {
    return new Map(this._positions);
  }

  /**
   * Get column heights
   */
  getColumnHeights(): number[] {
    return [...this._columnHeights];
  }

  /**
   * Get total grid height
   */
  getTotalHeight(): number {
    return this._columnHeights.length > 0 ? Math.max(...this._columnHeights) : 0;
  }

  /**
   * Get number of columns
   */
  getColumns(): number {
    return this._columns;
  }

  /**
   * Get container width
   */
  getContainerWidth(): number {
    return this._containerWidth;
  }

  /**
   * Get number of positioned sections
   */
  getSectionCount(): number {
    return this._positions.size;
  }

  // ============================================================================
  // STATE MUTATIONS
  // ============================================================================

  /**
   * Set layout state
   *
   * @param newState - New state
   */
  setState(newState: LayoutState): void {
    if (newState === this._state) return;

    const oldState = this._state;
    this._state = newState;
    this.stateSubject.next(newState);

    // Emit state change event
    this.stateChangeSubject.next({
      from: oldState,
      to: newState,
      timestamp: Date.now(),
    });

    // Save snapshot if transitioning to ready
    if (newState === 'ready') {
      this.saveSnapshot();
    }
  }

  /**
   * Update section positions
   *
   * @param positions - Array of positioned sections
   */
  updatePositions(positions: PositionedSection[]): void {
    this._positions.clear();

    positions.forEach((pos) => {
      this._positions.set(pos.key, {
        left: pos.left,
        top: pos.top,
        width: pos.width,
        colSpan: pos.colSpan,
      });
    });

    this.positionsSubject.next(new Map(this._positions));
  }

  /**
   * Update single section position
   *
   * @param key - Section key
   * @param position - New position
   */
  updatePosition(key: string, position: Position): void {
    this._positions.set(key, position);
    this.positionsSubject.next(new Map(this._positions));
  }

  /**
   * Remove section position
   *
   * @param key - Section key
   */
  removePosition(key: string): void {
    this._positions.delete(key);
    this.positionsSubject.next(new Map(this._positions));
  }

  /**
   * Update column heights
   *
   * @param heights - New column heights
   */
  updateColumnHeights(heights: number[]): void {
    this._columnHeights = [...heights];
    this.columnHeightsSubject.next(this._columnHeights);
  }

  /**
   * Update layout metadata
   *
   * @param columns - Number of columns
   * @param containerWidth - Container width
   */
  updateMetadata(columns: number, containerWidth: number): void {
    this._columns = columns;
    this._containerWidth = containerWidth;
  }

  /**
   * Reset all state to initial values
   */
  reset(): void {
    this._state = 'idle';
    this._positions.clear();
    this._columnHeights = [];
    this._columns = 0;
    this._containerWidth = 0;

    this.stateSubject.next('idle');
    this.positionsSubject.next(new Map());
    this.columnHeightsSubject.next([]);
  }

  /**
   * Clear positions only (keep state)
   */
  clearPositions(): void {
    this._positions.clear();
    this.positionsSubject.next(new Map());
  }

  // ============================================================================
  // HISTORY MANAGEMENT
  // ============================================================================

  /**
   * Save current state snapshot to history
   */
  private saveSnapshot(): void {
    const snapshot: StateSnapshot = {
      state: this._state,
      positions: new Map(this._positions),
      columnHeights: [...this._columnHeights],
      timestamp: Date.now(),
      columns: this._columns,
      containerWidth: this._containerWidth,
    };

    this._history.push(snapshot);

    // Limit history size
    if (this._history.length > this._maxHistorySize) {
      this._history.shift();
    }
  }

  /**
   * Get state history
   *
   * @returns Array of state snapshots
   */
  getHistory(): StateSnapshot[] {
    return [...this._history];
  }

  /**
   * Get previous snapshot
   *
   * @returns Previous snapshot or null
   */
  getPreviousSnapshot(): StateSnapshot | null {
    return this._history.length > 1 ? (this._history[this._history.length - 2] ?? null) : null;
  }

  /**
   * Restore from snapshot
   *
   * @param snapshot - Snapshot to restore
   */
  restoreSnapshot(snapshot: StateSnapshot): void {
    this._state = snapshot.state;
    this._positions = new Map(snapshot.positions);
    this._columnHeights = [...snapshot.columnHeights];
    this._columns = snapshot.columns;
    this._containerWidth = snapshot.containerWidth;

    // Emit updates
    this.stateSubject.next(this._state);
    this.positionsSubject.next(new Map(this._positions));
    this.columnHeightsSubject.next(this._columnHeights);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this._history = [];
  }

  /**
   * Set maximum history size
   *
   * @param size - Maximum number of snapshots to keep
   */
  setMaxHistorySize(size: number): void {
    this._maxHistorySize = Math.max(1, size);

    // Trim history if needed
    while (this._history.length > this._maxHistorySize) {
      this._history.shift();
    }
  }

  // ============================================================================
  // DEBUGGING
  // ============================================================================

  /**
   * Get debug information
   */
  getDebugInfo(): {
    state: LayoutState;
    sectionCount: number;
    columns: number;
    totalHeight: number;
    containerWidth: number;
    historySize: number;
  } {
    return {
      state: this._state,
      sectionCount: this._positions.size,
      columns: this._columns,
      totalHeight: this.getTotalHeight(),
      containerWidth: this._containerWidth,
      historySize: this._history.length,
    };
  }

  /**
   * Log current state to console
   */
  logState(): void {
    console.group('[LayoutStateManager] Current State');
    console.log('State:', this._state);
    console.log('Positions:', this._positions);
    console.log('Column Heights:', this._columnHeights);
    console.log('Columns:', this._columns);
    console.log('Container Width:', this._containerWidth);
    console.log('Total Height:', this.getTotalHeight());
    console.log('History Size:', this._history.length);
    console.groupEnd();
  }
}
