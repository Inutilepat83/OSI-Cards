import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# MasonryGridComponent

Responsive masonry grid layout for cards.

## Overview

\`MasonryGridComponent\` arranges cards in an optimized masonry layout with responsive columns.

## Selector

\`\`\`html
<app-masonry-grid></app-masonry-grid>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`cards\` | AICardConfig[] | Cards to display |
| \`columns\` | number | Fixed column count |
| \`gap\` | number | Gap between cards (px) |
| \`minCardWidth\` | number | Minimum card width |
| \`enableAnimation\` | boolean | Enable animations |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| \`cardEvent\` | CardEvent | Card interaction event |
| \`layoutChange\` | LayoutInfo | Layout recalculated |

## Usage

\`\`\`html
<app-masonry-grid
  [cards]="cards"
  [columns]="3"
  [gap]="16"
  (cardEvent)="onCardEvent($event)">
</app-masonry-grid>
\`\`\`

## Responsive Breakpoints

| Breakpoint | Columns |
|------------|---------|
| < 600px | 1 |
| 600-900px | 2 |
| 900-1200px | 3 |
| > 1200px | 4 |

## Layout Algorithm

Uses skyline algorithm for optimal packing:
1. Find shortest column
2. Place card in shortest column
3. Update column height
4. Repeat
`;

@Component({
  selector: 'app-masonry-grid-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasonryGridPageComponent {
  content = pageContent;
}

export default MasonryGridPageComponent;
