# Pre-Push Checklist

## 1. Code Completion Verification

- [ ] All planned features are implemented
- [ ] No TODO comments left unaddressed (or documented if intentional)
- [ ] No placeholder code remaining
- [ ] All imports are resolved
- [ ] No console.log statements left in production code

## 2. Quality Gates

- [ ] Run `npm run lint:fix` - auto-fix linting issues
- [ ] Run `npm run format` - auto-format code
- [ ] Run `npm run validate:all` - comprehensive validation
- [ ] Check TypeScript: `npx tsc --noEmit --project tsconfig.json`
- [ ] Check for circular dependencies

## 3. Testing

- [ ] Run unit tests: `npm run test:unit`
- [ ] Run E2E tests: `npm run test:e2e` (Chrome only for speed)
- [ ] Check test coverage meets target (95%)
- [ ] Fix any failing tests before proceeding
- [ ] Run visual regression if UI changed: `npm run test:visual`

## 4. Build Verification

- [ ] Build library: `npm run build:lib`
- [ ] Build app: `npm run build:prod`
- [ ] Check bundle size: `npm run size:check`
- [ ] No build errors or warnings

## 5. Git Operations

```bash
# Stage all changes
git add .

# Commit with conventional format
git commit -m "type(scope): description"

# Types: feat, fix, docs, style, refactor, perf, test, chore
# Example: git commit -m "feat(sections): add new chart section type"

# Push to remote
git push origin $(git branch --show-current)
```

- [ ] Create PR if on feature branch
- [ ] Request review if required

## 6. Version & Publish (if releasing)

```bash
# Dry run first to see what would happen
npm run publish:smart:dry

# Publish with automatic version bump
npm run publish:smart           # patch (default)
npm run publish:smart:minor     # minor version
npm run publish:smart:major     # major version (breaking changes)
```

- [ ] Verify package on npm: https://www.npmjs.com/package/osi-cards-lib
- [ ] Update CHANGELOG.md if not auto-generated

## 7. Deployment Verification

- [ ] Wait for CI/CD pipeline to complete (check GitHub Actions)
- [ ] Check Firebase deployment: https://osi-card.web.app/
- [ ] Test critical user flows:
  - [ ] Card rendering
  - [ ] Section types display correctly
  - [ ] Streaming simulation works
  - [ ] Theme switching works
- [ ] Check browser console for errors
- [ ] Check network tab for failed requests

## Rollback Plan

If issues are found in production:

```bash
# 1. Revert the problematic commit
git revert HEAD
git push origin $(git branch --show-current)

# 2. Unpublish npm package (within 72 hours only)
npm unpublish osi-cards-lib@<version>

# 3. Rollback Firebase hosting
firebase hosting:rollback
```

## Quick Commands Reference

```bash
# Full pre-push check (run all in sequence)
npm run lint:fix && npm run format && npm run test:unit && npm run build:lib && npm run build:prod

# One-liner for quick validation
npm run check:all

# View current version
npm run version:show

# Generate changelog
npm run generate:release-notes
```

## Conventional Commit Types

| Type       | Description                          |
| ---------- | ------------------------------------ |
| `feat`     | New feature                          |
| `fix`      | Bug fix                              |
| `docs`     | Documentation only                   |
| `style`    | Formatting, no code change           |
| `refactor` | Code restructuring, no feature/fix   |
| `perf`     | Performance improvement              |
| `test`     | Adding/updating tests                |
| `chore`    | Build process, dependencies, tooling |
| `ci`       | CI/CD configuration                  |
| `revert`   | Reverting a previous commit          |

## Notes

- Always run dry-run before actual publish
- Breaking changes require major version bump
- Update documentation for new features
- Tag releases in GitHub for traceability
