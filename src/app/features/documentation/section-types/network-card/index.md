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
  "title": "Strategic Partner Ecosystem",
  "type": "network-card",
  "description": "Key business relationships and strategic partnerships",
  "items": [
    {
      "title": "Amazon Web Services",
      "description": "Premier Consulting Partner - Cloud Infrastructure",
      "meta": {
        "influence": 95,
        "connections": 47,
        "status": "active",
        "type": "Technology Partner"
      }
    },
    {
      "title": "Sequoia Capital",
      "description": "Series C Lead Investor - $50M",
      "meta": {
        "influence": 92,
        "connections": 12,
        "status": "active",
        "type": "Investor"
      }
    },
    {
      "title": "Microsoft",
      "description": "Azure Marketplace Partner - Co-sell Agreement",
      "meta": {
        "influence": 90,
        "connections": 52,
        "status": "active",
        "type": "Technology Partner"
      }
    },
    {
      "title": "TechStars",
      "description": "Accelerator Alumni Network",
      "meta": {
        "influence": 65,
        "connections": 156,
        "status": "active",
        "type": "Network"
      }
    }
  ],
  "preferredColumns": 1,
  "priority": 3
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
