# OSI Cards - Event System

This guide covers the event system for handling user interactions, component communication, and analytics integration.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Custom DOM Events](#custom-dom-events)
- [EventBusService](#eventbusservice)
- [EventMiddlewareService](#eventmiddlewareservice)
- [Creating Custom Middleware](#creating-custom-middleware)
- [Analytics Integration](#analytics-integration)
- [Event Type Reference](#event-type-reference)
- [Best Practices](#best-practices)

---

## Overview

OSI Cards provides three complementary event systems:

1. **Custom DOM Events** - Shadow DOM-compatible events that bubble across component boundaries
2. **EventBusService** - Centralized pub/sub system for application-wide communication
3. **EventMiddlewareService** - Middleware chain for event processing, logging, and transformation

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Event Flow Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User Interaction (click, hover, etc.)                              │
│              ↓                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Section Component                                │    │
│  │   • Emits Angular Output: (fieldInteraction)                 │    │
│  │   • Dispatches CustomEvent: osi-field-click                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│              ↓                         ↓                             │
│       Angular Outputs          Custom DOM Events                     │
│              ↓                         ↓                             │
│  ┌───────────────────┐    ┌───────────────────────────────────┐    │
│  │  Parent Component  │    │    EventMiddlewareService          │    │
│  │  (event bindings)  │    │    (process → transform → log)     │    │
│  └───────────────────┘    └───────────────────────────────────┘    │
│                                        ↓                             │
│                           ┌───────────────────────────────────┐    │
│                           │       EventBusService              │    │
│                           │   (broadcast to subscribers)       │    │
│                           └───────────────────────────────────┘    │
│                                        ↓                             │
│                           ┌───────────────────────────────────┐    │
│                           │   Application Services             │    │
│                           │   • Analytics                      │    │
│                           │   • State Management               │    │
│                           │   • Logging                        │    │
│                           └───────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Custom DOM Events

OSI Cards dispatches typed CustomEvents that properly bubble through Shadow DOM boundaries.

### Event Names

```typescript
import { OSI_EVENTS } from 'osi-cards-lib';

OSI_EVENTS.FIELD_CLICK       // 'osi-field-click'
OSI_EVENTS.ITEM_CLICK        // 'osi-item-click'
OSI_EVENTS.ACTION_CLICK      // 'osi-action-click'
OSI_EVENTS.CARD_INTERACTION  // 'osi-card-interaction'
OSI_EVENTS.THEME_CHANGE      // 'osi-theme-change'
OSI_EVENTS.STREAMING_STATE   // 'osi-streaming-state'
OSI_EVENTS.SECTION_RENDERED  // 'osi-section-rendered'
```

### Listening to Events

```typescript
import {
  OSI_EVENTS,
  OSIFieldClickEvent,
  OSIActionClickEvent,
  isOSIFieldClickEvent
} from 'osi-cards-lib';

// Type-safe event listener
document.addEventListener('osi-field-click', (event: OSIFieldClickEvent) => {
  console.log('Field clicked:', event.detail.field);
  console.log('Section:', event.detail.section);
  console.log('Timestamp:', event.detail.timestamp);
});

// Listen on specific element
cardElement.addEventListener('osi-action-click', (event: OSIActionClickEvent) => {
  const { action, card } = event.detail;
  handleAction(action, card);
});

// Using type guard
document.addEventListener('osi-field-click', (event: Event) => {
  if (isOSIFieldClickEvent(event)) {
    // TypeScript knows event is OSIFieldClickEvent
    console.log(event.detail.field.label);
  }
});
```

### Creating Events Programmatically

```typescript
import {
  createFieldClickEvent,
  createActionClickEvent,
  createThemeChangeEvent,
  createStreamingStateEvent
} from 'osi-cards-lib';

// Field click event
const fieldEvent = createFieldClickEvent(
  field,                    // CardField
  section,                  // CardSection (optional)
  { custom: 'metadata' },   // Additional metadata (optional)
  'my-component'            // Source identifier (optional)
);
element.dispatchEvent(fieldEvent);

// Action click event
const actionEvent = createActionClickEvent(action, card);
element.dispatchEvent(actionEvent);

// Theme change event
const themeEvent = createThemeChangeEvent('day', 'night');
document.dispatchEvent(themeEvent);

// Streaming state event
const streamingEvent = createStreamingStateEvent('streaming', 50);
element.dispatchEvent(streamingEvent);
```

### Event Detail Interfaces

```typescript
// Base event detail
interface OSIEventDetail {
  timestamp: number;
  source: string;
}

// Field click
interface FieldClickEventDetail extends OSIEventDetail {
  field: CardField;
  section?: CardSection;
  metadata?: Record<string, unknown>;
}

// Item click
interface ItemClickEventDetail extends OSIEventDetail {
  item: CardItem | CardField;
  section?: CardSection;
  metadata?: Record<string, unknown>;
}

// Action click
interface ActionClickEventDetail extends OSIEventDetail {
  action: CardAction;
  card?: AICardConfig;
  metadata?: Record<string, unknown>;
}

// Card interaction
interface CardInteractionEventDetail extends OSIEventDetail {
  type: 'click' | 'hover' | 'focus' | 'expand' | 'collapse';
  card?: AICardConfig;
  metadata?: Record<string, unknown>;
}

// Theme change
interface ThemeChangeEventDetail extends OSIEventDetail {
  previousTheme: 'day' | 'night';
  newTheme: 'day' | 'night';
}

// Streaming state
interface StreamingStateEventDetail extends OSIEventDetail {
  stage: 'idle' | 'starting' | 'streaming' | 'complete' | 'error';
  progress?: number;
  error?: string;
}

// Section rendered
interface SectionRenderedEventDetail extends OSIEventDetail {
  section: CardSection;
  isNew: boolean;
}
```

---

## EventBusService

A centralized pub/sub service for decoupled communication between components.

### Event Types

```typescript
type CardEventType =
  | 'card:created'
  | 'card:updated'
  | 'card:deleted'
  | 'card:streamed'
  | 'card:streaming-started'
  | 'card:streaming-completed'
  | 'card:streaming-error'
  | 'section:added'
  | 'section:updated'
  | 'section:removed'
  | 'section:clicked'
  | 'field:clicked'
  | 'action:triggered'
  | 'theme:changed'
  | 'layout:changed'
  | 'error:occurred'
  | 'custom';
```

### Basic Usage

```typescript
import { EventBusService, CardBusEvent } from 'osi-cards-lib';

const eventBus = inject(EventBusService);

// Emit an event
eventBus.emit('card:created', {
  cardId: 'card-123',
  title: 'New Card',
  sectionCount: 3
});

// Subscribe to an event type
const subscription = eventBus.on('card:created', (event) => {
  console.log('Card created:', event.payload);
});

// Don't forget to unsubscribe
ngOnDestroy() {
  subscription.unsubscribe();
}
```

### Subscription Methods

```typescript
// Subscribe to single event type
eventBus.on<MyPayload>('card:updated', (event) => {
  // event.payload is typed as MyPayload
});

// Subscribe to multiple event types
eventBus.onAny(['card:created', 'card:updated', 'card:deleted'], (event) => {
  console.log('Card lifecycle event:', event.type);
});

// Subscribe with custom predicate
eventBus.onWhere(
  (event) => event.payload?.priority === 'high',
  (event) => console.log('High priority event:', event)
);

// Get Observable for reactive patterns
eventBus.select<CardUpdatedPayload>('card:updated').pipe(
  debounceTime(300),
  distinctUntilChanged()
).subscribe(event => {
  // Handle debounced updates
});

// Get Observable for multiple types
eventBus.selectAny(['theme:changed', 'layout:changed']).subscribe(event => {
  // Handle UI updates
});
```

### Convenience Methods

```typescript
// Card lifecycle
eventBus.emitCardCreated({ cardId: 'card-1', title: 'Test', sectionCount: 2 });
eventBus.emitCardUpdated({ cardId: 'card-1', changedFields: ['title'] });
eventBus.emitSectionClicked({ sectionId: 'sec-1', sectionType: 'info' });
eventBus.emitActionTriggered({ actionId: 'action-1', actionType: 'mail' });

// Theme
eventBus.emitThemeChanged('day', 'night');

// Errors
eventBus.emitError(new Error('Something went wrong'), 'CardRenderer', true);

// Subscribe to groups of events
eventBus.onCardLifecycle((event) => {
  // Handles card:created, card:updated, card:deleted
});

eventBus.onStreaming((event) => {
  // Handles all streaming events
});

eventBus.onError((event) => {
  const { error, context, recoverable } = event.payload;
  if (!recoverable) {
    showFatalError(error);
  }
});
```

### Event History

```typescript
// Get recent events
const recentEvents = eventBus.getHistory(); // All events
const cardEvents = eventBus.getHistory('card:created', 10); // Last 10 card:created events

// Replay events to new subscriber
eventBus.replay(
  (event) => console.log('Replayed:', event),
  'card:created',
  5 // Replay last 5 events
);

// Clear history
eventBus.clearHistory();
```

---

## EventMiddlewareService

Process events through a middleware chain before they reach handlers.

### Basic Usage

```typescript
import { EventMiddlewareService, EventMiddleware } from 'osi-cards-lib';

const eventMiddleware = inject(EventMiddlewareService);

// Add custom middleware
const removeMiddleware = eventMiddleware.addMiddleware({
  priority: 100, // Higher priority = runs first
  handle: (event, next) => {
    console.log('Processing event:', event.type);
    // Must call next() to continue the chain
    return next(event);
  }
});

// Subscribe to processed events
eventMiddleware.processedEvents$.subscribe(event => {
  // Events have passed through all middleware
});

// Subscribe to raw events (before middleware)
eventMiddleware.rawEvents$.subscribe(event => {
  // Raw, unprocessed events
});

// Remove middleware when done
removeMiddleware();
```

### Built-in Middleware Factories

```typescript
// Logging middleware
const loggingMiddleware = eventMiddleware.createLoggingMiddleware(
  (message, event) => {
    console.log(`[OSI] ${message}`, event);
  }
);
eventMiddleware.addMiddleware(loggingMiddleware);

// Filtering middleware
const filterMiddleware = eventMiddleware.createFilterMiddleware(
  (event) => event.type !== 'navigation' // Filter out navigation events
);
eventMiddleware.addMiddleware(filterMiddleware);

// Transformation middleware
const transformMiddleware = eventMiddleware.createTransformMiddleware(
  (event) => ({
    ...event,
    metadata: {
      ...event.metadata,
      processedAt: Date.now()
    }
  })
);
eventMiddleware.addMiddleware(transformMiddleware);

// Analytics middleware
const analyticsMiddleware = eventMiddleware.createAnalyticsMiddleware(
  (eventName, properties) => {
    analytics.track(eventName, properties);
  }
);
eventMiddleware.addMiddleware(analyticsMiddleware);
```

### Processing Events

```typescript
import { SectionRenderEvent } from 'osi-cards-lib';

// Manually process an event through middleware
const event: SectionRenderEvent = {
  type: 'field',
  section: mySection,
  field: myField
};

const processedEvent = eventMiddleware.processEvent(event);
```

---

## Creating Custom Middleware

### EventMiddleware Interface

```typescript
interface EventMiddleware {
  /**
   * Handle an event, optionally transforming it
   * @param event - The event to handle
   * @param next - Call to pass to next middleware
   * @returns The processed event
   */
  handle(
    event: SectionRenderEvent,
    next: (event: SectionRenderEvent) => SectionRenderEvent
  ): SectionRenderEvent;

  /**
   * Priority for ordering (higher = earlier in chain)
   */
  priority?: number;
}
```

### Example: Validation Middleware

```typescript
const validationMiddleware: EventMiddleware = {
  priority: 90,
  handle: (event, next) => {
    // Validate event data
    if (!event.section?.type) {
      console.error('Invalid event: missing section type');
      return event; // Don't call next, stop the chain
    }

    // Validation passed, continue chain
    return next(event);
  }
};

eventMiddleware.addMiddleware(validationMiddleware);
```

### Example: Enrichment Middleware

```typescript
const enrichmentMiddleware: EventMiddleware = {
  priority: 80,
  handle: (event, next) => {
    // Enrich event with additional data
    const enriched = {
      ...event,
      metadata: {
        ...event.metadata,
        userId: getCurrentUserId(),
        sessionId: getSessionId(),
        timestamp: Date.now()
      }
    };

    return next(enriched);
  }
};
```

### Example: Throttle Middleware

```typescript
const throttleMiddleware = (intervalMs: number): EventMiddleware => {
  const lastEmit = new Map<string, number>();

  return {
    priority: 70,
    handle: (event, next) => {
      const key = `${event.type}-${event.section?.id}`;
      const now = Date.now();
      const last = lastEmit.get(key) || 0;

      if (now - last < intervalMs) {
        return event; // Throttled, don't continue
      }

      lastEmit.set(key, now);
      return next(event);
    }
  };
};

eventMiddleware.addMiddleware(throttleMiddleware(500));
```

---

## Analytics Integration

### Using Analytics Middleware

```typescript
import { EventMiddlewareService } from 'osi-cards-lib';

const eventMiddleware = inject(EventMiddlewareService);

// Segment integration
const segmentMiddleware = eventMiddleware.createAnalyticsMiddleware(
  (eventName, properties) => {
    window.analytics.track(eventName, properties);
  }
);

// Google Analytics integration
const gaMiddleware = eventMiddleware.createAnalyticsMiddleware(
  (eventName, properties) => {
    gtag('event', eventName, properties);
  }
);

// Mixpanel integration
const mixpanelMiddleware = eventMiddleware.createAnalyticsMiddleware(
  (eventName, properties) => {
    mixpanel.track(eventName, properties);
  }
);

eventMiddleware.addMiddleware(segmentMiddleware);
```

### Custom Analytics Middleware

```typescript
const customAnalyticsMiddleware: EventMiddleware = {
  priority: 50,
  handle: (event, next) => {
    // Track different event types differently
    switch (event.type) {
      case 'field':
        trackFieldInteraction(event.field, event.section);
        break;
      case 'action':
        trackActionClick(event.action);
        break;
      case 'navigation':
        trackNavigation(event.metadata);
        break;
    }

    return next(event);
  }
};

function trackFieldInteraction(field: CardField, section: CardSection) {
  analytics.track('Card Field Clicked', {
    fieldId: field.id,
    fieldLabel: field.label,
    sectionType: section.type,
    sectionTitle: section.title
  });
}
```

### Full Analytics Setup

```typescript
// app.config.ts
import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideOSICards, EventMiddlewareService, EventBusService } from 'osi-cards-lib';

function setupAnalytics() {
  return () => {
    const eventMiddleware = inject(EventMiddlewareService);
    const eventBus = inject(EventBusService);

    // Add analytics middleware
    eventMiddleware.addMiddleware(
      eventMiddleware.createAnalyticsMiddleware((name, props) => {
        analytics.track(name, props);
      })
    );

    // Track event bus events too
    eventBus.events$.subscribe(event => {
      analytics.track(`bus_${event.type}`, {
        payload: event.payload,
        source: event.source,
        timestamp: event.timestamp
      });
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards(),
    {
      provide: APP_INITIALIZER,
      useFactory: setupAnalytics,
      multi: true
    }
  ]
};
```

---

## Event Type Reference

### DOM Events (CustomEvent)

| Event Name | Detail Type | Description |
|------------|-------------|-------------|
| `osi-field-click` | `FieldClickEventDetail` | Field clicked in section |
| `osi-item-click` | `ItemClickEventDetail` | Item clicked in list section |
| `osi-action-click` | `ActionClickEventDetail` | Action button clicked |
| `osi-card-interaction` | `CardInteractionEventDetail` | General card interaction |
| `osi-theme-change` | `ThemeChangeEventDetail` | Theme toggled |
| `osi-streaming-state` | `StreamingStateEventDetail` | Streaming state changed |
| `osi-section-rendered` | `SectionRenderedEventDetail` | Section finished rendering |

### EventBus Events

| Event Type | Payload | Description |
|------------|---------|-------------|
| `card:created` | `CardCreatedPayload` | New card created |
| `card:updated` | `CardUpdatedPayload` | Card data updated |
| `card:deleted` | `{ cardId: string }` | Card removed |
| `card:streaming-started` | `{ cardId: string }` | Streaming began |
| `card:streamed` | `{ cardId: string, progress: number }` | Streaming progress |
| `card:streaming-completed` | `{ cardId: string }` | Streaming finished |
| `card:streaming-error` | `{ cardId: string, error: Error }` | Streaming failed |
| `section:added` | `SectionEventPayload` | Section added |
| `section:updated` | `SectionEventPayload` | Section modified |
| `section:removed` | `SectionEventPayload` | Section removed |
| `section:clicked` | `SectionEventPayload` | Section clicked |
| `field:clicked` | `{ field: CardField }` | Field clicked |
| `action:triggered` | `ActionTriggeredPayload` | Action executed |
| `theme:changed` | `ThemeChangedPayload` | Theme switched |
| `layout:changed` | `{ columns: number }` | Layout recalculated |
| `error:occurred` | `ErrorPayload` | Error happened |

### SectionRenderEvent (Middleware)

```typescript
interface SectionRenderEvent {
  type: 'field' | 'item' | 'action' | 'navigation';
  section: CardSection;
  field?: CardField;
  item?: CardItem;
  action?: CardAction;
  metadata?: Record<string, unknown>;
}
```

---

## Best Practices

### 1. Clean Up Subscriptions

```typescript
@Component({...})
export class MyComponent implements OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    // Using takeUntilDestroyed
    this.eventBus.events$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      // Handle event
    });

    // Or store subscription
    this.subscription = this.eventBus.on('card:updated', handler);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

### 2. Use Type Guards

```typescript
document.addEventListener('osi-field-click', (event: Event) => {
  if (isOSIFieldClickEvent(event)) {
    // TypeScript knows the exact type
    handleFieldClick(event.detail.field);
  }
});
```

### 3. Set Middleware Priorities Correctly

```typescript
// Priority order (high to low):
// 100: Logging (see all events)
// 90: Validation (reject invalid early)
// 80: Enrichment (add data)
// 70: Throttling (reduce volume)
// 50: Analytics (track valid events)
// 0: Default handlers
```

### 4. Emit Events with Source

```typescript
// Always include source for debugging
eventBus.emit('card:updated', payload, {
  source: 'CardEditorComponent'
});

createFieldClickEvent(field, section, metadata, 'my-component');
```

### 5. Use Event History Sparingly

```typescript
// History is limited to prevent memory leaks
// Default: 100 events
// Use for debugging, not as a data store
```

---

## Related Documentation

- [API Reference](./API.md) - Full API documentation
- [Plugin System](./PLUGIN_SYSTEM.md) - Creating custom sections
- [Best Practices](./BEST_PRACTICES.md) - General best practices
- [Integration Guide](./INTEGRATION_GUIDE.md) - Integration patterns


