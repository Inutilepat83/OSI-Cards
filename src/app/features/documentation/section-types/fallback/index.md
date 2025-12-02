# Fallback Section

Default section renderer for unknown or unsupported section types.

## Overview

The **Fallback Section** (`type: "fallback"`) is used for default section renderer for unknown or unsupported section types.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `fallback` |
| Uses Fields | Yes |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Unknown types
- Error handling
- Graceful degradation

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| (See CardField interface) | - | - |

### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| (See CardItem interface) | - | - |

## Complete Example

```json
{
  "title": "Unknown Section Type",
  "type": "unknown-custom-type",
  "description": "This section type is not recognized and will render using fallback",
  "fields": [
    {
      "label": "Custom Field 1",
      "value": "Some custom data"
    },
    {
      "label": "Custom Field 2",
      "value": "More data to display"
    },
    {
      "label": "Numeric Data",
      "value": 42
    },
    {
      "label": "Status",
      "value": "Active"
    }
  ],
  "items": [
    {
      "title": "Custom Item 1",
      "description": "Description for custom item"
    },
    {
      "title": "Custom Item 2",
      "description": "Another custom item"
    }
  ]
}
```

## Minimal Example

```json
{
  "title": "Fallback",
  "type": "fallback"
}
```

## Best Practices

1. Display section data in readable format
2. Show section type for debugging
3. Provide helpful error messages

## Component Information

- **Selector:** `lib-fallback-section`
- **Component Path:** `./lib/components/sections/fallback-section/fallback-section.component`


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
