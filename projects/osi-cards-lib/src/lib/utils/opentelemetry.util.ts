/**
 * OpenTelemetry Integration (Improvement Plan Point #40)
 * 
 * Provides distributed tracing for OSI Cards operations.
 * Integrates with OpenTelemetry for observability.
 * 
 * @example
 * ```typescript
 * import { CardTracer, initializeTracing } from 'osi-cards-lib';
 * 
 * // Initialize tracing (do this once at app startup)
 * initializeTracing({
 *   serviceName: 'my-app',
 *   endpoint: 'http://localhost:4318/v1/traces'
 * });
 * 
 * // Use the tracer
 * const tracer = inject(CardTracer);
 * const span = tracer.startSpan('render-card');
 * try {
 *   // ... render card
 *   span.setStatus({ code: SpanStatusCode.OK });
 * } finally {
 *   span.end();
 * }
 * ```
 */

import { 
  Injectable, 
  InjectionToken, 
  inject, 
  PLATFORM_ID,
  isDevMode
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Span status codes (matching OpenTelemetry)
 */
export enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2
}

/**
 * Span status
 */
export interface SpanStatus {
  code: SpanStatusCode;
  message?: string;
}

/**
 * Span attributes
 */
export type SpanAttributes = Record<string, string | number | boolean | undefined>;

/**
 * Span context
 */
export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  traceState?: string;
}

/**
 * Span interface
 */
export interface Span {
  spanContext(): SpanContext;
  setAttribute(key: string, value: string | number | boolean): this;
  setAttributes(attributes: SpanAttributes): this;
  addEvent(name: string, attributes?: SpanAttributes): this;
  setStatus(status: SpanStatus): this;
  recordException(exception: Error): this;
  end(endTime?: number): void;
  isRecording(): boolean;
}

/**
 * Tracer interface
 */
export interface Tracer {
  startSpan(name: string, options?: SpanOptions): Span;
  startActiveSpan<T>(name: string, fn: (span: Span) => T): T;
  startActiveSpan<T>(name: string, options: SpanOptions, fn: (span: Span) => T): T;
}

/**
 * Span options
 */
export interface SpanOptions {
  kind?: SpanKind;
  attributes?: SpanAttributes;
  links?: SpanLink[];
  startTime?: number;
  root?: boolean;
}

/**
 * Span kinds
 */
export enum SpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
  PRODUCER = 3,
  CONSUMER = 4
}

/**
 * Span link
 */
export interface SpanLink {
  context: SpanContext;
  attributes?: SpanAttributes;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Tracing configuration
 */
export interface TracingConfig {
  /** Service name for traces */
  serviceName: string;
  /** Service version */
  serviceVersion?: string;
  /** Enable tracing */
  enabled: boolean;
  /** Sampling rate (0-1) */
  samplingRate: number;
  /** Export endpoint */
  endpoint?: string;
  /** Export protocol */
  protocol: 'http' | 'grpc' | 'console';
  /** Batch export interval (ms) */
  batchInterval: number;
  /** Max export batch size */
  maxBatchSize: number;
  /** Add common attributes to all spans */
  commonAttributes?: SpanAttributes;
  /** Debug logging */
  debug: boolean;
}

/**
 * Default tracing configuration
 */
export const DEFAULT_TRACING_CONFIG: TracingConfig = {
  serviceName: 'osi-cards',
  enabled: true,
  samplingRate: 1.0,
  protocol: 'console',
  batchInterval: 5000,
  maxBatchSize: 100,
  debug: false
};

/**
 * Injection token for tracing configuration
 */
export const OSI_TRACING_CONFIG = new InjectionToken<TracingConfig>(
  'OSI_TRACING_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULT_TRACING_CONFIG
  }
);

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate a random trace ID (32 hex chars)
 */
function generateTraceId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a random span ID (16 hex chars)
 */
function generateSpanId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// SPAN IMPLEMENTATION
// ============================================================================

/**
 * Internal span implementation
 */
class InternalSpan implements Span {
  private readonly _context: SpanContext;
  private readonly attributes: SpanAttributes = {};
  private readonly events: Array<{ name: string; attributes?: SpanAttributes; time: number }> = [];
  private status: SpanStatus = { code: SpanStatusCode.UNSET };
  private ended = false;
  private exception: Error | null = null;
  private readonly startTime: number;
  private endTime: number | null = null;
  
  constructor(
    readonly name: string,
    private readonly config: TracingConfig,
    private readonly parentContext?: SpanContext,
    options: SpanOptions = {}
  ) {
    this._context = {
      traceId: parentContext?.traceId ?? generateTraceId(),
      spanId: generateSpanId(),
      traceFlags: 1
    };
    
    this.startTime = options.startTime ?? Date.now();
    
    if (options.attributes) {
      this.setAttributes(options.attributes);
    }
  }
  
  spanContext(): SpanContext {
    return { ...this._context };
  }
  
  setAttribute(key: string, value: string | number | boolean): this {
    if (!this.ended) {
      this.attributes[key] = value;
    }
    return this;
  }
  
  setAttributes(attributes: SpanAttributes): this {
    if (!this.ended) {
      Object.assign(this.attributes, attributes);
    }
    return this;
  }
  
  addEvent(name: string, attributes?: SpanAttributes): this {
    if (!this.ended) {
      this.events.push({ name, attributes, time: Date.now() });
    }
    return this;
  }
  
  setStatus(status: SpanStatus): this {
    if (!this.ended) {
      this.status = status;
    }
    return this;
  }
  
  recordException(exception: Error): this {
    if (!this.ended) {
      this.exception = exception;
      this.addEvent('exception', {
        'exception.type': exception.name,
        'exception.message': exception.message,
        'exception.stacktrace': exception.stack
      });
      this.setStatus({ code: SpanStatusCode.ERROR, message: exception.message });
    }
    return this;
  }
  
  end(endTime?: number): void {
    if (!this.ended) {
      this.ended = true;
      this.endTime = endTime ?? Date.now();
      
      // Export span data
      this.exportSpan();
    }
  }
  
  isRecording(): boolean {
    return !this.ended;
  }
  
  /**
   * Export span data
   */
  private exportSpan(): void {
    const spanData = {
      traceId: this._context.traceId,
      spanId: this._context.spanId,
      parentSpanId: this.parentContext?.spanId,
      name: this.name,
      kind: SpanKind.INTERNAL,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.endTime ? this.endTime - this.startTime : 0,
      status: this.status,
      attributes: {
        ...this.config.commonAttributes,
        ...this.attributes,
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion
      },
      events: this.events
    };
    
    if (this.config.debug || this.config.protocol === 'console') {
      console.log('[Trace]', spanData);
    }
    
    // In production, you would send to the configured endpoint
    if (this.config.endpoint && this.config.protocol !== 'console') {
      SpanExporter.enqueue(spanData);
    }
  }
}

// ============================================================================
// SPAN EXPORTER
// ============================================================================

/**
 * Span exporter (singleton)
 */
class SpanExporter {
  private static queue: unknown[] = [];
  private static timer: ReturnType<typeof setInterval> | null = null;
  private static config: TracingConfig | null = null;
  
  static initialize(config: TracingConfig): void {
    this.config = config;
    
    if (!this.timer && config.enabled && config.endpoint) {
      this.timer = setInterval(() => {
        this.flush();
      }, config.batchInterval);
    }
  }
  
  static enqueue(span: unknown): void {
    this.queue.push(span);
    
    if (this.queue.length >= (this.config?.maxBatchSize ?? 100)) {
      this.flush();
    }
  }
  
  static async flush(): Promise<void> {
    if (this.queue.length === 0 || !this.config?.endpoint) return;
    
    const batch = this.queue.splice(0, this.queue.length);
    
    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resourceSpans: batch })
      });
    } catch (error) {
      if (this.config.debug) {
        console.error('[Trace Export Error]', error);
      }
      // Re-queue on failure (with limit)
      if (this.queue.length < 1000) {
        this.queue.unshift(...batch);
      }
    }
  }
  
  static shutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush();
  }
}

// ============================================================================
// TRACER IMPLEMENTATION
// ============================================================================

/**
 * Internal tracer implementation
 */
class InternalTracer implements Tracer {
  private activeSpan: InternalSpan | null = null;
  
  constructor(
    private readonly config: TracingConfig
  ) {}
  
  startSpan(name: string, options: SpanOptions = {}): Span {
    if (!this.shouldSample()) {
      return new NoopSpan();
    }
    
    const parentContext = this.activeSpan?.spanContext();
    return new InternalSpan(name, this.config, parentContext, options);
  }
  
  startActiveSpan<T>(name: string, fnOrOptions: SpanOptions | ((span: Span) => T), fn?: (span: Span) => T): T {
    const options = typeof fnOrOptions === 'function' ? {} : fnOrOptions;
    const callback = typeof fnOrOptions === 'function' ? fnOrOptions : fn!;
    
    const span = this.startSpan(name, options) as InternalSpan;
    const previousActive = this.activeSpan;
    this.activeSpan = span;
    
    try {
      return callback(span);
    } finally {
      span.end();
      this.activeSpan = previousActive;
    }
  }
  
  private shouldSample(): boolean {
    return Math.random() < this.config.samplingRate;
  }
}

/**
 * No-op span for when sampling is disabled
 */
class NoopSpan implements Span {
  private static instance: NoopSpan;
  
  static getInstance(): NoopSpan {
    if (!this.instance) {
      this.instance = new NoopSpan();
    }
    return this.instance;
  }
  
  spanContext(): SpanContext {
    return { traceId: '', spanId: '', traceFlags: 0 };
  }
  
  setAttribute(): this { return this; }
  setAttributes(): this { return this; }
  addEvent(): this { return this; }
  setStatus(): this { return this; }
  recordException(): this { return this; }
  end(): void {}
  isRecording(): boolean { return false; }
}

// ============================================================================
// CARD TRACER SERVICE
// ============================================================================

/**
 * OSI Cards specific tracer with predefined span names
 */
@Injectable({
  providedIn: 'root'
})
export class CardTracer {
  private readonly config = inject(OSI_TRACING_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly tracer: Tracer;
  
  constructor() {
    const config = this.config;
    
    if (isPlatformBrowser(this.platformId) && config.enabled) {
      SpanExporter.initialize(config);
      this.tracer = new InternalTracer(config);
    } else {
      this.tracer = {
        startSpan: () => NoopSpan.getInstance(),
        startActiveSpan: <T>(_: string, fnOrOptions: unknown, fn?: unknown) => {
          const callback = typeof fnOrOptions === 'function' ? fnOrOptions : fn;
          return (callback as (span: Span) => T)(NoopSpan.getInstance());
        }
      };
    }
  }
  
  /**
   * Start a span for card rendering
   */
  startCardRender(cardId: string): Span {
    return this.tracer.startSpan('osi-cards.render', {
      attributes: {
        'card.id': cardId,
        'component': 'ai-card-renderer'
      }
    });
  }
  
  /**
   * Start a span for section rendering
   */
  startSectionRender(sectionId: string, sectionType: string): Span {
    return this.tracer.startSpan('osi-cards.section.render', {
      attributes: {
        'section.id': sectionId,
        'section.type': sectionType
      }
    });
  }
  
  /**
   * Start a span for streaming
   */
  startStreaming(streamId: string): Span {
    return this.tracer.startSpan('osi-cards.streaming', {
      kind: SpanKind.CONSUMER,
      attributes: {
        'stream.id': streamId
      }
    });
  }
  
  /**
   * Start a span for layout calculation
   */
  startLayoutCalculation(sectionCount: number): Span {
    return this.tracer.startSpan('osi-cards.layout', {
      attributes: {
        'layout.section_count': sectionCount
      }
    });
  }
  
  /**
   * Start a span for SSE connection
   */
  startSSEConnection(url: string): Span {
    return this.tracer.startSpan('osi-cards.sse.connect', {
      kind: SpanKind.CLIENT,
      attributes: {
        'sse.url': url
      }
    });
  }
  
  /**
   * Start a generic span
   */
  startSpan(name: string, options?: SpanOptions): Span {
    return this.tracer.startSpan(`osi-cards.${name}`, options);
  }
  
  /**
   * Run a function with a span
   */
  trace<T>(name: string, fn: (span: Span) => T): T {
    return this.tracer.startActiveSpan(`osi-cards.${name}`, fn);
  }
  
  /**
   * Run an async function with a span
   */
  async traceAsync<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
    const span = this.startSpan(name);
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.end();
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize tracing
 */
export function initializeTracing(config: Partial<TracingConfig>): void {
  const fullConfig = { ...DEFAULT_TRACING_CONFIG, ...config };
  SpanExporter.initialize(fullConfig);
}

/**
 * Shutdown tracing
 */
export function shutdownTracing(): void {
  SpanExporter.shutdown();
}

