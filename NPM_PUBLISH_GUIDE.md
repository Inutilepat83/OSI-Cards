# 📦 NPM Library Publishing Guide

## 🚨 Common Issue: "You cannot publish over the previously published versions"

### Why This Happens

NPM prevents publishing the same version twice. If you try to publish version `1.5.5` when `1.5.5` is already on NPM, you'll get an error.

**Solution:** You MUST bump the version first!

---

## ✅ Correct Workflow

### Option 1: Smart Publish (Recommended) ⭐

This handles everything automatically:

```bash
# Bump patch and publish (1.5.5 → 1.5.6)
npm run publish:smart

# Bump minor and publish (1.5.5 → 1.6.0)
npm run publish:smart:minor

# Bump major and publish (1.5.5 → 2.0.0)
npm run publish:smart:major
```

**What it does:**
1. ✅ Checks current NPM version
2. ✅ Bumps version automatically
3. ✅ Syncs ALL files (README, docs, registry, etc.)
4. ✅ Builds library & app
5. ✅ Publishes to NPM
6. ✅ Commits & tags
7. ✅ Pushes to GitHub (triggers Firebase deploy)

### Option 2: Manual Bump + Publish

```bash
# 1. Bump version first
npm run version:patch    # or :minor or :major

# 2. Build library
npm run build:lib

# 3. Publish
npm run publish:force

# 4. Commit and push
git add .
git commit -m "chore(release): v$(cat version.config.json | jq -r .version) [publish]"
git push origin main
```

### Option 3: Quick Library Update (No Version Bump)

If you've made library changes but **haven't** published yet:

```bash
# 1. Make your library changes
# ... edit files in projects/osi-cards-lib/ ...

# 2. Use smart publish (it bumps + publishes)
npm run publish:smart
```

---

## ❌ Wrong Workflow (Will Fail)

```bash
# ❌ DON'T DO THIS - Will fail if version exists
npm run build:lib
cd dist/osi-cards-lib
npm publish --access public
# Error: You cannot publish over the previously published versions: 1.5.5
```

---

## 🔍 Check Before Publishing

### Verify Current Versions

```bash
# Check local version
cat version.config.json | jq -r .version

# Check NPM version
npm view osi-cards-lib version

# Are they the same?
LOCAL=$(cat version.config.json | jq -r .version)
NPM=$(npm view osi-cards-lib version)

if [ "$LOCAL" == "$NPM" ]; then
    echo "⚠️  Version $LOCAL already on NPM - bump required!"
else
    echo "✅ Ready to publish $LOCAL (NPM has $NPM)"
fi
```

### Pre-Publish Checklist

- [ ] Version is bumped (local > NPM)
- [ ] Library builds: `npm run build:lib`
- [ ] All versions synced: `npm run version:sync-all`
- [ ] Changes committed to git
- [ ] CHANGELOG.md updated

---

## 🎯 Step-by-Step: Publishing Library Update

Let's say you just fixed the theme bug and want to publish it:

### Step 1: Verify Current State

```bash
echo "Local:  $(cat version.config.json | jq -r .version)"
echo "NPM:    $(npm view osi-cards-lib version)"
```

**Example output:**
```
Local:  1.5.5
NPM:    1.5.5
```

→ **They're the same! Must bump version.**

### Step 2: Use Smart Publish

```bash
# For bug fix: patch bump
npm run publish:smart

# This will:
# • Bump to 1.5.6
# • Sync all files
# • Build library
# • Publish to NPM
# • Commit & push
# • Deploy to Firebase
```

### Step 3: Monitor

```bash
# Watch deployment
gh run list --repo Inutilepat83/OSI-Cards --workflow deploy.yml --limit 1

# Verify NPM
npm view osi-cards-lib version
# Should show: 1.5.6
```

---

## 🔄 Different Scenarios

### Scenario 1: Theme Fix (Bug Fix)

```bash
# You fixed a bug in the library
npm run publish:smart

# Result: 1.5.5 → 1.5.6
```

### Scenario 2: New Section Type (Feature)

```bash
# You added a new feature
npm run publish:smart:minor

# Result: 1.5.5 → 1.6.0
```

### Scenario 3: Breaking API Change

```bash
# You changed required inputs
npm run publish:smart:major

# Result: 1.5.5 → 2.0.0
```

### Scenario 4: Already Bumped Version

If you already bumped version.config.json manually:

```bash
# Just build and publish (no bump)
npm run build:lib
npm run publish:force

# Then commit
git add .
git commit -m "chore(release): v$(cat version.config.json | jq -r .version)"
git push
```

---

## 🧪 Testing the System

### Test Smart Publish (Dry Run)

Currently there's no dry-run for smart-publish-v2, but you can test the steps:

```bash
# 1. Check what version bump would happen
echo "Current: $(cat version.config.json | jq -r .version)"
echo "After patch: would be $(npm version patch --dry-run 2>&1 | grep -o 'v[0-9.]*')"

# 2. Test sync
npm run version:sync-all

# 3. Test build
npm run build:lib

# 4. Test publish dry-run
cd dist/osi-cards-lib && npm publish --dry-run && cd ../..
```

### Test Library Package

```bash
# Create temp test project
cd /tmp
mkdir test-osi-lib && cd test-osi-lib
npm init -y
npm install osi-cards-lib@latest

# Test it works
node -e "console.log(require('osi-cards-lib'))"

# Cleanup
cd .. && rm -rf test-osi-lib
```

---

## 🛠️ Troubleshooting

### Issue: "You cannot publish over previously published versions"

**Cause:** Trying to publish version that already exists on NPM

**Solution:**
```bash
# Bump the version
npm run version:patch

# Then publish
npm run publish:smart
```

### Issue: "npm ERR! 403 Forbidden"

**Cause:** Not authenticated or no permission

**Solution:**
```bash
# Check login
npm whoami

# Login if needed
npm login

# Verify you can publish
npm access ls-packages
```

### Issue: "Version already exists but local was bumped"

**Cause:** You bumped but didn't sync all files

**Solution:**
```bash
# Sync everything
npm run version:sync-all

# Rebuild
npm run build:lib

# Publish
npm run publish:force
```

### Issue: "Module not found" in published package

**Cause:** Missing files in build

**Solution:**
```bash
# Check what's in the dist
ls -la dist/osi-cards-lib/

# Rebuild clean
rm -rf dist/
npm run build:lib

# Verify files
ls dist/osi-cards-lib/
# Should see: fesm2022/, styles/, index.d.ts, package.json, README.md
```

---

## 📊 Quick Reference

```
┌──────────────────────────────────────────────────────────────┐
│              NPM LIBRARY UPDATE WORKFLOW                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  SCENARIO: Need to update library on NPM                     │
│                                                               │
│  ✅ CORRECT:                                                  │
│     npm run publish:smart                                    │
│                                                               │
│  ❌ WRONG:                                                    │
│     npm run build:lib                                        │
│     cd dist/osi-cards-lib && npm publish                     │
│     → Fails if version already published!                    │
│                                                               │
│  💡 WHY:                                                      │
│     Smart publish bumps version FIRST, then publishes        │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  CHECK VERSIONS:                                              │
│     Local: cat version.config.json | jq -r .version         │
│     NPM:   npm view osi-cards-lib version                    │
│                                                               │
│  MUST BE DIFFERENT TO PUBLISH!                               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 Your Current Situation

```bash
# Check status
echo "Local version:  $(cat version.config.json | jq -r .version)"
echo "NPM version:    $(npm view osi-cards-lib version)"
```

**If they're the same (both 1.5.5):**

```bash
# Solution: Use smart publish to bump first
npm run publish:smart

# This will:
# ✅ Bump to 1.5.6
# ✅ Sync all files
# ✅ Build library
# ✅ Publish to NPM (will succeed because 1.5.6 doesn't exist yet)
# ✅ Deploy to Firebase
```

**If local is already higher:**

```bash
# Just rebuild and publish
npm run build:lib
npm run publish:force
```

---

## 📝 Summary

**To publish a library update to NPM, you MUST:**

1. **Bump the version** (local version must be > NPM version)
2. **Build the library** (`npm run build:lib`)
3. **Publish** (`cd dist/osi-cards-lib && npm publish`)

**Or use smart-publish to do all 3 automatically:**

```bash
npm run publish:smart
```

**That's it!** The system handles everything else.

---

## 🔗 Quick Links

- **NPM Package**: https://www.npmjs.com/package/osi-cards-lib
- **All Versions**: https://www.npmjs.com/package/osi-cards-lib?activeTab=versions
- **Bundle Size**: https://bundlephobia.com/package/osi-cards-lib
- **GitHub**: https://github.com/Inutilepat83/OSI-Cards

---

**Need Help?**

Run this diagnostic:

```bash
cat << 'EOF'
═══════════════════════════════════════
NPM PUBLISH DIAGNOSTIC
═══════════════════════════════════════

Local Version:  $(cat version.config.json | jq -r .version)
NPM Version:    $(npm view osi-cards-lib version)
NPM Login:      $(npm whoami)
Library Built:  $([ -f "dist/osi-cards-lib/package.json" ] && echo "✅ Yes" || echo "❌ No - run: npm run build:lib")

Recommendation:
$([ "$(cat version.config.json | jq -r .version)" == "$(npm view osi-cards-lib version)" ] && echo "⚠️ Same version - run: npm run publish:smart" || echo "✅ Ready to publish - run: npm run publish:force")

EOF
```

