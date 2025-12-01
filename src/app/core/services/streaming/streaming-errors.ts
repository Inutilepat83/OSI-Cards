/**
 * Streaming Error Types
 *
 * Typed error classes for streaming operations with specific handling strategies.
 * Each error type has a code, recoverable flag, and suggested recovery action.
 *
 * @since 2.0.0
 */

/**
 * Base streaming error class
 */
export abstract class StreamingError extends Error {
  abstract readonly code: string;
  abstract readonly recoverable: boolean;
  readonly timestamp: number;
  readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = Date.now();
    this.originalError = originalError;

    // Maintain proper stack trace for V8
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get suggested recovery action
   */
  abstract getSuggestedAction(): StreamingRecoveryAction;

  /**
   * Convert to JSON for logging/transmission
   */
  toJSON(): StreamingErrorJSON {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      suggestedAction: this.getSuggestedAction(),
      stack: this.stack,
    };
  }
}

/**
 * Recovery actions for streaming errors
 */
export type StreamingRecoveryAction =
  | 'retry'
  | 'reconnect'
  | 'retry-with-backoff'
  | 'fallback-protocol'
  | 'show-partial'
  | 'cancel'
  | 'none';

/**
 * JSON representation of streaming error
 */
export interface StreamingErrorJSON {
  name: string;
  code: string;
  message: string;
  recoverable: boolean;
  timestamp: number;
  suggestedAction: StreamingRecoveryAction;
  stack?: string;
}

// ============================================
// Connection Errors
// ============================================

/**
 * Error when connection to streaming endpoint fails
 */
export class StreamConnectionError extends StreamingError {
  readonly code = 'STREAM_CONNECTION_ERROR';
  readonly recoverable = true;
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number, originalError?: Error) {
    super(message, originalError);
    this.statusCode = statusCode;
  }

  getSuggestedAction(): StreamingRecoveryAction {
    // 4xx errors are usually not recoverable
    if (this.statusCode && this.statusCode >= 400 && this.statusCode < 500) {
      return 'cancel';
    }
    return 'retry-with-backoff';
  }
}

/**
 * Error when connection times out
 */
export class StreamTimeoutError extends StreamingError {
  readonly code = 'STREAM_TIMEOUT_ERROR';
  readonly recoverable = true;
  readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number, originalError?: Error) {
    super(message, originalError);
    this.timeoutMs = timeoutMs;
  }

  getSuggestedAction(): StreamingRecoveryAction {
    return 'retry-with-backoff';
  }
}

/**
 * Error when connection is lost during streaming
 */
export class StreamDisconnectedError extends StreamingError {
  readonly code = 'STREAM_DISCONNECTED_ERROR';
  readonly recoverable = true;
  readonly wasClean: boolean;

  constructor(message: string, wasClean: boolean, originalError?: Error) {
    super(message, originalError);
    this.wasClean = wasClean;
  }

  getSuggestedAction(): StreamingRecoveryAction {
    return this.wasClean ? 'reconnect' : 'retry-with-backoff';
  }
}

// ============================================
// Protocol Errors
// ============================================

/**
 * Error when protocol is not supported
 */
export class StreamProtocolError extends StreamingError {
  readonly code = 'STREAM_PROTOCOL_ERROR';
  readonly recoverable = true;
  readonly protocol: string;

  constructor(message: string, protocol: string, originalError?: Error) {
    super(message, originalError);
    this.protocol = protocol;
  }

  getSuggestedAction(): StreamingRecoveryAction {
    return 'fallback-protocol';
  }
}

/**
 * Error when SSE-specific issue occurs
 */
export class SseStreamError extends StreamingError {
  readonly code = 'SSE_STREAM_ERROR';
  readonly recoverable = true;

  getSuggestedAction(): StreamingRecoveryAction {
    return 'retry-with-backoff';
  }
}

/**
 * Error when WebSocket-specific issue occurs
 */
export class WebSocketStreamError extends StreamingError {
  readonly code = 'WEBSOCKET_STREAM_ERROR';
  readonly recoverable = true;
  readonly closeCode?: number;

  constructor(message: string, closeCode?: number, originalError?: Error) {
    super(message, originalError);
    this.closeCode = closeCode;
  }

  getSuggestedAction(): StreamingRecoveryAction {
    // 1000 = normal closure, 1001 = going away
    if (this.closeCode && (this.closeCode === 1000 || this.closeCode === 1001)) {
      return 'reconnect';
    }
    return 'retry-with-backoff';
  }
}

// ============================================
// Parse Errors
// ============================================

/**
 * Error when parsing streamed data fails
 */
export class StreamParseError extends StreamingError {
  readonly code = 'STREAM_PARSE_ERROR';
  readonly recoverable = true;
  readonly partialData?: string;
  readonly position?: number;

  constructor(message: string, partialData?: string, position?: number, originalError?: Error) {
    super(message, originalError);
    this.partialData = partialData;
    this.position = position;
  }

  getSuggestedAction(): StreamingRecoveryAction {
    return 'show-partial';
  }
}

/**
 * Error when JSON structure is invalid
 */
export class StreamJsonError extends StreamingError {
  readonly code = 'STREAM_JSON_ERROR';
  readonly recoverable = true;
  readonly jsonFragment?: string;

  constructor(message: string, jsonFragment?: string, originalError?: Error) {
    super(message, originalError);
    this.jsonFragment = jsonFragment;
  }

  getSuggestedAction(): StreamingRecoveryAction {
    return 'show-partial';
  }
}

// ============================================
// State Errors
// ============================================

/**
 * Error when stream is aborted by user or system
 */
export class StreamAbortedError extends StreamingError {
  readonly code = 'STREAM_ABORTED_ERROR';
  readonly recoverable = false;
  readonly reason: 'user' | 'system' | 'timeout';

  constructor(message: string, reason: 'user' | 'system' | 'timeout', originalError?: Error) {
    super(message, originalError);
    this.reason = reason;
  }

  getSuggestedAction(): StreamingRecoveryAction {
    return this.reason === 'timeout' ? 'retry-with-backoff' : 'show-partial';
  }
}

/**
 * Error when stream state is invalid
 */
export class StreamStateError extends StreamingError {
  readonly code = 'STREAM_STATE_ERROR';
  readonly recoverable = false;
  readonly currentState: string;
  readonly expectedState?: string;

  constructor(
    message: string,
    currentState: string,
    expectedState?: string,
    originalError?: Error
  ) {
    super(message, originalError);
    this.currentState = currentState;
    this.expectedState = expectedState;
  }

  getSuggestedAction(): StreamingRecoveryAction {
    return 'cancel';
  }
}

// ============================================
// Resource Errors
// ============================================

/**
 * Error when max reconnection attempts exceeded
 */
export class StreamMaxRetriesError extends StreamingError {
  readonly code = 'STREAM_MAX_RETRIES_ERROR';
  readonly recoverable = false;
  readonly attempts: number;
  readonly maxAttempts: number;

  constructor(message: string, attempts: number, maxAttempts: number, originalError?: Error) {
    super(message, originalError);
    this.attempts = attempts;
    this.maxAttempts = maxAttempts;
  }

  getSuggestedAction(): StreamingRecoveryAction {
    return 'cancel';
  }
}

/**
 * Error when buffer overflow occurs
 */
export class StreamBufferOverflowError extends StreamingError {
  readonly code = 'STREAM_BUFFER_OVERFLOW_ERROR';
  readonly recoverable = true;
  readonly bufferSize: number;
  readonly maxSize: number;

  constructor(message: string, bufferSize: number, maxSize: number, originalError?: Error) {
    super(message, originalError);
    this.bufferSize = bufferSize;
    this.maxSize = maxSize;
  }

  getSuggestedAction(): StreamingRecoveryAction {
    return 'show-partial';
  }
}

/**
 * Error when network is unavailable
 */
export class StreamNetworkError extends StreamingError {
  readonly code = 'STREAM_NETWORK_ERROR';
  readonly recoverable = true;
  readonly isOnline: boolean;

  constructor(message: string, isOnline: boolean, originalError?: Error) {
    super(message, originalError);
    this.isOnline = isOnline;
  }

  getSuggestedAction(): StreamingRecoveryAction {
    return this.isOnline ? 'retry-with-backoff' : 'none';
  }
}

// ============================================
// Error Factory
// ============================================

/**
 * Factory for creating streaming errors from various sources
 */
export class StreamingErrorFactory {
  /**
   * Create error from HTTP response
   */
  static fromHttpResponse(response: Response): StreamConnectionError {
    return new StreamConnectionError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status
    );
  }

  /**
   * Create error from fetch error
   */
  static fromFetchError(error: Error): StreamingError {
    if (error.name === 'AbortError') {
      return new StreamAbortedError('Request was aborted', 'user', error);
    }
    if (error.name === 'TypeError' && error.message.includes('network')) {
      return new StreamNetworkError(error.message, navigator.onLine, error);
    }
    return new StreamConnectionError(error.message, undefined, error);
  }

  /**
   * Create error from WebSocket close event
   */
  static fromWebSocketClose(event: CloseEvent): StreamingError {
    if (event.wasClean) {
      return new StreamDisconnectedError(`WebSocket closed: ${event.reason || 'No reason'}`, true);
    }
    return new WebSocketStreamError(
      `WebSocket closed unexpectedly: ${event.reason || 'Unknown reason'}`,
      event.code
    );
  }

  /**
   * Create error from EventSource error
   */
  static fromEventSourceError(event: Event): SseStreamError {
    return new SseStreamError('SSE connection error');
  }

  /**
   * Create error from JSON parse error
   */
  static fromJsonParseError(error: Error, json?: string): StreamJsonError {
    return new StreamJsonError(
      `JSON parse error: ${error.message}`,
      json?.substring(0, 500),
      error
    );
  }

  /**
   * Create timeout error
   */
  static timeout(timeoutMs: number, operation: string): StreamTimeoutError {
    return new StreamTimeoutError(`${operation} timed out after ${timeoutMs}ms`, timeoutMs);
  }

  /**
   * Create max retries error
   */
  static maxRetries(attempts: number, maxAttempts: number): StreamMaxRetriesError {
    return new StreamMaxRetriesError(
      `Max reconnection attempts (${maxAttempts}) exceeded after ${attempts} attempts`,
      attempts,
      maxAttempts
    );
  }
}

// ============================================
// Error Handler
// ============================================

/**
 * Handle streaming errors with appropriate recovery strategies
 */
export interface StreamingErrorHandler {
  /**
   * Handle an error and return whether it was handled
   */
  handle(error: StreamingError): boolean;

  /**
   * Get the number of errors handled
   */
  getErrorCount(): number;

  /**
   * Clear error history
   */
  clear(): void;
}

/**
 * Default streaming error handler implementation
 */
export class DefaultStreamingErrorHandler implements StreamingErrorHandler {
  private errorCount = 0;
  private readonly errorLog: StreamingErrorJSON[] = [];
  private readonly maxLogSize: number;

  constructor(maxLogSize = 100) {
    this.maxLogSize = maxLogSize;
  }

  handle(error: StreamingError): boolean {
    this.errorCount++;

    // Add to log
    if (this.errorLog.length >= this.maxLogSize) {
      this.errorLog.shift();
    }
    this.errorLog.push(error.toJSON());

    // Log to console in development
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      console.error('[StreamingError]', error.toJSON());
    }

    return true;
  }

  getErrorCount(): number {
    return this.errorCount;
  }

  getErrorLog(): StreamingErrorJSON[] {
    return [...this.errorLog];
  }

  clear(): void {
    this.errorCount = 0;
    this.errorLog.length = 0;
  }
}

// Declare ngDevMode for TypeScript
declare const ngDevMode: boolean | undefined;
