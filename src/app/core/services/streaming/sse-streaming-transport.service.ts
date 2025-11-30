/**
 * Server-Sent Events (SSE) Streaming Transport
 * 
 * Implements streaming transport using EventSource API for server-to-client streaming.
 * Supports automatic reconnection, last-event-id for resumption, and custom event types.
 * 
 * @since 2.0.0
 */

import { Injectable, inject, NgZone } from '@angular/core';
import { Observable, Subject, BehaviorSubject, of, throwError, timer, EMPTY } from 'rxjs';
import { takeUntil, retry, tap, catchError, switchMap, take } from 'rxjs/operators';
import {
  StreamingTransport,
  StreamingProtocol,
  StreamingChunk,
  StreamingConnectionState,
  StreamingConnectionStatus,
  StreamingTransportConfig,
  StreamingTransportError
} from './streaming-transport.interface';

/**
 * Default SSE configuration
 */
const SSE_DEFAULTS = {
  autoReconnect: true,
  maxReconnectAttempts: 10,
  reconnectBaseDelayMs: 1000,
  reconnectMaxDelayMs: 30000,
  connectionTimeoutMs: 30000,
  heartbeatIntervalMs: 0 // SSE has built-in keep-alive
};

/**
 * SSE Streaming Transport Service
 * 
 * Uses native EventSource API for server-sent events streaming.
 * Automatically handles reconnection with exponential backoff.
 * 
 * @example
 * ```typescript
 * const transport = inject(SseStreamingTransport);
 * 
 * transport.connect({
 *   url: '/api/stream/cards',
 *   lastEventId: 'checkpoint-123'
 * }).subscribe();
 * 
 * transport.chunks$.subscribe(chunk => {
 *   console.log('Received:', chunk.data);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SseStreamingTransport extends StreamingTransport {
  private readonly ngZone = inject(NgZone);
  
  readonly protocol: StreamingProtocol = 'sse';
  
  private eventSource: EventSource | null = null;
  private config: StreamingTransportConfig | null = null;
  private sequenceCounter = 0;
  private reconnectAttempts = 0;
  private bytesReceived = 0;
  private chunksReceived = 0;
  private lastConnectedAt?: number;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  
  private readonly destroy$ = new Subject<void>();
  private readonly chunkSubject = new Subject<StreamingChunk>();
  private readonly stateSubject = new BehaviorSubject<StreamingConnectionState>('disconnected');
  private readonly statusSubject = new BehaviorSubject<StreamingConnectionStatus>(this.createInitialStatus());
  private readonly errorSubject = new Subject<StreamingTransportError>();
  
  readonly chunks$ = this.chunkSubject.asObservable();
  readonly state$ = this.stateSubject.asObservable();
  readonly status$ = this.statusSubject.asObservable();
  readonly errors$ = this.errorSubject.asObservable();
  
  /**
   * Connect to SSE endpoint
   */
  connect(config: StreamingTransportConfig): Observable<void> {
    return new Observable<void>(observer => {
      if (this.eventSource) {
        this.disconnect('New connection requested');
      }
      
      this.config = { ...SSE_DEFAULTS, ...config };
      this.sequenceCounter = 0;
      this.bytesReceived = 0;
      this.chunksReceived = 0;
      
      this.updateState('connecting');
      
      // Set connection timeout
      if (this.config.connectionTimeoutMs && this.config.connectionTimeoutMs > 0) {
        this.connectionTimeout = setTimeout(() => {
          if (this.stateSubject.value === 'connecting') {
            const error: StreamingTransportError = {
              code: 'CONNECTION_TIMEOUT',
              message: `Connection timed out after ${this.config!.connectionTimeoutMs}ms`,
              recoverable: true,
              timestamp: Date.now()
            };
            this.errorSubject.next(error);
            observer.error(error);
            this.handleReconnect();
          }
        }, this.config.connectionTimeoutMs);
      }
      
      try {
        // Build URL with last-event-id if provided
        let url = this.config.url;
        if (this.config.lastEventId) {
          const separator = url.includes('?') ? '&' : '?';
          url += `${separator}lastEventId=${encodeURIComponent(this.config.lastEventId)}`;
        }
        
        // Create EventSource
        // Note: EventSource doesn't support custom headers natively
        // For auth, use query params or cookie-based auth
        this.ngZone.runOutsideAngular(() => {
          this.eventSource = new EventSource(url, {
            withCredentials: true // Enable cookies for auth
          });
          
          // Handle connection open
          this.eventSource.onopen = () => {
            this.ngZone.run(() => {
              this.clearConnectionTimeout();
              this.reconnectAttempts = 0;
              this.lastConnectedAt = Date.now();
              this.updateState('connected');
              this.updateStatus();
              observer.next();
              observer.complete();
            });
          };
          
          // Handle messages
          this.eventSource.onmessage = (event: MessageEvent) => {
            this.ngZone.run(() => {
              this.handleMessage(event);
            });
          };
          
          // Handle errors
          this.eventSource.onerror = (event: Event) => {
            this.ngZone.run(() => {
              this.handleError(event, observer);
            });
          };
          
          // Register custom event types
          this.registerCustomEvents();
        });
      } catch (err) {
        const error: StreamingTransportError = {
          code: 'CONNECTION_FAILED',
          message: err instanceof Error ? err.message : 'Failed to create EventSource',
          recoverable: true,
          originalError: err instanceof Error ? err : undefined,
          timestamp: Date.now()
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
   * Disconnect from SSE endpoint
   */
  disconnect(reason?: string): void {
    this.clearTimers();
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.updateState('disconnected');
    this.updateStatus();
  }
  
  /**
   * SSE is unidirectional - send is not supported
   */
  send(data: string | ArrayBuffer): Observable<void> {
    return throwError(() => ({
      code: 'NOT_SUPPORTED',
      message: 'SSE transport does not support sending data. Use WebSocket for bidirectional communication.',
      recoverable: false,
      timestamp: Date.now()
    }));
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
    return this.stateSubject.value === 'connected' && 
           this.eventSource?.readyState === EventSource.OPEN;
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
      timestamp: Date.now()
    }));
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
  
  private handleMessage(event: MessageEvent): void {
    const byteSize = new Blob([event.data]).size;
    this.bytesReceived += byteSize;
    this.chunksReceived++;
    this.sequenceCounter++;
    
    const chunk: StreamingChunk = {
      data: event.data,
      sequence: this.sequenceCounter,
      eventType: event.type,
      eventId: event.lastEventId || undefined,
      timestamp: Date.now(),
      byteSize
    };
    
    // Store last event ID for resumption
    if (event.lastEventId && this.config) {
      this.config.lastEventId = event.lastEventId;
    }
    
    this.updateStatus();
    this.chunkSubject.next(chunk);
  }
  
  private handleError(event: Event, observer?: { error: (err: unknown) => void }): void {
    const isConnecting = this.stateSubject.value === 'connecting';
    
    const error: StreamingTransportError = {
      code: isConnecting ? 'CONNECTION_FAILED' : 'CONNECTION_LOST',
      message: isConnecting ? 'Failed to connect to SSE endpoint' : 'SSE connection lost',
      recoverable: true,
      timestamp: Date.now()
    };
    
    this.errorSubject.next(error);
    
    if (isConnecting && observer) {
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
    
    if (this.config.maxReconnectAttempts && 
        this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      const error: StreamingTransportError = {
        code: 'MAX_RECONNECT_EXCEEDED',
        message: `Max reconnection attempts (${this.config.maxReconnectAttempts}) exceeded`,
        recoverable: false,
        timestamp: Date.now()
      };
      this.errorSubject.next(error);
      this.updateState('disconnected');
      return;
    }
    
    this.reconnectAttempts++;
    
    // Calculate delay with exponential backoff
    const baseDelay = this.config.reconnectBaseDelayMs || SSE_DEFAULTS.reconnectBaseDelayMs;
    const maxDelay = this.config.reconnectMaxDelayMs || SSE_DEFAULTS.reconnectMaxDelayMs;
    const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts - 1), maxDelay);
    
    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    const finalDelay = Math.round(delay + jitter);
    
    this.updateState('reconnecting');
    
    this.reconnectTimer = setTimeout(() => {
      if (this.config) {
        this.connect(this.config).pipe(take(1)).subscribe({
          error: () => {
            // Error already handled in connect
          }
        });
      }
    }, finalDelay);
  }
  
  private registerCustomEvents(): void {
    if (!this.eventSource) return;
    
    // Register handlers for custom event types
    const customEvents = ['card', 'section', 'field', 'complete', 'error', 'heartbeat'];
    
    customEvents.forEach(eventType => {
      this.eventSource!.addEventListener(eventType, (event: MessageEvent) => {
        this.ngZone.run(() => {
          // Create a modified event with the custom type
          const customEvent = new MessageEvent(eventType, {
            data: event.data,
            lastEventId: event.lastEventId
          });
          this.handleMessage(customEvent);
        });
      });
    });
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
      chunksReceived: this.chunksReceived
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
      chunksReceived: 0
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
  
  /**
   * Pause streaming (SSE doesn't support true pause, this is a no-op)
   */
  pause(): void {
    // SSE doesn't support pausing - messages will continue to arrive
    // This is here to satisfy the abstract interface
  }
  
  /**
   * Resume streaming (SSE doesn't support true pause, this is a no-op)
   */
  resume(): void {
    // SSE doesn't support resuming - this is here to satisfy the abstract interface
  }
}

