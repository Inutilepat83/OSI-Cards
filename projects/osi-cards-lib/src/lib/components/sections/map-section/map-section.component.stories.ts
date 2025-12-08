/**
 * Storybook Stories for MapSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { MapSectionComponent } from './map-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<MapSectionComponent> = {
  title: 'Sections/MapSection',
  component: MapSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'Map section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<MapSectionComponent>;

// Office location
export const OfficeLocation: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('San Francisco Office')
      .withType('map')
      .withDescription('Visit our headquarters in the heart of San Francisco')
      .withMapConfig({
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 15,
        markers: [
          {
            position: { lat: 37.7749, lng: -122.4194 },
            title: 'Main Office',
            description: '123 Market Street, San Francisco, CA 94103',
          },
        ],
      })
      .withFields([
        { label: 'Address', value: '123 Market Street' },
        { label: 'City', value: 'San Francisco, CA 94103' },
        { label: 'Phone', value: '+1 (415) 555-0100' },
      ])
      .build(),
  },
};

// Multiple locations
export const MultipleOffices: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Global Offices')
      .withType('map')
      .withDescription('We have offices in major cities worldwide')
      .withMapConfig({
        center: { lat: 20, lng: 0 },
        zoom: 2,
        markers: [
          {
            position: { lat: 37.7749, lng: -122.4194 },
            title: 'San Francisco HQ',
            description: 'Headquarters',
          },
          {
            position: { lat: 40.7128, lng: -74.006 },
            title: 'New York',
            description: 'East Coast Office',
          },
          {
            position: { lat: 51.5074, lng: -0.1278 },
            title: 'London',
            description: 'European Office',
          },
          {
            position: { lat: 35.6762, lng: 139.6503 },
            title: 'Tokyo',
            description: 'Asia Pacific Office',
          },
        ],
      })
      .build(),
  },
};

// Store locations
export const StoreLocations: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Store Locations')
      .withType('map')
      .withMapConfig({
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 12,
        markers: [
          {
            position: { lat: 37.7749, lng: -122.4194 },
            title: 'Downtown Store',
          },
          {
            position: { lat: 37.7849, lng: -122.4094 },
            title: 'North Beach Store',
          },
          {
            position: { lat: 37.7649, lng: -122.4294 },
            title: 'Mission Store',
          },
        ],
      })
      .build(),
  },
};

// Event venue
export const EventVenue: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Event Venue')
      .withType('map')
      .withDescription('TechConnect 2026 Conference Location')
      .withMapConfig({
        center: { lat: 37.7844, lng: -122.4015 },
        zoom: 16,
        markers: [
          {
            position: { lat: 37.7844, lng: -122.4015 },
            title: 'Moscone Center',
            description: 'Main Hall, 3rd Floor',
          },
        ],
      })
      .withFields([
        { label: 'Venue', value: 'Moscone Center' },
        { label: 'Address', value: '747 Howard St, San Francisco, CA' },
        { label: 'Parking', value: 'Available underground' },
      ])
      .build(),
  },
};

// Delivery coverage area
export const DeliveryCoverage: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Delivery Coverage')
      .withType('map')
      .withDescription('We deliver to the entire Bay Area')
      .withMapConfig({
        center: { lat: 37.5485, lng: -122.0683 },
        zoom: 10,
        markers: [
          { position: { lat: 37.7749, lng: -122.4194 }, title: 'San Francisco' },
          { position: { lat: 37.8044, lng: -122.2712 }, title: 'Oakland' },
          { position: { lat: 37.3688, lng: -122.0363 }, title: 'San Jose' },
        ],
      })
      .build(),
  },
};

// Customer location
export const CustomerLocation: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Customer Site')
      .withType('map')
      .withMapConfig({
        center: { lat: 37.4419, lng: -122.143 },
        zoom: 14,
        markers: [
          {
            position: { lat: 37.4419, lng: -122.143 },
            title: 'Customer HQ',
          },
        ],
      })
      .withFields([
        { label: 'Company', value: 'Tech Corp' },
        { label: 'Contact', value: 'John Doe' },
      ])
      .build(),
  },
};

// Minimal map
export const Minimal: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Location')
      .withType('map')
      .withMapConfig({
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 13,
      })
      .build(),
  },
};



