/**
 * Storybook Stories for ListSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { ListSectionComponent } from './list-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<ListSectionComponent> = {
  title: 'Sections/ListSection',
  component: ListSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'List section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<ListSectionComponent>;

// Basic list
export const Basic: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Key Features')
      .asList()
      .build(),
  },
};

// List with many items
export const ManyItems: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Product Features')
      .withType('list')
      .withItems([
        { title: 'Real-time collaboration' },
        { title: 'Advanced analytics dashboard' },
        { title: 'Customizable workflows' },
        { title: 'Secure data encryption' },
        { title: 'Mobile responsive design' },
        { title: 'API integrations' },
        { title: '24/7 customer support' },
        { title: 'Automated backups' },
        { title: 'Role-based permissions' },
        { title: 'Activity tracking' },
      ])
      .build(),
  },
};

// List with icons
export const WithIcons: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Benefits')
      .withType('list')
      .withItems([
        { title: 'Increased productivity', icon: 'zap' },
        { title: 'Cost reduction', icon: 'dollar-sign' },
        { title: 'Better collaboration', icon: 'users' },
        { title: 'Enhanced security', icon: 'shield' },
        { title: 'Scalable infrastructure', icon: 'trending-up' },
      ])
      .build(),
  },
};

// List with status
export const WithStatus: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Project Tasks')
      .withType('list')
      .withItems([
        { title: 'Design mockups', status: 'completed' },
        { title: 'Frontend development', status: 'in-progress' },
        { title: 'Backend API', status: 'in-progress' },
        { title: 'Testing', status: 'pending' },
        { title: 'Deployment', status: 'pending' },
      ])
      .build(),
  },
};

// List with descriptions
export const WithDescriptions: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Services')
      .withType('list')
      .withItems([
        {
          title: 'Consulting',
          description: 'Expert guidance on architecture and implementation',
        },
        {
          title: 'Development',
          description: 'Full-stack application development services',
        },
        {
          title: 'Support',
          description: '24/7 technical support and maintenance',
        },
      ])
      .build(),
  },
};

// List with values
export const WithValues: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Pricing Tiers')
      .withType('list')
      .withItems([
        { title: 'Starter', value: '$29/month' },
        { title: 'Professional', value: '$99/month' },
        { title: 'Enterprise', value: '$299/month' },
      ])
      .build(),
  },
};

// Empty list
export const Empty: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('No Items')
      .withType('list')
      .build(),
  },
};

// Single item
export const SingleItem: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Single Item')
      .withType('list')
      .withItem({ title: 'One item only' })
      .build(),
  },
};

// Numbered list
export const NumberedList: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Installation Steps')
      .withType('list')
      .withItems([
        { title: 'Install Node.js (v18 or higher)' },
        { title: 'Clone the repository' },
        { title: 'Run npm install' },
        { title: 'Configure environment variables' },
        { title: 'Run npm start' },
      ])
      .build(),
  },
};

