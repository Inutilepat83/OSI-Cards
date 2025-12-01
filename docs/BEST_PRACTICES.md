# OSI Cards - Best Practices Guide

This guide covers best practices for using OSI Cards effectively in production applications.

## Table of Contents

- [Performance](#performance)
- [Accessibility](#accessibility)
- [Error Handling](#error-handling)
- [Security](#security)
- [Testing](#testing)
- [Code Organization](#code-organization)
- [Streaming](#streaming)
- [Memory Management](#memory-management)

---

## Performance

### 1. Use OnPush Change Detection

All OSI Cards components use `ChangeDetectionStrategy.OnPush`. Ensure your parent components do too:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent {
  // Use immutable updates
  updateCard() {
    this.card = { ...this.card, cardTitle: 'New Title' };
  }
}
```

### 2. Use trackBy in Templates

When iterating over cards or sections, always use trackBy:

```html
<app-ai-card-renderer *ngFor="let card of cards; trackBy: trackCardById" [cardConfig]="card">
</app-ai-card-renderer>
```

```typescript
trackCardById(index: number, card: AICardConfig): string {
  return card.id ?? index.toString();
}
```

### 3. Lazy Load Heavy Features

Import optional features only when needed:

```typescript
// Lazy load chart sections
const ChartSection = await import('osi-cards-lib/optional').then((m) => m.ChartSectionComponent);
```

### 4. Virtual Scrolling for Large Lists

For many cards, enable virtual scrolling:

```html
<app-masonry-grid [sections]="sections" [virtualScrollEnabled]="sections.length > 50">
</app-masonry-grid>
```

### 5. Debounce User Interactions

For rapid interactions like search:

```typescript
search$ = new Subject<string>();

ngOnInit() {
  this.search$.pipe(
    debounceTime(300),
    distinctUntilChanged()
  ).subscribe(term => this.filterCards(term));
}
```

---

## Accessibility

### 1. Semantic Structure

Ensure proper heading hierarchy:

```typescript
const card: AICardConfig = {
  cardTitle: 'Main Title', // Renders as <h1>
  sections: [
    {
      title: 'Section Title', // Renders as <h2>
      type: 'info',
      fields: [],
    },
  ],
};
```

### 2. Keyboard Navigation

All interactive elements support keyboard navigation:

- `Tab` / `Shift+Tab`: Navigate between elements
- `Enter` / `Space`: Activate buttons
- `Escape`: Close modals/dropdowns
- Arrow keys: Navigate within grids

### 3. Screen Reader Support

Provide descriptive labels:

```typescript
{
  type: 'action',
  actions: [
    {
      type: 'mail',
      label: 'Contact Support',
      ariaLabel: 'Send email to support team at support@company.com'
    }
  ]
}
```

### 4. Color Contrast

Use theme variables that ensure WCAG AA compliance:

```css
/* These maintain 4.5:1 contrast ratio */
color: var(--osi-card-foreground);
background: var(--osi-card-background);
```

### 5. Motion Preferences

Animations automatically respect `prefers-reduced-motion`:

```typescript
// Check programmatically if needed
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

---

## Error Handling

### 1. Graceful Degradation

Always provide fallback content:

```html
<app-ai-card-renderer [cardConfig]="card" *ngIf="card; else loading"> </app-ai-card-renderer>

<ng-template #loading>
  <app-card-skeleton></app-card-skeleton>
</ng-template>
```

### 2. Error Boundaries

Handle streaming errors:

```typescript
cardFacade
  .streamFromJson(json)
  .pipe(
    catchError((error) => {
      console.error('Streaming failed:', error);
      return of(cardFacade.createErrorCard(error));
    })
  )
  .subscribe((card) => this.card.set(card));
```

### 3. Validation

Validate card data before rendering:

```typescript
const validationResult = cardFacade.validate(data);
if (!validationResult.isValid) {
  console.warn('Invalid card data:', validationResult.errors);
  // Show validation errors or use default
}
```

### 4. Network Resilience

Use retry logic for API calls:

```typescript
import { retryWithBackoff } from 'osi-cards-lib';

apiCall$.pipe(
  retryWithBackoff({
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
  })
);
```

---

## Security

### 1. Input Sanitization

Never trust external data:

```typescript
import { InputValidation } from 'osi-cards-lib';

// Validate URLs
if (InputValidation.isValidUrl(userInput)) {
  // Safe to use
}

// Escape HTML
const safeText = InputValidation.escapeHtml(userInput);
```

### 2. Content Security Policy

Configure CSP headers:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; style-src 'self' 'unsafe-inline';"
/>
```

### 3. Sanitize HTML Content

When rendering HTML fields:

```typescript
import { DomSanitizer } from '@angular/platform-browser';

sanitizedContent = InputValidation.sanitizeHtml(this.sanitizer, untrustedHtml);
```

### 4. Validate Email Actions

Email actions are validated before execution:

```typescript
// EmailHandlerService validates all recipients
const result = emailHandler.buildMailtoLink(action);
if (result === null) {
  // Invalid email addresses detected
}
```

---

## Testing

### 1. Unit Test Components

```typescript
describe('CardDisplay', () => {
  it('should render card title', () => {
    const fixture = TestBed.createComponent(CardDisplay);
    fixture.componentInstance.card = mockCard;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(mockCard.cardTitle);
  });
});
```

### 2. Test Accessibility

Use automated a11y checks:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

it('should have no accessibility violations', async () => {
  const results = await axe(fixture.nativeElement);
  expect(results).toHaveNoViolations();
});
```

### 3. E2E Testing

Test complete user flows:

```typescript
test('user can interact with card actions', async ({ page }) => {
  await page.goto('/card');
  await page.click('button:has-text("Contact")');
  // Verify mailto link was triggered
});
```

### 4. Visual Regression

Use Playwright for visual testing:

```typescript
test('card renders correctly', async ({ page }) => {
  await page.goto('/card');
  await expect(page.locator('.osi-card-container')).toHaveScreenshot('card-default.png');
});
```

---

## Code Organization

### 1. Feature-Based Structure

```
src/
├── features/
│   ├── product-cards/
│   │   ├── product-card.component.ts
│   │   ├── product-card.config.ts
│   │   └── product-card.service.ts
│   └── customer-cards/
│       ├── customer-card.component.ts
│       └── customer-card.service.ts
├── shared/
│   └── card-utils.ts
└── types/
    └── card-configs.ts
```

### 2. Centralize Configuration

```typescript
// card-configs.ts
export const PRODUCT_CARD_TEMPLATE: Partial<AICardConfig> = {
  sections: [
    { type: 'info', title: 'Product Details' },
    { type: 'analytics', title: 'Performance' },
  ],
};
```

### 3. Use Services for Logic

```typescript
@Injectable()
export class CardConfigService {
  buildProductCard(product: Product): AICardConfig {
    return {
      cardTitle: product.name,
      ...PRODUCT_CARD_TEMPLATE,
      sections: this.mapProductToSections(product),
    };
  }
}
```

---

## Streaming

### 1. Show Progress

Provide visual feedback during streaming:

```html
<app-card-streaming-indicator [isStreaming]="isStreaming()" [streamingStage]="streamingStage()">
</app-card-streaming-indicator>
```

### 2. Allow Cancellation

Let users cancel long-running streams:

```typescript
stopStreaming() {
  this.cardFacade.stopStreaming();
  this.isStreaming.set(false);
}
```

### 3. Handle Partial Data

Gracefully handle incomplete cards:

```typescript
streamingState$.subscribe((state) => {
  if (state.stage === 'error' && state.card) {
    // Show partial card with error indicator
    this.showPartialCard(state.card);
  }
});
```

---

## Memory Management

### 1. Unsubscribe from Observables

Use `takeUntilDestroyed`:

```typescript
export class MyComponent {
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.cardService.cards$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cards) => (this.cards = cards));
  }
}
```

### 2. Avoid Memory Leaks

```typescript
// Use async pipe when possible
<app-ai-card-renderer
  [cardConfig]="card$ | async">
</app-ai-card-renderer>
```

### 3. Clean Up Event Listeners

```typescript
ngOnDestroy() {
  // Services clean up automatically
  // But for custom listeners:
  this.resizeObserver?.disconnect();
}
```

### 4. Limit Card Instances

For dashboards with many cards:

```typescript
// Use virtual scrolling
[virtualScrollEnabled]="true"

// Or pagination
<app-ai-card-renderer
  *ngFor="let card of paginatedCards"
  [cardConfig]="card">
</app-ai-card-renderer>
```

---

## Quick Reference Checklist

### Before Production

- [ ] Enable production mode
- [ ] Configure CSP headers
- [ ] Test with screen reader
- [ ] Run Lighthouse audit
- [ ] Check bundle size
- [ ] Test on slow network
- [ ] Verify error handling
- [ ] Review security practices

### Performance Checklist

- [ ] OnPush change detection
- [ ] trackBy on ngFor
- [ ] Lazy loaded features
- [ ] Virtual scroll for lists
- [ ] Debounced interactions
- [ ] Optimized images

### Accessibility Checklist

- [ ] Proper heading hierarchy
- [ ] Keyboard navigable
- [ ] Screen reader tested
- [ ] Color contrast verified
- [ ] Focus indicators visible
- [ ] Reduced motion respected

---

For more details, see the [API Reference](./API.md), [Theming Guide](./THEMING_GUIDE.md), and [Integration Guide](./INTEGRATION_GUIDE.md).

