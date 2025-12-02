# Network Card Section

Displays relationship graphs, network connections, and influence metrics.

## Overview

The **Network Card Section** (`type: "network-card"`) is used for displays relationship graphs, network connections, and influence metrics.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `network-card` |
| Uses Fields | No |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Org charts
- Relationship maps
- Network analysis
- Partnership visualization
- Stakeholder mapping

## Data Schema



### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Network node name |
| `description` | string | Node description |
| `meta` | object | - |

## Complete Example

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
      "title": "Accenture",
      "description": "Systems Integration Partner - Enterprise Deployments",
      "meta": {
        "influence": 88,
        "connections": 34,
        "status": "active",
        "type": "Implementation Partner"
      }
    },
    {
      "title": "Snowflake",
      "description": "Data Platform Partnership - Native Integration",
      "meta": {
        "influence": 85,
        "connections": 28,
        "status": "active",
        "type": "Technology Partner"
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
      "title": "Deloitte",
      "description": "Advisory Partner - Digital Transformation",
      "meta": {
        "influence": 82,
        "connections": 19,
        "status": "active",
        "type": "Consulting Partner"
      }
    },
    {
      "title": "Goldman Sachs",
      "description": "Strategic Banking Partner",
      "meta": {
        "influence": 78,
        "connections": 8,
        "status": "active",
        "type": "Financial Partner"
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
  ]
}
```

## Minimal Example

```json
{
  "title": "Partners",
  "type": "network-card",
  "items": [
    {
      "title": "Partner Organization"
    }
  ]
}
```

## Best Practices

1. Show relationships clearly
2. Include connection types
3. Add influence metrics
4. Use visual hierarchy
5. Show connection strength

## Component Information

- **Selector:** `lib-network-card-section`
- **Component Path:** `./lib/components/sections/network-card-section/network-card-section.component`


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
