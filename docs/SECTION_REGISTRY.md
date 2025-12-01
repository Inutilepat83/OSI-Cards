# OSI Cards - Section Registry

This guide documents the section registry system, type aliases, and how to extend section types.

## Table of Contents

- [Overview](#overview)
- [Section Registry](#section-registry)
- [Type Aliases](#type-aliases)
- [Type Resolution](#type-resolution)
- [Section Metadata](#section-metadata)
- [Registry Schema](#registry-schema)
- [Extending the Registry](#extending-the-registry)
- [Generated Types](#generated-types)
- [Utility Functions](#utility-functions)
- [Best Practices](#best-practices)

---

## Overview

The Section Registry (`section-registry.json`) is the **single source of truth** for all section types in OSI Cards. It:

- Defines all 17 built-in section types
- Specifies type aliases for flexible naming
- Contains field/item schemas for validation
- Provides test fixtures for automated testing
- Generates TypeScript types and component maps

---

## Section Registry

### File Location

```
projects/osi-cards-lib/section-registry.json
```

### Structure

```json
{
  "$schema": "./section-registry.schema.json",
  "version": "1.0.0",
  "description": "Single source of truth for all OSI Cards section types",
  "sections": {
    "info": { /* section definition */ },
    "analytics": { /* section definition */ },
    // ... 17 section types
  },
  "typeAliases": {
    "metrics": "analytics",
    "stats": "analytics",
    // ... 11 aliases
  },
  "defaultSection": "fallback"
}
```

### Section Definition

Each section in the registry has the following structure:

```json
{
  "info": {
    "name": "Info Section",
    "description": "Displays key-value pairs in a clean, scannable format.",
    "componentPath": "./lib/components/sections/info-section.component",
    "stylePath": "./lib/styles/components/sections/_info.scss",
    "selector": "app-info-section",
    "useCases": [
      "Company information",
      "Contact details",
      "Metadata display"
    ],
    "bestPractices": [
      "Use for structured data with clear labels and values",
      "Keep labels concise and descriptive"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": false,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": true
    },
    "fieldSchema": {
      "type": "object",
      "properties": {
        "label": { "type": "string", "description": "Field label/key" },
        "value": { "type": ["string", "number", "boolean", "null"] },
        "icon": { "type": "string", "description": "Icon identifier" },
        "trend": { "type": "string", "enum": ["up", "down", "stable", "neutral"] }
      },
      "required": ["label"]
    },
    "testFixtures": {
      "complete": { /* full example */ },
      "minimal": { /* minimal example */ },
      "edgeCases": { /* edge case testing */ }
    }
  }
}
```

---

## Type Aliases

Type aliases allow alternative names for section types, providing flexibility for LLM-generated content.

### Built-in Aliases

| Alias | Resolves To |
|-------|-------------|
| `metrics` | `analytics` |
| `stats` | `analytics` |
| `timeline` | `event` |
| `table` | `list` |
| `locations` | `map` |
| `quote` | `quotation` |
| `reference` | `text-reference` |
| `text-ref` | `text-reference` |
| `brands` | `brand-colors` |
| `colors` | `brand-colors` |
| `project` | `info` |

### Using Aliases

```typescript
// These are equivalent:
{ type: 'analytics', title: 'Metrics', fields: [...] }
{ type: 'metrics', title: 'Metrics', fields: [...] }
{ type: 'stats', title: 'Metrics', fields: [...] }

// These are equivalent:
{ type: 'list', title: 'Items', items: [...] }
{ type: 'table', title: 'Items', items: [...] }
```

### Why Aliases Exist

1. **LLM Flexibility** - Language models may use different terminology
2. **Backward Compatibility** - Support legacy type names
3. **Domain-Specific Naming** - Use names that match your domain
4. **Natural Language** - Allow more intuitive type names

---

## Type Resolution

When rendering a section, the system resolves the type through multiple steps:

### Resolution Order

```
┌─────────────────────────────────────────────────────────┐
│                    Type Resolution Flow                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Input: section.type = "metrics"                     │
│              ↓                                           │
│  2. Check SectionPluginRegistry                         │
│     • Is there a custom plugin for "metrics"?           │
│     • If yes → return plugin component                  │
│              ↓                                           │
│  3. Resolve Type Alias                                  │
│     • "metrics" → "analytics"                           │
│              ↓                                           │
│  4. Look up in SECTION_COMPONENT_MAP                    │
│     • "analytics" → AnalyticsSectionComponent           │
│              ↓                                           │
│  5. Return component (or FallbackSectionComponent)      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Resolution API

```typescript
import {
  resolveSectionType,
  isValidSectionType,
  getSectionMetadata,
  SECTION_TYPE_ALIASES
} from 'osi-cards-lib';

// Resolve alias to canonical type
const canonical = resolveSectionType('metrics'); // 'analytics'
const same = resolveSectionType('analytics');    // 'analytics'

// Check if type is valid (canonical or alias)
isValidSectionType('metrics');  // true
isValidSectionType('stats');    // true
isValidSectionType('unknown');  // false

// Get metadata for any valid type
const meta = getSectionMetadata('metrics'); // Returns analytics metadata
console.log(meta.usesFields);    // true
console.log(meta.defaultColumns); // 2

// Access alias map directly
console.log(SECTION_TYPE_ALIASES.metrics); // 'analytics'
```

---

## Section Metadata

Each section type has associated metadata available at runtime:

### SectionMetadata Interface

```typescript
interface SectionMetadata {
  name: string;           // Human-readable name
  usesFields: boolean;    // Section uses fields array
  usesItems: boolean;     // Section uses items array
  usesChartData: boolean; // Section uses chartData
  defaultColumns: number; // Default grid column span (1-4)
  supportsCollapse: boolean; // Can be collapsed
  supportsEmoji: boolean; // Supports emoji icons
  requiresExternalLib: string | undefined; // e.g., 'leaflet', 'chart.js'
  selector: string;       // Angular component selector
}
```

### Metadata Reference

| Type | Fields | Items | Chart | Columns | External Lib |
|------|--------|-------|-------|---------|--------------|
| `info` | Yes | No | No | 1 | - |
| `analytics` | Yes | No | No | 2 | - |
| `contact-card` | Yes | No | No | 2 | - |
| `network-card` | No | Yes | No | 1 | - |
| `map` | Yes | No | No | 1 | leaflet |
| `financials` | Yes | No | No | 2 | - |
| `event` | Yes | Yes | No | 1 | - |
| `list` | No | Yes | No | 1 | - |
| `chart` | No | No | Yes | 2 | chart.js |
| `product` | Yes | No | No | 1 | - |
| `solutions` | Yes | Yes | No | 1 | - |
| `overview` | Yes | No | No | 1 | - |
| `quotation` | Yes | No | No | 1 | - |
| `text-reference` | Yes | No | No | 1 | - |
| `brand-colors` | Yes | No | No | 2 | - |
| `news` | No | Yes | No | 1 | - |
| `social-media` | Yes | Yes | No | 1 | - |
| `fallback` | Yes | Yes | No | 1 | - |

### Using Metadata

```typescript
import { getSectionMetadata, SECTION_METADATA } from 'osi-cards-lib';

// Get metadata for a specific type
const chartMeta = getSectionMetadata('chart');
if (chartMeta?.requiresExternalLib === 'chart.js') {
  // Lazy load Chart.js
  await loadChartJS();
}

// Access all metadata
Object.entries(SECTION_METADATA).forEach(([type, meta]) => {
  if (meta.usesFields) {
    console.log(`${type} uses fields`);
  }
});

// Filter sections by capability
const fieldSections = Object.entries(SECTION_METADATA)
  .filter(([_, meta]) => meta.usesFields)
  .map(([type]) => type);
// ['info', 'analytics', 'contact-card', ...]
```

---

## Registry Schema

The registry is validated against a JSON Schema.

### Schema Location

```
projects/osi-cards-lib/section-registry.schema.json
```

### Key Schema Definitions

```json
{
  "SectionDefinition": {
    "required": ["name", "description", "componentPath", "selector", "rendering"],
    "properties": {
      "name": { "type": "string" },
      "description": { "type": "string" },
      "componentPath": { "type": "string" },
      "stylePath": { "type": "string" },
      "selector": { "pattern": "^app-[a-z-]+$" },
      "useCases": { "type": "array", "items": { "type": "string" } },
      "bestPractices": { "type": "array", "items": { "type": "string" } },
      "rendering": { "$ref": "#/definitions/RenderingConfig" },
      "fieldSchema": { "$ref": "#/definitions/JSONSchema" },
      "itemSchema": { "$ref": "#/definitions/JSONSchema" },
      "aliases": { "type": "array", "items": { "type": "string" } },
      "testFixtures": { "$ref": "#/definitions/TestFixtures" }
    }
  },

  "RenderingConfig": {
    "required": ["usesFields", "usesItems", "defaultColumns"],
    "properties": {
      "usesFields": { "type": "boolean" },
      "usesItems": { "type": "boolean" },
      "usesChartData": { "type": "boolean" },
      "defaultColumns": { "type": "integer", "minimum": 1, "maximum": 4 },
      "supportsCollapse": { "type": "boolean" },
      "supportsEmoji": { "type": "boolean" },
      "requiresExternalLib": { "type": "string" }
    }
  },

  "TestFixtures": {
    "properties": {
      "complete": { "type": "object" },
      "minimal": { "type": "object" },
      "edgeCases": { "type": "object" },
      "streaming": { "type": "object" },
      "accessibility": { "type": "object" }
    }
  }
}
```

---

## Extending the Registry

### Adding a New Section Type

1. **Add to section-registry.json**:

```json
{
  "sections": {
    "my-custom": {
      "name": "My Custom Section",
      "description": "A custom section for my domain",
      "componentPath": "./lib/components/sections/my-custom-section.component",
      "stylePath": "./lib/styles/components/sections/_my-custom.scss",
      "selector": "app-my-custom-section",
      "useCases": ["Custom use case 1", "Custom use case 2"],
      "bestPractices": ["Best practice 1"],
      "rendering": {
        "usesFields": true,
        "usesItems": false,
        "defaultColumns": 2,
        "supportsCollapse": true,
        "supportsEmoji": true
      },
      "fieldSchema": {
        "type": "object",
        "properties": {
          "label": { "type": "string" },
          "value": { "type": "string" }
        },
        "required": ["label"]
      },
      "testFixtures": {
        "complete": {
          "title": "My Custom Section",
          "type": "my-custom",
          "fields": [{ "label": "Test", "value": "Value" }]
        },
        "minimal": {
          "title": "My Custom",
          "type": "my-custom",
          "fields": []
        }
      }
    }
  }
}
```

2. **Add aliases (optional)**:

```json
{
  "typeAliases": {
    "custom": "my-custom",
    "my-section": "my-custom"
  }
}
```

3. **Regenerate types**:

```bash
npm run generate:from-registry
```

4. **Create the component** (see [Plugin System](./PLUGIN_SYSTEM.md)).

### Adding Type Aliases Only

If you just want to add aliases for existing types:

```json
{
  "typeAliases": {
    "kpi": "analytics",
    "dashboard-metrics": "analytics",
    "performance": "analytics"
  }
}
```

---

## Generated Types

The registry generates TypeScript types automatically.

### Generated File

```
projects/osi-cards-lib/src/lib/models/generated-section-types.ts
```

### Generated Types

```typescript
// Canonical section types
export type SectionType =
  | 'info'
  | 'analytics'
  | 'contact-card'
  // ... all 17 types
  | 'fallback';

// Type aliases
export type SectionTypeAlias =
  | 'metrics'
  | 'stats'
  | 'timeline'
  // ... all 11 aliases;

// All accepted inputs (canonical + aliases)
export type SectionTypeInput = SectionType | SectionTypeAlias;

// Section arrays
export const PUBLIC_SECTION_TYPES: SectionType[] = [...];
export const ALL_SECTION_TYPES: SectionType[] = [...];

// Metadata map
export const SECTION_METADATA: Record<SectionType, SectionMetadata> = {...};

// Alias resolution map
export const SECTION_TYPE_ALIASES: Record<SectionTypeAlias, SectionType> = {...};
```

### Using Generated Types

```typescript
import {
  SectionType,
  SectionTypeInput,
  PUBLIC_SECTION_TYPES,
  SECTION_METADATA
} from 'osi-cards-lib';

// Type-safe section type
function createSection(type: SectionType): CardSection {
  return { type, title: `${type} Section`, fields: [] };
}

// Accept aliases too
function createSectionFlexible(type: SectionTypeInput): CardSection {
  return { type, title: `Section`, fields: [] };
}

// Validate user input
function validateType(input: string): input is SectionTypeInput {
  return isValidSectionType(input);
}

// List all available types
console.log('Available types:', PUBLIC_SECTION_TYPES);
```

---

## Utility Functions

### resolveSectionType

Resolves aliases to canonical types:

```typescript
resolveSectionType('metrics');     // 'analytics'
resolveSectionType('analytics');   // 'analytics'
resolveSectionType('table');       // 'list'
resolveSectionType('unknown');     // 'unknown' (unchanged)
```

### isValidSectionType

Type guard for valid section types:

```typescript
if (isValidSectionType(userInput)) {
  // TypeScript knows userInput is SectionTypeInput
  const meta = getSectionMetadata(userInput);
}
```

### getSectionMetadata

Get metadata for any valid type:

```typescript
const meta = getSectionMetadata('metrics'); // Returns analytics metadata
if (meta) {
  console.log(meta.name);           // "Analytics Section"
  console.log(meta.defaultColumns); // 2
}
```

### DynamicSectionLoaderService Methods

```typescript
const loader = inject(DynamicSectionLoaderService);

// Get component for a section
const component = loader.getComponentForSection(section);

// Check if type is supported
loader.isTypeSupported('metrics'); // true

// Get all supported types (built-in + plugins)
const types = loader.getSupportedTypes();

// Resolve type to canonical form
const resolved = loader.resolveType('stats'); // 'analytics'
```

---

## Best Practices

### 1. Use Canonical Types When Possible

```typescript
// ✅ Prefer canonical types for clarity
{ type: 'analytics', ... }

// ⚠️ Aliases work but are less explicit
{ type: 'metrics', ... }
```

### 2. Check Type Validity

```typescript
// ✅ Always validate external input
function handleUserType(type: string) {
  if (!isValidSectionType(type)) {
    console.warn(`Unknown type: ${type}, using fallback`);
    return 'fallback';
  }
  return resolveSectionType(type);
}
```

### 3. Use Type-Safe APIs

```typescript
// ✅ Use typed functions
import { SectionType, CardSection } from 'osi-cards-lib';

function createSection(type: SectionType, title: string): CardSection {
  const meta = getSectionMetadata(type);
  return {
    type,
    title,
    fields: meta?.usesFields ? [] : undefined,
    items: meta?.usesItems ? [] : undefined
  };
}
```

### 4. Leverage Metadata for Dynamic Behavior

```typescript
// ✅ Use metadata to determine behavior
const meta = getSectionMetadata(section.type);

if (meta?.requiresExternalLib === 'chart.js') {
  await loadChartLibrary();
}

if (meta?.supportsCollapse) {
  showCollapseButton();
}
```

### 5. Keep Registry Updated

When adding new features:

1. Update `section-registry.json` first
2. Run code generation
3. Implement the component
4. Add tests using fixtures from registry

---

## Related Documentation

- [Section Types Reference](./SECTION_TYPES.md) - Detailed section examples
- [Section Comparison](./SECTION_COMPARISON.md) - Quick comparison table
- [Plugin System](./PLUGIN_SYSTEM.md) - Creating custom sections
- [API Reference](./API.md) - Full API documentation
- [LLM Prompt](./LLM_PROMPT.md) - Generated LLM system prompt



