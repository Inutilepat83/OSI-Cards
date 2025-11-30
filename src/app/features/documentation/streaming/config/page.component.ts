import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# StreamingConfig

Configuration options for streaming behavior.

## Interface

\`\`\`typescript
interface StreamingConfig {
  minChunkSize: number;      // Minimum chunk size (chars)
  maxChunkSize: number;      // Maximum chunk size (chars)
  thinkingDelayMs: number;   // Initial thinking delay
  charsPerToken: number;     // Characters per token
  tokensPerSecond: number;   // Target streaming speed
  cardUpdateThrottleMs: number;    // Update throttle
  completionBatchDelayMs: number;  // Batch completion delay
}
\`\`\`

## Default Values

| Property | Default | Description |
|----------|---------|-------------|
| \`minChunkSize\` | 10 | Minimum characters per chunk |
| \`maxChunkSize\` | 50 | Maximum characters per chunk |
| \`thinkingDelayMs\` | 100 | Delay before streaming starts |
| \`charsPerToken\` | 4 | Characters per LLM token |
| \`tokensPerSecond\` | 80 | Target streaming speed |
| \`cardUpdateThrottleMs\` | 50 | UI update throttle |
| \`completionBatchDelayMs\` | 100 | Section completion batching |

## Custom Configuration

\`\`\`typescript
const streamingService = inject(OSICardsStreamingService);

// Configure for faster streaming
streamingService.configure({
  tokensPerSecond: 120,
  thinkingDelayMs: 50
});

// Configure for slower, more readable streaming
streamingService.configure({
  tokensPerSecond: 40,
  cardUpdateThrottleMs: 100
});
\`\`\`
`;

@Component({
  selector: 'app-config-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigPageComponent {
  content = pageContent;
}

export default ConfigPageComponent;
