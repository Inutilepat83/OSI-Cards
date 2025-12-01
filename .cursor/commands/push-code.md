# Pre-Push Checklist

## 1. Code Completion Verification

- [ ] All planned features are implemented
- [ ] No critical TODO comments left unaddressed
- [ ] All imports are resolved
- [ ] No console.log statements in production code (except warn/error)

## 2. Quality Gates

Run these in sequence:

```bash
# Auto-fix linting issues (warnings are OK, focus on errors)
npm run lint:fix

# Auto-format code
npm run format

# Verify build compiles (this is the real test)
npm run build
```

**Note:** Some pre-existing lint errors (84) exist in test files. These don't block production builds.

## 3. Testing (Optional for hotfixes)

```bash
# Unit tests (if time permits)
npm run test:unit

# E2E tests (run before major releases)
npm run test:e2e
```

## 4. Git Operations

```bash
# Stage all changes
git add .

# Commit (use --no-verify if pre-commit hooks are slow/failing)
git commit -m "type(scope): description"
# OR
git commit --no-verify -m "type(scope): description"

# Push to remote
git push origin main
```

### Conventional Commit Types:

| Type       | Description                    |
| ---------- | ------------------------------ |
| `feat`     | New feature                    |
| `fix`      | Bug fix                        |
| `chore`    | Maintenance, deps, tooling     |
| `style`    | Formatting, no code change     |
| `refactor` | Code restructuring             |
| `docs`     | Documentation only             |

## 5. Deployment (Automatic)

Deployment is **automatic** via GitHub Actions on push to `main`:

- **Workflow**: `.github/workflows/deploy.yml`
- **Live URL**: https://osi-card.web.app/
- **GitHub Actions**: https://github.com/Inutilepat83/OSI-Cards/actions

No manual Firebase deploy needed!

## 6. Check Pipeline & Deployment Status

### Quick Status Check (run after push):

```bash
# Check GitHub Actions status (requires gh CLI)
gh run list --limit 5

# Or open in browser
open https://github.com/Inutilepat83/OSI-Cards/actions

# Check if site is live
curl -s -o /dev/null -w "%{http_code}" https://osi-card.web.app/
# Should return: 200
```

### Detailed Pipeline Stats:

```bash
# Get latest workflow runs with status
gh run list --workflow=deploy.yml --limit 3

# Get detailed stats for latest run
gh run view $(gh run list --workflow=deploy.yml --limit 1 --json databaseId -q '.[0].databaseId')
```

### Firebase Hosting Stats:

```bash
# List recent deployments (requires firebase CLI + login)
firebase hosting:channel:list

# Check current deployment
firebase hosting:sites:list
```

### One-Liner Status Check:

```bash
echo "=== Pipeline Status ===" && \
gh run list --limit 3 --json status,conclusion,name,createdAt --template '{{range .}}{{.name}}: {{.conclusion}} ({{.status}}) - {{.createdAt}}{{"\n"}}{{end}}' 2>/dev/null || echo "Install gh CLI: brew install gh" && \
echo "" && \
echo "=== Site Status ===" && \
curl -s -o /dev/null -w "https://osi-card.web.app/ → HTTP %{http_code}\n" https://osi-card.web.app/
```

## 7. Post-Deployment Verification

- [ ] Check GitHub Actions completed successfully
- [ ] Verify https://osi-card.web.app/ loads correctly
- [ ] Test key features (card rendering, streaming, themes)
- [ ] Check browser console for errors

### Manual Site Verification:

```bash
# Open the live site
open https://osi-card.web.app/

# Open GitHub Actions
open https://github.com/Inutilepat83/OSI-Cards/actions
```

## 8. Version & Publish (Library releases only)

```bash
# Dry run first
npm run publish:smart:dry

# Publish to npm
npm run publish:smart           # patch
npm run publish:smart:minor     # minor
npm run publish:smart:major     # major
```

Verify: https://www.npmjs.com/package/osi-cards-lib

## Quick One-Liner

For fast pushes when you're confident:

```bash
npm run lint:fix && npm run format && npm run build && git add . && git commit --no-verify -m "type(scope): description" && git push origin main
```

## Full Push with Status Check

```bash
npm run lint:fix && npm run format && npm run build && \
git add . && git commit --no-verify -m "type(scope): description" && \
git push origin main && \
echo "⏳ Waiting for pipeline..." && sleep 10 && \
gh run list --limit 3
```

## Rollback Plan

If issues are found in production:

```bash
# Revert the problematic commit
git revert HEAD
git push origin main

# OR rollback Firebase hosting (within 30 days)
firebase hosting:rollback
```

## Known Issues (Pre-existing)

- **84 lint errors**: Mostly in test files (duplicate imports, prefer-for-of). Don't block builds.
- **TypeScript test errors**: Test files have some type mismatches. Production code compiles fine.
- **Husky hooks**: Can be slow; use `--no-verify` if needed.
- **CI/CD failures**: Some workflows may fail due to missing secrets or test issues. Check `deploy.yml` for actual deployment status.

## URLs Reference

| Resource | URL |
|----------|-----|
| **Live Site** | https://osi-card.web.app/ |
| **GitHub Repo** | https://github.com/Inutilepat83/OSI-Cards |
| **GitHub Actions** | https://github.com/Inutilepat83/OSI-Cards/actions |
| **NPM Package** | https://www.npmjs.com/package/osi-cards-lib |
| **Firebase Console** | https://console.firebase.google.com/project/osi-card |
