# AICardConfig

The main configuration interface for OSI Cards.

## Overview

`AICardConfig` is the primary interface that defines the structure of a card. Every card in OSI Cards must conform to this interface.

## Interface Definition

```typescript
interface AICardConfig {
  id?: string;
  cardTitle: string;
  cardType?: CardType;
  description?: string;
  columns?: 1 | 2 | 3;
  sections: CardSection[];
  actions?: CardAction[];
  meta?: Record<string, unknown>;
  processedAt?: number;
  displayOrder?: number;
}
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | No | Unique identifier for the card |
| `cardTitle` | string | **Yes** | Main title displayed on the card |
| `cardType` | CardType | No | Card category (company, contact, etc.) |
| `description` | string | No | Card description/subtitle |
| `columns` | 1 \| 2 \| 3 | No | Number of columns for section layout |
| `sections` | CardSection[] | **Yes** | Array of sections composing the card |
| `actions` | CardAction[] | No | Action buttons at card bottom |
| `meta` | Record<string, unknown> | No | Additional metadata |
| `processedAt` | number | No | Processing timestamp |
| `displayOrder` | number | No | Order for drag-and-drop |

## Example

```json
{
  "cardTitle": "Acme Corporation",
  "cardType": "company",
  "description": "Technology Solutions Provider",
  "columns": 2,
  "sections": [
    {
      "title": "Company Info",
      "type": "info",
      "fields": [
        { "label": "Industry", "value": "Technology" },
        { "label": "Founded", "value": "2010" }
      ]
    }
  ],
  "actions": [
    { "label": "Visit Website", "type": "website", "url": "https://acme.com" }
  ]
}
```

## Related

- [CardSection](#cardsection)
- [CardAction](#cardaction)
- [Section Types](/docs/section-types)
