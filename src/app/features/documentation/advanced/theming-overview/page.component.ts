import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Theming Overview

Customize the look and feel of OSI Cards.

## Theme System

OSI Cards uses CSS Custom Properties for theming.

## Applying a Theme

\`\`\`typescript
import { ThemeService } from 'osi-cards-lib';

const themeService = inject(ThemeService);
themeService.setTheme('dark');
\`\`\`

## Available Themes

| Theme | Description |
|-------|-------------|
| default | Light theme |
| dark | Dark mode |
| orange | Orange brand |
| minimal | Clean, minimal |
| high-contrast | Accessibility |

## Custom Theme

\`\`\`typescript
themeService.setCustomProperties({
  '--osi-card-bg': '#1a1a1a',
  '--osi-card-text': '#ffffff',
  '--osi-primary': '#FF7900'
});
\`\`\`
`;

@Component({
  selector: 'app-theming-overview-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemingOverviewPageComponent {
  content = pageContent;
}

export default ThemingOverviewPageComponent;
