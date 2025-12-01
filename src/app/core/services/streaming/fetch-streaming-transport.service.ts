/**
 * Fetch Streaming Transport
 *
 * Implements streaming transport using Fetch API with ReadableStream for progressive data.
 * Supports NDJSON (newline-delimited JSON) and custom delimiters.
 *
 * @since 2.0.0
 */

import { inject, Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, from, Observable, Subject, throwError } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  StreamingChunk,
  StreamingConnectionState,
  StreamingConnectionStatus,
  StreamingProtocol,
  StreamingTransport,
  StreamingTransportConfig,
  StreamingTransportError,
} from './streaming-transport.interface';

/**
 * Default Fetch streaming configuration
 */
const FETCH_DEFAULTS: Partial<StreamingTransportConfig> = {
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectBaseDelayMs: 1000,
  reconnectMaxDelayMs: 30000,
  connectionTimeoutMs: 60000,
  enableCompression: true,
};

/**
 * Fetch Streaming Transport Service
 *
 * Uses the Fetch API with ReadableStream for progressive data streaming.
 * Parses NDJSON (newline-delimited JSON) chunks as they arrive.
 *
 * @example
 * ```typescript
 * const transport = inject(FetchStreamingTransport);
 *
 * transport.connect({
 *   url: '/api/stream/generate',
 *   headers: { 'Authorization': 'Bearer token' },
 *   requestInit: { method: 'POST', body: JSON.stringify({ prompt: '...' }) }
 * }).subscribe();
 *
 * transport.chunks$.subscribe(chunk => {
 *   console.log('Received:', chunk.data);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class FetchStreamingTransport extends StreamingTransport {
  private readonly ngZone = inject(NgZone);

  readonly protocol: StreamingProtocol = 'fetch';

  private abortController: AbortController | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private config: StreamingTransportConfig | null = null;
  private sequenceCounter = 0;
  private reconnectAttempts = 0;
  private bytesReceived = 0;
  private chunksReceived = 0;
  private lastConnectedAt?: number;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private buffer = '';
  private isPaused = false;
  private pausedChunks: StreamingChunk[] = [];

  private readonly destroy$ = new Subject<void>();
  private readonly chunkSubject = new Subject<StreamingChunk>();
  private readonly stateSubject = new BehaviorSubject<StreamingConnectionState>('disconnected');
  private readonly statusSubject = new BehaviorSubject<StreamingConnectionStatus>(
    this.createInitialStatus()
  );
  private readonly errorSubject = new Subject<StreamingTransportError>();

  readonly chunks$ = this.chunkSubject.asObservable();
  readonly state$ = this.stateSubject.asObservable();
  readonly status$ = this.statusSubject.asObservable();
  readonly errors$ = this.errorSubject.asObservable();

  /**
   * Connect and start streaming from fetch endpoint
   */
  connect(config: StreamingTransportConfig): Observable<void> {
    return new Observable<void>((observer) => {
      if (this.abortController) {
        this.disconnect('New connection requested');
      }

      this.config = { ...FETCH_DEFAULTS, ...config };
      this.sequenceCounter = 0;
      this.bytesReceived = 0;
      this.chunksReceived = 0;
      this.buffer = '';
      this.isPaused = false;
      this.pausedChunks = [];

      this.updateState('connecting');

      // Create abort controller for cancellation
      this.abortController = new AbortController();

      // Set up timeout
      const timeoutId = this.config.connectionTimeoutMs
        ? setTimeout(() => {
            this.abortController?.abort();
            const error: StreamingTransportError = {
              code: 'CONNECTION_TIMEOUT',
              message: `Connection timed out after ${this.config!.connectionTimeoutMs}ms`,
              recoverable: true,
              timestamp: Date.now(),
            };
            this.errorSubject.next(error);
          }, this.config.connectionTimeoutMs)
        : null;

      // Build fetch options
      const fetchOptions: RequestInit = {
        ...this.config.requestInit,
        signal: this.abortController.signal,
        headers: {
          Accept: 'application/x-ndjson, text/event-stream, application/json',
          ...(this.config.enableCompression ? { 'Accept-Encoding': 'gzip, deflate, br' } : {}),
          ...this.config.headers,
          ...this.config.requestInit?.headers,
        },
      };

      // Start fetch
      this.ngZone.runOutsideAngular(() => {
        fetch(this.config!.url, fetchOptions)
          .then((response) => {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            if (!response.body) {
              throw new Error('Response body is null - streaming not supported');
            }

            this.ngZone.run(() => {
              this.reconnectAttempts = 0;
              this.lastConnectedAt = Date.now();
              this.updateState('connected');
              this.updateStatus();
              observer.next();
              observer.complete();
            });

            // Start reading the stream
            this.readStream(response.body);
          })
          .catch((err) => {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }

            const isAborted = err.name === 'AbortError';
            const error: StreamingTransportError = {
              code: isAborted ? 'ABORTED' : 'CONNECTION_FAILED',
              message: isAborted ? 'Request was aborted' : err.message,
              recoverable: !isAborted,
              originalError: err,
              timestamp: Date.now(),
            };

            this.ngZone.run(() => {
              this.errorSubject.next(error);
              this.updateState('error');

              if (!isAborted) {
                observer.error(error);
                this.handleReconnect();
              }
            });
          });
      });

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    });
  }

  /**
   * Disconnect and abort the stream
   */
  disconnect(reason?: string): void {
    this.clearTimers();

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.reader) {
      this.reader.cancel().catch(() => {});
      this.reader = null;
    }

    this.buffer = '';
    this.pausedChunks = [];
    this.updateState('disconnected');
    this.updateStatus();
  }

  /**
   * Fetch streaming can send data via POST body, but not during stream
   */
  send(_data: string | ArrayBuffer): Observable<void> {
    return throwError(() => ({
      code: 'NOT_SUPPORTED',
      message:
        'Fetch transport does not support sending data after connection. Include data in requestInit.body.',
      recoverable: false,
      timestamp: Date.now(),
    }));
  }

  /**
   * Get current connection status
   */
  getStatus(): StreamingConnectionStatus {
    return this.statusSubject.value;
  }

  /**
   * Check if connected and streaming
   */
  isConnected(): boolean {
    return this.stateSubject.value === 'connected' && this.reader !== null;
  }

  /**
   * Force reconnection
   */
  reconnect(): Observable<void> {
    if (this.config) {
      this.disconnect('Manual reconnection');
      return this.connect(this.config);
    }
    return throwError(() => ({
      code: 'NO_CONFIG',
      message: 'No configuration available for reconnection',
      recoverable: false,
      timestamp: Date.now(),
    }));
  }

  /**
   * Pause emitting chunks (buffer them)
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume emitting chunks and flush buffer
   */
  resume(): void {
    this.isPaused = false;

    // Emit buffered chunks
    while (this.pausedChunks.length > 0) {
      const chunk = this.pausedChunks.shift();
      if (chunk) {
        this.chunkSubject.next(chunk);
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.disconnect('Transport destroyed');
    this.destroy$.next();
    this.destroy$.complete();
    this.chunkSubject.complete();
    this.stateSubject.complete();
    this.statusSubject.complete();
    this.errorSubject.complete();
  }

  // ============================================
  // Private Methods
  // ============================================

  private async readStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const decoder = new TextDecoder();
    this.reader = body.getReader();

    try {
      while (true) {
        const { done, value } = await this.reader.read();

        if (done) {
          // Process any remaining buffered data
          if (this.buffer.trim()) {
            this.processChunk(this.buffer);
          }

          this.ngZone.run(() => {
            this.updateState('disconnected');
            this.updateStatus();
          });
          break;
        }

        const text = decoder.decode(value, { stream: true });
        this.bytesReceived += value.byteLength;

        // Add to buffer and process complete lines
        this.buffer += text;
        this.processBuffer();

        this.ngZone.run(() => {
          this.updateStatus();
        });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const error: StreamingTransportError = {
          code: 'STREAM_ERROR',
          message: err instanceof Error ? err.message : 'Stream reading failed',
          recoverable: true,
          originalError: err instanceof Error ? err : undefined,
          timestamp: Date.now(),
        };

        this.ngZone.run(() => {
          this.errorSubject.next(error);
          this.updateState('error');
          this.handleReconnect();
        });
      }
    }
  }

  private processBuffer(): void {
    // Split by newlines (NDJSON format)
    const lines = this.buffer.split('\n');

    // Keep the last incomplete line in buffer
    this.buffer = lines.pop() || '';

    // Process complete lines
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        this.processChunk(trimmed);
      }
    }
  }

  private processChunk(data: string): void {
    this.sequenceCounter++;
    this.chunksReceived++;

    const chunk: StreamingChunk = {
      data,
      sequence: this.sequenceCounter,
      timestamp: Date.now(),
      byteSize: new Blob([data]).size,
    };

    this.ngZone.run(() => {
      if (this.isPaused) {
        this.pausedChunks.push(chunk);
      } else {
        this.chunkSubject.next(chunk);
      }
    });
  }

  private handleReconnect(): void {
    if (!this.config?.autoReconnect) {
      this.updateState('disconnected');
      return;
    }

    if (
      this.config.maxReconnectAttempts &&
      this.reconnectAttempts >= this.config.maxReconnectAttempts
    ) {
      const error: StreamingTransportError = {
        code: 'MAX_RECONNECT_EXCEEDED',
        message: `Max reconnection attempts (${this.config.maxReconnectAttempts}) exceeded`,
        recoverable: false,
        timestamp: Date.now(),
      };
      this.errorSubject.next(error);
      this.updateState('disconnected');
      return;
    }

    this.reconnectAttempts++;

    // Calculate delay with exponential backoff
    const baseDelay = this.config.reconnectBaseDelayMs || FETCH_DEFAULTS.reconnectBaseDelayMs!;
    const maxDelay = this.config.reconnectMaxDelayMs || FETCH_DEFAULTS.reconnectMaxDelayMs!;
    const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts - 1), maxDelay);

    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    const finalDelay = Math.round(delay + jitter);

    this.updateState('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      if (this.config) {
        this.connect(this.config).subscribe({
          error: () => {
            // Error already handled
          },
        });
      }
    }, finalDelay);
  }

  private updateState(state: StreamingConnectionState): void {
    if (this.stateSubject.value !== state) {
      this.stateSubject.next(state);
      this.updateStatus();
    }
  }

  private updateStatus(): void {
    const status: StreamingConnectionStatus = {
      state: this.stateSubject.value,
      protocol: this.protocol,
      url: this.config?.url || '',
      lastConnectedAt: this.lastConnectedAt,
      reconnectAttempts: this.reconnectAttempts,
      bytesReceived: this.bytesReceived,
      chunksReceived: this.chunksReceived,
    };
    this.statusSubject.next(status);
  }

  private createInitialStatus(): StreamingConnectionStatus {
    return {
      state: 'disconnected',
      protocol: this.protocol,
      url: '',
      reconnectAttempts: 0,
      bytesReceived: 0,
      chunksReceived: 0,
    };
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
