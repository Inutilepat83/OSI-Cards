import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocPageComponent } from './doc-page.component';

/**
 * Fallback page component for routes without specific page component
 */
@Component({
  selector: 'app-ng-doc-page',
  standalone: true,
  imports: [CommonModule, DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgDocPageComponent {
  content = `# Documentation

This page is under construction.

## Overview

Please select a topic from the sidebar to view documentation.

## Quick Links

- [Getting Started](/docs/getting-started)
- [Installation](/docs/installation)
- [Section Types](/docs/section-types/info)
`;
}
