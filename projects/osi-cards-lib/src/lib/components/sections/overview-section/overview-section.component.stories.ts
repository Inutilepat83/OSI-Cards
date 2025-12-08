/**
 * Storybook Stories for OverviewSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { OverviewSectionComponent } from './overview-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<OverviewSectionComponent> = {
  title: 'Sections/OverviewSection',
  component: OverviewSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'Overview section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<OverviewSectionComponent>;

// Company overview
export const CompanyOverview: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Company Overview')
      .withType('overview')
      .withDescription(
        'OSI Cards is a leading enterprise software company specializing in dynamic card generation and data visualization. Founded in 2020, we serve over 3,850 customers worldwide, including Fortune 500 companies.'
      )
      .withFields([
        { label: 'Founded', value: '2020' },
        { label: 'Headquarters', value: 'San Francisco, CA' },
        { label: 'Employees', value: '250+' },
        { label: 'Customers', value: '3,850' },
        { label: 'Industry', value: 'Enterprise Software' },
        { label: 'Revenue', value: '$450M ARR' },
      ])
      .build(),
  },
};

// Product overview
export const ProductOverview: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Product Overview')
      .withType('overview')
      .withDescription(
        'OSI Cards Pro is an enterprise-grade platform for creating dynamic, responsive card layouts with real-time streaming capabilities. Built with Angular 18+ and optimized for performance, it handles large datasets while maintaining 60 FPS.'
      )
      .withFields([
        { label: 'Version', value: '2.0.0' },
        { label: 'Released', value: 'December 2025' },
        { label: 'Technology', value: 'Angular 18+, TypeScript' },
        { label: 'Performance', value: '60 FPS guaranteed' },
        { label: 'Deployment', value: 'Cloud or On-premise' },
      ])
      .build(),
  },
};

// Project overview
export const ProjectOverview: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Project Overview')
      .withType('overview')
      .withDescription(
        'Enterprise CRM Implementation - A comprehensive customer relationship management system rollout across 15 departments, including data migration, training, and integration with existing systems.'
      )
      .withFields([
        { label: 'Client', value: 'Tech Corp' },
        { label: 'Timeline', value: 'January - June 2026' },
        { label: 'Budget', value: '$2.5M' },
        { label: 'Team Size', value: '12 people' },
        { label: 'Status', value: 'In Progress', status: 'active' },
      ])
      .build(),
  },
};

// Event overview
export const EventOverview: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('TechConnect 2026 Overview')
      .withType('overview')
      .withDescription(
        'Our annual technology conference brings together 5,000+ industry leaders, innovators, and developers for three days of keynotes, workshops, and networking.'
      )
      .withFields([
        { label: 'Dates', value: 'March 15-17, 2026' },
        { label: 'Location', value: 'Moscone Center, San Francisco' },
        { label: 'Expected Attendees', value: '5,000+' },
        { label: 'Speakers', value: '120+' },
        { label: 'Sessions', value: '200+' },
        { label: 'Sponsors', value: '50+ companies' },
      ])
      .build(),
  },
};

// Report overview
export const ReportOverview: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Q4 2025 Performance Report')
      .withType('overview')
      .withDescription(
        'This report provides a comprehensive analysis of Q4 2025 performance across all business units, highlighting key achievements, challenges, and strategic initiatives for the coming quarter.'
      )
      .withFields([
        { label: 'Period', value: 'Oct 1 - Dec 31, 2025' },
        { label: 'Report Date', value: 'January 5, 2026' },
        { label: 'Author', value: 'Finance Team' },
        { label: 'Distribution', value: 'Executive Leadership' },
        { label: 'Classification', value: 'Confidential' },
      ])
      .build(),
  },
};

// Service overview
export const ServiceOverview: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Managed Cloud Services Overview')
      .withType('overview')
      .withDescription(
        'Enterprise-grade cloud infrastructure management with 24/7 monitoring, automatic scaling, daily backups, and dedicated support.'
      )
      .withFields([
        { label: 'Service Type', value: 'Infrastructure Management' },
        { label: 'Uptime SLA', value: '99.99%' },
        { label: 'Support', value: '24/7/365' },
        { label: 'Monitoring', value: 'Real-time' },
        { label: 'Backups', value: 'Daily + on-demand' },
      ])
      .build(),
  },
};

// Team overview
export const TeamOverview: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Engineering Team Overview')
      .withType('overview')
      .withDescription(
        'Our engineering team consists of 85 talented developers, designers, and DevOps engineers working across frontend, backend, and infrastructure. We practice agile development with two-week sprints.'
      )
      .withFields([
        { label: 'Team Size', value: '85 members' },
        { label: 'Frontend Engineers', value: '35' },
        { label: 'Backend Engineers', value: '32' },
        { label: 'DevOps', value: '12' },
        { label: 'QA Engineers', value: '6' },
        { label: 'Methodology', value: 'Agile/Scrum' },
      ])
      .build(),
  },
};

// Minimal overview
export const Minimal: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Overview')
      .withType('overview')
      .withDescription('A brief overview of the topic at hand.')
      .build(),
  },
};
