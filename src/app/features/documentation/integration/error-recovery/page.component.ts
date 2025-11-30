import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Error Recovery Patterns

Documentation for Error Recovery Patterns.

## Overview

This section covers error recovery patterns.

## Details

Content coming soon.

## Related

- [Getting Started](/docs/getting-started)
- [API Reference](/docs/api-reference)
`;

@Component({
  selector: 'app-error-recovery-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorRecoveryPageComponent {
  content = pageContent;
}

export default ErrorRecoveryPageComponent;
