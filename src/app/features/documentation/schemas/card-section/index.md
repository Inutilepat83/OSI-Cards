# CardSection

Defines a section within a card.

## Overview

`CardSection` represents a single section of content within a card. Each section has a type that determines how it renders.

## Section Definition vs Section Parameters

### Section Definition (Type Metadata)
Section definitions are stored in `*.definition.json` files and describe the **type** of section:
- Component paths, selectors
- Data schemas (fieldSchema, itemSchema)
- Use cases and best practices
- JSON examples for documentation
- Rendering capabilities

**Location**: `projects/osi-cards-lib/src/lib/components/sections/{type}-section/{type}.definition.json`

### Section Parameters (Runtime Data)
The `CardSection` interface defines what can be **passed** to a section instance:
- Content data (fields, items, chartData)
- Layout parameters (preferredColumns, colSpan, etc.)
- Priority and behavior settings
- State (collapsed, etc.)

## Interface Definition

```typescript
interface CardSection {
  // Core identity
  id?: string;
  title: string;
  type: SectionTypeInput;
  description?: string;
  subtitle?: string;

  // Layout parameters
  colSpan?: number;              // Explicit column span override
  preferredColumns?: 1 | 2 | 3 | 4;
  minColumns?: 1 | 2 | 3 | 4;
  maxColumns?: 1 | 2 | 3 | 4;
  orientation?: 'vertical' | 'horizontal' | 'auto';

  // Flexibility
  canShrink?: boolean;
  canGrow?: boolean;
  flexGrow?: boolean;

  // Priority (1-3, where 1 is highest)
  priority?: 1 | 2 | 3;
  layoutPriority?: LayoutPriority;  // 1 | 2 | 3
  columnAffinity?: number;          // Preferred column position (0-indexed)

  // Content
  fields?: CardField[];
  items?: CardItem[];
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut';
  chartData?: ChartData;
  tableData?: TableData;

  // State
  collapsed?: boolean;
  width?: number;
  meta?: Record<string, unknown>;
}
```

## Key Properties

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Section header title |
| `type` | SectionTypeInput | Section type (info, analytics, etc.) |
| `fields` | CardField[] | Key-value data for field-based sections |
| `items` | CardItem[] | List items for item-based sections |
| `chartType` | string | Chart type for chart sections |
| `chartData` | object | Data for chart rendering |

## Layout Properties

| Property | Description |
|----------|-------------|
| `preferredColumns` | Preferred width (1-4 columns) |
| `minColumns` | Minimum width constraint |
| `maxColumns` | Maximum width constraint |
| `orientation` | Content flow direction |
| `layoutPriority` | Priority for space-filling algorithm |

## Example

```json
{
  "title": "Key Metrics",
  "type": "analytics",
  "description": "Performance indicators",
  "preferredColumns": 2,
  "priority": 2,
  "fields": [
    { "label": "Revenue", "value": "$5M", "percentage": 75, "trend": "up" },
    { "label": "Growth", "value": "25%", "percentage": 25, "trend": "up" }
  ]
}
```

## Section Definition Example

See the section definition file for complete examples:

**File**: `projects/osi-cards-lib/src/lib/components/sections/analytics-section/analytics.definition.json`

```json
{
  "type": "analytics",
  "name": "Analytics Section",
  "description": "Displays metrics with visual indicators...",
  "selector": "lib-analytics-section",
  "useCases": ["Performance metrics", "KPIs and dashboards"],
  "bestPractices": ["Include percentage values..."],
  "rendering": {
    "usesFields": true,
    "usesItems": false,
    "defaultColumns": 2,
    "supportsCollapse": true
  },
  "fieldSchema": { ... },
  "examples": {
    "complete": { ... },
    "minimal": { ... },
    "edgeCases": { ... }
  }
}
```
