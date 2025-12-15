# Map Section

Displays geographic data with embedded maps, pins, and location information.

## Overview

The **Map Section** is used for displays geographic data with embedded maps, pins, and location information.

## Use Cases

- Office locations
- Store finder
- Geographic data
- Location tracking

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'map';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "Global Operations Network",
  "type": "map",
  "description": "Worldwide office locations and data centers",
  "fields": [
    {
      "name": "Global Headquarters",
      "x": 30.2672,
      "y": -97.7431,
      "type": "headquarters",
      "address": "500 Congress Ave, Austin, TX 78701, USA"
    },
    {
      "name": "Americas - East",
      "x": 40.7128,
      "y": -74.006,
      "type": "regional-office",
      "address": "One World Trade Center, New York, NY 10007, USA"
    },
    {
      "name": "APAC Headquarters",
      "x": 1.3521,
      "y": 103.8198,
      "type": "regional-office",
      "address": "Marina Bay Sands Tower 1, Singapore 018956"
    },
    {
      "name": "Data Center - EU",
      "x": 50.1109,
      "y": 8.6821,
      "type": "data-center",
      "address": "Frankfurt, Germany"
    }
  ],
  "preferredColumns": 1,
  "priority": 3
}
```

## Best Practices

1. Include coordinates or addresses
1. Use proper location formats
1. Add location metadata
1. Ensure map accessibility

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
