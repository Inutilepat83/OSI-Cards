# Network Card Section

Displays relationship graphs, network connections, and influence metrics.

## Overview

The **Network Card Section** is used for displays relationship graphs, network connections, and influence metrics.

## Use Cases

- Org charts
- Relationship maps
- Network analysis
- Connection graphs

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'network-card';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "Network Card Section Example",
  "type": "network-card",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
```

## Best Practices

1. Show relationships clearly
1. Include connection types
1. Add influence metrics
1. Use visual hierarchy

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
