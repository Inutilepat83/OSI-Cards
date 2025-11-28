# Migration Guide: Version 1.x to 2.0

This guide helps you migrate from OSI Cards v1.x to v2.0.

## Breaking Changes

### Component Refactoring

**Before (v1.x):**
```typescript
import { AICardRendererComponent } from 'osi-cards-lib';
// Component was monolithic
```

**After (v2.0):**
```typescript
import { 
  AICardRendererComponent,
  CardHeaderComponent,
  CardActionsComponent,
  CardStreamingIndicatorComponent,
  CardSectionListComponent
} from 'osi-cards-lib';
// Components are now modular
```

**Migration:** No changes required for basic usage. The main `AICardRendererComponent` API remains the same. Sub-components are used internally.

### Section Type Resolution

**Before (v1.x):**
- Section types resolved via switch statement
- Limited extensibility

**After (v2.0):**
- Registry-based strategy pattern
- Easier to extend with custom section types

**Migration:** No changes required. All existing section types continue to work.

### Error Handling

**Before (v1.x):**
```typescript
// Basic error messages
catch (error) {
  console.error('Error:', error);
}
```

**After (v2.0):**
```typescript
// Enhanced error messages with actionable guidance
import { ErrorHandlingService } from 'osi-cards-lib';

const errorService = inject(ErrorHandlingService);
errorService.handleError(error, 'MyComponent');
// Errors now include documentation links and suggestions
```

**Migration:** Optional. Existing error handling continues to work. Enhanced error messages are available when using `ErrorHandlingService`.

## New Features

### Development Warnings

Development mode now provides helpful warnings for common mistakes:

```typescript
import { DevelopmentWarningsService } from 'osi-cards-lib';

const warnings = inject(DevelopmentWarningsService);
warnings.validateCardConfig(cardConfig);
// Automatically validates and warns about issues
```

### Focus Management

New focus management service for modals and drawers:

```typescript
import { FocusManagementService } from 'osi-cards-lib';

const focusService = inject(FocusManagementService);
const trapId = focusService.trapFocus(modalElement);
// ... later
focusService.releaseTrap(trapId);
```

### CLI Validation Tool

Validate card configurations before runtime:

```bash
npm run validate:card src/assets/configs/companies/company-1.json
```

## Deprecated APIs

### None

No APIs are deprecated in v2.0. All v1.x APIs remain supported.

## Migration Steps

1. **Update dependencies:**
   ```bash
   npm install osi-cards-lib@^2.0.0
   ```

2. **Review breaking changes** (if any apply to your code)

3. **Test your application** thoroughly

4. **Optional: Adopt new features** like development warnings and focus management

## Need Help?

- [Documentation](https://github.com/Inutulepat83/OSI-Cards/blob/main/README.md)
- [Issue Tracker](https://github.com/Inutulepat83/OSI-Cards/issues)
- [Discussions](https://github.com/Inutulepat83/OSI-Cards/discussions)

