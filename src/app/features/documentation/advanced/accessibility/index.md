# Accessibility (WCAG)

Making OSI Cards accessible to all users.

## Built-in Features

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation
- Focus management
- Color contrast compliance

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between cards |
| Enter | Activate card/button |
| Escape | Close expanded card |
| Arrow keys | Navigate within card |

## Screen Reader Support

Cards use appropriate roles and labels:

```html
<article role="article" aria-labelledby="card-title">
  <h2 id="card-title">Card Title</h2>
  <section aria-label="Company Info">...</section>
</article>
```

## High Contrast Mode

Use high-contrast theme:

```typescript
themeService.setTheme('high-contrast');
```

## Testing

```bash
npm run test:a11y
npm run wcag:audit
```
