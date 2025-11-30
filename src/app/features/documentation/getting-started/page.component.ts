import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../doc-page.component';

const pageContent = `# Getting Started with OSI Cards

Welcome to OSI Cards - a powerful Angular library for rendering AI-generated cards with streaming support.

## Overview

OSI Cards provides a flexible, performant way to display structured content in card format. Whether you're building a chatbot interface, a knowledge base, or a dashboard, OSI Cards makes it easy to render dynamic, interactive cards.

## Key Features

- **18+ Section Types**: Info, Analytics, Contact, Network, Map, Financials, Event, List, Chart, Product, Solutions, and more
- **Streaming Support**: Progressive rendering with real-time updates
- **LLM Integration**: Designed for AI-generated content
- **Angular 18-20 Support**: Works with the latest Angular versions
- **Theming**: CSS custom properties for easy customization
- **Accessibility**: WCAG compliant components
- **Performance**: Optimized rendering with virtual scrolling

## Quick Start

### 1. Install the library

\`\`\`bash
npm install osi-cards-lib
\`\`\`

### 2. Import the component

\`\`\`typescript
import { Component } from '@angular/core';
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [AICardRendererComponent],
  template: \`
    <app-ai-card-renderer [cardConfig]="cardConfig"></app-ai-card-renderer>
  \`
})
export class MyComponent {
  cardConfig: AICardConfig = {
    cardTitle: 'My First Card',
    sections: [
      {
        title: 'Overview',
        type: 'info',
        fields: [
          { label: 'Name', value: 'Example' },
          { label: 'Status', value: 'Active' }
        ]
      }
    ]
  };
}
\`\`\`

### 3. Add styles (optional)

If you want to use the default themes:

\`\`\`scss
@import 'osi-cards-lib/styles';
\`\`\`

## What's Next?

- [Installation Guide](/docs/installation) - Detailed installation instructions
- [Section Types](/docs/section-types) - Explore all available section types
- [Streaming](/docs/streaming/overview) - Learn about streaming support
- [LLM Integration](/docs/llm-integration) - Integrate with AI systems
- [Best Practices](/docs/best-practices) - Tips for optimal usage

## Example Card

Here's a more complete example showing multiple section types:

\`\`\`typescript
const cardConfig: AICardConfig = {
  cardTitle: 'Company Overview',
  sections: [
    {
      title: 'Basic Info',
      type: 'info',
      fields: [
        { label: 'Company', value: 'Acme Corp' },
        { label: 'Industry', value: 'Technology' },
        { label: 'Founded', value: '2010' }
      ]
    },
    {
      title: 'Key Metrics',
      type: 'analytics',
      metrics: [
        { label: 'Revenue', value: '$10M', trend: 'up' },
        { label: 'Employees', value: '150', trend: 'up' },
        { label: 'Growth', value: '25%', trend: 'up' }
      ]
    },
    {
      title: 'Contact',
      type: 'contact-card',
      name: 'John Smith',
      role: 'CEO',
      email: 'john@acme.com',
      phone: '+1 555-0123'
    }
  ]
};
\`\`\`

## Support

- **Documentation**: You're looking at it!
- **GitHub**: [github.com/anthropic/osi-cards](https://github.com/anthropic/osi-cards)
- **Issues**: Report bugs or request features on GitHub

Happy coding! 🎉
`;

@Component({
  selector: 'app-getting-started-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GettingStartedPageComponent {
  content = pageContent;
}

export default GettingStartedPageComponent;
