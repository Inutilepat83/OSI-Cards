import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './quotation.page';

const pageContent: string = `# Quotation Section

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
| Aliases | \`quote\` |


## Use Cases

- Testimonials
- Quotes
- Citations
- Highlighted content

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| \`label\` | string | Quote label/category |
| \`value\` | string | Quote text |
| \`quote\` | string | Alternative quote field |
| \`description\` | string | Attribution/source |
| \`author\` | string | Quote author |
| \`date\` | string | Quote date |



## Complete Example

\`\`\`json
{
  "title": "Customer Testimonials",
  "type": "quotation",
  "description": "What our customers say",
  "fields": [
    {
      "label": "CEO Testimonial",
      "value": "\\"This solution transformed our business operations and increased productivity by 40%.\\"",
      "description": "John Smith, CEO at TechCorp Inc."
    },
    {
      "label": "CTO Review",
      "value": "\\"The technical implementation was seamless and the support team was exceptional.\\"",
      "description": "Sarah Johnson, CTO at DataFlow Systems"
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Quote",
  "type": "quotation",
  "fields": [
    {
      "value": "\\"Quote text\\""
    }
  ]
}
\`\`\`

## Best Practices

1. Include source attribution
2. Add author information
3. Use for emphasis
4. Include dates when relevant

## Component Information

- **Selector:** \`app-quotation-section\`
- **Component Path:** \`./lib/components/sections/quotation-section/quotation-section.component\`
- **Style Path:** \`./lib/styles/components/sections/_quotation.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'ng-doc-page-quotation',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: QuotationPageComponent }
  ],
  standalone: true
})
export class QuotationPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default QuotationPageComponent;
