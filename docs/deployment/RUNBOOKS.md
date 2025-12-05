# 📖 Operations Runbooks

**Version:** 1.5.5
**Last Updated:** December 4, 2025
**Purpose:** Standard operating procedures for common tasks

---

## 🚀 Deployment Runbook

### Standard Deployment

**Frequency:** Bi-weekly
**Time:** Friday afternoon
**Duration:** 30 minutes

**Steps:**

1. **Pre-Deployment Checks**
```bash
# Ensure all tests pass
npm run test:all

# Check for security vulnerabilities
npm audit

# Verify build
npm run build:prod
```

2. **Create Release**
```bash
# Bump version
npm run version:minor  # or version:patch

# Update CHANGELOG
# Add release notes

# Commit changes
git add .
git commit -m "chore: release v1.5.6"

# Create tag
git tag v1.5.6
git push origin main --tags
```

3. **Monitor Deployment**
```bash
# GitHub Actions will auto-deploy
# Monitor at: https://github.com/your-repo/actions

# Check staging first
open https://staging.osi-cards.web.app

# If staging OK, check production
open https://osi-cards.web.app
```

4. **Post-Deployment**
```bash
# Check health
curl https://osi-cards.web.app/health

# Monitor errors for 1 hour
# Check error tracking dashboard
# Review performance metrics
```

---

## 🔙 Rollback Runbook

### Emergency Rollback

**When:** Error rate >5%, critical bug discovered
**Time:** < 15 minutes
**Action:** Revert to previous version

**Steps:**

1. **Identify Issue**
```bash
# Check error tracking
# Review health check
# Confirm rollback needed
```

2. **Execute Rollback**
```bash
# Option A: Revert commit
git revert HEAD
git push origin main

# Option B: Deploy previous tag
git checkout v1.5.5
npm run build:prod
firebase deploy --only hosting

# Option C: Firebase rollback
firebase hosting:clone osi-cards:v1-5-5 osi-cards:live
```

3. **Verify Rollback**
```bash
# Check application
open https://osi-cards.web.app

# Verify health
curl https://osi-cards.web.app/health

# Monitor error rate
```

4. **Post-Rollback**
```bash
# Notify team
# Create incident report
# Plan fix
# Schedule re-deployment
```

---

## 🔧 Troubleshooting Runbook

### Application Not Loading

**Steps:**

1. **Check Health Endpoint**
```bash
curl https://osi-cards.web.app/health
```

2. **Check Browser Console**
- Open DevTools (F12)
- Check Console for errors
- Check Network tab for failed requests

3. **Verify Firebase Hosting**
```bash
firebase hosting:sites:list
firebase hosting:channel:list osi-cards
```

4. **Check Recent Deployments**
```bash
# View deployment history
firebase hosting:releases:list --limit 10
```

---

### High Error Rate

**Steps:**

1. **Check Error Tracking**
- Review error tracking service
- Identify most common errors
- Check error rate trend

2. **Analyze Errors**
```typescript
// In error tracking service
const errors = errorTracking.getErrors();
const byType = errors.reduce((acc, e) => {
  acc[e.message] = (acc[e.message] || 0) + 1;
  return acc;
}, {});
console.log('Errors by type:', byType);
```

3. **Prioritize**
- Critical (affects all users): Fix immediately
- High (affects many users): Fix within 24 hours
- Medium (affects some users): Fix in next release
- Low (edge case): Add to backlog

4. **Deploy Fix**
```bash
# Follow standard deployment process
# Or emergency deployment if critical
```

---

### Slow Performance

**Steps:**

1. **Check Performance Metrics**
```bash
# Run Lighthouse
lighthouse https://osi-cards.web.app --output html

# Check Core Web Vitals
# Review bundle size
npm run bundle:analyze
```

2. **Identify Bottleneck**
- Check Network tab (slow API calls?)
- Check Performance tab (slow rendering?)
- Check Memory tab (memory leak?)

3. **Common Fixes**
```typescript
// Enable memoization
@Memoize()
expensiveFunction() { }

// Enable virtual scrolling
[enableVirtualScroll]="true"

// Optimize change detection
changeDetection: ChangeDetectionStrategy.OnPush
```

---

## 📊 Monitoring Runbook

### Check Application Health

**Daily Check (2 minutes):**

```bash
# 1. Health endpoint
curl https://osi-cards.web.app/health

# 2. Error rate
# Check error tracking dashboard

# 3. Performance
# Check monitoring dashboard
```

---

### Weekly Review (30 minutes)

```bash
# 1. Error trends
# Review error tracking for patterns

# 2. Performance trends
# Check bundle size history
# Review Core Web Vitals

# 3. User metrics
# Check analytics dashboard

# 4. Security
npm audit
# Review security alerts
```

---

## 🔐 Security Incident Runbook

### Security Vulnerability Discovered

**Response Time: < 24 hours**

**Steps:**

1. **Assess Severity** (< 1 hour)
```bash
# Check CVE score
# Identify affected versions
# Determine impact
```

2. **Apply Patch** (< 4 hours)
```bash
# Update affected package
npm update <package>

# Or apply manual patch
# Test thoroughly
npm run test:all
```

3. **Deploy Emergency Release** (< 2 hours)
```bash
# Bump patch version
npm run version:patch

# Deploy immediately
git push origin main --tags
# GitHub Actions will auto-deploy
```

4. **Notify Users** (immediately)
```markdown
# Security advisory template
Subject: Security Update - OSI Cards v1.5.6

A security vulnerability was discovered in v1.5.5.
We've released v1.5.6 with a fix.

Severity: [Low/Medium/High/Critical]
Impact: [Description]
Action Required: Update to v1.5.6 immediately

npm install osi-cards-lib@latest
```

---

## 🎯 Performance Optimization Runbook

### Bundle Size Exceeded

**Threshold:** > 250KB gzipped

**Steps:**

1. **Analyze Bundle**
```bash
npm run bundle:analyze
# Opens webpack-bundle-analyzer
```

2. **Identify Large Modules**
- Look for unexpectedly large dependencies
- Check for duplicate modules
- Find unused code

3. **Optimize**
```bash
# Remove unused dependencies
npm uninstall <unused-package>

# Lazy load features
# Convert to dynamic imports

# Enable tree-shaking
# Review imports
```

---

## 📝 Change Detection Runbook

### Too Many Change Detection Cycles

**Symptom:** Performance degradation

**Steps:**

1. **Enable Debug Mode**
```typescript
// In component
constructor() {
  if (isDevMode()) {
    enableDebugTools(this.ref);
  }
}
```

2. **Audit Components**
```bash
# Check for components without OnPush
npm run audit:onpush
```

3. **Fix Issues**
```typescript
// Add OnPush to all components
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// Use signals or observables
readonly data = signal<Data>(initialData);

// Or manually trigger
constructor(private cdr: ChangeDetectorRef) {}
this.cdr.markForCheck();
```

---

## 🎓 Training Runbook

### Onboarding New Developer

**Time:** 4 hours

**Day 1: Setup (2 hours)**
1. Clone repository
2. Install dependencies
3. Run application locally
4. Review Quick Start Guide

**Day 2: Architecture (2 hours)**
1. Read Architecture Overview
2. Review component structure
3. Understand services layer
4. Explore utilities

**Week 1: First Contribution**
1. Pick good first issue
2. Create branch
3. Make changes
4. Submit PR

---

## 🎉 Release Runbook

### Major Release

**Frequency:** Quarterly
**Time:** 2-4 weeks
**Effort:** 80-120 hours

**Phase 1: Planning (1 week)**
- [ ] Define scope
- [ ] Review breaking changes
- [ ] Plan migration guide
- [ ] Set timeline

**Phase 2: Development (2-3 weeks)**
- [ ] Implement features
- [ ] Write tests
- [ ] Update documentation
- [ ] Create beta release

**Phase 3: Release (1 week)**
- [ ] Final testing
- [ ] Migration guide
- [ ] Release notes
- [ ] Deploy & monitor

---

## 📞 Contact Information

### Emergency Contacts
- **On-Call:** +1-XXX-XXX-XXXX
- **Email:** ops@osi-cards.com
- **Slack:** #osi-cards-ops

### Escalation
1. Developer (detect issue)
2. Team Lead (< 15 min)
3. Engineering Manager (< 30 min)
4. CTO (< 1 hour if critical)

---

**Last Updated:** December 4, 2025
**Next Review:** January 2026
**Status:** Active





