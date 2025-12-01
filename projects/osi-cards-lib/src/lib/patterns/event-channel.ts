/**
 * Event Channel Pattern (Point 9)
 * 
 * Provides typed event channels for cross-component communication
 * with replay capability and subscription management.
 * 
 * @example
 * ```typescript
 * // Create typed event channel
 * const cardEvents = createEventChannel<{
 *   'card:created': { cardId: string; config: AICardConfig };
 *   'card:updated': { cardId: string; changes: Partial<AICardConfig> };
 *   'card:deleted': { cardId: string };
 * }>();
 * 
 * // Subscribe to events
 * cardEvents.on('card:created', (event) => {
 *   console.log('Card created:', event.cardId);
 * });
 * 
 * // Emit events
 * cardEvents.emit('card:created', { cardId: 'card-1', config });
 * 
 * // With replay
 * const replayChannel = createEventChannel({ replay: 1 });
 * replayChannel.emit('card:created', data); // This will be replayed
 * replayChannel.on('card:created', handler); // Gets the last event
 * ```
 */

import { Subject, ReplaySubject, Observable, Subscription, filter, map } from 'rxjs';

/**
 * Event with metadata
 */
export interface ChannelEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: Date;
  source?: string;
  correlationId?: string;
}

/**
 * Event handler function
 */
export type EventHandler<T> = (payload: T, event: ChannelEvent<T>) => void;

/**
 * Event channel configuration
 */
export interface EventChannelConfig {
  /** Number of events to replay to new subscribers */
  replay?: number;
  /** Channel name for debugging */
  name?: string;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Event channel interface
 */
export interface EventChannel<TEvents extends Record<string, unknown>> {
  /** Subscribe to specific event type */
  on<K extends keyof TEvents>(
    type: K,
    handler: EventHandler<TEvents[K]>
  ): Subscription;
  
  /** Subscribe to specific event type (once) */
  once<K extends keyof TEvents>(
    type: K,
    handler: EventHandler<TEvents[K]>
  ): Subscription;
  
  /** Emit event */
  emit<K extends keyof TEvents>(
    type: K,
    payload: TEvents[K],
    options?: { source?: string; correlationId?: string }
  ): void;
  
  /** Get observable for specific event type */
  select<K extends keyof TEvents>(type: K): Observable<TEvents[K]>;
  
  /** Get observable for all events */
  all$: Observable<ChannelEvent>;
  
  /** Unsubscribe all handlers */
  dispose(): void;
}

/**
 * Create typed event channel
 */
export function createEventChannel<TEvents extends Record<string, unknown>>(
  config: EventChannelConfig = {}
): EventChannel<TEvents> {
  const { replay = 0, name = 'event-channel', debug = false } = config;
  
  const subject = replay > 0 
    ? new ReplaySubject<ChannelEvent>(replay)
    : new Subject<ChannelEvent>();
    
  const subscriptions = new Set<Subscription>();
  
  const log = debug 
    ? (msg: string, ...args: unknown[]) => console.log(`[${name}] ${msg}`, ...args)
    : () => {};

  return {
    on<K extends keyof TEvents>(
      type: K,
      handler: EventHandler<TEvents[K]>
    ): Subscription {
      log(`Subscribing to: ${String(type)}`);
      
      const sub = subject.pipe(
        filter((event): event is ChannelEvent<TEvents[K]> => 
          event.type === type
        )
      ).subscribe(event => {
        handler(event.payload, event);
      });
      
      subscriptions.add(sub);
      return sub;
    },

    once<K extends keyof TEvents>(
      type: K,
      handler: EventHandler<TEvents[K]>
    ): Subscription {
      log(`Subscribing once to: ${String(type)}`);
      
      const sub = subject.pipe(
        filter((event): event is ChannelEvent<TEvents[K]> => 
          event.type === type
        )
      ).subscribe(event => {
        handler(event.payload, event);
        sub.unsubscribe();
        subscriptions.delete(sub);
      });
      
      subscriptions.add(sub);
      return sub;
    },

    emit<K extends keyof TEvents>(
      type: K,
      payload: TEvents[K],
      options: { source?: string; correlationId?: string } = {}
    ): void {
      const event: ChannelEvent<TEvents[K]> = {
        type: String(type),
        payload,
        timestamp: new Date(),
        source: options.source,
        correlationId: options.correlationId,
      };
      
      log(`Emitting: ${String(type)}`, payload);
      subject.next(event as ChannelEvent);
    },

    select<K extends keyof TEvents>(type: K): Observable<TEvents[K]> {
      return subject.pipe(
        filter((event): event is ChannelEvent<TEvents[K]> => 
          event.type === type
        ),
        map(event => event.payload)
      );
    },

    get all$(): Observable<ChannelEvent> {
      return subject.asObservable();
    },

    dispose(): void {
      log('Disposing channel');
      subscriptions.forEach(sub => sub.unsubscribe());
      subscriptions.clear();
      subject.complete();
    }
  };
}

/**
 * Event bus - global event channel registry
 */
export class EventBus {
  private static instance: EventBus;
  private readonly channels = new Map<string, EventChannel<Record<string, unknown>>>();
  private readonly config: EventChannelConfig;

  private constructor(config: EventChannelConfig = {}) {
    this.config = config;
  }

  public static getInstance(config?: EventChannelConfig): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(config);
    }
    return EventBus.instance;
  }

  /**
   * Get or create a named channel
   */
  public channel<TEvents extends Record<string, unknown>>(
    name: string
  ): EventChannel<TEvents> {
    if (!this.channels.has(name)) {
      this.channels.set(
        name,
        createEventChannel<TEvents>({ ...this.config, name })
      );
    }
    return this.channels.get(name) as EventChannel<TEvents>;
  }

  /**
   * Dispose a specific channel
   */
  public disposeChannel(name: string): void {
    const channel = this.channels.get(name);
    if (channel) {
      channel.dispose();
      this.channels.delete(name);
    }
  }

  /**
   * Dispose all channels
   */
  public disposeAll(): void {
    this.channels.forEach(channel => channel.dispose());
    this.channels.clear();
  }

  /**
   * Get all channel names
   */
  public getChannelNames(): string[] {
    return Array.from(this.channels.keys());
  }
}

// ============================================================================
// Pre-defined OSI Cards Event Types
// ============================================================================

/**
 * Card lifecycle events
 */
export interface CardLifecycleEvents {
  'card:created': { cardId: string; config: unknown };
  'card:updated': { cardId: string; changes: unknown };
  'card:deleted': { cardId: string };
  'card:rendered': { cardId: string; renderTime: number };
  'card:error': { cardId: string; error: Error };
}

/**
 * Section lifecycle events
 */
export interface SectionLifecycleEvents {
  'section:created': { sectionId: string; type: string };
  'section:updated': { sectionId: string; changes: unknown };
  'section:collapsed': { sectionId: string };
  'section:expanded': { sectionId: string };
  'section:error': { sectionId: string; error: Error };
}

/**
 * Streaming events
 */
export interface StreamingEvents {
  'streaming:started': { cardId: string };
  'streaming:progress': { cardId: string; progress: number };
  'streaming:completed': { cardId: string; duration: number };
  'streaming:error': { cardId: string; error: Error };
  'streaming:cancelled': { cardId: string };
}

/**
 * User interaction events
 */
export interface InteractionEvents {
  'action:clicked': { actionId: string; actionType: string; cardId: string };
  'field:clicked': { fieldId: string; sectionId: string; cardId: string };
  'link:clicked': { url: string; cardId: string };
  'copy:triggered': { content: string; cardId: string };
}

/**
 * Theme events
 */
export interface ThemeEvents {
  'theme:changed': { theme: string; previous: string };
  'theme:toggled': { isDark: boolean };
}

/**
 * Combined OSI Cards events
 */
export interface OSICardsEvents extends 
  CardLifecycleEvents,
  SectionLifecycleEvents,
  StreamingEvents,
  InteractionEvents,
  ThemeEvents {}

/**
 * Create the default OSI Cards event channel
 */
export function createOSICardsEventChannel(
  config?: EventChannelConfig
): EventChannel<OSICardsEvents> {
  return createEventChannel<OSICardsEvents>({
    name: 'osi-cards',
    replay: 1,
    ...config
  });
}

