import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Events

Documentation for Events.

## Overview

This section covers events functionality in OSI Cards.

## Usage

See the examples and API reference below for implementation details.

## Related

- [Getting Started](/docs/getting-started)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'app-library-docs-events-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryDocsEventsPageComponent {
  content = pageContent;
}

export default LibraryDocsEventsPageComponent;
