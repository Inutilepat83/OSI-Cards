import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# EmailConfig

Configuration for mail action buttons.

## Overview

\`EmailConfig\` defines the email content for mail-type card actions.

## Interface Definition

\`\`\`typescript
interface EmailConfig {
  contact: EmailContact;
  subject: string;
  body: string;
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
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
| \`contact\` | EmailContact | **Yes** | Contact information |
| \`subject\` | string | **Yes** | Email subject line |
| \`body\` | string | **Yes** | Email body content |
| \`to\` | string \\| string[] | No | Override recipient(s) |
| \`cc\` | string \\| string[] | No | CC recipient(s) |
| \`bcc\` | string \\| string[] | No | BCC recipient(s) |

## Example

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
