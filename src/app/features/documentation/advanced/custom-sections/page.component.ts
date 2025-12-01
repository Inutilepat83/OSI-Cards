import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Custom Section Plugins

Advanced topic: Custom Section Plugins

## Overview

This section covers custom section plugins.

## Details

Detailed documentation coming soon.

## Related

- [Getting Started](/docs/getting-started)
- [API Reference](/docs/api-reference)
`;

@Component({
  selector: 'app-custom-sections-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomSectionsPageComponent {
  content = pageContent;
}

export default CustomSectionsPageComponent;
