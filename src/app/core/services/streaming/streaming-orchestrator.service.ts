/**
 * Streaming Orchestrator Service
 *
 * High-level service that coordinates all streaming components:
 * - Transport selection and connection
 * - State machine management
 * - JSON parsing
 * - Progress tracking
 * - Error handling with recovery
 *
 * @since 2.0.0
 */

import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, EMPTY, merge, Observable, of, Subject, throwError } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { AICardConfig } from '../../../models';
import {
  StreamingChunk,
  StreamingConnectionState,
  StreamingProtocol,
  StreamingTransport,
  StreamingTransportConfig,
} from './streaming-transport.interface';
import { StreamingTransportFactoryService } from './streaming-transport-factory.service';
import {
  createStreamingStateMachine,
  StateChange,
  StreamingContext,
  StreamingState,
  StreamingStateMachine,
} from './streaming-state-machine';
import { ParsedResult, StreamingJsonParser } from './streaming-json-parser.service';
import {
  SectionProgress,
  StreamingProgress,
  StreamingProgressService,
} from './streaming-progress.service';
import { StreamingWorkerService } from './streaming-worker.service';
import {
  DefaultStreamingErrorHandler,
  StreamAbortedError,
  StreamConnectionError,
  StreamingError,
  StreamingErrorFactory,
  StreamParseError,
} from './streaming-errors';

/**
 * Orchestrator configuration
 */
export interface StreamingOrchestratorConfig {
  /** Preferred transport protocol */
  preferredProtocol?: StreamingProtocol;
  /** Transport configuration */
  transportConfig?: Partial<StreamingTransportConfig>;
  /** Use web worker for parsing */
  useWorker?: boolean;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  /** Debounce time for card updates (ms) */
  cardUpdateDebounceMs?: number;
  /** Enable progress tracking */
  enableProgress?: boolean;
  /** Auto-parse JSON chunks */
  autoParse?: boolean;
}

const DEFAULT_CONFIG: StreamingOrchestratorConfig = {
  preferredProtocol: 'fetch',
  useWorker: false,
  maxReconnectAttempts: 5,
  cardUpdateDebounceMs: 50,
  enableProgress: true,
  autoParse: true,
};

/**
 * Card update event
 */
export interface CardStreamUpdate {
  /** Current card state */
  card: Partial<AICardConfig> | null;
  /** Type of change */
  changeType: 'initial' | 'structural' | 'content' | 'complete';
  /** Indices of newly completed sections */
  completedSections: number[];
  /** Whether stream is complete */
  isComplete: boolean;
  /** Parse result details */
  parseResult: ParsedResult | null;
}

/**
 * Streaming session info
 */
export interface StreamingSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  url: string;
  protocol: StreamingProtocol;
  totalChunks: number;
  totalBytes: number;
  sectionsGenerated: number;
  finalCard: AICardConfig | null;
  errors: StreamingError[];
}

/**
 * Streaming Orchestrator Service
 *
 * Provides a unified API for card streaming operations.
 * Coordinates transport, parsing, state management, and progress tracking.
 *
 * @example
 * ```typescript
 * const orchestrator = inject(StreamingOrchestratorService);
 *
 * // Start streaming
 * orchestrator.startStream({
 *   url: '/api/generate',
 *   method: 'POST',
 *   body: { prompt: 'Generate a card...' }
 * });
 *
 * // Subscribe to card updates
 * orchestrator.cardUpdates$.subscribe(update => {
 *   this.card = update.card;
 *   this.isStreaming = !update.isComplete;
 * });
 *
 * // Subscribe to progress
 * orchestrator.progress$.subscribe(progress => {
 *   this.progressPercent = progress.progress * 100;
 * });
 *
 * // Stop if needed
 * orchestrator.stop();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class StreamingOrchestratorService implements OnDestroy {
  private readonly transportFactory = inject(StreamingTransportFactoryService);
  private readonly progressService = inject(StreamingProgressService);
  private readonly workerService = inject(StreamingWorkerService);

  private config: StreamingOrchestratorConfig = { ...DEFAULT_CONFIG };
  private transport: StreamingTransport | null = null;
  private stateMachine: StreamingStateMachine | null = null;
  private jsonParser: StreamingJsonParser | null = null;
  private errorHandler = new DefaultStreamingErrorHandler();
  private currentSession: StreamingSession | null = null;
  private buffer = '';
  private lastCompletedSections: number[] = [];

  private readonly destroy$ = new Subject<void>();
  private readonly sessionSubject = new Subject<void>();

  private readonly cardUpdateSubject = new Subject<CardStreamUpdate>();
  private readonly stateSubject = new BehaviorSubject<StreamingState>('idle');
  private readonly isActiveSubject = new BehaviorSubject<boolean>(false);

  /** Observable of card updates */
  readonly cardUpdates$ = this.cardUpdateSubject.asObservable();

  /** Observable of streaming state */
  readonly state$ = this.stateSubject.asObservable();

  /** Observable of whether streaming is active */
  readonly isActive$ = this.isActiveSubject.asObservable();

  /** Observable of progress (delegated to progress service) */
  readonly progress$: Observable<StreamingProgress> = this.progressService.progress$;

  /** Observable of state machine context */
  get context$(): Observable<StreamingContext> {
    return this.stateMachine?.context$ ?? EMPTY;
  }

  /**
   * Configure the orchestrator
   */
  configure(config: Partial<StreamingOrchestratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Start a streaming session
   */
  startStream(options: {
    url: string;
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: unknown;
    protocol?: StreamingProtocol;
  }): Observable<void> {
    // Stop any existing session
    this.stop();

    // Create new session
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.currentSession = {
      id: sessionId,
      startedAt: Date.now(),
      url: options.url,
      protocol: options.protocol || this.config.preferredProtocol || 'fetch',
      totalChunks: 0,
      totalBytes: 0,
      sectionsGenerated: 0,
      finalCard: null,
      errors: [],
    };

    // Initialize components
    this.stateMachine = createStreamingStateMachine({
      maxReconnectAttempts: this.config.maxReconnectAttempts,
    });
    this.jsonParser = new StreamingJsonParser();
    this.buffer = '';
    this.lastCompletedSections = [];

    // Subscribe to state machine changes
    this.stateMachine.state$
      .pipe(takeUntil(this.sessionSubject), distinctUntilChanged())
      .subscribe((state) => {
        this.stateSubject.next(state);
        this.isActiveSubject.next(
          state === 'connecting' ||
            state === 'thinking' ||
            state === 'streaming' ||
            state === 'buffering' ||
            state === 'reconnecting'
        );
      });

    // Get transport
    const protocol =
      options.protocol ||
      this.config.preferredProtocol ||
      this.transportFactory.detectBestProtocol();
    this.transport = this.transportFactory.create(protocol);
    this.currentSession.protocol = protocol;

    // Build transport config
    const transportConfig: StreamingTransportConfig = {
      url: options.url,
      headers: options.headers,
      autoReconnect: true,
      maxReconnectAttempts: this.config.maxReconnectAttempts,
      ...this.config.transportConfig,
      requestInit: options.body
        ? {
            method: options.method || 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
            },
            body: JSON.stringify(options.body),
          }
        : undefined,
    };

    // Start progress tracking
    if (this.config.enableProgress) {
      this.progressService.start();
    }

    // Update state
    this.stateMachine.send('CONNECT');

    // Subscribe to chunks
    this.transport.chunks$.pipe(takeUntil(this.sessionSubject)).subscribe({
      next: (chunk) => this.handleChunk(chunk),
      error: (err) => this.handleError(err),
    });

    // Subscribe to transport state
    this.transport.state$.pipe(takeUntil(this.sessionSubject)).subscribe((state) => {
      this.handleTransportState(state);
    });

    // Connect
    return this.transport.connect(transportConfig).pipe(
      tap(() => {
        this.stateMachine?.send('CONNECTED');
        this.stateMachine?.send('START_THINKING');
      }),
      catchError((err) => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Start streaming from pre-existing JSON (simulation mode)
   */
  startFromJson(json: string, options?: { instant?: boolean }): Observable<void> {
    // Stop any existing session
    this.stop();

    // Create session
    const sessionId = `json-${Date.now()}`;
    this.currentSession = {
      id: sessionId,
      startedAt: Date.now(),
      url: 'json://local',
      protocol: 'fetch',
      totalChunks: 0,
      totalBytes: json.length,
      sectionsGenerated: 0,
      finalCard: null,
      errors: [],
    };

    // Initialize
    this.stateMachine = createStreamingStateMachine();
    this.jsonParser = new StreamingJsonParser();
    this.buffer = '';
    this.lastCompletedSections = [];

    // Subscribe to state
    this.stateMachine.state$.pipe(takeUntil(this.sessionSubject)).subscribe((state) => {
      this.stateSubject.next(state);
      this.isActiveSubject.next(state === 'streaming' || state === 'thinking');
    });

    // Start progress
    if (this.config.enableProgress) {
      this.progressService.start({ bytesTotal: json.length });
    }

    if (options?.instant) {
      // Parse all at once
      this.stateMachine.send('CONNECT');
      this.stateMachine.send('CONNECTED');
      this.stateMachine.send('START_STREAMING');

      const result = this.jsonParser.feed(json);
      this.handleParseResult(result, true);

      this.completeSession();
      return of(undefined);
    } else {
      // Simulate chunked streaming
      return this.simulateStreaming(json);
    }
  }

  /**
   * Stop the current streaming session
   */
  stop(): void {
    if (this.transport) {
      this.transport.disconnect('User stopped');
    }

    if (this.stateMachine?.getState() !== 'idle') {
      this.stateMachine?.send('ABORT');
    }

    this.progressService.reset();
    this.sessionSubject.next();

    if (this.currentSession && !this.currentSession.endedAt) {
      this.currentSession.endedAt = Date.now();
    }

    this.transport = null;
    this.stateMachine = null;
    this.jsonParser = null;
    this.buffer = '';

    this.stateSubject.next('idle');
    this.isActiveSubject.next(false);
  }

  /**
   * Pause streaming
   */
  pause(): void {
    this.transport?.pause?.();
    this.stateMachine?.send('PAUSE');
  }

  /**
   * Resume streaming
   */
  resume(): void {
    this.transport?.resume?.();
    this.stateMachine?.send('RESUME');
  }

  /**
   * Get current state
   */
  getState(): StreamingState {
    return this.stateSubject.value;
  }

  /**
   * Check if streaming is active
   */
  isActive(): boolean {
    return this.isActiveSubject.value;
  }

  /**
   * Get current session info
   */
  getSession(): StreamingSession | null {
    return this.currentSession;
  }

  /**
   * Get current buffer contents
   */
  getBuffer(): string {
    return this.buffer;
  }

  ngOnDestroy(): void {
    this.stop();
    this.destroy$.next();
    this.destroy$.complete();
    this.sessionSubject.complete();
    this.cardUpdateSubject.complete();
    this.stateSubject.complete();
    this.isActiveSubject.complete();
  }

  // ============================================
  // Private Methods
  // ============================================

  private handleChunk(chunk: StreamingChunk): void {
    if (!this.jsonParser || !this.stateMachine) {
      return;
    }

    // Update session stats
    if (this.currentSession) {
      this.currentSession.totalChunks++;
      this.currentSession.totalBytes += chunk.byteSize;
    }

    // Update state machine
    this.stateMachine.send('CHUNK_RECEIVED', {
      bytes: chunk.byteSize,
      sequence: chunk.sequence,
    });

    // Update progress
    if (this.config.enableProgress) {
      this.progressService.update({
        bytesReceived: this.currentSession?.totalBytes || 0,
        chunksReceived: this.currentSession?.totalChunks || 0,
      });
    }

    // Parse if auto-parse enabled
    if (this.config.autoParse) {
      const result = this.jsonParser.feed(chunk.data);
      this.handleParseResult(result, false);
    } else {
      this.buffer += chunk.data;
    }
  }

  private handleParseResult(result: ParsedResult, isFinal: boolean): void {
    // Track newly completed sections
    const newlyCompleted = result.newlyCompletedSections.filter(
      (idx) => !this.lastCompletedSections.includes(idx)
    );

    if (newlyCompleted.length > 0) {
      this.lastCompletedSections.push(...newlyCompleted);

      // Update session
      if (this.currentSession) {
        this.currentSession.sectionsGenerated = result.completeSections;
      }

      // Update progress
      if (this.config.enableProgress) {
        this.progressService.update({
          sectionsComplete: result.completeSections,
        });

        // Update section progress
        newlyCompleted.forEach((idx) => {
          const sections = (result.card as AICardConfig)?.sections;
          const section = sections?.[idx];
          if (section) {
            this.progressService.updateSection(idx, {
              title: section.title || `Section ${idx + 1}`,
              isComplete: true,
              progress: 1,
              fieldsComplete: section.fields?.length || 0,
              fieldsTotal: section.fields?.length || 0,
              itemsComplete: section.items?.length || 0,
              itemsTotal: section.items?.length || 0,
            });
          }
        });
      }
    }

    // Determine change type
    let changeType: CardStreamUpdate['changeType'] = 'content';
    if (!this.cardUpdateSubject.observed) {
      changeType = 'initial';
    } else if (newlyCompleted.length > 0) {
      changeType = 'structural';
    }
    if (isFinal) {
      changeType = 'complete';
    }

    // Emit card update
    this.cardUpdateSubject.next({
      card: result.card,
      changeType,
      completedSections: newlyCompleted,
      isComplete: isFinal || result.state === 'complete',
      parseResult: result,
    });

    // Store final card
    if (isFinal && result.card && this.currentSession) {
      this.currentSession.finalCard = result.card as AICardConfig;
    }
  }

  private handleTransportState(state: StreamingConnectionState): void {
    if (!this.stateMachine) {
      return;
    }

    switch (state) {
      case 'connected':
        if (this.stateMachine.getState() === 'connecting') {
          this.stateMachine.send('CONNECTED');
        }
        break;

      case 'disconnected':
        if (this.stateMachine.getState() === 'streaming') {
          // Normal completion
          this.completeSession();
        }
        break;

      case 'reconnecting':
        this.stateMachine.send('RECONNECT');
        break;

      case 'error':
        this.stateMachine.send('ERROR');
        break;
    }
  }

  private handleError(error: unknown): void {
    const streamingError =
      error instanceof StreamingError
        ? error
        : StreamingErrorFactory.fromFetchError(error as Error);

    this.errorHandler.handle(streamingError);

    if (this.currentSession) {
      this.currentSession.errors.push(streamingError);
    }

    this.stateMachine?.send('ERROR', error);
    this.progressService.error();
  }

  private completeSession(): void {
    if (this.jsonParser) {
      const result = this.jsonParser.complete();
      this.handleParseResult(result, true);
    }

    this.stateMachine?.send('COMPLETE');
    this.progressService.complete();

    if (this.currentSession) {
      this.currentSession.endedAt = Date.now();
    }

    this.isActiveSubject.next(false);
  }

  private simulateStreaming(json: string): Observable<void> {
    return new Observable((observer) => {
      const chunkSize = 50;
      const delayMs = 30;
      let index = 0;

      this.stateMachine?.send('CONNECT');
      this.stateMachine?.send('CONNECTED');

      // Simulate thinking
      setTimeout(() => {
        this.stateMachine?.send('START_STREAMING');

        const emitChunk = () => {
          if (index >= json.length) {
            this.completeSession();
            observer.next();
            observer.complete();
            return;
          }

          const chunk = json.substring(index, index + chunkSize);
          index += chunkSize;

          if (this.jsonParser && this.currentSession) {
            this.currentSession.totalChunks++;
            this.currentSession.totalBytes += chunk.length;

            const result = this.jsonParser.feed(chunk);
            this.handleParseResult(result, false);

            this.progressService.update({
              bytesReceived: this.currentSession.totalBytes,
              chunksReceived: this.currentSession.totalChunks,
            });
          }

          setTimeout(emitChunk, delayMs);
        };

        emitChunk();
      }, 500); // Thinking delay
    });
  }
}
