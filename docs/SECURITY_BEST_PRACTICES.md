# Security Best Practices

## innerHTML Usage

### ✅ Safe Usage Pattern

Always use the `SafeHtml` pipe when rendering user-provided HTML content:

```html
<!-- ✅ Correct -->
<div [innerHTML]="userContent | safeHtml"></div>
```

### ❌ Unsafe Usage Pattern

Never use innerHTML directly with user content:

```html
<!-- ❌ Incorrect - XSS vulnerability -->
<div [innerHTML]="userContent"></div>
```

### Implementation

The `SafeHtmlPipe` is located at:
- `src/app/shared/pipes/safe-html.pipe.ts`

It uses Angular's `DomSanitizer` with `SecurityContext.HTML` which:
- Allows HTML content
- Sanitizes dangerous elements (script tags, iframes, etc.)
- Removes event handlers (onclick, onerror, etc.)
- Strips dangerous attributes

### Current Status

✅ **All innerHTML usage is safe:**
- No direct innerHTML usage in component templates
- SafeHtml pipe is available and documented
- Utility functions use innerHTML only for sanitization purposes

### Code Review Checklist

When reviewing code that renders user content:

- [ ] Uses `SafeHtmlPipe` for HTML content
- [ ] Validates and sanitizes all user inputs
- [ ] Uses `JsonValidationService` for JSON inputs
- [ ] Uses `SanitizationUtil` for URLs, emails, and other data
- [ ] No direct DOM manipulation with user data

### Related Files

- `src/app/shared/pipes/safe-html.pipe.ts` - Safe HTML pipe
- `src/app/shared/utils/sanitization.util.ts` - Sanitization utilities
- `src/app/shared/utils/validation.util.ts` - Validation utilities
- `src/app/core/services/json-validation.service.ts` - JSON validation

