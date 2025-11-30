# Info Section

Displays key-value pairs in a clean, scannable format. Ideal for metadata, contact information, and general data display.

## Overview

The **Info Section** (`type: "info"`) is used for displays key-value pairs in a clean, scannable format. ideal for metadata, contact information, and general data display.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `info` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | `project` |


## Use Cases

- Company information
- Contact details
- Metadata display
- Key-value pairs

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Field label/key |
| `value` | string,number,boolean,null | Field value |
| `icon` | string | Icon identifier (emoji or icon name) |
| `description` | string | Additional field description |
| `trend` | string | Trend indicator |
| `change` | number | Numeric change value |
| `format` | string | Value format |



## Complete Example

```json
{
  "title": "Company Information",
  "type": "info",
  "description": "Detailed company information and metadata",
  "fields": [
    {
      "label": "Industry",
      "value": "Technology",
      "icon": "🏢"
    },
    {
      "label": "Founded",
      "value": "2010",
      "icon": "📅"
    },
    {
      "label": "Headquarters",
      "value": "San Francisco, CA",
      "icon": "📍"
    },
    {
      "label": "Employees",
      "value": "5,000+",
      "icon": "👥",
      "trend": "up"
    },
    {
      "label": "Website",
      "value": "www.example.com",
      "icon": "🌐"
    }
  ]
}
```

## Minimal Example

```json
{
  "title": "Info",
  "type": "info",
  "fields": [
    {
      "label": "Key",
      "value": "Value"
    }
  ]
}
```

## Best Practices

1. Use for structured data with clear labels and values
2. Keep labels concise and descriptive
3. Use trend indicators for dynamic data
4. Group related fields together

## Component Information

- **Selector:** `app-info-section`
- **Component Path:** `./lib/components/sections/info-section.component`
- **Style Path:** `./lib/styles/components/sections/_info.scss`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
