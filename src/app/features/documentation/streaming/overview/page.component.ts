import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Streaming Overview

Progressive card generation with real-time updates.

## Introduction

OSI Cards supports streaming card generation, allowing cards to be displayed progressively as LLM responses arrive. This creates a smooth, responsive user experience.

## Key Features

- **Progressive Rendering**: Cards appear section-by-section
- **Placeholder Animation**: Skeleton states while loading
- **Section Completion**: Visual feedback when sections complete
- **Error Recovery**: Graceful handling of stream interruptions

## Architecture

\`\`\`
LLM Response → JSON Chunks → Buffer → Parser → Card Updates → UI
\`\`\`

## Quick Start

\`\`\`typescript
import { OSICardsStreamingService } from 'osi-cards-lib';

const streamingService = inject(OSICardsStreamingService);

// Start streaming
streamingService.start(jsonString);

// Subscribe to updates
streamingService.cardUpdates$.subscribe(update => {
  this.card = update.card;
});

// Monitor state
streamingService.state$.subscribe(state => {
  this.isStreaming = state.isActive;
  this.progress = state.progress;
});
\`\`\`

## Streaming Stages

| Stage | Description |
|-------|-------------|
| \`idle\` | No active stream |
| \`thinking\` | Initial delay (simulates LLM thinking) |
| \`streaming\` | Actively receiving chunks |
| \`complete\` | Stream finished successfully |
| \`aborted\` | Stream cancelled |
| \`error\` | Stream failed |
`;

@Component({
  selector: 'app-overview-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewPageComponent {
  content = pageContent;
}

export default OverviewPageComponent;
