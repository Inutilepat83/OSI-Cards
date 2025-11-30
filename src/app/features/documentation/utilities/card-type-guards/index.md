# CardTypeGuards

Type guard functions for card validation.

## Import

```typescript
import { CardTypeGuards } from 'osi-cards-lib';
```

## Methods

### isAICardConfig(obj)

Check if object is valid AICardConfig.

```typescript
if (CardTypeGuards.isAICardConfig(data)) {
  // data is AICardConfig
}
```

### isCardSection(obj)

Check if object is valid CardSection.

```typescript
if (CardTypeGuards.isCardSection(section)) {
  // section is CardSection
}
```

### isCardField(obj)

Check if object is valid CardField.

### isMailAction(obj)

Check if object is valid MailCardAction.

```typescript
if (CardTypeGuards.isMailAction(action)) {
  // action has valid email config
  console.log(action.email.contact.name);
}
```

## Usage in Templates

```typescript
processData(data: unknown) {
  if (!CardTypeGuards.isAICardConfig(data)) {
    throw new Error('Invalid card configuration');
  }
  this.card = data;
}
```
