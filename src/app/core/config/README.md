# Configuration Module

This module provides type-safe configuration interfaces and runtime validation for the application.

## Files

- `app-config.interface.ts` - TypeScript interfaces for all configuration sections
- `config-validator.ts` - Runtime validation for configuration values
- `README.md` - This file

## Usage

### Type Safety

The `AppConfig` interface provides compile-time type checking:

```typescript
import { AppConfig } from './app-config.interface';

const config: AppConfig = {
  JSON_PROCESSING: {
    IMMEDIATE_DEBOUNCE_MS: 10,
    DEBOUNCED_DEBOUNCE_MS: 300,
    // ... other fields
  },
  // ... other sections
};
```

### Runtime Validation

The `ConfigValidator` class validates configuration at runtime:

```typescript
import { ConfigValidator } from './config-validator';

const validator = new ConfigValidator();
const result = validator.validate(config);

if (!result.valid) {
  console.error('Configuration errors:', result.errors);
  // Handle errors
}

if (result.warnings.length > 0) {
  console.warn('Configuration warnings:', result.warnings);
}
```

### AppConfigService Integration

`AppConfigService` implements the `AppConfig` interface and automatically validates configuration on initialization:

```typescript
import { AppConfigService } from './app-config.service';

const config = inject(AppConfigService);
// Configuration is automatically validated
```

## Configuration Sections

1. **JSON_PROCESSING** - JSON parsing and processing settings
2. **LLM_SIMULATION** - LLM streaming simulation parameters
3. **SECTION_COMPLETION** - Section completion tracking
4. **CARD_PROCESSING** - Card processing limits and delays
5. **PERFORMANCE** - Performance optimization settings
6. **UI** - UI timing and animation settings
7. **VALIDATION** - Input validation constraints
8. **CACHE** - Caching configuration
9. **ERROR_HANDLING** - Error handling settings
10. **LOGGING** - Logging configuration
11. **DEV_WARNINGS** - Development warning settings
12. **ENV** - Environment configuration
13. **FEATURES** - Feature flags
14. **CARD_LIMITS** - Card size limits
15. **PERFORMANCE_ENV** - Environment-specific performance settings
16. **DEV_TOOLS** - Development tools configuration

## Validation Rules

The validator checks:

- **Range validation**: Ensures numeric values are within valid ranges
- **Constraint validation**: Ensures related values are consistent (e.g., max >= min)
- **Type validation**: Ensures values match expected types
- **Required fields**: Ensures all required configuration sections are present

## Best Practices

1. Always use the `AppConfig` interface for type safety
2. Validate configuration in development mode
3. Use environment variables for environment-specific values
4. Document configuration changes in CHANGELOG
5. Test configuration changes thoroughly
