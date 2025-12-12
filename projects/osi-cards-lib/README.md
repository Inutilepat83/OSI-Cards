# OSI Cards Library

A comprehensive Angular library for rendering AI-generated cards with rich section types, streaming support, and complete CSS encapsulation.

## Features

- **17+ Section Types** - Info, Analytics, Chart, List, Contact, Network, Map, Event, Product, Solutions, Financials, and more
- **Complete CSS Encapsulation** - Shadow DOM isolation with **all styles and animations** self-contained within each card. Cards look identical in demo and any integration without external style dependencies.
- **Streaming Support** - Progressive card rendering with LLM-style streaming simulation
- **Theme System** - Built-in themes (day/night) with full customization via CSS custom properties
- **Plugin Architecture** - Extend with custom section types
- **Accessibility** - WCAG compliant with keyboard navigation and screen reader support
- **Performance** - OnPush change detection, virtual scrolling, and optimized rendering
- **Zero-gap layout utility** - `packWithZeroGapsGuarantee` helper for maximum grid density

## Complete Style & Animation Encapsulation

**🎯 Cards are fully self-contained!** Each card component uses Shadow DOM encapsulation with **all styles and animations** included within the Shadow DOM boundary. This means:

- ✅ **No external style dependencies** - Cards work identically in any application
- ✅ **All animations included** - Streaming, hover, transitions, and section animations all work out of the box
- ✅ **Identical appearance everywhere** - Cards look exactly the same in the demo app and any integration
- ✅ **Complete isolation** - Host app styles cannot affect cards, and card styles cannot leak out

The Shadow DOM bundle includes:
- All core styles (mixins, utilities, surface layers)
- All animations (keyframes, utility classes, streaming effects)
- All component styles (masonry grid, section renderer, card actions, etc.)
- All section styles (all 17+ section types with their animations)
- Theme support (day/night modes)
- Accessibility features (reduced motion, high contrast, forced colors)

**Result**: When you install `osi-cards-lib` from npm, cards render with the exact same appearance and animations as in the demo app, regardless of your host application's styles.

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

**🎯 RECOMMENDED: Automatic Setup via angular.json**

The most reliable way to include library styles is to add them directly to `angular.json`. This ensures styles are always loaded correctly, regardless of SASS/SCSS import resolution issues.

### Quick Setup Script

We provide an automated setup script that configures `angular.json` for you:

```bash
npx osi-cards-lib setup:styles
```

Or manually run the script from the library:

```bash
node node_modules/osi-cards-lib/scripts/setup-angular-styles.js
```

This script will:
- ✅ Add library styles to your `angular.json` styles array
- ✅ Configure `stylePreprocessorOptions` with correct `includePaths`
- ✅ Set up SASS deprecation silence
- ✅ Work with all Angular projects in your workspace

### Manual Setup (Alternative)

If you prefer to configure manually, choose one of the following options:

#### Option A: Scoped Styles (Recommended for Integration)

Use this when integrating into an existing application to prevent style conflicts. Styles are scoped to `.osi-cards-container`.

**Method 1: Import in your styles file (Recommended)**

In your `src/styles.scss` or `src/styles.sass`:

```scss
// Import at the TOP of your styles file (before other styles)
@import 'osi-cards-lib/styles/_styles-scoped';

// If that doesn't work, try with tilde prefix:
@import '~osi-cards-lib/styles/_styles-scoped';

// Or with explicit .scss extension:
@import 'osi-cards-lib/styles/_styles-scoped.scss';
```

**Important**: Place the import at the **top** of your styles file, not at the bottom, to ensure proper CSS cascade.

**Method 2: Add to angular.json (RECOMMENDED - Most Reliable)**

This is the **most reliable method**, especially for SASS files. The styles are automatically included in every build:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.sass",  // Your main styles file
              "node_modules/osi-cards-lib/styles/_styles-scoped.scss"  // Library styles
            ],
            "stylePreprocessorOptions": {
              "includePaths": [
                "node_modules/osi-cards-lib/styles"
              ],
              "sass": {
                "silenceDeprecations": ["import"]
              }
            }
          }
        }
      }
    }
  }
}
```

**Note**:
- The `includePaths` in `stylePreprocessorOptions` helps Angular resolve relative imports within the library's SCSS files.
- **This is especially important when using SASS files** (`.sass` extension) as they may have different import resolution behavior.
- Place library styles **after** your main styles file in the array to ensure proper cascade.

**Important**:
- ⚠️ **Case sensitive**: Use `osi-cards-lib` (lowercase), NOT `osi-cards-Lib`
- ⚠️ **REQUIRED**: You must wrap your components in a container. **RECOMMENDED: Use `<osi-cards-container>` component** (automatically handles theme and tilt):

```html
<!-- ✅ RECOMMENDED: Use osi-cards-container component -->
<osi-cards-container [theme]="'day'">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</osi-cards-container>

<!-- ✅ Also works with dynamic theme -->
<osi-cards-container [theme]="cardTheme" *ngIf="cardConfig">
  <app-ai-card-renderer [cardConfig]="cardConfig"></app-ai-card-renderer>
</osi-cards-container>
```

**Why use the component?**
- ✅ Automatically sets `data-theme` attribute correctly
- ✅ Automatically adds `perspective: 1200px` for 3D tilt effects
- ✅ Preserves 3D transform context (`transform-style: preserve-3d`)
- ✅ Handles all container styling automatically
- ✅ More reliable than manual div setup

**Alternative (Manual Setup):**
If you prefer a plain div, you must manually set both the class and `data-theme` attribute:

```html
<!-- ⚠️ Manual setup - requires both class and data-theme -->
<div class="osi-cards-container" data-theme="day">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</div>

<!-- Dynamic theme with manual setup -->
<div class="osi-cards-container" [attr.data-theme]="theme" *ngIf="cardConfig">
  <app-ai-card-renderer [cardConfig]="cardConfig"></app-ai-card-renderer>
</div>
```

**The `data-theme` attribute is REQUIRED** - without it, styles will not apply correctly. Use `"day"` for light theme or `"night"` for dark theme. The component handles this automatically.

#### Option B: Global Styles (For Standalone Apps)

Use this for standalone applications or when you want styles applied globally.

In your `src/styles.scss`:

```scss
// Try this first
@import 'osi-cards-lib/styles/_styles';

// If that doesn't work, try with tilde:
@import '~osi-cards-lib/styles/_styles';
```

**Note**: This applies styles to `:root`, so no container wrapper is needed, but styles may conflict with your existing application styles.

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

**HTML (RECOMMENDED - using OsiCardsContainerComponent):**

```html
<osi-cards-container [theme]="cardTheme">
  <app-ai-card-renderer
    [cardConfig]="card"
    [streamingStage]="'complete'"
    [showLoadingByDefault]="false"
    [tiltEnabled]="true"
    (cardInteraction)="onCardAction($event)">
  </app-ai-card-renderer>
</osi-cards-container>
```

**HTML (Alternative - manual div setup):**

```html
<div class="osi-cards-container" [attr.data-theme]="cardTheme">
  <app-ai-card-renderer
    [cardConfig]="card"
    [streamingStage]="'complete'"
    [showLoadingByDefault]="false"
    [tiltEnabled]="true"
    (cardInteraction)="onCardAction($event)">
  </app-ai-card-renderer>
</div>
```

**Note**: The component approach is recommended because it automatically handles theme, perspective for tilt, and 3D transform context.

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

**HTML (RECOMMENDED - using OsiCardsContainerComponent):**

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
    [tiltEnabled]="true"
    (cardInteraction)="onCardAction($event)">
  </app-ai-card-renderer>
</osi-cards-container>
```

**HTML (Alternative - manual div setup):**

```html
<button (click)="generateCard()" [disabled]="isStreaming">
  {{ isStreaming ? 'Generating...' : 'Generate Card' }}
</button>

<div class="osi-cards-container" [attr.data-theme]="cardTheme">
  <app-ai-card-renderer
    [cardConfig]="card"
    [isStreaming]="isStreaming"
    [streamingStage]="streamingStage"
    [streamingProgress]="streamingProgress"
    [showLoadingByDefault]="true"
    [loadingMessages]="loadingMessages"
    [loadingTitle]="'AI Analysis'"
    [tiltEnabled]="true"
    (cardInteraction)="onCardAction($event)">
  </app-ai-card-renderer>
</div>
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

### Styles not loading / Library looks unstyled

**If using scoped styles (`_styles-scoped`):**

**CRITICAL**: If styles are completely missing (card renders but has no styling), the SASS import is likely not resolving. Use one of these solutions:

**Solution 1: Add to angular.json (RECOMMENDED for SASS files)**

This is the most reliable method:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.sass",
              "node_modules/osi-cards-lib/styles/_styles-scoped.scss"
            ],
            "stylePreprocessorOptions": {
              "includePaths": [
                "node_modules/osi-cards-lib/styles"
              ],
              "sass": {
                "silenceDeprecations": ["import"]
              }
            }
          }
        }
      }
    }
  }
}
```

Then **remove** the `@import` from your `styles.sass` file.

**Solution 2: Fix the SASS import**

If you want to keep the import in your styles file:

1. **Use tilde prefix**:
   ```sass
   @import '~osi-cards-lib/styles/_styles-scoped';
   ```

2. **Or use full path**:
   ```sass
   @import 'node_modules/osi-cards-lib/styles/_styles-scoped';
   ```

3. **And add to angular.json**:
   ```json
   "stylePreprocessorOptions": {
     "includePaths": ["node_modules"],
     "sass": {
       "silenceDeprecations": ["import"]
     }
   }
   ```

**Solution 3: Verify import path** - Use lowercase `osi-cards-lib` (not `osi-cards-Lib`):
   ```scss
   @import 'osi-cards-lib/styles/_styles-scoped';
   ```

2. **Try alternative import methods** if the above doesn't work:

   **Option A: With tilde prefix** (for older Angular versions):
   ```scss
   @import '~osi-cards-lib/styles/_styles-scoped';
   ```

   **Option B: With explicit extension**:
   ```scss
   @import 'osi-cards-lib/styles/_styles-scoped.scss';
   ```

   **Option C: Add to angular.json** (if SCSS import fails):
   ```json
   {
     "projects": {
       "your-app": {
         "architect": {
           "build": {
             "options": {
               "styles": [
                 "node_modules/osi-cards-lib/styles/_styles-scoped.scss",
                 "src/styles.scss"
               ],
               "stylePreprocessorOptions": {
                 "includePaths": [
                   "node_modules/osi-cards-lib/styles"
                 ],
                 "sass": {
                   "silenceDeprecations": ["import"]
                 }
               }
             }
           }
         }
       }
     }
   }
   ```
   Then remove the `@import` from your `styles.scss`.

3. **Wrap components in container** - You MUST wrap your components. **RECOMMENDED: Use `<osi-cards-container>` component** (automatically handles theme and tilt):
   ```html
   <!-- ✅ RECOMMENDED: Component automatically handles theme and tilt -->
   <osi-cards-container [theme]="'day'">
     <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
   </osi-cards-container>
   ```

   **Alternative (Manual Setup):**
   ```html
   <!-- ⚠️ Manual setup - requires both class and data-theme -->
   <div class="osi-cards-container" data-theme="day">
     <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
   </div>
   ```

4. **Set theme attribute** - The component handles this automatically via `[theme]` input. For manual setup, add `data-theme="day"` or `data-theme="night"`:
   ```html
   <div class="osi-cards-container" data-theme="day">
   ```

5. **Verify package installation**:
   ```bash
   npm list osi-cards-lib
   ```
   Should show version `1.5.19` or higher.

6. **Check browser console** - Look for 404 errors on style files. If you see errors, the import path is incorrect.

7. **Rebuild your app** after adding the import:
   ```bash
   ng build
   # or
   npm start
   ```

**If using global styles (`_styles`):**

Import styles in your `styles.scss`:
```scss
@import 'osi-cards-lib/styles/_styles';
```

**Common Issues:**
- ❌ **Wrong import path**: `@import 'osi-cards-Lib/styles/_styles-scoped'` (wrong casing)
- ❌ **Missing container**: Components not wrapped in `.osi-cards-container` or `<osi-cards-container>` component
- ❌ **Missing theme**: No `data-theme` attribute on container (use `<osi-cards-container [theme]="'day'">` to fix automatically)
- ❌ **Tilt not working**: Missing `perspective` on container (use `<osi-cards-container>` component which adds it automatically)
- ❌ **SCSS not compiled**: Check that your build process compiles SCSS files

### Icons not showing

Ensure `lucide-angular` is installed:

```bash
npm install lucide-angular@^0.548.0
```

### CSS Variables not working

If CSS variables (like `--color-brand`) aren't working:

1. **For scoped styles**: Ensure you're using `.osi-cards-container` wrapper
2. **Check theme**: Verify `data-theme` attribute is set correctly
3. **Override variables**: You can override variables in your own styles:
   ```scss
   .osi-cards-container {
     --color-brand: #ff7900;
     --background: #ffffff;
   }
   ```

---

## Documentation

- [Detailed Usage Guide](./USAGE.md)
- [Import Examples](./IMPORT_EXAMPLE.md)

## License

MIT

## Version

1.5.17

---

## Zero-Gap Packing (Advanced)

If you need maximum layout density (minimal gaps), you can use the zero-gap packing helper:

```typescript
import { packWithZeroGapsGuarantee } from 'osi-cards-lib';

const result = packWithZeroGapsGuarantee(sections, 4, 12);
// result.positionedSections, result.totalHeight, result.utilization, result.gapCount
```
