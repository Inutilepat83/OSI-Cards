/**
 * AI Card Renderer Stories
 *
 * Storybook stories for the AICardRendererComponent
 *
 * These stories demonstrate the various states and configurations
 * of the card renderer component.
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { AICardRendererComponent } from '../components/ai-card-renderer/ai-card-renderer.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import type { AICardConfig, CardSection, CardField, CardAction } from '../models';

/**
 * Sample card configurations for stories
 */
const sampleInfoSection: CardSection = {
  id: 'info-1',
  title: 'Company Information',
  type: 'info',
  fields: [
    { id: 'f1', label: 'Industry', value: 'Technology', icon: '🏢' },
    { id: 'f2', label: 'Founded', value: '2010', icon: '📅' },
    { id: 'f3', label: 'Headquarters', value: 'San Francisco, CA', icon: '📍' },
    { id: 'f4', label: 'Employees', value: '5,000+', icon: '👥', trend: 'up' },
  ],
};

const sampleAnalyticsSection: CardSection = {
  id: 'analytics-1',
  title: 'Performance Metrics',
  type: 'analytics',
  fields: [
    { id: 'a1', label: 'Revenue Growth', value: '25%', percentage: 25, trend: 'up', change: 5.2 },
    { id: 'a2', label: 'Market Share', value: '12%', percentage: 12, trend: 'stable' },
    { id: 'a3', label: 'Customer Satisfaction', value: '4.8/5', percentage: 96, trend: 'up' },
  ],
};

const sampleListSection: CardSection = {
  id: 'list-1',
  title: 'Recent Updates',
  type: 'list',
  items: [
    {
      id: 'i1',
      title: 'Product Launch',
      description: 'New feature released',
      icon: '🚀',
      status: 'completed',
    },
    {
      id: 'i2',
      title: 'Partnership',
      description: 'Strategic alliance formed',
      icon: '🤝',
      status: 'in-progress',
    },
    {
      id: 'i3',
      title: 'Expansion',
      description: 'Opening new offices',
      icon: '🌍',
      status: 'pending',
    },
  ],
};

const sampleContactSection: CardSection = {
  id: 'contact-1',
  title: 'Key Contacts',
  type: 'contact-card',
  fields: [
    {
      id: 'c1',
      label: 'CEO',
      title: 'Jane Smith',
      value: 'Chief Executive Officer',
      email: 'jane@example.com',
      phone: '+1 555 0100',
    },
    {
      id: 'c2',
      label: 'CTO',
      title: 'John Doe',
      value: 'Chief Technology Officer',
      email: 'john@example.com',
    },
  ],
};

const sampleActions: CardAction[] = [
  { id: 'act-1', label: 'View Details', variant: 'primary' },
  { id: 'act-2', label: 'Contact', type: 'mail', variant: 'outline' },
  {
    id: 'act-3',
    label: 'Visit Website',
    type: 'website',
    url: 'https://example.com',
    variant: 'ghost',
  },
];

const completeCard: AICardConfig = {
  id: 'demo-card-1',
  cardTitle: 'Acme Corporation',
  description: 'Leading technology solutions provider',
  sections: [sampleInfoSection, sampleAnalyticsSection, sampleListSection, sampleContactSection],
  actions: sampleActions,
};

const minimalCard: AICardConfig = {
  id: 'minimal-card',
  cardTitle: 'Simple Card',
  sections: [sampleInfoSection],
};

/**
 * Storybook meta configuration
 */
const meta: Meta<AICardRendererComponent> = {
  title: 'Components/AICardRenderer',
  component: AICardRendererComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideAnimations()],
    }),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The AICardRendererComponent is the main component for rendering AI-generated cards.
It supports streaming data, animations, and various section types.

## Features
- Dynamic section rendering
- Streaming state support
- Tilt hover effect
- Fullscreen mode
- Export functionality
- Accessibility compliant

## Usage
\`\`\`typescript
import { AICardRendererComponent } from 'osi-cards-lib';

@Component({
  imports: [AICardRendererComponent],
  template: '<app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>'
})
export class MyComponent {
  card: AICardConfig = { ... };
}
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    cardConfig: {
      description: 'The card configuration object',
      control: 'object',
    },
    isFullscreen: {
      description: 'Whether the card is in fullscreen mode',
      control: 'boolean',
    },
    tiltEnabled: {
      description: 'Enable/disable the tilt hover effect',
      control: 'boolean',
    },
    streamingStage: {
      description: 'Current streaming stage',
      control: 'select',
      options: ['idle', 'thinking', 'streaming', 'complete', 'error', undefined],
    },
    isStreaming: {
      description: 'Boolean flag for streaming animation state',
      control: 'boolean',
    },
    showLoadingByDefault: {
      description: 'Show loading state when no data',
      control: 'boolean',
    },
    loadingTitle: {
      description: 'Custom loading title',
      control: 'text',
    },
    loadingMessages: {
      description: 'Custom loading messages array',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<AICardRendererComponent>;

/**
 * Default card with all sections
 */
export const Default: Story = {
  args: {
    cardConfig: completeCard,
    tiltEnabled: true,
    showLoadingByDefault: false,
  },
};

/**
 * Minimal card with single section
 */
export const Minimal: Story = {
  args: {
    cardConfig: minimalCard,
    tiltEnabled: true,
  },
};

/**
 * Card in loading/thinking state
 */
export const Loading: Story = {
  args: {
    cardConfig: undefined,
    streamingStage: 'thinking',
    showLoadingByDefault: true,
    loadingTitle: 'Generating Card',
  },
};

/**
 * Card in streaming state
 */
export const Streaming: Story = {
  args: {
    cardConfig: {
      ...minimalCard,
      sections: [sampleInfoSection],
    },
    streamingStage: 'streaming',
    isStreaming: true,
  },
};

/**
 * Card with tilt effect disabled
 */
export const NoTilt: Story = {
  args: {
    cardConfig: completeCard,
    tiltEnabled: false,
  },
};

/**
 * Card in fullscreen mode
 */
export const Fullscreen: Story = {
  args: {
    cardConfig: completeCard,
    isFullscreen: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

/**
 * Card with custom loading messages
 */
export const CustomLoadingMessages: Story = {
  args: {
    cardConfig: undefined,
    streamingStage: 'thinking',
    showLoadingByDefault: true,
    loadingTitle: 'Analyzing Data',
    loadingMessages: [
      'Crunching numbers...',
      'Analyzing patterns...',
      'Building insights...',
      'Almost there...',
    ],
  },
};

/**
 * Card with analytics focus
 */
export const AnalyticsDashboard: Story = {
  args: {
    cardConfig: {
      id: 'analytics-card',
      cardTitle: 'Performance Dashboard',
      sections: [
        sampleAnalyticsSection,
        {
          id: 'financials',
          title: 'Financial Overview',
          type: 'financials',
          fields: [
            { id: 'rev', label: 'Revenue', value: '$50M', change: 15, trend: 'up' },
            { id: 'margin', label: 'Margin', value: '18%', change: 3.2, trend: 'up' },
          ],
        },
      ],
    },
  },
};

/**
 * Contact card variant
 */
export const ContactCard: Story = {
  args: {
    cardConfig: {
      id: 'contact-card',
      cardTitle: 'Team Contacts',
      sections: [sampleContactSection],
      actions: [
        { id: 'email', label: 'Send Email', type: 'mail', variant: 'primary' },
        { id: 'call', label: 'Schedule Call', variant: 'outline' },
      ],
    },
  },
};

/**
 * Card with many sections (scroll behavior)
 */
export const ManySections: Story = {
  args: {
    cardConfig: {
      id: 'many-sections',
      cardTitle: 'Comprehensive Overview',
      sections: [
        sampleInfoSection,
        sampleAnalyticsSection,
        sampleListSection,
        sampleContactSection,
        { ...sampleInfoSection, id: 'info-2', title: 'Additional Info' },
        { ...sampleListSection, id: 'list-2', title: 'More Updates' },
      ],
    },
  },
};

/**
 * Card with error state
 */
export const ErrorState: Story = {
  args: {
    cardConfig: undefined,
    streamingStage: 'error',
    showLoadingByDefault: true,
  },
};

/**
 * Empty card (testing edge case)
 */
export const EmptyCard: Story = {
  args: {
    cardConfig: {
      id: 'empty',
      cardTitle: 'Empty Card',
      sections: [],
    },
  },
};
