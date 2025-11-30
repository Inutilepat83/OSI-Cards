import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Performance Optimization

Optimize OSI Cards for best performance.

## Strategies

### 1. Virtual Scrolling

For many cards, use virtual scrolling:

\`\`\`html
<cdk-virtual-scroll-viewport itemSize="400">
  <app-ai-card-renderer
    *cdkVirtualFor="let card of cards"
    [cardConfig]="card">
  </app-ai-card-renderer>
</cdk-virtual-scroll-viewport>
\`\`\`

### 2. OnPush Change Detection

All library components use OnPush.

### 3. Web Workers

Layout calculations use Web Workers:

\`\`\`typescript
layoutWorker.calculateLayout(cards, width);
\`\`\`

### 4. Lazy Loading

Lazy load card routes:

\`\`\`typescript
{
  path: 'cards',
  loadComponent: () => import('./cards.component')
}
\`\`\`

### 5. Image Optimization

- Use lazy loading for images
- Provide appropriate sizes
- Use modern formats (WebP)

## Metrics to Monitor

- First Contentful Paint
- Largest Contentful Paint
- Time to Interactive
- Bundle size
`;

@Component({
  selector: 'app-performance-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformancePageComponent {
  content = pageContent;
}

export default PerformancePageComponent;
