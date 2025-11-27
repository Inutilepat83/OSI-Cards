# Request Cancellation Implementation

## Overview

Request cancellation is implemented throughout the application to prevent race conditions, memory leaks, and unnecessary network requests. When a new request is made, previous in-flight requests are automatically cancelled.

## Implementation

### RequestCanceller Utility

Located at: `src/app/shared/utils/request-cancellation.util.ts`

**Features:**
- Cancels RxJS observables via `takeUntil`
- Cancels HTTP requests via `AbortController`
- Supports both observable and HTTP request cancellation

**Usage:**
```typescript
import { RequestCanceller } from '@shared/utils/request-cancellation.util';

const canceller = new RequestCanceller();

// Use with observables
observable.pipe(
  takeUntil(canceller.cancel$)
).subscribe();

// Use with HTTP requests
const signal = canceller.signal;
http.get(url, { signal }).subscribe();

// Cancel when needed
canceller.cancel();
```

### Services Using Request Cancellation

#### 1. CardDataService
- Cancels previous requests when switching providers
- Cancels requests on service destruction
- Location: `src/app/core/services/card-data/card-data.service.ts`

#### 2. JsonFileCardProvider
- Cancels manifest requests when switching card types
- Cancels individual card load requests
- Handles AbortError gracefully
- Location: `src/app/core/services/card-data/json-file-card-provider.service.ts`

#### 3. LLMStreamingService
- Cancels streaming requests when new simulation starts
- Cancels on service destruction
- Location: `src/app/core/services/llm-streaming.service.ts`

## Best Practices

### 1. Always Cancel on Component/Service Destruction

```typescript
export class MyService implements OnDestroy {
  private requestCanceller = new RequestCanceller();
  private destroyRef = inject(DestroyRef);

  constructor() {
    // Cancel on destroy
    this.destroyRef.onDestroy(() => {
      this.requestCanceller.cancel();
    });
  }
}
```

### 2. Cancel When Switching Contexts

```typescript
switchCardType(type: CardType): void {
  // Cancel previous requests
  this.requestCanceller.cancel();
  
  // Make new request
  this.loadCard(type);
}
```

### 3. Handle AbortError Gracefully

```typescript
this.http.get(url).pipe(
  takeUntil(this.requestCanceller.cancel$),
  catchError((error) => {
    if (error.name === 'AbortError') {
      // Request was cancelled, not an actual error
      return of(null);
    }
    // Handle real errors
    return throwError(() => error);
  })
).subscribe();
```

### 4. Use RequestManager for Multiple Requests

```typescript
import { RequestManager } from '@shared/utils/request-cancellation.util';

const manager = new RequestManager();

// Get canceller for a specific request
const canceller = manager.getCanceller('load-card-123');
// Previous request with same ID is automatically cancelled

// Cancel specific request
manager.cancel('load-card-123');

// Cancel all requests
manager.cancelAll();
```

## Current Implementation Status

✅ **Fully Implemented:**
- CardDataService - Cancels on provider switch and destruction
- JsonFileCardProvider - Cancels on card type switch
- LLMStreamingService - Cancels on new simulation start

✅ **Pattern Established:**
- RequestCanceller utility class
- RequestManager for multiple requests
- Proper error handling for AbortError

## Integration Points

### HomePageComponent
When switching card types, requests should be cancelled:
```typescript
onCardTypeChange(type: CardType): void {
  // CardDataService handles cancellation internally
  this.store.dispatch(CardActions.setCardType({ cardType: type }));
}
```

### Card Loading
All card loading operations automatically cancel previous requests through the service layer.

## Testing

To test request cancellation:

1. Start loading a card
2. Immediately switch to a different card type
3. Verify previous request is cancelled (check network tab)
4. Verify no memory leaks (check DevTools)

## Related Files

- `src/app/shared/utils/request-cancellation.util.ts` - Core utilities
- `src/app/core/services/card-data/card-data.service.ts` - Service implementation
- `src/app/core/services/card-data/json-file-card-provider.service.ts` - Provider implementation
- `src/app/core/services/llm-streaming.service.ts` - Streaming service


