import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Standalone Components

Documentation for Standalone Components.

## Overview

This section covers standalone components.

## Details

Content coming soon.

## Related

- [Getting Started](/docs/getting-started)
- [API Reference](/docs/api-reference)
`;

@Component({
  selector: 'app-standalone-components-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandaloneComponentsPageComponent {
  content = pageContent;
}

export default StandaloneComponentsPageComponent;
