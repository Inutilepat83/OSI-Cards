/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Test Card Builder generated from section-registry.json
 * Run: npm run generate:tests
 */

import { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../../models';

/**
 * Section type fixtures for testing
 */
export const SECTION_FIXTURES = {
  'info': {
    complete: {
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
    minimal: {
        "title": "Info",
        "type": "info",
        "fields": [
            {
                "label": "Key",
                "value": "Value"
            }
        ]
    },
    edgeCases: {
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
    }
  },
  'analytics': {
    complete: {
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
    minimal: {
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
    edgeCases: {
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
    }
  },
  'contact-card': {
    complete: {
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
    minimal: {
        "title": "Contact",
        "type": "contact-card",
        "fields": [
            {
                "title": "Contact Name",
                "email": "contact@example.com"
            }
        ]
    },
    edgeCases: {
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
    }
  },
  'network-card': {
    complete: {
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
    minimal: {
        "title": "Network",
        "type": "network-card",
        "items": [
            {
                "title": "Partner"
            }
        ]
    },
    edgeCases: {
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
    }
  },
  'map': {
    complete: {
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
    minimal: {
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
    edgeCases: {
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
    }
  },
  'financials': {
    complete: {
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
    minimal: {
        "title": "Financials",
        "type": "financials",
        "fields": [
            {
                "label": "Revenue",
                "value": "$1M"
            }
        ]
    },
    edgeCases: {
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
    }
  },
  'event': {
    complete: {
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
                "status": "confirmed"
            },
            {
                "label": "Annual Conference",
                "value": "User Summit 2025",
                "date": "2025-06-20",
                "time": "09:00",
                "category": "Conference",
                "status": "planned"
            },
            {
                "label": "Board Meeting",
                "value": "Q2 Review",
                "date": "2025-04-10",
                "time": "14:00",
                "category": "Internal",
                "status": "confirmed"
            }
        ]
    },
    minimal: {
        "title": "Events",
        "type": "event",
        "fields": [
            {
                "label": "Event",
                "value": "TBD"
            }
        ]
    },
    edgeCases: {
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
                "status": "tentative"
            },
            {
                "label": "Cancelled",
                "date": "2025-01-01",
                "status": "cancelled"
            }
        ]
    }
  },
  'list': {
    complete: {
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
    minimal: {
        "title": "List",
        "type": "list",
        "items": [
            {
                "title": "Item 1"
            }
        ]
    },
    edgeCases: {
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
    }
  },
  'chart': {
    complete: {
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
    minimal: {
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
    edgeCases: {
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
    }
  },
  'product': {
    complete: {
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
    minimal: {
        "title": "Product",
        "type": "product",
        "fields": [
            {
                "label": "Name",
                "value": "Product"
            }
        ]
    },
    edgeCases: {
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
    }
  },
  'solutions': {
    complete: {
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
    minimal: {
        "title": "Solutions",
        "type": "solutions",
        "fields": [
            {
                "title": "Solution",
                "description": "Description"
            }
        ]
    },
    edgeCases: {
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
    }
  },
  'overview': {
    complete: {
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
    minimal: {
        "title": "Overview",
        "type": "overview",
        "fields": [
            {
                "label": "Summary",
                "value": "Overview text"
            }
        ]
    },
    edgeCases: {
        "title": "Overview Edge Cases",
        "type": "overview",
        "fields": [
            {
                "label": "Long Text",
                "value": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
            }
        ]
    }
  },
  'quotation': {
    complete: {
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
    minimal: {
        "title": "Quote",
        "type": "quotation",
        "fields": [
            {
                "value": "\"Quote text\""
            }
        ]
    },
    edgeCases: {
        "title": "Quotation Edge Cases",
        "type": "quotation",
        "fields": [
            {
                "value": "'Single quotes' and \"double quotes\" mixed"
            }
        ]
    }
  },
  'text-reference': {
    complete: {
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
    minimal: {
        "title": "Reference",
        "type": "text-reference",
        "fields": [
            {
                "label": "Doc",
                "value": "Document"
            }
        ]
    },
    edgeCases: {
        "title": "Reference Edge Cases",
        "type": "text-reference",
        "fields": [
            {
                "label": "No URL",
                "value": "Document without link"
            }
        ]
    }
  },
  'brand-colors': {
    complete: {
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
    minimal: {
        "title": "Colors",
        "type": "brand-colors",
        "fields": [
            {
                "label": "Primary",
                "value": "#000000"
            }
        ]
    },
    edgeCases: {
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
    }
  },
  'news': {
    complete: {
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
                "status": "published"
            },
            {
                "title": "New Product Launch Announced",
                "description": "Enterprise Suite 4.0 coming Spring 2025",
                "meta": {
                    "source": "Press Release",
                    "date": "2025-01-10"
                },
                "status": "published"
            }
        ]
    },
    minimal: {
        "title": "News",
        "type": "news",
        "items": [
            {
                "title": "News Item"
            }
        ]
    },
    edgeCases: {
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
    }
  },
  'social-media': {
    complete: {
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
    },
    minimal: {
        "title": "Social",
        "type": "social-media",
        "fields": [
            {
                "platform": "linkedin",
                "handle": "@company"
            }
        ]
    },
    edgeCases: {
        "title": "Social Edge Cases",
        "type": "social-media",
        "fields": [
            {
                "platform": "unknown",
                "handle": ""
            }
        ]
    }
  }
} as const;

export type SectionFixtureType = keyof typeof SECTION_FIXTURES;
export type FixtureVariant = 'complete' | 'minimal' | 'edgeCases';

/**
 * Test Card Builder - Fluent API for creating test card configurations
 */
export class TestCardBuilder {
  private config: Partial<AICardConfig> = {};

  constructor(title: string = 'Test Card') {
    this.config = {
      cardTitle: title,
      sections: [],
      actions: []
    };
  }

  /**
   * Static factory method
   */
  static create(title?: string): TestCardBuilder {
    return new TestCardBuilder(title);
  }

  /**
   * Set card title
   */
  withTitle(title: string): TestCardBuilder {
    this.config.cardTitle = title;
    return this;
  }

  /**
   * Set card subtitle
   */
  withSubtitle(subtitle: string): TestCardBuilder {
    this.config.description = subtitle;
    return this;
  }

  /**
   * Add a section from fixtures
   */
  withSection(type: SectionFixtureType, variant: FixtureVariant = 'complete'): TestCardBuilder {
    const fixture = SECTION_FIXTURES[type]?.[variant];
    if (fixture) {
      this.config.sections = [...(this.config.sections || []), fixture as CardSection];
    }
    return this;
  }

  /**
   * Add a custom section
   */
  withCustomSection(section: CardSection): TestCardBuilder {
    this.config.sections = [...(this.config.sections || []), section];
    return this;
  }

  /**
   * Add all sections (kitchen sink)
   */
  withAllSections(variant: FixtureVariant = 'complete'): TestCardBuilder {
    Object.keys(SECTION_FIXTURES).forEach(type => {
      this.withSection(type as SectionFixtureType, variant);
    });
    return this;
  }

  /**
   * Add sections by category
   */
  withDataSections(variant: FixtureVariant = 'complete'): TestCardBuilder {
    const dataSections: SectionFixtureType[] = ['analytics', 'chart', 'financials'];
    dataSections.forEach(type => this.withSection(type, variant));
    return this;
  }

  withEntitySections(variant: FixtureVariant = 'complete'): TestCardBuilder {
    const entitySections: SectionFixtureType[] = ['contact-card', 'network-card', 'product', 'solutions'];
    entitySections.forEach(type => this.withSection(type, variant));
    return this;
  }

  withContentSections(variant: FixtureVariant = 'complete'): TestCardBuilder {
    const contentSections: SectionFixtureType[] = ['info', 'overview', 'list', 'event', 'news'];
    contentSections.forEach(type => this.withSection(type, variant));
    return this;
  }

  /**
   * Add an action
   */
  withAction(action: CardAction): TestCardBuilder {
    this.config.actions = [...(this.config.actions || []), action];
    return this;
  }

  /**
   * Add default actions
   */
  withDefaultActions(): TestCardBuilder {
    this.config.actions = [
      { label: 'Learn More', type: 'website', variant: 'primary', url: 'https://example.com' },
      { label: 'Contact', type: 'mail', variant: 'secondary', 
        email: { contact: { name: 'Test', email: 'test@example.com', role: 'Tester' }, subject: 'Test', body: 'Test' } }
    ];
    return this;
  }

  /**
   * Build the final card configuration
   */
  build(): AICardConfig {
    return this.config as AICardConfig;
  }

  /**
   * Build and return as JSON string
   */
  toJSON(): string {
    return JSON.stringify(this.build(), null, 2);
  }
}

/**
 * Quick factory functions for common test scenarios
 */
export const TestCards = {
  /**
   * Create a minimal test card
   */
  minimal: (type: SectionFixtureType = 'info') => 
    TestCardBuilder.create('Minimal Test Card').withSection(type, 'minimal').build(),

  /**
   * Create a complete test card
   */
  complete: (type: SectionFixtureType = 'info') => 
    TestCardBuilder.create('Complete Test Card').withSection(type, 'complete').build(),

  /**
   * Create an edge case test card
   */
  edgeCase: (type: SectionFixtureType = 'info') => 
    TestCardBuilder.create('Edge Case Test Card').withSection(type, 'edgeCases').build(),

  /**
   * Create a kitchen sink card with all sections
   */
  kitchenSink: (variant: FixtureVariant = 'complete') => 
    TestCardBuilder.create('Kitchen Sink').withAllSections(variant).withDefaultActions().build(),

  /**
   * Create a card for a specific section type
   */
  forSection: (type: SectionFixtureType, variant: FixtureVariant = 'complete') =>
    TestCardBuilder.create(`${type} Test Card`).withSection(type, variant).build(),

  /**
   * Get all section types
   */
  getSectionTypes: (): SectionFixtureType[] => Object.keys(SECTION_FIXTURES) as SectionFixtureType[],

  /**
   * Get fixture for a section type
   */
  getFixture: (type: SectionFixtureType, variant: FixtureVariant = 'complete') => 
    SECTION_FIXTURES[type]?.[variant]
};

/**
 * Random test data generator
 */
export class RandomTestData {
  private static randomId = () => Math.random().toString(36).substring(7);
  private static randomInt = (min: number, max: number) => 
    Math.floor(Math.random() * (max - min + 1)) + min;

  /**
   * Generate random field data
   */
  static randomField(): CardField {
    return {
      id: this.randomId(),
      label: `Field ${this.randomId()}`,
      value: `Value ${this.randomInt(1, 1000)}`,
      icon: ['📊', '📈', '📉', '💼', '🎯'][this.randomInt(0, 4)]
    };
  }

  /**
   * Generate random item data
   */
  static randomItem(): CardItem {
    return {
      id: this.randomId(),
      title: `Item ${this.randomId()}`,
      description: `Description for item ${this.randomId()}`,
      status: ['completed', 'in-progress', 'pending'][this.randomInt(0, 2)] as any
    };
  }

  /**
   * Generate random section
   */
  static randomSection(type: SectionFixtureType): CardSection {
    const base = SECTION_FIXTURES[type]?.minimal || { title: type, type };
    return {
      ...base,
      id: this.randomId(),
      title: `${base.title} ${this.randomId()}`
    } as CardSection;
  }

  /**
   * Generate a randomized test card
   */
  static randomCard(sectionCount: number = 3): AICardConfig {
    const types = Object.keys(SECTION_FIXTURES) as SectionFixtureType[];
    const builder = TestCardBuilder.create(`Random Card ${this.randomId()}`);
    
    for (let i = 0; i < sectionCount; i++) {
      const type = types[this.randomInt(0, types.length - 1)];
      builder.withCustomSection(this.randomSection(type));
    }
    
    return builder.build();
  }
}
