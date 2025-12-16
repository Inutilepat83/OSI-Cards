import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# Table Section

Displays structured tabular data with sorting, filtering, and pagination capabilities.

## Overview

The **Table Section** (\`type: "table"\`) renders interactive data tables with full-featured controls for managing large datasets. Supports multiple data types, column-based sorting, real-time search filtering, and pagination.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`table\` |
| Uses Fields | No |
| Uses Items | No |
| Uses Table Data | Yes |
| Default Columns | 2-3 |
| Supports Collapse | No |
| Aliases | \`data-table\`, \`grid\` |

## Use Cases

- Data tables
- Sales reports
- Inventory lists
- Financial data
- User directories
- Product catalogs
- Transaction logs

## Data Schema

### TableData Schema

| Property | Type | Description |
|----------|------|-------------|
| \`columns\` | TableColumn[] | Array of column definitions (required) |
| \`rows\` | TableRow[] | Array of row data objects (required) |

### TableColumn Schema

| Property | Type | Description |
|----------|------|-------------|
| \`key\` | string | Unique identifier for the column (matches row data keys) (required) |
| \`label\` | string | Display label for the column header (required) |
| \`type\` | 'string' \| 'number' \| 'date' \| 'boolean' | Data type for proper sorting and formatting |
| \`sortable\` | boolean | Whether the column can be sorted (default: true) |
| \`width\` | string | Optional CSS width for the column (e.g., '150px', '20%') |

### TableRow Schema

| Property | Type | Description |
|----------|------|-------------|
| \`[key]\` | string \| number \| boolean \| Date \| null \| undefined | Row data object with keys matching column keys |

## Complete Example

\`\`\`json
{
  "title": "Sales Performance Q1 2025",
  "type": "table",
  "description": "Quarterly sales data by product and region",
  "tableData": {
    "columns": [
      {
        "key": "product",
        "label": "Product",
        "type": "string",
        "sortable": true
      },
      {
        "key": "revenue",
        "label": "Revenue ($)",
        "type": "number",
        "sortable": true
      },
      {
        "key": "date",
        "label": "Sale Date",
        "type": "date",
        "sortable": true
      }
    ],
    "rows": [
      {
        "product": "Widget A",
        "revenue": 4498.5,
        "date": "2025-01-15"
      },
      {
        "product": "Widget B",
        "revenue": 7998.0,
        "date": "2025-01-20"
      }
    ]
  },
  "preferredColumns": 3,
  "priority": 2
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Sales Data",
  "type": "table",
  "tableData": {
    "columns": [
      {
        "key": "product",
        "label": "Product",
        "type": "string",
        "sortable": true
      },
      {
        "key": "revenue",
        "label": "Revenue",
        "type": "number",
        "sortable": true
      }
    ],
    "rows": [
      {
        "product": "Widget A",
        "revenue": 4498.5
      },
      {
        "product": "Widget B",
        "revenue": 7998.0
      }
    ]
  }
}
\`\`\`

## Features

### Sorting

- Click column headers to sort
- Toggle between ascending/descending
- Visual indicators (arrows) show sort state
- Supports string, number, date, and boolean types
- Type-aware sorting for accurate results

### Filtering

- Real-time search across all columns
- Instant filtering as you type
- Case-insensitive matching
- Highlights matching results

### Pagination

- Configurable items per page (default: 10)
- Page navigation controls
- Smart page number display with ellipsis
- Shows current range and total items
- Keyboard accessible

## Column Types

### String
- Default type
- Alphabetical sorting
- Case-insensitive search

### Number
- Numerical sorting
- Right-aligned display
- Locale-aware formatting

### Date
- Date-based sorting
- Formatted display (locale date string)
- Supports ISO date strings

### Boolean
- Boolean sorting (true/false)
- Center-aligned display
- Shows "Yes"/"No" text

## Best Practices

1. Provide tableData with columns and rows
2. Define column types for proper sorting
3. Mark sortable columns appropriately
4. Keep column labels concise and clear
5. Use appropriate column widths for readability
6. Limit initial row count for performance

## Layout Preferences

- **Default:** 2-3 columns (tables need width)
- **Expands to:** 4 columns for wide tables (7+ columns)
- **Shrinks to:** 1 column on mobile
- **Calculated based on:** Column count and row count

## Responsive Behavior

- Horizontal scroll on mobile devices
- Stacked pagination controls on small screens
- Compact spacing on mobile
- Touch-friendly controls

## Accessibility

- Keyboard navigation support
- ARIA labels and roles
- Screen reader friendly
- Focus indicators
- Semantic HTML structure

## Component Information

- **Selector:** \`lib-table-section\`
- **Component Path:** \`./lib/components/sections/table-section/table-section.component\`
- **Style Path:** \`./lib/components/sections/table-section/table-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Sales Performance Q1 2025',
  type: 'table',
  description: 'Quarterly sales data by product and region',
  tableData: {
    columns: [
      {
        key: 'product',
        label: 'Product',
        type: 'string',
        sortable: true,
      },
      {
        key: 'revenue',
        label: 'Revenue ($)',
        type: 'number',
        sortable: true,
      },
      {
        key: 'date',
        label: 'Sale Date',
        type: 'date',
        sortable: true,
      },
    ],
    rows: [
      {
        product: 'Widget A',
        revenue: 4498.5,
        date: '2025-01-15',
      },
      {
        product: 'Widget B',
        revenue: 7998.0,
        date: '2025-01-20',
      },
    ],
  },
  preferredColumns: 3,
  priority: 2,
};

/**
 * Table Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-table-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'table'"
        demoTitle="Live Preview"
        height="450px"
      ></app-docs-demo>
      <app-doc-page [content]="content"></app-doc-page>
    </div>
  `,
  styles: [
    `
      .section-docs {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablePageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default TablePageComponent;
