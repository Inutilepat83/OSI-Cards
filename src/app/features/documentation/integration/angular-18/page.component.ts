import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Angular 18 Integration

Documentation for Angular 18 Integration.

## Overview

This section covers angular 18 integration.

## Details

Content coming soon.

## Related

- [Getting Started](/docs/getting-started)
- [API Reference](/docs/api-reference)
`;

@Component({
  selector: 'app-angular-18-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Angular18PageComponent {
  content = pageContent;
}

export default Angular18PageComponent;
