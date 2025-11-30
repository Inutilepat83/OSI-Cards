import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Quick Start Guide

Get started with OSI Cards in minutes.

## Prerequisites

- Node.js 18+
- Angular 18 or 20
- npm or yarn

## Installation

\`\`\`bash
npm install osi-cards-lib
\`\`\`

## Basic Setup

1. Import styles in \`styles.scss\`:
\`\`\`scss
@import 'osi-cards-lib/styles/_styles';
\`\`\`

2. Use in component:
\`\`\`typescript
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  imports: [AICardRendererComponent],
  template: \`<app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>\`
})
export class MyComponent {
  card: AICardConfig = {
    cardTitle: 'My Card',
    sections: [{ title: 'Info', type: 'info', fields: [] }]
  };
}
\`\`\`

## Next Steps

- [Section Types](/docs/section-types)
- [Streaming](/docs/streaming)
- [Theming](/docs/advanced/theming)
`;

@Component({
  selector: 'app-quick-start-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickStartPageComponent {
  content = pageContent;
}

export default QuickStartPageComponent;
