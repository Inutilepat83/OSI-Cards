import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Accessibility (WCAG)

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

\`\`\`html
<article role="article" aria-labelledby="card-title">
  <h2 id="card-title">Card Title</h2>
  <section aria-label="Company Info">...</section>
</article>
\`\`\`

## High Contrast Mode

Use high-contrast theme:

\`\`\`typescript
themeService.setTheme('high-contrast');
\`\`\`

## Testing

\`\`\`bash
npm run test:a11y
npm run wcag:audit
\`\`\`
`;

@Component({
  selector: 'app-accessibility-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessibilityPageComponent {
  content = pageContent;
}

export default AccessibilityPageComponent;
