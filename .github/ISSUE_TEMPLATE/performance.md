---
name: ⚡ Performance Issue
about: Report a performance problem
title: '[PERF] '
labels: performance, needs-triage
assignees: ''
---

## ⚡ Performance Issue

<!-- Describe the performance problem -->

## 📊 Metrics

**Current Performance:**
- Load Time: [e.g., 5 seconds]
- FPS: [e.g., 30 fps]
- Memory Usage: [e.g., 500 MB]
- Bundle Size: [e.g., 1.5 MB]

**Expected Performance:**
- Load Time: [e.g., < 1 second]
- FPS: [e.g., 60 fps]
- Memory Usage: [e.g., < 200 MB]
- Bundle Size: [e.g., < 500 KB]

## 🔍 Profiling Data

<!-- Attach profiling screenshots or data -->

**Chrome DevTools Performance:**
<!-- Screenshot of performance timeline -->

**Lighthouse Score:**
- Performance: [e.g., 45/100]
- Accessibility: [e.g., 90/100]
- Best Practices: [e.g., 85/100]

## 📝 Steps to Reproduce

1. Load page with [X] cards
2. Scroll to bottom
3. Measure performance

## 🖥️ Environment

- **OS:** [e.g., Windows 11]
- **Browser:** [e.g., Chrome 120]
- **Device:** [e.g., Desktop, Mobile, Tablet]
- **CPU:** [e.g., Intel i7]
- **RAM:** [e.g., 16 GB]
- **OSI Cards Version:** [e.g., 1.5.5]

## 🔧 Configuration

```typescript
// Your configuration
const grid = new MasonryGrid({
  sections: [...], // 100 sections
  columnWidth: 300,
  gap: 16
});
```

## 💡 Potential Causes

<!-- Your analysis of what might be causing the issue -->

- [ ] Too many re-renders
- [ ] Memory leaks
- [ ] Large bundle size
- [ ] Inefficient calculations
- [ ] Missing optimizations

## 🎯 Suggested Solutions

<!-- If you have ideas on how to improve performance -->

## 📊 Priority

- [ ] 🔴 Critical - App unusable
- [ ] 🟠 High - Significant degradation
- [ ] 🟡 Medium - Noticeable slowdown
- [ ] 🟢 Low - Minor optimization

## ✅ Checklist

- [ ] I have profiled the application
- [ ] I have included metrics
- [ ] I have provided profiling data
- [ ] I have described the environment
- [ ] I have suggested potential solutions


