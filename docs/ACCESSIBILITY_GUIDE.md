# Accessibility Guide

## Overview

This guide documents accessibility features and best practices implemented in OSI Cards.

## ARIA Labels and Roles

### Section Components

All section components include:
- `role="region"` on section containers
- `aria-labelledby` pointing to section title
- `aria-describedby` pointing to section description (if available)
- Unique IDs for section titles and descriptions

### Interactive Elements

- **Buttons**: Include `role="button"`, `aria-label` with descriptive text
- **Fields**: Include `aria-label`, `aria-describedby`, `aria-posinset`, `aria-setsize`
- **Items**: Include `aria-label` with title and description

### Example

```html
<button
  type="button"
  role="button"
  [attr.aria-label]="field.label + ': ' + field.value"
  [attr.aria-describedby]="field.description ? 'field-desc-' + fieldId : null"
  [attr.aria-posinset]="index + 1"
  [attr.aria-setsize]="fields.length"
>
  <!-- Content -->
</button>
```

## Keyboard Navigation

### Supported Keys

- **Enter**: Activate button/field
- **Space**: Activate button/field (prevented default scroll)
- **Tab**: Navigate between interactive elements
- **Arrow Keys**: Navigate within lists (where applicable)

### Focus Management

- Focus indicators are visible on all interactive elements
- Focus is managed in modals and dialogs
- Skip links are available for main content areas

## Screen Reader Support

### Live Regions

- Status updates use `aria-live="polite"` for non-critical updates
- Error messages use `aria-live="assertive"` for critical errors
- Loading states are announced

### Semantic HTML

- Proper heading hierarchy (h1, h2, h3)
- Lists use `<ul>` and `<ol>` elements
- Tables include proper headers and captions

## Color Contrast

- All text meets WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
- Interactive elements have sufficient contrast
- Focus indicators are clearly visible

## Testing

### Tools

- **axe DevTools**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation
- **Screen Readers**: NVDA, JAWS, VoiceOver testing

### Checklist

- [ ] All images have alt text
- [ ] All interactive elements are keyboard accessible
- [ ] All form inputs have labels
- [ ] Color is not the only means of conveying information
- [ ] Focus indicators are visible
- [ ] ARIA labels are descriptive
- [ ] Page structure is logical (headings, landmarks)

## Implementation

### ImprovedAriaLabelDirective

Use the `ImprovedAriaLabelDirective` for consistent ARIA labeling:

```html
<button
  appImprovedAriaLabel="Save card configuration"
  ariaDescription="Saves the current card JSON to local storage"
  ariaLive="polite"
>
  Save
</button>
```

### Section Components

All section components extend `BaseSectionComponent` which provides:
- Consistent ARIA labeling
- Keyboard navigation support
- Focus management

## Related Files

- `src/app/shared/directives/improved-aria-labels.directive.ts` - ARIA label directive
- `src/app/shared/components/cards/sections/base-section.component.ts` - Base section component
- `src/app/shared/services/keyboard-shortcuts.service.ts` - Keyboard shortcuts

## WCAG 2.1 Compliance

### Level AA Compliance

- ✅ Perceivable: Text alternatives, captions, color contrast
- ✅ Operable: Keyboard accessible, no seizure-inducing content
- ✅ Understandable: Readable, predictable, input assistance
- ✅ Robust: Compatible with assistive technologies

### Ongoing Improvements

- Enhanced ARIA labels in all components
- Better focus management
- Improved keyboard navigation
- Screen reader testing


