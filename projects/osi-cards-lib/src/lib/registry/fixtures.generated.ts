/**
 * Section Test Fixtures - Single Source of Truth
 * 
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Generated from section-registry.json
 * Run: npm run generate:registry-fixtures
 * 
 * These fixtures are the ONLY source of test data for all section types.
 * Do NOT create hardcoded section examples elsewhere in the codebase.
 */

import type { CardSection, AICardConfig } from '../models/card.model';
import { SectionType } from '../models/generated-section-types';

// ============================================================================
// FIXTURE TYPES
// ============================================================================

/**
 * Available fixture types
 */
export type FixtureCategory = 'complete' | 'minimal' | 'edgeCases';

/**
 * Section fixtures record by type
 */
export type SectionFixtures = Record<SectionType, CardSection>;

// ============================================================================
// COMPLETE FIXTURES (All fields populated)
// ============================================================================

/**
 * Complete section fixtures - all fields populated with realistic data
 * Use for: visual regression tests, documentation examples, demos
 */
export const COMPLETE_FIXTURES: Partial<SectionFixtures> = {
  'info': {
      "title": "Company Information",
      "type": "info",
      "description": "Detailed company information and metadata",
      "fields": [
          {
              "label": "Industry",
              "value": "Technology",
              "icon": "🏢"
          },
          {
              "label": "Founded",
              "value": "2010",
              "icon": "📅"
          },
          {
              "label": "Headquarters",
              "value": "San Francisco, CA",
              "icon": "📍"
          },
          {
              "label": "Employees",
              "value": "5,000+",
              "icon": "👥",
              "trend": "up"
          },
          {
              "label": "Website",
              "value": "www.example.com",
              "icon": "🌐"
          }
      ]
  },
  'analytics': {
      "title": "Performance Analytics",
      "type": "analytics",
      "description": "Key performance indicators and metrics",
      "fields": [
          {
              "label": "Performance Score",
              "value": "95%",
              "percentage": 95,
              "performance": "excellent",
              "trend": "up",
              "change": 5.2
          },
          {
              "label": "Growth Rate",
              "value": "25% YoY",
              "percentage": 25,
              "performance": "good",
              "trend": "up",
              "change": 8.1
          },
          {
              "label": "Market Share",
              "value": "12%",
              "percentage": 12,
              "performance": "average",
              "trend": "stable",
              "change": 0.5
          },
          {
              "label": "Customer Satisfaction",
              "value": "4.8/5",
              "percentage": 96,
              "performance": "excellent",
              "trend": "up"
          }
      ]
  },
  'contact-card': {
      "title": "Key Contacts",
      "type": "contact-card",
      "description": "Primary contacts and stakeholders",
      "fields": [
          {
              "label": "Primary Contact",
              "title": "Jane Doe",
              "value": "Product Manager",
              "email": "jane.doe@example.com",
              "phone": "+1 555 0100",
              "role": "Product Manager",
              "department": "Product",
              "linkedIn": "https://linkedin.com/in/janedoe"
          },
          {
              "label": "Technical Lead",
              "title": "John Smith",
              "value": "Engineering Director",
              "email": "john.smith@example.com",
              "phone": "+1 555 0101",
              "role": "Engineering Director",
              "department": "Engineering"
          }
      ]
  },
  'network-card': {
      "title": "Business Network",
      "type": "network-card",
      "description": "Key business relationships and partnerships",
      "items": [
          {
              "title": "Strategic Partner A",
              "description": "Technology partnership",
              "meta": {
                  "influence": 85,
                  "connections": 12,
                  "status": "active"
              }
          },
          {
              "title": "Investor Group",
              "description": "Series B lead investor",
              "meta": {
                  "influence": 92,
                  "connections": 8,
                  "status": "active"
              }
          },
          {
              "title": "Distribution Partner",
              "description": "EMEA distribution",
              "meta": {
                  "influence": 67,
                  "connections": 25,
                  "status": "active"
              }
          }
      ]
  },
  'map': {
      "title": "Global Presence",
      "type": "map",
      "description": "Office locations worldwide",
      "fields": [
          {
              "name": "Headquarters",
              "x": 37.7749,
              "y": -122.4194,
              "type": "office",
              "address": "San Francisco, CA, USA"
          },
          {
              "name": "European HQ",
              "x": 51.5074,
              "y": -0.1278,
              "type": "office",
              "address": "London, UK"
          },
          {
              "name": "APAC Office",
              "x": 35.6762,
              "y": 139.6503,
              "type": "branch",
              "address": "Tokyo, Japan"
          }
      ]
  },
  'financials': {
      "title": "Financial Overview",
      "type": "financials",
      "description": "Key financial metrics and performance",
      "fields": [
          {
              "label": "Annual Revenue",
              "value": "$50M",
              "format": "currency",
              "change": 15,
              "trend": "up"
          },
          {
              "label": "Operating Margin",
              "value": "18%",
              "format": "percentage",
              "change": 3.2,
              "trend": "up"
          },
          {
              "label": "EBITDA",
              "value": "$12M",
              "format": "currency",
              "change": 8,
              "trend": "up"
          },
          {
              "label": "Net Income",
              "value": "$8M",
              "format": "currency",
              "change": -2.5,
              "trend": "down"
          }
      ]
  },
  'event': {
      "title": "Upcoming Events",
      "type": "event",
      "description": "Scheduled events and milestones",
      "fields": [
          {
              "label": "Product Launch",
              "value": "Q1 Launch Event",
              "date": "2025-03-15",
              "time": "10:00",
              "category": "Launch",
              "status": "active"
          },
          {
              "label": "Annual Conference",
              "value": "User Summit 2025",
              "date": "2025-06-20",
              "time": "09:00",
              "category": "Conference",
              "status": "pending"
          },
          {
              "label": "Board Meeting",
              "value": "Q2 Review",
              "date": "2025-04-10",
              "time": "14:00",
              "category": "Internal",
              "status": "active"
          }
      ]
  },
  'list': {
      "title": "Product Features",
      "type": "list",
      "description": "Key features and capabilities",
      "items": [
          {
              "title": "Real-time Analytics",
              "description": "Live data processing and visualization",
              "icon": "📊",
              "status": "completed"
          },
          {
              "title": "AI Integration",
              "description": "Machine learning powered insights",
              "icon": "🤖",
              "status": "in-progress"
          },
          {
              "title": "API Access",
              "description": "RESTful API for integrations",
              "icon": "🔗",
              "status": "completed"
          },
          {
              "title": "Multi-language",
              "description": "Support for 20+ languages",
              "icon": "🌍",
              "status": "pending"
          }
      ]
  },
  'chart': {
      "title": "Revenue Trends",
      "type": "chart",
      "chartType": "bar",
      "chartData": {
          "labels": [
              "Q1",
              "Q2",
              "Q3",
              "Q4"
          ],
          "datasets": [
              {
                  "label": "Revenue",
                  "data": [
                      100,
                      150,
                      200,
                      250
                  ],
                  "backgroundColor": "#FF7900"
              },
              {
                  "label": "Expenses",
                  "data": [
                      80,
                      90,
                      100,
                      110
                  ],
                  "backgroundColor": "#4CAF50"
              }
          ]
      }
  },
  'product': {
      "title": "Product Information",
      "type": "product",
      "description": "Product details and specifications",
      "fields": [
          {
              "label": "Product Name",
              "value": "Enterprise Suite Pro"
          },
          {
              "label": "Version",
              "value": "3.5.2"
          },
          {
              "label": "Category",
              "value": "Enterprise Software"
          },
          {
              "label": "License",
              "value": "Annual Subscription"
          },
          {
              "label": "Support Level",
              "value": "Premium 24/7"
          }
      ]
  },
  'solutions': {
      "title": "Solutions Portfolio",
      "type": "solutions",
      "description": "Available solutions and services",
      "fields": [
          {
              "title": "Cloud Migration",
              "description": "Complete cloud infrastructure migration service",
              "category": "Infrastructure",
              "benefits": [
                  "Scalability",
                  "Cost reduction",
                  "Security"
              ],
              "deliveryTime": "8-10 weeks"
          },
          {
              "title": "Data Analytics Platform",
              "description": "Real-time analytics and reporting solution",
              "category": "Analytics",
              "benefits": [
                  "Real-time insights",
                  "Custom dashboards",
                  "API access"
              ],
              "deliveryTime": "4-6 weeks"
          }
      ]
  },
  'overview': {
      "title": "Company Overview",
      "type": "overview",
      "description": "High-level company information",
      "fields": [
          {
              "label": "About",
              "value": "Leading technology company specializing in enterprise solutions"
          },
          {
              "label": "Mission",
              "value": "Empowering businesses through innovative technology"
          },
          {
              "label": "Industry",
              "value": "Enterprise Software"
          },
          {
              "label": "Founded",
              "value": "2010"
          },
          {
              "label": "Size",
              "value": "1000-5000 employees"
          }
      ]
  },
  'quotation': {
      "title": "Customer Testimonials",
      "type": "quotation",
      "description": "What our customers say",
      "fields": [
          {
              "label": "CEO Testimonial",
              "value": "\"This solution transformed our business operations and increased productivity by 40%.\"",
              "description": "John Smith, CEO at TechCorp Inc."
          },
          {
              "label": "CTO Review",
              "value": "\"The technical implementation was seamless and the support team was exceptional.\"",
              "description": "Sarah Johnson, CTO at DataFlow Systems"
          }
      ]
  },
  'text-reference': {
      "title": "Documentation References",
      "type": "text-reference",
      "description": "Related documents and resources",
      "fields": [
          {
              "label": "Technical Spec",
              "value": "Technical Specification v2.1",
              "description": "Latest technical documentation",
              "url": "https://docs.example.com/spec"
          },
          {
              "label": "User Guide",
              "value": "User Guide 2024 Edition",
              "description": "Complete user manual",
              "url": "https://docs.example.com/guide"
          },
          {
              "label": "API Reference",
              "value": "REST API Documentation",
              "description": "API endpoints and schemas",
              "url": "https://api.example.com/docs"
          }
      ]
  },
  'brand-colors': {
      "title": "Brand Colors",
      "type": "brand-colors",
      "description": "Official brand color palette",
      "fields": [
          {
              "label": "Primary",
              "value": "#FF7900",
              "description": "Orange Brand Color"
          },
          {
              "label": "Secondary",
              "value": "#000000",
              "description": "Black"
          },
          {
              "label": "Accent",
              "value": "#4CAF50",
              "description": "Green Accent"
          },
          {
              "label": "Background",
              "value": "#FFFFFF",
              "description": "White Background"
          }
      ]
  },
  'news': {
      "title": "Latest News",
      "type": "news",
      "description": "Recent company news and announcements",
      "items": [
          {
              "title": "Q4 Earnings Beat Expectations",
              "description": "Company reports 25% revenue growth in Q4 2024",
              "meta": {
                  "source": "Bloomberg",
                  "date": "2025-01-15"
              },
              "status": "active"
          },
          {
              "title": "New Product Launch Announced",
              "description": "Enterprise Suite 4.0 coming Spring 2025",
              "meta": {
                  "source": "Press Release",
                  "date": "2025-01-10"
              },
              "status": "active"
          }
      ]
  },
  'social-media': {
      "title": "Social Media Presence",
      "type": "social-media",
      "description": "Company social media profiles",
      "fields": [
          {
              "platform": "linkedin",
              "handle": "@company",
              "url": "https://linkedin.com/company/example",
              "followers": 50000
          },
          {
              "platform": "twitter",
              "handle": "@company",
              "url": "https://twitter.com/company",
              "followers": 25000
          }
      ]
  }
};

// ============================================================================
// MINIMAL FIXTURES (Required fields only)
// ============================================================================

/**
 * Minimal section fixtures - only required fields
 * Use for: unit tests, validation tests, boundary testing
 */
export const MINIMAL_FIXTURES: Partial<SectionFixtures> = {
  'info': {
      "title": "Info",
      "type": "info",
      "fields": [
          {
              "label": "Key",
              "value": "Value"
          }
      ]
  },
  'analytics': {
      "title": "Analytics",
      "type": "analytics",
      "fields": [
          {
              "label": "Score",
              "value": "100%",
              "percentage": 100
          }
      ]
  },
  'contact-card': {
      "title": "Contact",
      "type": "contact-card",
      "fields": [
          {
              "title": "Contact Name",
              "email": "contact@example.com"
          }
      ]
  },
  'network-card': {
      "title": "Network",
      "type": "network-card",
      "items": [
          {
              "title": "Partner"
          }
      ]
  },
  'map': {
      "title": "Location",
      "type": "map",
      "fields": [
          {
              "name": "Office",
              "x": 0,
              "y": 0
          }
      ]
  },
  'financials': {
      "title": "Financials",
      "type": "financials",
      "fields": [
          {
              "label": "Revenue",
              "value": "$1M"
          }
      ]
  },
  'event': {
      "title": "Events",
      "type": "event",
      "fields": [
          {
              "label": "Event",
              "value": "TBD"
          }
      ]
  },
  'list': {
      "title": "List",
      "type": "list",
      "items": [
          {
              "title": "Item 1"
          }
      ]
  },
  'chart': {
      "title": "Chart",
      "type": "chart",
      "chartType": "bar",
      "chartData": {
          "labels": [
              "A"
          ],
          "datasets": [
              {
                  "data": [
                      1
                  ]
              }
          ]
      }
  },
  'product': {
      "title": "Product",
      "type": "product",
      "fields": [
          {
              "label": "Name",
              "value": "Product"
          }
      ]
  },
  'solutions': {
      "title": "Solutions",
      "type": "solutions",
      "fields": [
          {
              "title": "Solution",
              "description": "Description"
          }
      ]
  },
  'overview': {
      "title": "Overview",
      "type": "overview",
      "fields": [
          {
              "label": "Summary",
              "value": "Overview text"
          }
      ]
  },
  'quotation': {
      "title": "Quote",
      "type": "quotation",
      "fields": [
          {
              "value": "\"Quote text\""
          }
      ]
  },
  'text-reference': {
      "title": "Reference",
      "type": "text-reference",
      "fields": [
          {
              "label": "Doc",
              "value": "Document"
          }
      ]
  },
  'brand-colors': {
      "title": "Colors",
      "type": "brand-colors",
      "fields": [
          {
              "label": "Primary",
              "value": "#000000"
          }
      ]
  },
  'news': {
      "title": "News",
      "type": "news",
      "items": [
          {
              "title": "News Item"
          }
      ]
  },
  'social-media': {
      "title": "Social",
      "type": "social-media",
      "fields": [
          {
              "platform": "linkedin",
              "handle": "@company"
          }
      ]
  }
};

// ============================================================================
// EDGE CASE FIXTURES (Boundary values, special chars, etc.)
// ============================================================================

/**
 * Edge case section fixtures - boundary values and special cases
 * Use for: edge case testing, error handling, XSS prevention
 */
export const EDGE_CASE_FIXTURES: Partial<SectionFixtures> = {
  'info': {
      "title": "Info Section with Very Long Title That Should Be Truncated Properly",
      "type": "info",
      "fields": [
          {
              "label": "Empty Value",
              "value": ""
          },
          {
              "label": "Null Value",
              "value": null
          },
          {
              "label": "Number",
              "value": 12345.6789
          },
          {
              "label": "Boolean",
              "value": true
          }
      ]
  },
  'analytics': {
      "title": "Analytics Edge Cases",
      "type": "analytics",
      "fields": [
          {
              "label": "Zero",
              "value": "0%",
              "percentage": 0,
              "trend": "down",
              "change": -100
          },
          {
              "label": "Negative",
              "value": "-15%",
              "percentage": -15,
              "performance": "poor",
              "trend": "down"
          },
          {
              "label": "Max",
              "value": "100%",
              "percentage": 100,
              "trend": "up",
              "change": 999.99
          }
      ]
  },
  'contact-card': {
      "title": "Contact Edge Cases",
      "type": "contact-card",
      "fields": [
          {
              "title": "No Email",
              "value": "No contact info available"
          },
          {
              "title": "Long Name That Exceeds Normal Display Width",
              "email": "very.long.email@subdomain.domain.example.com"
          }
      ]
  },
  'network-card': {
      "title": "Network Edge Cases",
      "type": "network-card",
      "items": [
          {
              "title": "Zero Influence",
              "meta": {
                  "influence": 0,
                  "connections": 0
              }
          },
          {
              "title": "Max Values",
              "meta": {
                  "influence": 100,
                  "connections": 9999
              }
          }
      ]
  },
  'map': {
      "title": "Map Edge Cases",
      "type": "map",
      "fields": [
          {
              "name": "North Pole",
              "x": 90,
              "y": 0
          },
          {
              "name": "South Pole",
              "x": -90,
              "y": 0
          },
          {
              "name": "Date Line",
              "x": 0,
              "y": 180
          }
      ]
  },
  'financials': {
      "title": "Financial Edge Cases",
      "type": "financials",
      "fields": [
          {
              "label": "Zero Revenue",
              "value": "$0",
              "change": 0
          },
          {
              "label": "Negative",
              "value": "-$10M",
              "change": -100,
              "trend": "down"
          },
          {
              "label": "Large Number",
              "value": "$999,999,999,999",
              "change": 9999.99
          }
      ]
  },
  'event': {
      "title": "Event Edge Cases",
      "type": "event",
      "fields": [
          {
              "label": "Past Event",
              "date": "2020-01-01",
              "status": "completed"
          },
          {
              "label": "Far Future",
              "date": "2099-12-31",
              "status": "pending"
          },
          {
              "label": "Cancelled",
              "date": "2025-01-01",
              "status": "cancelled"
          }
      ]
  },
  'list': {
      "title": "List Edge Cases",
      "type": "list",
      "items": [
          {
              "title": "",
              "description": "Empty title"
          },
          {
              "title": "Unicode",
              "description": "日本語 中文 العربية 한국어 🎉🚀💡"
          }
      ]
  },
  'chart': {
      "title": "Chart Edge Cases",
      "type": "chart",
      "chartType": "line",
      "chartData": {
          "labels": [
              "1",
              "2",
              "3",
              "4",
              "5"
          ],
          "datasets": [
              {
                  "label": "Negative",
                  "data": [
                      -50,
                      -25,
                      0,
                      25,
                      50
                  ]
              },
              {
                  "label": "Large",
                  "data": [
                      1000000,
                      2000000,
                      1500000,
                      2500000,
                      3000000
                  ]
              }
          ]
      }
  },
  'product': {
      "title": "Product Edge Cases",
      "type": "product",
      "fields": [
          {
              "label": "Version",
              "value": "0.0.0-alpha.1"
          },
          {
              "label": "SKU",
              "value": "ABC-123-XYZ"
          }
      ]
  },
  'solutions': {
      "title": "Solutions Edge Cases",
      "type": "solutions",
      "fields": [
          {
              "title": "No Benefits",
              "description": "Solution without benefits array"
          },
          {
              "title": "Many Benefits",
              "benefits": [
                  "Benefit 1",
                  "Benefit 2",
                  "Benefit 3",
                  "Benefit 4",
                  "Benefit 5"
              ]
          }
      ]
  },
  'overview': {
      "title": "Overview Edge Cases",
      "type": "overview",
      "fields": [
          {
              "label": "Long Text",
              "value": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
          }
      ]
  },
  'quotation': {
      "title": "Quotation Edge Cases",
      "type": "quotation",
      "fields": [
          {
              "value": "'Single quotes' and \"double quotes\" mixed"
          }
      ]
  },
  'text-reference': {
      "title": "Reference Edge Cases",
      "type": "text-reference",
      "fields": [
          {
              "label": "No URL",
              "value": "Document without link"
          }
      ]
  },
  'brand-colors': {
      "title": "Color Edge Cases",
      "type": "brand-colors",
      "fields": [
          {
              "label": "RGB",
              "value": "rgb(255, 121, 0)"
          },
          {
              "label": "RGBA",
              "value": "rgba(255, 121, 0, 0.5)"
          },
          {
              "label": "Invalid",
              "value": "not-a-color"
          }
      ]
  },
  'news': {
      "title": "News Edge Cases",
      "type": "news",
      "items": [
          {
              "title": "Old News",
              "meta": {
                  "date": "2000-01-01"
              }
          },
          {
              "title": "No Source",
              "meta": {}
          }
      ]
  },
  'social-media': {
      "title": "Social Edge Cases",
      "type": "social-media",
      "fields": [
          {
              "platform": "unknown",
              "handle": ""
          }
      ]
  }
};

// ============================================================================
// FIXTURE ACCESS FUNCTIONS
// ============================================================================

/**
 * Get a fixture for a specific section type and category
 */
export function getFixture(
  type: SectionType,
  category: FixtureCategory = 'complete'
): CardSection | undefined {
  switch (category) {
    case 'complete':
      return COMPLETE_FIXTURES[type];
    case 'minimal':
      return MINIMAL_FIXTURES[type];
    case 'edgeCases':
      return EDGE_CASE_FIXTURES[type];
    default:
      return COMPLETE_FIXTURES[type];
  }
}

/**
 * Get all fixtures for a category
 */
export function getAllFixtures(category: FixtureCategory = 'complete'): CardSection[] {
  const fixtures = category === 'complete' 
    ? COMPLETE_FIXTURES 
    : category === 'minimal' 
      ? MINIMAL_FIXTURES 
      : EDGE_CASE_FIXTURES;
  
  return Object.values(fixtures).filter((f): f is CardSection => f !== undefined);
}

/**
 * Get fixture with unique ID (for tests that need multiple instances)
 */
export function getFixtureWithUniqueId(
  type: SectionType,
  category: FixtureCategory = 'complete'
): CardSection | undefined {
  const fixture = getFixture(type, category);
  if (!fixture) return undefined;
  
  return {
    ...fixture,
    id: `${fixture.id || type}-${Math.random().toString(36).substring(7)}`
  };
}

// ============================================================================
// SAMPLE CARDS (Pre-built cards using fixtures)
// ============================================================================

/**
 * Sample company card using registry fixtures
 */
export const SAMPLE_COMPANY_CARD: AICardConfig = {
  id: 'sample-company',
  cardTitle: 'Acme Corporation',
  cardType: 'company',
  description: 'A sample company card built from registry fixtures',
  sections: [
    COMPLETE_FIXTURES['info']!,
    COMPLETE_FIXTURES['analytics']!,
    COMPLETE_FIXTURES['contact-card']!
  ].filter(Boolean),
  actions: [
    { id: 'view', label: 'View Profile', variant: 'primary' },
    { id: 'contact', label: 'Contact', variant: 'secondary' }
  ]
};

/**
 * Sample analytics card using registry fixtures
 */
export const SAMPLE_ANALYTICS_CARD: AICardConfig = {
  id: 'sample-analytics',
  cardTitle: 'Q4 Performance Dashboard',
  cardType: 'analytics',
  sections: [
    COMPLETE_FIXTURES['analytics']!,
    COMPLETE_FIXTURES['chart']!,
    COMPLETE_FIXTURES['financials']!
  ].filter(Boolean)
};

/**
 * Sample news card using registry fixtures
 */
export const SAMPLE_NEWS_CARD: AICardConfig = {
  id: 'sample-news',
  cardTitle: 'Latest Updates',
  sections: [
    COMPLETE_FIXTURES['news']!,
    COMPLETE_FIXTURES['event']!
  ].filter(Boolean)
};

/**
 * All sections card (complete fixtures)
 */
export const ALL_SECTIONS_CARD: AICardConfig = {
  id: 'all-sections',
  cardTitle: 'All Section Types Demo',
  description: 'Card containing all section types for comprehensive testing',
  sections: getAllFixtures('complete')
};

/**
 * Minimal all sections card
 */
export const MINIMAL_ALL_SECTIONS_CARD: AICardConfig = {
  id: 'minimal-all-sections',
  cardTitle: 'Minimal Sections',
  sections: getAllFixtures('minimal')
};

/**
 * Edge case all sections card
 */
export const EDGE_CASE_ALL_SECTIONS_CARD: AICardConfig = {
  id: 'edge-case-all-sections',
  cardTitle: 'Edge Case Sections',
  sections: getAllFixtures('edgeCases')
};

// ============================================================================
// COLLECTION EXPORTS
// ============================================================================

/**
 * All section fixtures organized by category
 */
export const SECTION_FIXTURES = {
  complete: COMPLETE_FIXTURES,
  minimal: MINIMAL_FIXTURES,
  edgeCases: EDGE_CASE_FIXTURES
} as const;

/**
 * All sample cards
 */
export const SAMPLE_CARDS = {
  company: SAMPLE_COMPANY_CARD,
  analytics: SAMPLE_ANALYTICS_CARD,
  news: SAMPLE_NEWS_CARD,
  allSections: ALL_SECTIONS_CARD,
  minimalAllSections: MINIMAL_ALL_SECTIONS_CARD,
  edgeCaseAllSections: EDGE_CASE_ALL_SECTIONS_CARD
} as const;

/**
 * Get available section types that have fixtures
 */
export function getAvailableSectionTypes(category: FixtureCategory = 'complete'): SectionType[] {
  const fixtures = SECTION_FIXTURES[category];
  return Object.keys(fixtures).filter(
    (key): key is SectionType => fixtures[key as SectionType] !== undefined
  );
}
