import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# Quotation Section

Displays quotes, testimonials, highlighted text, and citations.

## Overview

The **Quotation Section** (\`type: "quotation"\`) is used for displays quotes, testimonials, highlighted text, and citations.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`quotation\` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | \`quote\`, \`testimonial\` |


## Use Cases

- Testimonials
- Customer quotes
- Citations
- Highlighted content
- Expert opinions

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| \`label\` | string | Quote label/category |
| \`value\` | string | Quote text |
| \`quote\` | string | Alternative quote field |
| \`description\` | string | Attribution/source |
| \`author\` | string | Quote author |
| \`role\` | string | Author's role |
| \`company\` | string | Author's company |
| \`date\` | string | Quote date |



## Complete Example

\`\`\`json
{
  "title": "Customer Success Stories",
  "type": "quotation",
  "description": "What industry leaders say about our platform",
  "fields": [
    {
      "label": "Enterprise Transformation",
      "value": "\\"Nexus Analytics has fundamentally transformed how we approach data-driven decision making. Within six months of deployment, we've seen a 47% reduction in time-to-insight and our business users are now self-sufficient in creating their own reports. The ROI has been extraordinary.\\"",
      "description": "Jennifer Martinez, Chief Data Officer at Fortune 500 Retailer",
      "author": "Jennifer Martinez",
      "role": "Chief Data Officer",
      "company": "MegaMart Corp",
      "date": "2024-11-15"
    },
    {
      "label": "Healthcare Innovation",
      "value": "\\"In healthcare, data accuracy and compliance are non-negotiable. Nexus not only meets our stringent HIPAA requirements but has enabled our research teams to discover patterns that were previously invisible. We've accelerated our clinical trial analysis by 10x.\\"",
      "description": "Dr. Michael Chen, VP of Research Analytics at Leading Healthcare System",
      "author": "Dr. Michael Chen",
      "role": "VP of Research Analytics",
      "company": "HealthFirst Systems"
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Testimonial",
  "type": "quotation",
  "fields": [
    {
      "value": "\\"Great product!\\""
    }
  ]
}
\`\`\`

## Best Practices

1. Include source attribution
2. Add author information
3. Use for emphasis
4. Include dates when relevant
5. Show company/role context

## Component Information

- **Selector:** \`lib-quotation-section\`
- **Component Path:** \`./lib/components/sections/quotation-section/quotation-section.component\`
- **Style Path:** \`./lib/components/sections/quotation-section/quotation-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Customer Success Stories',
  type: 'quotation',
  description: 'What industry leaders say about our platform',
  fields: [
    {
      label: 'Enterprise Transformation',
      value:
        'Nexus Analytics has fundamentally transformed how we approach data-driven decision making.',
      description: 'Jennifer Martinez, Chief Data Officer at Fortune 500 Retailer',
      author: 'Jennifer Martinez',
      role: 'Chief Data Officer',
      company: 'MegaMart Corp',
      date: '2024-11-15',
    },
    {
      label: 'Healthcare Innovation',
      value:
        'In healthcare, data accuracy and compliance are non-negotiable. Nexus has enabled our research teams to discover patterns that were previously invisible.',
      description: 'Dr. Michael Chen, VP of Research Analytics',
      author: 'Dr. Michael Chen',
      role: 'VP of Research Analytics',
      company: 'HealthFirst Systems',
    },
  ],
};

/**
 * Quotation Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-quotation-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'quotation'"
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
export class QuotationPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default QuotationPageComponent;
