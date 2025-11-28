# base Section

Documentation for base section type.

## Overview

The **base Section** is used for documentation for base section type.

## Use Cases



## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'base';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "base Section Example",
  "type": "base",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
```

## Best Practices



## Component Properties


### Outputs

- **fieldInteraction**: Output event
- **itemInteraction**: Output event


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
