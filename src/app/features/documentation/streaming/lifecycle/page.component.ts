import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Streaming Lifecycle

Complete streaming lifecycle and control methods.

## Starting a Stream

\`\`\`typescript
// Normal start with thinking delay
streamingService.start(jsonString);

// Instant mode (no thinking delay)
streamingService.start(jsonString, { instant: true });
\`\`\`

## Stopping a Stream

\`\`\`typescript
// Stop and reset
streamingService.stop();
// State becomes 'aborted'
\`\`\`

## Complete Lifecycle

\`\`\`typescript
@Component({...})
export class CardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnInit() {
    // Subscribe to state changes
    this.streamingService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        switch (state.stage) {
          case 'thinking':
            this.showThinkingIndicator();
            break;
          case 'streaming':
            this.showProgressBar();
            break;
          case 'complete':
            this.onComplete();
            break;
          case 'error':
            this.onError();
            break;
        }
      });
    
    // Subscribe to card updates
    this.streamingService.cardUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(update => {
        this.card = update.card;
      });
  }
  
  startStreaming(json: string) {
    this.streamingService.start(json);
  }
  
  cancelStreaming() {
    this.streamingService.stop();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.streamingService.stop();
  }
}
\`\`\`
`;

@Component({
  selector: 'app-lifecycle-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LifecyclePageComponent {
  content = pageContent;
}

export default LifecyclePageComponent;
