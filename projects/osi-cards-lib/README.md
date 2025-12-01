# osi-cards-lib

A comprehensive Angular library for rendering AI-generated cards with rich section types, streaming support, and complete CSS encapsulation.

## Features

- **17 Section Types** - Info, Analytics, Chart, List, Contact, Network, Map, Event, Product, Solutions, Financials, and more
- **CSS Encapsulation** - Shadow DOM isolation with CSS Layers for easy style overrides
- **Streaming Support** - Progressive card rendering with LLM-style streaming simulation
- **Theme System** - Built-in themes with full customization via CSS custom properties
- **Plugin Architecture** - Extend with custom section types
- **Accessibility** - WCAG compliant with keyboard navigation and screen reader support
- **Performance** - OnPush change detection, virtual scrolling, and optimized rendering

## Installation

```bash
npm install osi-cards-lib
```

## Quick Start

```typescript
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [AICardRendererComponent],
  template: `
    <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
  `
})
export class ExampleComponent {
  card: AICardConfig = {
    cardTitle: 'Example Card',
    sections: [
      {
        title: 'Info',
        type: 'info',
        fields: [
          { label: 'Name', value: 'Example' }
        ]
      }
    ]
  };
}
```

## Using OsiCardsComponent (Simplified API)

```typescript
import { OsiCardsComponent } from 'osi-cards-lib';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [OsiCardsComponent],
  template: `
    <osi-cards
      [card]="card"
      theme="dark"
      [tiltEnabled]="true"
      (fieldClick)="onFieldClick($event)"
    />
  `
})
export class ExampleComponent {
  card: AICardConfig = { ... };

  onFieldClick(event: CardFieldInteractionEvent) {
    console.log('Field clicked:', event);
  }
}
```

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

## Theming

Apply themes globally or per-card:

```typescript
import { ThemeService } from 'osi-cards-lib';

const themeService = inject(ThemeService);

// Set theme
themeService.setTheme('dark');

// Follow system preference
themeService.setTheme('system');

// Toggle theme
themeService.toggleTheme();

// Apply custom theme
themeService.applyCustomTheme({
  name: 'brand',
  colorScheme: 'light',
  variables: {
    '--osi-card-accent': '#6366f1',
    '--osi-card-background': '#fafafa'
  }
});
```

## Streaming Support

Simulate LLM streaming for progressive card generation:

```typescript
import { OSICardsStreamingService } from 'osi-cards-lib';

const streaming = inject(OSICardsStreamingService);

// Subscribe to card updates
streaming.cardUpdates$.subscribe(update => {
  this.card = update.partialConfig;
});

// Start streaming
streaming.start(jsonString);

// Stop streaming
streaming.stop();
```

## Custom Section Plugins

Extend with your own section types:

```typescript
import { SectionPluginRegistry, BaseSectionComponent, SectionPlugin } from 'osi-cards-lib';

@Component({
  template: `<div class="custom-section">...</div>`
})
export class CustomSectionComponent extends BaseSectionComponent implements SectionPlugin {
  static readonly PLUGIN_TYPE = 'custom-section';

  getPluginType() { return CustomSectionComponent.PLUGIN_TYPE; }
  canHandle(section) { return section.type === this.getPluginType(); }
}

// Register plugin
const registry = inject(SectionPluginRegistry);
registry.register({
  type: 'custom-section',
  name: 'Custom Section',
  component: CustomSectionComponent
});
```

## Section Types

| Type | Description | Data |
|------|-------------|------|
| `info` | General information fields | fields |
| `analytics` | KPIs and metrics | fields |
| `chart` | Charts (bar, line, pie) | chartData |
| `list` | Lists with items | items |
| `contact-card` | Contact information | fields |
| `network-card` | Professional network | items |
| `map` | Geographic locations | items |
| `event` | Timeline/events | items |
| `product` | Product listings | items |
| `solutions` | Solutions/services | items |
| `financials` | Financial data | fields |
| `quotation` | Quotes/testimonials | fields |
| `text-reference` | Citations/references | fields |
| `brand-colors` | Color palettes | items |
| `news` | News articles | items |
| `social-media` | Social profiles | items |
| `overview` | Summary section | fields |

## Documentation

- [API Reference](../../docs/API.md)
- [Theming Guide](../../docs/THEMING_GUIDE.md)
- [Section Types Reference](../../docs/SECTION_TYPES.md)
- [Plugin System](../../docs/PLUGIN_SYSTEM.md)
- [Best Practices](../../docs/BEST_PRACTICES.md)
- [Migration Guide](../../docs/MIGRATION_GUIDE.md)

## License

MIT

## Version

1.4.0
