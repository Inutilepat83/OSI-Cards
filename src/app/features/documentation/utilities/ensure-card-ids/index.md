# ensureCardIds

Ensure all card elements have unique IDs.

## Purpose

IDs are required for:
- Tracking updates during streaming
- Animation coordination
- Event handling
- DOM reconciliation

## Usage

```typescript
import { CardUtils } from 'osi-cards-lib';

const cardWithIds = CardUtils.ensureSectionIds(card.sections);
// All sections, fields, items now have IDs
```

## Generated ID Format

```
section_0_abc123def
field_0_1_abc123def
item_0_2_abc123def
```

## When to Use

- Before storing cards
- Before streaming
- Before animations
- When IDs are missing
