# EventMiddlewareService

Event processing with middleware chain support.

## Overview

`EventMiddlewareService` provides a middleware-based event processing system for intercepting, transforming, and handling card events.

## Import

```typescript
import { EventMiddlewareService, EventMiddleware } from 'osi-cards-lib';
```

## Methods

### addMiddleware(middleware)

Add middleware to the chain.

```typescript
const middleware: EventMiddleware = {
  priority: 50,
  handle: (event, next) => {
    console.log('Event:', event);
    return next(event);
  }
};

eventService.addMiddleware(middleware);
```

### removeMiddleware(middleware)

Remove middleware from chain.

### processEvent(event)

Process an event through the middleware chain.

### createLoggingMiddleware()

Create logging middleware.

```typescript
const logger = eventService.createLoggingMiddleware();
eventService.addMiddleware(logger);
```

### createFilterMiddleware(predicate)

Create filter middleware.

```typescript
const filter = eventService.createFilterMiddleware(
  event => event.type === 'field'
);
```

### createTransformMiddleware(transformer)

Create transform middleware.

### createAnalyticsMiddleware(tracker)

Create analytics tracking middleware.

## Observables

| Observable | Description |
|------------|-------------|
| `rawEvents$` | Events before middleware processing |
| `processedEvents$` | Events after middleware processing |
