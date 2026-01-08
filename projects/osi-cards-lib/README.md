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
npm install @angular/common@^17.0.0 @angular/core@^17.0.0 @angular/animations@^17.0.0 @angular/platform-browser@^17.0.0 lucide-angular@^0.292.0 rxjs@~7.8.0
```

### Optional Dependencies (for charts and maps)

**Important:** These dependencies are optional but **required** if you use chart or map sections in your cards.

```bash
npm install frappe-charts leaflet
```

- **frappe-charts**: Required for `chart` section type (bar, line, pie, doughnut, area charts)
- **leaflet**: Required for `map` section type (geographic location maps)

**Note:** If you use chart or map sections without installing these dependencies, you'll see error messages in the console and the sections will display error states. The library will gracefully handle missing dependencies, but functionality will be limited.

---

## Integration Guide

This guide shows you exactly how to integrate OSI Cards into your Angular application, following the proven pattern used in production applications.

### Step 1: Configure Providers (Required)

In your `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideOsiCards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideOsiCards(),  // Required for animations and library functionality
    // ... your other providers
  ]
};
```

### Step 2: Add Styles to angular.json

Add the library styles directly to your `angular.json` file. This is the most reliable method and ensures styles are always loaded correctly:

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

**Important Notes:**
- Place library styles **after** your main styles file in the array
- The `includePaths` helps Angular resolve relative imports within the library's SCSS files
- The `silenceDeprecations` setting suppresses SASS `@import` warnings

### Step 3: Import Components in Your Module

In the module where you want to use the card components, import them from `osi-cards-lib`:

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardRendererComponent, OsiCardsContainerComponent } from 'osi-cards-lib';

@NgModule({
  declarations: [
    // ... your components
  ],
  imports: [
    CommonModule,
    AICardRendererComponent,
    OsiCardsContainerComponent,
    // ... your other imports
  ],
  exports: [
    // ... your exports
  ]
})
export class YourModule { }
```

### Step 4: Use the Components in Your Template

Use the `<osi-cards-container>` component to wrap `<app-ai-card-renderer>`. The container component automatically handles theme and tilt effects:

```html
<div class="col-12 p-0 mb-3" *ngIf="companyCard">
  <osi-cards-container [theme]="cardTheme">
    <app-ai-card-renderer
      [cardConfig]="companyCard"
      [streamingStage]="'complete'"
      [showLoadingByDefault]="false"
      [tiltEnabled]="true">
    </app-ai-card-renderer>
  </osi-cards-container>
</div>
```

**Why use `<osi-cards-container>`?**
- ✅ Automatically sets `data-theme` attribute correctly
- ✅ Automatically adds `perspective: 1200px` for 3D tilt effects
- ✅ Preserves 3D transform context (`transform-style: preserve-3d`)
- ✅ Handles all container styling automatically
- ✅ More reliable than manual div setup

### Step 5: Define Your Card Configuration

In your component TypeScript file, define the card configuration:

```typescript
import { Component } from '@angular/core';
import { AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-your-component',
  templateUrl: './your-component.html'
})
export class YourComponent {
  cardTheme: 'day' | 'night' = 'night';  // or 'day' for light theme

  companyCard: AICardConfig = {
    cardTitle: 'Company Profile',
    description: 'Complete company information and insights',
    sections: [
      {
        title: 'Overview',
        type: 'info',
        fields: [
          { label: 'Industry', value: 'Technology' },
          { label: 'Employees', value: '500+' },
          { label: 'Founded', value: '2010' }
        ]
      },
      {
        title: 'Key Metrics',
        type: 'analytics',
        fields: [
          { label: 'Revenue', value: '$150M', trend: 'up', change: 25 },
          { label: 'Market Share', value: '18%', trend: 'up', change: 3 }
        ]
      }
    ],
    actions: [
      {
        type: 'website',
        label: 'Visit Website',
        variant: 'primary',
        url: 'https://example.com'
      }
    ]
  };
}
```

---

## Complete Example

Here's a complete working example based on a production integration:

### `app.config.ts`

```typescript
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from "@angular/common/http";
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideOsiCards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    provideOsiCards()  // Required for animations and library functionality
  ]
};
```

### `angular.json` (excerpt)

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

### `your-module.ts`

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardRendererComponent, OsiCardsContainerComponent } from 'osi-cards-lib';

@NgModule({
  imports: [
    CommonModule,
    AICardRendererComponent,
    OsiCardsContainerComponent
  ]
})
export class YourModule { }
```

### `your-component.ts`

```typescript
import { Component } from '@angular/core';
import { AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-your-component',
  templateUrl: './your-component.html'
})
export class YourComponent {
  cardTheme: 'day' | 'night' = 'night';

  companyCard: AICardConfig = {
    cardTitle: 'Company Profile',
    description: 'Complete company information',
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
}
```

### `your-component.html`

```html
<div class="col-12 p-0 mb-3" *ngIf="companyCard">
  <osi-cards-container [theme]="cardTheme">
    <app-ai-card-renderer
      [cardConfig]="companyCard"
      [streamingStage]="'complete'"
      [showLoadingByDefault]="false"
      [tiltEnabled]="true">
    </app-ai-card-renderer>
  </osi-cards-container>
</div>
```

---

## Component API Reference

### OsiCardsContainerComponent (`<osi-cards-container>`)

Container wrapper for theme and CSS isolation. **Always use this component** to wrap your card renderer.

**Inputs:**

| Input | Type | Default | Required | Description |
|-------|------|---------|----------|-------------|
| `theme` | `'day' \| 'night'` | `'day'` | No | Theme to apply to container |

**Usage:**

```html
<osi-cards-container [theme]="'night'">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</osi-cards-container>
```

### AICardRendererComponent (`<app-ai-card-renderer>`)

Core rendering component with full control.

**Inputs:**

| Input | Type | Default | Required | Description |
|-------|------|---------|----------|-------------|
| `cardConfig` | `AICardConfig` | `undefined` | No | The card configuration |
| `streamingStage` | `StreamingStage` | `undefined` | No | `'idle'` \| `'thinking'` \| `'streaming'` \| `'complete'` |
| `showLoadingByDefault` | `boolean` | `true` | No | Show loading when no card data |
| `tiltEnabled` | `boolean` | `true` | No | Enable 3D tilt effect on hover |

**Outputs:**

| Output | Type | Description |
|--------|------|-------------|
| `cardInteraction` | `{ action: string; card: AICardConfig }` | Action button clicked |
| `fieldInteraction` | `CardFieldInteractionEvent` | Field clicked |

**Minimal Usage (Static Card, No Loading):**

```html
<osi-cards-container [theme]="cardTheme">
  <app-ai-card-renderer
    [cardConfig]="card"
    [streamingStage]="'complete'"
    [showLoadingByDefault]="false">
  </app-ai-card-renderer>
</osi-cards-container>
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

## Troubleshooting

### Animations not working

Ensure you've added `provideOsiCards()` to your `app.config.ts`:

```typescript
providers: [
  provideOsiCards()  // Required!
]
```

### Styles not loading / Library looks unstyled

1. **Verify styles are in angular.json** - Check that `node_modules/osi-cards-lib/styles/_styles-scoped.scss` is in your `styles` array
2. **Check stylePreprocessorOptions** - Ensure `includePaths` includes `node_modules/osi-cards-lib/styles`
3. **Use the container component** - Always wrap your card in `<osi-cards-container [theme]="'day'">` or `<osi-cards-container [theme]="'night'">`
4. **Rebuild your app** after adding the import:
   ```bash
   ng build
   # or
   npm start
   ```

### Icons not showing

Ensure `lucide-angular` is installed:

```bash
npm install lucide-angular@^0.292.0
```

### Theme not applying

- Ensure you're using `<osi-cards-container [theme]="'day'">` or `<osi-cards-container [theme]="'night'">`
- The `[theme]` input automatically sets the `data-theme` attribute
- Check browser console for any errors

### Chart sections not rendering / "Failed to resolve import 'frappe-charts'" error

If you're using chart sections (`type: "chart"`) and encounter build errors or see error messages in the console:

1. **Install frappe-charts:**
   ```bash
   npm install frappe-charts
   ```

2. **Verify installation:**
   - Check that `frappe-charts` appears in your `package.json` dependencies
   - Ensure `node_modules/frappe-charts` exists

3. **Rebuild your application:**
   ```bash
   npm install  # If you just added the dependency
   ng serve    # Restart dev server
   # or
   ng build    # Rebuild
   ```

4. **If using Vite/Angular 17+**: The library now handles missing dependencies gracefully. If you see "frappe-charts is not installed" in the console, simply install it as shown above.

**Note:** Chart sections will display an error state if `frappe-charts` is not installed. The library handles this gracefully, but charts won't render until the dependency is installed.

### Map sections not rendering

Similar to charts, map sections require `leaflet` to be installed:

```bash
npm install leaflet
```

If you're not using map sections, you can skip this dependency.

---

## License

MIT

## Version

1.5.37
