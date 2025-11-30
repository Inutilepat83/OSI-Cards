import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Card Updates

Receiving card updates during streaming.

## CardUpdate Interface

\`\`\`typescript
interface CardUpdate {
  card: AICardConfig;           // Updated card
  changeType: CardChangeType;   // Type of change
  completedSections?: number[]; // Newly completed sections
}

type CardChangeType = 'structural' | 'content';
\`\`\`

## Change Types

| Type | Description |
|------|-------------|
| \`structural\` | New sections added or removed |
| \`content\` | Existing section content updated |

## Subscribing to Updates

\`\`\`typescript
streamingService.cardUpdates$.subscribe(update => {
  // Update card
  this.card = update.card;
  
  // Handle structural changes (new sections)
  if (update.changeType === 'structural') {
    this.onNewSections();
  }
  
  // Animate completed sections
  if (update.completedSections?.length) {
    for (const index of update.completedSections) {
      this.animateSectionComplete(index);
    }
  }
});
\`\`\`

## Buffer Updates

\`\`\`typescript
// Raw buffer updates (for JSON editor sync)
streamingService.bufferUpdates$.subscribe(buffer => {
  this.jsonEditorContent = buffer;
});
\`\`\`
`;

@Component({
  selector: 'app-card-updates-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardUpdatesPageComponent {
  content = pageContent;
}

export default CardUpdatesPageComponent;
