/**
 * Server-Sent Events (SSE) Streaming Service (Improvement Plan Point #35)
 * 
 * Provides native SSE streaming support for real-time card generation
 * from LLM APIs. Supports automatic reconnection and event source pooling.
 * 
 * @example
 * ```typescript
 * import { SSEStreamingService } from 'osi-cards-lib';
 * 
 * const sseService = inject(SSEStreamingService);
 * 
 * // Connect to SSE endpoint
 * const subscription = sseService.connect('https://api.example.com/stream')
 *   .subscribe({
 *     next: (card) => console.log('Card update:', card),
 *     error: (err) => console.error('Stream error:', err),
 *     complete: () => console.log('Stream complete')
 *   });
 * 
 * // Disconnect
 * subscription.unsubscribe();
 * ```
 */

import { 
  Injectable, 
  InjectionToken, 
  inject, 
  DestroyRef, 
  PLATFORM_ID,
  NgZone
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject, BehaviorSubject, timer, throwError } from 'rxjs';
import { takeUntil, retry, tap, finalize, catchError } from 'rxjs/operators';
import { AICardConfig, CardTypeGuards } from '../models';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * SSE streaming configuration
 */
export interface SSEConfig {
  /** Enable automatic reconnection on disconnect */
  autoReconnect: boolean;
  /** Reconnection delay in ms */
  reconnectDelay: number;
  /** Maximum reconnection attempts (0 = unlimited) */
  maxReconnectAttempts: number;
  /** Heartbeat interval for connection health (ms) */
  heartbeatInterval: number;
  /** Connection timeout (ms) */
  connectionTimeout: number;
  /** Parse events as JSON */
  parseJson: boolean;
  /** Event type to listen for (default: 'message') */
  eventType: string;
  /** Custom headers for the request */
  headers?: Record<string, string>;
  /** Include credentials */
  withCredentials: boolean;
  /** Debug logging */
  debug: boolean;
}

/**
 * Default SSE configuration
 */
export const DEFAULT_SSE_CONFIG: SSEConfig = {
  autoReconnect: true,
  reconnectDelay: 3000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
  connectionTimeout: 60000,
  parseJson: true,
  eventType: 'message',
  withCredentials: false,
  debug: false
};

/**
 * Injection token for SSE configuration
 */
export const OSI_SSE_CONFIG = new InjectionToken<SSEConfig>(
  'OSI_SSE_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULT_SSE_CONFIG
  }
);

// ============================================================================
// TYPES
// ============================================================================

/**
 * SSE connection state
 */
export type SSEConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/**
 * SSE event types
 */
export interface SSEEvent<T = unknown> {
  type: string;
  data: T;
  id?: string;
  retry?: number;
  timestamp: number;
}

/**
 * SSE connection info
 */
export interface SSEConnectionInfo {
  url: string;
  state: SSEConnectionState;
  reconnectAttempts: number;
  lastEventTime: number | null;
  lastEventId: string | null;
  error: Error | null;
}

/**
 * Card streaming event
 */
export interface CardStreamEvent {
  type: 'chunk' | 'card' | 'error' | 'complete';
  data?: string | AICardConfig;
  error?: Error;
  timestamp: number;
}

// ============================================================================
// SSE CONNECTION
// ============================================================================

/**
 * Managed SSE connection
 */
export class SSEConnection {
  private eventSource: EventSource | null = null;
  private readonly destroyed$ = new Subject<void>();
  private readonly events$ = new Subject<SSEEvent>();
  private readonly state$ = new BehaviorSubject<SSEConnectionState>('disconnected');
  
  private reconnectAttempts = 0;
  private lastEventId: string | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastEventTime: number | null = null;
  
  constructor(
    private readonly url: string,
    private readonly config: SSEConfig,
    private readonly ngZone?: NgZone
  ) {}
  
  /**
   * Get connection state observable
   */
  get connectionState$(): Observable<SSEConnectionState> {
    return this.state$.asObservable();
  }
  
  /**
   * Get current connection state
   */
  get connectionState(): SSEConnectionState {
    return this.state$.value;
  }
  
  /**
   * Get events observable
   */
  get eventsObservable$(): Observable<SSEEvent> {
    return this.events$.asObservable();
  }
  
  /**
   * Get connection info
   */
  getConnectionInfo(): SSEConnectionInfo {
    return {
      url: this.url,
      state: this.state$.value,
      reconnectAttempts: this.reconnectAttempts,
      lastEventTime: this.lastEventTime,
      lastEventId: this.lastEventId,
      error: null
    };
  }
  
  /**
   * Connect to SSE endpoint
   */
  connect(): Observable<SSEEvent> {
    if (typeof EventSource === 'undefined') {
      return throwError(() => new Error('EventSource not supported'));
    }
    
    return new Observable<SSEEvent>(subscriber => {
      this.state$.next('connecting');
      
      if (this.config.debug) {
        console.log(`[SSE] Connecting to ${this.url}`);
      }
      
      try {
        // Build URL with last event ID if reconnecting
        let connectionUrl = this.url;
        if (this.lastEventId) {
          const separator = this.url.includes('?') ? '&' : '?';
          connectionUrl = `${this.url}${separator}lastEventId=${this.lastEventId}`;
        }
        
        this.eventSource = new EventSource(connectionUrl, {
          withCredentials: this.config.withCredentials
        });
        
        // Handle open
        this.eventSource.onopen = () => {
          this.runInZone(() => {
            this.state$.next('connected');
            this.reconnectAttempts = 0;
            this.startHeartbeat();
            
            if (this.config.debug) {
              console.log('[SSE] Connected');
            }
          });
        };
        
        // Handle messages
        const messageHandler = (event: MessageEvent) => {
          this.runInZone(() => {
            this.lastEventTime = Date.now();
            if (event.lastEventId) {
              this.lastEventId = event.lastEventId;
            }
            
            let data = event.data;
            if (this.config.parseJson) {
              try {
                data = JSON.parse(event.data);
              } catch {
                // Keep raw string if not valid JSON
              }
            }
            
            const sseEvent: SSEEvent = {
              type: event.type,
              data,
              id: event.lastEventId,
              timestamp: Date.now()
            };
            
            this.events$.next(sseEvent);
            subscriber.next(sseEvent);
          });
        };
        
        // Listen to configured event type
        if (this.config.eventType !== 'message') {
          this.eventSource.addEventListener(this.config.eventType, messageHandler);
        } else {
          this.eventSource.onmessage = messageHandler;
        }
        
        // Handle errors
        this.eventSource.onerror = (error) => {
          this.runInZone(() => {
            if (this.config.debug) {
              console.error('[SSE] Error:', error);
            }
            
            this.stopHeartbeat();
            
            if (this.eventSource?.readyState === EventSource.CLOSED) {
              this.state$.next('disconnected');
              
              if (this.config.autoReconnect && 
                  (this.config.maxReconnectAttempts === 0 || 
                   this.reconnectAttempts < this.config.maxReconnectAttempts)) {
                this.scheduleReconnect(subscriber);
              } else {
                subscriber.error(new Error('SSE connection closed'));
              }
            } else {
              this.state$.next('error');
            }
          });
        };
        
        // Set connection timeout
        const timeoutId = setTimeout(() => {
          if (this.state$.value === 'connecting') {
            this.disconnect();
            subscriber.error(new Error('Connection timeout'));
          }
        }, this.config.connectionTimeout);
        
        // Cleanup function
        return () => {
          clearTimeout(timeoutId);
          this.disconnect();
        };
        
      } catch (error) {
        this.state$.next('error');
        subscriber.error(error);
        return; // Return undefined for cleanup function on error path
      }
    }).pipe(
      takeUntil(this.destroyed$)
    );
  }
  
  /**
   * Disconnect from SSE endpoint
   */
  disconnect(): void {
    this.stopHeartbeat();
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.state$.next('disconnected');
    
    if (this.config.debug) {
      console.log('[SSE] Disconnected');
    }
  }
  
  /**
   * Destroy the connection
   */
  destroy(): void {
    this.disconnect();
    this.destroyed$.next();
    this.destroyed$.complete();
    this.events$.complete();
    this.state$.complete();
  }
  
  /**
   * Schedule reconnection
   */
  private scheduleReconnect(subscriber: any): void {
    this.state$.next('reconnecting');
    this.reconnectAttempts++;
    
    if (this.config.debug) {
      console.log(`[SSE] Reconnecting (attempt ${this.reconnectAttempts})...`);
    }
    
    setTimeout(() => {
      if (this.state$.value === 'reconnecting') {
        this.connect().subscribe(subscriber);
      }
    }, this.config.reconnectDelay);
  }
  
  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    if (this.config.heartbeatInterval > 0) {
      this.heartbeatTimer = setInterval(() => {
        const now = Date.now();
        if (this.lastEventTime && 
            (now - this.lastEventTime) > this.config.heartbeatInterval * 2) {
          if (this.config.debug) {
            console.warn('[SSE] Heartbeat timeout, reconnecting...');
          }
          this.disconnect();
        }
      }, this.config.heartbeatInterval);
    }
  }
  
  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  /**
   * Run callback in NgZone if available
   */
  private runInZone(fn: () => void): void {
    if (this.ngZone) {
      this.ngZone.run(fn);
    } else {
      fn();
    }
  }
}

// ============================================================================
// SSE STREAMING SERVICE
// ============================================================================

/**
 * SSE Streaming Service
 * 
 * Provides methods for streaming card data from SSE endpoints.
 */
@Injectable({
  providedIn: 'root'
})
export class SSEStreamingService {
  private readonly config = inject(OSI_SSE_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone, { optional: true });
  
  private readonly connections = new Map<string, SSEConnection>();
  private readonly cardBuffer = new Map<string, string>();
  
  /**
   * Check if SSE is supported
   */
  get isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && typeof EventSource !== 'undefined';
  }
  
  /**
   * Connect to an SSE endpoint and stream card updates
   */
  streamCards(url: string, options: Partial<SSEConfig> = {}): Observable<CardStreamEvent> {
    if (!this.isSupported) {
      return throwError(() => new Error('SSE not supported'));
    }
    
    const config = { ...this.config, ...options };
    
    return new Observable<CardStreamEvent>(subscriber => {
      const connection = new SSEConnection(url, config, this.ngZone ?? undefined);
      this.connections.set(url, connection);
      
      let buffer = '';
      
      const subscription = connection.connect().subscribe({
        next: (event) => {
          try {
            // Handle different event types
            if (typeof event.data === 'string') {
              buffer += event.data;
              
              // Try to parse as complete card
              try {
                const parsed = JSON.parse(buffer);
                if (CardTypeGuards.isAICardConfig(parsed)) {
                  subscriber.next({
                    type: 'card',
                    data: parsed,
                    timestamp: Date.now()
                  });
                  buffer = '';
                } else {
                  // Emit as chunk
                  subscriber.next({
                    type: 'chunk',
                    data: event.data,
                    timestamp: Date.now()
                  });
                }
              } catch {
                // Not complete JSON yet, emit as chunk
                subscriber.next({
                  type: 'chunk',
                  data: event.data,
                  timestamp: Date.now()
                });
              }
            } else if (CardTypeGuards.isAICardConfig(event.data)) {
              subscriber.next({
                type: 'card',
                data: event.data,
                timestamp: Date.now()
              });
            }
          } catch (error) {
            subscriber.next({
              type: 'error',
              error: error instanceof Error ? error : new Error(String(error)),
              timestamp: Date.now()
            });
          }
        },
        error: (error) => {
          subscriber.next({
            type: 'error',
            error,
            timestamp: Date.now()
          });
          subscriber.error(error);
        },
        complete: () => {
          subscriber.next({
            type: 'complete',
            timestamp: Date.now()
          });
          subscriber.complete();
        }
      });
      
      this.destroyRef.onDestroy(() => {
        subscription.unsubscribe();
        connection.destroy();
        this.connections.delete(url);
      });
      
      return () => {
        subscription.unsubscribe();
        connection.destroy();
        this.connections.delete(url);
      };
    });
  }
  
  /**
   * Get raw SSE events
   */
  connect(url: string, options: Partial<SSEConfig> = {}): Observable<SSEEvent> {
    if (!this.isSupported) {
      return throwError(() => new Error('SSE not supported'));
    }
    
    const config = { ...this.config, ...options };
    const connection = new SSEConnection(url, config, this.ngZone ?? undefined);
    this.connections.set(url, connection);
    
    return connection.connect().pipe(
      finalize(() => {
        connection.destroy();
        this.connections.delete(url);
      })
    );
  }
  
  /**
   * Disconnect from an SSE endpoint
   */
  disconnect(url: string): void {
    const connection = this.connections.get(url);
    if (connection) {
      connection.destroy();
      this.connections.delete(url);
    }
  }
  
  /**
   * Disconnect all connections
   */
  disconnectAll(): void {
    this.connections.forEach(connection => connection.destroy());
    this.connections.clear();
  }
  
  /**
   * Get connection state for a URL
   */
  getConnectionState(url: string): SSEConnectionState | null {
    return this.connections.get(url)?.connectionState ?? null;
  }
  
  /**
   * Get all active connections
   */
  getActiveConnections(): string[] {
    return Array.from(this.connections.keys());
  }
}

// All types and constants are exported inline above

