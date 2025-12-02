# Map Section

Displays location markers on an interactive map with zoom and pan controls.

## Overview

The Map Section renders an interactive map using Leaflet with support for custom markers and locations.

**Component:** `lib-map-section`
**Type:** `map`
**Aliases:** `location`
**Uses Fields:** Yes
**Default Columns:** 1
**External Library:** Leaflet

## Use Cases

- Office locations
- Store finder
- Event venues
- Distribution centers
- Service areas

## Best Practices

- Provide accurate coordinates
- Use descriptive marker labels
- Include address information
- Center map appropriately
- Add zoom level hints

## Field Schema

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Location name |
| `x` | number | Longitude coordinate |
| `y` | number | Latitude coordinate |
| `type` | string | Marker type/category |
| `address` | string | Full address |

## Examples

### Single Location

```typescript
const section: CardSection = {
  type: 'map',
  title: 'Office Location',
  fields: [
    {
      name: 'HQ',
      x: -122.4194,
      y: 37.7749,
      type: 'office',
      address: 'San Francisco, CA'
    }
  ]
};
```

### Multiple Locations

```typescript
const section: CardSection = {
  type: 'map',
  title: 'Global Offices',
  fields: [
    { name: 'SF HQ', x: -122.4194, y: 37.7749, type: 'headquarters' },
    { name: 'NYC Office', x: -74.0060, y: 40.7128, type: 'office' },
    { name: 'London Office', x: -0.1278, y: 51.5074, type: 'office' }
  ]
};
```

## Component Files

- `map-section.component.ts` - Component logic and styles
- `map-section.component.html` - Template
- `map.definition.json` - Section metadata and schema
- `README.md` - This documentation

