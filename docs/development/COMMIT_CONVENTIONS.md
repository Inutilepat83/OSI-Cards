# 📝 Commit Conventions

OSI Cards follows the **Conventional Commits** specification for semantic versioning.

---

## 📋 Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Examples

```bash
feat(grid): add virtual scrolling support
fix(api): handle timeout errors correctly
docs(readme): update installation instructions
perf(layout): optimize column calculations
refactor(services): extract layout logic
test(grid): add unit tests for masonry grid
```

---

## 🏷️ Commit Types

### Release Types

| Type | Release | Description |
|------|---------|-------------|
| `feat` | **Minor** | New feature |
| `fix` | **Patch** | Bug fix |
| `perf` | **Patch** | Performance improvement |
| `refactor` | **Patch** | Code refactoring |
| `revert` | **Patch** | Revert previous commit |

### Non-Release Types

| Type | Release | Description |
|------|---------|-------------|
| `docs` | None | Documentation only |
| `style` | None | Code style/formatting |
| `test` | None | Adding/updating tests |
| `build` | None | Build system changes |
| `ci` | None | CI/CD changes |
| `chore` | None | Maintenance tasks |

### Breaking Changes

Add `BREAKING CHANGE:` in footer or `!` after type:

```bash
feat!: redesign API interface

BREAKING CHANGE: API interface completely redesigned
```

This triggers a **Major** release.

---

## 🎯 Scopes

Common scopes in OSI Cards:

- `grid` - Masonry grid
- `layout` - Layout system
- `api` - API services
- `streaming` - LLM streaming
- `sections` - Card sections
- `theme` - Theming
- `a11y` - Accessibility
- `perf` - Performance
- `docs` - Documentation
- `build` - Build system
- `ci` - CI/CD

---

## ✅ Good Commit Messages

### Feature
```bash
feat(grid): add adaptive gap sizing

Implement automatic gap adjustment based on container width.
Improves responsive behavior on mobile devices.

Closes #123
```

### Bug Fix
```bash
fix(api): prevent duplicate API calls

Add request deduplication to prevent multiple identical
requests from being sent simultaneously.

Fixes #456
```

### Performance
```bash
perf(layout): memoize column calculations

Cache column calculation results to avoid redundant
computations. Improves performance by 10x.
```

### Breaking Change
```bash
feat(api)!: redesign service interface

BREAKING CHANGE: ApiService methods now return Observables
instead of Promises. Update all service calls.

Migration guide: docs/MIGRATION.md
```

---

## ❌ Bad Commit Messages

```bash
# Too vague
fix: bug fix

# No type
updated readme

# No description
feat(grid): changes

# Not descriptive
fix: fix issue
```

---

## 🤖 Automated Versioning

Semantic Release automatically:
1. Analyzes commits since last release
2. Determines version bump (major/minor/patch)
3. Generates changelog
4. Creates GitHub release
5. Publishes to npm
6. Updates package.json

### Version Examples

```
1.5.5 -> 1.5.6  (fix: bug fixes)
1.5.5 -> 1.6.0  (feat: new features)
1.5.5 -> 2.0.0  (feat!: breaking changes)
```

---

## 🔧 Setup

### Install Commitlint

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

### Configure Husky

```bash
# .husky/commit-msg
npx --no -- commitlint --edit $1
```

### Test Commit Message

```bash
echo "feat(grid): add feature" | npx commitlint
```

---

## 📚 Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)

---

**Last Updated:** December 4, 2025
**Status:** Active 📝

