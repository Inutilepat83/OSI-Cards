# Version Management System

> **Automated version consistency across NPM, Firebase, GitHub, and all documentation**

## 🎯 Overview

The OSI Cards project maintains version consistency across multiple targets:

| Target | Location | Auto-Updated |
|--------|----------|--------------|
| **Source of Truth** | `version.config.json` | Manual/Script |
| **NPM Package** | `package.json` (both root & lib) | ✅ Auto |
| **GitHub README** | `README.md` | ✅ Auto |
| **Documentation UI** | `docs-wrapper.component.ts` | ✅ Auto |
| **Section Registry** | `section-registry.json` | ✅ Auto |
| **Runtime Version** | `src/version.ts` | ✅ Auto |
| **API Manifest** | `manifest.json` | ✅ Auto |
| **Library README** | `projects/osi-cards-lib/README.md` | ✅ Auto |

## 🚀 Quick Start

### Update Everything in One Command

```bash
# Patch release (1.5.5 → 1.5.6) + publish to NPM
npm run publish:smart

# Minor release (1.5.5 → 1.6.0) + publish to NPM  
npm run publish:smart:minor

# Major release (1.5.5 → 2.0.0) + publish to NPM
npm run publish:smart:major
```

**What happens:**
1. ✅ Version bump
2. ✅ Sync all files
3. ✅ Build library & app
4. ✅ Publish to NPM
5. ✅ Commit & tag
6. ✅ Push to GitHub → triggers Firebase deploy

### Manual Version Sync (No Publish)

```bash
# Bump version only
npm run version:patch   # 1.5.5 → 1.5.6
npm run version:minor   # 1.5.5 → 1.6.0
npm run version:major   # 1.5.5 → 2.0.0

# Or sync current version across all files
npm run version:sync-all
```

## 📝 Version Files Updated Automatically

### 1. Package Files
- `package.json` (root)
- `projects/osi-cards-lib/package.json`

### 2. Documentation
- `README.md` - "What's New in vX.X.X"
- `projects/osi-cards-lib/README.md` - All version references
- `src/app/features/documentation/docs-wrapper.component.ts` - UI version display

### 3. Registry & Config
- `projects/osi-cards-lib/section-registry.json` - Registry version
- `src/assets/configs/generated/manifest.json` - API version

### 4. Runtime
- `src/version.ts` - Generated with git hash, branch, build date

## 🔄 Deployment Workflows

### Option 1: Firebase Only (No NPM)

```bash
git add .
git commit -m "feat: some feature"
git push origin main
```

**Result:**
- ✅ Firebase deploys automatically
- ⏭️ NPM not updated

### Option 2: Firebase + NPM (Automatic)

Add `[publish]` to commit message:

```bash
git add .
git commit -m "feat: new library feature [publish]"
git push origin main
```

**Result:**
- ✅ Firebase deploys automatically
- ✅ NPM publishes automatically
- ✅ All versions synced

### Option 3: Full Release (Recommended)

Use smart publish script:

```bash
npm run publish:smart          # patch
npm run publish:smart:minor    # minor  
npm run publish:smart:major    # major
```

**Result:**
- ✅ Version bumped
- ✅ All files synced
- ✅ NPM published
- ✅ Git tagged
- ✅ Firebase deploys
- ✅ GitHub release created

## 🔍 Version Verification

### Check Current Versions

```bash
# All versions at once
node scripts/sync-all-versions.js

# Individual checks
echo "Root:" && cat package.json | grep '"version"' | head -1
echo "Lib:" && cat projects/osi-cards-lib/package.json | grep '"version"' | head -1
echo "NPM:" && npm view osi-cards-lib version
echo "Registry:" && grep '"version"' projects/osi-cards-lib/section-registry.json | head -1
```

### Pre-Release Checklist

Before publishing a new version:

- [ ] All features complete and tested
- [ ] Documentation updated
- [ ] CHANGELOG.md updated with changes
- [ ] No breaking changes (or documented if major version)
- [ ] Run `npm run build` successfully
- [ ] Run `npm run build:lib` successfully

## 🏗️ CI/CD Integration

### GitHub Actions Workflows

#### 1. `deploy.yml` - Standard Deployment
**Triggers:** Push to `main`
**Actions:**
- ✅ Sync versions
- ✅ Build library & app
- ✅ Deploy to Firebase
- ✅ Publish to NPM (if `[publish]` in commit message)

#### 2. `deploy-with-npm.yml` - Full Release Workflow
**Triggers:** Manual workflow dispatch
**Options:**
- Version bump type (patch/minor/major)
- Publish to NPM (yes/no)
**Actions:**
- ✅ Version bump
- ✅ Sync all versions
- ✅ Build & publish
- ✅ Create GitHub release
- ✅ Deploy to Firebase

### Environment Variables Required

```bash
# GitHub Secrets (Settings > Secrets and variables > Actions)
FIREBASE_SERVICE_ACCOUNT  # Firebase service account JSON
NPM_TOKEN                 # NPM publish token (npm token create)
```

## 📦 NPM Publishing

### Automatic Publishing

1. **Via Smart Publish Script:**
   ```bash
   npm run publish:smart:minor
   ```

2. **Via Commit Message:**
   ```bash
   git commit -m "feat: new feature [publish]"
   git push
   ```

3. **Via GitHub Actions:**
   - Go to: Actions > Deploy to Firebase & NPM
   - Click "Run workflow"
   - Select version bump type
   - Check "Publish to NPM"

### Manual Publishing

```bash
# Build library
npm run build:lib

# Publish
cd dist/osi-cards-lib
npm publish --access public
cd ../..
```

## 🔧 Troubleshooting

### Version Mismatch Detected

```bash
# Fix it
npm run version:sync-all

# Verify
node scripts/sync-all-versions.js
```

### NPM Publish Fails

```bash
# Check authentication
npm whoami

# Login if needed
npm login

# Check existing versions
npm view osi-cards-lib versions
```

### Firebase Deploy Fails

```bash
# Check project ID
cat .github/workflows/deploy.yml | grep projectId

# Should be: osi-card (not osi-cards)
```

## 📊 Version Strategy

### Semantic Versioning

```
MAJOR.MINOR.PATCH

Examples:
1.5.5 → 1.5.6  (patch)  - Bug fixes
1.5.5 → 1.6.0  (minor)  - New features
1.5.5 → 2.0.0  (major)  - Breaking changes
```

### When to Bump

| Change Type | Version | Example |
|-------------|---------|---------|
| Bug fix | `patch` | Fix theme toggle |
| New section type | `minor` | Add timeline section |
| New component | `minor` | Add card carousel |
| API change | `major` | Change required inputs |
| Removed export | `major` | Remove deprecated service |

## 🎯 Best Practices

### 1. Always Use Smart Publish for Releases

```bash
# ✅ GOOD
npm run publish:smart:minor

# ❌ AVOID (manual steps prone to errors)
npm version minor
npm run build:lib
cd dist/osi-cards-lib
npm publish
# ... forgot to update README, docs, etc.
```

### 2. Include [publish] in Commit for Auto-NPM

```bash
# ✅ GOOD - Auto publishes to NPM
git commit -m "feat: new card type [publish]"

# ✅ GOOD - Firebase only
git commit -m "docs: update README"
```

### 3. Let CI/CD Handle Versions

The deployment pipeline now:
- ✅ Syncs versions automatically
- ✅ Updates all documentation
- ✅ Publishes conditionally
- ✅ Creates releases

## 📚 Related Documentation

- [Push Code Guide](../../.github/docs/push-code.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Changelog](../../CHANGELOG.md)

## 🔗 Quick Links

- **NPM Package**: https://www.npmjs.com/package/osi-cards-lib
- **Demo Site**: https://osi-card.web.app/
- **GitHub Actions**: https://github.com/Inutilepat83/OSI-Cards/actions
- **Firebase Console**: https://console.firebase.google.com/project/osi-card

---

**Last Updated:** Automated version sync system  
**Version:** Dynamic (synced from `version.config.json`)

