/**
 * Storybook Stories for TimelineSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { TimelineSectionComponent } from './timeline-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<TimelineSectionComponent> = {
  title: 'Sections/TimelineSection',
  component: TimelineSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'Timeline section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<TimelineSectionComponent>;

// Company timeline
export const CompanyTimeline: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Company History')
      .withType('timeline')
      .withItems([
        {
          title: 'Company Founded',
          description: 'Started with a vision to transform the industry',
          date: '2020-01-15',
        },
        {
          title: 'Series A Funding',
          description: 'Raised $5M to expand operations',
          date: '2020-08-20',
        },
        {
          title: 'Product Launch',
          description: 'Released version 1.0 to the public',
          date: '2021-03-10',
        },
        {
          title: 'Reached 10K Users',
          description: 'Major milestone in user growth',
          date: '2022-06-15',
        },
        {
          title: 'International Expansion',
          description: 'Opened offices in Europe and Asia',
          date: '2023-11-01',
        },
      ])
      .build(),
  },
};

// Project timeline
export const ProjectTimeline: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Project Milestones')
      .withType('timeline')
      .withItems([
        {
          title: 'Kickoff',
          date: '2025-01-01',
          status: 'completed',
        },
        {
          title: 'Design Phase',
          date: '2025-02-15',
          status: 'completed',
        },
        {
          title: 'Development Sprint 1',
          date: '2025-03-01',
          status: 'in-progress',
        },
        {
          title: 'Testing & QA',
          date: '2025-04-15',
          status: 'pending',
        },
        {
          title: 'Production Launch',
          date: '2025-05-01',
          status: 'pending',
        },
      ])
      .build(),
  },
};

// Personal timeline
export const PersonalTimeline: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Career History')
      .withType('timeline')
      .withItems([
        {
          title: 'Software Engineer at Tech Corp',
          description: 'Full-stack development, led team of 5',
          date: '2018-06',
        },
        {
          title: 'Senior Engineer at Startup Inc',
          description: 'Architecture design, microservices',
          date: '2020-03',
        },
        {
          title: 'Tech Lead at Innovation Labs',
          description: 'Team leadership, technical strategy',
          date: '2022-09',
        },
      ])
      .build(),
  },
};

// Recent events
export const RecentEvents: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Recent Activity')
      .withType('timeline')
      .withItems([
        {
          title: 'Code deployed to production',
          date: '2025-12-03T14:30:00',
        },
        {
          title: 'Pull request merged',
          date: '2025-12-03T12:15:00',
        },
        {
          title: 'Tests passed',
          date: '2025-12-03T11:45:00',
        },
      ])
      .build(),
  },
};

// Minimal timeline
export const Minimal: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Timeline')
      .withType('timeline')
      .withItems([
        { title: 'Event 1', date: '2025-01-01' },
        { title: 'Event 2', date: '2025-06-01' },
      ])
      .build(),
  },
};

// Empty timeline
export const Empty: Story = {
  args: {
    section: TestBuilders.Section.create().withTitle('No Events').withType('timeline').build(),
  },
};



