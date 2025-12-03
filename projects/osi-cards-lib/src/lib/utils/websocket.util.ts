/**
 * WebSocket Utilities
 *
 * Provides a robust WebSocket wrapper with reconnection logic,
 * message queuing, and observable streams.
 *
 * Features:
 * - Automatic reconnection
 * - Message queuing
 * - Observable streams
 * - Heartbeat/ping-pong
 * - Connection state management
 * - Error handling
 *
 * @example
 * ```typescript
 * import { WebSocketManager } from '@osi-cards/utils';
 *
 * const ws = new WebSocketManager('wss://api.example.com/ws', {
 *   reconnect: true,
 *   reconnectInterval: 5000
 * });
 *
 * ws.messages$.subscribe(message => {
 *   console.log('Received:', message);
 * });
 *
 * ws.send({ type: 'subscribe', channel: 'updates' });
 * ```
 */

import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

/**
 * WebSocket connection state
 */
export type WebSocketState = 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error';

/**
 * WebSocket options
 */
export interface WebSocketOptions {
  /**
   * Protocols to use
   */
  protocols?: string | string[];

  /**
   * Whether to reconnect automatically
   * Default: true
   */
  reconnect?: boolean;

  /**
   * Reconnection interval in milliseconds
   * Default: 5000
   */
  reconnectInterval?: number;

  /**
   * Maximum reconnection attempts (0 = infinite)
   * Default: 0
   */
  maxReconnectAttempts?: number;

  /**
   * Whether to queue messages when disconnected
   * Default: true
   */
  queueMessages?: boolean;

  /**
   * Heartbeat interval in milliseconds (0 = disabled)
   * Default: 30000
   */
  heartbeatInterval?: number;

  /**
   * Heartbeat message
   * Default: 'ping'
   */
  heartbeatMessage?: any;
}

/**
 * WebSocket message wrapper
 */
export interface WebSocketMessage<T = any> {
  data: T;
  timestamp: number;
}

/**
 * WebSocket Manager
 *
 * Manages WebSocket connections with automatic reconnection and message queuing.
 */
export class WebSocketManager<TSend = any, TReceive = any> {
  private socket: WebSocket | null = null;
  private messageQueue: TSend[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  private stateSubject = new BehaviorSubject<WebSocketState>('disconnected');
  private messageSubject = new Subject<WebSocketMessage<TReceive>>();
  private errorSubject = new Subject<Event>();

  /**
   * Observable of connection state
   */
  readonly state$ = this.stateSubject.asObservable();

  /**
   * Observable of incoming messages
   */
  readonly messages$ = this.messageSubject.asObservable();

  /**
   * Observable of errors
   */
  readonly errors$ = this.errorSubject.asObservable();

  /**
   * Current connection state
   */
  get state(): WebSocketState {
    return this.stateSubject.value;
  }

  /**
   * Whether connected
   */
  get isConnected(): boolean {
    return this.state === 'connected';
  }

  constructor(
    private url: string,
    private options: WebSocketOptions = {}
  ) {
    this.options = {
      reconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 0,
      queueMessages: true,
      heartbeatInterval: 30000,
      heartbeatMessage: 'ping',
      ...options,
    };
  }

  /**
   * Connect to WebSocket
   */
  connect(): void {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      return;
    }

    this.stateSubject.next('connecting');

    try {
      this.socket = new WebSocket(this.url, this.options.protocols);
      this.setupEventHandlers();
    } catch (error) {
      this.handleError(error as Event);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.socket) {
      this.stateSubject.next('disconnecting');
      this.socket.close();
      this.socket = null;
    }

    this.stateSubject.next('disconnected');
  }

  /**
   * Send message
   *
   * @param message - Message to send
   *
   * @example
   * ```typescript
   * ws.send({ type: 'chat', text: 'Hello!' });
   * ```
   */
  send(message: TSend): void {
    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send message:', error);

        if (this.options.queueMessages) {
          this.messageQueue.push(message);
        }
      }
    } else if (this.options.queueMessages) {
      this.messageQueue.push(message);
    }
  }

  /**
   * Send multiple messages
   *
   * @param messages - Messages to send
   */
  sendBatch(messages: TSend[]): void {
    messages.forEach(msg => this.send(msg));
  }

  /**
   * Get observable for specific message type
   *
   * @param type - Message type to filter
   * @returns Observable of filtered messages
   *
   * @example
   * ```typescript
   * const updates$ = ws.on('update');
   * updates$.subscribe(msg => console.log(msg));
   * ```
   */
  on(type: string): Observable<TReceive> {
    return this.messages$.pipe(
      map(msg => msg.data),
      filter((data: any) => data.type === type)
    );
  }

  /**
   * Wait for specific message
   *
   * @param type - Message type
   * @param timeout - Optional timeout in milliseconds
   * @returns Promise with message
   */
  async waitFor(type: string, timeout?: number): Promise<TReceive> {
    return new Promise((resolve, reject) => {
      const timeoutId = timeout
        ? setTimeout(() => reject(new Error('Timeout waiting for message')), timeout)
        : null;

      const sub = this.on(type).subscribe(message => {
        if (timeoutId) clearTimeout(timeoutId);
        sub.unsubscribe();
        resolve(message);
      });
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.stateSubject.next('connected');
      this.reconnectAttempts = 0;
      this.flushMessageQueue();
      this.startHeartbeat();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageSubject.next({
          data,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    this.socket.onerror = (error) => {
      this.handleError(error);
    };

    this.socket.onclose = () => {
      this.stateSubject.next('disconnected');
      this.stopHeartbeat();
      this.attemptReconnect();
    };
  }

  /**
   * Handle WebSocket error
   */
  private handleError(error: Event): void {
    this.stateSubject.next('error');
    this.errorSubject.next(error);
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (!this.options.reconnect) {
      return;
    }

    if (
      this.options.maxReconnectAttempts &&
      this.reconnectAttempts >= this.options.maxReconnectAttempts
    ) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnecting (attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, this.options.reconnectInterval);
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    if (!this.options.heartbeatInterval || this.options.heartbeatInterval <= 0) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send(this.options.heartbeatMessage as TSend);
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

/**
 * Create WebSocket connection
 *
 * @param url - WebSocket URL
 * @param options - Connection options
 * @returns WebSocketManager instance
 */
export function createWebSocket<TSend = any, TReceive = any>(
  url: string,
  options?: WebSocketOptions
): WebSocketManager<TSend, TReceive> {
  const manager = new WebSocketManager<TSend, TReceive>(url, options);
  manager.connect();
  return manager;
}

