import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Agentic Flow

Documentation for Agentic Flow.

## Overview

This section covers agentic flow functionality in OSI Cards.

## Usage

See the examples and API reference below for implementation details.

## Related

- [Getting Started](/docs/getting-started)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'app-library-docs-agentic-flow-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryDocsAgenticFlowPageComponent {
  content = pageContent;
}

export default LibraryDocsAgenticFlowPageComponent;
