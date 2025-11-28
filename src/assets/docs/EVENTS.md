# OSI Cards Library - Event System Guide

This guide explains the extensible event system for handling card interactions with middleware support.

## Overview

The OSI Cards library provides a powerful event system that allows you to:
- Intercept and transform events before they reach handlers
- Add logging and debugging
- Integrate analytics tracking
- Filter events based on custom criteria
- Chain multiple event processors

## Basic Event Handling

Card components emit events for user interactions:

```typescript
import { Component } from '@angular/core';
import { SectionRenderEvent } from 'osi-cards-lib';

@Component({
  selector: 'app-my-component',
  template: `
    <app-ai-card-renderer
      [cardConfig]="card"
      (sectionEvent)="onSectionEvent($event)">
    </app-ai-card-renderer>
  `
})
export class MyComponent {
  onSectionEvent(event: SectionRenderEvent): void {
    console.log('Section event:', event.type, event.section.title);
    
    if (event.type === 'field') {
      console.log('Field clicked:', event.field?.label);
    }
  }
}
```

## Event Middleware

Event middleware allows you to process events before they reach your handlers.

### Creating Middleware

```typescript
import { EventMiddleware, SectionRenderEvent } from 'osi-cards-lib';
import { EventMiddlewareService } from 'osi-cards-lib';

const eventService = inject(EventMiddlewareService);

// Create custom middleware
const myMiddleware: EventMiddleware = {
  priority: 50,
  handle: (event: SectionRenderEvent, next) => {
    // Transform or log the event
    console.log('Processing event:', event);
    
    // Pass to next middleware
    return next(event);
  }
};

// Add middleware
eventService.addMiddleware(myMiddleware);
```

### Built-in Middleware Factories

#### Logging Middleware

```typescript
const loggingMiddleware = eventService.createLoggingMiddleware();
eventService.addMiddleware(loggingMiddleware);

// Custom logger
const customLogger = eventService.createLoggingMiddleware((msg, event) => {
  console.log(`[${new Date().toISOString()}] ${msg}`, event);
});
eventService.addMiddleware(customLogger);
```

#### Filter Middleware

```typescript
// Only process field events
const filterMiddleware = eventService.createFilterMiddleware(
  (event) => event.type === 'field'
);
eventService.addMiddleware(filterMiddleware);
```

#### Transform Middleware

```typescript
// Add timestamp to all events
const transformMiddleware = eventService.createTransformMiddleware(
  (event) => ({
    ...event,
    metadata: {
      ...event.metadata,
      timestamp: Date.now()
    }
  })
);
eventService.addMiddleware(transformMiddleware);
```

#### Analytics Middleware

```typescript
// Track events with analytics service
const analyticsMiddleware = eventService.createAnalyticsMiddleware(
  (eventName, properties) => {
    // Your analytics tracking code
    analytics.track(eventName, properties);
  }
);
eventService.addMiddleware(analyticsMiddleware);
```

## Event Subscription

Subscribe to processed events:

```typescript
import { EventMiddlewareService } from 'osi-cards-lib';

const eventService = inject(EventMiddlewareService);

// Subscribe to processed events
eventService.processedEvents$.subscribe(event => {
  console.log('Processed event:', event);
});

// Subscribe to raw events (before middleware)
eventService.rawEvents$.subscribe(event => {
  console.log('Raw event:', event);
});
```

## Event Processing Flow

1. **Raw Event** - Event is emitted from component
2. **Middleware Chain** - Event passes through registered middleware (in priority order)
3. **Processed Event** - Final event is emitted to subscribers

```
Component → Raw Event → Middleware 1 → Middleware 2 → ... → Processed Event
```

## Middleware Priority

Middleware with higher priority runs first:

```typescript
const highPriorityMiddleware: EventMiddleware = {
  priority: 100, // Runs first
  handle: (event, next) => next(event)
};

const lowPriorityMiddleware: EventMiddleware = {
  priority: 10, // Runs later
  handle: (event, next) => next(event)
};
```

## Complete Example

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { 
  EventMiddlewareService, 
  SectionRenderEvent 
} from 'osi-cards-lib';

@Component({
  selector: 'app-card-container',
  template: `
    <app-ai-card-renderer
      [cardConfig]="card"
      (sectionEvent)="handleEvent($event)">
    </app-ai-card-renderer>
  `
})
export class CardContainerComponent implements OnInit {
  private eventService = inject(EventMiddlewareService);
  
  ngOnInit(): void {
    // Add logging
    const logger = this.eventService.createLoggingMiddleware();
    this.eventService.addMiddleware(logger);
    
    // Add analytics
    const analytics = this.eventService.createAnalyticsMiddleware(
      (name, props) => this.trackEvent(name, props)
    );
    this.eventService.addMiddleware(analytics);
    
    // Subscribe to processed events
    this.eventService.processedEvents$.subscribe(event => {
      this.handleProcessedEvent(event);
    });
  }
  
  handleEvent(event: SectionRenderEvent): void {
    // Events are already processed by middleware
    this.eventService.processEvent(event);
  }
  
  handleProcessedEvent(event: SectionRenderEvent): void {
    // Handle the processed event
    console.log('Final event:', event);
  }
  
  trackEvent(name: string, properties: Record<string, unknown>): void {
    // Your analytics implementation
    console.log('Track:', name, properties);
  }
}
```

## Best Practices

1. **Use Priority Wisely**: Set appropriate priorities for middleware order
2. **Keep Transformations Pure**: Avoid side effects in transformation middleware
3. **Handle Errors**: Wrap middleware in try-catch to prevent breaking the chain
4. **Remove Middleware**: Clean up middleware when components are destroyed
5. **Performance**: Consider filtering early to reduce processing overhead

## Related Documentation

- [README.md](../README.md) - Library overview
- [SERVICES.md](./SERVICES.md) - Service documentation
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) - Customization guide


