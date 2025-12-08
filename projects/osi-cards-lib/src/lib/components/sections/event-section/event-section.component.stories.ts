/**
 * Storybook Stories for EventSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { EventSectionComponent } from './event-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<EventSectionComponent> = {
  title: 'Sections/EventSection',
  component: EventSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'Event section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<EventSectionComponent>;

// Conference event
export const Conference: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('TechConnect 2026')
      .withType('event')
      .withDescription('Annual technology conference bringing together industry leaders')
      .withFields([
        { label: 'Date', value: 'March 15-17, 2026' },
        { label: 'Time', value: '9:00 AM - 6:00 PM PST' },
        { label: 'Location', value: 'Moscone Center, San Francisco' },
        { label: 'Venue', value: 'Main Hall, 3rd Floor' },
        { label: 'Capacity', value: '5,000 attendees' },
        { label: 'Registration', value: 'Open', status: 'active' },
        { label: 'Price', value: '$599 (Early Bird)' },
      ])
      .withItems([
        { title: 'Keynote: Future of AI' },
        { title: 'Workshop: Cloud Architecture' },
        { title: 'Panel: Sustainability in Tech' },
        { title: 'Networking Reception' },
      ])
      .build(),
  },
};

// Webinar
export const Webinar: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Product Launch Webinar')
      .withType('event')
      .withDescription('Learn about our latest features and roadmap')
      .withFields([
        { label: 'Date', value: 'December 10, 2025' },
        { label: 'Time', value: '2:00 PM - 3:00 PM EST' },
        { label: 'Format', value: 'Online (Zoom)' },
        { label: 'Duration', value: '60 minutes' },
        { label: 'Registration', value: 'Required', status: 'active' },
        { label: 'Cost', value: 'Free' },
      ])
      .withItems([
        { title: 'Product demo (30 min)' },
        { title: 'Q&A session (20 min)' },
        { title: 'Roadmap preview (10 min)' },
      ])
      .build(),
  },
};

// Workshop
export const Workshop: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Advanced TypeScript Workshop')
      .withType('event')
      .withDescription('Hands-on workshop for experienced developers')
      .withFields([
        { label: 'Date', value: 'January 20, 2026' },
        { label: 'Time', value: '10:00 AM - 4:00 PM' },
        { label: 'Location', value: 'Training Center, Building 5' },
        { label: 'Instructor', value: 'Dr. Jane Smith' },
        { label: 'Level', value: 'Advanced' },
        { label: 'Max Attendees', value: '20' },
        { label: 'Price', value: '$299' },
        { label: 'Status', value: 'Limited Seats', status: 'warning' },
      ])
      .build(),
  },
};

// Meetup
export const Meetup: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('JavaScript Developers Meetup')
      .withType('event')
      .withDescription('Monthly meetup for JS developers in the bay area')
      .withFields([
        { label: 'Date', value: 'Every 2nd Thursday' },
        { label: 'Time', value: '6:30 PM - 9:00 PM' },
        { label: 'Location', value: 'Tech Hub, Downtown' },
        { label: 'RSVP', value: 'Meetup.com' },
        { label: 'Cost', value: 'Free' },
        { label: 'Food', value: 'Pizza & Drinks provided' },
      ])
      .withItems([
        { title: 'Lightning talks (30 min)' },
        { title: 'Networking (60 min)' },
        { title: 'Open discussion (30 min)' },
      ])
      .build(),
  },
};

// Product launch
export const ProductLaunch: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('OSI Cards Pro 2.0 Launch Event')
      .withType('event')
      .withDescription('Join us for the official launch of our enterprise platform')
      .withFields([
        { label: 'Date', value: 'February 1, 2026' },
        { label: 'Time', value: '5:00 PM - 8:00 PM PST' },
        { label: 'Location', value: 'Grand Ballroom, Fairmont Hotel' },
        { label: 'Dress Code', value: 'Business Casual' },
        { label: 'RSVP', value: 'Required by Jan 25' },
        { label: 'Status', value: 'Confirmed', status: 'active' },
      ])
      .withItems([
        { title: 'Product unveiling (5:00 PM)' },
        { title: 'Demo & presentations (5:30 PM)' },
        { title: 'Cocktail reception (6:30 PM)' },
        { title: 'Networking (7:00 PM)' },
      ])
      .build(),
  },
};

// Training session
export const TrainingSession: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Employee Onboarding Training')
      .withType('event')
      .withFields([
        { label: 'Date', value: 'Monday, Dec 9, 2025' },
        { label: 'Time', value: '9:00 AM - 12:00 PM' },
        { label: 'Location', value: 'Conference Room A' },
        { label: 'Trainer', value: 'HR Department' },
        { label: 'Mandatory', value: 'Yes', status: 'active' },
      ])
      .withItems([
        { title: 'Company overview' },
        { title: 'Policies & procedures' },
        { title: 'Benefits enrollment' },
        { title: 'IT setup' },
      ])
      .build(),
  },
};

// Past event
export const PastEvent: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Q3 Company All-Hands')
      .withType('event')
      .withFields([
        { label: 'Date', value: 'September 15, 2025' },
        { label: 'Status', value: 'Completed', status: 'inactive' },
        { label: 'Attendees', value: '450' },
        { label: 'Recording', value: 'Available' },
      ])
      .withItems([
        { title: 'Q3 results presentation' },
        { title: 'Department updates' },
        { title: 'Q4 goals' },
      ])
      .build(),
  },
};

// Minimal event
export const Minimal: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Team Meeting')
      .withType('event')
      .withFields([
        { label: 'Date', value: 'Dec 5, 2025' },
        { label: 'Time', value: '2:00 PM' },
      ])
      .build(),
  },
};



