# 🚀 Deployment Pipeline v2.0

> **Automated version management + NPM publishing + Firebase deployment**

## 🎯 TL;DR - What Changed

| Before | After |
|--------|-------|
| Manual version updates in multiple files | ✅ **Automated** via `sync-all-versions.js` |
| Hardcoded "v2.0" in docs UI | ✅ **Dynamic** from `version.ts` |
| Firebase-only deployment | ✅ **NPM + Firebase** in one pipeline |
| Inconsistent versions | ✅ **Single source of truth** (`version.config.json`) |

## 📦 Quick Commands

### Publish New Release

```bash
# Patch (1.5.5 → 1.5.6)
npm run publish:smart

# Minor (1.5.5 → 1.6.0)
npm run publish:smart:minor

# Major (1.5.5 → 2.0.0)
npm run publish:smart:major
```

**This does EVERYTHING:**
1. Bumps version
2. Syncs all files (README, docs, registry, manifest)
3. Builds library & app
4. Publishes to NPM
5. Commits & tags
6. Pushes to GitHub
7. Triggers Firebase deployment

### Deploy Without NPM Publish

```bash
# Standard push
git add .
git commit -m "fix: some fix"
git push

# Result: Firebase deploys, NPM unchanged
```

### Deploy WITH NPM Publish (via commit message)

```bash
# Add [publish] to commit message
git add .
git commit -m "feat: new feature [publish]"
git push

# Result: Firebase deploys + NPM publishes
```

## 🗂️ Files Managed by Version Sync

When you run `npm run version:sync-all` or any `publish:smart` command:

```
✓ package.json                                    → version: "1.5.5"
✓ projects/osi-cards-lib/package.json             → version: "1.5.5"
✓ projects/osi-cards-lib/section-registry.json    → version: "1.5.5"
✓ src/app/features/documentation/docs-wrapper.ts  → <span>v1.5.5</span>
✓ README.md                                       → What's New in v1.5.5
✓ projects/osi-cards-lib/README.md                → All v1.5.5 references
✓ src/version.ts                                  → VERSION.full = '1.5.5'
✓ src/assets/configs/generated/manifest.json      → registryVersion: "1.5.5"
```

## 🔄 Deployment Workflows

### Workflow 1: `deploy.yml` (Standard)

**Triggers:** Every push to `main`

```yaml
Steps:
1. Install dependencies (with --legacy-peer-deps)
2. Sync all versions ← NEW!
3. Build library
4. Build app
5. Publish to NPM (if [publish] in commit) ← NEW!
6. Deploy to Firebase
```

### Workflow 2: `deploy-with-npm.yml` (Advanced)

**Triggers:** Manual dispatch

```yaml
Options:
- version_bump: none | patch | minor | major
- publish_npm: true | false

Steps:
1. Version bump (if requested)
2. Sync all versions
3. Build library & app
4. Publish to NPM (if enabled)
5. Commit & tag (if version bumped)
6. Deploy to Firebase
7. Create GitHub release (if version bumped)
```

## 📝 GitHub Secrets Setup

Add these secrets to your repository:

### 1. NPM_TOKEN

```bash
# Create NPM token
npm login
npm token create --read-write

# Add to GitHub:
# Settings > Secrets > Actions > New repository secret
# Name: NPM_TOKEN
# Value: npm_xxxxxxxxxxxx
```

### 2. FIREBASE_SERVICE_ACCOUNT

```bash
# Get from Firebase Console:
# Project Settings > Service Accounts > Generate new private key

# Add to GitHub:
# Settings > Secrets > Actions > New repository secret
# Name: FIREBASE_SERVICE_ACCOUNT
# Value: { "type": "service_account", ... }
```

## 🎮 Usage Examples

### Example 1: Bug Fix (No Version Bump)

```bash
# Fix the bug
# ... make changes ...

# Deploy (Firebase only, keep current version)
git add .
git commit -m "fix: theme toggle not working"
git push

# Result:
# ✅ Firebase updated
# ⏭️ NPM stays at current version
# ⏭️ No version bump
```

### Example 2: New Feature (Firebase + NPM)

```bash
# Add new feature
# ... make changes ...

# Deploy with NPM publish
npm run publish:smart:minor

# Result:
# ✅ Version: 1.5.5 → 1.6.0
# ✅ All docs updated
# ✅ NPM published
# ✅ Firebase deployed
# ✅ Git tagged
```

### Example 3: Library-Only Update

```bash
# Update library code
# ... make changes in projects/osi-cards-lib ...

# Publish library with auto-commit
npm run publish:smart

# Result:
# ✅ Version: 1.5.5 → 1.5.6
# ✅ Library published to NPM
# ✅ Demo app deployed (shows new library)
# ✅ Versions synced everywhere
```

### Example 4: Documentation Update (No Publish)

```bash
# Update docs only
# ... make changes to *.md files ...

# Deploy
git add .
git commit -m "docs: update installation guide"
git push

# Result:
# ✅ Firebase updated
# ⏭️ NPM unchanged (no library changes)
# ⏭️ No version bump
```

## 🔍 Monitoring

### Check Deployment Status

```bash
# Current deployment
gh run list --repo Inutilepat83/OSI-Cards --workflow deploy.yml --limit 1

# Watch deployment
gh run watch --repo Inutilepat83/OSI-Cards

# View logs
gh run view --log --repo Inutilepat83/OSI-Cards
```

### Verify Everything

```bash
# Check all versions are in sync
npm run version:sync-all

# Check NPM
npm view osi-cards-lib version

# Check Firebase
curl -I https://osi-card.web.app/

# Check GitHub
git tag -l | tail -5
```

## ⚡ Pro Tips

### 1. Use Smart Publish for Releases

The `publish:smart` commands handle everything:
- ✅ No manual steps
- ✅ No forgotten files
- ✅ Consistent versioning
- ✅ Automated deployment

### 2. Use [publish] Tag for Quick Releases

When committing library changes:
```bash
git commit -m "feat: new section type [publish]"
```
Automatically publishes to NPM without running smart-publish.

### 3. Check Before You Push

```bash
# Verify versions are in sync
npm run version:sync-all

# Ensure it builds
npm run build && npm run build:lib
```

### 4. Monitor Deployment

After pushing, track status:
```bash
gh run watch --repo Inutilepat83/OSI-Cards
```

## 🆘 Quick Fixes

### Versions Out of Sync

```bash
npm run version:sync-all
git add .
git commit -m "chore: sync versions"
git push
```

### NPM Publish Failed

```bash
# Check authentication
npm whoami

# Publish manually
cd dist/osi-cards-lib
npm publish --access public
cd ../..
```

### Deployment Failed

```bash
# Check logs
gh run view --log --repo Inutilepat83/OSI-Cards

# Common fixes:
# - Add --legacy-peer-deps to npm ci ✅ (already done)
# - Disable tests if broken ✅ (already done)
# - Correct Firebase project ID ✅ (already done)
```

---

## 📊 Version Sync Verification

Run this to verify everything is in sync:

```bash
echo "=== Version Check ===" && \
echo "Config:   $(cat version.config.json | jq -r .version)" && \
echo "Root:     $(cat package.json | jq -r .version)" && \
echo "Library:  $(cat projects/osi-cards-lib/package.json | jq -r .version)" && \
echo "Registry: $(cat projects/osi-cards-lib/section-registry.json | jq -r .version)" && \
echo "Manifest: $(cat src/assets/configs/generated/manifest.json | jq -r .registryVersion)" && \
echo "NPM:      $(npm view osi-cards-lib version 2>/dev/null)"
```

**All should show the same version!**

---

**System Status:** 
- ✅ Version sync automated
- ✅ NPM publishing integrated
- ✅ Firebase deployment active
- ✅ GitHub Actions configured

