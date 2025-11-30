import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './product.page';

const pageContent: string = `# Product Section

Displays product information, features, benefits, and pricing.

## Overview

The **Product Section** (\`type: "product"\`) is used for displays product information, features, benefits, and pricing.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`product\` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Product catalogs
- Feature lists
- Product comparisons
- Pricing tables

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| \`label\` | string | Product attribute label |
| \`value\` | string | Attribute value |
| \`icon\` | string | Icon identifier |
| \`price\` | string | Product price |
| \`status\` | string | Product availability |



## Complete Example

\`\`\`json
{
  "title": "Product Information",
  "type": "product",
  "description": "Product details and specifications",
  "fields": [
    {
      "label": "Product Name",
      "value": "Enterprise Suite Pro"
    },
    {
      "label": "Version",
      "value": "3.5.2"
    },
    {
      "label": "Category",
      "value": "Enterprise Software"
    },
    {
      "label": "License",
      "value": "Annual Subscription"
    },
    {
      "label": "Support Level",
      "value": "Premium 24/7"
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Product",
  "type": "product",
  "fields": [
    {
      "label": "Name",
      "value": "Product"
    }
  ]
}
\`\`\`

## Best Practices

1. Highlight key features
2. Include pricing when relevant
3. Use descriptions for details
4. Add status for availability

## Component Information

- **Selector:** \`app-product-section\`
- **Component Path:** \`./lib/components/sections/product-section/product-section.component\`
- **Style Path:** \`./lib/styles/components/sections/_product.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'ng-doc-page-product',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: ProductPageComponent }
  ],
  standalone: true
})
export class ProductPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default ProductPageComponent;
