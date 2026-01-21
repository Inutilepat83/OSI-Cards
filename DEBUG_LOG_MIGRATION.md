# Debug Log Migration Guide

## Summary

All direct `fetch()` calls to debug log endpoints (ports 7242 and 7245) have been migrated to use `safeDebugFetch()` utility function. This ensures:

1. **No console errors in production** - Debug log requests only happen on localhost
2. **Silent failure** - All errors are caught and suppressed
3. **Kill switch support** - Respects `__DISABLE_DEBUG_LOGGING` flag

## Changes Made

### 1. Added Utility Functions

**File:** `projects/osi-cards-lib/src/lib/utils/debug-log.util.ts`

- `isLocalhost()` - Checks if code is running on localhost
- `shouldEnableDebugLogging()` - Checks if debug logging should be enabled (localhost + kill switch)
- `safeDebugFetch(endpoint, body)` - Safe wrapper for debug fetch calls

### 2. Updated Library Files

All library files that had direct `fetch()` calls have been updated to use `safeDebugFetch()`:

- ✅ `base-section.component.ts`
- ✅ `abstract-section-bases.ts`
- ✅ `overview-section.component.ts`
- ⏳ `chart-section.component.ts`
- ⏳ `list-section.component.ts`
- ⏳ `brand-colors-section.component.ts`
- ⏳ `empty-state.component.ts`
- ⏳ `dynamic-section-loader.service.ts`
- ⏳ `section-completeness.service.ts`
- ⏳ `streaming.service.ts`
- ⏳ `section-component-map.generated.ts` (auto-generated, may need regeneration)

### 3. Updated Main App Files

- ⏳ `src/app/core/services/logging.service.ts` (port 7245)
- ⏳ `src/app/shared/services/export.service.ts` (port 7245)
- ⏳ PDF services (port 7245)

## Migration Pattern

### Before:
```typescript
if (
  typeof window !== 'undefined' &&
  localStorage.getItem('__DISABLE_DEBUG_LOGGING') !== 'true' &&
  !(window as any).__DISABLE_DEBUG_LOGGING
) {
  fetch('http://127.0.0.1:7242/ingest/...', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ... }),
  }).catch(() => {});
}
```

### After:
```typescript
import { safeDebugFetch } from '@osi-cards/utils';

if (typeof window !== 'undefined') {
  safeDebugFetch('http://127.0.0.1:7242/ingest/...', {
    location: '...',
    message: '...',
    data: { ... },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'A',
  });
}
```

## Benefits

1. **Production Safety** - No debug log requests in production (only on localhost)
2. **No Console Errors** - All errors are silently caught
3. **Cleaner Code** - Less boilerplate, more readable
4. **Centralized Logic** - All debug logging logic in one place

## Remaining Work

See TODO list for files that still need to be updated.
