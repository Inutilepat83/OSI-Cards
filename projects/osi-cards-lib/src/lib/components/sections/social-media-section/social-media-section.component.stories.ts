/**
 * Storybook Stories for SocialMediaSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { SocialMediaSectionComponent } from './social-media-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<SocialMediaSectionComponent> = {
  title: 'Sections/SocialMediaSection',
  component: SocialMediaSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'Social media section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<SocialMediaSectionComponent>;

// Company social profiles
export const CompanyProfiles: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Follow Us')
      .withType('social_media')
      .withDescription('Connect with us on social media')
      .withFields([
        { label: 'Twitter', value: '@osiCards', icon: 'twitter' },
        { label: 'LinkedIn', value: 'company/osi-cards', icon: 'linkedin' },
        { label: 'GitHub', value: 'github.com/osi-cards', icon: 'github' },
        { label: 'Facebook', value: 'facebook.com/osiCards', icon: 'facebook' },
        { label: 'Instagram', value: '@osiCards', icon: 'instagram' },
      ])
      .build(),
  },
};

// Professional profiles
export const ProfessionalProfiles: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Social Links')
      .withType('social_media')
      .withFields([
        { label: 'LinkedIn', value: '/in/johndoe' },
        { label: 'Twitter', value: '@johndoe' },
        { label: 'GitHub', value: 'github.com/johndoe' },
        { label: 'Medium', value: '@johndoe' },
      ])
      .build(),
  },
};

// Developer profiles
export const DeveloperProfiles: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Developer Links')
      .withType('social_media')
      .withDescription('Find me online')
      .withFields([
        { label: 'GitHub', value: 'github.com/developer', icon: 'github' },
        { label: 'Stack Overflow', value: 'stackoverflow.com/users/12345', icon: 'layers' },
        { label: 'Dev.to', value: 'dev.to/developer', icon: 'code' },
        { label: 'CodePen', value: 'codepen.io/developer', icon: 'edit' },
        { label: 'npm', value: 'npmjs.com/~developer', icon: 'package' },
      ])
      .build(),
  },
};

// Content creator profiles
export const ContentCreator: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Content Platforms')
      .withType('social_media')
      .withFields([
        { label: 'YouTube', value: 'youtube.com/@creator' },
        { label: 'Twitch', value: 'twitch.tv/creator' },
        { label: 'TikTok', value: '@creator' },
        { label: 'Instagram', value: '@creator' },
        { label: 'Twitter', value: '@creator' },
      ])
      .build(),
  },
};

// Business networks
export const BusinessNetworks: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Business Networks')
      .withType('social_media')
      .withFields([
        { label: 'LinkedIn', value: 'company/business-name' },
        { label: 'Crunchbase', value: 'crunchbase.com/organization/business' },
        { label: 'AngelList', value: 'angel.co/company/business' },
        { label: 'Twitter', value: '@businessName' },
      ])
      .build(),
  },
};

// Minimal social links
export const Minimal: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Connect')
      .withType('social_media')
      .withField({ label: 'Twitter', value: '@username' })
      .build(),
  },
};

// With follower counts
export const WithFollowerCounts: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Social Media Presence')
      .withType('social_media')
      .withFields([
        { label: 'Twitter', value: '@company (125K followers)' },
        { label: 'LinkedIn', value: 'company (50K followers)' },
        { label: 'Instagram', value: '@company (75K followers)' },
        { label: 'YouTube', value: 'company (200K subscribers)' },
      ])
      .build(),
  },
};

