# Chart Section

Displays data visualizations including bar charts, line charts, pie charts, and more.

## Overview

The Chart Section renders interactive charts using Frappe Charts. Supports multiple chart types with compact, responsive sizing.

**Component:** `lib-chart-section`
**Type:** `chart`
**Uses Chart Data:** Yes
**Default Columns:** 2
**External Library:** frappe-charts

## Use Cases

- Data visualization
- Analytics dashboards
- Statistical reports
- Trend analysis
- Performance tracking

## Best Practices

- Provide proper chart configuration
- Include chart type specification
- Use appropriate data formats
- Ensure accessibility with labels
- Choose chart type based on data

## Chart Types

- `bar` - Bar charts
- `line` - Line charts
- `pie` - Pie charts
- `doughnut` - Doughnut charts
- `area` - Area charts
- `radar` - Radar charts

## Schema

```typescript
{
  chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'radar',
  chartData: {
    labels: string[],
    datasets: [{
      label: string,
      data: number[],
      backgroundColor?: string | string[],
      borderColor?: string | string[],
      borderWidth?: number
    }]
  }
}
```

## Examples

### Bar Chart

```typescript
const section: CardSection = {
  type: 'chart',
  title: 'Sales by Quarter',
  chartType: 'bar',
  chartData: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [{
      label: 'Sales ($M)',
      data: [10, 15, 12, 20],
      backgroundColor: '#ff7900'
    }]
  }
};
```

### Line Chart

```typescript
const section: CardSection = {
  type: 'chart',
  title: 'Revenue Trend',
  chartType: 'line',
  chartData: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [{
      label: 'Revenue',
      data: [100, 150, 200, 180],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)'
    }]
  }
};
```

## Component Files

- `chart-section.component.ts` - Component logic and styles
- `chart-section.component.html` - Template
- `chart.definition.json` - Section metadata and schema
- `README.md` - This documentation








