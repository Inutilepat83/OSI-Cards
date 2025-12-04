/**
 * Storybook Stories for GallerySectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { GallerySectionComponent } from './gallery-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<GallerySectionComponent> = {
  title: 'Sections/GallerySection',
  component: GallerySectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'Gallery section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<GallerySectionComponent>;

// Product gallery
export const ProductGallery: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Product Images')
      .withType('gallery')
      .withDescription('View our product from all angles')
      .withItems([
        {
          title: 'Front View',
          image: 'https://via.placeholder.com/400x300/4F46E5/ffffff?text=Front',
        },
        {
          title: 'Side View',
          image: 'https://via.placeholder.com/400x300/7C3AED/ffffff?text=Side',
        },
        {
          title: 'Back View',
          image: 'https://via.placeholder.com/400x300/2563EB/ffffff?text=Back',
        },
        {
          title: 'Detail Shot',
          image: 'https://via.placeholder.com/400x300/059669/ffffff?text=Detail',
        },
      ])
      .build(),
  },
};

// Team photos
export const TeamPhotos: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Meet the Team')
      .withType('gallery')
      .withItems([
        {
          title: 'Engineering Team',
          description: 'Building the future',
          image: 'https://via.placeholder.com/400x300/4F46E5/ffffff?text=Engineering',
        },
        {
          title: 'Design Team',
          description: 'Crafting experiences',
          image: 'https://via.placeholder.com/400x300/7C3AED/ffffff?text=Design',
        },
        {
          title: 'Marketing Team',
          description: 'Telling our story',
          image: 'https://via.placeholder.com/400x300/2563EB/ffffff?text=Marketing',
        },
      ])
      .build(),
  },
};

// Event photos
export const EventPhotos: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('TechConnect 2025 Highlights')
      .withType('gallery')
      .withDescription('Photos from our annual conference')
      .withItems([
        {
          title: 'Keynote Speech',
          image: 'https://via.placeholder.com/400x300/DC2626/ffffff?text=Keynote',
        },
        {
          title: 'Workshop Session',
          image: 'https://via.placeholder.com/400x300/EA580C/ffffff?text=Workshop',
        },
        {
          title: 'Networking',
          image: 'https://via.placeholder.com/400x300/CA8A04/ffffff?text=Networking',
        },
        {
          title: 'Demo Booth',
          image: 'https://via.placeholder.com/400x300/16A34A/ffffff?text=Demo',
        },
        {
          title: 'Evening Reception',
          image: 'https://via.placeholder.com/400x300/0891B2/ffffff?text=Reception',
        },
        {
          title: 'Awards Ceremony',
          image: 'https://via.placeholder.com/400x300/7C3AED/ffffff?text=Awards',
        },
      ])
      .build(),
  },
};

// Office photos
export const OfficeTour: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Office Tour')
      .withType('gallery')
      .withDescription('Take a virtual tour of our workspace')
      .withItems([
        {
          title: 'Reception Area',
          image: 'https://via.placeholder.com/400x300/4F46E5/ffffff?text=Reception',
        },
        {
          title: 'Open Office',
          image: 'https://via.placeholder.com/400x300/059669/ffffff?text=Office',
        },
        {
          title: 'Break Room',
          image: 'https://via.placeholder.com/400x300/2563EB/ffffff?text=Break+Room',
        },
        {
          title: 'Meeting Rooms',
          image: 'https://via.placeholder.com/400x300/7C3AED/ffffff?text=Meetings',
        },
      ])
      .build(),
  },
};

// Portfolio showcase
export const Portfolio: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Portfolio')
      .withType('gallery')
      .withItems([
        {
          title: 'E-commerce Platform',
          description: 'Modern shopping experience',
          image: 'https://via.placeholder.com/400x300/4F46E5/ffffff?text=E-commerce',
        },
        {
          title: 'Mobile Banking App',
          description: 'Secure and intuitive',
          image: 'https://via.placeholder.com/400x300/DC2626/ffffff?text=Banking',
        },
        {
          title: 'Analytics Dashboard',
          description: 'Real-time insights',
          image: 'https://via.placeholder.com/400x300/059669/ffffff?text=Analytics',
        },
      ])
      .build(),
  },
};

// Minimal gallery
export const Minimal: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Gallery')
      .withType('gallery')
      .withItems([
        { image: 'https://via.placeholder.com/400x300/4F46E5/ffffff?text=Image+1' },
        { image: 'https://via.placeholder.com/400x300/7C3AED/ffffff?text=Image+2' },
      ])
      .build(),
  },
};

// Before & After
export const BeforeAfter: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Transformation')
      .withType('gallery')
      .withDescription('See the difference we made')
      .withItems([
        {
          title: 'Before',
          image: 'https://via.placeholder.com/400x300/6B7280/ffffff?text=Before',
        },
        {
          title: 'After',
          image: 'https://via.placeholder.com/400x300/059669/ffffff?text=After',
        },
      ])
      .build(),
  },
};
