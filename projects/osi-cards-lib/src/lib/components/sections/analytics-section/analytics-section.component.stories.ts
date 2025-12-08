/**
 * Storybook Stories for AnalyticsSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { AnalyticsSectionComponent } from './analytics-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<AnalyticsSectionComponent> = {
  title: 'Sections/AnalyticsSection',
  component: AnalyticsSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'Analytics section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<AnalyticsSectionComponent>;

// Basic analytics
export const Basic: Story = {
  args: {
    section: TestBuilders.Section.create().withTitle('Key Metrics').asAnalytics().build(),
  },
};

// With trends
export const WithTrends: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Performance Metrics')
      .withType('analytics')
      .withField({
        label: 'Revenue Growth',
        value: '125%',
        percentage: 125,
        trend: 'up' as any,
        change: 25,
      })
      .withField({
        label: 'Customer Churn',
        value: '2.5%',
        percentage: 2.5,
        trend: 'down' as any,
        change: -1.5,
      })
      .withField({
        label: 'Market Share',
        value: '15%',
        percentage: 15,
        trend: 'stable' as any,
      })
      .build(),
  },
};

// High percentages
export const HighPercentages: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Success Metrics')
      .withType('analytics')
      .withField({
        label: 'Customer Satisfaction',
        value: '98%',
        percentage: 98,
        trend: 'up' as any,
      })
      .withField({
        label: 'Product Quality',
        value: '95%',
        percentage: 95,
        trend: 'stable' as any,
      })
      .withField({
        label: 'On-time Delivery',
        value: '92%',
        percentage: 92,
        trend: 'up' as any,
      })
      .build(),
  },
};

// Low percentages
export const LowPercentages: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Areas for Improvement')
      .withType('analytics')
      .withField({
        label: 'Response Time',
        value: '15%',
        percentage: 15,
        trend: 'down' as any,
      })
      .withField({
        label: 'Error Rate',
        value: '5%',
        percentage: 5,
        trend: 'down' as any,
        change: -2,
      })
      .build(),
  },
};

// Mixed trends
export const MixedTrends: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Monthly Overview')
      .withType('analytics')
      .withField({
        label: 'Sales',
        value: '+45%',
        percentage: 45,
        trend: 'up' as any,
        change: 15,
      })
      .withField({
        label: 'Costs',
        value: '-10%',
        percentage: 10,
        trend: 'down' as any,
        change: -10,
      })
      .withField({
        label: 'Profit Margin',
        value: '25%',
        percentage: 25,
        trend: 'stable' as any,
      })
      .withField({
        label: 'Customer Acquisition',
        value: '+30%',
        percentage: 30,
        trend: 'up' as any,
        change: 12,
      })
      .build(),
  },
};

// With performance ratings
export const WithPerformance: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Team Performance')
      .withType('analytics')
      .withField({
        label: 'Productivity',
        value: '85%',
        percentage: 85,
        performance: 'good' as any,
      })
      .withField({
        label: 'Quality',
        value: '92%',
        percentage: 92,
        performance: 'excellent' as any,
      })
      .withField({
        label: 'Efficiency',
        value: '45%',
        percentage: 45,
        performance: 'poor' as any,
      })
      .build(),
  },
};

// Many metrics
export const ManyMetrics: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('All KPIs')
      .withType('analytics')
      .withFields([
        { label: 'Revenue', value: '$2.5M', percentage: 85, trend: 'up' as any },
        { label: 'Profit', value: '$500K', percentage: 65, trend: 'up' as any },
        { label: 'Growth', value: '45%', percentage: 45, trend: 'up' as any },
        { label: 'Retention', value: '92%', percentage: 92, trend: 'stable' as any },
        { label: 'Churn', value: '3%', percentage: 3, trend: 'down' as any },
        { label: 'NPS', value: '72', percentage: 72, trend: 'up' as any },
        { label: 'CSAT', value: '88%', percentage: 88, trend: 'up' as any },
        { label: 'Conversion', value: '12%', percentage: 12, trend: 'stable' as any },
      ])
      .build(),
  },
};

// Zero/low values
export const ZeroValues: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Starting Metrics')
      .withType('analytics')
      .withField({
        label: 'New Feature Adoption',
        value: '0%',
        percentage: 0,
        trend: 'stable' as any,
      })
      .withField({
        label: 'Beta Signups',
        value: '2%',
        percentage: 2,
        trend: 'up' as any,
      })
      .build(),
  },
};



