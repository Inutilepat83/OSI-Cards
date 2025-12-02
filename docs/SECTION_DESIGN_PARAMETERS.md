# Section Design Parameters Guide

System for customizing visual appearance of sections.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Design Parameters](#design-parameters)
- [Presets](#presets)
- [API Reference](#api-reference)

---

## Overview

Customize section appearance through the `meta.design` field using CSS custom properties.

### Key Features

- **Type-safe**: Full TypeScript support
- **Flexible**: Support for presets and custom parameters
- **Consistent**: Uses CSS custom properties
- **Non-invasive**: Works without code changes

---

## Quick Start

### Basic Customization

```typescript
const section: CardSection = {
  title: 'My Section',
  type: 'info',
  fields: [...],
  meta: {
    design: {
      itemBackground: '#1a1a2e',
      itemBorderColor: 'rgba(255, 121, 0, 0.3)',
      accentColor: '#ff7900',
      borderRadius: '12px'
    }
  }
};
```

### Using a Preset

```typescript
const section: CardSection = {
  title: 'Analytics Dashboard',
  type: 'analytics',
  fields: [...],
  meta: {
    design: {
      preset: 'glass'
    }
  }
};
```

### Preset with Overrides

```typescript
const section: CardSection = {
  title: 'Sales Metrics',
  type: 'analytics',
  fields: [...],
  meta: {
    design: {
      preset: 'spacious',
      params: {
        accentColor: '#00d9ff'
      }
    }
  }
};
```

---

## Design Parameters

### Color Parameters

```typescript
{
  itemBackground: string; // Background color
  itemBorderColor: string; // Border color
  accentColor: string; // Accent/highlight color
  labelColor: string; // Label text color
  valueColor: string; // Value text color
}
```

### Spacing Parameters

```typescript
{
  itemPadding: string; // Internal padding
  itemGap: string; // Gap between items
  itemMargin: string; // External margin
}
```

### Border Parameters

```typescript
{
  borderRadius: string; // Corner radius
  borderWidth: string; // Border thickness
  borderStyle: string; // Border style (solid, dashed, etc.)
}
```

### Animation Parameters

```typescript
{
  transitionDuration: string; // Animation duration
  hoverScale: number; // Scale on hover
  hoverShadow: string; // Shadow on hover
}
```

---

## Presets

### Available Presets

- `minimal`: Clean, minimal design
- `glass`: Glassmorphism effect
- `spacious`: Extra spacing
- `compact`: Dense layout
- `vibrant`: Bold colors

### Example

```typescript
const section: CardSection = {
  title: 'Dashboard',
  type: 'analytics',
  fields: [...],
  meta: {
    design: { preset: 'glass' }
  }
};
```

---

## API Reference

### SectionDesignParameters Interface

```typescript
interface SectionDesignParameters {
  preset?: string;
  params?: {
    // Colors
    itemBackground?: string;
    itemBorderColor?: string;
    accentColor?: string;
    labelColor?: string;
    valueColor?: string;

    // Spacing
    itemPadding?: string;
    itemGap?: string;

    // Borders
    borderRadius?: string;
    borderWidth?: string;

    // Animation
    transitionDuration?: string;
    hoverScale?: number;
  };
}
```

### Usage in Sections

```typescript
const section: CardSection = {
  title: 'Section Title',
  type: 'info',
  fields: [...],
  meta: {
    design: { /* parameters here */ }
  }
};
```

---

For advanced usage and custom presets, see the full documentation.
