import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# Contact Card Section

Displays person information with avatars, roles, contact details, and social links.

## Overview

The **Contact Card Section** (\`type: "contact-card"\`) is used for displays person information with avatars, roles, contact details, and social links.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`contact-card\` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 2 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Team members
- Key contacts
- Leadership profiles
- Stakeholder directory
- Sales contacts

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| \`title\` | string | Contact name |
| \`label\` | string | Contact label |
| \`value\` | string | Role or description |
| \`role\` | string | Job role/title |
| \`email\` | string | Email address |
| \`phone\` | string | Phone number |
| \`avatar\` | string | Avatar image URL |
| \`department\` | string | Department name |
| \`location\` | string | Office location |
| \`linkedIn\` | string | LinkedIn profile URL |
| \`twitter\` | string | Twitter handle |



## Complete Example

\`\`\`json
{
  "title": "Executive Leadership Team",
  "type": "contact-card",
  "description": "Key decision makers and stakeholders",
  "fields": [
    {
      "label": "Chief Executive Officer",
      "title": "Dr. Sarah Mitchell",
      "value": "CEO & Co-Founder",
      "email": "sarah.mitchell@nexustech.io",
      "phone": "+1 (512) 555-0100",
      "role": "Chief Executive Officer",
      "department": "Executive",
      "location": "Austin, TX",
      "linkedIn": "https://linkedin.com/in/sarahmitchell",
      "twitter": "@sarahmitchell"
    },
    {
      "label": "Chief Technology Officer",
      "title": "James Park",
      "value": "CTO & Co-Founder",
      "email": "james.park@nexustech.io",
      "phone": "+1 (512) 555-0101",
      "role": "Chief Technology Officer",
      "department": "Engineering",
      "location": "Austin, TX",
      "linkedIn": "https://linkedin.com/in/jamespark"
    },
    {
      "label": "Chief Revenue Officer",
      "title": "Maria Santos",
      "value": "CRO",
      "email": "maria.santos@nexustech.io",
      "phone": "+1 (512) 555-0102",
      "role": "Chief Revenue Officer",
      "department": "Sales",
      "location": "New York, NY",
      "linkedIn": "https://linkedin.com/in/mariasantos"
    },
    {
      "label": "Chief Financial Officer",
      "title": "David Thompson",
      "value": "CFO",
      "email": "david.thompson@nexustech.io",
      "phone": "+44 20 7946 0958",
      "role": "Chief Financial Officer",
      "department": "Finance",
      "location": "London, UK",
      "linkedIn": "https://linkedin.com/in/davidthompson"
    },
    {
      "label": "VP of Engineering",
      "title": "Dr. Wei Chen",
      "value": "VP Engineering - Platform",
      "email": "wei.chen@nexustech.io",
      "phone": "+65 6823 4567",
      "role": "VP of Engineering",
      "department": "Engineering",
      "location": "Singapore"
    },
    {
      "label": "VP of Customer Success",
      "title": "Rachel Green",
      "value": "VP Customer Success",
      "email": "rachel.green@nexustech.io",
      "phone": "+1 (512) 555-0105",
      "role": "VP of Customer Success",
      "department": "Customer Success",
      "location": "Austin, TX"
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Primary Contact",
  "type": "contact-card",
  "fields": [
    {
      "title": "Support Team",
      "email": "support@company.com"
    }
  ]
}
\`\`\`

## Best Practices

1. Include name, role, and contact info
2. Add avatar images when available
3. Include social media links
4. Group by department or role
5. Show location for distributed teams

## Component Information

- **Selector:** \`lib-contact-card-section\`
- **Component Path:** \`./lib/components/sections/contact-card-section/contact-card-section.component\`
- **Style Path:** \`./lib/components/sections/contact-card-section/contact-card-section.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Executive Leadership Team',
  type: 'contact-card',
  description: 'Key decision makers and stakeholders',
  fields: [
    {
      label: 'Chief Executive Officer',
      title: 'Dr. Sarah Mitchell',
      value: 'CEO & Co-Founder',
      email: 'sarah.mitchell@nexustech.io',
      phone: '+1 (512) 555-0100',
      role: 'Chief Executive Officer',
      department: 'Executive',
      location: 'Austin, TX',
      linkedIn: 'https://linkedin.com/in/sarahmitchell',
      twitter: '@sarahmitchell',
    },
    {
      label: 'Chief Technology Officer',
      title: 'James Park',
      value: 'CTO & Co-Founder',
      email: 'james.park@nexustech.io',
      phone: '+1 (512) 555-0101',
      role: 'Chief Technology Officer',
      department: 'Engineering',
      location: 'Austin, TX',
      linkedIn: 'https://linkedin.com/in/jamespark',
    },
    {
      label: 'Chief Revenue Officer',
      title: 'Maria Santos',
      value: 'CRO',
      email: 'maria.santos@nexustech.io',
      phone: '+1 (512) 555-0102',
      role: 'Chief Revenue Officer',
      department: 'Sales',
      location: 'New York, NY',
      linkedIn: 'https://linkedin.com/in/mariasantos',
    },
    {
      label: 'Chief Financial Officer',
      title: 'David Thompson',
      value: 'CFO',
      email: 'david.thompson@nexustech.io',
      phone: '+44 20 7946 0958',
      role: 'Chief Financial Officer',
      department: 'Finance',
      location: 'London, UK',
      linkedIn: 'https://linkedin.com/in/davidthompson',
    },
    {
      label: 'VP of Engineering',
      title: 'Dr. Wei Chen',
      value: 'VP Engineering - Platform',
      email: 'wei.chen@nexustech.io',
      phone: '+65 6823 4567',
      role: 'VP of Engineering',
      department: 'Engineering',
      location: 'Singapore',
    },
    {
      label: 'VP of Customer Success',
      title: 'Rachel Green',
      value: 'VP Customer Success',
      email: 'rachel.green@nexustech.io',
      phone: '+1 (512) 555-0105',
      role: 'VP of Customer Success',
      department: 'Customer Success',
      location: 'Austin, TX',
    },
  ],
};

/**
 * Contact Card Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-contact-card-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'contact-card'"
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
export class ContactCardPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default ContactCardPageComponent;
