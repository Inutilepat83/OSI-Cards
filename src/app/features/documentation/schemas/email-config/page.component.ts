import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# EmailConfig

Configuration for mail action buttons.

## Overview

\`EmailConfig\` defines the email content for mail-type card actions. You can generate an email with just a subject (title) and body, without requiring contact information.

## Interface Definition

\`\`\`typescript
interface EmailConfig {
  contact?: EmailContact;  // Optional - allows generating email with just subject and body
  subject: string;         // Required - email subject (title)
  body: string;            // Required - email body content
  to?: string | string[];  // Optional - direct recipient(s), defaults to contact.email if contact is provided
  cc?: string | string[];  // Optional - CC recipient(s)
  bcc?: string | string[]; // Optional - BCC recipient(s)
}

interface EmailContact {
  name: string;
  email: string;
  role: string;
}
\`\`\`

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| \`contact\` | EmailContact | **No** | Contact information (optional - can generate email with just subject and body) |
| \`subject\` | string | **Yes** | Email subject line (title) |
| \`body\` | string | **Yes** | Email body content |
| \`to\` | string \\| string[] | No | Direct recipient(s), defaults to contact.email if contact is provided |
| \`cc\` | string \\| string[] | No | CC recipient(s) |
| \`bcc\` | string \\| string[] | No | BCC recipient(s) |

## Examples

### With Contact Information

\`\`\`json
{
  "contact": {
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "role": "Account Manager"
  },
  "subject": "Follow-up: Product Demo",
  "body": "Dear Jane,\\n\\nThank you for the demo yesterday...\\n\\nBest regards"
}
\`\`\`

### Without Contact (Subject and Body Only)

\`\`\`json
{
  "subject": "Meeting Notes",
  "body": "Here are the notes from today's meeting:\\n\\n- Item 1\\n- Item 2\\n- Item 3"
}
\`\`\`

When no contact or recipient is provided, the email client will open with a draft containing the subject and body, allowing the user to manually add recipients.
`;

@Component({
  selector: 'app-email-config-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailConfigPageComponent {
  content = pageContent;
}

export default EmailConfigPageComponent;
