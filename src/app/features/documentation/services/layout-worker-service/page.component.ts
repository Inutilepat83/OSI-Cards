import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# LayoutWorkerService

Offload layout calculations to Web Worker.

## Overview

\`LayoutWorkerService\` performs heavy layout calculations in a Web Worker to keep the UI responsive.

## Import

\`\`\`typescript
import { LayoutWorkerService } from 'osi-cards-lib';
\`\`\`

## Methods

### calculateLayout(cards, containerWidth, options?)

Calculate optimal card layout.

\`\`\`typescript
const layout = await layoutWorker.calculateLayout(cards, 1200, {
  columns: 3,
  gap: 16,
  algorithm: 'masonry'
});
\`\`\`

### isSupported()

Check if Web Workers are supported.

### terminate()

Terminate the worker.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`columns\` | number | 3 | Number of columns |
| \`gap\` | number | 16 | Gap between cards (px) |
| \`algorithm\` | string | 'masonry' | Layout algorithm |
| \`minCardWidth\` | number | 300 | Minimum card width |

## Fallback

If Web Workers aren't supported, calculations happen on main thread:

\`\`\`typescript
if (!layoutWorker.isSupported()) {
  // Uses synchronous fallback
}
\`\`\`
`;

@Component({
  selector: 'app-layout-worker-service-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutWorkerServicePageComponent {
  content = pageContent;
}

export default LayoutWorkerServicePageComponent;
