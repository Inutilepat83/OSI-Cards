import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# FAQ Section

Displays frequently asked questions with expandable answers.

## Overview

The **FAQ Section** (\`type: "faq"\`) is used for displays frequently asked questions with expandable answers.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`faq\` |
| Uses Fields | No |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | \`questions\`, \`help\` |


## Use Cases

- Help content
- Support documentation
- Product FAQs
- Onboarding guides
- Knowledge base

## Data Schema



### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| \`title\` | string | Question text |
| \`description\` | string | Answer text |
| \`meta\` | object | - |

## Complete Example

\`\`\`json
{
  "title": "Frequently Asked Questions",
  "type": "faq",
  "description": "Common questions about Nexus Analytics platform",
  "items": [
    {
      "title": "What is Nexus Analytics and how does it work?",
      "description": "Nexus Analytics is an AI-powered business intelligence platform that transforms raw data into actionable insights. It connects to your existing data sources (databases, cloud apps, spreadsheets), automatically models relationships, and provides intuitive dashboards and natural language querying. Our AI engine continuously learns from your data to surface relevant insights and anomalies.",
      "meta": {
        "category": "General"
      }
    },
    {
      "title": "Is my data secure with Nexus?",
      "description": "Security is our top priority. Nexus is SOC 2 Type II certified, ISO 27001 compliant, GDPR ready, and HIPAA eligible. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We offer data residency options in US, EU, and APAC. Role-based access control, SSO integration, and comprehensive audit logging ensure complete data governance.",
      "meta": {
        "category": "Security"
      }
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "FAQ",
  "type": "faq",
  "items": [
    {
      "title": "Question?",
      "description": "Answer here."
    }
  ]
}
\`\`\`

## Best Practices

1. Keep questions clear and concise
2. Provide comprehensive answers
3. Group by category
4. Order by frequency
5. Include links for more info

## Component Information

- **Selector:** \`lib-faq-section\`
- **Component Path:** \`./lib/components/sections/faq-section/faq-section.component\`
- **Style Path:** \`./lib/components/sections/faq-section/faq-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Frequently Asked Questions',
  type: 'faq',
  description: 'Common questions about Nexus Analytics platform',
  items: [
    {
      title: 'What is Nexus Analytics and how does it work?',
      description:
        'Nexus Analytics is an AI-powered business intelligence platform that transforms raw data into actionable insights. It connects to your existing data sources (databases, cloud apps, spreadsheets), automatically models relationships, and provides intuitive dashboards and natural language querying. Our AI engine continuously learns from your data to surface relevant insights and anomalies.',
      meta: {
        category: 'General',
      },
    },
    {
      title: 'Is my data secure with Nexus?',
      description:
        'Security is our top priority. Nexus is SOC 2 Type II certified, ISO 27001 compliant, GDPR ready, and HIPAA eligible. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We offer data residency options in US, EU, and APAC. Role-based access control, SSO integration, and comprehensive audit logging ensure complete data governance.',
      meta: {
        category: 'Security',
      },
    },
  ],
};

/**
 * FAQ Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'faq'"
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
export class FaqPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default FaqPageComponent;
