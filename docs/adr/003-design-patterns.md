# ADR-003: Design Patterns for Maintainability

**Status:** Accepted  
**Date:** 2024-12-01  
**Authors:** OSI Cards Team

## Context

The OSI Cards library has grown in complexity, with multiple subsystems handling cards, sections, streaming, theming, and external service integration. To improve long-term maintainability and reduce coupling, we need standardized patterns for:

1. Error handling without exceptions
2. Cross-component communication
3. External service fault tolerance
4. Data persistence abstraction
5. Configuration management

## Decision

We will implement the following design patterns as part of the architecture improvements:

### 1. Result Type Pattern (Point 16)

Replace thrown exceptions in critical paths with explicit `Result<T, E>` types.

```typescript
// Before
function parseCard(json: string): AICardConfig {
  try {
    return JSON.parse(json);
  } catch (e) {
    throw new ParseError(e.message);
  }
}

// After
function parseCard(json: string): Result<AICardConfig, ParseError> {
  return tryCatch(
    () => JSON.parse(json),
    (e) => new ParseError((e as Error).message)
  );
}
```

**Benefits:**
- Explicit error handling at compile time
- Forces consumers to handle failure cases
- Better composition with `map`, `flatMap`
- No surprise exceptions

### 2. Circuit Breaker Pattern (Point 5)

Implement circuit breakers for streaming service and external integrations.

```typescript
const streamingBreaker = createCircuitBreaker('streaming', {
  failureThreshold: 3,
  resetTimeout: 30000
});

const result = await streamingBreaker.executeWithFallback(
  () => streamFromAPI(endpoint),
  () => getCachedResponse()
);
```

**States:**
- CLOSED: Normal operation
- OPEN: Requests rejected (too many failures)
- HALF_OPEN: Testing recovery

**Benefits:**
- Prevents cascading failures
- Fast failure instead of timeout
- Automatic recovery attempts
- Metrics for monitoring

### 3. Repository Pattern (Point 6)

Abstract card persistence with pluggable backends.

```typescript
// Memory (testing)
const repo = createRepository<AICardConfig>('memory');

// LocalStorage (offline support)
const repo = createRepository<AICardConfig>('localstorage', { prefix: 'cards' });

// IndexedDB (large datasets)
const repo = createRepository<AICardConfig>('indexeddb', { dbName: 'osi-cards' });
```

**Benefits:**
- Easy testing with memory backend
- Swap storage without code changes
- Consistent API across backends
- Observable changes for reactivity

### 4. Event Channel Pattern (Point 9)

Typed event channels for cross-component communication.

```typescript
const events = createOSICardsEventChannel();

// Subscribe
events.on('card:created', ({ cardId, config }) => {
  analytics.track('card_created', { cardId });
});

// Emit
events.emit('card:created', { cardId: 'card-1', config });
```

**Benefits:**
- Type-safe events at compile time
- Replay capability for late subscribers
- Centralized event bus for debugging
- Decoupled components

## Consequences

### Positive
- Improved type safety across the codebase
- Better testability with mockable patterns
- Reduced coupling between components
- Clear error handling boundaries
- Easier debugging with event tracing

### Negative
- Additional abstraction layers
- Learning curve for new patterns
- Some runtime overhead for pattern infrastructure
- More code to maintain

### Migration Path

1. New code should use patterns from `lib/patterns`
2. Existing code can be migrated incrementally
3. Critical paths (streaming, validation) prioritized
4. Testing utilities should use memory repositories

## File Structure

```
lib/patterns/
├── index.ts           # Public exports
├── circuit-breaker.ts # Fault tolerance
├── repository.ts      # Data persistence
├── result.ts          # Error handling
└── event-channel.ts   # Communication
```

## References

- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Result Type](https://doc.rust-lang.org/std/result/)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)

