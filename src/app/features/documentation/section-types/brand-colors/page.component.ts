import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './brand-colors.page';

const pageContent: string = `# Brand Colors Section

Displays color swatches, brand palettes, and design system colors.

## Overview

The **Brand Colors Section** is used for displays color swatches, brand palettes, and design system colors.

## Use Cases

- Brand assets
- Design systems
- Color palettes
- Style guides

## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: 'brand-colors';
  fields?: CardField[];
  
}
\`\`\`

## Example

\`\`\`json
{
  "title": "Brand Colors Section Example",
  "type": "brand-colors",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
\`\`\`

## Best Practices

1. Include hex/RGB values
1. Show color names
1. Group by category
1. Enable copy-to-clipboard

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'ng-doc-page-brand-colors',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: BrandColorsPageComponent }
  ],
  standalone: true
})
export class BrandColorsPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default BrandColorsPageComponent;
