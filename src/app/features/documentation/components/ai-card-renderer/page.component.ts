import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# AICardRendererComponent

Main card rendering component.

## Overview

\`AICardRendererComponent\` is the primary component for rendering OSI Cards. It takes a card configuration and renders all sections.

## Selector

\`\`\`html
<app-ai-card-renderer></app-ai-card-renderer>
\`\`\`

## Import

\`\`\`typescript
import { AICardRendererComponent } from 'osi-cards-lib';

@Component({
  imports: [AICardRendererComponent],
  ...
})
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`cardConfig\` | AICardConfig | Card configuration |
| \`columns\` | 1 \\| 2 \\| 3 | Column layout override |
| \`showActions\` | boolean | Show action buttons |
| \`enableTilt\` | boolean | Enable tilt effect |
| \`streamingMode\` | boolean | Enable streaming mode |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| \`sectionEvent\` | SectionRenderEvent | Section interaction event |
| \`actionClick\` | CardAction | Action button click |
| \`cardClick\` | AICardConfig | Card click event |

## Usage

\`\`\`html
<app-ai-card-renderer
  [cardConfig]="card"
  [columns]="2"
  [showActions]="true"
  (sectionEvent)="onSectionEvent($event)"
  (actionClick)="onAction($event)">
</app-ai-card-renderer>
\`\`\`

## Styling

\`\`\`css
app-ai-card-renderer {
  --osi-card-bg: white;
  --osi-card-border: #e0e0e0;
  --osi-card-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
\`\`\`
`;

@Component({
  selector: 'app-ai-card-renderer-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiCardRendererPageComponent {
  content = pageContent;
}

export default AiCardRendererPageComponent;
