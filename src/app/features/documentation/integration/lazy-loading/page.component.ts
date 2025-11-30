import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Lazy Loading Setup

Documentation for Lazy Loading Setup.

## Overview

This section covers lazy loading setup.

## Details

Content coming soon.

## Related

- [Getting Started](/docs/getting-started)
- [API Reference](/docs/api-reference)
`;

@Component({
  selector: 'app-lazy-loading-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LazyLoadingPageComponent {
  content = pageContent;
}

export default LazyLoadingPageComponent;
