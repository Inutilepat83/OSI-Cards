import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# OSICardsContainerComponent

Multiple cards container with grid.

## Overview

\`OSICardsContainerComponent\` manages multiple cards with masonry grid layout.

## Selector

\`\`\`html
<osi-cards-container></osi-cards-container>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`cards\` | AICardConfig[] | Cards to display |
| \`columns\` | number | Column count |
| \`gap\` | number | Gap between cards |
| \`sortable\` | boolean | Enable drag sort |
| \`filterable\` | boolean | Enable filtering |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| \`cardEvent\` | CardEvent | Card events |
| \`orderChange\` | AICardConfig[] | Order changed |

## Usage

\`\`\`html
<osi-cards-container
  [cards]="cards"
  [columns]="3"
  [sortable]="true"
  (cardEvent)="onEvent($event)"
  (orderChange)="onReorder($event)">
</osi-cards-container>
\`\`\`
`;

@Component({
  selector: 'app-osi-cards-container-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OsiCardsContainerPageComponent {
  content = pageContent;
}

export default OsiCardsContainerPageComponent;
