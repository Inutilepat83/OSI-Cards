import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# CardAction

Defines action buttons for cards.

## Overview

\`CardAction\` defines interactive buttons displayed at the bottom of cards. Four action types are supported.

## Action Types

### Mail Action
Opens email client with pre-filled content.

\`\`\`typescript
interface MailCardAction {
  type: 'mail';
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  email: {
    contact: { name: string; email: string; role: string };
    subject: string;
    body: string;
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
  };
}
\`\`\`

### Website Action
Opens URL in new tab.

\`\`\`typescript
interface WebsiteCardAction {
  type: 'website';
  label: string;
  url: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}
\`\`\`

### Agent Action
Triggers agent interaction.

\`\`\`typescript
interface AgentCardAction {
  type: 'agent';
  label: string;
  agentId?: string;
  agentContext?: Record<string, unknown>;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}
\`\`\`

### Question Action
Sends question to chat.

\`\`\`typescript
interface QuestionCardAction {
  type: 'question';
  label: string;
  question?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}
\`\`\`

## Examples

\`\`\`json
[
  {
    "label": "Contact",
    "type": "mail",
    "variant": "primary",
    "icon": "📧",
    "email": {
      "contact": { "name": "John", "email": "john@example.com", "role": "Sales" },
      "subject": "Inquiry",
      "body": "Hello..."
    }
  },
  {
    "label": "Website",
    "type": "website",
    "variant": "secondary",
    "url": "https://example.com"
  }
]
\`\`\`
`;

@Component({
  selector: 'app-card-action-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardActionPageComponent {
  content = pageContent;
}

export default CardActionPageComponent;
