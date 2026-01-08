# Card Synthesizer Agent Prompt Review

## Executive Summary

The prompt is **comprehensive and well-structured** but contains several **critical contradictions**, **inconsistencies**, and **clarity issues** that need to be addressed before use. The prompt demonstrates good understanding of the system but needs refinement for production use.

**Overall Assessment:** ⚠️ **Needs Revision** - Good foundation, but requires fixes before deployment.

---

## 🔴 Critical Issues (Must Fix)

### 1. **Contradiction: Root-Level `description` Field**

**Problem:**
- **Line in "FINAL VALIDATION CHECKLIST":** "□ No 'description' at root level"
- **Line in "OUTPUT STRUCTURE":** Shows `"description": "{{CONTEXT}}"` in example
- **Actual Code:** `AICardConfig` interface allows `description?: string` (optional)

**Impact:** High - Agent will be confused about whether to include description or not.

**Fix:**
- Remove the validation checklist item that forbids description
- Clarify that description is optional at root level
- Update example to show description as optional (or remove it from example)

**Recommended Fix:**
```diff
- □ No "description" at root level
+ □ description at root level is optional (can be included if provided in context)
```

---

### 2. **Contradiction: `cardType` Field**

**Problem:**
- **Line in "FINAL VALIDATION CHECKLIST":** "□ No cardType, componentPath, selector, stylePath, cost, total_tokens keys"
- **Line in "OUTPUT STRUCTURE":** Example doesn't show cardType
- **Actual Code:** `AICardConfig` interface allows `cardType?: CardType` (optional, for demo examples)

**Impact:** Medium - The code allows it for demos, but prompt forbids it.

**Fix:**
- Clarify that cardType is optional and only for demo/example purposes
- Update validation checklist to reflect this nuance

**Recommended Fix:**
```diff
- □ No cardType, componentPath, selector, stylePath, cost, total_tokens keys
+ □ No componentPath, selector, stylePath, cost, total_tokens keys (cardType is optional for demos only)
```

---

### 3. **Currency Format Inconsistency**

**Problem:**
- **Line in "DATA MAPPING RULES":** States currency must be formatted as "45,500k€"
- **Line in "FINAL VALIDATION CHECKLIST":** "□ All currency is formatted '45,500k€' (not $, €, or other patterns)"
- **Example in prompt:** Shows `"value": "$127.4M"` (inconsistent!)
- **Actual Code:** Uses `format: 'currency'` field property, not hardcoded format in value

**Impact:** High - Agent will produce inconsistent currency formats.

**Fix:**
- Clarify that currency values should use the `format: "currency"` property
- Remove hardcoded format requirement from value field
- Update example to show proper format usage
- Clarify that value can be numeric or string, format property handles display

**Recommended Fix:**
```diff
- □ All currency is formatted "45,500k€" (not $, €, or other patterns)
+ □ Currency fields use format: "currency" property (value can be numeric or string)
```

Add to DATA MAPPING RULES:
```
**Currency Formatting:**
  - Use format: "currency" property on fields, not hardcoded symbols in value
  - Value can be numeric (1234.56) or string ("1234.56")
  - Do NOT hardcode currency symbols like $, €, or "k€" in the value field
```

---

### 4. **Duplicate "info" Section Type Definition**

**Problem:**
- **Line in "SECTION TYPE PORTFOLIO":** Lists "info" twice:
  1. "info: Miscellaneous structured data not fitting other types (used for unknown types)"
  2. "info: Key-value metadata, company facts, identifiers"

**Impact:** Medium - Confusing for agent about when to use info section.

**Fix:**
- Merge into single definition
- Clarify that info is a catch-all for structured data that doesn't fit other types

**Recommended Fix:**
```diff
- info: Miscellaneous structured data not fitting other types (used for unknown types)
- info: Key-value metadata, company facts, identifiers
+ info: Key-value metadata, company facts, identifiers, and miscellaneous structured data that doesn't fit other section types (catch-all for unknown/uncategorized data)
```

---

### 5. **HTML Entities Confusion**

**Problem:**
- **Line in "OUTPUT STRUCTURE":** "Do NOT use HTML entities in JSON (write &amp; not &amp;, &lt; not &lt;)"
- This is confusing - it says "write &amp; not &amp;" which is contradictory

**Impact:** Medium - Unclear what the actual requirement is.

**Fix:**
- Clarify that JSON strings should contain actual characters, not HTML entities
- Or clarify that if HTML entities are needed, use proper JSON escaping

**Recommended Fix:**
```diff
- Do NOT use HTML entities in JSON (write &amp; not &amp;, &lt; not &lt;)
+ Do NOT use HTML entities in JSON strings. Use actual characters (& not &amp;, < not &lt;). JSON parser handles escaping automatically.
```

---

## 🟡 Medium Priority Issues

### 6. **Placeholder Handling Ambiguity**

**Problem:**
- **Line in "OUTPUT STRUCTURE":** "If a placeholder is empty/null → still include the action with available data"
- **Line in "FINAL VALIDATION CHECKLIST":** "□ All {{PLACEHOLDER}} values are replaced with actual data"
- These conflict - should placeholders be replaced or left as-is if empty?

**Impact:** Medium - Unclear behavior when placeholders are missing.

**Fix:**
- Clarify that placeholders MUST be replaced with actual values from context
- If a value doesn't exist in context, use empty string or omit the field (depending on whether field is required)

**Recommended Addition:**
```
**Placeholder Replacement:**
  - ALL {{PLACEHOLDER}} values MUST be replaced with actual data from context
  - If placeholder value is not available in context:
    * For required fields (cardTitle, agentId): Use empty string "" or a default
    * For optional fields: Omit the field entirely
  - Never output placeholders as literal strings like "{{CARD_TITLE}}"
```

---

### 7. **Chart Section Structure Confusion**

**Problem:**
- **Line in "SECTION TYPE PORTFOLIO":** Says chart uses "chartData" object
- **Line in "OUTPUT STRUCTURE":** Shows chart with both chartType and chartData
- **Example:** Shows chart correctly, but description says "Single-point chart entry" which is misleading

**Impact:** Low - Example is correct but description is confusing.

**Fix:**
- Update description to clarify charts can have multiple data points
- Ensure example shows multiple data points to demonstrate capability

---

### 8. **Missing Section Types**

**Problem:**
- Prompt lists section types, but actual codebase has additional types:
  - `code` (mentioned in generated types)
  - `comparison` (mentioned in generated types)
  - `kanban` (mentioned in generated types)
  - `pricing` (mentioned in generated types)
  - `rating` (mentioned in generated types)
  - `social` (mentioned in generated types, different from `social-media`)

**Impact:** Medium - Agent won't know about these section types.

**Fix:**
- Add missing section types to portfolio
- Or clarify that only listed types should be used
- Check if these are internal/deprecated types

**Recommended Addition:**
Add to SECTION TYPE PORTFOLIO if these are valid:
```
  - code: Code snippets, examples, technical documentation
  - comparison: Side-by-side comparisons, feature matrices
  - kanban: Kanban boards, task management workflows
  - pricing: Pricing tables, plans, tiers
  - rating: Ratings, reviews, scores
  - social: Social media content (alternative to social-media)
```

---

### 9. **Table Section Structure Unclear**

**Problem:**
- **Line in "SECTION TYPE PORTFOLIO":** Says table "store in meta.tableData if applicable"
- **Example:** Shows table section with fields array, not tableData
- Unclear which structure to use

**Impact:** Medium - Agent may use wrong structure.

**Fix:**
- Clarify table section structure
- Show example with tableData in meta if that's the correct approach
- Or clarify that table uses fields array with tableData in meta

**Recommended Addition:**
```
**Table Section:**
  - Use fields array for table metadata/description
  - Store actual tabular data in meta.tableData if provided
  - If only metadata available, use fields array only
```

---

### 10. **Status Values Inconsistency**

**Problem:**
- **Line in "ANTI-PATTERNS":** Lists invalid statuses but doesn't show all valid ones
- **Actual Code:** Shows many more valid statuses: 'completed', 'in-progress', 'pending', 'cancelled', 'active', 'inactive', 'warning', 'confirmed', 'planned', 'tentative', 'available', 'coming-soon', 'deprecated', 'out-of-stock'

**Impact:** Low - Agent may use invalid status values.

**Fix:**
- List all valid status values explicitly
- Or reference where to find valid statuses

**Recommended Addition:**
```
**Valid Status Values:**
  completed, in-progress, pending, cancelled, active, inactive, warning, 
  confirmed, planned, tentative, available, coming-soon, deprecated, out-of-stock
```

---

## 🟢 Minor Issues / Suggestions

### 11. **Clarity: "Template" vs "Form"**

**Good:** The "WHAT 'TEMPLATE' MEANS" section is excellent and clear.

**Suggestion:** Consider adding a visual example showing:
- ❌ Wrong: One section per data point
- ✅ Right: One section type with multiple entries

---

### 12. **Working Process Could Be More Explicit**

**Suggestion:** Add explicit examples of:
- How to handle 15 contacts → one contact-card section with 15 fields
- How to handle 8 financial metrics → one financials section with 8 fields
- How to handle mixed data types → multiple sections, one per type

---

### 13. **Priority Guidance Could Be Clearer**

**Current:** Priority guidance is good but could be more explicit.

**Suggestion:** Add decision tree:
```
Priority 1: Overview, key contacts (always visible)
Priority 2: Analytics, charts, financials (important metrics)
Priority 3: Supporting content (faq, gallery, reference materials)
```

---

### 14. **preferredColumns Guidance**

**Current:** Guidance exists but could be more specific.

**Suggestion:** Add examples:
- 1 column: FAQs, timelines, long lists (vertical scrolling)
- 2 columns: Contacts, news, events (balanced)
- 3-4 columns: Charts, sparse data, wide content

---

## ✅ Strengths

1. **Excellent "Template" Explanation** - Very clear about sections being templates, not forms
2. **Comprehensive Section Deduplication Rules** - Clear examples of right vs wrong
3. **Exhaustive Reflection Principle** - Good emphasis on including all data
4. **Clear Anti-Patterns Section** - Helps prevent common mistakes
5. **Good Validation Checklist** - Comprehensive (once fixed)
6. **Working Process Steps** - Helpful step-by-step approach

---

## 📋 Recommended Action Plan

### Phase 1: Critical Fixes (Do First)
1. ✅ Fix description field contradiction
2. ✅ Fix cardType field contradiction  
3. ✅ Fix currency format inconsistency
4. ✅ Fix duplicate info section definition
5. ✅ Fix HTML entities confusion

### Phase 2: Medium Priority (Do Next)
6. ✅ Clarify placeholder handling
7. ✅ Add missing section types (or clarify they're not available)
8. ✅ Clarify table section structure
9. ✅ List all valid status values

### Phase 3: Enhancements (Nice to Have)
10. ✅ Add visual examples for template concept
11. ✅ Enhance working process with concrete examples
12. ✅ Add decision tree for priority assignment
13. ✅ Add more specific preferredColumns guidance

---

## 🎯 Final Recommendation

**Status:** ⚠️ **Revise Before Use**

The prompt is **80% there** but needs the critical fixes above before production use. The contradictions and inconsistencies will confuse the AI agent and lead to incorrect outputs.

**Priority Order:**
1. Fix all 🔴 Critical Issues (especially currency format and description/cardType contradictions)
2. Address 🟡 Medium Priority Issues (especially placeholder handling and missing section types)
3. Consider 🟢 Minor Enhancements for better clarity

**Estimated Fix Time:** 2-3 hours for critical fixes, 1-2 hours for medium priority, 1 hour for enhancements.

---

## 📝 Quick Reference: Issues Summary

| Issue | Severity | Location | Fix Complexity |
|-------|----------|----------|----------------|
| Root description contradiction | 🔴 Critical | Validation Checklist | Low |
| cardType contradiction | 🔴 Critical | Validation Checklist | Low |
| Currency format inconsistency | 🔴 Critical | Multiple locations | Medium |
| Duplicate info definition | 🔴 Critical | Section Portfolio | Low |
| HTML entities confusion | 🔴 Critical | Output Structure | Low |
| Placeholder handling | 🟡 Medium | Output Structure | Medium |
| Missing section types | 🟡 Medium | Section Portfolio | Medium |
| Table structure unclear | 🟡 Medium | Section Portfolio | Low |
| Status values incomplete | 🟡 Medium | Anti-Patterns | Low |

---

**Review Completed:** 2025-01-XX
**Reviewer:** AI Code Review Assistant
**Next Steps:** Implement fixes in order of priority
