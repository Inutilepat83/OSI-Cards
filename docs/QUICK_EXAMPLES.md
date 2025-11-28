# Quick Examples - OSI Cards

Practical, copy-paste ready examples for common use cases.

## Table of Contents

1. [Basic Card](#basic-card)
2. [Company Profile Card](#company-profile-card)
3. [Product Showcase Card](#product-showcase-card)
4. [Event Card](#event-card)
5. [Contact Card](#contact-card)
6. [Analytics Dashboard Card](#analytics-dashboard-card)
7. [Multi-Section Card](#multi-section-card)
8. [Card with Actions](#card-with-actions)
9. [Streaming Card](#streaming-card)
10. [Custom Styling](#custom-styling)

## Basic Card

```typescript
import { Component } from '@angular/core';
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-basic-card',
  standalone: true,
  imports: [AICardRendererComponent],
  template: `
    <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
  `
})
export class BasicCardComponent {
  card: AICardConfig = {
    cardTitle: 'My First Card',
    sections: [
      {
        title: 'Information',
        type: 'info',
        fields: [
          { label: 'Name', value: 'Example' },
          { label: 'Status', value: 'Active' }
        ]
      }
    ]
  };
}
```

## Company Profile Card

```typescript
const companyCard: AICardConfig = {
  cardTitle: 'Acme Corporation',
  cardSubtitle: 'Enterprise Solutions Provider',
  cardType: 'company',
  sections: [
    {
      title: 'Company Overview',
      type: 'overview',
      fields: [
        { label: 'Industry', value: 'Technology' },
        { label: 'Employees', value: '5,000+' },
        { label: 'Founded', value: '2010' },
        { label: 'Headquarters', value: 'San Francisco, CA' }
      ]
    },
    {
      title: 'Financial Performance',
      type: 'analytics',
      fields: [
        { 
          label: 'Annual Revenue', 
          value: '$500M', 
          percentage: 100, 
          trend: 'up',
          change: 22
        },
        { 
          label: 'YoY Growth', 
          value: '22%', 
          percentage: 22, 
          trend: 'up',
          change: 5
        }
      ]
    },
    {
      title: 'Key Contacts',
      type: 'contact-card',
      items: [
        {
          title: 'John Smith',
          description: 'Chief Executive Officer',
          meta: {
            email: 'john@acme.com',
            phone: '+1-555-0100'
          }
        }
      ]
    }
  ],
  actions: [
    {
      label: 'Visit Website',
      type: 'website',
      url: 'https://acme.com',
      variant: 'primary'
    },
    {
      label: 'Contact Sales',
      type: 'mail',
      email: {
        to: 'sales@acme.com',
        subject: 'Inquiry about Acme Solutions',
        body: 'Hello,\n\nI am interested in learning more about your solutions.\n\nBest regards'
      },
      variant: 'secondary'
    }
  ]
};
```

## Product Showcase Card

```typescript
const productCard: AICardConfig = {
  cardTitle: 'CloudSync Pro',
  cardSubtitle: 'Real-time Data Synchronization Platform',
  cardType: 'product',
  sections: [
    {
      title: 'Key Features',
      type: 'product',
      items: [
        {
          title: 'Real-time Sync',
          description: 'Instant data updates across all devices',
          status: 'available'
        },
        {
          title: 'End-to-End Encryption',
          description: 'Military-grade security for your data',
          status: 'available'
        },
        {
          title: 'Auto-scaling',
          description: 'Handles millions of transactions seamlessly',
          status: 'available'
        }
      ]
    },
    {
      title: 'Pricing Plans',
      type: 'financials',
      fields: [
        { label: 'Starter', value: '$29/mo', format: 'currency' },
        { label: 'Professional', value: '$99/mo', format: 'currency' },
        { label: 'Enterprise', value: 'Custom', format: 'text' }
      ]
    }
  ],
  actions: [
    {
      label: 'Start Free Trial',
      type: 'website',
      url: 'https://cloudsync.com/trial',
      variant: 'primary'
    }
  ]
};
```

## Event Card

```typescript
const eventCard: AICardConfig = {
  cardTitle: 'Tech Conference 2025',
  cardSubtitle: 'June 15-17, 2025 | San Francisco',
  cardType: 'event',
  sections: [
    {
      title: 'Event Details',
      type: 'info',
      fields: [
        { label: 'Date', value: 'June 15-17, 2025' },
        { label: 'Location', value: 'San Francisco Convention Center' },
        { label: 'Attendees', value: '5,000+' },
        { label: 'Speakers', value: '150+ international experts' }
      ]
    },
    {
      title: 'Schedule',
      type: 'event',
      items: [
        {
          title: 'Opening Keynote',
          description: '9:00 AM - Main Hall',
          status: 'scheduled',
          meta: {
            time: '09:00',
            location: 'Main Hall'
          }
        },
        {
          title: 'Workshop Track',
          description: '10:30 AM - Multiple venues',
          status: 'scheduled',
          meta: {
            time: '10:30',
            location: 'Workshop Rooms'
          }
        }
      ]
    }
  ],
  actions: [
    {
      label: 'Register Now',
      type: 'website',
      url: 'https://techconf.com/register',
      variant: 'primary'
    }
  ]
};
```

## Contact Card

```typescript
const contactCard: AICardConfig = {
  cardTitle: 'John Smith',
  cardSubtitle: 'Chief Executive Officer',
  cardType: 'contact',
  sections: [
    {
      title: 'Contact Information',
      type: 'contact-card',
      items: [
        {
          title: 'John Smith',
          description: 'CEO at Acme Corporation',
          meta: {
            email: 'john@acme.com',
            phone: '+1-555-0100',
            role: 'Chief Executive Officer',
            company: 'Acme Corporation'
          }
        }
      ]
    },
    {
      title: 'Social Media',
      type: 'social-media',
      items: [
        {
          title: 'LinkedIn',
          description: 'Professional network',
          meta: {
            platform: 'LinkedIn',
            url: 'https://linkedin.com/in/johnsmith'
          }
        }
      ]
    }
  ],
  actions: [
    {
      label: 'Send Email',
      type: 'mail',
      email: {
        to: 'john@acme.com',
        subject: 'Hello from OSI Cards',
        body: 'Hi John,\n\nI wanted to reach out...'
      },
      variant: 'primary'
    }
  ]
};
```

## Analytics Dashboard Card

```typescript
const analyticsCard: AICardConfig = {
  cardTitle: 'Q4 2024 Performance',
  cardSubtitle: 'Sales Dashboard',
  sections: [
    {
      title: 'Revenue Metrics',
      type: 'analytics',
      fields: [
        {
          label: 'Total Revenue',
          value: '$2.5M',
          percentage: 100,
          trend: 'up',
          change: 18,
          format: 'currency'
        },
        {
          label: 'Growth Rate',
          value: '35%',
          percentage: 35,
          trend: 'up',
          change: 5,
          format: 'percentage'
        },
        {
          label: 'Churn Rate',
          value: '2.1%',
          percentage: 2.1,
          trend: 'down',
          change: -0.3,
          format: 'percentage'
        }
      ]
    },
    {
      title: 'Sales Chart',
      type: 'chart',
      meta: {
        chartType: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr'],
          datasets: [{
            data: [100, 120, 115, 135]
          }]
        }
      }
    }
  ]
};
```

## Multi-Section Card

```typescript
const multiSectionCard: AICardConfig = {
  cardTitle: 'Complete Company Profile',
  cardSubtitle: 'Comprehensive business intelligence',
  sections: [
    {
      title: 'Company Info',
      type: 'info',
      fields: [
        { label: 'Industry', value: 'Technology' },
        { label: 'Employees', value: '250' },
        { label: 'Founded', value: '2010' }
      ]
    },
    {
      title: 'Key Metrics',
      type: 'analytics',
      fields: [
        { label: 'Revenue', value: 5000000, change: 15, trend: 'up' }
      ]
    },
    {
      title: 'Products',
      type: 'product',
      items: [
        { title: 'Product A', description: 'Description' },
        { title: 'Product B', description: 'Description' }
      ]
    },
    {
      title: 'News',
      type: 'news',
      items: [
        {
          title: 'Latest News',
          description: 'Company announcement',
          meta: {
            source: 'TechCrunch',
            publishedAt: '2025-01-15'
          }
        }
      ]
    }
  ]
};
```

## Card with Actions

```typescript
const cardWithActions: AICardConfig = {
  cardTitle: 'Action Card Example',
  sections: [
    {
      title: 'Information',
      type: 'info',
      fields: [
        { label: 'Status', value: 'Active' }
      ]
    }
  ],
  actions: [
    {
      label: 'Primary Action',
      type: 'website',
      url: 'https://example.com',
      variant: 'primary',
      icon: 'external-link'
    },
    {
      label: 'Secondary Action',
      type: 'website',
      url: 'https://example.com/docs',
      variant: 'secondary',
      icon: 'book'
    },
    {
      label: 'Send Email',
      type: 'mail',
      email: {
        to: 'contact@example.com',
        subject: 'Inquiry',
        body: 'Hello...'
      },
      variant: 'secondary',
      icon: 'mail'
    },
    {
      label: 'Ask Agent',
      type: 'agent',
      agentId: 'sales-agent',
      variant: 'ghost',
      icon: 'user'
    }
  ]
};
```

## Streaming Card

```typescript
@Component({
  template: `
    <app-ai-card-renderer
      [cardConfig]="cardConfig"
      [streamingStage]="streamingStage"
      [streamingProgress]="streamingProgress"
      [streamingProgressLabel]="streamingProgressLabel">
    </app-ai-card-renderer>
  `
})
export class StreamingCardComponent {
  cardConfig?: AICardConfig;
  streamingStage: StreamingStage = 'idle';
  streamingProgress = 0;
  streamingProgressLabel = '';

  startStreaming(): void {
    this.streamingStage = 'thinking';
    
    // Simulate streaming
    setTimeout(() => {
      this.streamingStage = 'streaming';
      this.streamingProgress = 0.5;
      this.streamingProgressLabel = 'STREAMING JSON (50%)';
      
      // Update progress
      const interval = setInterval(() => {
        this.streamingProgress += 0.1;
        this.streamingProgressLabel = `STREAMING JSON (${Math.round(this.streamingProgress * 100)}%)`;
        
        if (this.streamingProgress >= 1) {
          clearInterval(interval);
          this.streamingStage = 'complete';
        }
      }, 500);
    }, 2000);
  }
}
```

## Custom Styling

```scss
// Override design tokens
:root {
  --color-brand: #FF7900;
  --card-background: rgba(20, 30, 50, 0.4);
  --card-padding: 1.25rem;
  --card-border-radius: 12px;
}

// Custom card styling
app-ai-card-renderer {
  .ai-card-surface {
    border: 2px solid var(--color-brand);
    box-shadow: 0 8px 32px rgba(255, 121, 0, 0.3);
  }
}
```

## Troubleshooting

### Card Not Rendering

1. Check that `cardConfig` is not null/undefined
2. Verify at least one section is provided
3. Check browser console for errors
4. Ensure styles are imported

### Actions Not Working

1. Verify action type is valid (`website`, `mail`, `agent`, `question`)
2. For `mail` type, ensure `email` object is complete
3. For `website` type, ensure URL starts with `http://` or `https://`
4. Check event handlers are connected

### Styles Not Applied

1. Verify styles are imported: `@import 'osi-cards-lib/styles/_styles';`
2. Check SCSS is configured in `angular.json`
3. Restart dev server after adding styles
4. Check browser DevTools for CSS conflicts

## More Examples

- See [README.md](../README.md) for comprehensive documentation
- See [USAGE.md](../projects/osi-cards-lib/USAGE.md) for advanced usage
- See [IMPORT_EXAMPLE.md](../projects/osi-cards-lib/IMPORT_EXAMPLE.md) for import patterns

