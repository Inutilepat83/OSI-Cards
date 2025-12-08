/**
 * Storybook Stories for QuotationSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { QuotationSectionComponent } from './quotation-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<QuotationSectionComponent> = {
  title: 'Sections/QuotationSection',
  component: QuotationSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'Quotation section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<QuotationSectionComponent>;

// Inspirational quote
export const InspirationalQuote: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Inspiration')
      .withType('quotation')
      .withDescription('"The only way to do great work is to love what you do."')
      .withFields([
        { label: 'Author', value: 'Steve Jobs' },
        { label: 'Context', value: 'Stanford Commencement Speech, 2005' },
      ])
      .build(),
  },
};

// Customer testimonial
export const CustomerTestimonial: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('What Our Customers Say')
      .withType('quotation')
      .withDescription(
        '"OSI Cards transformed how we present data to our clients. The streaming feature creates an engaging experience that sets us apart from competitors."'
      )
      .withFields([
        { label: 'Customer', value: 'Sarah Johnson' },
        { label: 'Company', value: 'Tech Solutions Inc.' },
        { label: 'Title', value: 'VP of Product' },
        { label: 'Industry', value: 'SaaS' },
      ])
      .build(),
  },
};

// Executive quote
export const ExecutiveQuote: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Message from CEO')
      .withType('quotation')
      .withDescription(
        '"We\'re building the future of dynamic content delivery. Our mission is to make beautiful, performant card layouts accessible to everyone."'
      )
      .withFields([
        { label: 'Speaker', value: 'Michael Chen' },
        { label: 'Position', value: 'CEO & Co-Founder' },
        { label: 'Date', value: 'December 2025' },
      ])
      .build(),
  },
};

// Technical quote
export const TechnicalQuote: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Technical Excellence')
      .withType('quotation')
      .withDescription(
        '"Code is poetry written in logic. Every line should serve a purpose, every function should tell a story."'
      )
      .withFields([
        { label: 'Author', value: 'Anonymous Developer' },
        { label: 'Source', value: 'Clean Code Principles' },
      ])
      .build(),
  },
};

// Review quote
export const ReviewQuote: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Industry Recognition')
      .withType('quotation')
      .withDescription(
        '"OSI Cards represents a significant advancement in web component architecture. Its performance optimizations and developer experience set a new standard."'
      )
      .withFields([
        { label: 'Publication', value: 'TechCrunch' },
        { label: 'Author', value: 'Jane Smith, Tech Reporter' },
        { label: 'Date', value: 'November 2025' },
        { label: 'Rating', value: '5/5 stars' },
      ])
      .build(),
  },
};

// Team quote
export const TeamQuote: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Team Philosophy')
      .withType('quotation')
      .withDescription(
        '"Together we achieve more. Every team member brings unique perspectives that make our product better."'
      )
      .withFields([{ label: 'Source', value: 'Company Values' }])
      .build(),
  },
};

// Simple quote
export const SimpleQuote: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Quote')
      .withType('quotation')
      .withDescription('"Innovation distinguishes between a leader and a follower."')
      .withField({ label: 'Author', value: 'Steve Jobs' })
      .build(),
  },
};

// Minimal quote
export const Minimal: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withType('quotation')
      .withDescription('"Stay hungry, stay foolish."')
      .build(),
  },
};



