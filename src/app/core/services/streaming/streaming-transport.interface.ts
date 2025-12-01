/**
 * Streaming Transport Interfaces
 * 
 * Unified interface for streaming data from various transport protocols.
 * Supports SSE, WebSocket, Fetch streaming, and custom transports.
 * 
 * @since 2.0.0
 */

import { Observable, Subject } from 'rxjs';

/**
 * Connection state for streaming transports
 */
export type StreamingConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'closed';

/**
 * Streaming transport protocol types
 */
export type StreamingProtocol = 'sse' | 'websocket' | 'fetch' | 'grpc-web' | 'long-polling';

/**
 * Streaming chunk received from transport
 */
export interface StreamingChunk {
  /** Raw data received */
  data: string;
  /** Chunk sequence number */
  sequence?: number;
  /** Event type (for SSE) */
  eventType?: string;
  /** Event ID (for SSE resumption) */
  eventId?: string;
  /** Timestamp when chunk was received */
  timestamp: number;
  /** Size of chunk in bytes */
  byteSize: number;
}

/**
 * Connection status information
 */
export interface StreamingConnectionStatus {
  /** Current connection state */
  state: StreamingConnectionState;
  /** Protocol being used */
  protocol: StreamingProtocol;
  /** URL of the streaming endpoint */
  url: string;
  /** Time of last successful connection */
  lastConnectedAt?: number;
  /** Number of reconnection attempts */
  reconnectAttempts: number;
  /** Latency in milliseconds */
  latencyMs?: number;
  /** Total bytes received in current session */
  bytesReceived: number;
  /** Total chunks received in current session */
  chunksReceived: number;
}

/**
 * Configuration for streaming transport
 */
export interface StreamingTransportConfig {
  /** Connection URL */
  url: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Enable automatic reconnection */
  autoReconnect?: boolean;
  /** Maximum reconnection attempts (0 = infinite) */
  maxReconnectAttempts?: number;
  /** Base delay for reconnection in ms */
  reconnectBaseDelayMs?: number;
  /** Maximum delay for reconnection in ms */
  reconnectMaxDelayMs?: number;
  /** Connection timeout in ms */
  connectionTimeoutMs?: number;
  /** Heartbeat interval in ms (0 = disabled) */
  heartbeatIntervalMs?: number;
  /** Last event ID for SSE resumption */
  lastEventId?: string;
  /** Enable compression */
  enableCompression?: boolean;
  /** Custom request options */
  requestInit?: RequestInit;
}

/**
 * Streaming transport events
 */
export interface StreamingTransportEvents {
  /** Emitted when connection state changes */
  stateChange: StreamingConnectionState;
  /** Emitted when a chunk is received */
  chunk: StreamingChunk;
  /** Emitted on error */
  error: StreamingTransportError;
  /** Emitted when connection is established */
  connected: void;
  /** Emitted when connection is closed */
  disconnected: { reason: string; wasClean: boolean };
  /** Emitted when reconnection starts */
  reconnecting: { attempt: number; delayMs: number };
  /** Emitted on heartbeat (keep-alive) */
  heartbeat: { timestamp: number };
}

/**
 * Streaming transport error
 */
export interface StreamingTransportError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Whether the error is recoverable */
  recoverable: boolean;
  /** Original error if available */
  originalError?: Error;
  /** Timestamp of error */
  timestamp: number;
}

/**
 * Abstract streaming transport interface
 * 
 * Implementations: SseStreamingTransport, WebSocketStreamingTransport, FetchStreamingTransport
 */
export abstract class StreamingTransport {
  /** Transport protocol type */
  abstract readonly protocol: StreamingProtocol;
  
  /** Observable of streaming chunks */
  abstract readonly chunks$: Observable<StreamingChunk>;
  
  /** Observable of connection state changes */
  abstract readonly state$: Observable<StreamingConnectionState>;
  
  /** Observable of connection status */
  abstract readonly status$: Observable<StreamingConnectionStatus>;
  
  /** Observable of errors */
  abstract readonly errors$: Observable<StreamingTransportError>;
  
  /**
   * Connect to the streaming endpoint
   * @param config Transport configuration
   * @returns Observable that completes when connected, errors on failure
   */
  abstract connect(config: StreamingTransportConfig): Observable<void>;
  
  /**
   * Disconnect from the streaming endpoint
   * @param reason Optional reason for disconnection
   */
  abstract disconnect(reason?: string): void;
  
  /**
   * Send data to the server (for bidirectional transports)
   * @param data Data to send
   * @returns Observable that completes when sent
   */
  abstract send?(data: string | ArrayBuffer): Observable<void>;
  
  /**
   * Get current connection status
   */
  abstract getStatus(): StreamingConnectionStatus;
  
  /**
   * Check if transport is currently connected
   */
  abstract isConnected(): boolean;
  
  /**
   * Force reconnection
   */
  abstract reconnect(): Observable<void>;
  
  /**
   * Pause streaming (buffer incoming data)
   */
  abstract pause?(): void;
  
  /**
   * Resume streaming
   */
  abstract resume?(): void;
  
  /**
   * Clean up resources
   */
  abstract destroy(): void;
}

/**
 * Factory for creating streaming transports
 */
export interface StreamingTransportFactory {
  /**
   * Create a transport for the specified protocol
   * @param protocol Protocol to use
   * @returns StreamingTransport instance
   */
  create(protocol: StreamingProtocol): StreamingTransport;
  
  /**
   * Get the best available protocol for the current environment
   * @returns Recommended protocol
   */
  detectBestProtocol(): StreamingProtocol;
  
  /**
   * Check if a protocol is supported
   * @param protocol Protocol to check
   * @returns True if supported
   */
  isSupported(protocol: StreamingProtocol): boolean;
}

/**
 * Streaming session that wraps transport with card-specific functionality
 */
export interface StreamingSession {
  /** Unique session ID */
  id: string;
  /** Session start time */
  startedAt: number;
  /** Transport being used */
  transport: StreamingTransport;
  /** Last checkpoint for resumption */
  lastCheckpoint?: StreamingCheckpoint;
  /** Session metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Checkpoint for stream resumption
 */
export interface StreamingCheckpoint {
  /** Last successfully processed event ID */
  lastEventId: string;
  /** Position in stream (bytes or chunks) */
  position: number;
  /** Partial data buffer */
  partialBuffer?: string;
  /** Timestamp of checkpoint */
  timestamp: number;
  /** Card state at checkpoint */
  cardState?: unknown;
}




