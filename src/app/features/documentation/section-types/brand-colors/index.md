# Brand Colors Section

Displays color swatches, brand palettes, and design system colors.

## Overview

The **Brand Colors Section** is used for displays color swatches, brand palettes, and design system colors.

## Use Cases

- Brand assets
- Design systems
- Color palettes
- Style guides

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'brand-colors';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "Nexus Brand Identity System",
  "type": "brand-colors",
  "description": "Official brand color palette and design tokens",
  "fields": [
    {
      "label": "Nexus Orange",
      "value": "#FF7900",
      "description": "Primary brand color - CTAs, highlights, key actions",
      "category": "Primary"
    },
    {
      "label": "Nexus Orange Light",
      "value": "#FF9933",
      "description": "Hover states, secondary highlights",
      "category": "Primary"
    },
    {
      "label": "Pure White",
      "value": "#FFFFFF",
      "description": "Card backgrounds, contrast areas",
      "category": "Neutral"
    },
    {
      "label": "Chart Pink",
      "value": "#EC4899",
      "description": "Data visualization - series 3",
      "category": "Data Viz"
    }
  ],
  "preferredColumns": 1,
  "priority": 3
}
```

## Best Practices

1. Include hex/RGB values
1. Show color names
1. Group by category
1. Enable copy-to-clipboard

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
