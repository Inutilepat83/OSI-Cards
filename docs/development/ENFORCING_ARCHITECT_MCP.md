# 🔒 Enforcing Architect MCP Usage

**Purpose:** Ensure Architect MCP is always called for code generation and validation

---

## 🎯 Overview

This document describes how to ensure the Architect MCP system is always used when generating or modifying code. Multiple enforcement mechanisms are in place to guarantee pattern compliance.

---

## ✅ Enforcement Mechanisms

### 1. Cursor Workspace Rules

**Location:** `.cursor/rules/development/architect-mcp-enforcement.mdc`

**Purpose:** Instructs AI to always use MCP tools

**Content:**
- Mandatory workflow for code generation
- Pattern query requirements
- Validation requirements
- Violation handling procedures

**Status:** ✅ Active

---

### 2. Cursor Rules File

**Location:** `.cursorrules`

**Purpose:** High-priority rules that Cursor reads automatically

**Content:**
- Critical reminders to use MCP
- Mandatory workflow steps
- Pattern compliance checklist

**Status:** ✅ Active

---

### 3. Pre-Commit Hook

**Location:** `.git/hooks/pre-commit`

**Purpose:** Validates patterns before code is committed

**How it works:**
1. Runs on `git commit`
2. Validates all staged TypeScript files
3. Blocks commit if violations found
4. Can be bypassed with `--no-verify` (not recommended)

**Usage:**
```bash
git commit -m "Add new service"
# Pre-commit hook runs automatically
# Validates against architect.yaml patterns
```

**Status:** ✅ Active (if git hooks are enabled)

---

### 4. Validation Script

**Location:** `scripts/validate-architect-patterns.js`

**Purpose:** Standalone script for pattern validation

**Usage:**
```bash
# Validate specific file
node scripts/validate-architect-patterns.js

# Or integrate into CI/CD
npm run validate:patterns
```

**Features:**
- Checks MCP server availability
- Validates files against patterns
- Returns exit codes for CI/CD integration

**Status:** ✅ Available

---

### 5. CI/CD Integration

**Location:** `.github/workflows/` (if using GitHub Actions)

**Purpose:** Automated validation in CI/CD pipeline

**Example:**
```yaml
- name: Validate Architectural Patterns
  run: node scripts/validate-architect-patterns.js
```

**Status:** ⚠️ Needs setup (optional)

---

## 🔧 Setup Instructions

### Enable Pre-Commit Hook

```bash
# Make hook executable
chmod +x .git/hooks/pre-commit

# Test the hook
git commit --dry-run
```

### Add to package.json

```json
{
  "scripts": {
    "validate:patterns": "node scripts/validate-architect-patterns.js",
    "precommit": "node scripts/validate-architect-patterns.js"
  }
}
```

### Configure Husky (Optional)

If using Husky for git hooks:

```bash
npm install --save-dev husky

# Add hook
npx husky add .husky/pre-commit "node scripts/validate-architect-patterns.js"
```

---

## 📋 Mandatory Workflow

### For AI Code Generation

**Step 1: Query Patterns**
```
What architectural patterns apply to [target file path]?
```

**Step 2: Generate Code**
- Follow patterns returned in Step 1
- Apply all applicable patterns
- Use pattern-specific guidelines

**Step 3: Validate Code**
```
Review [target file path] for pattern compliance
```

**Step 4: Fix Violations**
- HIGH severity: Fix immediately
- MEDIUM severity: Document or fix
- LOW severity: Already compliant

---

## 🚨 Violation Handling

### HIGH Severity
- **Action:** Block commit/merge
- **Example:** Direct database access in service
- **Fix Required:** Yes, before proceeding

### MEDIUM Severity
- **Action:** Flag for review
- **Example:** Minor pattern deviation
- **Fix Required:** Document or refactor

### LOW Severity
- **Action:** Auto-approve
- **Example:** Pattern correctly followed
- **Fix Required:** No

---

## 🔍 Verification

### Check MCP Connection

```bash
# Test MCP server
npx @agiflowai/architect-mcp --version

# Should output version number
```

### Test Pattern Query

In Cursor, ask:
```
What patterns apply to projects/osi-cards-lib/src/lib/services/card-facade.service.ts?
```

Should return:
- Facade Pattern
- Service Layer Pattern
- Singleton Pattern
- Dependency Injection Pattern
- Observer Pattern (RxJS)
- Error Handling Pattern
- Performance Pattern

### Test Code Review

In Cursor, ask:
```
Review projects/osi-cards-lib/src/lib/services/card-facade.service.ts for pattern compliance
```

Should return:
- Severity rating
- Compliance percentage
- Specific violations (if any)
- Recommendations

---

## 🛠️ Troubleshooting

### MCP Not Responding

**Symptoms:**
- Pattern queries return empty
- "No design patterns configured" message

**Solutions:**
1. Restart Cursor completely
2. Check MCP config in `~/.cursor/mcp.json`
3. Verify project path is correct
4. Check console for MCP errors

### Pre-Commit Hook Not Running

**Symptoms:**
- Hook doesn't execute on commit
- No validation messages

**Solutions:**
1. Check hook is executable: `chmod +x .git/hooks/pre-commit`
2. Verify git hooks are enabled
3. Test manually: `bash .git/hooks/pre-commit`

### Patterns Not Detected

**Symptoms:**
- Patterns exist but aren't matched
- File paths don't match patterns

**Solutions:**
1. Check `architect.yaml` path patterns
2. Verify file path matches pattern
3. Check `project.json` template reference
4. Review pattern includes/excludes

---

## 📊 Enforcement Statistics

Track enforcement effectiveness:

- **Pattern Queries:** Count of `get_file_design_pattern` calls
- **Code Reviews:** Count of `review_code_change` calls
- **Violations Found:** Count of HIGH/MEDIUM violations
- **Compliance Rate:** Percentage of compliant code

---

## 🎯 Best Practices

1. **Always Query First**
   - Never generate code without checking patterns
   - Patterns provide context-specific guidance

2. **Validate After Generation**
   - Always review generated code
   - Fix violations before committing

3. **Document Exceptions**
   - If you must break a pattern, document why
   - Add comments explaining the exception

4. **Regular Reviews**
   - Periodically review pattern compliance
   - Update patterns as architecture evolves

5. **Team Awareness**
   - Ensure all team members know about MCP
   - Share pattern compliance reports

---

## 📚 Related Documentation

- `ARCHITECT_MCP_SETUP.md` - Complete setup guide
- `templates/your-template/architect.yaml` - Pattern definitions
- `templates/your-template/PATTERNS_SUMMARY.md` - Pattern reference
- `.cursor/rules/development/architect-mcp-enforcement.mdc` - Enforcement rules

---

## ✅ Checklist

Before considering enforcement complete:

- [ ] Cursor workspace rules configured
- [ ] `.cursorrules` file created
- [ ] Pre-commit hook installed
- [ ] Validation script available
- [ ] MCP server connection verified
- [ ] Pattern queries working
- [ ] Code reviews working
- [ ] Team trained on workflow

---

**Last Updated:** December 6, 2025
**Status:** ✅ Active Enforcement













