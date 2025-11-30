import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Theme Presets

Advanced topic: Theme Presets

## Overview

This section covers theme presets.

## Details

Detailed documentation coming soon.

## Related

- [Getting Started](/docs/getting-started)
- [API Reference](/docs/api-reference)
`;

@Component({
  selector: 'app-theme-presets-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemePresetsPageComponent {
  content = pageContent;
}

export default ThemePresetsPageComponent;
