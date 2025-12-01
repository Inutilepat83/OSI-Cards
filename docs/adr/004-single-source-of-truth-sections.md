# ADR-004: Single Source of Truth for Section Definitions

**Status:** Accepted  
**Date:** 2024-12-01  
**Authors:** OSI Cards Team

## Context

Section definitions were scattered across multiple files in the codebase:

- `projects/osi-cards-lib/section-registry.json` (primary definitions)
- `e2e/fixtures/card-configs.ts` (test fixtures)
- `projects/osi-cards-lib/src/lib/testing/fixtures/*.ts` (unit test fixtures)
- `src/assets/configs/**/*.json` (demo configurations)
- Documentation examples in `docs/*.md`

This caused several problems:

1. **Maintenance Burden**: Changes required updates in multiple files
2. **Inconsistency**: Different files had slightly different section definitions
3. **Testing Issues**: Test fixtures didn't match production definitions
4. **Documentation Drift**: Examples became outdated

## Decision

Establish `section-registry.json` as the **single source of truth** for all section-related data, with automated generation of derived artifacts.

### Architecture

```
section-registry.json
        │
        ├──► section-registry.ts     (TypeScript definitions)
        ├──► fixtures.generated.ts   (Test fixtures)
        ├──► SECTION_TYPES.md        (Documentation)
        ├──► all-sections-*.json     (Demo configs)
        └──► e2e fixtures            (E2E test data)
```

### Registry Schema Extensions

Added new fields to support all use cases:

```json
{
  "sections": {
    "<type>": {
      "testFixtures": {
        "complete": { ... },      // Full example
        "minimal": { ... },       // Minimum required fields
        "edgeCases": { ... },     // Boundary values
        "streaming": { ... },     // Streaming simulation
        "accessibility": { ... }  // A11y testing
      },
      "documentation": {
        "examples": [...],        // Doc examples
        "codeSnippets": {...},    // Code samples
        "apiNotes": "..."         // Additional notes
      },
      "demo": {
        "sampleCards": [...],     // Demo app configs
        "featured": true,         // Show on homepage
        "order": 1                // Display order
      }
    }
  }
}
```

### Generated Files

| File | Purpose | Command |
|------|---------|---------|
| `section-registry.ts` | TypeScript definitions | `npm run generate:registry-fixtures` |
| `fixtures.generated.ts` | Test fixtures | `npm run generate:registry-fixtures` |
| `all-sections-*.json` | Demo configs | `npm run generate:from-registry` |
| `generated-section-types.ts` | Type unions | `npm run generate:from-registry` |

### Usage

```typescript
// Testing - use registry fixtures
import { getFixture, COMPLETE_FIXTURES } from 'osi-cards-lib';

const infoSection = getFixture('info', 'complete');
const allSections = COMPLETE_FIXTURES;

// Don't create hardcoded sections like this:
// ❌ const section = { type: 'info', ... }

// Use factory with registry:
// ✅ const section = getFixture('info', 'complete');
```

### Validation

A validation script ensures all code references the registry:

```bash
npm run validate:section-usage
```

This warns about:
- Hardcoded section type definitions
- Inline fields arrays outside of factories
- Known sample titles that should use registry

## Consequences

### Positive

- **Single Point of Change**: Update registry, regenerate all artifacts
- **Consistency**: Tests use identical data to production
- **Type Safety**: TypeScript types generated from registry
- **Validation**: Schema validation at generation time
- **Documentation**: Always up-to-date examples

### Negative

- **Generation Step**: Must run generation after registry changes
- **Initial Migration**: Existing hardcoded sections need migration
- **Learning Curve**: Developers must use registry APIs

### Migration Path

1. Existing tests should import from `'osi-cards-lib/testing'`
2. Use `getFixture()` instead of hardcoded section objects
3. Run `npm run validate:section-usage` to find violations
4. Update `section-registry.json` when adding new section types

## Files Changed

### New Files
- `projects/osi-cards-lib/src/lib/registry/index.ts`
- `projects/osi-cards-lib/src/lib/registry/section-registry.ts` (generated)
- `projects/osi-cards-lib/src/lib/registry/fixtures.generated.ts` (generated)
- `projects/osi-cards-lib/src/lib/registry/registry-utils.ts`
- `scripts/generate-registry-fixtures.js`
- `scripts/validate-section-usage.js`

### Updated Files
- `projects/osi-cards-lib/section-registry.schema.json`
- `projects/osi-cards-lib/src/lib/testing/index.ts`
- `projects/osi-cards-lib/src/lib/testing/fixtures/*.ts`
- `projects/osi-cards-lib/src/public-api.ts`
- `package.json` (new scripts)

## References

- [section-registry.json](../../projects/osi-cards-lib/section-registry.json)
- [SECTION_TYPES.md](../SECTION_TYPES.md)

