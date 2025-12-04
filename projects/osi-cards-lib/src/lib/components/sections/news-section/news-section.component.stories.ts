/**
 * Storybook Stories for NewsSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { NewsSectionComponent } from './news-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<NewsSectionComponent> = {
  title: 'Sections/NewsSection',
  component: NewsSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'News section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<NewsSectionComponent>;

// Company news
export const CompanyNews: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Latest Company News')
      .withType('news')
      .withItems([
        {
          title: 'Q4 2025 Financial Results Exceed Expectations',
          description: 'Company reports 35% YoY revenue growth with strong market expansion',
          date: '2025-12-01',
          source: 'PR Newswire',
        },
        {
          title: 'New Product Launch: OSI Cards Pro 2.0',
          description: 'Enterprise features and AI-powered card generation now available',
          date: '2025-11-28',
          source: 'TechCrunch',
        },
        {
          title: 'Strategic Partnership with Innovation Labs',
          description: 'Collaboration to accelerate product development and market reach',
          date: '2025-11-25',
          source: 'Business Wire',
        },
      ])
      .build(),
  },
};

// Industry news
export const IndustryNews: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Industry Headlines')
      .withType('news')
      .withItems([
        {
          title: 'AI Adoption Reaches 80% in Enterprise Software',
          description: 'New survey shows rapid integration of AI capabilities across industries',
          date: '2025-12-02',
          source: 'Reuters',
        },
        {
          title: 'Cloud Computing Market Grows 25% in 2025',
          description: 'Multi-cloud strategies dominate as companies seek flexibility',
          date: '2025-11-30',
          source: 'Gartner',
        },
        {
          title: 'Cybersecurity Spending to Hit $200B in 2026',
          description: 'Organizations prioritize security amid increasing threats',
          date: '2025-11-27',
          source: 'Forrester',
        },
      ])
      .build(),
  },
};

// Product updates
export const ProductUpdates: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Product Updates')
      .withType('news')
      .withItems([
        {
          title: 'Version 2.1.0 Released',
          description: 'New features: dark mode, real-time collaboration, enhanced analytics',
          date: '2025-12-03',
        },
        {
          title: 'Performance Improvements in Latest Update',
          description: '40% faster rendering with optimized layout engine',
          date: '2025-11-20',
        },
        {
          title: 'Mobile App Now Available',
          description: 'iOS and Android apps launched with full feature parity',
          date: '2025-11-15',
        },
      ])
      .build(),
  },
};

// Press releases
export const PressReleases: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Press Releases')
      .withType('news')
      .withItems([
        {
          title: 'Company Secures $50M Series B Funding',
          description: 'Investment to fuel global expansion and product innovation',
          date: '2025-11-10',
          source: 'Company PR',
          link: '#',
        },
        {
          title: 'Award: Best SaaS Product of the Year',
          description: 'Recognized for innovation and customer satisfaction',
          date: '2025-10-15',
          source: 'Tech Awards',
          link: '#',
        },
      ])
      .build(),
  },
};

// Single news item
export const SingleItem: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Breaking News')
      .withType('news')
      .withItem({
        title: 'Major Announcement Coming Tomorrow',
        description: 'Stay tuned for exciting updates',
        date: '2025-12-03',
      })
      .build(),
  },
};

// Minimal news
export const Minimal: Story = {
  args: {
    section: TestBuilders.Section.create().withTitle('News').withType('news').build(),
  },
};
