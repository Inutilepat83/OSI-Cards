# Contact Card Section

Displays person information with avatars, roles, contact details, and social links.

## Overview

The **Contact Card Section** is used for displays person information with avatars, roles, contact details, and social links.

## Use Cases

- Team members
- Key contacts
- Leadership
- Stakeholders

## Data Schema

```typescript
interface CardSection {
  title: string;
  type: 'contact-card';
  fields?: CardField[];
  
}
```

## Example

```json
{
  "title": "Executive Leadership Team",
  "type": "contact-card",
  "description": "Key decision makers and stakeholders",
  "preferredColumns": 2,
  "minColumns": 2,
  "priority": 1,
  "fields": [
    {
      "label": "Chief Executive Officer",
      "title": "Dr. Sarah Mitchell",
      "value": "CEO & Co-Founder",
      "email": "sarah.mitchell@nexustech.io",
      "salesforce": "https://company.salesforce.com/001xx000003DGbQ",
      "role": "Chief Executive Officer",
      "department": "Executive",
      "target": true,
      "influencer": 9,
      "linkedIn": "https://linkedin.com/in/sarahmitchell",
      "twitter": "@sarahmitchell",
      "note": "Key decision maker for strategic partnerships and major business initiatives. Prefers email communication and typically responds within 24 hours. Has extensive experience in scaling technology companies from startup to IPO. Known for making data-driven decisions and fostering collaborative team environments. Excellent at building relationships with key stakeholders and investors."
    },
    {
      "label": "Chief Technology Officer",
      "title": "James Park",
      "value": "CTO & Co-Founder",
      "email": "james.park@nexustech.io",
      "salesforce": "https://company.salesforce.com/001xx000003DGbR",
      "role": "Chief Technology Officer",
      "department": "Engineering",
      "linkedIn": "https://linkedin.com/in/jamespark",
      "note": "Expert in cloud architecture, microservices, and distributed systems design. Available for technical discussions and architecture reviews. Led the migration of legacy systems to modern cloud infrastructure, resulting in 40% cost reduction and improved scalability. Strong advocate for DevOps practices and continuous delivery. Regularly speaks at tech conferences and contributes to open-source projects."
    },
    {
      "label": "Chief Financial Officer",
      "title": "David Thompson",
      "value": "CFO",
      "email": "david.thompson@nexustech.io",
      "salesforce": "https://company.salesforce.com/001xx000003DGbT",
      "role": "Chief Financial Officer",
      "department": "Finance",
      "linkedIn": "https://linkedin.com/in/davidthompson",
      "note": "Seasoned financial executive with over 20 years of experience in global finance and operations. Successfully led multiple fundraising rounds and managed financial operations across multiple international markets. Expertise in financial planning, risk management, and investor relations. Known for transparent communication and strategic financial guidance. Prefers scheduled calls for detailed discussions."
    },
    {
      "label": "VP of Customer Success",
      "title": "Rachel Green",
      "value": "VP Customer Success",
      "email": "rachel.green@nexustech.io",
      "salesforce": "https://company.salesforce.com/001xx000003DGbV",
      "role": "VP of Customer Success",
      "department": "Customer Success",
      "note": "Extremely customer-focused leader who transformed our customer success metrics, achieving 95% customer satisfaction and reducing churn by 30%. Known for her hands-on approach and ability to build strong relationships with enterprise clients. Regularly hosts customer advisory board meetings and is always open to feedback. Great collaborator who works closely with product and engineering teams to advocate for customer needs. Very responsive to urgent customer issues."
    }
  ]
}
```

## Best Practices

1. Include name, role, and contact info
1. Add avatar images when available
1. Include social media links
1. Group by department or role

## Component Properties




## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
