# TypeScript Strict Mode Migration Guide

## Overview

This document tracks the migration to stricter TypeScript compiler options as part of the improvement plan.

## Current Status

### ✅ Enabled Options

- `strict: true` - All strict checks enabled
- `noImplicitOverride: true` - Require explicit override keyword
- `noPropertyAccessFromIndexSignature: true` - Require bracket notation for index signatures
- `noImplicitReturns: true` - Require explicit return statements
- `noFallthroughCasesInSwitch: true` - Prevent fallthrough in switch statements
- `strictNullChecks: true` - Strict null checking
- `strictFunctionTypes: true` - Strict function type checking
- `strictBindCallApply: true` - Strict bind/call/apply checking
- `strictPropertyInitialization: true` - Strict property initialization
- `noImplicitThis: true` - No implicit this
- `alwaysStrict: true` - Always use strict mode
- `noUncheckedIndexedAccess: true` - Require explicit checks for array/object access

### ⚠️ Temporarily Disabled

- `noUnusedLocals: false` - Disabled to reduce noise during development
- `noUnusedParameters: false` - Disabled to reduce noise during development
- `exactOptionalPropertyTypes: false` - **Temporarily disabled** - requires extensive refactoring

## exactOptionalPropertyTypes Migration

### What It Does

`exactOptionalPropertyTypes: true` makes TypeScript distinguish between:
- `property?: string` - Property may be missing OR be `string`
- `property: string | undefined` - Property must exist and be `string` OR `undefined`

### Why It's Disabled

Enabling this option requires refactoring hundreds of places where:
1. Optional properties are assigned `undefined` explicitly
2. Optional properties are checked with `=== undefined`
3. Optional properties are used in object spreads

### Migration Strategy

1. **Phase 1**: Enable per-file using `// @ts-exactOptionalPropertyTypes` comment
2. **Phase 2**: Fix files incrementally, starting with utilities and models
3. **Phase 3**: Fix service files
4. **Phase 4**: Fix component files
5. **Phase 5**: Enable globally

### Common Patterns to Fix

#### Pattern 1: Explicit undefined assignment
```typescript
// ❌ Before
interface Config {
  title?: string;
}
const config: Config = { title: undefined };

// ✅ After
interface Config {
  title?: string; // or title: string | undefined;
}
const config: Config = {}; // Don't include if undefined
// OR
const config: Config = { title: undefined as string | undefined };
```

#### Pattern 2: Optional chaining with undefined
```typescript
// ❌ Before
if (obj.property === undefined) { }

// ✅ After
if (obj.property === undefined || !('property' in obj)) { }
// OR change type to: property: string | undefined
```

#### Pattern 3: Object spreading
```typescript
// ❌ Before
const obj = { ...base, optional: value || undefined };

// ✅ After
const obj = { ...base, ...(value !== undefined && { optional: value }) };
```

## Next Steps

1. Create a task list for files that need `exactOptionalPropertyTypes` fixes
2. Start with utility files (lowest impact)
3. Move to model files
4. Fix service files
5. Fix component files
6. Enable globally

## Related

- [IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md) - Full improvement plan
- [IMPROVEMENTS_IMPLEMENTED.md](./IMPROVEMENTS_IMPLEMENTED.md) - Implementation status

