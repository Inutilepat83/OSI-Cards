#!/usr/bin/env node
/**
 * Generate Test Card Configurations from OpenAPI Schema
 * 
 * This script parses the OpenAPI specification and generates comprehensive
 * test card configurations covering all section types with various data patterns.
 * 
 * Usage: node scripts/generate-test-configs.js
 * 
 * Output:
 *   - src/assets/configs/generated/all-sections-complete.json
 *   - src/assets/configs/generated/all-sections-minimal.json
 *   - src/assets/configs/generated/all-sections-edge-cases.json
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const rootDir = path.join(__dirname, '..');
const openapiPath = path.join(rootDir, 'docs', 'openapi.yaml');
const outputDir = path.join(rootDir, 'src', 'assets', 'configs', 'generated');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Section type definitions with sample data generators
 */
const SECTION_GENERATORS = {
  'info': {
    name: 'Info Section',
    generateComplete: () => ({
      title: 'Company Information',
      type: 'info',
      description: 'Detailed company information and metadata',
      fields: [
        { label: 'Industry', value: 'Technology', icon: '🏢' },
        { label: 'Founded', value: '2010', icon: '📅' },
        { label: 'Headquarters', value: 'San Francisco, CA', icon: '📍' },
        { label: 'Employees', value: '5,000+', icon: '👥', trend: 'up' },
        { label: 'Website', value: 'www.example.com', icon: '🌐' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Info',
      type: 'info',
      fields: [{ label: 'Key', value: 'Value' }]
    }),
    generateEdgeCase: () => ({
      title: 'Info Section with Very Long Title That Should Be Truncated Properly',
      type: 'info',
      fields: [
        { label: 'A'.repeat(50), value: 'B'.repeat(200) },
        { label: 'Empty Value', value: '' },
        { label: 'Null Value', value: null },
        { label: 'Number', value: 12345.6789 },
        { label: 'Boolean', value: true },
        { label: 'Special Chars', value: '<script>alert("xss")</script> & "quotes" \'apostrophe\'' }
      ]
    })
  },

  'analytics': {
    name: 'Analytics Section',
    generateComplete: () => ({
      title: 'Performance Analytics',
      type: 'analytics',
      description: 'Key performance indicators and metrics',
      fields: [
        { label: 'Performance Score', value: '95%', percentage: 95, performance: 'excellent', trend: 'up', change: 5.2 },
        { label: 'Growth Rate', value: '25% YoY', percentage: 25, performance: 'good', trend: 'up', change: 8.1 },
        { label: 'Market Share', value: '12%', percentage: 12, performance: 'average', trend: 'stable', change: 0.5 },
        { label: 'Customer Satisfaction', value: '4.8/5', percentage: 96, performance: 'excellent', trend: 'up' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Analytics',
      type: 'analytics',
      fields: [{ label: 'Score', value: '100%', percentage: 100 }]
    }),
    generateEdgeCase: () => ({
      title: 'Analytics Edge Cases',
      type: 'analytics',
      fields: [
        { label: 'Zero', value: '0%', percentage: 0, trend: 'down', change: -100 },
        { label: 'Negative', value: '-15%', percentage: -15, performance: 'poor', trend: 'down' },
        { label: 'Max', value: '100%', percentage: 100, trend: 'up', change: 999.99 },
        { label: 'Decimal', value: '33.333%', percentage: 33.333, trend: 'stable' }
      ]
    })
  },

  'contact-card': {
    name: 'Contact Card Section',
    generateComplete: () => ({
      title: 'Key Contacts',
      type: 'contact-card',
      description: 'Primary contacts and stakeholders',
      fields: [
        {
          label: 'Primary Contact',
          title: 'Jane Doe',
          value: 'Product Manager',
          email: 'jane.doe@example.com',
          phone: '+1 555 0100',
          role: 'Product Manager',
          department: 'Product',
          linkedIn: 'https://linkedin.com/in/janedoe'
        },
        {
          label: 'Technical Lead',
          title: 'John Smith',
          value: 'Engineering Director',
          email: 'john.smith@example.com',
          phone: '+1 555 0101',
          role: 'Engineering Director',
          department: 'Engineering'
        }
      ]
    }),
    generateMinimal: () => ({
      title: 'Contact',
      type: 'contact-card',
      fields: [{ title: 'Contact Name', email: 'contact@example.com' }]
    }),
    generateEdgeCase: () => ({
      title: 'Contact Edge Cases',
      type: 'contact-card',
      fields: [
        { title: 'No Email', value: 'No contact info available' },
        { title: 'Long Name That Exceeds Normal Display Width', email: 'very.long.email.address.that.might.cause.issues@subdomain.domain.example.com' }
      ]
    })
  },

  'network-card': {
    name: 'Network Card Section',
    generateComplete: () => ({
      title: 'Business Network',
      type: 'network-card',
      description: 'Key business relationships and partnerships',
      items: [
        { title: 'Strategic Partner A', description: 'Technology partnership', meta: { influence: 85, connections: 12, status: 'active' } },
        { title: 'Investor Group', description: 'Series B lead investor', meta: { influence: 92, connections: 8, status: 'active' } },
        { title: 'Distribution Partner', description: 'EMEA distribution', meta: { influence: 67, connections: 25, status: 'active' } }
      ]
    }),
    generateMinimal: () => ({
      title: 'Network',
      type: 'network-card',
      items: [{ title: 'Partner' }]
    }),
    generateEdgeCase: () => ({
      title: 'Network Edge Cases',
      type: 'network-card',
      items: [
        { title: 'Zero Influence', meta: { influence: 0, connections: 0 } },
        { title: 'Max Values', meta: { influence: 100, connections: 9999 } }
      ]
    })
  },

  'map': {
    name: 'Map Section',
    generateComplete: () => ({
      title: 'Global Presence',
      type: 'map',
      description: 'Office locations worldwide',
      fields: [
        { name: 'Headquarters', x: 37.7749, y: -122.4194, type: 'office', address: 'San Francisco, CA, USA' },
        { name: 'European HQ', x: 51.5074, y: -0.1278, type: 'office', address: 'London, UK' },
        { name: 'APAC Office', x: 35.6762, y: 139.6503, type: 'branch', address: 'Tokyo, Japan' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Location',
      type: 'map',
      fields: [{ name: 'Office', x: 0, y: 0 }]
    }),
    generateEdgeCase: () => ({
      title: 'Map Edge Cases',
      type: 'map',
      fields: [
        { name: 'North Pole', x: 90, y: 0 },
        { name: 'South Pole', x: -90, y: 0 },
        { name: 'Date Line', x: 0, y: 180 },
        { name: 'Anti-Meridian', x: 0, y: -180 }
      ]
    })
  },

  'financials': {
    name: 'Financials Section',
    generateComplete: () => ({
      title: 'Financial Overview',
      type: 'financials',
      description: 'Key financial metrics and performance',
      fields: [
        { label: 'Annual Revenue', value: '$50M', format: 'currency', change: 15, trend: 'up' },
        { label: 'Operating Margin', value: '18%', format: 'percentage', change: 3.2, trend: 'up' },
        { label: 'EBITDA', value: '$12M', format: 'currency', change: 8, trend: 'up' },
        { label: 'Net Income', value: '$8M', format: 'currency', change: -2.5, trend: 'down' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Financials',
      type: 'financials',
      fields: [{ label: 'Revenue', value: '$1M' }]
    }),
    generateEdgeCase: () => ({
      title: 'Financial Edge Cases',
      type: 'financials',
      fields: [
        { label: 'Zero Revenue', value: '$0', change: 0 },
        { label: 'Negative', value: '-$10M', change: -100, trend: 'down' },
        { label: 'Large Number', value: '$999,999,999,999', change: 9999.99 },
        { label: 'Decimal Precision', value: '$1,234,567.89', change: 12.345678 }
      ]
    })
  },

  'event': {
    name: 'Event Section',
    generateComplete: () => ({
      title: 'Upcoming Events',
      type: 'event',
      description: 'Scheduled events and milestones',
      fields: [
        { label: 'Product Launch', value: 'Q1 Launch Event', date: '2025-03-15', time: '10:00', category: 'Launch', status: 'confirmed' },
        { label: 'Annual Conference', value: 'User Summit 2025', date: '2025-06-20', time: '09:00', category: 'Conference', status: 'planned' },
        { label: 'Board Meeting', value: 'Q2 Review', date: '2025-04-10', time: '14:00', category: 'Internal', status: 'confirmed' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Events',
      type: 'event',
      fields: [{ label: 'Event', value: 'TBD' }]
    }),
    generateEdgeCase: () => ({
      title: 'Event Edge Cases',
      type: 'event',
      fields: [
        { label: 'Past Event', date: '2020-01-01', status: 'completed' },
        { label: 'Far Future', date: '2099-12-31', status: 'tentative' },
        { label: 'Cancelled', date: '2025-01-01', status: 'cancelled' }
      ]
    })
  },

  'list': {
    name: 'List Section',
    generateComplete: () => ({
      title: 'Product Features',
      type: 'list',
      description: 'Key features and capabilities',
      items: [
        { title: 'Real-time Analytics', description: 'Live data processing and visualization', icon: '📊', status: 'completed' },
        { title: 'AI Integration', description: 'Machine learning powered insights', icon: '🤖', status: 'in-progress' },
        { title: 'API Access', description: 'RESTful API for integrations', icon: '🔗', status: 'completed' },
        { title: 'Multi-language', description: 'Support for 20+ languages', icon: '🌍', status: 'planned' }
      ]
    }),
    generateMinimal: () => ({
      title: 'List',
      type: 'list',
      items: [{ title: 'Item 1' }]
    }),
    generateEdgeCase: () => ({
      title: 'List Edge Cases',
      type: 'list',
      items: [
        { title: '', description: 'Empty title' },
        { title: 'A'.repeat(100), description: 'B'.repeat(500) },
        { title: 'Unicode', description: '日本語 中文 العربية 한국어 🎉🚀💡' }
      ]
    })
  },

  'chart': {
    name: 'Chart Section',
    generateComplete: () => ({
      title: 'Revenue Trends',
      type: 'chart',
      chartType: 'bar',
      chartData: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
          { label: 'Revenue', data: [100, 150, 200, 250], backgroundColor: '#FF7900' },
          { label: 'Expenses', data: [80, 90, 100, 110], backgroundColor: '#4CAF50' }
        ]
      }
    }),
    generateMinimal: () => ({
      title: 'Chart',
      type: 'chart',
      chartType: 'bar',
      chartData: { labels: ['A'], datasets: [{ data: [1] }] }
    }),
    generateEdgeCase: () => ({
      title: 'Chart Edge Cases',
      type: 'chart',
      chartType: 'line',
      chartData: {
        labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        datasets: [
          { label: 'Negative', data: [-50, -25, 0, 25, 50, -100, 200, 0, 50, -50] },
          { label: 'Large', data: [1000000, 2000000, 1500000, 2500000, 3000000, 2800000, 3200000, 2900000, 3500000, 4000000] }
        ]
      }
    })
  },

  'product': {
    name: 'Product Section',
    generateComplete: () => ({
      title: 'Product Information',
      type: 'product',
      description: 'Product details and specifications',
      fields: [
        { label: 'Product Name', value: 'Enterprise Suite Pro' },
        { label: 'Version', value: '3.5.2' },
        { label: 'Category', value: 'Enterprise Software' },
        { label: 'License', value: 'Annual Subscription' },
        { label: 'Support Level', value: 'Premium 24/7' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Product',
      type: 'product',
      fields: [{ label: 'Name', value: 'Product' }]
    }),
    generateEdgeCase: () => ({
      title: 'Product Edge Cases',
      type: 'product',
      fields: [
        { label: 'Version', value: '0.0.0-alpha.1' },
        { label: 'SKU', value: 'ABC-123-XYZ-!@#$%' }
      ]
    })
  },

  'solutions': {
    name: 'Solutions Section',
    generateComplete: () => ({
      title: 'Solutions Portfolio',
      type: 'solutions',
      description: 'Available solutions and services',
      fields: [
        {
          title: 'Cloud Migration',
          description: 'Complete cloud infrastructure migration service',
          category: 'Infrastructure',
          benefits: ['Scalability', 'Cost reduction', 'Security'],
          deliveryTime: '8-10 weeks'
        },
        {
          title: 'Data Analytics Platform',
          description: 'Real-time analytics and reporting solution',
          category: 'Analytics',
          benefits: ['Real-time insights', 'Custom dashboards', 'API access'],
          deliveryTime: '4-6 weeks'
        }
      ]
    }),
    generateMinimal: () => ({
      title: 'Solutions',
      type: 'solutions',
      fields: [{ title: 'Solution', description: 'Description' }]
    }),
    generateEdgeCase: () => ({
      title: 'Solutions Edge Cases',
      type: 'solutions',
      fields: [
        { title: 'No Benefits', description: 'Solution without benefits array' },
        { title: 'Many Benefits', benefits: Array.from({ length: 20 }, (_, i) => `Benefit ${i + 1}`) }
      ]
    })
  },

  'overview': {
    name: 'Overview Section',
    generateComplete: () => ({
      title: 'Company Overview',
      type: 'overview',
      description: 'High-level company information',
      fields: [
        { label: 'About', value: 'Leading technology company specializing in enterprise solutions' },
        { label: 'Mission', value: 'Empowering businesses through innovative technology' },
        { label: 'Industry', value: 'Enterprise Software' },
        { label: 'Founded', value: '2010' },
        { label: 'Size', value: '1000-5000 employees' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Overview',
      type: 'overview',
      fields: [{ label: 'Summary', value: 'Overview text' }]
    }),
    generateEdgeCase: () => ({
      title: 'Overview Edge Cases',
      type: 'overview',
      fields: [
        { label: 'Long Text', value: 'Lorem ipsum '.repeat(100) }
      ]
    })
  },

  'stats': {
    name: 'Stats Section',
    generateComplete: () => ({
      title: 'Key Statistics',
      type: 'stats',
      description: 'Important numbers at a glance',
      fields: [
        { label: 'Total Users', value: '1.2M', trend: 'up' },
        { label: 'Active Sessions', value: '50K', trend: 'stable' },
        { label: 'Uptime', value: '99.99%', trend: 'up' },
        { label: 'Response Time', value: '45ms', trend: 'down' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Stats',
      type: 'stats',
      fields: [{ label: 'Count', value: '100' }]
    }),
    generateEdgeCase: () => ({
      title: 'Stats Edge Cases',
      type: 'stats',
      fields: [
        { label: 'Zero', value: '0' },
        { label: 'Huge', value: '999,999,999,999' },
        { label: 'Decimal', value: '3.14159265359' }
      ]
    })
  },

  'quotation': {
    name: 'Quotation Section',
    generateComplete: () => ({
      title: 'Customer Testimonials',
      type: 'quotation',
      description: 'What our customers say',
      fields: [
        {
          label: 'CEO Testimonial',
          value: '"This solution transformed our business operations and increased productivity by 40%."',
          description: 'John Smith, CEO at TechCorp Inc.'
        },
        {
          label: 'CTO Review',
          value: '"The technical implementation was seamless and the support team was exceptional."',
          description: 'Sarah Johnson, CTO at DataFlow Systems'
        }
      ]
    }),
    generateMinimal: () => ({
      title: 'Quote',
      type: 'quotation',
      fields: [{ value: '"Quote text"' }]
    }),
    generateEdgeCase: () => ({
      title: 'Quotation Edge Cases',
      type: 'quotation',
      fields: [
        { value: '"'.repeat(50) + 'Lots of quotes' + '"'.repeat(50) },
        { value: '\'Single quotes\' and "double quotes" mixed' }
      ]
    })
  },

  'text-reference': {
    name: 'Text Reference Section',
    generateComplete: () => ({
      title: 'Documentation References',
      type: 'text-reference',
      description: 'Related documents and resources',
      fields: [
        { label: 'Technical Spec', value: 'Technical Specification v2.1', description: 'Latest technical documentation', url: 'https://docs.example.com/spec' },
        { label: 'User Guide', value: 'User Guide 2024 Edition', description: 'Complete user manual', url: 'https://docs.example.com/guide' },
        { label: 'API Reference', value: 'REST API Documentation', description: 'API endpoints and schemas', url: 'https://api.example.com/docs' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Reference',
      type: 'text-reference',
      fields: [{ label: 'Doc', value: 'Document' }]
    }),
    generateEdgeCase: () => ({
      title: 'Reference Edge Cases',
      type: 'text-reference',
      fields: [
        { label: 'No URL', value: 'Document without link' },
        { label: 'Long URL', value: 'Doc', url: 'https://example.com/' + 'path/'.repeat(50) }
      ]
    })
  },

  'brand-colors': {
    name: 'Brand Colors Section',
    generateComplete: () => ({
      title: 'Brand Colors',
      type: 'brand-colors',
      description: 'Official brand color palette',
      fields: [
        { label: 'Primary', value: '#FF7900', description: 'Orange Brand Color' },
        { label: 'Secondary', value: '#000000', description: 'Black' },
        { label: 'Accent', value: '#4CAF50', description: 'Green Accent' },
        { label: 'Background', value: '#FFFFFF', description: 'White Background' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Colors',
      type: 'brand-colors',
      fields: [{ label: 'Primary', value: '#000000' }]
    }),
    generateEdgeCase: () => ({
      title: 'Color Edge Cases',
      type: 'brand-colors',
      fields: [
        { label: 'RGB', value: 'rgb(255, 121, 0)' },
        { label: 'RGBA', value: 'rgba(255, 121, 0, 0.5)' },
        { label: 'Invalid', value: 'not-a-color' }
      ]
    })
  },

  'news': {
    name: 'News Section',
    generateComplete: () => ({
      title: 'Latest News',
      type: 'news',
      description: 'Recent company news and announcements',
      items: [
        {
          title: 'Q4 Earnings Beat Expectations',
          description: 'Company reports 25% revenue growth in Q4 2024',
          meta: { source: 'Bloomberg', date: '2025-01-15' },
          status: 'published'
        },
        {
          title: 'New Product Launch Announced',
          description: 'Enterprise Suite 4.0 coming Spring 2025',
          meta: { source: 'Press Release', date: '2025-01-10' },
          status: 'published'
        }
      ]
    }),
    generateMinimal: () => ({
      title: 'News',
      type: 'news',
      items: [{ title: 'News Item' }]
    }),
    generateEdgeCase: () => ({
      title: 'News Edge Cases',
      type: 'news',
      items: [
        { title: 'Old News', meta: { date: '2000-01-01' } },
        { title: 'No Source', meta: {} }
      ]
    })
  },

  'timeline': {
    name: 'Timeline Section',
    generateComplete: () => ({
      title: 'Company Timeline',
      type: 'timeline',
      description: 'Key milestones and events',
      items: [
        { title: 'Company Founded', description: 'Started in a garage', date: '2010-01-15' },
        { title: 'Series A Funding', description: 'Raised $5M', date: '2012-06-01' },
        { title: 'IPO', description: 'Listed on NASDAQ', date: '2020-03-15' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Timeline',
      type: 'timeline',
      items: [{ title: 'Event' }]
    }),
    generateEdgeCase: () => ({
      title: 'Timeline Edge Cases',
      type: 'timeline',
      items: [{ title: 'No Date' }, { title: 'Future', date: '2099-01-01' }]
    })
  },

  'metrics': {
    name: 'Metrics Section',
    generateComplete: () => ({
      title: 'Key Metrics',
      type: 'metrics',
      description: 'Performance metrics dashboard',
      fields: [
        { label: 'DAU', value: '500K', trend: 'up', percentage: 15 },
        { label: 'MAU', value: '2M', trend: 'up', percentage: 8 },
        { label: 'Retention', value: '85%', trend: 'stable', percentage: 85 }
      ]
    }),
    generateMinimal: () => ({
      title: 'Metrics',
      type: 'metrics',
      fields: [{ label: 'Metric', value: '100' }]
    }),
    generateEdgeCase: () => ({
      title: 'Metrics Edge Cases',
      type: 'metrics',
      fields: [{ label: 'Zero', value: '0', percentage: 0 }]
    })
  },

  'locations': {
    name: 'Locations Section',
    generateComplete: () => ({
      title: 'Office Locations',
      type: 'locations',
      description: 'Global office network',
      fields: [
        { name: 'HQ', address: 'San Francisco, CA', coordinates: { lat: 37.7749, lng: -122.4194 } },
        { name: 'Europe', address: 'London, UK', coordinates: { lat: 51.5074, lng: -0.1278 } }
      ]
    }),
    generateMinimal: () => ({
      title: 'Locations',
      type: 'locations',
      fields: [{ name: 'Office', address: 'Address' }]
    }),
    generateEdgeCase: () => ({
      title: 'Locations Edge Cases',
      type: 'locations',
      fields: [{ name: 'No Coords', address: 'Unknown' }]
    })
  },

  'project': {
    name: 'Project Section',
    generateComplete: () => ({
      title: 'Active Projects',
      type: 'project',
      description: 'Current project portfolio',
      items: [
        { title: 'Platform v2', description: 'Major platform upgrade', status: 'in-progress', icon: '🚀' },
        { title: 'Mobile App', description: 'iOS and Android apps', status: 'planned', icon: '📱' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Projects',
      type: 'project',
      items: [{ title: 'Project' }]
    }),
    generateEdgeCase: () => ({
      title: 'Project Edge Cases',
      type: 'project',
      items: [{ title: 'No Status' }, { title: 'Unknown Status', status: 'unknown' }]
    })
  },

  'table': {
    name: 'Table Section',
    generateComplete: () => ({
      title: 'Data Table',
      type: 'table',
      description: 'Tabular data display',
      fields: [
        { label: 'Product', value: 'Enterprise' },
        { label: 'Price', value: '$999/mo' },
        { label: 'Users', value: 'Unlimited' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Table',
      type: 'table',
      fields: [{ label: 'Column', value: 'Value' }]
    }),
    generateEdgeCase: () => ({
      title: 'Table Edge Cases',
      type: 'table',
      fields: Array.from({ length: 30 }, (_, i) => ({ label: `Col ${i}`, value: `Val ${i}` }))
    })
  },

  'reference': {
    name: 'Reference Section',
    generateComplete: () => ({
      title: 'References',
      type: 'reference',
      description: 'External references',
      fields: [
        { label: 'Wikipedia', value: 'Company Wikipedia Page', url: 'https://wikipedia.org' },
        { label: 'LinkedIn', value: 'Company LinkedIn', url: 'https://linkedin.com' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Reference',
      type: 'reference',
      fields: [{ label: 'Ref', value: 'Link' }]
    }),
    generateEdgeCase: () => ({
      title: 'Reference Edge Cases',
      type: 'reference',
      fields: [{ label: 'No URL', value: 'Text only' }]
    })
  },

  'text-ref': {
    name: 'Text Ref Section',
    generateComplete: () => ({
      title: 'Text References',
      type: 'text-ref',
      description: 'Text-based references',
      fields: [
        { label: 'Citation', value: 'Source document citation', description: 'From annual report' }
      ]
    }),
    generateMinimal: () => ({
      title: 'Text Ref',
      type: 'text-ref',
      fields: [{ label: 'Ref', value: 'Text' }]
    }),
    generateEdgeCase: () => ({
      title: 'Text Ref Edge Cases',
      type: 'text-ref',
      fields: [{ value: 'No label reference' }]
    })
  }
};

/**
 * Generate a complete card configuration with all section types
 */
function generateCompleteConfig() {
  const sections = Object.entries(SECTION_GENERATORS).map(([type, generator]) => {
    return generator.generateComplete();
  });

  return {
    cardTitle: 'All Sections Demo - Complete',
    cardSubtitle: 'Complete Component Showcase',
    cardType: 'company',
    description: 'This card demonstrates all available section types with complete data',
    sections,
    actions: [
      { label: 'Learn More', type: 'website', variant: 'primary', icon: '🌐', url: 'https://example.com' },
      { label: 'Contact Sales', type: 'mail', variant: 'secondary', icon: '📧', email: { contact: { name: 'Sales', email: 'sales@example.com', role: 'Sales Team' }, subject: 'Inquiry', body: 'Hello' } },
      { label: 'Ask Question', type: 'question', variant: 'outline', icon: '❓', question: 'Tell me more about this company' }
    ]
  };
}

/**
 * Generate a minimal card configuration with all section types
 */
function generateMinimalConfig() {
  const sections = Object.entries(SECTION_GENERATORS).map(([type, generator]) => {
    return generator.generateMinimal();
  });

  return {
    cardTitle: 'All Sections Demo - Minimal',
    sections
  };
}

/**
 * Generate an edge case card configuration with all section types
 */
function generateEdgeCaseConfig() {
  const sections = Object.entries(SECTION_GENERATORS).map(([type, generator]) => {
    return generator.generateEdgeCase();
  });

  return {
    cardTitle: 'A'.repeat(150), // Max length title
    cardSubtitle: 'B'.repeat(100),
    cardType: 'edge-case',
    description: 'C'.repeat(500), // Max length description
    sections,
    actions: []
  };
}

/**
 * Main function to generate all test configurations
 */
function main() {
  log('\n🔧 Generating Test Card Configurations from OpenAPI\n', colors.bright + colors.cyan);
  log('═'.repeat(60), colors.cyan);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    log(`\n📁 Created output directory: ${outputDir}`, colors.green);
  }

  // Check if OpenAPI file exists
  if (!fs.existsSync(openapiPath)) {
    log(`\n❌ OpenAPI file not found: ${openapiPath}`, colors.yellow);
    log('   Generating from built-in section definitions...\n', colors.yellow);
  } else {
    log(`\n📄 Found OpenAPI file: ${openapiPath}`, colors.green);
    
    // Parse OpenAPI to get section types
    try {
      const openapiContent = fs.readFileSync(openapiPath, 'utf8');
      const openapi = yaml.load(openapiContent);
      
      const sectionTypes = openapi?.components?.schemas?.CardSection?.properties?.type?.enum || [];
      log(`   Section types from schema: ${sectionTypes.length}`, colors.blue);
      
      // Verify we have generators for all types
      const missingGenerators = sectionTypes.filter(type => !SECTION_GENERATORS[type]);
      if (missingGenerators.length > 0) {
        log(`   ⚠️  Missing generators for: ${missingGenerators.join(', ')}`, colors.yellow);
      }
    } catch (err) {
      log(`   ⚠️  Could not parse OpenAPI: ${err.message}`, colors.yellow);
    }
  }

  // Generate configurations
  const configs = [
    { name: 'all-sections-complete', generator: generateCompleteConfig },
    { name: 'all-sections-minimal', generator: generateMinimalConfig },
    { name: 'all-sections-edge-cases', generator: generateEdgeCaseConfig }
  ];

  log('\n📝 Generating configurations:\n', colors.bright);

  for (const { name, generator } of configs) {
    const config = generator();
    const filePath = path.join(outputDir, `${name}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    
    log(`   ✓ ${name}.json (${config.sections.length} sections)`, colors.green);
  }

  // Generate a summary file
  const summary = {
    generatedAt: new Date().toISOString(),
    sectionTypes: Object.keys(SECTION_GENERATORS),
    configFiles: configs.map(c => `${c.name}.json`)
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(summary, null, 2)
  );
  
  log(`   ✓ manifest.json (summary)`, colors.green);

  log('\n═'.repeat(60), colors.cyan);
  log(`✅ Generated ${configs.length} test configurations`, colors.bright + colors.green);
  log(`   Output: ${outputDir}\n`, colors.blue);
}

// Run main function
main();

