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

## Streaming Usage

Display cards with AI streaming animations.

### `streaming-card.component.ts`

```typescript
import { Component } from '@angular/core';
import { OsiCardsComponent, AICardConfig, StreamingStage } from 'osi-cards-lib';

@Component({
  selector: 'app-streaming-card',
  standalone: true,
  imports: [OsiCardsComponent],
  templateUrl: './streaming-card.component.html'
})
export class StreamingCardComponent {
  card: AICardConfig | undefined;
  isStreaming = false;
  streamingStage: StreamingStage = 'idle';
  streamingProgress = 0;

  // Custom messages shown during loading
  loadingMessages = [
    'Analyzing request...',
    'Gathering data...',
    'Processing results...'
  ];

  async generateCard(): Promise<void> {
    // Reset state
    this.card = undefined;
    this.isStreaming = true;
    this.streamingStage = 'thinking';
    this.streamingProgress = 0;

    // Simulate AI thinking
    await this.delay(1500);
    this.streamingStage = 'streaming';

    // Simulate progressive card generation
    this.streamingProgress = 0.3;
    this.card = {
      cardTitle: 'Generating...',
      sections: []
    };

    await this.delay(1000);
    this.streamingProgress = 0.6;
    this.card.sections.push({
      title: 'Summary',
      type: 'info',
      fields: [{ label: 'Status', value: 'Processing' }]
    });

    await this.delay(1000);
    this.streamingProgress = 1;
    this.streamingStage = 'complete';
    this.isStreaming = false;

    // Final complete card
    this.card = {
      cardTitle: 'Analysis Complete',
      sections: [
        {
          title: 'Results',
          type: 'analytics',
          fields: [
            { label: 'Accuracy', value: '98.5%', trend: 'up' },
            { label: 'Confidence', value: 'High', trend: 'stable' }
          ]
        }
      ]
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### `streaming-card.component.html`

```html
<div class="controls">
  <button (click)="generateCard()" [disabled]="isStreaming">
    {{ isStreaming ? 'Generating...' : 'Generate Card' }}
  </button>
</div>

<osi-cards
  [card]="card"
  [isStreaming]="isStreaming"
  [streamingStage]="streamingStage"
  [streamingProgress]="streamingProgress"
  [loadingMessages]="loadingMessages"
  [loadingTitle]="'AI Analysis'"
  [showLoadingByDefault]="true">
</osi-cards>
```

### Disable Loading State (No Streaming)

If you don't want streaming animations or loading states:

```html
<osi-cards
  [card]="card"
  [isStreaming]="false"
  [showLoadingByDefault]="false">
</osi-cards>
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
