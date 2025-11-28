# Financials Section

Displays financial data including revenue, expenses, P&L statements, and currency information.

## Overview

The **Financials Section** is used for displays financial data including revenue, expenses, p&l statements, and currency information.

## Use Cases

- Financial reports
- Quarterly earnings
- Budget information
- Revenue tracking

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'financials';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "Financials Section Example",
  "type": "financials",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
```

## Best Practices

1. Use currency formatting
1. Include time periods
1. Show trends and changes
1. Group by category

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
