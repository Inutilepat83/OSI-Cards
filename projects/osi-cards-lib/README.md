# OSI Cards Library

A comprehensive Angular library for rendering AI-generated cards with rich section types, streaming support, and complete CSS encapsulation.

## Features

- **17+ Section Types** - Info, Analytics, Chart, List, Contact, Network, Map, Event, Product, Solutions, Financials, and more
- **CSS Encapsulation** - Shadow DOM isolation with CSS Layers for easy style overrides
- **Streaming Support** - Progressive card rendering with LLM-style streaming simulation
- **Theme System** - Built-in themes (day/night) with full customization via CSS custom properties
- **Plugin Architecture** - Extend with custom section types
- **Accessibility** - WCAG compliant with keyboard navigation and screen reader support
- **Performance** - OnPush change detection, virtual scrolling, and optimized rendering

## Installation

```bash
npm install osi-cards-lib
```

### Peer Dependencies

```bash
npm install @angular/common@^20.0.0 @angular/core@^20.0.0 @angular/animations@^20.0.0 @angular/platform-browser@^20.0.0 lucide-angular@^0.548.0 rxjs@~7.8.0
```

### Optional Dependencies (for charts and maps)

```bash
npm install chart.js leaflet
```

---

## Quick Start

### Step 1: Configure Providers (Required)

In your `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards(),  // Required for animations and library functionality
    // ... your other providers
  ]
};
```

### Step 2: Import Styles

In your `src/styles.scss`:

```scss
@import 'osi-cards-lib/styles/_styles';
```

### Step 3: Use the Component

---

## Integration: Streaming vs Static

### Option A: Static Card (No Streaming)

Use this when you already have the card data and don't need loading animations.

**TypeScript:**

```typescript
import { Component } from '@angular/core';
import { OsiCardsContainerComponent, AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-static-card',
  standalone: true,
  imports: [OsiCardsContainerComponent, AICardRendererComponent],
  templateUrl: './static-card.component.html'
})
export class StaticCardComponent {
  cardTheme: 'day' | 'night' = 'day';

  card: AICardConfig = {
    cardTitle: 'Company Profile',
    sections: [
      {
        title: 'Overview',
        type: 'info',
        fields: [
          { label: 'Industry', value: 'Technology' },
          { label: 'Employees', value: '500+' }
        ]
      }
    ]
  };

  onCardAction(event: { action: string; card: AICardConfig }): void {
    console.log('Action:', event);
  }
}
```

**HTML:**

```html
<osi-cards-container [theme]="cardTheme">
  <app-ai-card-renderer
    [cardConfig]="card"
    [streamingStage]="'complete'"
    [showLoadingByDefault]="false"
    (cardInteraction)="onCardAction($event)">
  </app-ai-card-renderer>
</osi-cards-container>
```

**Key Settings:**
- `[streamingStage]="'complete'"` → Card is fully loaded
- `[showLoadingByDefault]="false"` → No loading spinner

---

### Option B: With Streaming (AI/LLM Integration)

Use this when generating cards progressively from an AI service.

**TypeScript:**

```typescript
import { Component } from '@angular/core';
import { OsiCardsContainerComponent, AICardRendererComponent, AICardConfig, StreamingStage } from 'osi-cards-lib';

@Component({
  selector: 'app-streaming-card',
  standalone: true,
  imports: [OsiCardsContainerComponent, AICardRendererComponent],
  templateUrl: './streaming-card.component.html'
})
export class StreamingCardComponent {
  cardTheme: 'day' | 'night' = 'day';

  // Streaming state
  card: AICardConfig | undefined;
  isStreaming = false;
  streamingStage: StreamingStage = 'idle';
  streamingProgress = 0;

  // Custom loading messages (optional)
  loadingMessages = [
    'Analyzing data...',
    'Processing request...',
    'Generating insights...'
  ];

  async generateCard(): Promise<void> {
    // Start streaming
    this.card = undefined;
    this.isStreaming = true;
    this.streamingStage = 'thinking';
    this.streamingProgress = 0;

    // Simulate AI thinking phase
    await this.delay(2000);

    // Start streaming content
    this.streamingStage = 'streaming';
    this.streamingProgress = 0.2;

    // Progressive card building (simulate chunks from AI)
    this.card = { cardTitle: 'Analysis Results', sections: [] };

    await this.delay(800);
    this.streamingProgress = 0.5;
    this.card.sections.push({
      title: 'Summary',
      type: 'info',
      fields: [{ label: 'Status', value: 'Processing...' }]
    });

    await this.delay(800);
    this.streamingProgress = 0.8;
    this.card.sections.push({
      title: 'Metrics',
      type: 'analytics',
      fields: [{ label: 'Score', value: '92%', trend: 'up' }]
    });

    await this.delay(500);

    // Complete
    this.streamingProgress = 1;
    this.streamingStage = 'complete';
    this.isStreaming = false;

    // Final card state
    this.card.sections[0].fields = [{ label: 'Status', value: 'Complete' }];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  onCardAction(event: { action: string; card: AICardConfig }): void {
    console.log('Action:', event);
  }
}
```

**HTML:**

```html
<button (click)="generateCard()" [disabled]="isStreaming">
  {{ isStreaming ? 'Generating...' : 'Generate Card' }}
</button>

<osi-cards-container [theme]="cardTheme">
  <app-ai-card-renderer
    [cardConfig]="card"
    [isStreaming]="isStreaming"
    [streamingStage]="streamingStage"
    [streamingProgress]="streamingProgress"
    [showLoadingByDefault]="true"
    [loadingMessages]="loadingMessages"
    [loadingTitle]="'AI Analysis'"
    (cardInteraction)="onCardAction($event)">
  </app-ai-card-renderer>
</osi-cards-container>
```

**Key Settings:**
- `[isStreaming]="isStreaming"` → Controls streaming animation
- `[streamingStage]="streamingStage"` → `'idle'` | `'thinking'` | `'streaming'` | `'complete'`
- `[streamingProgress]="streamingProgress"` → Progress bar (0-1)
- `[showLoadingByDefault]="true"` → Shows loading when no card data
- `[loadingMessages]` → Custom messages during loading

---

### Comparison Table

| Feature | Static Card | Streaming Card |
|---------|-------------|----------------|
| `[cardConfig]` | Always provided | Starts `undefined`, built progressively |
| `[streamingStage]` | `'complete'` | `'idle'` → `'thinking'` → `'streaming'` → `'complete'` |
| `[showLoadingByDefault]` | `false` | `true` |
| `[isStreaming]` | Not needed | `true` during generation |
| `[streamingProgress]` | Not needed | `0` to `1` |
| Loading animation | None | Shows animated loading state |
| Use case | Pre-loaded data | AI/LLM generation |

---

## Using Container + Renderer Pattern (Recommended for Lists)

When displaying cards in lists or needing more control, use `osi-cards-container` with `app-ai-card-renderer`:

### TypeScript

```typescript
import { Component } from '@angular/core';
import {
  OsiCardsContainerComponent,
  AICardRendererComponent,
  AICardConfig
} from 'osi-cards-lib';

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [OsiCardsContainerComponent, AICardRendererComponent],
  templateUrl: './card-list.component.html'
})
export class CardListComponent {
  cardTheme: 'day' | 'night' = 'day';
  cardContainerWidth = 600; // Optional: explicit width

  cards: { id: string; card: AICardConfig }[] = [
    {
      id: '1',
      card: {
        cardTitle: 'Card 1',
        sections: [{ title: 'Info', type: 'info', fields: [{ label: 'Status', value: 'Active' }] }]
      }
    },
    {
      id: '2',
      card: {
        cardTitle: 'Card 2',
        sections: [{ title: 'Info', type: 'info', fields: [{ label: 'Status', value: 'Pending' }] }]
      }
    }
  ];

  onCardActionClick(event: { action: string; card: AICardConfig }): void {
    console.log('Action clicked:', event);
  }
}
```

### HTML

```html
<!-- Loop through cards -->
@for (item of cards; track item.id) {
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

### Why Use This Pattern?

- **Theme at container level** - Apply theme once for all nested cards
- **CSS isolation** - Container provides style boundaries
- **Explicit control** - Fine-grained control over each card's behavior
- **No loading state** - `[showLoadingByDefault]="false"` for static data
- **Complete stage** - `[streamingStage]="'complete'"` marks card as fully loaded

---

## Using AICardRendererComponent (Lower-Level API)

For more control, use `AICardRendererComponent` directly:

### TypeScript

```typescript
import { Component } from '@angular/core';
import { AICardRendererComponent, AICardConfig, CardFieldInteractionEvent } from 'osi-cards-lib';

@Component({
  selector: 'app-card-demo',
  standalone: true,
  imports: [AICardRendererComponent],
  templateUrl: './card-demo.component.html'
})
export class CardDemoComponent {
  card: AICardConfig = {
    cardTitle: 'My Card',
    sections: [
      {
        title: 'Overview',
        type: 'overview',
        fields: [
          { label: 'Status', value: 'Active' },
          { label: 'Type', value: 'Premium' }
        ]
      }
    ]
  };

  onFieldClick(event: CardFieldInteractionEvent): void {
    console.log('Field clicked:', event);
  }

  onAgentAction(event: any): void {
    console.log('Agent action triggered:', event);
  }
}
```

### HTML

```html
<app-ai-card-renderer
  [cardConfig]="card"
  [tiltEnabled]="true"
  (fieldInteraction)="onFieldClick($event)"
  (agentAction)="onAgentAction($event)">
</app-ai-card-renderer>
```

---

## Usage With Streaming

For AI/LLM streaming scenarios:

### TypeScript

```typescript
import { Component } from '@angular/core';
import { OsiCardsComponent, AICardConfig, StreamingStage } from 'osi-cards-lib';

@Component({
  selector: 'app-streaming-demo',
  standalone: true,
  imports: [OsiCardsComponent],
  templateUrl: './streaming-demo.component.html'
})
export class StreamingDemoComponent {
  card: AICardConfig | undefined;
  isStreaming = false;
  streamingStage: StreamingStage = 'idle';
  streamingProgress = 0;

  // Custom loading messages (optional)
  loadingMessages = [
    'Analyzing data...',
    'Processing results...',
    'Almost there...'
  ];

  startStreaming(): void {
    this.isStreaming = true;
    this.streamingStage = 'thinking';

    // Simulate streaming - in real app, this comes from your AI service
    setTimeout(() => {
      this.streamingStage = 'streaming';
      this.simulateCardStreaming();
    }, 2000);
  }

  private simulateCardStreaming(): void {
    // Progressively build card
    this.streamingProgress = 0.3;
    this.card = {
      cardTitle: 'Generating...',
      sections: []
    };

    setTimeout(() => {
      this.streamingProgress = 0.7;
      this.card = {
        cardTitle: 'Analysis Results',
        sections: [
          { title: 'Summary', type: 'info', fields: [{ label: 'Status', value: 'Processing' }] }
        ]
      };
    }, 1000);

    setTimeout(() => {
      this.streamingProgress = 1;
      this.streamingStage = 'complete';
      this.isStreaming = false;
      this.card = {
        cardTitle: 'Analysis Results',
        sections: [
          { title: 'Summary', type: 'info', fields: [{ label: 'Status', value: 'Complete' }] },
          { title: 'Metrics', type: 'analytics', fields: [{ label: 'Score', value: '95%' }] }
        ]
      };
    }, 2000);
  }
}
```

### HTML

```html
<button (click)="startStreaming()">Start Analysis</button>

<osi-cards
  [card]="card"
  [isStreaming]="isStreaming"
  [streamingStage]="streamingStage"
  [streamingProgress]="streamingProgress"
  [loadingMessages]="loadingMessages"
  [loadingTitle]="'Analyzing...'"
  [showLoadingByDefault]="true">
</osi-cards>
```

---

## Theme Configuration

**Theme is NOT mandatory.** Cards default to `'day'` (light theme).

### Per-Component Theme

```html
<!-- Light theme (default) -->
<osi-cards [card]="card"></osi-cards>

<!-- Explicit light theme -->
<osi-cards [card]="card" [theme]="'day'"></osi-cards>

<!-- Dark theme -->
<osi-cards [card]="card" [theme]="'night'"></osi-cards>
```

### Global Theme via Provider

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards({
      defaultTheme: 'night'  // Set global default theme
    })
  ]
};
```

### Dynamic Theme Switching

```typescript
import { Component, inject } from '@angular/core';
import { ThemeService } from 'osi-cards-lib';

@Component({...})
export class MyComponent {
  private themeService = inject(ThemeService);

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  setDarkTheme(): void {
    this.themeService.setTheme('dark');
  }

  followSystem(): void {
    this.themeService.setTheme('system');
  }
}
```

---

## Complete Example

### `app.config.ts`

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards(),  // Enable library with animations
    provideRouter([])
  ]
};
```

### `styles.scss`

```scss
@import 'osi-cards-lib/styles/_styles';

// Optional: Override theme variables
:root {
  --osi-card-accent: #6366f1;
}
```

### `card-page.component.ts`

```typescript
import { Component } from '@angular/core';
import { OsiCardsComponent, AICardConfig, CardFieldInteractionEvent } from 'osi-cards-lib';

@Component({
  selector: 'app-card-page',
  standalone: true,
  imports: [OsiCardsComponent],
  template: `
    <div class="page-container">
      <h1>Company Profile</h1>

      <osi-cards
        [card]="companyCard"
        [tiltEnabled]="true"
        (fieldClick)="handleFieldClick($event)"
        (actionClick)="handleAction($event)">
      </osi-cards>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }
  `]
})
export class CardPageComponent {
  companyCard: AICardConfig = {
    cardTitle: 'Acme Corporation',
    cardSubtitle: 'Global Technology Leader',
    sections: [
      {
        title: 'Company Overview',
        type: 'overview',
        fields: [
          { label: 'Industry', value: 'Enterprise Software' },
          { label: 'Founded', value: '2010' },
          { label: 'Headquarters', value: 'San Francisco, CA' },
          { label: 'Employees', value: '2,500+' }
        ]
      },
      {
        title: 'Key Metrics',
        type: 'analytics',
        fields: [
          { label: 'Annual Revenue', value: '$150M', trend: 'up', change: 25 },
          { label: 'Market Share', value: '18%', trend: 'up', change: 3 },
          { label: 'Customer Growth', value: '+340', trend: 'up' },
          { label: 'NPS Score', value: '72', trend: 'stable' }
        ]
      },
      {
        title: 'Leadership Team',
        type: 'contact-card',
        fields: [
          { name: 'Jane Smith', role: 'CEO', email: 'jane@acme.com' },
          { name: 'John Doe', role: 'CTO', email: 'john@acme.com' }
        ]
      },
      {
        title: 'Products & Services',
        type: 'list',
        items: [
          { title: 'Enterprise Platform', description: 'Core business solution' },
          { title: 'Analytics Suite', description: 'Data insights and reporting' },
          { title: 'Integration Hub', description: 'Connect your tools' }
        ]
      }
    ],
    actions: [
      { type: 'website', label: 'Visit Website', variant: 'primary', url: 'https://acme.com' },
      { type: 'mail', label: 'Contact Sales', variant: 'outline', email: { contact: { email: 'sales@acme.com' }, subject: 'Inquiry' } },
      { type: 'agent', label: 'Ask AI Assistant', variant: 'ghost', agentId: 'sales-bot' }
    ]
  };

  handleFieldClick(event: CardFieldInteractionEvent): void {
    console.log('Field clicked:', event);
    // Handle field interactions
  }

  handleAction(event: { action: string; card: AICardConfig }): void {
    console.log('Action clicked:', event);
    // Handle action button clicks
  }
}
```

---

## Component API Reference

### OsiCardsComponent (`<osi-cards>`)

High-level wrapper component with simplified API.

**Inputs:**

| Input | Type | Default | Required | Description |
|-------|------|---------|----------|-------------|
| `card` | `AICardConfig` | `undefined` | No | The card configuration to render |
| `theme` | `'day' \| 'night'` | `'day'` | No | Theme to apply |
| `fullscreen` | `boolean` | `false` | No | Display in fullscreen mode |
| `tiltEnabled` | `boolean` | `true` | No | Enable 3D tilt effect on hover |
| `containerWidth` | `number` | auto | No | Explicit container width for layout |
| `isStreaming` | `boolean` | `false` | No | Whether streaming is active |
| `streamingStage` | `StreamingStage` | `undefined` | No | Current streaming stage |
| `streamingProgress` | `number` | `0` | No | Streaming progress (0-1) |
| `showLoadingByDefault` | `boolean` | `true` | No | Show loading state when no card |
| `loadingMessages` | `string[]` | defaults | No | Custom loading messages |
| `loadingTitle` | `string` | `'Creating OSI Card'` | No | Loading state title |

**Outputs:**

| Output | Type | Description |
|--------|------|-------------|
| `fieldClick` | `CardFieldInteractionEvent` | Emitted when a field is clicked |
| `actionClick` | `{ action: string; card: AICardConfig }` | Emitted when an action button is clicked |
| `fullscreenChange` | `boolean` | Emitted when fullscreen is toggled |
| `agentAction` | `{ action, card, agentId?, context? }` | Emitted for agent-type actions |
| `questionAction` | `{ action, card, question? }` | Emitted for question-type actions |
| `export` | `void` | Emitted when export is requested |

---

### OsiCardsContainerComponent (`<osi-cards-container>`)

Container wrapper for theme and CSS isolation.

**Inputs:**

| Input | Type | Default | Required | Description |
|-------|------|---------|----------|-------------|
| `theme` | `'day' \| 'night'` | `'day'` | No | Theme to apply to container |
| `strictIsolation` | `boolean` | `false` | No | Enable strict CSS containment |

**Usage:**

```html
<osi-cards-container [theme]="'night'">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</osi-cards-container>
```

---

### AICardRendererComponent (`<app-ai-card-renderer>`)

Core rendering component with full control.

**Inputs:**

| Input | Type | Default | Required | Description |
|-------|------|---------|----------|-------------|
| `cardConfig` | `AICardConfig` | `undefined` | No | The card configuration |
| `isFullscreen` | `boolean` | `false` | No | Fullscreen mode |
| `tiltEnabled` | `boolean` | `true` | No | Enable 3D tilt effect |
| `streamingStage` | `StreamingStage` | `undefined` | No | `'idle'` \| `'thinking'` \| `'streaming'` \| `'complete'` |
| `streamingProgress` | `number` | `undefined` | No | Progress 0-1 |
| `isStreaming` | `boolean` | `false` | No | Streaming animation state |
| `showLoadingByDefault` | `boolean` | `true` | No | Show loading when no data |
| `containerWidth` | `number` | auto | No | Explicit width for masonry |
| `loadingMessages` | `string[]` | defaults | No | Custom loading messages |
| `loadingTitle` | `string` | `'Creating OSI Card'` | No | Loading title |
| `updateSource` | `'stream' \| 'liveEdit'` | `'stream'` | No | Update source mode |

**Outputs:**

| Output | Type | Description |
|--------|------|-------------|
| `fieldInteraction` | `CardFieldInteractionEvent` | Field clicked |
| `cardInteraction` | `{ action: string; card: AICardConfig }` | Action button clicked |
| `fullscreenToggle` | `boolean` | Fullscreen toggled |
| `agentAction` | `{ action, card, agentId?, context? }` | Agent action |
| `questionAction` | `{ action, card, question? }` | Question action |
| `export` | `void` | Export requested |

**Minimal Usage (Static Card, No Loading):**

```html
<app-ai-card-renderer
  [cardConfig]="card"
  [streamingStage]="'complete'"
  [showLoadingByDefault]="false">
</app-ai-card-renderer>
```

---

## Section Types

| Type | Description | Data Property |
|------|-------------|---------------|
| `info` | General information fields | `fields` |
| `overview` | Summary/overview section | `fields` |
| `analytics` | KPIs and metrics with trends | `fields` |
| `chart` | Charts (bar, line, pie, doughnut) | `chartData` or `fields` |
| `list` | Lists with items | `items` |
| `contact-card` | Contact information | `fields` |
| `network-card` | Professional network | `items` |
| `map` | Geographic locations | `fields` or `items` |
| `event` | Timeline/events | `items` |
| `product` | Product listings | `items` |
| `solutions` | Solutions/services | `items` |
| `financials` | Financial data | `fields` |
| `quotation` | Quotes/testimonials | `fields` |
| `text-reference` | Citations/references | `fields` |
| `brand-colors` | Color palettes | `items` |
| `news` | News articles | `items` |
| `social-media` | Social profiles | `items` |

---

## Card Presets

Quickly create common card types:

```typescript
import { PresetFactory } from 'osi-cards-lib';

// Company card
const companyCard = PresetFactory.createCompany({
  name: 'Acme Corp',
  industry: 'Technology',
  employees: '500+',
  websiteUrl: 'https://acme.com'
});

// Analytics dashboard
const analyticsCard = PresetFactory.createAnalytics({
  title: 'Sales Performance',
  kpis: [
    { label: 'Revenue', value: '$1.2M', percentage: 105, trend: 'up' }
  ]
});

// Contact card
const contactCard = PresetFactory.createContact({
  name: 'John Doe',
  email: 'john@example.com'
});
```

---

## Troubleshooting

### Animations not working

Ensure you've added `provideOSICards()` to your `app.config.ts`:

```typescript
providers: [
  provideOSICards()  // Required!
]
```

### Styles not loading

Import styles in your `styles.scss`:

```scss
@import 'osi-cards-lib/styles/_styles';
```

### Icons not showing

Ensure `lucide-angular` is installed:

```bash
npm install lucide-angular@^0.548.0
```

---

## Documentation

- [Detailed Usage Guide](./USAGE.md)
- [Import Examples](./IMPORT_EXAMPLE.md)

## License

MIT

## Version

1.5.3
