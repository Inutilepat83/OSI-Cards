/**
 * Mock Streaming Service
 *
 * Test utility for simulating streaming behavior in unit tests.
 * Allows controlled emission of chunks and state changes.
 *
 * @since 2.0.0
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, concat, Observable, of, Subject, timer } from 'rxjs';
import { finalize, map, takeUntil } from 'rxjs/operators';
import {
  StreamingChunk,
  StreamingConnectionState,
  StreamingConnectionStatus,
  StreamingProtocol,
  StreamingTransport,
  StreamingTransportConfig,
  StreamingTransportError,
} from './streaming-transport.interface';
import { AICardConfig } from '../../../models';

/**
 * Mock chunk definition
 */
export interface MockChunk {
  data: string;
  delayMs?: number;
  eventType?: string;
  shouldError?: boolean;
  errorMessage?: string;
}

/**
 * Mock streaming configuration
 */
export interface MockStreamingConfig {
  /** Delay before first chunk */
  initialDelayMs?: number;
  /** Default delay between chunks */
  defaultChunkDelayMs?: number;
  /** Should simulate thinking phase */
  simulateThinking?: boolean;
  /** Thinking duration */
  thinkingDurationMs?: number;
  /** Should auto-complete after all chunks */
  autoComplete?: boolean;
  /** Simulate connection failure */
  simulateConnectionFailure?: boolean;
  /** Simulate disconnect during streaming */
  simulateDisconnect?: boolean;
  /** Disconnect after N chunks */
  disconnectAfterChunks?: number;
}

const DEFAULT_MOCK_CONFIG: MockStreamingConfig = {
  initialDelayMs: 100,
  defaultChunkDelayMs: 50,
  simulateThinking: true,
  thinkingDurationMs: 500,
  autoComplete: true,
  simulateConnectionFailure: false,
  simulateDisconnect: false,
};

/**
 * Mock Streaming Service
 *
 * Simulates streaming for testing purposes.
 * Provides controlled chunk emission and state management.
 *
 * @example
 * ```typescript
 * // In test file
 * const mockStreaming = new MockStreamingService();
 *
 * // Set up chunks to emit
 * mockStreaming.setChunks([
 *   { data: '{"cardTitle": "Test",' },
 *   { data: '"sections": []}', delayMs: 100 }
 * ]);
 *
 * // Connect and stream
 * mockStreaming.connect({ url: 'mock://test' }).subscribe();
 *
 * // Manually control state
 * mockStreaming.emitState('streaming');
 * mockStreaming.emitChunk({ data: 'custom data' });
 * ```
 */
@Injectable()
export class MockStreamingService extends StreamingTransport {
  readonly protocol: StreamingProtocol = 'fetch';

  private config: MockStreamingConfig = { ...DEFAULT_MOCK_CONFIG };
  private chunks: MockChunk[] = [];
  private currentChunkIndex = 0;
  private sequenceCounter = 0;
  private bytesReceived = 0;
  private chunksReceived = 0;
  private _isConnected = false;

  private readonly destroy$ = new Subject<void>();
  private readonly chunkSubject = new Subject<StreamingChunk>();
  private readonly stateSubject = new BehaviorSubject<StreamingConnectionState>('disconnected');
  private readonly statusSubject = new BehaviorSubject<StreamingConnectionStatus>(
    this.createStatus()
  );
  private readonly errorSubject = new Subject<StreamingTransportError>();

  readonly chunks$ = this.chunkSubject.asObservable();
  readonly state$ = this.stateSubject.asObservable();
  readonly status$ = this.statusSubject.asObservable();
  readonly errors$ = this.errorSubject.asObservable();

  /**
   * Configure mock behavior
   */
  configure(config: Partial<MockStreamingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set chunks to emit
   */
  setChunks(chunks: MockChunk[]): void {
    this.chunks = chunks;
    this.currentChunkIndex = 0;
  }

  /**
   * Set chunks from card JSON
   */
  setCardJson(json: string, chunkSize = 50): void {
    const chunks: MockChunk[] = [];
    for (let i = 0; i < json.length; i += chunkSize) {
      chunks.push({
        data: json.substring(i, i + chunkSize),
        delayMs: this.config.defaultChunkDelayMs,
      });
    }
    this.setChunks(chunks);
  }

  /**
   * Set chunks from AICardConfig
   */
  setCard(card: AICardConfig, chunkSize = 50): void {
    this.setCardJson(JSON.stringify(card), chunkSize);
  }

  /**
   * Connect (mock)
   */
  connect(_transportConfig: StreamingTransportConfig): Observable<void> {
    return new Observable((observer) => {
      this.reset();

      // Check for simulated connection failure
      if (this.config.simulateConnectionFailure) {
        setTimeout(() => {
          const error: StreamingTransportError = {
            code: 'CONNECTION_FAILED',
            message: 'Simulated connection failure',
            recoverable: true,
            timestamp: Date.now(),
          };
          this.errorSubject.next(error);
          this.stateSubject.next('error');
          observer.error(error);
        }, this.config.initialDelayMs);
        return;
      }

      this.stateSubject.next('connecting');

      setTimeout(() => {
        this._isConnected = true;
        this.stateSubject.next('connected');
        this.updateStatus();
        observer.next();
        observer.complete();

        // Auto-start streaming if chunks are set
        if (this.chunks.length > 0) {
          this.startStreaming();
        }
      }, this.config.initialDelayMs);
    });
  }

  /**
   * Disconnect (mock)
   */
  disconnect(_reason?: string): void {
    this._isConnected = false;
    this.stateSubject.next('disconnected');
    this.updateStatus();
    this.destroy$.next();
  }

  /**
   * Send is not supported in mock
   */
  send(_data: string | ArrayBuffer): Observable<void> {
    return of(undefined);
  }

  /**
   * Get status
   */
  getStatus(): StreamingConnectionStatus {
    return this.statusSubject.value;
  }

  /**
   * Check if connected (implements abstract method)
   */
  isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Pause streaming (mock - no-op)
   */
  pause(): void {
    // Mock streaming doesn't support pause
  }

  /**
   * Resume streaming (mock - no-op)
   */
  resume(): void {
    // Mock streaming doesn't support resume
  }

  /**
   * Reconnect (mock)
   */
  reconnect(): Observable<void> {
    this.disconnect('Reconnecting');
    return this.connect({ url: 'mock://reconnect' });
  }

  /**
   * Destroy
   */
  destroy(): void {
    // Cleanup complete
    this.disconnect('Destroyed');
    this.destroy$.complete();
    this.chunkSubject.complete();
    this.stateSubject.complete();
    this.statusSubject.complete();
    this.errorSubject.complete();
  }

  // ============================================
  // Manual Control Methods (for testing)
  // ============================================

  /**
   * Manually emit a chunk
   */
  emitChunk(chunk: Partial<MockChunk>): void {
    this.sequenceCounter++;
    this.chunksReceived++;
    const data = chunk.data || '';
    this.bytesReceived += data.length;

    this.chunkSubject.next({
      data,
      sequence: this.sequenceCounter,
      eventType: chunk.eventType,
      timestamp: Date.now(),
      byteSize: data.length,
    });

    this.updateStatus();
  }

  /**
   * Manually emit a state change
   */
  emitState(state: StreamingConnectionState): void {
    this.stateSubject.next(state);
    this.updateStatus();
  }

  /**
   * Manually emit an error
   */
  emitError(error: Partial<StreamingTransportError>): void {
    this.errorSubject.next({
      code: error.code || 'MOCK_ERROR',
      message: error.message || 'Mock error',
      recoverable: error.recoverable ?? true,
      timestamp: Date.now(),
    });

    if (!error.recoverable) {
      this.stateSubject.next('error');
    }
  }

  /**
   * Start emitting chunks
   */
  startStreaming(): void {
    if (this.config.simulateThinking) {
      this.stateSubject.next('connected');

      setTimeout(() => {
        this.emitAllChunks();
      }, this.config.thinkingDurationMs);
    } else {
      this.emitAllChunks();
    }
  }

  /**
   * Complete the stream
   */
  complete(): void {
    this.stateSubject.next('disconnected');
    this.updateStatus();
  }

  /**
   * Reset mock state
   */
  reset(): void {
    this.currentChunkIndex = 0;
    this.sequenceCounter = 0;
    this.bytesReceived = 0;
    this.chunksReceived = 0;
    this._isConnected = false;
    this.stateSubject.next('disconnected');
    this.updateStatus();
  }

  /**
   * Get emitted chunks count
   */
  getEmittedChunksCount(): number {
    return this.chunksReceived;
  }

  /**
   * Get remaining chunks count
   */
  getRemainingChunksCount(): number {
    return this.chunks.length - this.currentChunkIndex;
  }

  // ============================================
  // Private Methods
  // ============================================

  private emitAllChunks(): void {
    // Check for simulated disconnect
    if (this.config.simulateDisconnect && this.config.disconnectAfterChunks !== undefined) {
      const disconnectAt = this.config.disconnectAfterChunks;

      const chunksToEmit = this.chunks.slice(0, disconnectAt);
      this.emitChunksSequentially(chunksToEmit).subscribe({
        complete: () => {
          const error: StreamingTransportError = {
            code: 'CONNECTION_LOST',
            message: 'Simulated disconnect',
            recoverable: true,
            timestamp: Date.now(),
          };
          this.errorSubject.next(error);
          this.stateSubject.next('error');
        },
      });
      return;
    }

    this.emitChunksSequentially(this.chunks).subscribe({
      complete: () => {
        if (this.config.autoComplete) {
          this.complete();
        }
      },
    });
  }

  private emitChunksSequentially(chunks: MockChunk[]): Observable<void> {
    if (chunks.length === 0) {
      return of(undefined);
    }

    const chunkObservables = chunks.map((chunk, index) => {
      const delayMs = chunk.delayMs ?? this.config.defaultChunkDelayMs ?? 0;

      return timer(delayMs).pipe(
        map(() => {
          if (chunk.shouldError) {
            this.emitError({
              code: 'CHUNK_ERROR',
              message: chunk.errorMessage || 'Chunk error',
              recoverable: false,
            });
            throw new Error(chunk.errorMessage);
          }

          this.emitChunk(chunk);
          this.currentChunkIndex = index + 1;
        })
      );
    });

    return concat(...chunkObservables).pipe(
      takeUntil(this.destroy$),
      finalize(() => {})
    );
  }

  private createStatus(): StreamingConnectionStatus {
    return {
      state: this.stateSubject.value,
      protocol: this.protocol,
      url: 'mock://streaming',
      reconnectAttempts: 0,
      bytesReceived: this.bytesReceived,
      chunksReceived: this.chunksReceived,
    };
  }

  private updateStatus(): void {
    this.statusSubject.next(this.createStatus());
  }
}

// ============================================
// Test Utilities
// ============================================

/**
 * Create a mock streaming service for testing
 */
export function createMockStreamingService(
  config?: Partial<MockStreamingConfig>
): MockStreamingService {
  const service = new MockStreamingService();
  if (config) {
    service.configure(config);
  }
  return service;
}

/**
 * Generate mock card chunks from AICardConfig
 */
export function generateMockChunks(
  card: AICardConfig,
  options?: {
    chunkSize?: number;
    delayMs?: number;
    includeErrors?: boolean;
  }
): MockChunk[] {
  const json = JSON.stringify(card, null, 0);
  const chunkSize = options?.chunkSize ?? 50;
  const delayMs = options?.delayMs ?? 30;
  const chunks: MockChunk[] = [];

  for (let i = 0; i < json.length; i += chunkSize) {
    chunks.push({
      data: json.substring(i, i + chunkSize),
      delayMs: delayMs + Math.random() * 20, // Add jitter
    });
  }

  // Optionally inject an error
  if (options?.includeErrors && chunks.length > 3) {
    chunks.splice(Math.floor(chunks.length / 2), 0, {
      data: '',
      shouldError: true,
      errorMessage: 'Simulated chunk error',
    });
  }

  return chunks;
}

/**
 * Assert streaming state transitions
 */
export function assertStateTransitions(
  states: StreamingConnectionState[],
  expected: StreamingConnectionState[]
): void {
  if (states.length !== expected.length) {
    throw new Error(
      `State count mismatch: expected ${expected.length}, got ${states.length}\n` +
        `Expected: ${expected.join(' -> ')}\n` +
        `Got: ${states.join(' -> ')}`
    );
  }

  for (let i = 0; i < expected.length; i++) {
    if (states[i] !== expected[i]) {
      throw new Error(
        `State mismatch at index ${i}: expected '${expected[i]}', got '${states[i]}'`
      );
    }
  }
}

/**
 * Wait for streaming to complete
 */
export function waitForStreamingComplete(
  transport: StreamingTransport,
  timeoutMs = 10000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Streaming did not complete within ${timeoutMs}ms`));
    }, timeoutMs);

    const subscription = transport.state$.subscribe((state) => {
      if (state === 'disconnected' || state === 'error') {
        clearTimeout(timeout);
        subscription.unsubscribe();
        resolve();
      }
    });
  });
}

/**
 * Collect all chunks from a stream
 */
export function collectChunks(
  transport: StreamingTransport,
  maxChunks = 1000
): Promise<StreamingChunk[]> {
  return new Promise((resolve, reject) => {
    const chunks: StreamingChunk[] = [];

    const subscription = transport.chunks$.subscribe({
      next: (chunk) => {
        chunks.push(chunk);
        if (chunks.length >= maxChunks) {
          subscription.unsubscribe();
          resolve(chunks);
        }
      },
      error: reject,
      complete: () => resolve(chunks),
    });

    // Also listen for disconnect
    transport.state$.subscribe((state) => {
      if (state === 'disconnected' && chunks.length > 0) {
        subscription.unsubscribe();
        resolve(chunks);
      }
    });
  });
}
