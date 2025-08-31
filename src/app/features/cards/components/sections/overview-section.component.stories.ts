import type { Meta, StoryObj } from '@storybook/angular';
import { OverviewSectionComponent } from './overview-section.component';
import { CardSection } from '../../../../models/card.model';

const meta: Meta<OverviewSectionComponent> = {
  title: 'Sections/OverviewSection',
  component: OverviewSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'The section configuration object',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<OverviewSectionComponent>;

const sampleSection: CardSection = {
  id: 'overview-1',
  title: 'Company Overview',
  type: 'overview',
  fields: [
    {
      id: 'revenue',
      label: 'Annual Revenue',
      value: '$2.5M',
      valueColor: '#10b981',
    },
    {
      id: 'employees',
      label: 'Total Employees',
      value: '45',
    },
    {
      id: 'growth',
      label: 'YoY Growth',
      value: '+15%',
      valueColor: '#059669',
    },
  ],
  items: [
    {
      id: 'item-1',
      title: 'Founded',
      description: 'Established in 2018',
      icon: 'pi-calendar',
    },
    {
      id: 'item-2',
      title: 'Headquarters',
      description: 'San Francisco, CA',
      icon: 'pi-map-marker',
    },
  ],
};

export const Default: Story = {
  args: {
    section: sampleSection,
  },
};

export const WithManyFields: Story = {
  args: {
    section: {
      ...sampleSection,
      fields: [
        ...sampleSection.fields!,
        {
          id: 'market-share',
          label: 'Market Share',
          value: '12%',
          valueColor: '#3b82f6',
        },
        {
          id: 'customers',
          label: 'Active Customers',
          value: '1,250',
        },
      ],
    },
  },
};

export const Minimal: Story = {
  args: {
    section: {
      id: 'minimal-overview',
      title: 'Basic Info',
      type: 'overview',
      fields: [
        {
          id: 'name',
          label: 'Name',
          value: 'Sample Company',
        },
      ],
    },
  },
};
