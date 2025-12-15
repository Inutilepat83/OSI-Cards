# Table Section

Displays structured tabular data with advanced features including sorting, filtering, and pagination.

## Overview

The Table Section renders interactive data tables with full-featured controls for managing large datasets. Supports multiple data types, column-based sorting, real-time search filtering, and pagination.

**Component:** `lib-table-section`
**Type:** `table`
**Uses Table Data:** Yes
**Default Columns:** 2-3
**Features:** Sorting, Filtering, Pagination

## Use Cases

- Data tables
- Sales reports
- Inventory lists
- Financial data
- User directories
- Product catalogs
- Transaction logs

## Best Practices

- Provide tableData with columns and rows
- Define column types for proper sorting
- Mark sortable columns appropriately
- Keep column labels concise and clear
- Use appropriate column widths for readability
- Limit initial row count for performance

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

## Schema

```typescript
interface TableData {
  columns: TableColumn[];
  rows: TableRow[];
}

interface TableColumn {
  key: string;                    // Unique identifier (matches row keys)
  label: string;                   // Display label
  type?: 'string' | 'number' | 'date' | 'boolean';  // Data type
  sortable?: boolean;              // Whether column can be sorted
  width?: string;                   // Optional CSS width
}

interface TableRow {
  [key: string]: string | number | boolean | Date | null | undefined;
}
```

## Examples

### Basic Table

```typescript
const section: CardSection = {
  type: 'table',
  title: 'Product Inventory',
  tableData: {
    columns: [
      { key: 'name', label: 'Product Name', type: 'string', sortable: true },
      { key: 'stock', label: 'Stock', type: 'number', sortable: true },
      { key: 'price', label: 'Price', type: 'number', sortable: true },
      { key: 'available', label: 'Available', type: 'boolean', sortable: true }
    ],
    rows: [
      { name: 'Widget A', stock: 150, price: 29.99, available: true },
      { name: 'Widget B', stock: 200, price: 39.99, available: true },
      { name: 'Widget C', stock: 0, price: 49.99, available: false }
    ]
  },
  preferredColumns: 3
};
```

### Sales Report with Dates

```typescript
const section: CardSection = {
  type: 'table',
  title: 'Sales Performance Q1 2025',
  description: 'Quarterly sales data by product and region',
  tableData: {
    columns: [
      { key: 'product', label: 'Product', type: 'string', sortable: true },
      { key: 'region', label: 'Region', type: 'string', sortable: true },
      { key: 'quantity', label: 'Quantity', type: 'number', sortable: true },
      { key: 'revenue', label: 'Revenue ($)', type: 'number', sortable: true },
      { key: 'date', label: 'Sale Date', type: 'date', sortable: true }
    ],
    rows: [
      {
        product: 'Widget A',
        region: 'North',
        quantity: 150,
        revenue: 4498.50,
        date: '2025-01-15'
      },
      {
        product: 'Widget B',
        region: 'South',
        quantity: 200,
        revenue: 7998.00,
        date: '2025-01-20'
      }
    ]
  },
  preferredColumns: 3
};
```

### Table with Custom Column Widths

```typescript
const section: CardSection = {
  type: 'table',
  title: 'User Directory',
  tableData: {
    columns: [
      { key: 'name', label: 'Name', type: 'string', sortable: true, width: '30%' },
      { key: 'email', label: 'Email', type: 'string', sortable: true, width: '35%' },
      { key: 'role', label: 'Role', type: 'string', sortable: true, width: '20%' },
      { key: 'active', label: 'Active', type: 'boolean', sortable: true, width: '15%' }
    ],
    rows: [
      { name: 'John Doe', email: 'john@example.com', role: 'Admin', active: true },
      { name: 'Jane Smith', email: 'jane@example.com', role: 'User', active: true }
    ]
  }
};
```

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

## Component Files

- `table-section.component.ts` - Component logic
- `table-section.component.html` - Template
- `table-section.scss` - Styles
- `table.definition.json` - Section metadata and schema
- `README.md` - This documentation

