/**
 * Streaming State Machine
 *
 * Formal state machine implementation for streaming sessions.
 * Manages state transitions, guards, and actions.
 *
 * @since 2.0.0
 */

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

/**
 * All possible streaming states
 */
export type StreamingState =
  | 'idle'
  | 'connecting'
  | 'thinking'
  | 'streaming'
  | 'paused'
  | 'buffering'
  | 'complete'
  | 'error'
  | 'aborted'
  | 'reconnecting';

/**
 * All possible streaming events
 */
export type StreamingEvent =
  | 'CONNECT'
  | 'CONNECTED'
  | 'CONNECTION_FAILED'
  | 'START_THINKING'
  | 'START_STREAMING'
  | 'CHUNK_RECEIVED'
  | 'PAUSE'
  | 'RESUME'
  | 'BUFFER_OVERFLOW'
  | 'BUFFER_CLEARED'
  | 'COMPLETE'
  | 'ERROR'
  | 'ABORT'
  | 'RECONNECT'
  | 'RECONNECT_SUCCESS'
  | 'RECONNECT_FAILED'
  | 'RESET';

/**
 * State transition definition
 */
export interface StateTransition {
  from: StreamingState | StreamingState[];
  to: StreamingState;
  event: StreamingEvent;
  guard?: (context: StreamingContext) => boolean;
  action?: (context: StreamingContext, event: StreamingEventData) => void;
}

/**
 * Streaming context data
 */
export interface StreamingContext {
  /** Current state */
  state: StreamingState;
  /** Previous state */
  previousState: StreamingState | null;
  /** Number of chunks received */
  chunksReceived: number;
  /** Bytes received */
  bytesReceived: number;
  /** Estimated total bytes */
  totalBytes: number | null;
  /** Sections completed */
  sectionsCompleted: number;
  /** Total sections expected */
  totalSections: number | null;
  /** Start time */
  startTime: number | null;
  /** Time of first chunk */
  firstChunkTime: number | null;
  /** Last update time */
  lastUpdateTime: number | null;
  /** Reconnection attempts */
  reconnectAttempts: number;
  /** Max reconnection attempts */
  maxReconnectAttempts: number;
  /** Error count */
  errorCount: number;
  /** Is paused by user */
  isPausedByUser: boolean;
  /** Buffer state */
  bufferState: 'empty' | 'filling' | 'full' | 'overflow';
  /** Partial card data */
  partialData: unknown | null;
  /** Last error */
  lastError: Error | null;
  /** Custom metadata */
  metadata: Record<string, unknown>;
}

/**
 * Event data with optional payload
 */
export interface StreamingEventData {
  event: StreamingEvent;
  payload?: unknown;
  timestamp: number;
}

/**
 * State change notification
 */
export interface StateChange {
  previousState: StreamingState;
  currentState: StreamingState;
  event: StreamingEvent;
  context: StreamingContext;
  timestamp: number;
}

/**
 * Default state transitions
 */
const DEFAULT_TRANSITIONS: StateTransition[] = [
  // From idle
  { from: 'idle', to: 'connecting', event: 'CONNECT' },

  // From connecting
  { from: 'connecting', to: 'thinking', event: 'CONNECTED' },
  { from: 'connecting', to: 'error', event: 'CONNECTION_FAILED' },
  { from: 'connecting', to: 'idle', event: 'ABORT' },
  { from: 'connecting', to: 'reconnecting', event: 'RECONNECT' },

  // From thinking
  { from: 'thinking', to: 'streaming', event: 'START_STREAMING' },
  { from: 'thinking', to: 'streaming', event: 'CHUNK_RECEIVED' },
  { from: 'thinking', to: 'error', event: 'ERROR' },
  { from: 'thinking', to: 'aborted', event: 'ABORT' },

  // From streaming
  { from: 'streaming', to: 'streaming', event: 'CHUNK_RECEIVED' },
  { from: 'streaming', to: 'paused', event: 'PAUSE' },
  { from: 'streaming', to: 'buffering', event: 'BUFFER_OVERFLOW' },
  { from: 'streaming', to: 'complete', event: 'COMPLETE' },
  { from: 'streaming', to: 'error', event: 'ERROR' },
  { from: 'streaming', to: 'aborted', event: 'ABORT' },
  { from: 'streaming', to: 'reconnecting', event: 'RECONNECT' },

  // From paused
  { from: 'paused', to: 'streaming', event: 'RESUME' },
  { from: 'paused', to: 'complete', event: 'COMPLETE' },
  { from: 'paused', to: 'aborted', event: 'ABORT' },

  // From buffering
  { from: 'buffering', to: 'streaming', event: 'BUFFER_CLEARED' },
  { from: 'buffering', to: 'error', event: 'ERROR' },
  { from: 'buffering', to: 'aborted', event: 'ABORT' },

  // From error
  {
    from: 'error',
    to: 'reconnecting',
    event: 'RECONNECT',
    guard: (ctx) => ctx.reconnectAttempts < ctx.maxReconnectAttempts,
  },
  { from: 'error', to: 'idle', event: 'RESET' },

  // From aborted
  { from: 'aborted', to: 'idle', event: 'RESET' },

  // From reconnecting
  { from: 'reconnecting', to: 'thinking', event: 'RECONNECT_SUCCESS' },
  { from: 'reconnecting', to: 'error', event: 'RECONNECT_FAILED' },
  { from: 'reconnecting', to: 'aborted', event: 'ABORT' },

  // From complete
  { from: 'complete', to: 'idle', event: 'RESET' },

  // Universal reset (from any state except idle)
  {
    from: [
      'connecting',
      'thinking',
      'streaming',
      'paused',
      'buffering',
      'complete',
      'error',
      'aborted',
      'reconnecting',
    ],
    to: 'idle',
    event: 'RESET',
  },
];

/**
 * Create initial context
 */
function createInitialContext(): StreamingContext {
  return {
    state: 'idle',
    previousState: null,
    chunksReceived: 0,
    bytesReceived: 0,
    totalBytes: null,
    sectionsCompleted: 0,
    totalSections: null,
    startTime: null,
    firstChunkTime: null,
    lastUpdateTime: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    errorCount: 0,
    isPausedByUser: false,
    bufferState: 'empty',
    partialData: null,
    lastError: null,
    metadata: {},
  };
}

/**
 * Streaming State Machine
 *
 * Manages streaming state transitions with guards and actions.
 * Provides observables for state changes and progress tracking.
 *
 * @example
 * ```typescript
 * const stateMachine = new StreamingStateMachine();
 *
 * stateMachine.stateChanges$.subscribe(change => {
 *   console.log(`${change.previousState} -> ${change.currentState}`);
 * });
 *
 * stateMachine.send('CONNECT');
 * stateMachine.send('CONNECTED');
 * stateMachine.send('START_STREAMING');
 * ```
 */
export class StreamingStateMachine {
  private readonly contextSubject: BehaviorSubject<StreamingContext>;
  private readonly stateChangeSubject = new Subject<StateChange>();
  private readonly transitions: StateTransition[];

  /** Observable of full context */
  readonly context$: Observable<StreamingContext>;

  /** Observable of current state only */
  readonly state$: Observable<StreamingState>;

  /** Observable of state changes */
  readonly stateChanges$: Observable<StateChange>;

  /** Observable of progress (0-1) */
  readonly progress$: Observable<number>;

  constructor(customTransitions?: StateTransition[], initialContext?: Partial<StreamingContext>) {
    this.transitions = customTransitions || DEFAULT_TRANSITIONS;

    const context = {
      ...createInitialContext(),
      ...initialContext,
    };

    this.contextSubject = new BehaviorSubject<StreamingContext>(context);
    this.context$ = this.contextSubject.asObservable();

    this.state$ = this.context$.pipe(
      map((ctx) => ctx.state),
      distinctUntilChanged()
    );

    this.stateChanges$ = this.stateChangeSubject.asObservable();

    this.progress$ = this.context$.pipe(
      map((ctx) => this.calculateProgress(ctx)),
      distinctUntilChanged()
    );
  }

  /**
   * Get current context
   */
  getContext(): StreamingContext {
    return this.contextSubject.value;
  }

  /**
   * Get current state
   */
  getState(): StreamingState {
    return this.contextSubject.value.state;
  }

  /**
   * Send an event to the state machine
   * @returns true if transition occurred, false otherwise
   */
  send(event: StreamingEvent, payload?: unknown): boolean {
    const currentContext = this.contextSubject.value;
    const eventData: StreamingEventData = {
      event,
      payload,
      timestamp: Date.now(),
    };

    // Find matching transition
    const transition = this.findTransition(currentContext.state, event, currentContext);

    if (!transition) {
      // No valid transition - log in dev mode
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        console.warn(
          `[StreamingStateMachine] No transition for event '${event}' in state '${currentContext.state}'`
        );
      }
      return false;
    }

    // Execute transition
    const previousState = currentContext.state;

    // Update context
    const newContext: StreamingContext = {
      ...currentContext,
      state: transition.to,
      previousState,
      lastUpdateTime: Date.now(),
    };

    // Apply event-specific context updates
    this.applyEventUpdates(newContext, eventData);

    // Execute action if defined
    if (transition.action) {
      transition.action(newContext, eventData);
    }

    // Emit new context
    this.contextSubject.next(newContext);

    // Emit state change
    this.stateChangeSubject.next({
      previousState,
      currentState: transition.to,
      event,
      context: newContext,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Update context without changing state
   */
  updateContext(updates: Partial<StreamingContext>): void {
    const currentContext = this.contextSubject.value;
    this.contextSubject.next({
      ...currentContext,
      ...updates,
      lastUpdateTime: Date.now(),
    });
  }

  /**
   * Check if an event can be sent in current state
   */
  canSend(event: StreamingEvent): boolean {
    const context = this.contextSubject.value;
    return this.findTransition(context.state, event, context) !== null;
  }

  /**
   * Get available events for current state
   */
  getAvailableEvents(): StreamingEvent[] {
    const context = this.contextSubject.value;
    return this.transitions
      .filter((t) => this.matchesFrom(t.from, context.state))
      .filter((t) => !t.guard || t.guard(context))
      .map((t) => t.event);
  }

  /**
   * Reset state machine to initial state
   */
  reset(): void {
    this.send('RESET');
    if (this.getState() !== 'idle') {
      // Force reset if transition failed
      this.contextSubject.next(createInitialContext());
    }
  }

  /**
   * Check if currently in a terminal state
   */
  isTerminal(): boolean {
    const state = this.getState();
    return state === 'complete' || state === 'error' || state === 'aborted';
  }

  /**
   * Check if currently in an active streaming state
   */
  isActive(): boolean {
    const state = this.getState();
    return (
      state === 'connecting' ||
      state === 'thinking' ||
      state === 'streaming' ||
      state === 'buffering' ||
      state === 'reconnecting'
    );
  }

  /**
   * Subscribe to specific state
   */
  onState(targetState: StreamingState): Observable<StreamingContext> {
    return this.context$.pipe(filter((ctx) => ctx.state === targetState));
  }

  /**
   * Subscribe to multiple states
   */
  onStates(...states: StreamingState[]): Observable<StreamingContext> {
    const stateSet = new Set(states);
    return this.context$.pipe(filter((ctx) => stateSet.has(ctx.state)));
  }

  // ============================================
  // Private Methods
  // ============================================

  private findTransition(
    currentState: StreamingState,
    event: StreamingEvent,
    context: StreamingContext
  ): StateTransition | null {
    return (
      this.transitions.find((t) => {
        // Check if from state matches
        if (!this.matchesFrom(t.from, currentState)) {
          return false;
        }

        // Check if event matches
        if (t.event !== event) {
          return false;
        }

        // Check guard if present
        if (t.guard && !t.guard(context)) {
          return false;
        }

        return true;
      }) || null
    );
  }

  private matchesFrom(from: StreamingState | StreamingState[], current: StreamingState): boolean {
    if (Array.isArray(from)) {
      return from.includes(current);
    }
    return from === current;
  }

  private applyEventUpdates(context: StreamingContext, eventData: StreamingEventData): void {
    switch (eventData.event) {
      case 'CONNECT':
        context.startTime = Date.now();
        context.reconnectAttempts = 0;
        context.errorCount = 0;
        break;

      case 'CHUNK_RECEIVED':
        context.chunksReceived++;
        if (!context.firstChunkTime) {
          context.firstChunkTime = Date.now();
        }
        if (eventData.payload && typeof eventData.payload === 'object') {
          const payload = eventData.payload as { bytes?: number; data?: unknown };
          if (payload.bytes) {
            context.bytesReceived += payload.bytes;
          }
          if (payload.data !== undefined) {
            context.partialData = payload.data;
          }
        }
        break;

      case 'PAUSE':
        context.isPausedByUser = true;
        break;

      case 'RESUME':
        context.isPausedByUser = false;
        break;

      case 'BUFFER_OVERFLOW':
        context.bufferState = 'overflow';
        break;

      case 'BUFFER_CLEARED':
        context.bufferState = 'empty';
        break;

      case 'ERROR':
        context.errorCount++;
        if (eventData.payload instanceof Error) {
          context.lastError = eventData.payload;
        }
        break;

      case 'RECONNECT':
        context.reconnectAttempts++;
        break;

      case 'RECONNECT_SUCCESS':
        // Keep reconnect attempts for tracking
        break;

      case 'RESET':
        Object.assign(context, createInitialContext());
        break;
    }
  }

  private calculateProgress(context: StreamingContext): number {
    if (context.state === 'idle') {
      return 0;
    }
    if (context.state === 'complete') {
      return 1;
    }
    if (context.state === 'error' || context.state === 'aborted') {
      return 0;
    }

    // If we know total bytes, use byte-based progress
    if (context.totalBytes && context.totalBytes > 0) {
      return Math.min(1, context.bytesReceived / context.totalBytes);
    }

    // If we know total sections, use section-based progress
    if (context.totalSections && context.totalSections > 0) {
      return Math.min(1, context.sectionsCompleted / context.totalSections);
    }

    // Fallback: estimate based on state
    switch (context.state) {
      case 'connecting':
        return 0.05;
      case 'thinking':
        return 0.1;
      case 'streaming':
        // Estimate based on chunks received (assume average card is ~50 chunks)
        return Math.min(0.9, 0.1 + (context.chunksReceived / 50) * 0.8);
      case 'reconnecting':
        return context.previousState === 'streaming' ? 0.5 : 0.05;
      default:
        return 0;
    }
  }
}

// Declare ngDevMode for TypeScript
declare const ngDevMode: boolean | undefined;

/**
 * Create a streaming state machine with default configuration
 */
export function createStreamingStateMachine(options?: {
  maxReconnectAttempts?: number;
  customTransitions?: StateTransition[];
}): StreamingStateMachine {
  return new StreamingStateMachine(options?.customTransitions, {
    maxReconnectAttempts: options?.maxReconnectAttempts ?? 5,
  });
}



