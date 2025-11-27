# API Reference

Complete API documentation for OSI Cards library.

## Core Components

### AICardRendererComponent

Main component for rendering OSI Cards.

**Selector**: `app-ai-card-renderer`

**Inputs**:
- `cardConfig: AICardConfig` - Card configuration object
- `tiltEnabled: boolean` - Enable magnetic tilt effect (default: `true`)
- `isFullscreen: boolean` - Fullscreen mode (default: `false`)

**Outputs**:
- `cardInteraction` - Emitted on card-level interactions
- `fieldInteraction` - Emitted on field-level interactions
- `sectionEvent` - Emitted on section events
- `layoutChange` - Emitted when layout changes
- `export` - Emitted when export is requested

**Example**:

```typescript
<app-ai-card-renderer
  [cardConfig]="myCard"
  [tiltEnabled]="true"
  (cardInteraction)="handleCardInteraction($event)">
</app-ai-card-renderer>
```

## Data Models

### AICardConfig

Main card configuration interface.

```typescript
interface AICardConfig {
  id?: string;
  cardTitle: string;
  cardSubtitle?: string;
  cardType?: CardType;
  sections: CardSection[];
  actions?: CardAction[];
  description?: string;
  columns?: number;
}
```

### CardSection

Section configuration interface.

```typescript
interface CardSection {
  id?: string;
  title: string;
  type: SectionType;
  subtitle?: string;
  description?: string;
  fields?: CardField[];
  items?: CardItem[];
  // ... additional properties
}
```

### CardField

Field configuration interface.

```typescript
interface CardField {
  id?: string;
  label?: string;
  value: unknown;
  type?: FieldType;
  format?: string;
  // ... additional properties
}
```

## Section Types

OSI Cards supports 20+ section types:

- `info` - Information display
- `analytics` - Analytics and metrics
- `list` - List items
- `table` - Tabular data
- `chart` - Chart visualization
- `map` - Map display
- `contact` - Contact information
- `product` - Product details
- `quotation` - Quotations
- `text-reference` - Text references
- And more...

## Services

### CardDataService

Service for loading and managing card data.

```typescript
class CardDataService {
  getCardsByType(type: CardType): Observable<AICardConfig[]>;
  getAvailableCardTypes(): Observable<CardType[]>;
  loadCard(id: string): Observable<AICardConfig>;
}
```

## Utilities

### Card Utilities

```typescript
// Ensure card has IDs
ensureCardIds(card: AICardConfig): AICardConfig;

// Remove all IDs
removeAllIds(card: AICardConfig): AICardConfig;

// Type guards
CardTypeGuards.isAICardConfig(data: unknown): boolean;
```

## Styling

### CSS Variables

OSI Cards uses CSS custom properties for theming:

```css
--primary: #FF7900;
--background: #000000;
--foreground: #ffffff;
--border: rgba(255, 255, 255, 0.1);
/* ... more variables */
```

### Import Styles

```scss
@import 'osi-cards-lib/styles/_styles.scss';
```

## Examples

### Basic Card

```typescript
const card: AICardConfig = {
  cardTitle: "Company Overview",
  sections: [
    {
      title: "Details",
      type: "info",
      fields: [
        { label: "Industry", value: "Technology" },
        { label: "Employees", value: "1000+" }
      ]
    }
  ]
};
```

### Card with Multiple Sections

```typescript
const card: AICardConfig = {
  cardTitle: "Sales Dashboard",
  sections: [
    {
      title: "Metrics",
      type: "analytics",
      fields: [
        { label: "Revenue", value: "$1.2M", percentage: 85 }
      ]
    },
    {
      title: "Team",
      type: "list",
      items: [
        { title: "John Doe", description: "Sales Manager" }
      ]
    }
  ]
};
```

## TypeScript Support

Full TypeScript definitions are included. Import types:

```typescript
import { 
  AICardConfig, 
  CardSection, 
  CardField,
  CardType 
} from 'osi-cards-lib';
```

## Resources

- **npm Package**: https://www.npmjs.com/package/osi-cards-lib
- **GitHub**: https://github.com/Inutilepat83/OSI-Cards
- **Type Definitions**: Included in package

## Support

For questions or issues:
- Check [GitHub Issues](https://github.com/Inutilepat83/OSI-Cards/issues)
- Review [Getting Started](./getting-started) guide
- See [Installation](./installation) instructions

