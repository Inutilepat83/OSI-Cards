import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# CardActionsComponent

Card action buttons.

## Overview

\`CardActionsComponent\` renders action buttons at the bottom of cards.

## Selector

\`\`\`html
<app-card-actions></app-card-actions>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`actions\` | CardAction[] | Actions to render |
| \`layout\` | 'row' \\| 'column' | Button layout |
| \`fullWidth\` | boolean | Full width buttons |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| \`actionClick\` | CardAction | Action clicked |

## Usage

\`\`\`html
<app-card-actions
  [actions]="card.actions"
  [layout]="'row'"
  (actionClick)="handleAction($event)">
</app-card-actions>
\`\`\`

## Action Handling

\`\`\`typescript
handleAction(action: CardAction) {
  switch (action.type) {
    case 'website':
      window.open(action.url, '_blank');
      break;
    case 'mail':
      this.openMailClient(action.email);
      break;
    case 'agent':
      this.triggerAgent(action);
      break;
    case 'question':
      this.sendQuestion(action.question);
      break;
  }
}
\`\`\`
`;

@Component({
  selector: 'app-card-actions-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardActionsPageComponent {
  content = pageContent;
}

export default CardActionsPageComponent;
