import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# OSICardsComponent

Single card wrapper component.

## Overview

\`OSICardsComponent\` is a convenience wrapper for rendering a single card with all features.

## Selector

\`\`\`html
<osi-cards></osi-cards>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`config\` | AICardConfig | Card configuration |
| \`theme\` | string | Theme preset |
| \`interactive\` | boolean | Enable interactions |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| \`event\` | CardEvent | Any card event |

## Usage

\`\`\`html
<osi-cards
  [config]="cardConfig"
  [theme]="'dark'"
  (event)="handleEvent($event)">
</osi-cards>
\`\`\`
`;

@Component({
  selector: 'app-osi-cards-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OsiCardsPageComponent {
  content = pageContent;
}

export default OsiCardsPageComponent;
