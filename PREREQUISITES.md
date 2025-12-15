# Prerequisites Checklist

Simple list of what needs to be checked/done before making changes.

## 1. Code Dependencies

- [ ] **Check if `MasonryGridLayoutService` is used anywhere**
  - Search codebase for imports
  - Verify if any components use it

- [ ] **Check if `MasterGridLayoutEngine` is imported anywhere**
  - Already checked: NOT imported (dead code)
  - Safe to delete

- [ ] **Check if `column-packer.util.ts` is used**
  - Used by MasonryGridLayoutService
  - Only needed if service is used

- [ ] **Check if `row-packer.util.ts` is used**
  - Used by MasonryGridLayoutService
  - Only needed if service is used

## 2. Tests

- [ ] **Review test file: `masonry-grid.component.spec.ts`**
  - Tests reference old properties (packingAlgorithm, rowPackingOptions)
  - Current component doesn't have these
  - Tests may be outdated

- [ ] **Review E2E tests: `e2e/grid-layout.spec.ts`**
  - Check if tests pass with current CSS-only approach
  - May need updates

## 3. Documentation

- [ ] **Check documentation pages**
  - `docs/guides/GRID_SYSTEM_ARCHITECTURE.md` may reference old architecture
  - Update if needed

- [ ] **Check public API exports**
  - `projects/osi-cards-lib/src/public-api.ts`
  - Ensure nothing broken exports deleted files

## 4. Current Component State

- [ ] **Verify MasonryGridComponent is CSS-only**
  - ✅ Already verified: Uses pure CSS Grid
  - ✅ No imports of MasonryGridLayoutService
  - ✅ No JavaScript positioning

## 5. Files to Delete (if unused)

- [ ] **master-grid-layout-engine.util.ts** (~919 lines)
  - Already confirmed: NOT imported anywhere
  - Safe to delete

- [ ] **MasonryGridLayoutService** (~517 lines) - IF not used
  - Need to verify first

- [ ] **column-packer.util.ts** (~1004 lines) - IF not used
  - Need to verify first

- [ ] **row-packer.util.ts** - IF not used
  - Need to verify first

## 6. Before Making Changes

- [ ] **Create git branch** (recommended)
  ```bash
  git checkout -b cleanup/grid-layout-remove-dead-code
  ```

- [ ] **Run tests first**
  ```bash
  npm run test:unit
  npm run test:e2e
  ```

- [ ] **Build the project**
  ```bash
  npm run build
  ```

## 7. After Making Changes

- [ ] **Run tests again**
  ```bash
  npm run test:unit
  npm run test:e2e
  ```

- [ ] **Build and verify**
  ```bash
  npm run build:lib
  ```

- [ ] **Check for broken imports**
  - TypeScript compilation should catch these

## 8. Browser Compatibility (for CSS Container Queries)

If adding CSS Container Queries:
- [ ] **Check browser support requirements**
  - Chrome 105+
  - Firefox 110+
  - Safari 16+
  - Consider if fallback needed

---

## Summary

**Minimum checks needed:**
1. Verify MasonryGridLayoutService usage
2. Run tests before changes
3. Verify component works (manual test)
4. Run tests after changes

**Safe to delete now:**
- master-grid-layout-engine.util.ts (confirmed dead code)

**Need to verify first:**
- MasonryGridLayoutService
- column-packer.util.ts
- row-packer.util.ts














