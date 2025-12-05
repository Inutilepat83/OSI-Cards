## 🎉 OSI Cards v{{version}}

**Release Date:** {{date}}
**Type:** {{type}}

---

## 📋 What's New

### ✨ Features
{{#each features}}
- {{this}}
{{/each}}

### 🐛 Bug Fixes
{{#each fixes}}
- {{this}}
{{/each}}

### ⚡ Performance
{{#each performance}}
- {{this}}
{{/each}}

### 📝 Documentation
{{#each docs}}
- {{this}}
{{/each}}

---

## 🚀 Upgrade Guide

### Installation

```bash
npm install osi-cards-lib@{{version}}
```

### Breaking Changes

{{#if breaking}}
{{#each breaking}}
- ⚠️ **{{this.title}}**: {{this.description}}
  - **Migration:** {{this.migration}}
{{/each}}
{{else}}
✅ No breaking changes in this release!
{{/if}}

---

## 📊 Metrics

- **Bundle Size:** {{bundleSize}}
- **Performance Score:** {{performanceScore}}/100
- **Test Coverage:** {{testCoverage}}%
- **Build Time:** {{buildTime}}

---

## 🙏 Contributors

Thanks to all contributors who made this release possible!

{{#each contributors}}
- @{{this}}
{{/each}}

---

## 📚 Documentation

- [Full Changelog](https://github.com/your-org/osi-cards/blob/main/CHANGELOG.md)
- [Documentation](https://docs.osi-cards.com)
- [Migration Guide](https://docs.osi-cards.com/migration)
- [API Reference](https://docs.osi-cards.com/api)

---

## 🐛 Found a Bug?

[Report it here](https://github.com/your-org/osi-cards/issues/new?template=bug_report.md)

---

**Full Changelog**: https://github.com/your-org/osi-cards/compare/v{{previousVersion}}...v{{version}}


