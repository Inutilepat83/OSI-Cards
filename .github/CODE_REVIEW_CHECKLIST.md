# Code Review Checklist

## 🎯 Purpose

This checklist ensures consistent, thorough code reviews for all pull requests.

---

## ✅ General

- [ ] **PR Description** - Clear, complete description of changes
- [ ] **Issue Linked** - Related issues linked
- [ ] **Size** - PR is reasonably sized (< 400 lines preferred)
- [ ] **Branch** - Created from correct base branch
- [ ] **Commits** - Commits are logical and well-named

---

## 💻 Code Quality

### Style & Standards
- [ ] Follows project coding standards
- [ ] Consistent naming conventions
- [ ] No commented-out code
- [ ] No console.log statements
- [ ] Proper indentation

### TypeScript
- [ ] No `any` types (unless absolutely necessary)
- [ ] Proper type annotations
- [ ] No TypeScript errors
- [ ] Interfaces/types properly defined

### Architecture
- [ ] Follows established patterns
- [ ] Proper separation of concerns
- [ ] No circular dependencies
- [ ] Services properly injected
- [ ] Components use OnPush (when possible)

### Performance
- [ ] No unnecessary re-renders
- [ ] Expensive operations memoized
- [ ] No memory leaks (subscriptions cleaned)
- [ ] Async operations handled properly
- [ ] Bundle size impact acceptable

---

## 🧪 Testing

- [ ] **Unit Tests** - Added for new code
- [ ] **Test Coverage** - Maintained or improved
- [ ] **E2E Tests** - Updated if needed
- [ ] **Tests Pass** - All tests passing
- [ ] **Edge Cases** - Edge cases tested

---

## 📝 Documentation

- [ ] **JSDoc** - Public APIs documented
- [ ] **README** - Updated if needed
- [ ] **CHANGELOG** - Entry added
- [ ] **Migration Guide** - Created if breaking changes
- [ ] **Code Comments** - Complex logic explained

---

## 🎨 UI/UX (if applicable)

- [ ] **Design** - Matches design system
- [ ] **Responsive** - Works on all screen sizes
- [ ] **Animations** - Smooth (60fps)
- [ ] **Loading States** - Proper feedback
- [ ] **Error States** - User-friendly messages

---

## ♿ Accessibility

- [ ] **Keyboard Nav** - Full keyboard navigation
- [ ] **Screen Reader** - Proper ARIA labels
- [ ] **Color Contrast** - WCAG AA compliant
- [ ] **Focus Indicators** - Visible focus states
- [ ] **Alt Text** - Images have alt attributes

---

## 🔐 Security

- [ ] **Input Validation** - All inputs validated
- [ ] **XSS Prevention** - Inputs sanitized
- [ ] **Sensitive Data** - No secrets in code
- [ ] **Dependencies** - No known vulnerabilities
- [ ] **Authentication** - Proper auth checks (if applicable)

---

## 🚀 Deployment

- [ ] **Build** - Production build succeeds
- [ ] **Bundle Size** - Within budget
- [ ] **Breaking Changes** - Documented and justified
- [ ] **Migration** - Migration path clear
- [ ] **Rollback** - Rollback plan exists

---

## 💬 Communication

- [ ] **Clear Description** - Changes well explained
- [ ] **Questions Answered** - All review questions addressed
- [ ] **Discussions Resolved** - All discussions concluded
- [ ] **Approvals** - Required approvals obtained

---

## 🎯 Approval Criteria

**Must Have (Required):**
- ✅ All tests passing
- ✅ No TypeScript errors
- ✅ Linter passing
- ✅ Build successful
- ✅ Code reviewed by 1+ team member

**Should Have (Recommended):**
- ✅ Test coverage maintained
- ✅ Documentation updated
- ✅ No performance regression
- ✅ Accessibility maintained

**Nice to Have:**
- ✅ Performance improvement
- ✅ Test coverage increased
- ✅ Documentation improved

---

## 📊 Review Ratings

Rate the PR on:

**Code Quality:** ⭐⭐⭐⭐⭐
**Test Coverage:** ⭐⭐⭐⭐⭐
**Documentation:** ⭐⭐⭐⭐⭐
**Impact:** High / Medium / Low

---

## 🏆 Exceptional PRs

PRs that go above and beyond:
- ✨ Exceptional code quality
- ✨ Comprehensive testing
- ✨ Excellent documentation
- ✨ Significant performance improvement
- ✨ Major bug fix

---

**Last Updated:** December 4, 2025

