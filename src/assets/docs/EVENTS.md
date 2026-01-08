# Event System Guide

The OSI Cards library provides a powerful event system for handling card interactions with middleware support.

## **Overview**

The event system allows you to:
- Intercept and transform events before they reach handlers
- Add logging and debugging
- Integrate analytics tracking
- Filter events based on custom criteria
- Chain multiple event processors

## **Basic Event Handling**

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

## **Event Middleware**

Event middleware allows you to process events before they reach your handlers.

### **Creating Middleware**

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

### **Built-in Middleware Factories**

#### **Logging Middleware**

```typescript
const loggingMiddleware = eventService.createLoggingMiddleware();
eventService.addMiddleware(loggingMiddleware);

// Custom logger
const customLogger = eventService.createLoggingMiddleware((msg, event) => {
  console.log(`[${new Date().toISOString()}] ${msg}`, event);
});
eventService.addMiddleware(customLogger);
```

#### **Filter Middleware**

```typescript
const filter = eventService.createFilterMiddleware(
  event => event.type === 'field'
);
eventService.addMiddleware(filter);
```

#### **Transform Middleware**

```typescript
const transformer = eventService.createTransformMiddleware(
  event => ({
    ...event,
    timestamp: Date.now(),
    customProperty: 'value'
  })
);
eventService.addMiddleware(transformer);
```

#### **Analytics Middleware**

```typescript
const analytics = eventService.createAnalyticsMiddleware((event) => {
  // Send to your analytics service
  analyticsService.track('card_interaction', {
    type: event.type,
    section: event.section.title
  });
});
eventService.addMiddleware(analytics);
```

## **Event Types**

The event system supports various event types:

- `'section'` - Section-level events
- `'field'` - Field-level interactions
- `'action'` - Action button clicks
- `'render'` - Component rendering events

## **Observables**

The `EventMiddlewareService` provides observables for monitoring events:

```typescript
// Raw events (before middleware)
eventService.rawEvents$.subscribe(event => {
  console.log('Raw event:', event);
});

// Processed events (after middleware)
eventService.processedEvents$.subscribe(event => {
  console.log('Processed event:', event);
});
```

## **Middleware Priority**

Middleware can be ordered using the `priority` property. Higher priority middleware runs first:

```typescript
const highPriorityMiddleware: EventMiddleware = {
  priority: 100,
  handle: (event, next) => {
    // Runs first
    return next(event);
  }
};

const lowPriorityMiddleware: EventMiddleware = {
  priority: 10,
  handle: (event, next) => {
    // Runs last
    return next(event);
  }
};
```

## **Additional Resources**

- [Event Middleware Service API](../docs/services/event-middleware-service/)
- [Advanced Event Middleware Guide](../docs/advanced/event-middleware/)
