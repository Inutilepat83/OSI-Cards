# Info Section

Displays key-value pairs in a clean, scannable format. Ideal for metadata, contact information, and general data display.

## Overview

The Info Section displays structured data in a horizontal row format with labels on the left and values on the right. It supports icons, trends, and change indicators for dynamic data.

**Component:** `lib-info-section`
**Type:** `info`
**Uses Fields:** Yes
**Default Columns:** 1

## Use Cases

- Company information
- Contact details
- Metadata display
- Key-value pairs
- Profile summaries

## Best Practices

- Use for structured data with clear labels and values
- Keep labels concise and descriptive
- Use trend indicators for dynamic data
- Group related fields together
- Use icons to enhance visual hierarchy

## Field Schema

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | string | ✓ | Field label/key |
| `value` | string, number, boolean, null | | Field value |
| `icon` | string | | Icon identifier (emoji or icon name) |
| `description` | string | | Additional field description |
| `trend` | 'up', 'down', 'stable', 'neutral' | | Trend indicator |
| `change` | number | | Numeric change value |
| `format` | 'currency', 'percentage', 'number', 'text' | | Value format |

## Examples

### Basic Usage

```typescript
const section: CardSection = {
  type: 'info',
  title: 'Company Information',
  fields: [
    { label: 'Industry', value: 'Technology' },
    { label: 'Founded', value: '2018' },
    { label: 'Employees', value: '2,847' }
  ]
};
```

### With Icons and Trends

```typescript
const section: CardSection = {
  type: 'info',
  title: 'Company Metrics',
  fields: [
    { label: 'Industry', value: 'Enterprise Software & AI', icon: '🏢' },
    { label: 'Employees', value: '2,847', icon: '👥', trend: 'up', change: 23.5 },
    { label: 'Revenue', value: '$127M ARR', icon: '💰', trend: 'up', change: 45.2 }
  ]
};
```

### Minimal Example

```typescript
const section: CardSection = {
  type: 'info',
  title: 'Quick Info',
  fields: [
    { label: 'Status', value: 'Active' }
  ]
};
```

## Styling

Styles are defined inline in the component. You can customize using CSS custom properties:

```css
--card-label-font-size: 0.5rem;
--card-subtitle-font-size: 0.7rem;
--muted-foreground: #aaa;
--foreground: #fff;
--border: rgba(200, 200, 200, 0.2);
--status-success: #22c55e;
--status-error: #ef4444;
--status-warning: #f59e0b;
```

## Component Files

- `info-section.component.ts` - Component logic and styles
- `info-section.component.html` - Template
- `info.definition.json` - Section metadata and schema
- `README.md` - This documentation





