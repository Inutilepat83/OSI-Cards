# FAQ Section

Displays frequently asked questions with expandable answers.

## Overview

The **FAQ Section** (`type: "faq"`) is used for displays frequently asked questions with expandable answers.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | `faq` |
| Uses Fields | No |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | None |


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
| `title` | string | Question text |
| `description` | string | Answer text |
| `meta` | object | - |

## Complete Example

```json
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
      "title": "How long does implementation typically take?",
      "description": "Implementation timeline varies based on complexity. Basic deployments with standard connectors can be completed in 2-4 weeks. Enterprise implementations with custom integrations, SSO setup, and advanced governance typically take 8-12 weeks. Our Professional Services team provides dedicated project management throughout the process.",
      "meta": {
        "category": "Implementation"
      }
    },
    {
      "title": "What data sources does Nexus support?",
      "description": "Nexus supports 200+ native connectors including cloud databases (Snowflake, BigQuery, Redshift), CRM systems (Salesforce, HubSpot), ERP platforms (SAP, Oracle, NetSuite), file storage (S3, Azure Blob), and popular SaaS tools. We also offer a REST API for custom integrations and CSV/Excel file uploads for ad-hoc analysis.",
      "meta": {
        "category": "Technical"
      }
    },
    {
      "title": "Is my data secure with Nexus?",
      "description": "Security is our top priority. Nexus is SOC 2 Type II certified, ISO 27001 compliant, GDPR ready, and HIPAA eligible. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We offer data residency options in US, EU, and APAC. Role-based access control, SSO integration, and comprehensive audit logging ensure complete data governance.",
      "meta": {
        "category": "Security"
      }
    },
    {
      "title": "What pricing plans are available?",
      "description": "We offer three tiers: Starter ($500/mo for small teams), Business ($2,500/mo for growing companies), and Enterprise (custom pricing for large organizations). All plans include unlimited users. Enterprise adds advanced security, dedicated support, custom SLAs, and professional services. Contact sales for volume discounts and custom packaging.",
      "meta": {
        "category": "Pricing"
      }
    },
    {
      "title": "Can I try Nexus before purchasing?",
      "description": "Yes! We offer a 14-day free trial with full access to all features. You can connect your own data or explore with sample datasets. For enterprise evaluations, we provide extended POC periods with dedicated technical support. No credit card required to start your trial.",
      "meta": {
        "category": "Getting Started"
      }
    },
    {
      "title": "What kind of support is included?",
      "description": "All plans include email support with 24-hour response SLA and access to our comprehensive documentation and video tutorials. Business plans add live chat support. Enterprise customers receive 24/7 phone support, dedicated Customer Success Manager, and quarterly business reviews.",
      "meta": {
        "category": "Support"
      }
    },
    {
      "title": "Does Nexus integrate with my existing BI tools?",
      "description": "Nexus can complement or replace existing BI tools. We offer export capabilities to Excel, PDF, and common formats. Our embedding SDK allows you to integrate Nexus visualizations into existing applications. For migrations, we provide tools to import existing dashboards and reports from Tableau, Power BI, and Looker.",
      "meta": {
        "category": "Integration"
      }
    },
    {
      "title": "How does the AI-powered insights feature work?",
      "description": "Our AI engine analyzes your data continuously to identify trends, anomalies, and correlations. It proactively surfaces insights you might have missed, explains why metrics changed, and predicts future outcomes. You can also ask questions in natural language like 'Why did sales drop last week?' and get AI-generated explanations with supporting visualizations.",
      "meta": {
        "category": "Features"
      }
    },
    {
      "title": "What training resources are available?",
      "description": "We provide multiple learning paths: Nexus Academy (40+ hours of video training), live instructor-led workshops, certification programs, and in-person training sessions for enterprise customers. Our documentation includes quick-start guides, best practice playbooks, and API reference. Customer Success teams offer personalized onboarding for new users.",
      "meta": {
        "category": "Training"
      }
    }
  ]
}
```

## Minimal Example

```json
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
```

## Best Practices

1. Keep questions clear and concise
2. Provide comprehensive answers
3. Group by category
4. Order by frequency
5. Include links for more info

## Component Information

- **Selector:** `lib-faq-section`
- **Component Path:** `./lib/components/sections/faq-section/faq-section.component`


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
