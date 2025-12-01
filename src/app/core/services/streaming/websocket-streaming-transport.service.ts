/**
 * WebSocket Streaming Transport
 *
 * Implements bidirectional streaming transport using WebSocket.
 * Supports automatic reconnection, heartbeat, and message buffering.
 *
 * @since 2.0.0
 */

import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Observable, Subject, throwError } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import {
  StreamingChunk,
  StreamingConnectionState,
  StreamingConnectionStatus,
  StreamingProtocol,
  StreamingTransport,
  StreamingTransportConfig,
  StreamingTransportError,
} from './streaming-transport.interface';
import {
  StreamMaxRetriesError,
  StreamNetworkError,
  WebSocketStreamError,
} from './streaming-errors';

/**
 * Default WebSocket configuration
 */
const WS_DEFAULTS: Partial<StreamingTransportConfig> = {
  autoReconnect: true,
  maxReconnectAttempts: 10,
  reconnectBaseDelayMs: 1000,
  reconnectMaxDelayMs: 30000,
  connectionTimeoutMs: 10000,
  heartbeatIntervalMs: 30000,
};

/**
 * WebSocket message types
 */
export type WebSocketMessageType = 'data' | 'heartbeat' | 'ack' | 'error' | 'control';

/**
 * WebSocket message envelope
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  id?: string;
  data?: string;
  timestamp: number;
}

/**
 * WebSocket Streaming Transport Service
 *
 * Full-duplex streaming using WebSocket protocol.
 * Ideal for bidirectional communication with the server.
 *
 * @example
 * ```typescript
 * const transport = inject(WebSocketStreamingTransport);
 *
 * transport.connect({
 *   url: 'wss://api.example.com/stream',
 *   heartbeatIntervalMs: 30000
 * }).subscribe();
 *
 * // Receive chunks
 * transport.chunks$.subscribe(chunk => {
 *   console.log('Received:', chunk.data);
 * });
 *
 * // Send data (bidirectional)
 * transport.send(JSON.stringify({ action: 'generate' })).subscribe();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class WebSocketStreamingTransport extends StreamingTransport implements OnDestroy {
  private readonly ngZone = inject(NgZone);

  readonly protocol: StreamingProtocol = 'websocket';

  private socket: WebSocket | null = null;
  private config: StreamingTransportConfig | null = null;
  private sequenceCounter = 0;
  private reconnectAttempts = 0;
  private bytesReceived = 0;
  private bytesSent = 0;
  private chunksReceived = 0;
  private lastConnectedAt?: number;
  private lastPingTime?: number;
  private latencyMs?: number;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatSubscription?: { unsubscribe: () => void };

  private isPaused = false;
  private messageBuffer: WebSocketMessage[] = [];
  private sendBuffer: (string | ArrayBuffer)[] = [];

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
   * Connect to WebSocket endpoint
   */
  connect(config: StreamingTransportConfig): Observable<void> {
    return new Observable<void>((observer) => {
      if (this.socket) {
        this.disconnect('New connection requested');
      }

      this.config = { ...WS_DEFAULTS, ...config };
      this.sequenceCounter = 0;
      this.bytesReceived = 0;
      this.bytesSent = 0;
      this.chunksReceived = 0;
      this.messageBuffer = [];
      this.isPaused = false;

      this.updateState('connecting');

      // Set connection timeout
      if (this.config.connectionTimeoutMs && this.config.connectionTimeoutMs > 0) {
        this.connectionTimeout = setTimeout(() => {
          if (this.stateSubject.value === 'connecting') {
            const error: StreamingTransportError = {
              code: 'CONNECTION_TIMEOUT',
              message: `WebSocket connection timed out after ${this.config!.connectionTimeoutMs}ms`,
              recoverable: true,
              timestamp: Date.now(),
            };
            this.errorSubject.next(error);

            if (this.socket) {
              this.socket.close();
            }

            observer.error(error);
            this.handleReconnect();
          }
        }, this.config.connectionTimeoutMs);
      }

      try {
        this.ngZone.runOutsideAngular(() => {
          // Convert HTTP URL to WebSocket URL if needed
          const wsUrl = this.normalizeUrl(this.config!.url);
          this.socket = new WebSocket(wsUrl);
          this.socket.binaryType = 'arraybuffer';

          // Handle connection open
          this.socket.onopen = () => {
            this.ngZone.run(() => {
              this.clearConnectionTimeout();
              this.reconnectAttempts = 0;
              this.lastConnectedAt = Date.now();
              this.updateState('connected');
              this.updateStatus();

              // Start heartbeat
              this.startHeartbeat();

              // Send buffered messages
              this.flushSendBuffer();

              observer.next();
              observer.complete();
            });
          };

          // Handle messages
          this.socket.onmessage = (event: MessageEvent) => {
            this.ngZone.run(() => {
              this.handleMessage(event);
            });
          };

          // Handle errors
          this.socket.onerror = (event: Event) => {
            this.ngZone.run(() => {
              const error: StreamingTransportError = {
                code: 'WEBSOCKET_ERROR',
                message: 'WebSocket error occurred',
                recoverable: true,
                timestamp: Date.now(),
              };
              this.errorSubject.next(error);
            });
          };

          // Handle close
          this.socket.onclose = (event: CloseEvent) => {
            this.ngZone.run(() => {
              this.handleClose(event, observer);
            });
          };
        });
      } catch (err) {
        const error: StreamingTransportError = {
          code: 'CONNECTION_FAILED',
          message: err instanceof Error ? err.message : 'Failed to create WebSocket',
          recoverable: true,
          originalError: err instanceof Error ? err : undefined,
          timestamp: Date.now(),
        };
        this.errorSubject.next(error);
        observer.error(error);
      }

      return () => {
        // Cleanup on unsubscribe
      };
    });
  }

  /**
   * Disconnect from WebSocket endpoint
   */
  disconnect(reason?: string): void {
    this.stopHeartbeat();
    this.clearTimers();

    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(1000, reason);
      }
      this.socket = null;
    }

    this.messageBuffer = [];
    this.updateState('disconnected');
    this.updateStatus();
  }

  /**
   * Send data to server
   */
  send(data: string | ArrayBuffer): Observable<void> {
    return new Observable((observer) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        // Buffer message if not connected but reconnecting
        if (
          this.stateSubject.value === 'reconnecting' ||
          this.stateSubject.value === 'connecting'
        ) {
          this.sendBuffer.push(data);
          observer.next();
          observer.complete();
          return;
        }

        observer.error({
          code: 'NOT_CONNECTED',
          message: 'WebSocket is not connected',
          recoverable: false,
          timestamp: Date.now(),
        });
        return;
      }

      try {
        this.socket.send(data);
        this.bytesSent += typeof data === 'string' ? data.length : data.byteLength;
        this.updateStatus();
        observer.next();
        observer.complete();
      } catch (err) {
        observer.error({
          code: 'SEND_FAILED',
          message: err instanceof Error ? err.message : 'Failed to send message',
          recoverable: true,
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Get current connection status
   */
  getStatus(): StreamingConnectionStatus {
    return this.statusSubject.value;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.stateSubject.value === 'connected' && this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Force reconnection
   */
  reconnect(): Observable<void> {
    if (this.config) {
      this.disconnect('Manual reconnection');
      this.reconnectAttempts = 0;
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
   * Pause receiving chunks (buffer them)
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume receiving chunks
   */
  resume(): void {
    this.isPaused = false;

    // Emit buffered messages
    while (this.messageBuffer.length > 0 && !this.isPaused) {
      const msg = this.messageBuffer.shift();
      if (msg?.data) {
        this.emitChunk(msg.data, msg.type);
      }
    }
  }

  /**
   * Send a ping to measure latency
   */
  ping(): Observable<number> {
    return new Observable((observer) => {
      if (!this.isConnected()) {
        observer.error(new Error('Not connected'));
        return;
      }

      this.lastPingTime = Date.now();
      const pingMessage: WebSocketMessage = {
        type: 'heartbeat',
        id: `ping-${this.lastPingTime}`,
        timestamp: this.lastPingTime,
      };

      this.send(JSON.stringify(pingMessage)).subscribe({
        next: () => {
          // Latency will be measured when pong is received
          // For now, return estimated latency
          observer.next(this.latencyMs || 0);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
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

  ngOnDestroy(): void {
    this.destroy();
  }

  // ============================================
  // Private Methods
  // ============================================

  private handleMessage(event: MessageEvent): void {
    let data: string;
    let byteSize: number;

    if (event.data instanceof ArrayBuffer) {
      const decoder = new TextDecoder();
      data = decoder.decode(event.data);
      byteSize = event.data.byteLength;
    } else {
      data = event.data;
      byteSize = new Blob([data]).size;
    }

    this.bytesReceived += byteSize;

    // Try to parse as WebSocket message envelope
    try {
      const message = JSON.parse(data) as WebSocketMessage;

      if (message.type === 'heartbeat') {
        // Handle heartbeat response (pong)
        if (this.lastPingTime) {
          this.latencyMs = Date.now() - this.lastPingTime;
          this.lastPingTime = undefined;
        }
        this.updateStatus();
        return;
      }

      if (message.type === 'error') {
        this.errorSubject.next({
          code: 'SERVER_ERROR',
          message: message.data || 'Server error',
          recoverable: true,
          timestamp: Date.now(),
        });
        return;
      }

      // Data message
      if (this.isPaused) {
        this.messageBuffer.push(message);
      } else {
        this.emitChunk(message.data || data, message.type);
      }
    } catch {
      // Not a structured message, emit raw data
      if (this.isPaused) {
        this.messageBuffer.push({
          type: 'data',
          data,
          timestamp: Date.now(),
        });
      } else {
        this.emitChunk(data, 'data');
      }
    }

    this.updateStatus();
  }

  private emitChunk(data: string, eventType?: string): void {
    this.sequenceCounter++;
    this.chunksReceived++;

    const chunk: StreamingChunk = {
      data,
      sequence: this.sequenceCounter,
      eventType,
      timestamp: Date.now(),
      byteSize: new Blob([data]).size,
    };

    this.chunkSubject.next(chunk);
  }

  private handleClose(event: CloseEvent, observer?: { error: (err: unknown) => void }): void {
    this.stopHeartbeat();
    this.clearConnectionTimeout();

    const wasConnecting = this.stateSubject.value === 'connecting';

    // Normal closure
    if (event.wasClean && event.code === 1000) {
      this.updateState('disconnected');
      return;
    }

    const error: StreamingTransportError = {
      code: event.wasClean ? 'CONNECTION_CLOSED' : 'CONNECTION_LOST',
      message: event.reason || `WebSocket closed with code ${event.code}`,
      recoverable: true,
      timestamp: Date.now(),
    };

    this.errorSubject.next(error);

    if (wasConnecting && observer) {
      observer.error(error);
    }

    this.updateState('error');
    this.handleReconnect();
  }

  private handleReconnect(): void {
    if (!this.config?.autoReconnect) {
      this.updateState('disconnected');
      return;
    }

    // Check network status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const error = new StreamNetworkError('Network is offline', false);
      this.errorSubject.next({
        code: error.code,
        message: error.message,
        recoverable: true,
        timestamp: Date.now(),
      });

      // Wait for network to come back
      const onlineHandler = () => {
        window.removeEventListener('online', onlineHandler);
        this.handleReconnect();
      };
      window.addEventListener('online', onlineHandler);
      return;
    }

    if (
      this.config.maxReconnectAttempts &&
      this.reconnectAttempts >= this.config.maxReconnectAttempts
    ) {
      const error = new StreamMaxRetriesError(
        `Max reconnection attempts (${this.config.maxReconnectAttempts}) exceeded`,
        this.reconnectAttempts,
        this.config.maxReconnectAttempts
      );
      this.errorSubject.next({
        code: error.code,
        message: error.message,
        recoverable: false,
        timestamp: Date.now(),
      });
      this.updateState('disconnected');
      return;
    }

    this.reconnectAttempts++;

    // Calculate delay with exponential backoff and jitter
    const baseDelay = this.config.reconnectBaseDelayMs || WS_DEFAULTS.reconnectBaseDelayMs!;
    const maxDelay = this.config.reconnectMaxDelayMs || WS_DEFAULTS.reconnectMaxDelayMs!;
    const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts - 1), maxDelay);
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    const finalDelay = Math.round(delay + jitter);

    this.updateState('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      if (this.config) {
        this.connect(this.config).subscribe({
          error: () => {
            // Error handled in connect
          },
        });
      }
    }, finalDelay);
  }

  private startHeartbeat(): void {
    if (!this.config?.heartbeatIntervalMs || this.config.heartbeatIntervalMs <= 0) {
      return;
    }

    const heartbeat$ = interval(this.config.heartbeatIntervalMs).pipe(
      takeUntil(this.destroy$),
      filter(() => this.isConnected())
    );

    this.heartbeatSubscription = heartbeat$.subscribe(() => {
      this.ping().subscribe();
    });
  }

  private stopHeartbeat(): void {
    if (this.heartbeatSubscription) {
      this.heartbeatSubscription.unsubscribe();
      this.heartbeatSubscription = undefined;
    }
  }

  private flushSendBuffer(): void {
    while (this.sendBuffer.length > 0 && this.isConnected()) {
      const data = this.sendBuffer.shift();
      if (data !== undefined) {
        this.send(data).subscribe();
      }
    }
  }

  private normalizeUrl(url: string): string {
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      return url;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    if (url.startsWith('//')) {
      return `${protocol}${url}`;
    }

    if (url.startsWith('/')) {
      return `${protocol}//${window.location.host}${url}`;
    }

    return url.replace(/^http/, 'ws');
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
      latencyMs: this.latencyMs,
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
    this.clearConnectionTimeout();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }
}
