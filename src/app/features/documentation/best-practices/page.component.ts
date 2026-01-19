import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../doc-page.component';

const pageContent = `# Best Practices

Follow these guidelines to get the most out of OSI Cards in your applications.

## Performance

### 1. Use OnPush Change Detection

All OSI Cards components use OnPush change detection. Ensure your parent components do too:

\`\`\`typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent { }
\`\`\`

### 2. Limit Section Count

Keep cards focused with 3-7 sections for optimal performance and UX:

\`\`\`typescript
// Good: Focused card
const card: AICardConfig = {
  cardTitle: 'Company Overview',
  sections: [
    { type: 'info', ... },
    { type: 'analytics', ... },
    { type: 'contact-card', ... }
  ]
};

// Avoid: Too many sections
const card: AICardConfig = {
  sections: [/* 15+ sections */]  // Consider splitting into multiple cards
};
\`\`\`

### 3. Use TrackBy with Lists

When rendering multiple cards, always use trackBy:

\`\`\`typescript
@for (card of cards; track card.id) {
  <app-ai-card-renderer [cardConfig]="card" />
}
\`\`\`

### 4. Lazy Load Sections

For complex sections like charts, the library handles lazy loading automatically. Ensure you're not importing heavy dependencies unnecessarily.

## Data Handling

### 1. Validate Card Data

Always validate card configurations before rendering:

\`\`\`typescript
import { isValidCardConfig, sanitizeCardConfig } from 'osi-cards-lib';

if (isValidCardConfig(data)) {
  this.cardConfig = sanitizeCardConfig(data);
} else {
  console.error('Invalid card config');
}
\`\`\`

### 2. Handle Missing Fields Gracefully

Use optional chaining and provide defaults:

\`\`\`typescript
const section = {
  title: data.title || 'Untitled',
  type: data.type || 'overview',
  fields: data.fields ?? []
};
\`\`\`

### 3. Use Proper Types

Leverage TypeScript for better developer experience:

\`\`\`typescript
import type {
  AICardConfig,
  CardSection,
  AnalyticsSection
} from 'osi-cards-lib';
\`\`\`

## Streaming

### 1. Implement Error Handling

Always handle streaming errors:

\`\`\`typescript
streamingService.streamCard(prompt).pipe(
  catchError(error => {
    console.error('Streaming failed:', error);
    return of(fallbackCard);
  })
).subscribe(card => {
  this.cardConfig = card;
});
\`\`\`

### 2. Show Loading States

Use the built-in skeleton while streaming:

\`\`\`html
<app-ai-card-renderer
  [cardConfig]="cardConfig"
  [showSkeleton]="isLoading">
</app-ai-card-renderer>
\`\`\`

### 3. Debounce Rapid Updates

For high-frequency updates, consider debouncing:

\`\`\`typescript
cardUpdates$.pipe(
  debounceTime(50),
  distinctUntilChanged()
).subscribe(update => {
  this.applyUpdate(update);
});
\`\`\`

## Theming

### 1. Use CSS Custom Properties

Customize via CSS variables instead of overriding styles:

\`\`\`css
:root {
  --osi-card-bg: #ffffff;
  --osi-card-text: #1a1a2e;
  --osi-card-border: #e5e7eb;
  --osi-card-radius: 12px;
}
\`\`\`

### 2. Support Dark Mode

Implement dark mode support:

\`\`\`css
@media (prefers-color-scheme: dark) {
  :root {
    --osi-card-bg: #1a1a2e;
    --osi-card-text: #e5e7eb;
    --osi-card-border: #374151;
  }
}
\`\`\`

### 3. Use Theme Service

For dynamic theming:

\`\`\`typescript
import { ThemeService } from 'osi-cards-lib';

themeService.setTheme('dark');
themeService.setAccentColor('#6366f1');
\`\`\`

## Accessibility

### 1. Provide Alt Text

For cards with images:

\`\`\`typescript
const section = {
  type: 'product',
  imageUrl: 'product.jpg',
  imageAlt: 'Product description for screen readers'
};
\`\`\`

### 2. Use Semantic Actions

Use appropriate action types:

\`\`\`typescript
const action = {
  type: 'mail',
  label: 'Contact Support',
  ariaLabel: 'Send email to support team'
};
\`\`\`

### 3. Test with Screen Readers

Regularly test with VoiceOver, NVDA, or JAWS.

## LLM Integration

### 1. Provide Clear Prompts

Include schema hints in your prompts:

\`\`\`typescript
const prompt = \`
Generate a company info card with:
- Info section (company details)
- Analytics section (key metrics)
- Contact section (primary contact)

Return valid JSON matching AICardConfig schema.
\`;
\`\`\`

### 2. Validate LLM Output

Always validate AI-generated content:

\`\`\`typescript
const result = await llm.generate(prompt);
const parsed = JSON.parse(result);
const validated = validateAndSanitize(parsed);
\`\`\`

### 3. Handle Partial Responses

When streaming, handle incomplete JSON:

\`\`\`typescript
try {
  const partial = JSON.parse(buffer);
  this.updateCard(partial);
} catch {
  // Buffer incomplete, wait for more data
}
\`\`\`

## Testing

### 1. Unit Test Card Configurations

\`\`\`typescript
describe('CardConfig', () => {
  it('should have valid sections', () => {
    expect(isValidCardConfig(testCard)).toBe(true);
  });
});
\`\`\`

### 2. Integration Test with Fixtures

Use the section-registry fixtures for testing:

\`\`\`typescript
import { sectionFixtures } from 'osi-cards-lib/testing';

it('should render analytics section', () => {
  component.cardConfig = sectionFixtures.analytics;
  fixture.detectChanges();
  expect(compiled.querySelector('.analytics-section')).toBeTruthy();
});
\`\`\`

### 3. Visual Regression Testing

Use tools like Percy or Chromatic for visual testing.

## Summary

- Keep cards focused (3-7 sections)
- Validate all data
- Handle errors gracefully
- Use CSS custom properties for theming
- Test thoroughly
- Consider accessibility from the start
`;

@Component({
  selector: 'app-best-practices-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BestPracticesPageComponent {
  content = pageContent;
}

export default BestPracticesPageComponent;
