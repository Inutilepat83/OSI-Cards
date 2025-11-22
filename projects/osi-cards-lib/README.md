# OSI Cards Library

A standalone Angular library for rendering beautiful, interactive AI-powered cards with full functionality including all section types, animations, and styling.

## Installation

```bash
npm install @osi/cards-lib
```

## Peer Dependencies

The library requires the following peer dependencies:

```json
{
  "@angular/common": "^17.0.0",
  "@angular/core": "^17.0.0",
  "@angular/animations": "^17.0.0",
  "@angular/platform-browser": "^17.0.0",
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

### 1. Import the Component

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

### 2. Import Styles

In your `styles.scss`:

```scss
@import '@osi/cards-lib/styles/_styles';
```

Or in `angular.json`:

```json
{
  "styles": [
    "node_modules/@osi/cards-lib/styles/_styles.scss"
  ]
}
```

**Note:** If you're using Tailwind CSS, you may need to include Tailwind directives in your main styles file. The library styles work independently but some utility classes may require Tailwind.

## Usage

### Basic Card

```typescript
import { AICardConfig } from '@osi/cards-lib';

const card: AICardConfig = {
  cardTitle: 'Company Profile',
  cardSubtitle: 'Detailed company information',
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
    "@osi/cards-lib": "file:../osi-cards-lib/dist/osi-cards-lib"
  }
}
```

## License

MIT

