import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Theming

Documentation for Theming.

## Overview

This section covers theming functionality in OSI Cards.

## Usage

See the examples and API reference below for implementation details.

## Related

- [Getting Started](/docs/getting-started)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'app-library-docs-theming-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryDocsThemingPageComponent {
  content = pageContent;
}

export default LibraryDocsThemingPageComponent;
