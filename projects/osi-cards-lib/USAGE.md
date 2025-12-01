# OSI Cards Library - Usage Guide

Complete API documentation and usage examples for the OSI Cards library.

## Table of Contents

1. [Components](#components)
2. [Models](#models)
3. [Services](#services)
4. [Styling](#styling)
5. [Examples](#examples)

## Components

### AICardRendererComponent

Main component for rendering cards.

**Selector:** `app-ai-card-renderer`

**Inputs (all optional with defaults):**

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `cardConfig` | `AICardConfig` | `undefined` | The card configuration |
| `updateSource` | `'stream' \| 'liveEdit'` | `'stream'` | Update source type |
| `isFullscreen` | `boolean` | `false` | Fullscreen mode |
| `tiltEnabled` | `boolean` | `true` | Enable magnetic tilt effect |
| `streamingStage` | `StreamingStage` | `undefined` | `'idle'` \| `'thinking'` \| `'streaming'` \| `'complete'` |
| `streamingProgress` | `number` | `undefined` | Progress 0-1 |
| `isStreaming` | `boolean` | `false` | Streaming animation state |
| `showLoadingByDefault` | `boolean` | `true` | Show loading when no data |
| `containerWidth` | `number` | auto | Explicit width for masonry |
| `loadingMessages` | `string[]` | defaults | Custom loading messages |
| `loadingTitle` | `string` | `'Creating OSI Card'` | Loading title |

**Outputs:**
- `cardInteraction: EventEmitter<{ action: string; card: AICardConfig }>`
- `fieldInteraction: EventEmitter<CardFieldInteractionEvent>`
- `fullscreenToggle: EventEmitter<boolean>`
- `agentAction: EventEmitter<{ action: any; card: AICardConfig; agentId?: string; context?: Record<string, unknown> }>`
- `questionAction: EventEmitter<{ action: any; card: AICardConfig; question?: string }>`

**Example (with streaming/loading):**
```typescript
<app-ai-card-renderer
  [cardConfig]="myCard"
  [tiltEnabled]="true"
  (fieldInteraction)="handleFieldClick($event)"
  (agentAction)="handleAgentAction($event)">
</app-ai-card-renderer>
```

**Example (static card, no loading):**
```typescript
<app-ai-card-renderer
  [cardConfig]="myCard"
  [streamingStage]="'complete'"
  [showLoadingByDefault]="false"
  (cardInteraction)="handleAction($event)">
</app-ai-card-renderer>
```

### OsiCardsContainerComponent

Container wrapper for theme and CSS isolation.

**Selector:** `osi-cards-container`

**Inputs (all optional):**

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `theme` | `'day' \| 'night'` | `'day'` | Theme to apply |
| `strictIsolation` | `boolean` | `false` | Enable strict CSS containment |

**Example (Container + Renderer Pattern):**
```html
<osi-cards-container [theme]="'night'">
  <app-ai-card-renderer
    [cardConfig]="card"
    [streamingStage]="'complete'"
    [showLoadingByDefault]="false"
    (cardInteraction)="onAction($event)">
  </app-ai-card-renderer>
</osi-cards-container>
```

**Example (Multiple Cards):**
```html
@for (item of items; track item.id) {
  <osi-cards-container [theme]="cardTheme">
    <app-ai-card-renderer
      [cardConfig]="item.card"
      [containerWidth]="cardContainerWidth"
      [streamingStage]="'complete'"
      [showLoadingByDefault]="false"
      (cardInteraction)="onCardActionClick($event)">
    </app-ai-card-renderer>
  </osi-cards-container>
}
```

### SectionRendererComponent

Renders individual sections within a card.

**Selector:** `app-section-renderer`

**Inputs:**
- `section: CardSection` - The section configuration (required)

**Outputs:**
- `sectionEvent: EventEmitter<SectionRenderEvent>`

### MasonryGridComponent

Responsive masonry layout for sections with intelligent column negotiation.

**Selector:** `app-masonry-grid`

**Inputs:**
- `sections: CardSection[]` - Array of sections
- `gap: number` - Gap between items in pixels (default: 12)
- `minColumnWidth: number` - Minimum column width in pixels (default: 260)
- `maxColumns: number` - Maximum number of columns (default: 4)
- `containerWidth?: number` - Optional explicit container width for reliable initial layout

**Outputs:**
- `sectionEvent: EventEmitter<SectionRenderEvent>`
- `layoutChange: EventEmitter<MasonryLayoutInfo>`

**Grid Configuration:**
The grid uses standardized values that can be configured:
- Minimum column width: 200px (ensures readable cards)
- Maximum columns: 4 (adapts to container width)
- Gap: 12px (consistent spacing between items)

**Column Calculation:**
The number of columns is calculated as: `floor((containerWidth + gap) / (minColumnWidth + gap))`

Example column counts:
- 424px container → 2 columns
- 636px container → 3 columns
- 848px+ container → 4 columns

### CardSkeletonComponent

Loading skeleton for cards.

**Selector:** `app-card-skeleton`

**Inputs:**
- `cardTitle: string` - Card title
- `sectionCount: number` - Number of sections
- `isFullscreen: boolean` - Fullscreen mode

### CardPreviewComponent

Preview wrapper component.

**Selector:** `app-card-preview`

**Inputs:**
- `generatedCard: AICardConfig | null`
- `isGenerating: boolean`
- `isInitialized: boolean`
- `isFullscreen: boolean`

**Outputs:**
- `cardInteraction`, `fieldInteraction`, `fullscreenToggle`, `agentAction`, `questionAction`

## Models

### AICardConfig

Main card configuration interface.

```typescript
interface AICardConfig {
  id?: string;
  cardTitle: string;
  cardSubtitle?: string;
  cardType?: CardType;
  description?: string;
  columns?: 1 | 2 | 3;
  sections: CardSection[];
  actions?: CardAction[];
  meta?: Record<string, unknown>;
  processedAt?: number;
}
```

### CardSection

Section configuration.

```typescript
interface CardSection {
  id?: string;
  title: string;
  type: SectionType;
  description?: string;
  subtitle?: string;
  columns?: number;

  /**
   * Explicit column span - how many columns this section should span.
   * Takes precedence over preferredColumns.
   */
  colSpan?: number;

  /**
   * Preferred column count (1, 2, 3, or 4) - an adaptive hint.
   * The section will use this width when available, but gracefully
   * degrade to fewer columns when constrained.
   */
  preferredColumns?: 1 | 2 | 3 | 4;

  fields?: CardField[];
  items?: CardItem[];
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut';
  chartData?: ChartData;
  meta?: Record<string, unknown>;
}
```

**preferredColumns vs colSpan:**
- `colSpan`: Hard override - section will always try to span this many columns
- `preferredColumns`: Adaptive hint - section prefers this width but adapts to constraints

Default preferred columns per section type:
- `contact-card`, `network-card`, `project`: 1 column (compact)
- `analytics`, `chart`, `map`, `financials`, `product`, `solutions`, `event`, `list`: 2 columns (medium)
- `overview`, `info`: 2 columns (can expand based on content)

### CardField

Field data structure.

```typescript
interface CardField {
  id?: string;
  label?: string;
  title?: string;
  value?: string | number | boolean | null;
  icon?: string;
  format?: 'currency' | 'percentage' | 'number' | 'text';
  trend?: 'up' | 'down' | 'stable' | 'neutral';
  // ... many more optional properties
}
```

### CardAction

Action button configuration.

**Mail Action:**
```typescript
{
  type: 'mail',
  label: 'Send Email',
  variant: 'primary',
  email: {
    contact: {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Manager'
    },
    subject: 'Subject',
    body: 'Email body'
  }
}
```

**Website Action:**
```typescript
{
  type: 'website',
  label: 'Visit Website',
  variant: 'primary',
  url: 'https://example.com'
}
```

**Agent Action:**
```typescript
{
  type: 'agent',
  label: 'Contact Agent',
  variant: 'outline',
  agentId: 'agent-123',
  agentContext: { context: 'sales' }
}
```

**Question Action:**
```typescript
{
  type: 'question',
  label: 'Ask Question',
  variant: 'ghost',
  question: 'What is the status?'
}
```

## Services

### IconService

Maps field names to icon names.

```typescript
import { IconService } from 'osi-cards-lib';

constructor(private iconService: IconService) {}

getIcon(fieldName: string): string {
  return this.iconService.getFieldIcon(fieldName);
}
```

### SectionNormalizationService

Normalizes and sorts sections.

```typescript
import { SectionNormalizationService } from 'osi-cards-lib';

constructor(private normalizationService: SectionNormalizationService) {}

normalizeSections(sections: CardSection[]): CardSection[] {
  return this.normalizationService.normalizeAndSortSections(sections);
}
```

### MagneticTiltService

Provides tilt calculations for magnetic tilt effect.

```typescript
import { MagneticTiltService } from 'osi-cards-lib';

constructor(private tiltService: MagneticTiltService) {}

// Subscribe to tilt calculations
this.tiltService.tiltCalculations$.subscribe(calculations => {
  // Apply tilt styles
});
```

### SectionUtilsService

Utility methods for sections (trends, status, formatting).

```typescript
import { SectionUtilsService } from 'osi-cards-lib';

constructor(private utils: SectionUtilsService) {}

getTrendIcon(trend: string): string {
  return this.utils.getTrendIcon(trend);
}

formatChange(change: number): string {
  return this.utils.formatChange(change);
}
```

## Styling

### Import Styles

```scss
// In your main styles.scss
@import 'osi-cards-lib/styles/_styles';
```

### Customization

The library uses CSS variables for theming. You can override them:

```scss
:root {
  --card-padding: 20px;
  --card-border-radius: 8px;
  --primary: #FF7900;
  // ... more variables
}
```

See `src/lib/styles/core/_variables.scss` for all available variables.

### Tailwind CSS

If you use Tailwind CSS, include it in your main styles:

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

@import 'osi-cards-lib/styles';
```

## Examples

### Static Card (No Streaming)

For displaying cards with pre-loaded data (no AI streaming):

```typescript
import { Component } from '@angular/core';
import { OsiCardsContainerComponent, AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-static-card',
  standalone: true,
  imports: [OsiCardsContainerComponent, AICardRendererComponent],
  template: `
    <osi-cards-container [theme]="'day'">
      <app-ai-card-renderer
        [cardConfig]="card"
        [streamingStage]="'complete'"
        [showLoadingByDefault]="false"
        (cardInteraction)="onAction($event)">
      </app-ai-card-renderer>
    </osi-cards-container>
  `
})
export class StaticCardComponent {
  card: AICardConfig = {
    cardTitle: 'My Static Card',
    sections: [
      {
        title: 'Information',
        type: 'info',
        fields: [
          { label: 'Name', value: 'Example' },
          { label: 'Status', value: 'Active' }
        ]
      }
    ]
  };

  onAction(event: { action: string; card: AICardConfig }): void {
    console.log('Action clicked:', event);
  }
}
```

**Key settings for static cards:**
- `[streamingStage]="'complete'"` - Marks the card as fully loaded
- `[showLoadingByDefault]="false"` - Prevents loading spinner from appearing

### Streaming Card (AI Integration)

For progressive card generation with loading animations:

```typescript
import { Component } from '@angular/core';
import { OsiCardsContainerComponent, AICardRendererComponent, AICardConfig, StreamingStage } from 'osi-cards-lib';

@Component({
  selector: 'app-streaming-card',
  standalone: true,
  imports: [OsiCardsContainerComponent, AICardRendererComponent],
  template: `
    <button (click)="generate()" [disabled]="isStreaming">Generate</button>

    <osi-cards-container [theme]="'day'">
      <app-ai-card-renderer
        [cardConfig]="card"
        [isStreaming]="isStreaming"
        [streamingStage]="streamingStage"
        [streamingProgress]="progress"
        [showLoadingByDefault]="true"
        [loadingMessages]="messages"
        (cardInteraction)="onAction($event)">
      </app-ai-card-renderer>
    </osi-cards-container>
  `
})
export class StreamingCardComponent {
  card: AICardConfig | undefined;
  isStreaming = false;
  streamingStage: StreamingStage = 'idle';
  progress = 0;
  messages = ['Processing...', 'Analyzing...'];

  async generate(): Promise<void> {
    this.card = undefined;
    this.isStreaming = true;
    this.streamingStage = 'thinking';

    await new Promise(r => setTimeout(r, 2000));
    this.streamingStage = 'streaming';
    this.progress = 0.5;
    this.card = { cardTitle: 'Result', sections: [] };

    await new Promise(r => setTimeout(r, 1000));
    this.progress = 1;
    this.streamingStage = 'complete';
    this.isStreaming = false;
    this.card.sections = [{ title: 'Done', type: 'info', fields: [{ label: 'Status', value: 'Complete' }] }];
  }

  onAction(event: any): void {
    console.log('Action:', event);
  }
}
```

**Key settings for streaming cards:**
- `[isStreaming]="true"` - Enables streaming animations
- `[streamingStage]` - Controls the current phase: `'thinking'` | `'streaming'` | `'complete'`
- `[streamingProgress]` - Progress value from 0 to 1
- `[showLoadingByDefault]="true"` - Shows loading UI when card is undefined
- `[loadingMessages]` - Custom messages during loading

### Quick Reference: Streaming vs Static

| Scenario | streamingStage | showLoadingByDefault | isStreaming |
|----------|----------------|---------------------|-------------|
| Static card | `'complete'` | `false` | not needed |
| AI generating | `'thinking'` / `'streaming'` | `true` | `true` |
| AI complete | `'complete'` | `true` | `false` |

### Complete Card Example

```typescript
import { Component } from '@angular/core';
import { AICardRendererComponent } from 'osi-cards-lib';
import { AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-card-example',
  standalone: true,
  imports: [AICardRendererComponent],
  template: `
    <app-ai-card-renderer
      [cardConfig]="card"
      (fieldInteraction)="onFieldClick($event)"
      (agentAction)="onAgentAction($event)">
    </app-ai-card-renderer>
  `
})
export class CardExampleComponent {
  card: AICardConfig = {
    cardTitle: 'Acme Corporation',
    cardSubtitle: 'Technology Solutions Provider',
    sections: [
      {
        title: 'Company Overview',
        type: 'overview',
        fields: [
          { label: 'Industry', value: 'Technology' },
          { label: 'Employees', value: '250' },
          { label: 'Founded', value: '2010' }
        ]
      },
      {
        title: 'Key Metrics',
        type: 'analytics',
        fields: [
          {
            label: 'Revenue',
            value: 5000000,
            change: 15,
            trend: 'up'
          },
          {
            label: 'Growth',
            value: 25,
            change: 5,
            trend: 'up'
          }
        ]
      },
      {
        title: 'Contact',
        type: 'contact-card',
        fields: [
          {
            name: 'John Doe',
            role: 'CEO',
            email: 'john@acme.com',
            phone: '+1-555-0100'
          }
        ]
      }
    ],
    actions: [
      {
        type: 'website',
        label: 'Visit Website',
        variant: 'primary',
        url: 'https://acme.com'
      },
      {
        type: 'mail',
        label: 'Send Email',
        variant: 'outline',
        email: {
          contact: {
            name: 'John Doe',
            email: 'john@acme.com',
            role: 'CEO'
          },
          subject: 'Inquiry about Acme Corporation',
          body: 'Hello John,'
        }
      }
    ]
  };

  onFieldClick(event: any): void {
    console.log('Field clicked:', event);
  }

  onAgentAction(event: any): void {
    console.log('Agent action:', event);
  }
}
```

### Multiple Cards

```typescript
@Component({
  template: `
    <div class="cards-grid">
      <app-ai-card-renderer
        *ngFor="let card of cards"
        [cardConfig]="card">
      </app-ai-card-renderer>
    </div>
  `
})
export class MultipleCardsComponent {
  cards: AICardConfig[] = [
    // ... card configurations
  ];
}
```

### Custom Styling

```scss
// Override library variables
:root {
  --card-padding: 24px;
  --card-border-radius: 12px;
  --primary: #FF7900;
  --foreground: #FFFFFF;
  --background: #0A0A0A;
}

// Custom card styles
app-ai-card-renderer {
  max-width: 1200px;
  margin: 0 auto;
}
```

## Section Types Reference

### Info Section
```typescript
{
  title: 'Information',
  type: 'info',
  fields: [
    { label: 'Key', value: 'Value' }
  ]
}
```

### Analytics Section
```typescript
{
  title: 'Metrics',
  type: 'analytics',
  fields: [
    {
      label: 'Revenue',
      value: 1000000,
      change: 15,
      trend: 'up',
      percentage: 75
    }
  ]
}
```

### Contact Card Section
```typescript
{
  title: 'Contacts',
  type: 'contact-card',
  fields: [
    {
      name: 'John Doe',
      role: 'CEO',
      email: 'john@example.com',
      phone: '+1-555-0100',
      avatar: 'https://...'
    }
  ]
}
```

### Chart Section
```typescript
{
  title: 'Sales Chart',
  type: 'chart',
  chartType: 'bar',
  fields: [
    { label: 'Q1', value: 100 },
    { label: 'Q2', value: 150 },
    { label: 'Q3', value: 120 }
  ]
}
```

### Map Section
```typescript
{
  title: 'Locations',
  type: 'map',
  fields: [
    {
      name: 'Headquarters',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      address: '123 Main St, New York, NY'
    }
  ]
}
```

See the source code for all section types and their specific field requirements.

## TypeScript Support

All interfaces and types are exported and fully typed:

```typescript
import {
  AICardConfig,
  CardSection,
  CardField,
  CardItem,
  CardAction,
  CardTypeGuards,
  CardUtils
} from 'osi-cards-lib';

// Type guards
if (CardTypeGuards.isAICardConfig(data)) {
  // data is AICardConfig
}

// Utilities
const sanitized = CardUtils.sanitizeCardConfig(rawData);
```

## Troubleshooting

### Styles Not Loading

Ensure you've imported the styles in your `angular.json` or main `styles.scss`:

```scss
@import 'osi-cards-lib/styles';
```

### Icons Not Showing

Make sure `LucideIconsModule` is imported. The library includes it, but if you're using custom icons, ensure `lucide-angular` is installed.

### Build Errors

Ensure all peer dependencies are installed:

```bash
npm install @angular/common@^20.0.0 @angular/core@^20.0.0 @angular/animations@^20.0.0 lucide-angular@^0.548.0 rxjs@~7.8.0
```

## Support

For issues, questions, or contributions, please refer to the main project repository.

