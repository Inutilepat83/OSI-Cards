# OSI Cards Library

A standalone Angular library for rendering beautiful, interactive AI-powered cards with full functionality including all section types, animations, and styling.

## Installation

### From npm (Recommended)

```bash
npm install osi-cards-lib
```

The package is available on npm and can be installed directly. This is the easiest and recommended way to use the library.

**Package published at:** https://www.npmjs.com/package/osi-cards-lib

### Handling Peer Dependency Conflicts

If you encounter peer dependency conflicts (e.g., with `@ng-select/ng-select`, `@angular-slider/ngx-slider`, or other packages that require Angular 18), you have several options:

#### Option 1: Use --legacy-peer-deps (Recommended for mixed Angular versions)

```bash
npm install osi-cards-lib --legacy-peer-deps
```

This allows npm to ignore peer dependency conflicts. The library will work correctly even if other packages in your project require different Angular versions.

#### Option 2: Update Incompatible Packages

If possible, update packages that require Angular 18 to versions compatible with Angular 20:

```bash
# Check for Angular 20 compatible versions
npm view @ng-select/ng-select versions --json
npm view @angular-slider/ngx-slider versions --json

# Install compatible versions if available
npm install @ng-select/ng-select@latest --legacy-peer-deps
npm install @angular-slider/ngx-slider@latest --legacy-peer-deps
```

#### Option 3: Use --force (Use with caution)

```bash
npm install osi-cards-lib --force
```

**Note:** `osi-cards-lib` requires Angular 20.0.0 or higher. If your project uses Angular 20, the library will work correctly even if you use `--legacy-peer-deps` to resolve conflicts with other packages.

**Package published at:** https://www.npmjs.com/package/osi-cards-lib

## Peer Dependencies

The library requires the following peer dependencies:

```json
{
  "@angular/common": "^20.0.0",
  "@angular/core": "^20.0.0",
  "@angular/animations": "^20.0.0",
  "@angular/platform-browser": "^20.0.0",
  "lucide-angular": "^0.548.0",
  "rxjs": "~7.8.0"
}
```

### Optional Dependencies

For enhanced functionality (charts and maps), you can optionally install:

```bash
npm install chart.js leaflet
```

These are optional - the library works without them, but chart and map sections will have limited functionality.

## Quick Start

### Step 1: Install the Library

Install the library using npm:

```bash
npm install osi-cards-lib
```

**For local development** (if using the library from a local path):

```bash
npm install /path/to/OSI-Cards-1/dist/osi-cards-lib
```

Or add to your `package.json`:

```json
{
  "dependencies": {
    "osi-cards-lib": "file:../OSI-Cards-1/dist/osi-cards-lib"
  }
}
```

### Step 2: Install Peer Dependencies

The library requires these peer dependencies. Install them if not already present:

```bash
npm install osi-cards-lib
npm install @angular/common@^20.0.0 @angular/core@^20.0.0 @angular/animations@^20.0.0 @angular/platform-browser@^20.0.0 lucide-angular@^0.548.0 rxjs@~7.8.0
```

### Step 3: Import Styles

**Option A: Import in your main styles file** (Recommended)

Add this to your `src/styles.scss` (or `styles.css`):

```scss
@import 'osi-cards-lib/styles/_styles';
```

**Option B: Add to angular.json**

Add the styles path to your `angular.json`:

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

**Note:** If you're using Tailwind CSS, you may need to include Tailwind directives in your main styles file. The library styles work independently but some utility classes may require Tailwind.

### Step 4: Import and Use the Card Component

#### In a Standalone Component

```typescript
import { Component } from '@angular/core';
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [AICardRendererComponent], // Import the card component
  template: `
    <div class="container">
      <app-ai-card-renderer [cardConfig]="cardConfig"></app-ai-card-renderer>
    </div>
  `
})
export class MyComponent {
  // Define your card configuration
  cardConfig: AICardConfig = {
    cardTitle: 'My Card Title',
    cardSubtitle: 'Optional subtitle',
    sections: [
      {
        title: 'Overview',
        type: 'overview',
        fields: [
          { label: 'Name', value: 'Example Company' },
          { label: 'Status', value: 'Active' },
          { label: 'Industry', value: 'Technology' }
        ]
      }
    ]
  };
}
```

#### Complete Example with Event Handlers

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  AICardRendererComponent, 
  AICardConfig,
  CardFieldInteractionEvent 
} from 'osi-cards-lib';

@Component({
  selector: 'app-card-example',
  standalone: true,
  imports: [AICardRendererComponent, CommonModule],
  template: `
    <div class="card-container">
      <app-ai-card-renderer
        [cardConfig]="cardConfig"
        [tiltEnabled]="true"
        (fieldInteraction)="onFieldClick($event)"
        (cardInteraction)="onCardInteraction($event)">
      </app-ai-card-renderer>
    </div>
  `,
  styles: [`
    .card-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
  `]
})
export class CardExampleComponent {
  cardConfig: AICardConfig = {
    cardTitle: 'Company Profile',
    cardSubtitle: 'Detailed company information',
    sections: [
      {
        title: 'Company Info',
        type: 'info',
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
          }
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

  onFieldClick(event: CardFieldInteractionEvent): void {
    console.log('Field clicked:', event);
    // Handle field click logic here
  }

  onCardInteraction(event: any): void {
    console.log('Card interaction:', event);
    // Handle card interaction logic here
  }
}
```

### Step 5: Import Types (Optional but Recommended)

For better TypeScript support, import the types you need:

```typescript
import { 
  AICardConfig,      // Main card configuration type
  CardSection,       // Section configuration type
  CardField,         // Field configuration type
  CardAction,        // Action configuration type
  CardType,          // Card type enum
  SectionType        // Section type union
} from 'osi-cards-lib';
```

### Step 6: Verify Installation

After completing the steps above, verify everything is working:

1. ✅ Check that `node_modules/osi-cards-lib` exists
2. ✅ Verify components can be imported without TypeScript errors
3. ✅ Ensure styles are applied (check browser DevTools)
4. ✅ Test rendering a simple card in your application
5. ✅ Check browser console for any errors

### Common Import Patterns

#### Importing Multiple Components

```typescript
import { 
  AICardRendererComponent,
  MasonryGridComponent,
  CardSkeletonComponent 
} from 'osi-cards-lib';
```

#### Importing Services

```typescript
import { 
  IconService,
  SectionNormalizationService,
  MagneticTiltService 
} from 'osi-cards-lib';
```

#### Importing Utilities

```typescript
import { 
  // Utility functions are available through the main export
} from 'osi-cards-lib';
```

See [IMPORT_EXAMPLE.md](./IMPORT_EXAMPLE.md) for comprehensive import examples and advanced usage patterns.

## Usage

### Basic Card Configuration

The card component accepts a `cardConfig` input of type `AICardConfig`. Here's a basic example:

```typescript
import { AICardConfig } from 'osi-cards-lib';

const card: AICardConfig = {
  cardTitle: 'Company Profile',
  cardSubtitle: 'Detailed company information',
  sections: [
    {
      title: 'Company Info',
      type: 'info',
      fields: [
        { label: 'Industry', value: 'Technology' },
        { label: 'Employees', value: '250' },
        { label: 'Founded', value: '2010' }
      ]
    }
  ]
};
```

### Using the Card in Your Template

```html
<app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
```

### Card Component Inputs

The `AICardRendererComponent` accepts the following inputs:

- `cardConfig: AICardConfig` - **Required**. The card configuration object
- `tiltEnabled: boolean` - Enable/disable magnetic tilt effect (default: `true`)
- `loading: boolean` - Show loading skeleton (default: `false`)
- `streamingStage: StreamingStage` - Current streaming stage for animations

### Card Component Outputs (Events)

The component emits the following events:

- `cardInteraction` - Emitted when the card is interacted with
- `fieldInteraction` - Emitted when a field is clicked/interacted
- `agentAction` - Emitted when an agent action is triggered
- `questionAction` - Emitted when a question action is triggered

Example with event handlers:

```typescript
<app-ai-card-renderer
  [cardConfig]="cardConfig"
  (fieldInteraction)="handleFieldClick($event)"
  (cardInteraction)="handleCardClick($event)">
</app-ai-card-renderer>
```

### Example Card Configurations

#### Simple Info Card

```typescript
const infoCard: AICardConfig = {
  cardTitle: 'Contact Information',
  sections: [
    {
      title: 'Details',
      type: 'info',
      fields: [
        { label: 'Name', value: 'John Doe' },
        { label: 'Email', value: 'john@example.com' },
        { label: 'Phone', value: '+1 234 567 8900' }
      ]
    }
  ]
};
```

#### Card with Analytics

```typescript
const analyticsCard: AICardConfig = {
  cardTitle: 'Sales Dashboard',
  sections: [
    {
      title: 'Q4 Performance',
      type: 'analytics',
      fields: [
        { 
          label: 'Revenue', 
          value: 125000,
          change: 12.5,
          trend: 'up',
          format: 'currency'
        },
        { 
          label: 'Growth', 
          value: 8.3,
          change: 2.1,
          trend: 'up',
          format: 'percentage'
        }
      ]
    }
  ]
};
```

#### Card with Multiple Sections

```typescript
const multiSectionCard: AICardConfig = {
  cardTitle: 'Company Overview',
  cardSubtitle: 'Complete company profile',
  sections: [
    {
      title: 'Company Info',
      type: 'overview',
      fields: [
        { label: 'Industry', value: 'Technology' },
        { label: 'Employees', value: '250' }
      ]
    },
    {
      title: 'Key Metrics',
      type: 'analytics',
      fields: [
        { label: 'Revenue', value: 5000000, change: 15, trend: 'up' }
      ]
    },
    {
      title: 'Contact',
      type: 'contact-card',
      fields: [
        { 
          name: 'John Doe',
          role: 'CEO',
          email: 'john@company.com',
          phone: '+1 234 567 8900'
        }
      ]
    }
  ],
  actions: [
    {
      type: 'website',
      label: 'Visit Website',
      url: 'https://company.com',
      variant: 'primary'
    }
  ]
};
```

### All Section Types

The library supports 20+ section types:

- `info` - Key-value pairs
- `overview` - Compact overview display
- `analytics` - Metrics with trends
- `contact-card` - Contact information cards
- `network-card` - Network relationship cards
- `map` - Location display (requires Leaflet for full functionality)
- `financials` - Financial data
- `event` - Timeline/event display
- `list` - List items
- `chart` - Chart visualization (requires Chart.js for full functionality)
- `product` - Product information
- `solutions` - Solutions display
- `quotation` - Quote/testimonial cards
- `text-reference` - Text references
- `brand-colors` - Brand color swatches
- `fallback` - Fallback for unknown types

### Component Events

```typescript
<app-ai-card-renderer
  [cardConfig]="cardConfig"
  (cardInteraction)="onCardInteraction($event)"
  (fieldInteraction)="onFieldInteraction($event)"
  (agentAction)="onAgentAction($event)"
  (questionAction)="onQuestionAction($event)">
</app-ai-card-renderer>
```

### Card Actions

Cards support multiple action types:

- `mail` - Email actions (requires email configuration)
- `website` - Open URL
- `agent` - Trigger agent action
- `question` - Pre-filled question

See `USAGE.md` for detailed API documentation.

## Features

- ✅ 20+ section types
- ✅ Fully standalone (no app dependencies)
- ✅ Magnetic tilt effects
- ✅ Smooth animations
- ✅ Responsive masonry layout
- ✅ TypeScript support
- ✅ Fully typed interfaces
- ✅ Accessible (ARIA support)
- ✅ Customizable styling

## Building

To build the library:

```bash
ng build osi-cards-lib
```

Output will be in `dist/osi-cards-lib/`.

## Distribution

### NPM Package

```bash
cd dist/osi-cards-lib
npm pack
```

### Direct Distribution

Share the `dist/osi-cards-lib/` folder directly.

### Monorepo

Use path references in `package.json`:

```json
{
  "dependencies": {
    "osi-cards-lib": "file:../osi-cards-lib/dist/osi-cards-lib"
  }
}
```

## Troubleshooting

### Module Not Found

**Error**: `Cannot find module 'osi-cards-lib'`

**Solutions**:
- Ensure the library is installed: `npm install osi-cards-lib`
- If using local path, verify the path in `package.json` is correct
- Restart your development server after installation
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Styles Not Loading

**Error**: Components render but styles are not applied

**Solutions**:
- Verify styles are imported in `styles.scss` or `angular.json`
- Check the import path: `@import 'osi-cards-lib/styles/_styles';`
- Ensure SCSS is configured in your Angular project
- Restart the development server after adding styles

### Icons Not Showing

**Error**: Icons are missing or not displaying

**Solutions**:
- Ensure `lucide-angular` is installed: `npm install lucide-angular@^0.548.0`
- Verify the version matches the peer dependency requirement
- Check browser console for icon-related errors

### TypeScript Type Errors

**Error**: TypeScript cannot find types or interfaces

**Solutions**:
- Restart TypeScript server in your IDE (VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")
- Verify the library was built correctly: `ng build osi-cards-lib`
- Check that `osi-cards-lib` is accessible in `node_modules`
- Ensure your Angular version is 20.0.0 or higher

### Build Errors

**Error**: Angular build fails with dependency errors

**Solutions**:
- Verify all peer dependencies are installed
- Check Angular version compatibility (requires Angular 20+)
- Ensure all imports use the correct paths
- Clear build cache: `rm -rf .angular && ng build`

### Optional Dependencies Not Working

**Error**: Charts or maps not rendering properly

**Solutions**:
- Install optional dependencies: `npm install chart.js leaflet`
- Verify they're listed in your `package.json`
- Check browser console for specific errors
- Note: Charts and maps will still render without these, but with limited functionality

## Verification Checklist

After importing the library, verify:

- [ ] Library is installed in `node_modules/osi-cards-lib`
- [ ] All peer dependencies are installed
- [ ] Components can be imported without TypeScript errors
- [ ] Styles are imported and applied correctly
- [ ] Icons are displaying properly
- [ ] TypeScript types are available and working
- [ ] No console errors in browser
- [ ] Components render correctly in the application

## Additional Resources

- [IMPORT_EXAMPLE.md](./IMPORT_EXAMPLE.md) - Comprehensive import examples and usage patterns
- [USAGE.md](./USAGE.md) - Detailed API documentation and advanced usage

## Troubleshooting

### Module Not Found

**Error**: `Cannot find module 'osi-cards-lib'`

**Solutions**:
- Ensure the library is installed: `npm install osi-cards-lib`
- If using local path, verify the path in `package.json` is correct
- Restart your development server after installation
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Styles Not Loading

**Error**: Components render but styles are not applied

**Solutions**:
- Verify styles are imported in `styles.scss` or `angular.json`
- Check the import path: `@import 'osi-cards-lib/styles/_styles';`
- Ensure SCSS is configured in your Angular project
- Restart the development server after adding styles

### Icons Not Showing

**Error**: Icons are missing or not displaying

**Solutions**:
- Ensure `lucide-angular` is installed: `npm install lucide-angular@^0.548.0`
- Verify the version matches the peer dependency requirement
- Check browser console for icon-related errors

### TypeScript Type Errors

**Error**: TypeScript cannot find types or interfaces

**Solutions**:
- Restart TypeScript server in your IDE (VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")
- Verify the library was built correctly: `ng build osi-cards-lib`
- Check that `osi-cards-lib` is accessible in `node_modules`
- Ensure your Angular version is 20.0.0 or higher

### Build Errors

**Error**: Angular build fails with dependency errors

**Solutions**:
- Verify all peer dependencies are installed
- Check Angular version compatibility (requires Angular 20+)
- Ensure all imports use the correct paths
- Clear build cache: `rm -rf .angular && ng build`

### Optional Dependencies Not Working

**Error**: Charts or maps not rendering properly

**Solutions**:
- Install optional dependencies: `npm install chart.js leaflet`
- Verify they're listed in your `package.json`
- Check browser console for specific errors
- Note: Charts and maps will still render without these, but with limited functionality

## Migration Guide

### Migrating from App to Library

If you're migrating from using the app directly to using the library:

1. **Install the library**:
   ```bash
   npm install osi-cards-lib
   ```

2. **Update imports**:
   ```typescript
   // Before
   import { AICardRendererComponent } from './shared/components/cards';
   
   // After
   import { AICardRendererComponent } from 'osi-cards-lib';
   ```

3. **Import styles**:
   ```scss
   @import 'osi-cards-lib/styles/_styles';
   ```

4. **Update service usage**:
   - Services are not exported from the library
   - Use the library components directly
   - Implement your own data providers if needed

5. **Update state management**:
   - The library doesn't include NgRx store
   - Manage card state in your application
   - Pass card configs as inputs to components

### Breaking Changes

#### Version 1.0.0

- All components are now standalone
- Services are not exported (use components directly)
- NgRx store is not included (manage state in your app)

## Advanced Usage

### Custom Section Types

To add custom section types, extend the library components or create your own:

```typescript
import { BaseSectionComponent } from 'osi-cards-lib';

@Component({
  selector: 'app-custom-section',
  standalone: true,
  imports: [CommonModule],
  template: `...`
})
export class CustomSectionComponent extends BaseSectionComponent {
  // Custom implementation
}
```

### Theming

Override design tokens in your styles:

```scss
:root {
  --color-brand: #your-color;
  --card-background: rgba(your, values, here);
  --card-padding: 1.5rem;
}
```

### Performance Optimization

- Use OnPush change detection (already enabled)
- Implement virtual scrolling for large lists
- Lazy load section components if needed
- Use trackBy functions with *ngFor

## API Reference

See [IMPORT_EXAMPLE.md](./IMPORT_EXAMPLE.md) for comprehensive import examples and [USAGE.md](./USAGE.md) for detailed API documentation.

## License

MIT

