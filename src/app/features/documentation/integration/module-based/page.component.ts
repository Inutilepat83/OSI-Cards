import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Module-based Integration

Documentation for Module-based Integration.

## Overview

This section covers module-based integration.

## Details

Content coming soon.

## Related

- [Getting Started](/docs/getting-started)
- [API Reference](/docs/api-reference)
`;

@Component({
  selector: 'app-module-based-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleBasedPageComponent {
  content = pageContent;
}

export default ModuleBasedPageComponent;
