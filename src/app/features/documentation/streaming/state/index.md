# StreamingState

Real-time streaming state information.

## Interface

```typescript
interface StreamingState {
  isActive: boolean;       // Streaming in progress
  stage: StreamingStage;   // Current stage
  progress: number;        // 0-1 progress
  bufferLength: number;    // Current buffer size
  targetLength: number;    // Total expected length
}

type StreamingStage = 'idle' | 'thinking' | 'streaming' | 'complete' | 'aborted' | 'error';
```

## Subscribing to State

```typescript
const streamingService = inject(OSICardsStreamingService);

streamingService.state$.subscribe(state => {
  // Update progress bar
  this.progress = state.progress * 100;
  
  // Show/hide loading indicator
  this.isLoading = state.isActive;
  
  // Handle completion
  if (state.stage === 'complete') {
    this.onStreamComplete();
  }
  
  // Handle errors
  if (state.stage === 'error') {
    this.onStreamError();
  }
});
```

## Getting Current State

```typescript
// Get snapshot of current state
const currentState = streamingService.getState();

if (currentState.isActive) {
  console.log(`Progress: ${currentState.progress * 100}%`);
}
```
