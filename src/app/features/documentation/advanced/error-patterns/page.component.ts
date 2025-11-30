import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Error Handling Patterns

Advanced topic: Error Handling Patterns

## Overview

This section covers error handling patterns.

## Details

Detailed documentation coming soon.

## Related

- [Getting Started](/docs/getting-started)
- [API Reference](/docs/api-reference)
`;

@Component({
  selector: 'app-error-patterns-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorPatternsPageComponent {
  content = pageContent;
}

export default ErrorPatternsPageComponent;
