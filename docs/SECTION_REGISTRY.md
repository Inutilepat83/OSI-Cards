# OSI Cards - Section Registry

Documentation for the section registry system and type aliases.

## Table of Contents

- [Overview](#overview)
- [Section Registry](#section-registry)
- [Type Aliases](#type-aliases)
- [Section Metadata](#section-metadata)
- [Extending the Registry](#extending-the-registry)

---

## Overview

The Section Registry (`section-registry.json`) is the **single source of truth** for all section types.

### Features

- Defines 17 built-in section types
- Specifies type aliases for flexible naming
- Contains field/item schemas
- Provides test fixtures
- Generates TypeScript types

---

## Section Registry

### File Location

```
projects/osi-cards-lib/section-registry.json
```

### Structure

```json
{
  "version": "1.0.0",
  "sections": {
    "info": { /* section definition */ },
    "analytics": { /* section definition */ }
  },
  "typeAliases": {
    "metrics": "analytics",
    "stats": "analytics"
  },
  "defaultSection": "fallback"
}
```

### Section Definition

```json
{
  "info": {
    "name": "Info Section",
    "description": "Displays key-value pairs",
    "componentPath": "./lib/components/sections/info-section.component",
    "selector": "app-info-section",
    "useCases": [
      "Company information",
      "Contact details"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": false,
      "defaultColumns": 1
    },
    "fieldSchema": {
      "type": "object",
      "properties": {
        "label": { "type": "string" },
        "value": { "type": ["string", "number"] }
      },
      "required": ["label"]
    }
  }
}
```

---

## Type Aliases

### Built-in Aliases

```typescript
const typeAliases = {
  'metrics': 'analytics',
  'stats': 'analytics',
  'kpis': 'analytics',
  'contacts': 'contact-card',
  'team': 'contact-card',
  'partners': 'network-card',
  'location': 'map',
  'timeline': 'event',
  'testimonials': 'quotation',
  'references': 'text-reference',
  'colors': 'brand-colors'
};
```

### Usage

```typescript
// These are equivalent
const section1: CardSection = { type: 'analytics', ... };
const section2: CardSection = { type: 'metrics', ... };
const section3: CardSection = { type: 'kpis', ... };
```

---

## Section Metadata

### Rendering Properties

```typescript
interface SectionRendering {
  usesFields: boolean;      // Uses fields array
  usesItems: boolean;       // Uses items array
  defaultColumns: number;   // Default column count
  supportsCollapse: boolean; // Can collapse
  supportsEmoji: boolean;   // Supports emoji
}
```

### Schema Definition

```typescript
interface FieldSchema {
  type: 'object';
  properties: {
    [key: string]: {
      type: string | string[];
      description?: string;
      enum?: string[];
    };
  };
  required?: string[];
}
```

---

## Extending the Registry

### Adding a Custom Section

1. Add to `section-registry.json`:

```json
{
  "sections": {
    "custom": {
      "name": "Custom Section",
      "description": "My custom section",
      "componentPath": "./custom-section.component",
      "selector": "app-custom-section",
      "rendering": {
        "usesFields": true,
        "usesItems": false
      }
    }
  }
}
```

2. Create component
3. Register in module
4. Run type generation

### Adding Type Aliases

```json
{
  "typeAliases": {
    "my-custom": "custom"
  }
}
```

---

For detailed implementation, see the full API documentation.
