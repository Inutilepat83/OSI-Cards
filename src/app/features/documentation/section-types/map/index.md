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
  "title": "Map Section Example",
  "type": "map",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
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
