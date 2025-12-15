# Best Practices

Comprehensive best practices guide for using OSI Cards effectively.

## Performance

### 1. Use OnPush Change Detection

```typescript
@Component({
  selector: 'app-card-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

### 2. Lazy Load Cards

```typescript
// Load cards on demand
cardData
  .getCardsByType('company')
  .pipe(
    take(10), // Limit initial load
    shareReplay(1) // Cache results
  )
  .subscribe();
```

### 3. Virtual Scrolling for Large Lists

```typescript
// Use Angular CDK virtual scrolling for many cards
<cdk-virtual-scroll-viewport itemSize="400">
  <app-ai-card-renderer
    *cdkVirtualFor="let card of cards$"
    [cardConfig]="card">
  </app-ai-card-renderer>
</cdk-virtual-scroll-viewport>
```

## Data Management

### 1. Cache Card Data

```typescript
private cards$ = this.cardData.getAllCards().pipe(
  shareReplay(1)
);
```

### 2. Handle Loading States

```typescript
cards$ = this.cardData.getAllCards().pipe(
  startWith(null),
  map((cards) => ({ cards, loading: cards === null }))
);
```

### 3. Error Handling

```typescript
cards$ = this.cardData.getAllCards().pipe(
  catchError((error) => {
    console.error('Error loading cards:', error);
    return of([]);
  })
);
```

## Section Types

### 1. Choose Appropriate Section Types

- **Info**: For key-value pairs and metadata
- **Analytics**: For metrics and KPIs
- **List**: For structured lists
- **Chart**: For data visualization
- **Map**: For geographic data

### 2. Optimize Section Data

```typescript
// Good: Structured data
{
  title: 'Metrics',
  type: 'analytics',
  fields: [
    { label: 'Growth', value: '85%', percentage: 85 }
  ]
}

// Avoid: Unstructured or excessive data
{
  title: 'Data',
  type: 'info',
  fields: [
    // Too many fields without grouping
  ]
}
```

## LLM Integration

### 1. Structured Prompts

```
Generate a card for [entity] with:
- Title: [title]
- Sections: [section types]
- Actions: [actions]

Return valid JSON following AICardConfig schema.
```

### 2. Validate LLM Responses

```typescript
try {
  const card = JSON.parse(llmResponse);
  if (isValidCardConfig(card)) {
    this.cardConfig = card;
  }
} catch (error) {
  console.error('Invalid card JSON:', error);
}
```

### 3. Progressive Updates

```typescript
streamingService.cardUpdates$.subscribe((update) => {
  // Show partial card during streaming
  this.cardConfig = update.card;
  this.isStreaming = update.isComplete === false;
});
```

## Accessibility

### 1. Semantic HTML

Cards use semantic HTML by default. Ensure proper heading hierarchy.

### 2. ARIA Labels

```typescript
<app-ai-card-renderer
  [cardConfig]="card"
  [attr.aria-label]="card.cardTitle">
</app-ai-card-renderer>
```

### 3. Keyboard Navigation

All interactive elements support keyboard navigation out of the box.

## Theming

### 1. Use CSS Variables

```scss
:root {
  --color-brand: #ff7900;
  --card-padding: 1.25rem;
  --card-border-radius: 12px;
}
```

### 2. Consistent Spacing

```scss
.card {
  padding: var(--card-padding);
  margin-bottom: var(--spacing-md);
}
```

## Security

### 1. Sanitize User Input

```typescript
import { DomSanitizer } from '@angular/platform-browser';

const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, userInput);
```

### 2. Validate Card Data

```typescript
function isValidCardConfig(card: any): card is AICardConfig {
  return (
    card &&
    typeof card.cardTitle === 'string' &&
    Array.isArray(card.sections) &&
    card.sections.length > 0
  );
}
```

## Testing

### 1. Unit Tests

```typescript
it('should render card', () => {
  const card: AICardConfig = {
    cardTitle: 'Test Card',
    sections: [{ title: 'Test', type: 'info', fields: [] }],
  };

  component.cardConfig = card;
  fixture.detectChanges();

  expect(component).toBeTruthy();
});
```

### 2. Integration Tests

Test card generation from LLM responses and data providers.

## Common Pitfalls

### 1. Over-nesting Sections

Avoid too many nested sections. Keep structure flat when possible.

### 2. Missing Error Handling

Always handle errors when loading cards or processing LLM responses.

### 3. Ignoring Loading States

Show loading indicators during card generation and data fetching.

### 4. Not Caching Data

Cache card data to avoid unnecessary API calls.

## Related Documentation

- [Section Types](/docs/section-types)
- [LLM Integration](/docs/llm-integration)
- [API Reference](/docs/api)








