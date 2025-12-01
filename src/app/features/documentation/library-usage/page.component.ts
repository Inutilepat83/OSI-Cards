import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../doc-page.component';

const pageContent = `# Library Usage Guide

Complete guide on how to use OSI Cards library in your Angular application.

## Basic Usage

### 1. Import the Component

\`\`\`typescript
import { Component } from '@angular/core';
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [AICardRendererComponent],
  template: \\\`
    <app-ai-card-renderer [cardConfig]="cardConfig"></app-ai-card-renderer>
  \\\`
})
export class MyComponent {
  cardConfig: AICardConfig = {
    cardTitle: 'My Card',
    sections: [
      {
        title: 'Overview',
        type: 'info',
        fields: [
          { label: 'Name', value: 'Example' },
          { label: 'Status', value: 'Active' }
        ]
      }
    ]
  };
}
\`\`\`

## Handling Events

\`\`\`typescript
@Component({
  template: \\\`
    <app-ai-card-renderer
      [cardConfig]="card"
      (sectionEvent)="onSectionEvent($event)"
      (actionEvent)="onActionEvent($event)">
    </app-ai-card-renderer>
  \\\`
})
export class CardViewerComponent {
  onSectionEvent(event: SectionEvent) {
    console.log('Section event:', event);
  }
  
  onActionEvent(event: ActionEvent) {
    switch(event.action.type) {
      case 'mail':
        window.location.href = \\\`mailto:\\\${event.action.email}\\\`;
        break;
      case 'website':
        window.open(event.action.url, '_blank');
        break;
    }
  }
}
\`\`\`

## Using MasonryGrid

For displaying multiple cards:

\`\`\`typescript
import { MasonryGridComponent } from 'osi-cards-lib';

@Component({
  imports: [MasonryGridComponent],
  template: \\\`
    <app-masonry-grid [cards]="cards" [columns]="3"></app-masonry-grid>
  \\\`
})
export class CardsPageComponent {
  cards: AICardConfig[] = [];
}
\`\`\`

## Streaming Support

For progressive card rendering:

\`\`\`typescript
import { OSICardsStreamingService } from 'osi-cards-lib';

@Component({...})
export class StreamingComponent {
  private streaming = inject(OSICardsStreamingService);
  
  async loadCard() {
    const stream = this.streaming.createStream();
    
    stream.updates$.subscribe(update => {
      this.cardConfig = update.card;
    });
    
    await stream.start(jsonChunks);
  }
}
\`\`\`

See [Streaming Documentation](/docs/streaming/overview) for more details.
`;

@Component({
  selector: 'app-library-usage-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryUsagePageComponent {
  content = pageContent;
}

export default LibraryUsagePageComponent;
