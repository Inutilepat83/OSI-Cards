import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Product Section

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
  selector: 'app-product-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductPageComponent {
  content = pageContent;
}

export default ProductPageComponent;
