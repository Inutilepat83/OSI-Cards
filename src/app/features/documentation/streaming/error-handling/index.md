# Streaming Error Handling

Handling errors and recovery in streaming.

## Error States

Streaming can fail due to:
- Invalid JSON
- Network interruption
- Timeout

## Detecting Errors

```typescript
streamingService.state$.subscribe(state => {
  if (state.stage === 'error') {
    // Handle error
    this.showError('Streaming failed');
  }
});
```

## Recovery Strategies

### Retry

```typescript
async retryStream(json: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      this.streamingService.start(json);
      
      await firstValueFrom(
        this.streamingService.state$.pipe(
          filter(s => s.stage === 'complete' || s.stage === 'error'),
          take(1)
        )
      );
      
      const state = this.streamingService.getState();
      if (state.stage === 'complete') return;
      
    } catch (e) {
      if (i === maxRetries - 1) throw e;
    }
  }
}
```

### Fallback to Static

```typescript
streamingService.state$.subscribe(state => {
  if (state.stage === 'error') {
    // Try to parse what we have
    try {
      const partial = JSON.parse(this.buffer);
      this.card = partial;
    } catch {
      // Show static placeholder
      this.card = this.getPlaceholderCard();
    }
  }
});
```

## Validation

```typescript
// Validate before streaming
if (!isValidJson(jsonString)) {
  this.showError('Invalid JSON');
  return;
}

streamingService.start(jsonString);
```
