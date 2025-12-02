# Map Section

Displays geographic data with embedded maps, pins, and location information.

## Overview

The **Map Section** (`type: "map"`) is used for displays geographic data with embedded maps, pins, and location information.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `map` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 1 |
| Supports Collapse | No |
| Aliases | None |
| External Library | `leaflet` |

## Use Cases

- Office locations
- Store finder
- Geographic data
- Location tracking
- Service coverage

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Location name |
| `address` | string | Physical address |
| `x` | number | Latitude coordinate |
| `y` | number | Longitude coordinate |
| `type` | string | Location type (office, branch, etc.) |
| `coordinates` | object | - |



## Complete Example

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
      "name": "Americas - West",
      "x": 37.7749,
      "y": -122.4194,
      "type": "regional-office",
      "address": "525 Market St, San Francisco, CA 94105, USA"
    },
    {
      "name": "EMEA Headquarters",
      "x": 51.5074,
      "y": -0.1278,
      "type": "regional-office",
      "address": "30 St Mary Axe, London EC3A 8BF, UK"
    },
    {
      "name": "EMEA - Central",
      "x": 52.52,
      "y": 13.405,
      "type": "branch",
      "address": "Potsdamer Platz 1, 10785 Berlin, Germany"
    },
    {
      "name": "EMEA - South",
      "x": 48.8566,
      "y": 2.3522,
      "type": "branch",
      "address": "Tour Montparnasse, 75015 Paris, France"
    },
    {
      "name": "APAC Headquarters",
      "x": 1.3521,
      "y": 103.8198,
      "type": "regional-office",
      "address": "Marina Bay Sands Tower 1, Singapore 018956"
    },
    {
      "name": "APAC - North",
      "x": 35.6762,
      "y": 139.6503,
      "type": "branch",
      "address": "Roppongi Hills Mori Tower, Tokyo 106-6108, Japan"
    },
    {
      "name": "APAC - South",
      "x": -33.8688,
      "y": 151.2093,
      "type": "branch",
      "address": "1 Bligh Street, Sydney NSW 2000, Australia"
    },
    {
      "name": "APAC - India",
      "x": 12.9716,
      "y": 77.5946,
      "type": "development-center",
      "address": "Embassy Tech Village, Bangalore 560103, India"
    },
    {
      "name": "LATAM - Brazil",
      "x": -23.5505,
      "y": -46.6333,
      "type": "branch",
      "address": "Av. Paulista 1578, São Paulo, SP, Brazil"
    },
    {
      "name": "Data Center - US East",
      "x": 39.0438,
      "y": -77.4874,
      "type": "data-center",
      "address": "Ashburn, VA, USA"
    },
    {
      "name": "Data Center - EU",
      "x": 50.1109,
      "y": 8.6821,
      "type": "data-center",
      "address": "Frankfurt, Germany"
    }
  ]
}
```

## Minimal Example

```json
{
  "title": "Location",
  "type": "map",
  "fields": [
    {
      "name": "Main Office",
      "x": 0,
      "y": 0
    }
  ]
}
```

## Best Practices

1. Include coordinates or addresses
2. Use proper location formats
3. Add location metadata
4. Ensure map accessibility
5. Show location types visually

## Component Information

- **Selector:** `lib-map-section`
- **Component Path:** `./lib/components/sections/map-section/map-section.component`


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
