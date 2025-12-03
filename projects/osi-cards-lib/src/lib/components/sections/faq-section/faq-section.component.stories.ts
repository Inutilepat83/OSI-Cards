/**
 * Storybook Stories for FaqSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { TestBuilders } from '../../../testing/test-data-builders';
import { FaqSectionComponent } from './faq-section.component';

const meta: Meta<FaqSectionComponent> = {
  title: 'Sections/FAQSection',
  component: FaqSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'FAQ section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<FaqSectionComponent>;

// Product FAQ
export const ProductFAQ: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Frequently Asked Questions')
      .withType('faq')
      .withDescription('Common questions about OSI Cards')
      .withItems([
        {
          title: 'What is OSI Cards?',
          description:
            'OSI Cards is an enterprise-grade card generation platform that enables dynamic, customizable card layouts with streaming capabilities and real-time updates.',
        },
        {
          title: 'How much does it cost?',
          description:
            'Pricing starts at $29/month for the Starter plan, $99/month for Professional, and $299/month for Enterprise. Custom pricing available for large organizations.',
        },
        {
          title: 'Is there a free trial?',
          description:
            'Yes! We offer a 14-day free trial with full access to all features. No credit card required.',
        },
        {
          title: 'Can I integrate with my existing systems?',
          description:
            'Absolutely. OSI Cards provides a comprehensive REST API, webhooks, and pre-built integrations with popular platforms like Salesforce, HubSpot, and Slack.',
        },
        {
          title: 'What kind of support do you provide?',
          description:
            'All plans include email support. Professional and Enterprise plans include priority support, dedicated success managers, and 24/7 emergency support.',
        },
      ])
      .build(),
  },
};

// Technical FAQ
export const TechnicalFAQ: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Technical Questions')
      .withType('faq')
      .withItems([
        {
          title: 'What technologies does OSI Cards use?',
          description:
            'Built with Angular 18+, TypeScript, RxJS, and Web Workers for optimal performance. Supports all modern browsers.',
        },
        {
          title: 'Is it mobile-responsive?',
          description:
            'Yes, all cards automatically adapt to screen sizes from mobile phones to large desktop displays.',
        },
        {
          title: 'Can I self-host?',
          description:
            'Enterprise customers can choose between cloud hosting or on-premise deployment.',
        },
        {
          title: 'What about performance?',
          description:
            'OSI Cards uses virtual scrolling, lazy loading, and Web Workers to maintain 60 FPS even with large datasets.',
        },
      ])
      .build(),
  },
};

// Billing FAQ
export const BillingFAQ: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Billing & Payment')
      .withType('faq')
      .withItems([
        {
          title: 'What payment methods do you accept?',
          description:
            'We accept all major credit cards (Visa, Mastercard, Amex, Discover), PayPal, and wire transfers for Enterprise customers.',
        },
        {
          title: 'Can I change plans anytime?',
          description:
            'Yes, you can upgrade or downgrade your plan at any time. Changes are prorated.',
        },
        {
          title: 'What is your refund policy?',
          description:
            "We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.",
        },
        {
          title: 'Do you offer discounts for non-profits?',
          description:
            'Yes, we provide 50% discount for qualified non-profit organizations and educational institutions.',
        },
      ])
      .build(),
  },
};

// Security FAQ
export const SecurityFAQ: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Security & Privacy')
      .withType('faq')
      .withItems([
        {
          title: 'How is my data secured?',
          description:
            'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We use industry-standard security practices.',
        },
        {
          title: 'Are you GDPR compliant?',
          description:
            'Yes, we are fully GDPR compliant and provide data processing agreements (DPAs) for all customers.',
        },
        {
          title: 'Do you perform security audits?',
          description:
            'We conduct quarterly security audits and annual penetration testing by third-party security firms.',
        },
        {
          title: 'Where is data stored?',
          description:
            'Data is stored in SOC 2 Type II certified data centers in the US, EU, and Asia. You can choose your region.',
        },
      ])
      .build(),
  },
};

// Getting Started FAQ
export const GettingStartedFAQ: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Getting Started')
      .withType('faq')
      .withItems([
        {
          title: 'How do I create my first card?',
          description:
            'Simply log in, click "Create Card", choose a template, and customize it using our visual editor. Cards can be generated in seconds.',
        },
        {
          title: 'Do I need coding skills?',
          description:
            'No coding required! Our visual editor makes it easy for anyone. Developers can use our API for advanced customization.',
        },
        {
          title: 'Can I import existing data?',
          description:
            'Yes, you can import data from CSV, JSON, or connect directly to your databases and APIs.',
        },
      ])
      .build(),
  },
};

// Short FAQ
export const ShortFAQ: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Quick Answers')
      .withType('faq')
      .withItems([
        { title: 'Free trial?', description: 'Yes, 14 days.' },
        { title: 'Cancel anytime?', description: 'Yes, no contracts.' },
        { title: 'Money-back guarantee?', description: 'Yes, 30 days.' },
      ])
      .build(),
  },
};
