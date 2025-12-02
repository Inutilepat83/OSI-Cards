# Brand Colors Section

Displays color swatches, brand palettes, and design system colors.

## Overview

The **Brand Colors Section** (`type: "brand-colors"`) is used for displays color swatches, brand palettes, and design system colors.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `brand-colors` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 2 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Brand assets
- Design systems
- Color palettes
- Style guides
- Brand identity

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Color name/label |
| `value` | string | Color value (hex, rgb, etc.) |
| `description` | string | Color description/usage |
| `category` | string | Color category (primary, secondary, etc.) |



## Complete Example

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
      "label": "Nexus Orange Dark",
      "value": "#CC6100",
      "description": "Active states, emphasis",
      "category": "Primary"
    },
    {
      "label": "Midnight Blue",
      "value": "#0A1628",
      "description": "Primary text, headers, dark backgrounds",
      "category": "Secondary"
    },
    {
      "label": "Deep Navy",
      "value": "#1A2744",
      "description": "Secondary backgrounds, cards",
      "category": "Secondary"
    },
    {
      "label": "Slate Gray",
      "value": "#64748B",
      "description": "Secondary text, borders, icons",
      "category": "Neutral"
    },
    {
      "label": "Silver",
      "value": "#E2E8F0",
      "description": "Dividers, subtle backgrounds",
      "category": "Neutral"
    },
    {
      "label": "Cloud White",
      "value": "#F8FAFC",
      "description": "Page backgrounds, card surfaces",
      "category": "Neutral"
    },
    {
      "label": "Pure White",
      "value": "#FFFFFF",
      "description": "Card backgrounds, contrast areas",
      "category": "Neutral"
    },
    {
      "label": "Success Green",
      "value": "#10B981",
      "description": "Success states, positive trends, completion",
      "category": "Semantic"
    },
    {
      "label": "Warning Amber",
      "value": "#F59E0B",
      "description": "Warning states, caution indicators",
      "category": "Semantic"
    },
    {
      "label": "Error Red",
      "value": "#EF4444",
      "description": "Error states, critical alerts",
      "category": "Semantic"
    },
    {
      "label": "Info Blue",
      "value": "#3B82F6",
      "description": "Informational, links, interactive elements",
      "category": "Semantic"
    },
    {
      "label": "Chart Teal",
      "value": "#14B8A6",
      "description": "Data visualization - series 1",
      "category": "Data Viz"
    },
    {
      "label": "Chart Purple",
      "value": "#8B5CF6",
      "description": "Data visualization - series 2",
      "category": "Data Viz"
    },
    {
      "label": "Chart Pink",
      "value": "#EC4899",
      "description": "Data visualization - series 3",
      "category": "Data Viz"
    }
  ]
}
```

## Minimal Example

```json
{
  "title": "Colors",
  "type": "brand-colors",
  "fields": [
    {
      "label": "Primary",
      "value": "#000000"
    }
  ]
}
```

## Best Practices

1. Include hex/RGB values
2. Show color names
3. Group by category
4. Enable copy-to-clipboard
5. Show usage guidelines

## Component Information

- **Selector:** `lib-brand-colors-section`
- **Component Path:** `./lib/components/sections/brand-colors-section/brand-colors-section.component`


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
