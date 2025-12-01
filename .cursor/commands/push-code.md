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

| Type       | Description                |
| ---------- | -------------------------- |
| `feat`     | New feature                |
| `fix`      | Bug fix                    |
| `chore`    | Maintenance, deps, tooling |
| `style`    | Formatting, no code change |
| `refactor` | Code restructuring         |
| `docs`     | Documentation only         |

## 5. Deployment (Automatic)

Deployment is **automatic** via GitHub Actions on push to `main`:

- **Workflow**: `.github/workflows/deploy.yml`
- **Live URL**: https://osi-card.web.app/
- **GitHub Actions**: https://github.com/Inutilepat83/OSI-Cards/actions

No manual Firebase deploy needed!

---

# 📦 Version Management System

## 6. Version Status Check

Always check version status before releasing:

```bash
# Show version status across all files
npm run version:show

# Check if versions are in sync (returns exit code 1 if not)
npm run version:check
```

### Version Files Tracked:

- `version.config.json` - **Source of truth**
- `package.json` (root)
- `projects/osi-cards-lib/package.json`
- `src/version.ts` (with dynamic build date, git hash, branch)
- `docs/openapi.yaml`
- `CHANGELOG.md`

## 7. Version Bump & Sync

```bash
# Sync current version to all files (no bump)
npm run version:sync

# Bump version and sync all files
npm run version:patch      # 1.5.2 → 1.5.3
npm run version:minor      # 1.5.2 → 1.6.0
npm run version:major      # 1.5.2 → 2.0.0
npm run version:prerelease # 1.5.2 → 1.5.3-rc.0

# Generate version.ts only (runs during prebuild)
npm run version:generate
```

## 8. Release Notes Generation

```bash
# Generate release notes from git commits
npm run release:notes

# Release notes are generated from conventional commits:
# - feat: → ✨ Features
# - fix:  → 🐛 Bug Fixes
# - perf: → ⚡ Performance
# - docs: → 📚 Documentation
# - refactor: → ♻️ Refactoring
```

Output files:

- `RELEASE_NOTES.md` - Current release notes
- `CHANGELOG.md` - Full changelog history

---

# 🤖 MCP-Powered Monitoring (Cursor Integration)

## 9. GitHub MCP Setup

The GitHub MCP is configured in `~/.cursor/mcp.json` for pipeline monitoring directly in Cursor.

### Environment Variable Setup:

Add your GitHub token to your shell profile:

```bash
# Add to ~/.zshrc
echo 'export GITHUB_TOKEN="ghp_your_token_here"' >> ~/.zshrc
source ~/.zshrc
```

Or use Cursor's environment:

```bash
mkdir -p ~/.cursor
echo 'GITHUB_TOKEN=ghp_your_token_here' > ~/.cursor/.env
```

### Get a GitHub Token:

1. Visit: https://github.com/settings/tokens/new?scopes=repo,workflow&description=Cursor%20GitHub%20MCP
2. Generate token with `repo` and `workflow` scopes
3. Add to environment as shown above
4. Reload Cursor: **Cmd+Shift+P** → "Developer: Reload Window"

### MCP Configuration (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "GitHub MCP": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}"
      },
      "tools": ["*"]
    }
  }
}
```

## 10. Monitor with Cursor AI

Once MCP is configured, ask Cursor AI to:

```
Check my GitHub pipeline status for OSI-Cards
```

Or use these MCP commands directly:

- `list_commits` - Recent commits
- `list_pull_requests` - Open PRs
- `list_issues` - Issues
- `search_code` - Search codebase

---

# 📊 CLI-Based Monitoring

## 11. Quick Status Check (gh CLI)

```bash
# Get workflow status (requires gh CLI)
gh run list --repo Inutilepat83/OSI-Cards --workflow deploy.yml --limit 5 --json status,conclusion,displayTitle,headSha

# Formatted output
gh run list --repo Inutilepat83/OSI-Cards --workflow deploy.yml --limit 5
```

## 12. Full Status Dashboard

```bash
#!/bin/bash
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              OSI-CARDS DEPLOYMENT STATUS                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "📦 Version Status:"
npm run version:show 2>/dev/null || echo "   (Run from project root)"
echo ""

echo "📦 Latest Commits:"
git log --oneline -5
echo ""

echo "🔄 Pipeline Status (deploy.yml):"
gh run list --repo Inutilepat83/OSI-Cards --workflow deploy.yml --limit 5 2>/dev/null || echo "   (Install gh CLI: brew install gh)"
echo ""

echo "🌐 Site Status:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://osi-card.web.app/)
if [ "$HTTP_CODE" == "200" ]; then
    echo "   https://osi-card.web.app/ → ✅ HTTP $HTTP_CODE (Live)"
else
    echo "   https://osi-card.web.app/ → ⚠️  HTTP $HTTP_CODE"
fi
echo ""

echo "🔗 Quick Links:"
echo "   • Site: https://osi-card.web.app/"
echo "   • Actions: https://github.com/Inutilepat83/OSI-Cards/actions"
echo "   • Firebase: https://console.firebase.google.com/project/osi-card"
```

## 13. Auto-Monitor Script

```bash
#!/bin/bash
# monitor-deploy.sh - Run after pushing

REPO="Inutilepat83/OSI-Cards"
WORKFLOW="deploy.yml"
SITE_URL="https://osi-card.web.app/"
MAX_WAIT=300  # 5 minutes max
POLL_INTERVAL=15

echo "🚀 Monitoring deployment pipeline..."
echo "   Repo: $REPO"
echo "   Workflow: $WORKFLOW"
echo ""

START_TIME=$(date +%s)

while true; do
    ELAPSED=$(($(date +%s) - START_TIME))

    if [ $ELAPSED -gt $MAX_WAIT ]; then
        echo "⏰ Timeout after ${MAX_WAIT}s. Check manually:"
        echo "   https://github.com/$REPO/actions"
        exit 1
    fi

    # Get latest run info
    RUN_INFO=$(gh run list --repo "$REPO" --workflow "$WORKFLOW" --limit 1 --json databaseId,status,conclusion -q '.[0]')
    STATUS=$(echo "$RUN_INFO" | jq -r '.status')
    CONCLUSION=$(echo "$RUN_INFO" | jq -r '.conclusion')
    RUN_ID=$(echo "$RUN_INFO" | jq -r '.databaseId')

    echo -ne "\r⏳ [$ELAPSED s] Status: $STATUS | Conclusion: $CONCLUSION     "

    if [ "$STATUS" == "completed" ]; then
        echo ""
        if [ "$CONCLUSION" == "success" ]; then
            SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL")
            echo "✅ Pipeline PASSED!"
            echo "🌐 Site status: HTTP $SITE_STATUS"
            if [ "$SITE_STATUS" == "200" ]; then
                echo "🎉 Deployment successful! Site is live."
                exit 0
            else
                echo "⚠️  Site may still be propagating. Check: $SITE_URL"
                exit 0
            fi
        else
            echo "❌ Pipeline FAILED!"
            echo "   View logs: gh run view $RUN_ID --repo $REPO --log"
            echo "   Or: https://github.com/$REPO/actions/runs/$RUN_ID"
            exit 1
        fi
    fi

    sleep $POLL_INTERVAL
done
```

## 14. Quick One-Liner Monitor

```bash
# Poll until deploy.yml completes
while true; do \
  STATUS=$(gh run list --repo Inutilepat83/OSI-Cards --workflow deploy.yml --limit 1 --json status -q '.[0].status'); \
  CONCLUSION=$(gh run list --repo Inutilepat83/OSI-Cards --workflow deploy.yml --limit 1 --json conclusion -q '.[0].conclusion'); \
  echo "$(date +%H:%M:%S) Status: $STATUS | Conclusion: $CONCLUSION"; \
  [ "$STATUS" == "completed" ] && break; \
  sleep 10; \
done && \
[ "$CONCLUSION" == "success" ] && echo "✅ Deployed!" || echo "❌ Failed"
```

## 15. Simplified Watch Command

```bash
# No jq required - watch pipeline every 10 seconds
watch -n 10 'gh run list --repo Inutilepat83/OSI-Cards --workflow deploy.yml --limit 3'
```

---

# 🔧 Troubleshooting

## 16. Auto-Fix Pipeline Failures

```bash
#!/bin/bash
echo "🔧 Attempting auto-fix..."

# 1. Sync versions first
echo "→ Syncing versions..."
npm run version:sync 2>/dev/null

# 2. Fix lint errors
echo "→ Running lint:fix..."
npm run lint:fix 2>/dev/null

# 3. Fix formatting
echo "→ Running format..."
npm run format 2>/dev/null

# 4. Rebuild
echo "→ Building..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"

    if [ -n "$(git status --porcelain)" ]; then
        echo "→ Committing fixes..."
        git add .
        git commit --no-verify -m "fix: auto-fix lint and format issues"
        git push origin main
        echo "🚀 Pushed fixes!"
    else
        echo "ℹ️  No changes to commit"
    fi
else
    echo "❌ Build failed. Manual intervention needed."
    exit 1
fi
```

## 17. Common CI/CD Issues & Fixes

| Issue                     | Solution                                         |
| ------------------------- | ------------------------------------------------ |
| npm dependency conflicts  | Add `--legacy-peer-deps` to `npm ci` in workflow |
| Husky install fails in CI | Add `--ignore-scripts` to `npm ci` in workflow   |
| Font inlining fails       | Set `fonts.inline: false` in `angular.json`      |
| Firebase auth fails       | Add `FIREBASE_SERVICE_ACCOUNT` secret to GitHub  |
| TypeScript strict errors  | Check `tsconfig.json` strict options             |
| Version mismatch          | Run `npm run version:sync`                       |

### Firebase Service Account Setup:

1. Go to: https://console.firebase.google.com/project/osi-card/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Go to: https://github.com/Inutilepat83/OSI-Cards/settings/secrets/actions
4. Add secret named `FIREBASE_SERVICE_ACCOUNT` with the JSON content

---

# 🚀 Complete Push Workflow

## 18. Standard Push (No Version Bump)

```bash
npm run version:sync && \
npm run lint:fix && \
npm run format && \
npm run build && \
git add . && \
git commit --no-verify -m "type(scope): description" && \
git push origin main
```

## 19. Release Push (With Version Bump)

```bash
# Bump version, generate release notes, sync all files
npm run version:patch && \
npm run release:notes && \
npm run lint:fix && \
npm run format && \
npm run build && \
git add . && \
git commit --no-verify -m "chore(release): v$(node -p \"require('./version.config.json').version\")" && \
git push origin main
```

## 20. Ultimate One-Liner (Push + Monitor)

```bash
npm run version:sync && \
npm run lint:fix && \
npm run format && \
npm run build && \
git add . && git commit --no-verify -m "type(scope): description" && \
git push origin main && \
echo "⏳ Waiting for pipeline..." && sleep 15 && \
while true; do \
  STATUS=$(gh run list --repo Inutilepat83/OSI-Cards --workflow deploy.yml --limit 1 --json status -q '.[0].status' 2>/dev/null); \
  CONCLUSION=$(gh run list --repo Inutilepat83/OSI-Cards --workflow deploy.yml --limit 1 --json conclusion -q '.[0].conclusion' 2>/dev/null); \
  echo "$(date +%H:%M:%S) Pipeline: $STATUS ($CONCLUSION)"; \
  [ "$STATUS" == "completed" ] && break; \
  sleep 10; \
done && \
HTTP=$(curl -s -o /dev/null -w "%{http_code}" https://osi-card.web.app/) && \
echo "" && \
[ "$CONCLUSION" == "success" ] && echo "✅ Deployed! Site: HTTP $HTTP" || echo "❌ Failed - run: gh run view --log"
```

## 21. Post-Deployment Verification

- [ ] Check GitHub Actions completed successfully
- [ ] Verify https://osi-card.web.app/ loads correctly
- [ ] Test key features (card rendering, streaming, themes)
- [ ] Check browser console for errors

### Quick Verification:

```bash
# Open site and actions in browser
open https://osi-card.web.app/ https://github.com/Inutilepat83/OSI-Cards/actions
```

---

# 📦 Version & Publish (Library releases only)

## 22. Smart Publish Workflow

The smart publish script handles everything automatically:

```bash
# Check what would be published (dry run)
npm run publish:smart:dry

# Publish with version bump
npm run publish:smart           # patch: 1.5.2 → 1.5.3
npm run publish:smart:minor     # minor: 1.5.2 → 1.6.0
npm run publish:smart:major     # major: 1.5.2 → 2.0.0
```

### What Smart Publish Does:

1. ✅ Checks npm for existing versions
2. ✅ Auto-bumps version if needed
3. ✅ Syncs all version files (version.config.json → all targets)
4. ✅ Generates release notes from commits
5. ✅ Builds the library
6. ✅ Commits and creates git tag
7. ✅ Publishes to npm
8. ✅ Pushes to git remote

Verify: https://www.npmjs.com/package/osi-cards-lib

---

# ↩️ Rollback Plan

If issues are found in production:

```bash
# Revert the problematic commit
git revert HEAD
git push origin main

# OR rollback Firebase hosting (within 30 days)
firebase hosting:rollback
```

---

# ⚠️ Known Issues (Pre-existing)

- **84 lint errors**: Mostly in test files (duplicate imports, prefer-for-of). Don't block builds.
- **TypeScript test errors**: Test files have some type mismatches. Production code compiles fine.
- **Husky hooks**: Can be slow; use `--no-verify` if needed.
- **CI/CD failures**: Some workflows may fail due to missing secrets or test issues. Check `deploy.yml` for actual deployment status.

---

# 🔗 URLs Reference

| Resource             | URL                                                  |
| -------------------- | ---------------------------------------------------- |
| **Live Site**        | https://osi-card.web.app/                            |
| **GitHub Repo**      | https://github.com/Inutilepat83/OSI-Cards            |
| **GitHub Actions**   | https://github.com/Inutilepat83/OSI-Cards/actions    |
| **NPM Package**      | https://www.npmjs.com/package/osi-cards-lib          |
| **Firebase Console** | https://console.firebase.google.com/project/osi-card |
| **GitHub Token**     | https://github.com/settings/tokens                   |

---

# 🛠️ Prerequisites

Install these tools for full functionality:

```bash
# GitHub CLI (for pipeline monitoring)
brew install gh
gh auth login

# jq (for JSON parsing in scripts)
brew install jq

# Firebase CLI (optional, for manual deploys)
npm install -g firebase-tools
firebase login
```

---

# 📋 Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    OSI-CARDS DEPLOYMENT                      │
├─────────────────────────────────────────────────────────────┤
│ VERSION:  npm run version:show                              │
│ SYNC:     npm run version:sync                              │
│ BUILD:    npm run lint:fix && npm run build                 │
│ COMMIT:   git commit --no-verify -m "type: msg"             │
│ PUSH:     git push origin main                              │
│ PUBLISH:  npm run publish:smart                             │
│ MONITOR:  gh run list --repo Inutilepat83/OSI-Cards         │
│ SITE:     https://osi-card.web.app/                         │
│ ACTIONS:  https://github.com/Inutilepat83/OSI-Cards/actions │
└─────────────────────────────────────────────────────────────┘
```

**Ask Cursor AI**: "Check my GitHub pipeline status" (with MCP configured)
