# OSI Cards Library - Import Examples

This document provides comprehensive examples for importing and using the OSI Cards library in your Angular project.

## Table of Contents

1. [Installation](#installation)
2. [Basic Import](#basic-import)
3. [Standalone Component Usage](#standalone-component-usage)
4. [Style Import](#style-import)
5. [With Optional Dependencies](#with-optional-dependencies)
6. [Type Imports](#type-imports)
7. [Service Usage](#service-usage)
8. [Troubleshooting](#troubleshooting)

## Installation

### Via npm (when published)

```bash
npm install @osi/cards-lib
```

### Via Local Path (Development)

```bash
npm install /path/to/OSI-Cards-1/dist/osi-cards-lib
```

Or in `package.json`:

```json
{
  "dependencies": {
    "@osi/cards-lib": "file:../OSI-Cards-1/dist/osi-cards-lib"
  }
}
```

### Install Peer Dependencies

```bash
npm install @angular/common@^17.0.0 @angular/core@^17.0.0 @angular/animations@^17.0.0 @angular/platform-browser@^17.0.0 lucide-angular@^0.548.0 rxjs@~7.8.0
```

### Optional Dependencies (for charts and maps)

```bash
npm install chart.js leaflet
```

## Basic Import

### Import Component

```typescript
import { AICardRendererComponent } from '@osi/cards-lib';
```

### Import Types

```typescript
import { AICardConfig, CardSection, CardField } from '@osi/cards-lib';
```

### Import Services

```typescript
import { IconService, SectionNormalizationService, MagneticTiltService } from '@osi/cards-lib';
```

## Standalone Component Usage

### Minimal Example

```typescript
import { Component } from '@angular/core';
import { AICardRendererComponent } from '@osi/cards-lib';
import { AICardConfig } from '@osi/cards-lib';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [AICardRendererComponent],
  template: `
    <app-ai-card-renderer [cardConfig]="cardConfig"></app-ai-card-renderer>
  `
})
export class ExampleComponent {
  cardConfig: AICardConfig = {
    cardTitle: 'My Card',
    sections: [
      {
        title: 'Overview',
        type: 'overview',
        fields: [
          { label: 'Name', value: 'Example' },
          { label: 'Status', value: 'Active' }
        ]
      }
    ]
  };
}
```

### With Event Handlers

```typescript
import { Component } from '@angular/core';
import { AICardRendererComponent, AICardConfig, CardFieldInteractionEvent } from '@osi/cards-lib';

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
    cardTitle: 'Company Profile',
    sections: [
      {
        title: 'Company Info',
        type: 'info',
        fields: [
          { label: 'Industry', value: 'Technology' },
          { label: 'Employees', value: '250' }
        ]
      }
    ]
  };

  onFieldClick(event: CardFieldInteractionEvent): void {
    console.log('Field clicked:', event);
  }

  onAgentAction(event: any): void {
    console.log('Agent action:', event);
  }
}
```

### Multiple Cards

```typescript
import { Component } from '@angular/core';
import { AICardRendererComponent, AICardConfig } from '@osi/cards-lib';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-multiple-cards',
  standalone: true,
  imports: [AICardRendererComponent, CommonModule],
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
    {
      cardTitle: 'Card 1',
      sections: [{ title: 'Section 1', type: 'info', fields: [] }]
    },
    {
      cardTitle: 'Card 2',
      sections: [{ title: 'Section 2', type: 'overview', fields: [] }]
    }
  ];
}
```

## Style Import

### Option 1: Import in styles.scss

```scss
// In your src/styles.scss
@import '@osi/cards-lib/styles/_styles';
```

### Option 2: Import in angular.json

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "node_modules/@osi/cards-lib/styles/_styles.scss",
              "src/styles.scss"
            ]
          }
        }
      }
    }
  }
}
```

### Option 3: Import with Tailwind (if using Tailwind CSS)

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

@import '@osi/cards-lib/styles/_styles';
```

## With Optional Dependencies

### Using Chart Sections

If you have `chart.js` installed:

```typescript
import { AICardConfig } from '@osi/cards-lib';

const cardWithChart: AICardConfig = {
  cardTitle: 'Analytics Dashboard',
  sections: [
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
  ]
};
```

### Using Map Sections

If you have `leaflet` installed:

```typescript
import { AICardConfig } from '@osi/cards-lib';

const cardWithMap: AICardConfig = {
  cardTitle: 'Locations',
  sections: [
    {
      title: 'Headquarters',
      type: 'map',
      fields: [
        {
          name: 'Headquarters',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          address: '123 Main St, New York, NY'
        }
      ]
    }
  ]
};
```

**Note**: Chart and map sections will still render without these dependencies, but with limited functionality.

## Type Imports

### Import All Types

```typescript
import {
  AICardConfig,
  CardSection,
  CardField,
  CardItem,
  CardAction,
  CardType,
  SectionType
} from '@osi/cards-lib';
```

### Import Component Types

```typescript
import {
  AICardRendererComponent,
  CardFieldInteractionEvent,
  StreamingStage
} from '@osi/cards-lib';
```

### Import Service Types

```typescript
import {
  IconService,
  SectionNormalizationService,
  MagneticTiltService,
  SectionUtilsService
} from '@osi/cards-lib';
```

## Service Usage

### Using IconService

```typescript
import { Component, inject } from '@angular/core';
import { IconService } from '@osi/cards-lib';

@Component({
  selector: 'app-icon-example',
  standalone: true,
  template: '<p>Icon: {{ iconName }}</p>'
})
export class IconExampleComponent {
  private iconService = inject(IconService);
  iconName = this.iconService.getFieldIcon('email');
}
```

### Using SectionNormalizationService

```typescript
import { Component, inject } from '@angular/core';
import { SectionNormalizationService, CardSection } from '@osi/cards-lib';

@Component({
  selector: 'app-normalize-example',
  standalone: true,
  template: '...'
})
export class NormalizeExampleComponent {
  private normalizationService = inject(SectionNormalizationService);
  
  normalizeSections(sections: CardSection[]): CardSection[] {
    return this.normalizationService.normalizeAndSortSections(sections);
  }
}
```

### Using SectionUtilsService

```typescript
import { Component, inject } from '@angular/core';
import { SectionUtilsService } from '@osi/cards-lib';

@Component({
  selector: 'app-utils-example',
  standalone: true,
  template: '...'
})
export class UtilsExampleComponent {
  private utils = inject(SectionUtilsService);
  
  getTrendIcon(trend: string): string {
    return this.utils.getTrendIcon(trend);
  }
  
  formatChange(change: number): string {
    return this.utils.formatChange(change);
  }
}
```

## Complete Example

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  AICardRendererComponent,
  AICardConfig,
  CardFieldInteractionEvent
} from '@osi/cards-lib';

@Component({
  selector: 'app-complete-example',
  standalone: true,
  imports: [AICardRendererComponent, CommonModule],
  template: `
    <div class="container">
      <h1>My Application</h1>
      <app-ai-card-renderer
        [cardConfig]="cardConfig"
        [tiltEnabled]="true"
        (fieldInteraction)="handleFieldClick($event)"
        (cardInteraction)="handleCardInteraction($event)">
      </app-ai-card-renderer>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
  `]
})
export class CompleteExampleComponent {
  cardConfig: AICardConfig = {
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
      }
    ]
  };

  handleFieldClick(event: CardFieldInteractionEvent): void {
    console.log('Field interaction:', event);
    // Handle field click logic
  }

  handleCardInteraction(event: any): void {
    console.log('Card interaction:', event);
    // Handle card interaction logic
  }
}
```

## Troubleshooting

### Issue: Module not found

**Error**: `Cannot find module '@osi/cards-lib'`

**Solution**:
1. Ensure the library is installed: `npm install @osi/cards-lib`
2. If using local path, verify the path is correct
3. Restart your development server

### Issue: Styles not loading

**Error**: Styles not applied to components

**Solution**:
1. Verify styles are imported in `styles.scss` or `angular.json`
2. Check the import path: `@import '@osi/cards-lib/styles/_styles';`
3. Ensure SCSS is configured in your Angular project

### Issue: Icons not showing

**Error**: Icons are missing

**Solution**:
1. Ensure `lucide-angular` is installed: `npm install lucide-angular@^0.548.0`
2. Verify `LucideIconsModule` is imported (it's included in the library)

### Issue: Type errors

**Error**: TypeScript cannot find types

**Solution**:
1. Ensure `@osi/cards-lib` is in your `tsconfig.json` paths (if using local path)
2. Restart TypeScript server in your IDE
3. Verify the library was built correctly

### Issue: Optional dependencies not working

**Error**: Charts or maps not rendering

**Solution**:
1. Install optional dependencies: `npm install chart.js leaflet`
2. Verify they're in your `package.json`
3. Check browser console for specific errors

### Issue: Build errors

**Error**: Angular build fails

**Solution**:
1. Verify all peer dependencies are installed
2. Check Angular version compatibility (requires Angular 17+)
3. Ensure all imports use the correct paths
4. Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Verification Checklist

After importing the library, verify:

- [ ] Library is installed in `node_modules/@osi/cards-lib`
- [ ] Components can be imported without errors
- [ ] Styles are imported and applied
- [ ] Icons are displaying correctly
- [ ] TypeScript types are available
- [ ] No console errors in browser
- [ ] Components render correctly

## Next Steps

- See [README.md](./README.md) for more information
- See [USAGE.md](./USAGE.md) for detailed API documentation
- Check the main project repository for examples







