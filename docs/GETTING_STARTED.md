# Getting Started with OSI Cards

This guide walks you through integrating OSI Cards into your Angular project with step-by-step instructions for CSS, HTML, and TypeScript setup.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Angular Project Integration](#angular-project-integration)
  - [Step 1: TypeScript Configuration](#step-1-typescript-configuration)
  - [Step 2: CSS/SCSS Integration](#step-2-cssscss-integration)
  - [Step 3: HTML Template Integration](#step-3-html-template-integration)
- [Quick Start Example](#quick-start-example)
- [Basic Usage Patterns](#basic-usage-patterns)
- [Next Steps](#next-steps)

---

## Prerequisites

- Angular 18+ project
- Node.js 18+
- npm or yarn package manager

---

## Installation

```bash
npm install osi-cards-lib
```

Or with yarn:

```bash
yarn add osi-cards-lib
```

---

## Angular Project Integration

### Step 1: TypeScript Configuration

#### 1.1 Configure App Providers

Add the OSI Cards provider to your `app.config.ts`:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideOSICards({
      theme: 'light',          // 'light' | 'dark' | 'system'
      animations: true,        // Enable animations
      featureFlags: {
        virtualScroll: false,  // Enable for large cards
        debugOverlay: false,   // Debug mode
      },
    }),
  ],
};
```

#### 1.2 Import Components in Your Module/Component

**Standalone Component (Recommended):**

```typescript
// my-component.ts
import { Component, signal } from '@angular/core';
import { OsiCardsComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [OsiCardsComponent],
  templateUrl: './my-component.html',
})
export class MyComponent {
  cardConfig = signal<AICardConfig>({
    cardTitle: 'Company Overview',
    sections: [
      {
        title: 'General Info',
        type: 'info',
        fields: [
          { label: 'Industry', value: 'Technology' },
          { label: 'Founded', value: '2020' },
          { label: 'Employees', value: '500+' },
        ],
      },
    ],
  });
}
```

**Module-Based Application:**

```typescript
// cards.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  OsiCardsComponent,
  AICardRendererComponent,
  CardSkeletonComponent,
} from 'osi-cards-lib';

@NgModule({
  imports: [
    CommonModule,
    OsiCardsComponent,
    AICardRendererComponent,
    CardSkeletonComponent,
  ],
  exports: [
    OsiCardsComponent,
    AICardRendererComponent,
    CardSkeletonComponent,
  ],
})
export class CardsModule {}
```

#### 1.3 TypeScript Types

OSI Cards provides full TypeScript support. Import the types you need:

```typescript
import {
  // Core types
  AICardConfig,
  CardSection,
  CardField,
  CardItem,
  CardAction,

  // Section types
  SectionType,
  StreamingStage,

  // Events
  CardFieldInteractionEvent,
  SectionRenderEvent,

  // Services
  CardFacadeService,
  ThemeService,
} from 'osi-cards-lib';
```

---

### Step 2: CSS/SCSS Integration

#### 2.1 Import Styles in Your Global Stylesheet

**Option A: SCSS Import (Recommended)**

```scss
// styles.scss
@import 'osi-cards-lib/styles/styles.scss';
```

**Option B: CSS Import**

```scss
// styles.scss
@import 'osi-cards-lib/styles/styles.css';
```

**Option C: Tokens Only (for Custom Theming)**

```scss
// styles.scss
@import 'osi-cards-lib/styles/osi-cards-tokens.css';
```

#### 2.2 Theme CSS Variables

Customize the appearance using CSS custom properties:

```scss
// styles.scss
:root {
  // Brand colors
  --osi-card-accent: #6366f1;
  --osi-card-accent-foreground: #ffffff;

  // Background colors
  --osi-card-background: #ffffff;
  --osi-card-foreground: #1a1a1a;
  --osi-card-muted: #f4f4f5;
  --osi-card-muted-foreground: #71717a;

  // Border and shadows
  --osi-card-border: #e4e4e7;
  --osi-card-border-radius: 0.5rem;
  --osi-card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  // Spacing
  --osi-card-padding: 1rem;
  --osi-card-gap: 0.75rem;

  // Typography
  --osi-card-font-family: system-ui, -apple-system, sans-serif;
  --osi-card-title-size: 1.25rem;
  --osi-card-body-size: 0.875rem;
}

// Dark theme
[data-theme='dark'],
.dark {
  --osi-card-background: #18181b;
  --osi-card-foreground: #fafafa;
  --osi-card-muted: #27272a;
  --osi-card-muted-foreground: #a1a1aa;
  --osi-card-border: #3f3f46;
}
```

#### 2.3 Component-Specific Styles

Override styles for specific sections or components:

```scss
// my-component.scss
.my-card-container {
  // Container styling
  max-width: 800px;
  margin: 0 auto;

  // Override card variables in scope
  --osi-card-border-radius: 1rem;
  --osi-card-padding: 1.5rem;
}

// Style specific section types
:host ::ng-deep .ai-section--analytics {
  --metric-accent: var(--osi-card-accent);
}
```

---

### Step 3: HTML Template Integration

#### 3.1 Basic Card Rendering

```html
<!-- my-component.html -->
<div class="card-container">
  <osi-cards
    [card]="cardConfig()"
    [theme]="'light'"
    (fieldClick)="onFieldClick($event)"
    (actionClick)="onActionClick($event)">
  </osi-cards>
</div>
```

#### 3.2 With Streaming Support

```html
<osi-cards
  [card]="cardConfig()"
  [isStreaming]="isStreaming()"
  [streamingStage]="streamingStage()"
  [streamingProgress]="progress()"
  [loadingMessages]="['Analyzing...', 'Processing...', 'Generating...']"
  (fieldClick)="onFieldClick($event)">
</osi-cards>
```

#### 3.3 With Loading State

```html
<!-- Show skeleton while loading -->
@if (isLoading()) {
  <app-card-skeleton [sections]="3" [showHeader]="true"></app-card-skeleton>
} @else {
  <osi-cards [card]="cardConfig()"></osi-cards>
}
```

#### 3.4 Multiple Cards with Container

```html
<osi-cards-container [theme]="currentTheme()" [maxWidth]="1200" [gap]="24">
  @for (card of cards(); track card.id) {
    <osi-cards [card]="card" (fieldClick)="onFieldClick($event, card)">
    </osi-cards>
  }
</osi-cards-container>
```

#### 3.5 Using the Low-Level Renderer

For more control, use `AICardRendererComponent` directly:

```html
<app-ai-card-renderer
  [cardConfig]="cardConfig()"
  [isFullscreen]="isFullscreen()"
  [tiltEnabled]="true"
  [isStreaming]="isStreaming()"
  [streamingStage]="streamingStage()"
  (cardEvent)="onCardEvent($event)"
  (actionClick)="onAction($event)"
  (layoutChange)="onLayoutChange($event)">
</app-ai-card-renderer>
```

---

## Quick Start Example

Here's a complete example putting everything together:

### app.config.ts

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideOSICards(),
  ],
};
```

### styles.scss

```scss
@import 'osi-cards-lib/styles/styles.scss';

:root {
  --osi-card-accent: #3b82f6;
}
```

### card-demo.component.ts

```typescript
import { Component, signal } from '@angular/core';
import { OsiCardsComponent, AICardConfig, CardFieldInteractionEvent } from 'osi-cards-lib';

@Component({
  selector: 'app-card-demo',
  standalone: true,
  imports: [OsiCardsComponent],
  template: `
    <div class="demo-container">
      <h1>OSI Cards Demo</h1>

      <osi-cards
        [card]="card()"
        [theme]="theme()"
        (fieldClick)="onFieldClick($event)">
      </osi-cards>

      <button (click)="toggleTheme()">Toggle Theme</button>
    </div>
  `,
  styles: [`
    .demo-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 1rem;
    }
  `]
})
export class CardDemoComponent {
  theme = signal<'light' | 'dark'>('light');

  card = signal<AICardConfig>({
    cardTitle: 'Acme Corporation',
    cardSubtitle: 'Technology Company',
    sections: [
      {
        title: 'Company Overview',
        type: 'overview',
        fields: [
          { label: 'Industry', value: 'Software & Technology' },
          { label: 'Founded', value: '2015' },
          { label: 'Headquarters', value: 'San Francisco, CA' },
          { label: 'Employees', value: '1,200+' },
        ],
      },
      {
        title: 'Key Metrics',
        type: 'analytics',
        fields: [
          { label: 'Annual Revenue', value: '$45M', change: 25, trend: 'up' },
          { label: 'Customer Growth', value: '35%', percentage: 35 },
          { label: 'NPS Score', value: '72', change: 5, trend: 'up' },
        ],
      },
      {
        title: 'Contact',
        type: 'contact-card',
        fields: [
          {
            title: 'Jane Smith',
            role: 'CEO',
            email: 'jane@acme.com',
          },
        ],
      },
    ],
    actions: [
      { label: 'Visit Website', type: 'website', variant: 'primary' },
      { label: 'Contact', type: 'mail', variant: 'secondary' },
    ],
  });

  toggleTheme(): void {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  onFieldClick(event: CardFieldInteractionEvent): void {
    console.log('Field clicked:', event.field);
  }
}
```

---

## Basic Usage Patterns

### Creating Cards Programmatically

```typescript
import { inject } from '@angular/core';
import { CardFacadeService } from 'osi-cards-lib';

export class MyService {
  private cardFacade = inject(CardFacadeService);

  createCard() {
    // Create a card with options
    return this.cardFacade.createCard({
      title: 'My Card',
      sections: [
        { title: 'Info', type: 'info', fields: [] }
      ]
    });
  }

  validateCard(config: unknown) {
    // Validate card configuration
    const result = this.cardFacade.validate(config);
    if (!result.valid) {
      console.error('Validation errors:', result.errors);
    }
    return result;
  }
}
```

### Streaming Card Generation

```typescript
import { Component, signal, inject } from '@angular/core';
import { CardFacadeService, StreamingStage } from 'osi-cards-lib';

@Component({...})
export class StreamingComponent {
  private cardFacade = inject(CardFacadeService);

  card = signal<AICardConfig | null>(null);
  isStreaming = signal(false);
  stage = signal<StreamingStage>('idle');

  async streamCard(jsonData: string) {
    this.isStreaming.set(true);
    this.stage.set('thinking');

    this.cardFacade.streamFromJson(jsonData, {
      onStateChange: (state) => {
        this.stage.set(state.stage);
        if (state.stage === 'complete') {
          this.isStreaming.set(false);
        }
      }
    }).subscribe(card => {
      this.card.set(card);
    });
  }
}
```

### Theme Switching

```typescript
import { inject } from '@angular/core';
import { ThemeService } from 'osi-cards-lib';

export class ThemeToggleComponent {
  private themeService = inject(ThemeService);

  currentTheme = this.themeService.currentTheme;

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  setTheme(theme: 'light' | 'dark') {
    this.themeService.setTheme(theme);
  }
}
```

---

## Next Steps

Now that you have OSI Cards integrated, explore these guides:

| Guide | Description |
|-------|-------------|
| [API Reference](./API.md) | Complete API documentation |
| [Section Types](./SECTION_TYPES.md) | All available section types with examples |
| [Theming Guide](./THEMING_GUIDE.md) | Advanced theming and customization |
| [Components](./COMPONENTS.md) | Detailed component documentation |
| [Services](./SERVICES.md) | Available services and utilities |
| [Best Practices](./BEST_PRACTICES.md) | Performance, accessibility, and security |
| [Plugin System](./PLUGIN_SYSTEM.md) | Creating custom section types |
| [Integration Guide](./INTEGRATION_GUIDE.md) | SSR, NgRx, and micro-frontend integration |

---

## Troubleshooting

### Cards Not Rendering

1. Ensure `provideOSICards()` is in your providers array
2. Check that `cardConfig` has both `cardTitle` and `sections` array
3. Verify styles are imported in your global stylesheet

### Animations Not Working

1. Verify `provideAnimations()` is configured
2. Check that `prefers-reduced-motion` isn't blocking animations
3. Ensure `animations: true` in provider config

### Styles Not Applied

1. Import styles: `@import 'osi-cards-lib/styles/styles.scss';`
2. Check CSS variable definitions are at `:root` level
3. Verify no CSS conflicts with your existing styles

### TypeScript Errors

1. Ensure you're using Angular 18+
2. Check that `osi-cards-lib` is properly installed
3. Restart your TypeScript server in your IDE

---

## Next Steps

Now that you have OSI Cards set up, explore these guides:

### Essential Guides

- **[Section Types](./SECTION_TYPES.md)** - Learn all 17 built-in section types with examples
- **[Theming Guide](./THEMING_GUIDE.md)** - Customize colors, fonts, and appearance
- **[API Reference](./API.md)** - Complete API documentation

### Advanced Topics

- **[Integration Guide](./INTEGRATION_GUIDE.md)** - SSR, NgRx, Micro-frontends, Forms
- **[Plugin System](./PLUGIN_SYSTEM.md)** - Create custom section types
- **[Event System](./EVENT_SYSTEM.md)** - Handle card interactions
- **[Best Practices](./BEST_PRACTICES.md)** - Performance and accessibility tips

### Architecture & Reference

- **[Components](./COMPONENTS.md)** - All component documentation
- **[Services](./SERVICES.md)** - Service reference
- **[CSS Encapsulation](./CSS_ENCAPSULATION.md)** - Style isolation with Shadow DOM

---

For more help, check the [GitHub repository](https://github.com/Inutilepat83/OSI-Cards).

