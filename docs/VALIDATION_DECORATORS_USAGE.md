# Validation Decorators Usage Guide

## Overview

Validation decorators provide runtime validation for component properties and service methods. They help catch errors early and provide better developer experience.

## Available Decorators

### Basic Validation

- `@Validate(validatorFn)` - Custom validator function
- `@ValidateNonEmpty(message?)` - Validates non-empty strings
- `@ValidateNonEmptyArray(message?)` - Validates non-empty arrays
- `@ValidatePositiveNumber(message?)` - Validates positive numbers
- `@ValidateUrl(message?)` - Validates URL format
- `@ValidateEmail(message?)` - Validates email format

### Card-Specific Validation

- `@ValidateCardType()` - Validates card type values
- `@ValidateSectionType()` - Validates section type values
- `@ValidateCardSection()` - Validates CardSection objects
- `@ValidateCardField()` - Validates CardField objects
- `@ValidateCardItem()` - Validates CardItem objects

## Usage Examples

### In Services

```typescript
import { ValidateCardType, ValidateNonEmpty } from '@shared/decorators/validation.decorator';

@Injectable({ providedIn: 'root' })
export class MyService {
  // Validate card type property
  @ValidateCardType()
  cardType: CardType = 'company';

  // Validate non-empty string
  @ValidateNonEmpty('Title cannot be empty')
  cardTitle: string = '';

  // Custom validator
  @Validate((value: number) => {
    if (value < 1 || value > 3) {
      return { isValid: false, error: 'Variant must be between 1 and 3' };
    }
    return { isValid: true };
  })
  variant: number = 1;
}
```

### In Components

```typescript
import { ValidateSectionType, ValidateCardSection } from '@shared/decorators/validation.decorator';

@Component({...})
export class MyComponent {
  @ValidateSectionType()
  sectionType: string = 'info';

  @ValidateCardSection()
  section: CardSection | null = null;
}
```

### Runtime Validation

```typescript
import { validateObject } from '@shared/decorators/validation.decorator';

// Validate all decorated properties
const results = validateObject(myComponent);
const errors = results.filter(r => !r.isValid);
if (errors.length > 0) {
  console.error('Validation errors:', errors);
}
```

## Integration Points

### Current Usage

1. **CardGenerationService** - Validates card type and variant in `loadTemplate()`
2. **Template Loading** - Runtime validation for card types

### Recommended Usage

1. **Section Components** - Validate section types
2. **Card Input Components** - Validate card titles, types
3. **Form Components** - Validate user inputs
4. **API Services** - Validate request/response data

## Best Practices

1. **Use decorators for critical properties** - Properties that affect data integrity
2. **Combine with runtime validation** - Decorators catch at assignment, runtime catches at method calls
3. **Provide helpful error messages** - Include suggestions where possible
4. **Don't overuse** - Only validate where it adds value

## Error Handling

```typescript
try {
  // Property assignment will throw ValidationError if invalid
  component.cardType = 'invalid-type';
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Validation failed for ${error.property}:`, error.message);
    // Handle validation error
  }
}
```

## Related Files

- `src/app/shared/decorators/validation.decorator.ts` - Decorator implementations
- `src/app/shared/utils/validation.util.ts` - Validation utilities
- `src/app/core/services/json-validation.service.ts` - JSON validation service


