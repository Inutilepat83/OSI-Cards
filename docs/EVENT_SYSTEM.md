# OSI Cards - Event System

This guide documents the event system for handling card interactions, including the EventBusService, EventMiddlewareService, and Shadow DOM event handling.

## Table of Contents

- [Overview](#overview)
- [Event Types](#event-types)
- [EventBusService](#eventbusservice)
- [EventMiddlewareService](#eventmiddlewareservice)
- [Shadow DOM Events](#shadow-dom-events)
- [Component Events](#component-events)
- [Best Practices](#best-practices)

---

## Overview

OSI Cards provides a comprehensive event system that allows you to:

- Handle user interactions with card fields and items
- Intercept and transform events with middleware
- Track analytics and debugging information
- Integrate with external systems
- Work seamlessly with Shadow DOM encapsulation

---

## Event Types

### Core Event Interfaces

```typescript
// Field interaction event
interface CardFieldInteractionEvent {
  field?: CardField;
  item?: CardItem | CardField;
  action: 'click';
  sectionTitle?: string;
  metadata?: Record<string, unknown>;
}

// Section render event
interface SectionRenderEvent {
  type: 'field' | 'item' | 'action' | 'navigation';
  section: CardSection;
  field?: CardField;
  item?: CardItem;
  action?: CardAction;
  metadata?: Record<string, unknown>;
}

// Action event
interface CardActionEvent {
  action: CardAction;
  card: AICardConfig;
}
```

### Event Type Constants

```typescript
import { OSI_EVENTS } from 'osi-cards-lib';

OSI_EVENTS.FIELD_CLICK      // 'osi-field-click'
OSI_EVENTS.ITEM_CLICK       // 'osi-item-click'
OSI_EVENTS.ACTION_CLICK     // 'osi-action-click'
OSI_EVENTS.CARD_CREATED     // 'osi-card-created'
OSI_EVENTS.CARD_UPDATED     // 'osi-card-updated'
OSI_EVENTS.THEME_CHANGED    // 'osi-theme-changed'
OSI_EVENTS.STREAMING_START  // 'osi-streaming-start'
OSI_EVENTS.STREAMING_END    // 'osi-streaming-end'
```

---

## EventBusService

The EventBusService provides centralized pub/sub communication across the application.

### Basic Usage

```typescript
import { inject } from '@angular/core';
import { EventBusService } from 'osi-cards-lib';

export class MyComponent {
  private eventBus = inject(EventBusService);

  ngOnInit() {
    // Subscribe to events
    this.eventBus.on('card:created', (event) => {
      console.log('Card created:', event.payload);
    });

    // Subscribe to multiple events
    this.eventBus.onAny(['card:created', 'card:updated'], (event) => {
      console.log('Card lifecycle:', event);
    });
  }

  createCard() {
    // Emit events
    this.eventBus.emit('card:created', {
      cardId: '123',
      title: 'New Card',
      sectionCount: 3
    });
  }
}
```

### Convenience Methods

```typescript
// Emit typed events
eventBus.emitCardCreated({ cardId: '123', title: 'Card', sectionCount: 3 });
eventBus.emitThemeChanged('light', 'dark');
eventBus.emitStreamingStart('123');
eventBus.emitStreamingEnd('123', 'complete');

// Subscribe to event categories
eventBus.onCardLifecycle((event) => { /* card:created, card:updated, card:deleted */ });
eventBus.onStreaming((event) => { /* streaming:start, streaming:end */ });
eventBus.onError((event) => { /* error events */ });
```

### Observable API

```typescript
// Select specific events
eventBus.select('card:updated').subscribe(event => {
  console.log('Card updated:', event);
});

// Subscribe to all events
eventBus.events$.subscribe(event => {
  console.log('Event:', event.type, event.payload);
});
```

### Event History

```typescript
// Get event history
const history = eventBus.getHistory('card:created', 10);

// Replay events to a handler
eventBus.replay((event) => {
  console.log('Replayed:', event);
}, 'card:created', 5);

// Clear history
eventBus.clearHistory();
```

---

## EventMiddlewareService

EventMiddlewareService enables event processing pipelines with middleware.

### Creating Middleware

```typescript
import { inject } from '@angular/core';
import { EventMiddlewareService, EventMiddleware } from 'osi-cards-lib';

export class MyComponent {
  private middleware = inject(EventMiddlewareService);

  ngOnInit() {
    // Add custom middleware
    const removeMiddleware = this.middleware.addMiddleware({
      priority: 100,  // Higher runs first
      handle: (event, next) => {
        console.log('Processing:', event);

        // Transform event
        const modified = {
          ...event,
          metadata: { ...event.metadata, timestamp: Date.now() }
        };

        // Pass to next middleware
        return next(modified);
      }
    });

    // Remove middleware when done
    // removeMiddleware();
  }
}
```

### Built-in Middleware Factories

```typescript
// Logging middleware
const logger = middleware.createLoggingMiddleware();
middleware.addMiddleware(logger);

// Custom logger
const customLogger = middleware.createLoggingMiddleware((msg, event) => {
  console.log(`[${new Date().toISOString()}] ${msg}`, event);
});

// Filter middleware - only process certain events
const filter = middleware.createFilterMiddleware(
  (event) => event.type === 'field'
);

// Transform middleware - modify all events
const transform = middleware.createTransformMiddleware((event) => ({
  ...event,
  metadata: { ...event.metadata, processed: true }
}));

// Analytics middleware - track events
const analytics = middleware.createAnalyticsMiddleware((eventName, props) => {
  // Your analytics tracking
  gtag('event', eventName, props);
});
```

### Subscribing to Events

```typescript
// Processed events (after middleware)
middleware.processedEvents$.subscribe(event => {
  console.log('Final event:', event);
});

// Raw events (before middleware)
middleware.rawEvents$.subscribe(event => {
  console.log('Raw event:', event);
});
```

### Middleware Priority

Middleware runs in priority order (highest first):

```typescript
// High priority - runs first
middleware.addMiddleware({ priority: 100, handle: logging });

// Medium priority
middleware.addMiddleware({ priority: 50, handle: transform });

// Low priority - runs last
middleware.addMiddleware({ priority: 10, handle: analytics });
```

---

## Shadow DOM Events

OSI Cards uses Shadow DOM for style encapsulation. Events properly bubble through Shadow DOM boundaries.

### Custom Events

Events use `composed: true` to cross shadow boundaries:

```typescript
import { createFieldClickEvent, OSIFieldClickEvent } from 'osi-cards-lib';

// Listen at any level (events bubble through Shadow DOM)
document.addEventListener('osi-field-click', (e: OSIFieldClickEvent) => {
  console.log('Field clicked:', e.detail.field);
  console.log('Section:', e.detail.section);
});

// Create custom events (for plugin development)
const event = createFieldClickEvent(field, section);
element.dispatchEvent(event);
```

### Event Type Guards

```typescript
import { isOSIFieldClickEvent, isOSIActionClickEvent } from 'osi-cards-lib';

document.addEventListener('osi-field-click', (e) => {
  if (isOSIFieldClickEvent(e)) {
    // TypeScript knows e.detail has field and section
    console.log(e.detail.field.label);
  }
});
```

---

## Component Events

### OsiCardsComponent Events

```html
<osi-cards
  [card]="cardConfig"
  (fieldClick)="onFieldClick($event)"
  (actionClick)="onActionClick($event)"
  (fullscreenChange)="onFullscreenChange($event)"
  (agentAction)="onAgentAction($event)"
  (questionAction)="onQuestionAction($event)"
  (export)="onExport()">
</osi-cards>
```

```typescript
onFieldClick(event: CardFieldInteractionEvent) {
  console.log('Field:', event.field);
  console.log('Section:', event.sectionTitle);
}

onActionClick(event: { action: string; card: AICardConfig }) {
  console.log('Action:', event.action);
}

onFullscreenChange(isFullscreen: boolean) {
  console.log('Fullscreen:', isFullscreen);
}

onAgentAction(event: AgentActionEvent) {
  console.log('Agent action:', event);
}

onQuestionAction(event: QuestionActionEvent) {
  console.log('Question:', event);
}
```

### AICardRendererComponent Events

```html
<app-ai-card-renderer
  [cardConfig]="cardConfig"
  (cardEvent)="onCardEvent($event)"
  (actionClick)="onActionClick($event)"
  (layoutChange)="onLayoutChange($event)">
</app-ai-card-renderer>
```

```typescript
onCardEvent(event: CardFieldInteractionEvent) {
  console.log('Card event:', event);
}

onLayoutChange(info: MasonryLayoutInfo) {
  console.log('Layout columns:', info.columns);
  console.log('Layout height:', info.height);
}
```

### SectionRendererComponent Events

```html
<app-section-renderer
  [section]="section"
  (sectionEvent)="onSectionEvent($event)">
</app-section-renderer>
```

```typescript
onSectionEvent(event: SectionRenderEvent) {
  switch (event.type) {
    case 'field':
      console.log('Field clicked:', event.field);
      break;
    case 'item':
      console.log('Item clicked:', event.item);
      break;
    case 'action':
      console.log('Action clicked:', event.action);
      break;
    case 'navigation':
      console.log('Navigation:', event.metadata);
      break;
  }
}
```

---

## Best Practices

### 1. Use Typed Event Handlers

```typescript
// ✅ Good - typed handler
onFieldClick(event: CardFieldInteractionEvent): void {
  if (event.field?.url) {
    window.open(event.field.url, '_blank');
  }
}

// ❌ Avoid - untyped
onFieldClick(event: any): void { ... }
```

### 2. Clean Up Subscriptions

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class MyComponent {
  private destroyRef = inject(DestroyRef);
  private eventBus = inject(EventBusService);

  ngOnInit() {
    this.eventBus.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => this.handleEvent(event));
  }
}
```

### 3. Use Middleware for Cross-Cutting Concerns

```typescript
// ✅ Good - use middleware for logging/analytics
middleware.addMiddleware(middleware.createLoggingMiddleware());
middleware.addMiddleware(middleware.createAnalyticsMiddleware(track));

// ❌ Avoid - logging in every handler
onFieldClick(event) {
  console.log('Field clicked:', event);  // Repeated everywhere
  this.analytics.track('field_click', event);  // Repeated everywhere
  // ... actual logic
}
```

### 4. Filter Events Early

```typescript
// ✅ Good - filter at middleware level
middleware.addMiddleware(middleware.createFilterMiddleware(
  event => event.type !== 'navigation'  // Ignore navigation events
));

// ❌ Avoid - filtering in every handler
onEvent(event) {
  if (event.type === 'navigation') return;  // Repeated everywhere
  // ...
}
```

### 5. Handle Shadow DOM Events Correctly

```typescript
// ✅ Good - listen at document level for Shadow DOM events
document.addEventListener('osi-field-click', handler);

// ❌ Avoid - won't catch events from Shadow DOM
hostElement.addEventListener('click', handler);
```

---

## Related Documentation

- [API Reference](./API.md) - Complete API documentation
- [Components](./COMPONENTS.md) - Component events and outputs
- [Services](./SERVICES.md) - EventBusService and EventMiddlewareService details
- [CSS Encapsulation](./CSS_ENCAPSULATION.md) - Shadow DOM and event bubbling
- [Best Practices](./BEST_PRACTICES.md) - Error handling patterns
