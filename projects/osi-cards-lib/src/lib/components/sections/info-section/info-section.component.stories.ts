/**
 * Storybook Stories for InfoSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { InfoSectionComponent } from './info-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<InfoSectionComponent> = {
  title: 'Sections/InfoSection',
  component: InfoSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'Section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<InfoSectionComponent>;

// Basic info section
export const Basic: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Company Information')
      .asInfo()
      .build(),
  },
};

// Info section with many fields
export const ManyFields: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Detailed Information')
      .asInfo()
      .withField({ label: 'Industry', value: 'Technology' })
      .withField({ label: 'Founded', value: '2020' })
      .withField({ label: 'Employees', value: '500+' })
      .withField({ label: 'Revenue', value: '$50M' })
      .withField({ label: 'Location', value: 'San Francisco, CA' })
      .withField({ label: 'Website', value: 'www.example.com' })
      .withField({ label: 'Email', value: 'contact@example.com' })
      .withField({ label: 'Phone', value: '+1 (555) 123-4567' })
      .build(),
  },
};

// Info section with icons
export const WithIcons: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Contact Details')
      .asInfo()
      .withField({ label: 'Email', value: 'contact@example.com', icon: 'mail' })
      .withField({ label: 'Phone', value: '+1 (555) 123-4567', icon: 'phone' })
      .withField({ label: 'Address', value: '123 Main St', icon: 'map-pin' })
      .withField({ label: 'Website', value: 'www.example.com', icon: 'globe' })
      .build(),
  },
};

// Info section with clickable fields
export const ClickableFields: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Links')
      .asInfo()
      .withField({ label: 'Website', value: 'www.example.com', clickable: true })
      .withField({ label: 'LinkedIn', value: 'linkedin.com/company/example', clickable: true })
      .withField({ label: 'Twitter', value: '@example', clickable: true })
      .build(),
  },
};

// Info section with description
export const WithDescription: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('About')
      .withDescription('Comprehensive company information and contact details')
      .asInfo()
      .withField({ label: 'Name', value: 'Acme Corp' })
      .withField({ label: 'Type', value: 'Corporation' })
      .build(),
  },
};

// Empty info section
export const Empty: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('No Data')
      .withType('info')
      .build(),
  },
};

// Minimal single field
export const SingleField: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Simple')
      .asInfo()
      .withField({ label: 'Status', value: 'Active' })
      .build(),
  },
};

