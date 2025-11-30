# sanitizeCardConfig

Sanitize and validate card configurations.

## Import

```typescript
import { CardUtils } from 'osi-cards-lib';
```

## Usage

```typescript
const rawConfig = JSON.parse(llmResponse);
const cleanConfig = CardUtils.sanitizeCardConfig(rawConfig);

if (cleanConfig) {
  // Safe to use
  this.card = cleanConfig;
} else {
  // Invalid configuration
  this.showError('Invalid card');
}
```

## What It Does

1. Validates required fields (cardTitle, sections)
2. Truncates long strings
3. Filters invalid sections
4. Ensures IDs exist
5. Sanitizes actions

## Configuration

```typescript
// Title max length: 200 characters
// Sections filtered through isCardSection
// Actions get auto-generated IDs
```

## Return Value

- Returns sanitized `AICardConfig` if valid
- Returns `null` if invalid
