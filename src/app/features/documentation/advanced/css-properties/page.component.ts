import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# CSS Custom Properties

All available CSS custom properties.

## Card Properties

| Property | Default | Description |
|----------|---------|-------------|
| \`--osi-card-bg\` | #ffffff | Background |
| \`--osi-card-border\` | #e0e0e0 | Border color |
| \`--osi-card-shadow\` | ... | Box shadow |
| \`--osi-card-radius\` | 8px | Border radius |
| \`--osi-card-padding\` | 16px | Padding |

## Color Properties

| Property | Default | Description |
|----------|---------|-------------|
| \`--osi-primary\` | #FF7900 | Primary color |
| \`--osi-text\` | #333333 | Text color |
| \`--osi-text-muted\` | #666666 | Muted text |
| \`--osi-success\` | #4CAF50 | Success |
| \`--osi-warning\` | #FF9800 | Warning |
| \`--osi-error\` | #F44336 | Error |

## Typography

| Property | Default |
|----------|---------|
| \`--osi-font-family\` | system-ui |
| \`--osi-font-size-sm\` | 12px |
| \`--osi-font-size-base\` | 14px |
| \`--osi-font-size-lg\` | 16px |

## Usage

\`\`\`css
:root {
  --osi-primary: #003366;
  --osi-card-radius: 12px;
}
\`\`\`
`;

@Component({
  selector: 'app-css-properties-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CssPropertiesPageComponent {
  content = pageContent;
}

export default CssPropertiesPageComponent;
