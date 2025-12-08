/**
 * Storybook Stories for AICardRendererComponent
 */

import { Meta, StoryObj, applicationConfig } from '@storybook/angular';
import { AICardRendererComponent } from './ai-card-renderer.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TestBuilders } from '../../testing/test-data-builders';

const meta: Meta<AICardRendererComponent> = {
  title: 'Components/AICardRenderer',
  component: AICardRendererComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideAnimations()],
    }),
  ],
  argTypes: {
    cardConfig: {
      description: 'Card configuration object',
      control: 'object',
    },
    isFullscreen: {
      description: 'Whether card is in fullscreen mode',
      control: 'boolean',
    },
    tiltEnabled: {
      description: 'Enable 3D tilt effect on hover',
      control: 'boolean',
    },
    isStreaming: {
      description: 'Whether card is currently streaming',
      control: 'boolean',
    },
    streamingProgress: {
      description: 'Streaming progress (0-1)',
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
    },
  },
};

export default meta;
type Story = StoryObj<AICardRendererComponent>;

// Minimal card
export const MinimalCard: Story = {
  args: {
    cardConfig: TestBuilders.Helpers.createMinimalCard(),
    isFullscreen: false,
    tiltEnabled: true,
    isStreaming: false,
  },
};

// Card with multiple sections
export const MultiSectionCard: Story = {
  args: {
    cardConfig: TestBuilders.Helpers.createCardWithMultipleSections(),
    isFullscreen: false,
    tiltEnabled: true,
    isStreaming: false,
  },
};

// Company card example
export const CompanyCard: Story = {
  args: {
    cardConfig: TestBuilders.Card.create()
      .withTitle('Acme Corporation')
      .withType('company')
      .withDescription('A leading technology company')
      .withSection(
        TestBuilders.Section.create()
          .withTitle('Company Information')
          .asInfo()
          .withField({ label: 'Industry', value: 'Technology' })
          .withField({ label: 'Founded', value: '2020' })
          .withField({ label: 'Employees', value: '500+' })
          .withField({ label: 'Location', value: 'San Francisco, CA' })
          .build()
      )
      .withSection(TestBuilders.Section.create().withTitle('Key Metrics').asAnalytics().build())
      .build(),
    tiltEnabled: true,
  },
};

// Streaming card
export const StreamingCard: Story = {
  args: {
    cardConfig: TestBuilders.Card.create()
      .withTitle('Loading...')
      .withSection(
        TestBuilders.Section.create()
          .withTitle('Loading...')
          .asInfo()
          .withField({ label: '...', value: '...' })
          .build()
      )
      .build(),
    isStreaming: true,
    streamingProgress: 0.5,
    streamingStage: 'streaming',
  },
};

// Large card for performance testing
export const LargeCard: Story = {
  args: {
    cardConfig: TestBuilders.Helpers.createLargeCard(),
    tiltEnabled: false, // Disable tilt for performance
  },
};

// Fullscreen mode
export const FullscreenCard: Story = {
  args: {
    cardConfig: TestBuilders.Helpers.createCardWithMultipleSections(),
    isFullscreen: true,
    tiltEnabled: false,
  },
};

// Without tilt effect
export const NoTiltCard: Story = {
  args: {
    cardConfig: TestBuilders.Helpers.createMinimalCard(),
    tiltEnabled: false,
  },
};

// Empty card
export const EmptyCard: Story = {
  args: {
    cardConfig: undefined,
  },
};

// With custom actions
export const CardWithActions: Story = {
  args: {
    cardConfig: TestBuilders.Card.create()
      .withTitle('Contact Card')
      .withSection(TestBuilders.Section.create().asInfo().build())
      .withAction({
        type: 'mail',
        label: 'Send Email',
        email: 'test@example.com',
      })
      .withAction({
        type: 'website',
        label: 'Visit Website',
        url: 'https://example.com',
      })
      .build(),
  },
};



