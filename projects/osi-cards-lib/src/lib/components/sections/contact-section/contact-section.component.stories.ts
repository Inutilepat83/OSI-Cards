/**
 * Storybook Stories for ContactSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { ContactSectionComponent } from './contact-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<ContactSectionComponent> = {
  title: 'Sections/ContactSection',
  component: ContactSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'Contact section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<ContactSectionComponent>;

// Business contact
export const BusinessContact: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Primary Contact')
      .withType('contact')
      .withFields([
        { label: 'Name', value: 'Sarah Johnson' },
        { label: 'Title', value: 'Account Executive' },
        { label: 'Company', value: 'Tech Solutions Inc.' },
        { label: 'Email', value: 'sarah.johnson@techsolutions.com' },
        { label: 'Phone', value: '+1 (555) 123-4567' },
        { label: 'Location', value: 'San Francisco, CA' },
      ])
      .build(),
  },
};

// Executive contact
export const ExecutiveContact: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Executive Team')
      .withType('contact')
      .withItems([
        {
          title: 'Michael Chen',
          description: 'Chief Executive Officer',
          email: 'michael.chen@company.com',
          phone: '+1 (555) 100-0001',
        },
        {
          title: 'Jennifer Martinez',
          description: 'Chief Technology Officer',
          email: 'jennifer.martinez@company.com',
          phone: '+1 (555) 100-0002',
        },
        {
          title: 'David Kim',
          description: 'Chief Financial Officer',
          email: 'david.kim@company.com',
          phone: '+1 (555) 100-0003',
        },
      ])
      .build(),
  },
};

// Sales team
export const SalesTeam: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Sales Team')
      .withType('contact')
      .withItems([
        {
          title: 'Alex Rodriguez',
          description: 'Sales Director - West Coast',
          email: 'alex.r@company.com',
          phone: '+1 (555) 200-0001',
        },
        {
          title: 'Emily Watson',
          description: 'Sales Manager - Enterprise',
          email: 'emily.w@company.com',
          phone: '+1 (555) 200-0002',
        },
        {
          title: 'James Taylor',
          description: 'Account Executive - SMB',
          email: 'james.t@company.com',
          phone: '+1 (555) 200-0003',
        },
      ])
      .build(),
  },
};

// Support contacts
export const SupportContacts: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Customer Support')
      .withType('contact')
      .withFields([
        { label: 'Email', value: 'support@company.com' },
        { label: 'Phone', value: '1-800-SUPPORT' },
        { label: 'Hours', value: '24/7 Available' },
        { label: 'Live Chat', value: 'Available on website' },
        { label: 'Emergency', value: '+1 (555) 911-HELP' },
      ])
      .build(),
  },
};

// Office locations
export const OfficeLocations: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Global Offices')
      .withType('contact')
      .withItems([
        {
          title: 'San Francisco HQ',
          description: '123 Market Street, San Francisco, CA 94103',
          phone: '+1 (415) 555-0100',
          email: 'sf@company.com',
        },
        {
          title: 'New York Office',
          description: '456 Broadway, New York, NY 10013',
          phone: '+1 (212) 555-0200',
          email: 'nyc@company.com',
        },
        {
          title: 'London Office',
          description: '789 Oxford Street, London W1D 2HG, UK',
          phone: '+44 20 7123 4567',
          email: 'london@company.com',
        },
      ])
      .build(),
  },
};

// Emergency contacts
export const EmergencyContacts: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Emergency Contacts')
      .withType('contact')
      .withFields([
        { label: 'Security', value: '+1 (555) 911-SAFE', status: 'active' },
        { label: 'IT Support', value: '+1 (555) 911-TECH', status: 'active' },
        { label: 'Facilities', value: '+1 (555) 911-HELP', status: 'active' },
        { label: 'Available', value: '24/7/365', status: 'active' },
      ])
      .build(),
  },
};

// Minimal contact
export const Minimal: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Contact')
      .withType('contact')
      .withField({ label: 'Email', value: 'contact@example.com' })
      .build(),
  },
};

// Contact with social media
export const WithSocialMedia: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Connect With Us')
      .withType('contact')
      .withFields([
        { label: 'Email', value: 'hello@company.com' },
        { label: 'Twitter', value: '@company' },
        { label: 'LinkedIn', value: 'company' },
        { label: 'GitHub', value: 'github.com/company' },
      ])
      .build(),
  },
};



