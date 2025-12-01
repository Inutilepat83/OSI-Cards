import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Services

Documentation for Services.

## Overview

This section covers services functionality in OSI Cards.

## Usage

See the examples and API reference below for implementation details.

## Related

- [Getting Started](/docs/getting-started)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'app-library-docs-services-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryDocsServicesPageComponent {
  content = pageContent;
}

export default LibraryDocsServicesPageComponent;
