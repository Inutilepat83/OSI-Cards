import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# OSICardsStreamingService

Progressive card generation with streaming support.

## Overview

\`OSICardsStreamingService\` handles real-time card generation by processing JSON chunks as they arrive from LLM responses.

## Import

\`\`\`typescript
import { OSICardsStreamingService } from 'osi-cards-lib';
\`\`\`

## Injection

\`\`\`typescript
const streamingService = inject(OSICardsStreamingService);
\`\`\`

## Methods

### start(jsonString, options?)

Start streaming JSON content.

\`\`\`typescript
streamingService.start(jsonString);
streamingService.start(jsonString, { instant: true });
\`\`\`

### stop()

Stop current streaming.

\`\`\`typescript
streamingService.stop();
\`\`\`

### configure(config)

Configure streaming behavior.

\`\`\`typescript
streamingService.configure({
  tokensPerSecond: 100,
  thinkingDelayMs: 50
});
\`\`\`

### getState()

Get current streaming state.

\`\`\`typescript
const state = streamingService.getState();
\`\`\`

## Observables

| Observable | Type | Description |
|------------|------|-------------|
| \`state$\` | StreamingState | Current streaming state |
| \`cardUpdates$\` | CardUpdate | Card updates as they stream |
| \`bufferUpdates$\` | string | Raw buffer updates |

## Example

\`\`\`typescript
@Component({...})
export class MyComponent {
  private streamingService = inject(OSICardsStreamingService);
  
  startStreaming(json: string) {
    this.streamingService.start(json);
    
    this.streamingService.cardUpdates$.subscribe(update => {
      this.card = update.card;
    });
  }
}
\`\`\`
`;

@Component({
  selector: 'app-streaming-service-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamingServicePageComponent {
  content = pageContent;
}

export default StreamingServicePageComponent;
