import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# IconService

Icon loading and rendering management.

## Overview

\`IconService\` handles icon resolution, loading, and rendering using Lucide icons.

## Import

\`\`\`typescript
import { IconService } from 'osi-cards-lib';
\`\`\`

## Methods

### getIcon(name)

Get icon by name.

\`\`\`typescript
const icon = iconService.getIcon('user');
const icon = iconService.getIcon('building');
\`\`\`

### isEmoji(value)

Check if value is an emoji.

\`\`\`typescript
iconService.isEmoji('🏢'); // true
iconService.isEmoji('building'); // false
\`\`\`

### resolveIcon(input)

Resolve icon from various input formats.

\`\`\`typescript
// Returns appropriate icon data for:
iconService.resolveIcon('user');      // Lucide icon
iconService.resolveIcon('📧');        // Emoji
iconService.resolveIcon('fa-user');   // Font Awesome
iconService.resolveIcon('https://...'); // URL
\`\`\`

## Supported Icon Sets

- **Lucide Icons**: Default icon set
- **Emojis**: Native emoji support
- **Custom URLs**: Image URLs
`;

@Component({
  selector: 'app-icon-service-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconServicePageComponent {
  content = pageContent;
}

export default IconServicePageComponent;
