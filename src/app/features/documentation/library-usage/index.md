# Library Usage Guide

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
template: \`
<app-ai-card-renderer [cardConfig]="cardConfig"></app-ai-card-renderer>
\`
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

## Component Integration

### Standalone Component

\`\`\`typescript
import { Component, inject } from '@angular/core';
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';
import { CardDataService } from 'osi-cards-lib';

@Component({
selector: 'app-card-viewer',
standalone: true,
imports: [AICardRendererComponent],
template: \`
<app-ai-card-renderer
[cardConfig]="card$ | async"
(sectionEvent)="onSectionEvent($event)">
</app-ai-card-renderer>
\`
})
export class CardViewerComponent {
private cardData = inject(CardDataService);

card$ = this.cardData.getAllCards();

onSectionEvent(event: any) {
console.log('Section event:', event);
}
}
\`\`\`

## Service Usage

### CardDataService

\`\`\`typescript
import { inject } from '@angular/core';
import { CardDataService } from 'osi-cards-lib';

const cardData = inject(CardDataService);

// Get all cards
cardData.getAllCards().subscribe(cards => {
console.log('All cards:', cards);
});

// Get cards by type
cardData.getCardsByType('company').subscribe(cards => {
console.log('Company cards:', cards);
});

// Get specific card
cardData.getCardById('card-123').subscribe(card => {
console.log('Card:', card);
});
\`\`\`

### LLMStreamingService

\`\`\`typescript
import { inject } from '@angular/core';
import { LLMStreamingService } from 'osi-cards-lib';

const streamingService = inject(LLMStreamingService);

// Start streaming
streamingService.start(llmJsonResponse);

// Subscribe to updates
streamingService.cardUpdates$.subscribe(update => {
console.log('Card updated:', update.card);
});
\`\`\`

## Configuration Options

### Card Configuration

\`\`\`typescript
const cardConfig: AICardConfig = {
cardTitle: 'Card Title',
cardSubtitle: 'Optional Subtitle',
cardType: 'company',
sections: [
{
title: 'Section Title',
type: 'info',
fields: [
{ label: 'Label', value: 'Value' }
]
}
],
actions: [
{
label: 'Action',
type: 'primary',
action: 'https://example.com'
}
]
};
\`\`\`

## Event Handling

### Section Events

\`\`\`typescript
onSectionEvent(event: SectionRenderEvent) {
const { type, section, field, item, action } = event;

if (type === 'field') {
console.log('Field clicked:', field?.label);
} else if (type === 'item') {
console.log('Item selected:', item?.title);
} else if (type === 'action') {
console.log('Action triggered:', action?.label);
}
}
\`\`\`

## Theming

### Using CSS Variables

\`\`\`scss
:root {
--color-brand: #ff7900;
--card-padding: 1.25rem;
--card-border-radius: 12px;
}
\`\`\`

## Best Practices

1. **Use OnPush Change Detection**: For better performance
2. **Lazy Load Cards**: Load cards on demand
3. **Cache Card Data**: Use shareReplay for caching
4. **Handle Errors**: Implement error boundaries
5. **Optimize Images**: Use lazy loading for images

## Examples

See the [Examples](/docs/examples) section for complete working examples.

## API Reference

For complete API documentation, see [API Reference](/docs/api).


