/**
 * Storybook Stories for FinancialsSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { FinancialsSectionComponent } from './financials-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<FinancialsSectionComponent> = {
  title: 'Sections/FinancialsSection',
  component: FinancialsSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'Financials section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<FinancialsSection Component>;

// Quarterly results
export const QuarterlyResults: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Q4 2025 Financial Results')
      .withType('financials')
      .withDescription('Strong performance across all metrics')
      .withFields([
        { label: 'Revenue', value: '$125.5M', change: '+35%' },
        { label: 'Net Income', value: '$28.3M', change: '+42%' },
        { label: 'EBITDA', value: '$45.2M', change: '+38%' },
        { label: 'EPS', value: '$2.15', change: '+40%' },
        { label: 'Gross Margin', value: '68%', change: '+2pp' },
        { label: 'Operating Margin', value: '36%', change: '+3pp' },
      ])
      .build(),
  },
};

// Annual summary
export const AnnualSummary: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('2025 Annual Financial Summary')
      .withType('financials')
      .withFields([
        { label: 'Total Revenue', value: '$450M' },
        { label: 'YoY Growth', value: '+45%', status: 'active' },
        { label: 'Annual Recurring Revenue (ARR)', value: '$380M' },
        { label: 'Customer Lifetime Value', value: '$125K' },
        { label: 'Customer Acquisition Cost', value: '$8.5K' },
        { label: 'Net Revenue Retention', value: '125%' },
        { label: 'Cash Position', value: '$95M' },
        { label: 'Burn Rate', value: '$2.5M/month' },
      ])
      .build(),
  },
};

// SaaS metrics
export const SaaSMetrics: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Key SaaS Metrics')
      .withType('financials')
      .withDescription('December 2025')
      .withFields([
        { label: 'Monthly Recurring Revenue (MRR)', value: '$3.2M', change: '+12%' },
        { label: 'Annual Run Rate', value: '$38.4M' },
        { label: 'Churn Rate', value: '2.1%', status: 'active' },
        { label: 'Expansion Revenue', value: '$450K', change: '+25%' },
        { label: 'Average Revenue Per Account (ARPA)', value: '$850' },
        { label: 'Months to Payback CAC', value: '11 months' },
      ])
      .build(),
  },
};

// Balance sheet highlights
export const BalanceSheet: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Balance Sheet Highlights')
      .withType('financials')
      .withDescription('As of December 31, 2025')
      .withFields([
        { label: 'Total Assets', value: '$285M' },
        { label: 'Current Assets', value: '$145M' },
        { label: 'Cash & Equivalents', value: '$95M' },
        { label: 'Total Liabilities', value: '$85M' },
        { label: 'Current Liabilities', value: '$42M' },
        { label: 'Shareholders\' Equity', value: '$200M' },
        { label: 'Debt-to-Equity Ratio', value: '0.18' },
      ])
      .build(),
  },
};

// Growth metrics
export const GrowthMetrics: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Growth Metrics')
      .withType('financials')
      .withFields([
        { label: 'Customer Count', value: '3,850', change: '+28%' },
        { label: 'Enterprise Customers', value: '425', change: '+45%' },
        { label: 'Revenue Growth Rate', value: '45% YoY', status: 'active' },
        { label: 'Net Dollar Retention', value: '125%' },
        { label: 'Gross Margin', value: '82%' },
        { label: 'Magic Number', value: '1.2', status: 'active' },
      ])
      .build(),
  },
};

// Department budget
export const DepartmentBudget: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('2026 Department Budget')
      .withType('financials')
      .withFields([
        { label: 'Engineering', value: '$18.5M (40%)' },
        { label: 'Sales & Marketing', value: '$11.6M (25%)' },
        { label: 'Customer Success', value: '$6.9M (15%)' },
        { label: 'Operations', value: '$4.6M (10%)' },
        { label: 'G&A', value: '$4.6M (10%)' },
        { label: 'Total Budget', value: '$46.2M' },
      ])
      .build(),
  },
};

// Simple P&L
export const SimplePL: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('P&L Summary')
      .withType('financials')
      .withFields([
        { label: 'Revenue', value: '$125.5M' },
        { label: 'Cost of Revenue', value: '$22.6M' },
        { label: 'Gross Profit', value: '$102.9M (82%)' },
        { label: 'Operating Expenses', value: '$75.7M' },
        { label: 'Operating Income', value: '$27.2M (22%)' },
        { label: 'Net Income', value: '$24.1M (19%)' },
      ])
      .build(),
  },
};

// Minimal financials
export const Minimal: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Key Metrics')
      .withType('financials')
      .withFields([
        { label: 'Revenue', value: '$125.5M' },
        { label: 'Growth', value: '+35%' },
      ])
      .build(),
  },
};





