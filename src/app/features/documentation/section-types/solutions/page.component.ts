import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# Solutions Section

Displays solution offerings, use cases, features, and benefits.

## Overview

The **Solutions Section** (\`type: "solutions"\`) is used for displays solution offerings, use cases, features, and benefits.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`solutions\` |
| Uses Fields | Yes |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | \`services\`, \`offerings\` |


## Use Cases

- Service offerings
- Solution portfolios
- Use cases
- Case studies
- Professional services

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| \`title\` | string | Solution title |
| \`description\` | string | Solution description |
| \`category\` | string | Solution category |
| \`benefits\` | array | List of benefits |
| \`deliveryTime\` | string | Delivery timeframe |
| \`complexity\` | string | Implementation complexity |
| \`outcomes\` | array | Expected outcomes |

### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| \`title\` | string | Solution title |
| \`description\` | string | Solution description |
| \`category\` | string | Solution category |
| \`benefits\` | array | List of benefits |
| \`deliveryTime\` | string | Delivery timeframe |
| \`complexity\` | string | Implementation complexity |
| \`outcomes\` | array | Expected outcomes |

## Complete Example

\`\`\`json
{
  "title": "Professional Services Portfolio",
  "type": "solutions",
  "description": "End-to-end implementation and consulting services",
  "fields": [
    {
      "title": "Enterprise Data Platform Implementation",
      "description": "Complete data infrastructure setup including data warehouse, ETL pipelines, and governance framework tailored to your business needs",
      "category": "Data Infrastructure",
      "benefits": [
        "Unified data architecture",
        "Real-time data processing",
        "Automated data quality",
        "Scalable cloud infrastructure",
        "Built-in compliance controls"
      ],
      "deliveryTime": "12-16 weeks",
      "complexity": "high",
      "outcomes": [
        "80% faster data access",
        "95% data accuracy",
        "50% reduced operational costs"
      ]
    },
    {
      "title": "AI/ML Center of Excellence Setup",
      "description": "Establish internal AI capabilities with MLOps infrastructure, model governance, and team enablement",
      "category": "Artificial Intelligence",
      "benefits": [
        "Production ML infrastructure",
        "Model versioning & monitoring",
        "Automated retraining pipelines",
        "Explainable AI framework"
      ],
      "deliveryTime": "8-12 weeks",
      "complexity": "high",
      "outcomes": [
        "10x faster model deployment",
        "40% improved model accuracy",
        "Reduced AI risk exposure"
      ]
    },
    {
      "title": "Self-Service Analytics Enablement",
      "description": "Empower business users with intuitive dashboards, natural language queries, and embedded analytics",
      "category": "Business Intelligence",
      "benefits": [
        "No-code dashboard builder",
        "Natural language queries",
        "Mobile-optimized reports",
        "Automated insights"
      ],
      "deliveryTime": "6-8 weeks",
      "complexity": "medium",
      "outcomes": [
        "90% self-service adoption",
        "75% reduced IT requests",
        "3x faster decision-making"
      ]
    },
    {
      "title": "Cloud Migration & Modernization",
      "description": "Migrate legacy analytics workloads to modern cloud architecture with zero downtime",
      "category": "Cloud Services",
      "benefits": [
        "Seamless migration",
        "Cost optimization",
        "Auto-scaling infrastructure",
        "Enhanced security"
      ],
      "deliveryTime": "10-14 weeks",
      "complexity": "high",
      "outcomes": [
        "60% infrastructure cost reduction",
        "99.99% availability",
        "10x performance improvement"
      ]
    },
    {
      "title": "Data Governance & Compliance Program",
      "description": "Implement comprehensive data governance including cataloging, lineage, privacy, and regulatory compliance",
      "category": "Governance",
      "benefits": [
        "Automated data discovery",
        "Complete lineage tracking",
        "Privacy by design",
        "Audit-ready reporting"
      ],
      "deliveryTime": "8-10 weeks",
      "complexity": "medium",
      "outcomes": [
        "100% data visibility",
        "GDPR/CCPA compliance",
        "Zero compliance violations"
      ]
    },
    {
      "title": "Executive Dashboard & Reporting Suite",
      "description": "Custom executive dashboards with KPI tracking, alerts, and board-ready presentations",
      "category": "Executive Intelligence",
      "benefits": [
        "Real-time KPI tracking",
        "Automated board reports",
        "Mobile executive app",
        "AI-powered insights"
      ],
      "deliveryTime": "4-6 weeks",
      "complexity": "low",
      "outcomes": [
        "Real-time visibility",
        "50% reduced reporting time",
        "Data-driven board meetings"
      ]
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Solution",
  "type": "solutions",
  "fields": [
    {
      "title": "Consulting Service",
      "description": "Professional consultation"
    }
  ]
}
\`\`\`

## Best Practices

1. Highlight key benefits
2. Include use cases
3. Add feature lists
4. Show outcomes when available
5. Include delivery timeframes

## Component Information

- **Selector:** \`lib-solutions-section\`
- **Component Path:** \`./lib/components/sections/solutions-section/solutions-section.component\`
- **Style Path:** \`./lib/components/sections/solutions-section/solutions-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Professional Services Portfolio',
  type: 'solutions',
  description: 'End-to-end implementation and consulting services',
  fields: [
    {
      title: 'Enterprise Data Platform Implementation',
      description:
        'Complete data infrastructure setup including data warehouse, ETL pipelines, and governance framework tailored to your business needs',
      category: 'Data Infrastructure',
      benefits: [
        'Unified data architecture',
        'Real-time data processing',
        'Automated data quality',
        'Scalable cloud infrastructure',
        'Built-in compliance controls',
      ],
      deliveryTime: '12-16 weeks',
      complexity: 'high',
      outcomes: ['80% faster data access', '95% data accuracy', '50% reduced operational costs'],
    },
    {
      title: 'AI/ML Center of Excellence Setup',
      description:
        'Establish internal AI capabilities with MLOps infrastructure, model governance, and team enablement',
      category: 'Artificial Intelligence',
      benefits: [
        'Production ML infrastructure',
        'Model versioning & monitoring',
        'Automated retraining pipelines',
        'Explainable AI framework',
      ],
      deliveryTime: '8-12 weeks',
      complexity: 'high',
      outcomes: [
        '10x faster model deployment',
        '40% improved model accuracy',
        'Reduced AI risk exposure',
      ],
    },
    {
      title: 'Self-Service Analytics Enablement',
      description:
        'Empower business users with intuitive dashboards, natural language queries, and embedded analytics',
      category: 'Business Intelligence',
      benefits: [
        'No-code dashboard builder',
        'Natural language queries',
        'Mobile-optimized reports',
        'Automated insights',
      ],
      deliveryTime: '6-8 weeks',
      complexity: 'medium',
      outcomes: [
        '90% self-service adoption',
        '75% reduced IT requests',
        '3x faster decision-making',
      ],
    },
    {
      title: 'Cloud Migration & Modernization',
      description:
        'Migrate legacy analytics workloads to modern cloud architecture with zero downtime',
      category: 'Cloud Services',
      benefits: [
        'Seamless migration',
        'Cost optimization',
        'Auto-scaling infrastructure',
        'Enhanced security',
      ],
      deliveryTime: '10-14 weeks',
      complexity: 'high',
      outcomes: [
        '60% infrastructure cost reduction',
        '99.99% availability',
        '10x performance improvement',
      ],
    },
    {
      title: 'Data Governance & Compliance Program',
      description:
        'Implement comprehensive data governance including cataloging, lineage, privacy, and regulatory compliance',
      category: 'Governance',
      benefits: [
        'Automated data discovery',
        'Complete lineage tracking',
        'Privacy by design',
        'Audit-ready reporting',
      ],
      deliveryTime: '8-10 weeks',
      complexity: 'medium',
      outcomes: ['100% data visibility', 'GDPR/CCPA compliance', 'Zero compliance violations'],
    },
    {
      title: 'Executive Dashboard & Reporting Suite',
      description:
        'Custom executive dashboards with KPI tracking, alerts, and board-ready presentations',
      category: 'Executive Intelligence',
      benefits: [
        'Real-time KPI tracking',
        'Automated board reports',
        'Mobile executive app',
        'AI-powered insights',
      ],
      deliveryTime: '4-6 weeks',
      complexity: 'low',
      outcomes: [
        'Real-time visibility',
        '50% reduced reporting time',
        'Data-driven board meetings',
      ],
    },
  ],
};

/**
 * Solutions Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-solutions-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'solutions'"
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
export class SolutionsPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default SolutionsPageComponent;
