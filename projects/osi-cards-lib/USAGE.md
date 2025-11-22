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

**Inputs:**
- `cardConfig: AICardConfig` - The card configuration (required)
- `updateSource: 'stream' | 'liveEdit'` - Update source type (default: 'stream')
- `isFullscreen: boolean` - Fullscreen mode (default: false)
- `tiltEnabled: boolean` - Enable magnetic tilt effect (default: true)

**Outputs:**
- `cardInteraction: EventEmitter<{ action: string; card: AICardConfig }>`
- `fieldInteraction: EventEmitter<CardFieldInteractionEvent>`
- `fullscreenToggle: EventEmitter<boolean>`
- `agentAction: EventEmitter<{ action: any; card: AICardConfig; agentId?: string; context?: Record<string, unknown> }>`
- `questionAction: EventEmitter<{ action: any; card: AICardConfig; question?: string }>`

**Example:**
```typescript
<app-ai-card-renderer
  [cardConfig]="myCard"
  [tiltEnabled]="true"
  (fieldInteraction)="handleFieldClick($event)"
  (agentAction)="handleAgentAction($event)">
</app-ai-card-renderer>
```

### SectionRendererComponent

Renders individual sections within a card.

**Selector:** `app-section-renderer`

**Inputs:**
- `section: CardSection` - The section configuration (required)

**Outputs:**
- `sectionEvent: EventEmitter<SectionRenderEvent>`

### MasonryGridComponent

Responsive masonry layout for sections.

**Selector:** `app-masonry-grid`

**Inputs:**
- `sections: CardSection[]` - Array of sections
- `gap: number` - Gap between items (default: 12)
- `minColumnWidth: number` - Minimum column width (default: 260)
- `maxColumns: number` - Maximum columns (default: 4)

**Outputs:**
- `sectionEvent: EventEmitter<SectionRenderEvent>`
- `layoutChange: EventEmitter<MasonryLayoutInfo>`

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
  colSpan?: number;
  fields?: CardField[];
  items?: CardItem[];
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut';
  chartData?: ChartData;
  meta?: Record<string, unknown>;
}
```

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
import { IconService } from '@osi/cards-lib';

constructor(private iconService: IconService) {}

getIcon(fieldName: string): string {
  return this.iconService.getFieldIcon(fieldName);
}
```

### SectionNormalizationService

Normalizes and sorts sections.

```typescript
import { SectionNormalizationService } from '@osi/cards-lib';

constructor(private normalizationService: SectionNormalizationService) {}

normalizeSections(sections: CardSection[]): CardSection[] {
  return this.normalizationService.normalizeAndSortSections(sections);
}
```

### MagneticTiltService

Provides tilt calculations for magnetic tilt effect.

```typescript
import { MagneticTiltService } from '@osi/cards-lib';

constructor(private tiltService: MagneticTiltService) {}

// Subscribe to tilt calculations
this.tiltService.tiltCalculations$.subscribe(calculations => {
  // Apply tilt styles
});
```

### SectionUtilsService

Utility methods for sections (trends, status, formatting).

```typescript
import { SectionUtilsService } from '@osi/cards-lib';

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
@import '@osi/cards-lib/styles/_styles';
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

@import '@osi/cards-lib/styles';
```

## Examples

### Complete Card Example

```typescript
import { Component } from '@angular/core';
import { AICardRendererComponent } from '@osi/cards-lib';
import { AICardConfig } from '@osi/cards-lib';

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
} from '@osi/cards-lib';

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
@import '@osi/cards-lib/styles';
```

### Icons Not Showing

Make sure `LucideIconsModule` is imported. The library includes it, but if you're using custom icons, ensure `lucide-angular` is installed.

### Build Errors

Ensure all peer dependencies are installed:

```bash
npm install @angular/common@^17.0.0 @angular/core@^17.0.0 @angular/animations@^17.0.0 lucide-angular@^0.548.0 rxjs@~7.8.0
```

## Support

For issues, questions, or contributions, please refer to the main project repository.

