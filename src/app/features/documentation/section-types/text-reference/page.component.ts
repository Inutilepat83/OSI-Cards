import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# Text Reference Section

Displays long-form text, paragraphs, articles, and reference content.

## Overview

The **Text Reference Section** (\`type: "text-reference"\`) is used for displays long-form text, paragraphs, articles, and reference content.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`text-reference\` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | \`reference\`, \`text-ref\`, \`documentation\` |


## Use Cases

- Articles
- Documentation links
- Research summaries
- Reference materials
- Resource libraries

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| \`label\` | string | Reference label |
| \`value\` | string | Reference title/name |
| \`text\` | string | Reference text content |
| \`description\` | string | Reference description |
| \`url\` | string | Reference URL |
| \`source\` | string | Source attribution |
| \`type\` | string | Document type (PDF, Video, etc.) |
| \`date\` | string | Publication date |



## Complete Example

\`\`\`json
{
  "title": "Resources & Documentation",
  "type": "text-reference",
  "description": "Essential guides, documentation, and reference materials",
  "fields": [
    {
      "label": "Technical Documentation",
      "value": "Nexus Analytics Platform - Complete Technical Reference",
      "description": "Comprehensive documentation covering architecture, API reference, integration guides, and best practices for enterprise deployments",
      "url": "https://docs.nexustech.io/platform",
      "type": "Documentation",
      "date": "2024-12-01"
    },
    {
      "label": "API Reference",
      "value": "REST API v3.0 Developer Guide",
      "description": "Complete API documentation with authentication, endpoints, request/response schemas, rate limiting, and code examples in Python, JavaScript, and Java",
      "url": "https://api.nexustech.io/docs/v3",
      "type": "API Docs"
    },
    {
      "label": "Security Whitepaper",
      "value": "Enterprise Security & Compliance Framework",
      "description": "Detailed overview of security architecture, encryption standards, access controls, audit logging, and compliance certifications (SOC 2, ISO 27001, GDPR, HIPAA)",
      "url": "https://nexustech.io/security-whitepaper",
      "type": "PDF",
      "date": "2024-10-15"
    },
    {
      "label": "Implementation Guide",
      "value": "Enterprise Deployment Playbook",
      "description": "Step-by-step guide for enterprise implementations including architecture patterns, migration strategies, performance tuning, and go-live checklists",
      "url": "https://docs.nexustech.io/implementation",
      "type": "Guide"
    },
    {
      "label": "Video Training",
      "value": "Nexus Academy - Complete Certification Course",
      "description": "40-hour video training program covering platform fundamentals, advanced analytics, administration, and developer certification paths",
      "url": "https://academy.nexustech.io",
      "type": "Video Course"
    },
    {
      "label": "Case Study",
      "value": "How Fortune 500 Retailer Achieved 47% Faster Insights",
      "description": "Detailed case study covering implementation journey, challenges overcome, technical architecture, and measurable business outcomes",
      "url": "https://nexustech.io/case-studies/retail-transformation",
      "type": "PDF",
      "date": "2024-09-20"
    },
    {
      "label": "Architecture Guide",
      "value": "Multi-tenant Cloud Architecture Deep Dive",
      "description": "Technical architecture documentation covering data isolation, scaling strategies, disaster recovery, and multi-region deployments",
      "url": "https://docs.nexustech.io/architecture",
      "type": "Technical Guide"
    },
    {
      "label": "Release Notes",
      "value": "Version 5.2 Release Notes & Migration Guide",
      "description": "Complete changelog, new features, breaking changes, deprecations, and step-by-step migration instructions for version 5.2",
      "url": "https://docs.nexustech.io/releases/5.2",
      "type": "Release Notes",
      "date": "2025-01-15"
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "References",
  "type": "text-reference",
  "fields": [
    {
      "label": "Link",
      "value": "Reference Document"
    }
  ]
}
\`\`\`

## Best Practices

1. Break into readable chunks
2. Use proper formatting
3. Include citations
4. Add metadata for context
5. Provide action links

## Component Information

- **Selector:** \`lib-text-reference-section\`
- **Component Path:** \`./lib/components/sections/text-reference-section/text-reference-section.component\`
- **Style Path:** \`./lib/components/sections/text-reference-section/text-reference-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Resources & Documentation',
  type: 'text-reference',
  description: 'Essential guides, documentation, and reference materials',
  fields: [
    {
      label: 'Technical Documentation',
      value: 'Nexus Analytics Platform - Complete Technical Reference',
      description:
        'Comprehensive documentation covering architecture, API reference, integration guides, and best practices for enterprise deployments',
      url: 'https://docs.nexustech.io/platform',
      type: 'Documentation',
      date: '2024-12-01',
    },
    {
      label: 'API Reference',
      value: 'REST API v3.0 Developer Guide',
      description:
        'Complete API documentation with authentication, endpoints, request/response schemas, rate limiting, and code examples in Python, JavaScript, and Java',
      url: 'https://api.nexustech.io/docs/v3',
      type: 'API Docs',
    },
    {
      label: 'Security Whitepaper',
      value: 'Enterprise Security & Compliance Framework',
      description:
        'Detailed overview of security architecture, encryption standards, access controls, audit logging, and compliance certifications (SOC 2, ISO 27001, GDPR, HIPAA)',
      url: 'https://nexustech.io/security-whitepaper',
      type: 'PDF',
      date: '2024-10-15',
    },
    {
      label: 'Implementation Guide',
      value: 'Enterprise Deployment Playbook',
      description:
        'Step-by-step guide for enterprise implementations including architecture patterns, migration strategies, performance tuning, and go-live checklists',
      url: 'https://docs.nexustech.io/implementation',
      type: 'Guide',
    },
    {
      label: 'Video Training',
      value: 'Nexus Academy - Complete Certification Course',
      description:
        '40-hour video training program covering platform fundamentals, advanced analytics, administration, and developer certification paths',
      url: 'https://academy.nexustech.io',
      type: 'Video Course',
    },
    {
      label: 'Case Study',
      value: 'How Fortune 500 Retailer Achieved 47% Faster Insights',
      description:
        'Detailed case study covering implementation journey, challenges overcome, technical architecture, and measurable business outcomes',
      url: 'https://nexustech.io/case-studies/retail-transformation',
      type: 'PDF',
      date: '2024-09-20',
    },
    {
      label: 'Architecture Guide',
      value: 'Multi-tenant Cloud Architecture Deep Dive',
      description:
        'Technical architecture documentation covering data isolation, scaling strategies, disaster recovery, and multi-region deployments',
      url: 'https://docs.nexustech.io/architecture',
      type: 'Technical Guide',
    },
    {
      label: 'Release Notes',
      value: 'Version 5.2 Release Notes & Migration Guide',
      description:
        'Complete changelog, new features, breaking changes, deprecations, and step-by-step migration instructions for version 5.2',
      url: 'https://docs.nexustech.io/releases/5.2',
      type: 'Release Notes',
      date: '2025-01-15',
    },
  ],
};

/**
 * Text Reference Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-text-reference-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'text-reference'"
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
export class TextReferencePageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default TextReferencePageComponent;
