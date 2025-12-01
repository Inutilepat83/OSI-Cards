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
- Leadership
- Stakeholders

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
| \`linkedIn\` | string | LinkedIn profile URL |



## Complete Example

\`\`\`json
{
  "title": "Key Contacts",
  "type": "contact-card",
  "description": "Primary contacts and stakeholders",
  "fields": [
    {
      "label": "Primary Contact",
      "title": "Jane Doe",
      "value": "Product Manager",
      "email": "jane.doe@example.com",
      "phone": "+1 555 0100",
      "role": "Product Manager",
      "department": "Product",
      "linkedIn": "https://linkedin.com/in/janedoe"
    },
    {
      "label": "Technical Lead",
      "title": "John Smith",
      "value": "Engineering Director",
      "email": "john.smith@example.com",
      "phone": "+1 555 0101",
      "role": "Engineering Director",
      "department": "Engineering"
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Contact",
  "type": "contact-card",
  "fields": [
    {
      "title": "Contact Name",
      "email": "contact@example.com"
    }
  ]
}
\`\`\`

## Best Practices

1. Include name, role, and contact info
2. Add avatar images when available
3. Include social media links
4. Group by department or role

## Component Information

- **Selector:** \`app-contact-card-section\`
- **Component Path:** \`./lib/components/sections/contact-card-section/contact-card-section.component\`
- **Style Path:** \`./lib/styles/components/sections/_contact.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Key Contacts',
  type: 'contact-card',
  description: 'Primary contacts and stakeholders',
  fields: [
    {
      label: 'Primary Contact',
      title: 'Jane Doe',
      value: 'Product Manager',
      email: 'jane.doe@example.com',
      phone: '+1 555 0100',
      role: 'Product Manager',
      department: 'Product',
      linkedIn: 'https://linkedin.com/in/janedoe',
    },
    {
      label: 'Technical Lead',
      title: 'John Smith',
      value: 'Engineering Director',
      email: 'john.smith@example.com',
      phone: '+1 555 0101',
      role: 'Engineering Director',
      department: 'Engineering',
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
