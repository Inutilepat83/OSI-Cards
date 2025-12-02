import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

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
- Specifications
- Service offerings

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
  "title": "Nexus Analytics Enterprise",
  "type": "product",
  "description": "AI-powered business intelligence platform for data-driven enterprises",
  "fields": [
    {
      "label": "Product Name",
      "value": "Nexus Analytics Enterprise Edition"
    },
    {
      "label": "Version",
      "value": "5.2.1 LTS (Long-term Support)"
    },
    {
      "label": "Release Date",
      "value": "January 15, 2025"
    },
    {
      "label": "License Type",
      "value": "Annual Enterprise Subscription"
    },
    {
      "label": "Starting Price",
      "value": "$2,500/month (billed annually)",
      "price": "$2,500/mo"
    },
    {
      "label": "Included Users",
      "value": "Unlimited users with role-based access"
    },
    {
      "label": "Data Connectors",
      "value": "200+ native connectors (Salesforce, SAP, Oracle, etc.)"
    },
    {
      "label": "Storage Included",
      "value": "5TB cloud storage with auto-scaling"
    },
    {
      "label": "API Calls",
      "value": "10M requests/month included"
    },
    {
      "label": "Support Level",
      "value": "24/7 Premium Support with dedicated CSM"
    },
    {
      "label": "SLA Guarantee",
      "value": "99.99% uptime with financial credits"
    },
    {
      "label": "Certifications",
      "value": "SOC 2 Type II, ISO 27001, GDPR, HIPAA"
    },
    {
      "label": "Deployment Options",
      "value": "Cloud, Hybrid, or On-premise"
    },
    {
      "label": "Training",
      "value": "Included: 40 hours onboarding + certification"
    },
    {
      "label": "Status",
      "value": "Generally Available",
      "status": "available"
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
      "value": "Basic Product"
    }
  ]
}
\`\`\`

## Best Practices

1. Highlight key features
2. Include pricing when relevant
3. Use descriptions for details
4. Add status for availability
5. Show version information

## Component Information

- **Selector:** \`lib-product-section\`
- **Component Path:** \`./lib/components/sections/product-section/product-section.component\`
- **Style Path:** \`./lib/components/sections/product-section/product-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Nexus Analytics Enterprise',
  type: 'product',
  description: 'AI-powered business intelligence platform for data-driven enterprises',
  fields: [
    {
      label: 'Product Name',
      value: 'Nexus Analytics Enterprise Edition',
    },
    {
      label: 'Version',
      value: '5.2.1 LTS (Long-term Support)',
    },
    {
      label: 'Release Date',
      value: 'January 15, 2025',
    },
    {
      label: 'License Type',
      value: 'Annual Enterprise Subscription',
    },
    {
      label: 'Starting Price',
      value: '$2,500/month (billed annually)',
      price: '$2,500/mo',
    },
    {
      label: 'Included Users',
      value: 'Unlimited users with role-based access',
    },
    {
      label: 'Data Connectors',
      value: '200+ native connectors (Salesforce, SAP, Oracle, etc.)',
    },
    {
      label: 'Storage Included',
      value: '5TB cloud storage with auto-scaling',
    },
    {
      label: 'API Calls',
      value: '10M requests/month included',
    },
    {
      label: 'Support Level',
      value: '24/7 Premium Support with dedicated CSM',
    },
    {
      label: 'SLA Guarantee',
      value: '99.99% uptime with financial credits',
    },
    {
      label: 'Certifications',
      value: 'SOC 2 Type II, ISO 27001, GDPR, HIPAA',
    },
    {
      label: 'Deployment Options',
      value: 'Cloud, Hybrid, or On-premise',
    },
    {
      label: 'Training',
      value: 'Included: 40 hours onboarding + certification',
    },
    {
      label: 'Status',
      value: 'Generally Available',
      status: 'available',
    },
  ],
};

/**
 * Product Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'product'"
        demoTitle="Live Preview"
        height="350px"
      ></app-docs-demo>
      <app-doc-page [content]="content"></app-doc-page>
    </div>
  `,
  styles: [
    `
      .section-docs {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default ProductPageComponent;
