import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# CardStreamingIndicatorComponent

Streaming progress indicator.

## Overview

\`CardStreamingIndicatorComponent\` shows streaming progress and state.

## Selector

\`\`\`html
<app-card-streaming-indicator></app-card-streaming-indicator>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`state\` | StreamingState | Current state |
| \`showProgress\` | boolean | Show progress bar |
| \`showStage\` | boolean | Show stage text |

## Usage

\`\`\`html
<app-card-streaming-indicator
  [state]="streamingState"
  [showProgress]="true">
</app-card-streaming-indicator>
\`\`\`

## Stage Display

| Stage | Display |
|-------|---------|
| thinking | "Thinking..." |
| streaming | Progress bar |
| complete | Check mark |
| error | Error icon |
`;

@Component({
  selector: 'app-card-streaming-indicator-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardStreamingIndicatorPageComponent {
  content = pageContent;
}

export default CardStreamingIndicatorPageComponent;
