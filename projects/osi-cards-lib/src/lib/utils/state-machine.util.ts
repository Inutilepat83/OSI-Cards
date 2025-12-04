/**
 * State Machine Utility
 *
 * Type-safe finite state machine implementation for managing
 * complex component state transitions and workflows.
 *
 * Features:
 * - Type-safe states and events
 * - Transition guards
 * - Entry/exit actions
 * - State history
 * - Observable state changes
 *
 * @example
 * ```typescript
 * import { StateMachine } from '@osi-cards/utils';
 *
 * type LoadingState = 'idle' | 'loading' | 'success' | 'error';
 * type LoadingEvent = 'LOAD' | 'SUCCESS' | 'ERROR' | 'RETRY';
 *
 * const machine = new StateMachine<LoadingState, LoadingEvent>({
 *   initial: 'idle',
 *   states: {
 *     idle: {
 *       on: { LOAD: 'loading' }
 *     },
 *     loading: {
 *       on: { SUCCESS: 'success', ERROR: 'error' }
 *     },
 *     success: {
 *       on: { LOAD: 'loading' }
 *     },
 *     error: {
 *       on: { RETRY: 'loading' }
 *     }
 *   }
 * });
 *
 * machine.send('LOAD'); // idle -> loading
 * ```
 */

import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

/**
 * State configuration
 */
export interface StateConfig<TState extends string, TEvent extends string> {
  /**
   * Transitions from this state
   * Maps event to target state
   */
  on?: Partial<Record<TEvent, TState>>;

  /**
   * Guard function to prevent transition
   * Return false to prevent transition
   */
  guard?: (event: TEvent, context?: any) => boolean;

  /**
   * Action to run when entering this state
   */
  onEntry?: (previousState?: TState, event?: TEvent, context?: any) => void;

  /**
   * Action to run when exiting this state
   */
  onExit?: (nextState: TState, event: TEvent, context?: any) => void;

  /**
   * Meta data for this state
   */
  meta?: Record<string, any>;
}

/**
 * State machine configuration
 */
export interface StateMachineConfig<TState extends string, TEvent extends string> {
  /**
   * Initial state
   */
  initial: TState;

  /**
   * State definitions
   */
  states: Record<TState, StateConfig<TState, TEvent>>;

  /**
   * Context data available to all guards and actions
   */
  context?: any;

  /**
   * Maximum history size
   * Default: 50
   */
  maxHistory?: number;

  /**
   * Enable strict mode (throw on invalid transitions)
   * Default: false
   */
  strict?: boolean;
}

/**
 * State transition event
 */
export interface StateTransition<TState extends string, TEvent extends string> {
  from: TState;
  to: TState;
  event: TEvent;
  timestamp: number;
  success: boolean;
}

/**
 * State Machine
 *
 * Type-safe finite state machine for managing state transitions.
 */
export class StateMachine<TState extends string, TEvent extends string> {
  private currentState: TState;
  private stateSubject: BehaviorSubject<TState>;
  private history: StateTransition<TState, TEvent>[] = [];
  private context: any;

  /**
   * Observable of current state
   */
  readonly state$: Observable<TState>;

  /**
   * Observable of state transitions
   */
  private transitionSubject = new BehaviorSubject<StateTransition<TState, TEvent> | null>(null);
  readonly transitions$: Observable<StateTransition<TState, TEvent> | null> =
    this.transitionSubject.asObservable();

  constructor(private config: StateMachineConfig<TState, TEvent>) {
    this.currentState = config.initial;
    this.stateSubject = new BehaviorSubject<TState>(config.initial);
    this.state$ = this.stateSubject.asObservable().pipe(distinctUntilChanged());
    this.context = config.context || {};
  }

  /**
   * Get current state
   *
   * @returns Current state
   */
  getState(): TState {
    return this.currentState;
  }

  /**
   * Send an event to trigger state transition
   *
   * @param event - Event to send
   * @param context - Optional context for this transition
   * @returns True if transition occurred
   *
   * @example
   * ```typescript
   * const success = machine.send('LOAD');
   * if (success) {
   *   console.log('Transition successful');
   * }
   * ```
   */
  send(event: TEvent, context?: any): boolean {
    const currentStateConfig = this.config.states[this.currentState];

    if (!currentStateConfig.on) {
      if (this.config.strict) {
        throw new Error(`No transitions defined for state: ${this.currentState}`);
      }
      return false;
    }

    const nextState = currentStateConfig.on[event];

    if (!nextState) {
      if (this.config.strict) {
        throw new Error(`Invalid transition: ${this.currentState} + ${event}`);
      }
      return false;
    }

    // Check guard
    if (currentStateConfig.guard) {
      const canTransition = currentStateConfig.guard(event, context || this.context);

      if (!canTransition) {
        this.recordTransition(this.currentState, this.currentState, event, false);
        return false;
      }
    }

    // Exit current state
    if (currentStateConfig.onExit) {
      currentStateConfig.onExit(nextState, event, context || this.context);
    }

    const previousState = this.currentState;
    this.currentState = nextState;

    // Enter new state
    const nextStateConfig = this.config.states[nextState];
    if (nextStateConfig.onEntry) {
      nextStateConfig.onEntry(previousState, event, context || this.context);
    }

    // Emit state change
    this.stateSubject.next(nextState);

    // Record transition
    this.recordTransition(previousState, nextState, event, true);

    return true;
  }

  /**
   * Check if transition is allowed
   *
   * @param event - Event to check
   * @returns True if transition is allowed
   */
  can(event: TEvent): boolean {
    const currentStateConfig = this.config.states[this.currentState];

    if (!currentStateConfig.on || !currentStateConfig.on[event]) {
      return false;
    }

    if (currentStateConfig.guard) {
      return currentStateConfig.guard(event, this.context);
    }

    return true;
  }

  /**
   * Check if currently in specific state
   *
   * @param state - State to check
   * @returns True if in that state
   */
  is(state: TState): boolean {
    return this.currentState === state;
  }

  /**
   * Check if currently in any of the specified states
   *
   * @param states - States to check
   * @returns True if in any of those states
   */
  isAny(...states: TState[]): boolean {
    return states.includes(this.currentState);
  }

  /**
   * Get state history
   *
   * @returns Array of past transitions
   */
  getHistory(): StateTransition<TState, TEvent>[] {
    return [...this.history];
  }

  /**
   * Reset to initial state
   *
   * @param clearHistory - Whether to clear history
   */
  reset(clearHistory = false): void {
    const previousState = this.currentState;
    this.currentState = this.config.initial;
    this.stateSubject.next(this.config.initial);

    if (clearHistory) {
      this.history = [];
    }
  }

  /**
   * Update context
   *
   * @param context - New context or update function
   */
  updateContext(context: any | ((prev: any) => any)): void {
    if (typeof context === 'function') {
      this.context = context(this.context);
    } else {
      this.context = { ...this.context, ...context };
    }
  }

  /**
   * Get current context
   *
   * @returns Current context
   */
  getContext(): any {
    return this.context;
  }

  /**
   * Get available events from current state
   *
   * @returns Array of available events
   */
  getAvailableEvents(): TEvent[] {
    const currentStateConfig = this.config.states[this.currentState];
    return currentStateConfig.on ? (Object.keys(currentStateConfig.on) as TEvent[]) : [];
  }

  /**
   * Get state metadata
   *
   * @param state - State to get meta for (defaults to current)
   * @returns State metadata
   */
  getMeta(state?: TState): Record<string, any> | undefined {
    const targetState = state || this.currentState;
    return this.config.states[targetState]?.meta;
  }

  /**
   * Record a transition in history
   */
  private recordTransition(from: TState, to: TState, event: TEvent, success: boolean): void {
    const transition: StateTransition<TState, TEvent> = {
      from,
      to,
      event,
      timestamp: Date.now(),
      success,
    };

    this.history.push(transition);
    this.transitionSubject.next(transition);

    // Limit history size
    const maxHistory = this.config.maxHistory || 50;
    if (this.history.length > maxHistory) {
      this.history.shift();
    }
  }
}

/**
 * Create a state machine
 *
 * @param config - State machine configuration
 * @returns New StateMachine instance
 *
 * @example
 * ```typescript
 * const loadingMachine = createStateMachine({
 *   initial: 'idle',
 *   states: {
 *     idle: { on: { LOAD: 'loading' } },
 *     loading: { on: { SUCCESS: 'success', ERROR: 'error' } },
 *     success: { on: { RELOAD: 'loading' } },
 *     error: { on: { RETRY: 'loading' } }
 *   }
 * });
 * ```
 */
export function createStateMachine<TState extends string, TEvent extends string>(
  config: StateMachineConfig<TState, TEvent>
): StateMachine<TState, TEvent> {
  return new StateMachine(config);
}

/**
 * State machine builder for fluent API
 *
 * @example
 * ```typescript
 * const machine = new StateMachineBuilder<'idle' | 'loading', 'LOAD'>()
 *   .initialState('idle')
 *   .addState('idle', { on: { LOAD: 'loading' } })
 *   .addState('loading', { on: { SUCCESS: 'idle' } })
 *   .build();
 * ```
 */
export class StateMachineBuilder<TState extends string, TEvent extends string> {
  private initial?: TState;
  private states: Partial<Record<TState, StateConfig<TState, TEvent>>> = {};
  private context: any = {};
  private maxHistory = 50;
  private strict = false;

  /**
   * Set initial state
   */
  initialState(state: TState): this {
    this.initial = state;
    return this;
  }

  /**
   * Add a state configuration
   */
  addState(state: TState, config: StateConfig<TState, TEvent>): this {
    this.states[state] = config;
    return this;
  }

  /**
   * Set context
   */
  withContext(context: any): this {
    this.context = context;
    return this;
  }

  /**
   * Set max history size
   */
  withMaxHistory(size: number): this {
    this.maxHistory = size;
    return this;
  }

  /**
   * Enable strict mode
   */
  withStrictMode(enabled = true): this {
    this.strict = enabled;
    return this;
  }

  /**
   * Build the state machine
   */
  build(): StateMachine<TState, TEvent> {
    if (!this.initial) {
      throw new Error('Initial state must be set');
    }

    return new StateMachine({
      initial: this.initial,
      states: this.states as Record<TState, StateConfig<TState, TEvent>>,
      context: this.context,
      maxHistory: this.maxHistory,
      strict: this.strict,
    });
  }
}
