# OSI Cards Library - Integration Guide

Step-by-step guide for integrating OSI Cards into your Angular project.

## Table of Contents

1. [Installation](#installation)
2. [Setup](#setup)
3. [Basic Usage (Static Card)](#basic-usage-static-card)
4. [Usage with Events](#usage-with-events)
5. [Streaming Usage](#streaming-usage)
6. [Theme Configuration](#theme-configuration)
7. [Style Customization](#style-customization)
8. [Multiple Cards](#multiple-cards)
9. [Troubleshooting](#troubleshooting)

---

## Installation

### 1. Install the Package

```bash
npm install osi-cards-lib
```

### 2. Install Peer Dependencies

```bash
npm install @angular/common@^20.0.0 @angular/core@^20.0.0 @angular/animations@^20.0.0 @angular/platform-browser@^20.0.0 lucide-angular@^0.548.0 rxjs@~7.8.0
```

### 3. Optional: Charts and Maps

```bash
npm install chart.js leaflet
```

---

## Setup

### Step 1: Configure `app.config.ts`

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideOSICards } from 'osi-cards-lib';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards(),  // ✅ Required - enables animations and library services
    provideRouter(routes)
  ]
};
```

### Step 2: Import Styles in `styles.scss`

```scss
// src/styles.scss
@import 'osi-cards-lib/styles/_styles';
```

Alternatively, add to `angular.json`:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "node_modules/osi-cards-lib/styles/_styles.scss",
              "src/styles.scss"
            ]
          }
        }
      }
    }
  }
}
```

---

## Basic Usage (Static Card)

The simplest integration - display a card without streaming or events.

### `my-card.component.ts`

```typescript
import { Component } from '@angular/core';
import { OsiCardsComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-my-card',
  standalone: true,
  imports: [OsiCardsComponent],
  templateUrl: './my-card.component.html',
  styleUrls: ['./my-card.component.scss']
})
export class MyCardComponent {
  // Define your card configuration
  card: AICardConfig = {
    cardTitle: 'Product Overview',
    cardSubtitle: 'Premium Solution',
    sections: [
      {
        title: 'Details',
        type: 'info',
        fields: [
          { label: 'Category', value: 'Software' },
          { label: 'Version', value: '2.0' },
          { label: 'Status', value: 'Active' }
        ]
      },
      {
        title: 'Pricing',
        type: 'analytics',
        fields: [
          { label: 'Monthly', value: '$99', trend: 'stable' },
          { label: 'Annual', value: '$999', change: -15, trend: 'down' }
        ]
      }
    ]
  };
}
```

### `my-card.component.html`

```html
<!-- Minimal usage - theme defaults to 'day' (light) -->
<osi-cards [card]="card"></osi-cards>
```

**That's it!** Theme is optional and defaults to `'day'` (light theme).

### With Optional Theme

```html
<!-- Dark theme -->
<osi-cards [card]="card" [theme]="'night'"></osi-cards>

<!-- Or bind to a variable -->
<osi-cards [card]="card" [theme]="currentTheme"></osi-cards>
```

---

## Container + Renderer Pattern (For Lists & Full Control)

When you need more control or are displaying multiple cards, use the container pattern:

### `card-list.component.ts`

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  OsiCardsContainerComponent,
  AICardRendererComponent,
  AICardConfig
} from 'osi-cards-lib';

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [CommonModule, OsiCardsContainerComponent, AICardRendererComponent],
  templateUrl: './card-list.component.html'
})
export class CardListComponent {
  cardTheme: 'day' | 'night' = 'day';
  cardContainerWidth = 600; // Optional

  items: { id: string; card: AICardConfig }[] = [
    {
      id: '1',
      card: {
        cardTitle: 'Company A',
        sections: [{ title: 'Info', type: 'info', fields: [{ label: 'Status', value: 'Active' }] }]
      }
    },
    {
      id: '2',
      card: {
        cardTitle: 'Company B',
        sections: [{ title: 'Info', type: 'info', fields: [{ label: 'Status', value: 'Pending' }] }]
      }
    }
  ];

  onCardActionClick(event: { action: string; card: AICardConfig }): void {
    console.log('Action:', event);
  }
}
```

### `card-list.component.html`

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

### Key Points:

| Input | Value | Why |
|-------|-------|-----|
| `[streamingStage]="'complete'"` | `'complete'` | Card data is already loaded |
| `[showLoadingByDefault]="false"` | `false` | Don't show loading spinner |
| `[containerWidth]` | Optional | Explicit width for consistent layouts |
| `[theme]` | On container | Theme applied to container, not renderer |

---

## Usage with Events

Handle user interactions with the card.

### `interactive-card.component.ts`

```typescript
import { Component } from '@angular/core';
import {
  OsiCardsComponent,
  AICardConfig,
  CardFieldInteractionEvent
} from 'osi-cards-lib';

@Component({
  selector: 'app-interactive-card',
  standalone: true,
  imports: [OsiCardsComponent],
  templateUrl: './interactive-card.component.html'
})
export class InteractiveCardComponent {
  card: AICardConfig = {
    cardTitle: 'Company Profile',
    sections: [
      {
        title: 'Team',
        type: 'contact-card',
        fields: [
          { name: 'Alice Johnson', role: 'CEO', email: 'alice@company.com' },
          { name: 'Bob Smith', role: 'CTO', email: 'bob@company.com' }
        ]
      }
    ],
    actions: [
      { type: 'website', label: 'Website', variant: 'primary', url: 'https://example.com' },
      { type: 'mail', label: 'Email', variant: 'outline', email: { contact: { email: 'info@company.com' } } },
      { type: 'agent', label: 'Chat with AI', variant: 'ghost', agentId: 'support-bot' }
    ]
  };

  // Handle field clicks
  onFieldClick(event: CardFieldInteractionEvent): void {
    console.log('Field clicked:', event.field);
    console.log('Section:', event.sectionTitle);
    // Navigate, open modal, etc.
  }

  // Handle action button clicks
  onActionClick(event: { action: string; card: AICardConfig }): void {
    console.log('Action:', event.action);
    // Process the action
  }

  // Handle agent-type actions
  onAgentAction(event: { action: any; card: AICardConfig; agentId?: string }): void {
    console.log('Agent action:', event.agentId);
    // Open chat, call API, etc.
  }

  // Handle fullscreen toggle
  onFullscreenChange(isFullscreen: boolean): void {
    console.log('Fullscreen:', isFullscreen);
  }
}
```

### `interactive-card.component.html`

```html
<osi-cards
  [card]="card"
  [tiltEnabled]="true"
  (fieldClick)="onFieldClick($event)"
  (actionClick)="onActionClick($event)"
  (agentAction)="onAgentAction($event)"
  (fullscreenChange)="onFullscreenChange($event)">
</osi-cards>
```

---

## Complete Integration Examples

### Example 1: Static Card (No Streaming)

For displaying pre-loaded cards without any loading animations.

**`static-card.component.ts`**

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
    cardSubtitle: 'Technology Solutions',
    sections: [
      {
        title: 'Company Info',
        type: 'info',
        fields: [
          { label: 'Industry', value: 'Software' },
          { label: 'Founded', value: '2015' },
          { label: 'Employees', value: '250+' }
        ]
      },
      {
        title: 'Performance',
        type: 'analytics',
        fields: [
          { label: 'Revenue', value: '$5M', trend: 'up', change: 20 },
          { label: 'Growth', value: '35%', trend: 'up' }
        ]
      }
    ],
    actions: [
      { type: 'website', label: 'Website', variant: 'primary', url: 'https://example.com' }
    ]
  };

  onCardAction(event: { action: string; card: AICardConfig }): void {
    console.log('Action clicked:', event.action);
  }
}
```

**`static-card.component.html`**

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

---

### Example 2: Streaming Card (AI/LLM Integration)

For progressive card generation with loading animations.

**`streaming-card.component.ts`**

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

  // Card data (starts undefined)
  card: AICardConfig | undefined;

  // Streaming state
  isStreaming = false;
  streamingStage: StreamingStage = 'idle';
  streamingProgress = 0;

  // Custom loading messages
  loadingMessages = [
    'Analyzing request...',
    'Gathering data...',
    'Processing results...',
    'Almost there...'
  ];

  async generateCard(): Promise<void> {
    // Reset and start
    this.card = undefined;
    this.isStreaming = true;
    this.streamingStage = 'thinking';
    this.streamingProgress = 0;

    // Phase 1: Thinking (show loading animation)
    await this.delay(2000);

    // Phase 2: Start streaming content
    this.streamingStage = 'streaming';
    this.streamingProgress = 0.2;

    // Build card progressively
    this.card = { cardTitle: 'Analysis Results', sections: [] };

    await this.delay(800);
    this.streamingProgress = 0.4;
    this.card.sections.push({
      title: 'Summary',
      type: 'info',
      fields: [{ label: 'Status', value: 'Analyzing...' }]
    });

    await this.delay(800);
    this.streamingProgress = 0.7;
    this.card.sections.push({
      title: 'Insights',
      type: 'analytics',
      fields: [
        { label: 'Score', value: '92%', trend: 'up' },
        { label: 'Confidence', value: 'High' }
      ]
    });

    await this.delay(600);
    this.streamingProgress = 1;

    // Phase 3: Complete
    this.streamingStage = 'complete';
    this.isStreaming = false;

    // Update final state
    this.card.cardTitle = 'Analysis Complete';
    this.card.sections[0].fields = [{ label: 'Status', value: 'Complete ✓' }];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  onCardAction(event: { action: string; card: AICardConfig }): void {
    console.log('Action clicked:', event.action);
  }
}
```

**`streaming-card.component.html`**

```html
<div class="controls">
  <button (click)="generateCard()" [disabled]="isStreaming">
    {{ isStreaming ? 'Generating...' : 'Generate Card' }}
  </button>
</div>

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

---

### Side-by-Side Comparison

| Setting | Static Card | Streaming Card |
|---------|-------------|----------------|
| `[cardConfig]` | Always has data | Starts `undefined` |
| `[streamingStage]` | `'complete'` | `'idle'` → `'thinking'` → `'streaming'` → `'complete'` |
| `[showLoadingByDefault]` | `false` | `true` |
| `[isStreaming]` | Not needed | Controls animation |
| `[streamingProgress]` | Not needed | `0` to `1` |
| `[loadingMessages]` | Not needed | Custom messages |
| Loading UI | None | Animated spinner + messages |

### Streaming Stages Explained

```
'idle'      → Initial state, no activity
'thinking'  → AI is processing (shows loading animation)
'streaming' → Content is being generated (progress bar active)
'complete'  → Card is fully loaded (normal display)
'error'     → Something went wrong
'aborted'   → Generation was cancelled
```

---

## Theme Configuration

### Option 1: Per-Component (Inline)

```html
<!-- Light theme (default - no need to specify) -->
<osi-cards [card]="card"></osi-cards>

<!-- Dark theme -->
<osi-cards [card]="card" [theme]="'night'"></osi-cards>
```

### Option 2: Dynamic Theme

```typescript
// component.ts
currentTheme: 'day' | 'night' = 'day';

toggleTheme(): void {
  this.currentTheme = this.currentTheme === 'day' ? 'night' : 'day';
}
```

```html
<!-- template -->
<button (click)="toggleTheme()">Toggle Theme</button>
<osi-cards [card]="card" [theme]="currentTheme"></osi-cards>
```

### Option 3: Global Default via Provider

```typescript
// app.config.ts
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards({
      defaultTheme: 'night'  // All cards use dark theme by default
    })
  ]
};
```

### Option 4: Using ThemeService

```typescript
import { Component, inject } from '@angular/core';
import { ThemeService } from 'osi-cards-lib';

@Component({...})
export class AppComponent {
  private themeService = inject(ThemeService);

  setDark(): void {
    this.themeService.setTheme('dark');
  }

  setLight(): void {
    this.themeService.setTheme('light');
  }

  followSystem(): void {
    this.themeService.setTheme('system');
  }

  toggle(): void {
    this.themeService.toggleTheme();
  }
}
```

---

## Style Customization

### Override CSS Variables

```scss
// styles.scss
@import 'osi-cards-lib/styles/_styles';

:root {
  // Accent color
  --osi-card-accent: #6366f1;
  --osi-card-accent-hover: #4f46e5;

  // Background
  --osi-card-background: #ffffff;
  --osi-card-surface: #f8fafc;

  // Text
  --osi-card-foreground: #1a1a2e;
  --osi-card-muted: #64748b;

  // Border
  --osi-card-border: #e2e8f0;
  --osi-card-border-radius: 12px;

  // Shadow
  --osi-card-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Component-Level Styles

```scss
// my-card.component.scss
:host {
  display: block;
  max-width: 800px;
  margin: 0 auto;
}

osi-cards {
  --osi-card-accent: #ff6b6b;  // Custom accent for this component
}
```

---

## Multiple Cards

### Display Multiple Cards in a Grid

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OsiCardsComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-card-grid',
  standalone: true,
  imports: [CommonModule, OsiCardsComponent],
  template: `
    <div class="card-grid">
      @for (card of cards; track card.id) {
        <osi-cards
          [card]="card"
          (fieldClick)="onFieldClick($event, card)">
        </osi-cards>
      }
    </div>
  `,
  styles: [`
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
      padding: 24px;
    }
  `]
})
export class CardGridComponent {
  cards: AICardConfig[] = [
    {
      id: '1',
      cardTitle: 'Product A',
      sections: [{ title: 'Info', type: 'info', fields: [{ label: 'Price', value: '$99' }] }]
    },
    {
      id: '2',
      cardTitle: 'Product B',
      sections: [{ title: 'Info', type: 'info', fields: [{ label: 'Price', value: '$149' }] }]
    },
    {
      id: '3',
      cardTitle: 'Product C',
      sections: [{ title: 'Info', type: 'info', fields: [{ label: 'Price', value: '$199' }] }]
    }
  ];

  onFieldClick(event: any, card: AICardConfig): void {
    console.log('Clicked field in card:', card.cardTitle);
  }
}
```

---

## Troubleshooting

### ❌ Error: Animations not working

**Symptom:** Card renders but animations don't play.

**Solution:** Add `provideOSICards()` to `app.config.ts`:

```typescript
providers: [
  provideOSICards()  // Required!
]
```

### ❌ Error: Module not found 'osi-cards-lib'

**Solution:**

1. Verify installation: `npm install osi-cards-lib`
2. Restart dev server: `ng serve`
3. Clear cache: `rm -rf node_modules/.cache && npm install`

### ❌ Error: Styles not applied

**Solution:** Import styles in `styles.scss`:

```scss
@import 'osi-cards-lib/styles/_styles';
```

### ❌ Error: Icons not showing

**Solution:** Install lucide-angular:

```bash
npm install lucide-angular@^0.548.0
```

### ❌ Card shows loading forever

**Symptom:** Card stuck in loading state with no content.

**Solution:** Either provide a `card` configuration OR disable loading:

```html
<!-- Option 1: Provide card data -->
<osi-cards [card]="myCard"></osi-cards>

<!-- Option 2: Disable loading state -->
<osi-cards [card]="undefined" [showLoadingByDefault]="false"></osi-cards>
```

### ❌ Type errors in TypeScript

**Solution:** Ensure you're importing types correctly:

```typescript
import {
  AICardConfig,
  CardSection,
  CardField,
  CardFieldInteractionEvent,
  StreamingStage
} from 'osi-cards-lib';
```

---

## Quick Reference

### Minimal Implementation

```typescript
// app.config.ts
import { provideOSICards } from 'osi-cards-lib';
export const appConfig = { providers: [provideOSICards()] };

// styles.scss
@import 'osi-cards-lib/styles/_styles';

// component.ts
import { OsiCardsComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  imports: [OsiCardsComponent],
  template: `<osi-cards [card]="card"></osi-cards>`
})
export class MyComponent {
  card: AICardConfig = {
    cardTitle: 'My Card',
    sections: [{ title: 'Info', type: 'info', fields: [{ label: 'Key', value: 'Value' }] }]
  };
}
```

### Common Use Cases

#### Static Card (No Streaming, No Loading)

```html
<!-- Using OsiCardsComponent -->
<osi-cards
  [card]="card"
  [showLoadingByDefault]="false">
</osi-cards>

<!-- Using Container + Renderer -->
<osi-cards-container [theme]="'day'">
  <app-ai-card-renderer
    [cardConfig]="card"
    [streamingStage]="'complete'"
    [showLoadingByDefault]="false">
  </app-ai-card-renderer>
</osi-cards-container>
```

#### Card with Dark Theme

```html
<osi-cards [card]="card" [theme]="'night'"></osi-cards>
```

#### Card in a Loop

```html
@for (item of items; track item.id) {
  <osi-cards-container>
    <app-ai-card-renderer
      [cardConfig]="item.card"
      [streamingStage]="'complete'"
      [showLoadingByDefault]="false"
      (cardInteraction)="onAction($event)">
    </app-ai-card-renderer>
  </osi-cards-container>
}
```

### What's Required vs Optional

| Component | Required Inputs | Optional with Defaults |
|-----------|-----------------|------------------------|
| `<osi-cards>` | None (shows loading if no card) | All inputs have defaults |
| `<osi-cards-container>` | None | `theme='day'`, `strictIsolation=false` |
| `<app-ai-card-renderer>` | None (shows loading if no cardConfig) | All inputs have defaults |

**To show a static card without loading:**
- Set `[showLoadingByDefault]="false"` OR
- Set `[streamingStage]="'complete'"` AND provide `[cardConfig]`

### All Available Inputs

```html
<osi-cards
  [card]="card"
  [theme]="'day'"
  [fullscreen]="false"
  [tiltEnabled]="true"
  [containerWidth]="800"
  [isStreaming]="false"
  [streamingStage]="'idle'"
  [streamingProgress]="0"
  [showLoadingByDefault]="true"
  [loadingMessages]="['Loading...']"
  [loadingTitle]="'Please wait'"
  (fieldClick)="onFieldClick($event)"
  (actionClick)="onActionClick($event)"
  (fullscreenChange)="onFullscreen($event)"
  (agentAction)="onAgent($event)"
  (questionAction)="onQuestion($event)"
  (export)="onExport()">
</osi-cards>
```

---

## See Also

- [README.md](./README.md) - Overview and quick start
- [USAGE.md](./USAGE.md) - Detailed API documentation
