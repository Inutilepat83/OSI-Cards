/**
 * Storybook Stories for ProductSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { ProductSectionComponent } from './product-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<ProductSectionComponent> = {
  title: 'Sections/ProductSection',
  component: ProductSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'Product section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<ProductSectionComponent>;

// Software product
export const SoftwareProduct: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('OSI Cards Pro')
      .withType('product')
      .withDescription('Enterprise-grade card generation platform')
      .withFields([
        { label: 'Category', value: 'Software' },
        { label: 'Version', value: '2.0.0' },
        { label: 'Price', value: '$299/month' },
        { label: 'License', value: 'Commercial' },
        { label: 'Status', value: 'Available', status: 'active' },
      ])
      .withItems([
        { title: 'Unlimited cards' },
        { title: 'Real-time collaboration' },
        { title: 'Advanced analytics' },
        { title: 'Priority support' },
        { title: 'Custom branding' },
      ])
      .build(),
  },
};

// Physical product
export const PhysicalProduct: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Smart Display Monitor')
      .withType('product')
      .withDescription('4K Ultra HD monitor with AI-powered features')
      .withFields([
        { label: 'Brand', value: 'TechVision' },
        { label: 'Model', value: 'SD-4000X' },
        { label: 'Price', value: '$899' },
        { label: 'Screen Size', value: '32 inches' },
        { label: 'Resolution', value: '3840 x 2160' },
        { label: 'Availability', value: 'In Stock', status: 'active' },
      ])
      .withItems([
        { title: 'HDR10+ support' },
        { title: 'USB-C connectivity' },
        { title: '165Hz refresh rate' },
        { title: 'Built-in speakers' },
        { title: 'Height adjustable stand' },
      ])
      .build(),
  },
};

// Service product
export const ServiceProduct: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Managed Cloud Services')
      .withType('product')
      .withDescription('Fully managed cloud infrastructure and DevOps')
      .withFields([
        { label: 'Service Type', value: 'Cloud Infrastructure' },
        { label: 'Starting Price', value: '$499/month' },
        { label: 'Setup Time', value: '24 hours' },
        { label: 'Uptime SLA', value: '99.99%' },
      ])
      .withItems([
        { title: '24/7 monitoring' },
        { title: 'Automatic scaling' },
        { title: 'Daily backups' },
        { title: 'Security patches' },
        { title: 'Performance optimization' },
        { title: 'Dedicated support engineer' },
      ])
      .build(),
  },
};

// Product with extensive features
export const FeatureRichProduct: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Enterprise CRM Platform')
      .withType('product')
      .withDescription('Complete customer relationship management solution')
      .withFields([
        { label: 'Edition', value: 'Enterprise' },
        { label: 'Price', value: '$1,999/month' },
        { label: 'Users', value: 'Unlimited' },
        { label: 'Storage', value: '1TB' },
        { label: 'Support', value: '24/7 Priority' },
        { label: 'Deployment', value: 'Cloud or On-premise' },
      ])
      .withItems([
        { title: 'Contact Management' },
        { title: 'Sales Pipeline Tracking' },
        { title: 'Marketing Automation' },
        { title: 'Customer Support Ticketing' },
        { title: 'Advanced Analytics & Reporting' },
        { title: 'Mobile Apps (iOS & Android)' },
        { title: 'API Access' },
        { title: 'Custom Integrations' },
        { title: 'Role-based Permissions' },
        { title: 'Audit Logging' },
      ])
      .build(),
  },
};

// Out of stock product
export const OutOfStock: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Limited Edition Gadget')
      .withType('product')
      .withFields([
        { label: 'Price', value: '$599' },
        { label: 'Status', value: 'Out of Stock', status: 'inactive' },
        { label: 'Expected', value: 'January 2026' },
      ])
      .withItems([{ title: 'Notify me when available' }])
      .build(),
  },
};

// Minimal product
export const Minimal: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Basic Product')
      .withType('product')
      .withField({ label: 'Price', value: '$99' })
      .build(),
  },
};



