/**
 * Generated Registry Fixtures
 *
 * Auto-generated section fixtures from the section registry.
 * This file provides sample data for testing and documentation.
 *
 * DO NOT EDIT MANUALLY - regenerate with `npm run generate:from-registry`
 *
 * Source: Individual *.definition.json files in section folders
 * Generated: 2025-12-02T10:32:24.373Z
 */

import type { AICardConfig, CardSection } from '../models/card.model';

// ============================================================================
// TYPES
// ============================================================================

export type FixtureCategory = 'complete' | 'minimal' | 'edge-case';

export interface SectionFixtures {
  complete: CardSection;
  minimal: CardSection;
  edgeCase: CardSection;
}

// ============================================================================
// COMPLETE FIXTURES (Rich examples from definition files)
// ============================================================================

export const COMPLETE_FIXTURES: Record<string, CardSection> = {
  "analytics": {
    "id": "analytics-complete",
    "title": "Q4 2024 Performance Dashboard",
    "type": "analytics",
    "description": "Comprehensive business metrics and KPIs",
    "fields": [
      {
        "label": "Revenue Growth",
        "value": "47.3% YoY",
        "percentage": 47,
        "performance": "excellent",
        "trend": "up",
        "change": 12.8
      },
      {
        "label": "Customer Acquisition Cost",
        "value": "$124",
        "percentage": 78,
        "performance": "good",
        "trend": "down",
        "change": -8.5
      },
      {
        "label": "Monthly Active Users",
        "value": "2.4M",
        "percentage": 89,
        "performance": "excellent",
        "trend": "up",
        "change": 31.2
      },
      {
        "label": "Net Promoter Score",
        "value": "72",
        "percentage": 72,
        "performance": "excellent",
        "trend": "up",
        "change": 5
      },
      {
        "label": "Customer Lifetime Value",
        "value": "$8,450",
        "percentage": 84,
        "performance": "excellent",
        "trend": "up",
        "change": 18.3
      },
      {
        "label": "Churn Rate",
        "value": "2.1%",
        "percentage": 21,
        "performance": "excellent",
        "trend": "down",
        "change": -0.8
      },
      {
        "label": "Average Deal Size",
        "value": "$45K",
        "percentage": 65,
        "performance": "good",
        "trend": "up",
        "change": 7.2
      },
      {
        "label": "Sales Cycle Length",
        "value": "34 days",
        "percentage": 55,
        "performance": "average",
        "trend": "stable",
        "change": -2
      },
      {
        "label": "Pipeline Coverage",
        "value": "4.2x",
        "percentage": 84,
        "performance": "excellent",
        "trend": "up",
        "change": 0.5
      },
      {
        "label": "Win Rate",
        "value": "38%",
        "percentage": 38,
        "performance": "average",
        "trend": "up",
        "change": 3.1
      },
      {
        "label": "Employee Satisfaction",
        "value": "4.6/5",
        "percentage": 92,
        "performance": "excellent",
        "trend": "stable"
      },
      {
        "label": "Product Uptime",
        "value": "99.97%",
        "percentage": 99,
        "performance": "excellent",
        "trend": "stable"
      }
    ]
  },
  "brand-colors": {
    "id": "brand-colors-complete",
    "title": "Nexus Brand Identity System",
    "type": "brand-colors",
    "description": "Official brand color palette and design tokens",
    "fields": [
      {
        "label": "Nexus Orange",
        "value": "#FF7900",
        "description": "Primary brand color - CTAs, highlights, key actions",
        "category": "Primary"
      },
      {
        "label": "Nexus Orange Light",
        "value": "#FF9933",
        "description": "Hover states, secondary highlights",
        "category": "Primary"
      },
      {
        "label": "Nexus Orange Dark",
        "value": "#CC6100",
        "description": "Active states, emphasis",
        "category": "Primary"
      },
      {
        "label": "Midnight Blue",
        "value": "#0A1628",
        "description": "Primary text, headers, dark backgrounds",
        "category": "Secondary"
      },
      {
        "label": "Deep Navy",
        "value": "#1A2744",
        "description": "Secondary backgrounds, cards",
        "category": "Secondary"
      },
      {
        "label": "Slate Gray",
        "value": "#64748B",
        "description": "Secondary text, borders, icons",
        "category": "Neutral"
      },
      {
        "label": "Silver",
        "value": "#E2E8F0",
        "description": "Dividers, subtle backgrounds",
        "category": "Neutral"
      },
      {
        "label": "Cloud White",
        "value": "#F8FAFC",
        "description": "Page backgrounds, card surfaces",
        "category": "Neutral"
      },
      {
        "label": "Pure White",
        "value": "#FFFFFF",
        "description": "Card backgrounds, contrast areas",
        "category": "Neutral"
      },
      {
        "label": "Success Green",
        "value": "#10B981",
        "description": "Success states, positive trends, completion",
        "category": "Semantic"
      },
      {
        "label": "Warning Amber",
        "value": "#F59E0B",
        "description": "Warning states, caution indicators",
        "category": "Semantic"
      },
      {
        "label": "Error Red",
        "value": "#EF4444",
        "description": "Error states, critical alerts",
        "category": "Semantic"
      },
      {
        "label": "Info Blue",
        "value": "#3B82F6",
        "description": "Informational, links, interactive elements",
        "category": "Semantic"
      },
      {
        "label": "Chart Teal",
        "value": "#14B8A6",
        "description": "Data visualization - series 1",
        "category": "Data Viz"
      },
      {
        "label": "Chart Purple",
        "value": "#8B5CF6",
        "description": "Data visualization - series 2",
        "category": "Data Viz"
      },
      {
        "label": "Chart Pink",
        "value": "#EC4899",
        "description": "Data visualization - series 3",
        "category": "Data Viz"
      }
    ]
  },
  "chart": {
    "id": "chart-complete",
    "title": "Revenue & Growth Analysis",
    "type": "chart",
    "chartType": "bar",
    "chartData": {
      "labels": [
        "Q1 2024",
        "Q2 2024",
        "Q3 2024",
        "Q4 2024",
        "Q1 2025 (Proj)"
      ],
      "datasets": [
        {
          "label": "Revenue ($M)",
          "data": [
            28.5,
            32.1,
            35.8,
            42.4,
            48.2
          ],
          "backgroundColor": "#FF7900",
          "borderColor": "#FF7900",
          "borderWidth": 1
        },
        {
          "label": "Operating Costs ($M)",
          "data": [
            22.1,
            24.3,
            26.8,
            31.2,
            34.5
          ],
          "backgroundColor": "#4CAF50",
          "borderColor": "#4CAF50",
          "borderWidth": 1
        },
        {
          "label": "Net Profit ($M)",
          "data": [
            6.4,
            7.8,
            9,
            11.2,
            13.7
          ],
          "backgroundColor": "#2196F3",
          "borderColor": "#2196F3",
          "borderWidth": 1
        }
      ]
    }
  },
  "contact-card": {
    "id": "contact-card-complete",
    "title": "Executive Leadership Team",
    "type": "contact-card",
    "description": "Key decision makers and stakeholders",
    "fields": [
      {
        "label": "Chief Executive Officer",
        "title": "Dr. Sarah Mitchell",
        "value": "CEO & Co-Founder",
        "email": "sarah.mitchell@nexustech.io",
        "phone": "+1 (512) 555-0100",
        "role": "Chief Executive Officer",
        "department": "Executive",
        "location": "Austin, TX",
        "linkedIn": "https://linkedin.com/in/sarahmitchell",
        "twitter": "@sarahmitchell"
      },
      {
        "label": "Chief Technology Officer",
        "title": "James Park",
        "value": "CTO & Co-Founder",
        "email": "james.park@nexustech.io",
        "phone": "+1 (512) 555-0101",
        "role": "Chief Technology Officer",
        "department": "Engineering",
        "location": "Austin, TX",
        "linkedIn": "https://linkedin.com/in/jamespark"
      },
      {
        "label": "Chief Revenue Officer",
        "title": "Maria Santos",
        "value": "CRO",
        "email": "maria.santos@nexustech.io",
        "phone": "+1 (512) 555-0102",
        "role": "Chief Revenue Officer",
        "department": "Sales",
        "location": "New York, NY",
        "linkedIn": "https://linkedin.com/in/mariasantos"
      },
      {
        "label": "Chief Financial Officer",
        "title": "David Thompson",
        "value": "CFO",
        "email": "david.thompson@nexustech.io",
        "phone": "+44 20 7946 0958",
        "role": "Chief Financial Officer",
        "department": "Finance",
        "location": "London, UK",
        "linkedIn": "https://linkedin.com/in/davidthompson"
      },
      {
        "label": "VP of Engineering",
        "title": "Dr. Wei Chen",
        "value": "VP Engineering - Platform",
        "email": "wei.chen@nexustech.io",
        "phone": "+65 6823 4567",
        "role": "VP of Engineering",
        "department": "Engineering",
        "location": "Singapore"
      },
      {
        "label": "VP of Customer Success",
        "title": "Rachel Green",
        "value": "VP Customer Success",
        "email": "rachel.green@nexustech.io",
        "phone": "+1 (512) 555-0105",
        "role": "VP of Customer Success",
        "department": "Customer Success",
        "location": "Austin, TX"
      }
    ]
  },
  "event": {
    "id": "event-complete",
    "title": "Q1 2025 Key Events",
    "type": "event",
    "description": "Major company events and milestones",
    "fields": [
      {
        "label": "Annual Sales Kickoff",
        "value": "SKO 2025 - Revenue Excellence",
        "date": "2025-01-15",
        "endDate": "2025-01-17",
        "time": "09:00",
        "category": "Sales",
        "status": "confirmed",
        "location": "Austin Convention Center, TX",
        "attendees": 450
      },
      {
        "label": "Board Meeting",
        "value": "Q4 2024 Results Review",
        "date": "2025-01-28",
        "time": "14:00",
        "category": "Corporate",
        "status": "confirmed",
        "location": "Virtual",
        "attendees": 12
      },
      {
        "label": "Product Launch",
        "value": "Nexus Analytics 5.0 Release",
        "date": "2025-02-10",
        "time": "10:00",
        "category": "Product",
        "status": "confirmed",
        "location": "Global Webcast"
      },
      {
        "label": "Customer Summit",
        "value": "NexusCon 2025 - AI Future",
        "date": "2025-03-18",
        "endDate": "2025-03-20",
        "time": "08:00",
        "category": "Conference",
        "status": "planned",
        "location": "Moscone Center, San Francisco",
        "attendees": 3500
      },
      {
        "label": "Investor Day",
        "value": "Annual Investor Relations Event",
        "date": "2025-03-25",
        "time": "09:30",
        "category": "Finance",
        "status": "planned",
        "location": "New York Stock Exchange",
        "attendees": 200
      },
      {
        "label": "Partner Summit",
        "value": "Global Partner Ecosystem Meeting",
        "date": "2025-04-08",
        "endDate": "2025-04-09",
        "time": "09:00",
        "category": "Partnership",
        "status": "tentative",
        "location": "London, UK",
        "attendees": 180
      },
      {
        "label": "Engineering All-Hands",
        "value": "Technical Roadmap Review",
        "date": "2025-02-28",
        "time": "16:00",
        "category": "Internal",
        "status": "confirmed",
        "location": "Virtual",
        "attendees": 850
      },
      {
        "label": "AWS re:Invent Presence",
        "value": "Booth #1234 + Speaking Sessions",
        "date": "2025-12-01",
        "endDate": "2025-12-05",
        "time": "08:00",
        "category": "Conference",
        "status": "planned",
        "location": "Las Vegas, NV"
      }
    ]
  },
  "faq": {
    "id": "faq-complete",
    "title": "Frequently Asked Questions",
    "type": "faq",
    "description": "Common questions about Nexus Analytics platform",
    "items": [
      {
        "title": "What is Nexus Analytics and how does it work?",
        "description": "Nexus Analytics is an AI-powered business intelligence platform that transforms raw data into actionable insights. It connects to your existing data sources (databases, cloud apps, spreadsheets), automatically models relationships, and provides intuitive dashboards and natural language querying. Our AI engine continuously learns from your data to surface relevant insights and anomalies.",
        "meta": {
          "category": "General"
        }
      },
      {
        "title": "How long does implementation typically take?",
        "description": "Implementation timeline varies based on complexity. Basic deployments with standard connectors can be completed in 2-4 weeks. Enterprise implementations with custom integrations, SSO setup, and advanced governance typically take 8-12 weeks. Our Professional Services team provides dedicated project management throughout the process.",
        "meta": {
          "category": "Implementation"
        }
      },
      {
        "title": "What data sources does Nexus support?",
        "description": "Nexus supports 200+ native connectors including cloud databases (Snowflake, BigQuery, Redshift), CRM systems (Salesforce, HubSpot), ERP platforms (SAP, Oracle, NetSuite), file storage (S3, Azure Blob), and popular SaaS tools. We also offer a REST API for custom integrations and CSV/Excel file uploads for ad-hoc analysis.",
        "meta": {
          "category": "Technical"
        }
      },
      {
        "title": "Is my data secure with Nexus?",
        "description": "Security is our top priority. Nexus is SOC 2 Type II certified, ISO 27001 compliant, GDPR ready, and HIPAA eligible. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We offer data residency options in US, EU, and APAC. Role-based access control, SSO integration, and comprehensive audit logging ensure complete data governance.",
        "meta": {
          "category": "Security"
        }
      },
      {
        "title": "What pricing plans are available?",
        "description": "We offer three tiers: Starter ($500/mo for small teams), Business ($2,500/mo for growing companies), and Enterprise (custom pricing for large organizations). All plans include unlimited users. Enterprise adds advanced security, dedicated support, custom SLAs, and professional services. Contact sales for volume discounts and custom packaging.",
        "meta": {
          "category": "Pricing"
        }
      },
      {
        "title": "Can I try Nexus before purchasing?",
        "description": "Yes! We offer a 14-day free trial with full access to all features. You can connect your own data or explore with sample datasets. For enterprise evaluations, we provide extended POC periods with dedicated technical support. No credit card required to start your trial.",
        "meta": {
          "category": "Getting Started"
        }
      },
      {
        "title": "What kind of support is included?",
        "description": "All plans include email support with 24-hour response SLA and access to our comprehensive documentation and video tutorials. Business plans add live chat support. Enterprise customers receive 24/7 phone support, dedicated Customer Success Manager, and quarterly business reviews.",
        "meta": {
          "category": "Support"
        }
      },
      {
        "title": "Does Nexus integrate with my existing BI tools?",
        "description": "Nexus can complement or replace existing BI tools. We offer export capabilities to Excel, PDF, and common formats. Our embedding SDK allows you to integrate Nexus visualizations into existing applications. For migrations, we provide tools to import existing dashboards and reports from Tableau, Power BI, and Looker.",
        "meta": {
          "category": "Integration"
        }
      },
      {
        "title": "How does the AI-powered insights feature work?",
        "description": "Our AI engine analyzes your data continuously to identify trends, anomalies, and correlations. It proactively surfaces insights you might have missed, explains why metrics changed, and predicts future outcomes. You can also ask questions in natural language like 'Why did sales drop last week?' and get AI-generated explanations with supporting visualizations.",
        "meta": {
          "category": "Features"
        }
      },
      {
        "title": "What training resources are available?",
        "description": "We provide multiple learning paths: Nexus Academy (40+ hours of video training), live instructor-led workshops, certification programs, and in-person training sessions for enterprise customers. Our documentation includes quick-start guides, best practice playbooks, and API reference. Customer Success teams offer personalized onboarding for new users.",
        "meta": {
          "category": "Training"
        }
      }
    ]
  },
  "financials": {
    "id": "financials-complete",
    "title": "FY2024 Financial Summary",
    "type": "financials",
    "description": "Annual financial performance and key metrics",
    "fields": [
      {
        "label": "Annual Recurring Revenue",
        "value": "$127.4M",
        "format": "currency",
        "change": 45.2,
        "trend": "up",
        "period": "FY2024"
      },
      {
        "label": "Total Revenue",
        "value": "$142.8M",
        "format": "currency",
        "change": 38.7,
        "trend": "up",
        "period": "FY2024"
      },
      {
        "label": "Gross Profit",
        "value": "$112.3M",
        "format": "currency",
        "change": 41.2,
        "trend": "up",
        "period": "FY2024"
      },
      {
        "label": "Gross Margin",
        "value": "78.6%",
        "format": "percentage",
        "change": 2.3,
        "trend": "up"
      },
      {
        "label": "Operating Expenses",
        "value": "$98.5M",
        "format": "currency",
        "change": 22.1,
        "trend": "up"
      },
      {
        "label": "EBITDA",
        "value": "$24.8M",
        "format": "currency",
        "change": 156.3,
        "trend": "up"
      },
      {
        "label": "Net Income",
        "value": "$18.2M",
        "format": "currency",
        "change": 245.8,
        "trend": "up"
      },
      {
        "label": "Operating Margin",
        "value": "17.4%",
        "format": "percentage",
        "change": 8.2,
        "trend": "up"
      },
      {
        "label": "Cash & Equivalents",
        "value": "$89.3M",
        "format": "currency",
        "change": 12.4,
        "trend": "up"
      },
      {
        "label": "Total Assets",
        "value": "$234.7M",
        "format": "currency",
        "change": 28.9,
        "trend": "up"
      },
      {
        "label": "Debt-to-Equity Ratio",
        "value": "0.34",
        "format": "ratio",
        "change": -8.1,
        "trend": "down"
      },
      {
        "label": "Free Cash Flow",
        "value": "$31.2M",
        "format": "currency",
        "change": 67.4,
        "trend": "up"
      },
      {
        "label": "R&D Investment",
        "value": "$28.4M",
        "format": "currency",
        "change": 35.2,
        "trend": "up",
        "period": "FY2024"
      },
      {
        "label": "Customer Acquisition Cost",
        "value": "$12,450",
        "format": "currency",
        "change": -12.3,
        "trend": "down"
      },
      {
        "label": "LTV/CAC Ratio",
        "value": "6.8x",
        "format": "ratio",
        "change": 23.5,
        "trend": "up"
      }
    ]
  },
  "gallery": {
    "id": "gallery-complete",
    "title": "Life at Nexus",
    "type": "gallery",
    "description": "Behind the scenes at our global offices",
    "items": [
      {
        "title": "Austin Headquarters",
        "description": "Our 50,000 sq ft headquarters in downtown Austin featuring open workspaces and collaboration zones",
        "meta": {
          "url": "https://images.nexustech.io/office/austin-hq.jpg",
          "caption": "Nexus HQ in Austin, Texas",
          "alt": "Modern office building with glass facade"
        }
      },
      {
        "title": "Engineering All-Hands",
        "description": "Quarterly engineering town hall with product roadmap presentations and team celebrations",
        "meta": {
          "url": "https://images.nexustech.io/events/eng-allhands.jpg",
          "caption": "Engineering team gathering",
          "alt": "Large group of engineers in conference room"
        }
      },
      {
        "title": "NexusCon 2024 Keynote",
        "description": "CEO Sarah Mitchell delivering the opening keynote to 3,000+ attendees in San Francisco",
        "meta": {
          "url": "https://images.nexustech.io/events/nexuscon-keynote.jpg",
          "caption": "NexusCon 2024 main stage",
          "alt": "Speaker on stage at large conference"
        }
      }
    ]
  },
  "info": {
    "id": "info-complete",
    "title": "Nexus Technologies Inc.",
    "type": "info",
    "description": "Enterprise SaaS company specializing in AI-powered analytics",
    "fields": [
      {
        "label": "Industry",
        "value": "Enterprise Software & AI",
        "icon": "🏢"
      },
      {
        "label": "Founded",
        "value": "2018",
        "icon": "📅"
      },
      {
        "label": "Headquarters",
        "value": "Austin, Texas, USA",
        "icon": "📍"
      },
      {
        "label": "Employees",
        "value": "2,847",
        "icon": "👥",
        "trend": "up",
        "change": 23.5
      },
      {
        "label": "Annual Revenue",
        "value": "$127M ARR",
        "icon": "💰",
        "trend": "up",
        "change": 45.2
      },
      {
        "label": "Funding Stage",
        "value": "Series C ($85M raised)",
        "icon": "🚀"
      },
      {
        "label": "Customer Base",
        "value": "450+ Enterprise Clients",
        "icon": "🎯"
      },
      {
        "label": "Global Offices",
        "value": "Austin, London, Singapore, São Paulo",
        "icon": "🌐"
      },
      {
        "label": "Tech Stack",
        "value": "Python, Kubernetes, AWS, Snowflake",
        "icon": "⚙️"
      },
      {
        "label": "CEO",
        "value": "Dr. Maya Chen",
        "icon": "👤"
      },
      {
        "label": "Stock Symbol",
        "value": "NXUS (NASDAQ)",
        "icon": "📈"
      },
      {
        "label": "Website",
        "value": "www.nexustech.io",
        "icon": "🔗"
      }
    ]
  },
  "list": {
    "id": "list-complete",
    "title": "Product Roadmap Q1-Q2 2025",
    "type": "list",
    "description": "Strategic initiatives and feature development",
    "items": [
      {
        "title": "AI-Powered Forecasting Engine",
        "description": "Machine learning model for predictive analytics with 95% accuracy target",
        "icon": "🤖",
        "status": "in-progress",
        "priority": "critical"
      },
      {
        "title": "Real-time Collaboration Suite",
        "description": "Multi-user editing with presence indicators and conflict resolution",
        "icon": "👥",
        "status": "in-progress",
        "priority": "high"
      },
      {
        "title": "Enterprise SSO Integration",
        "description": "SAML 2.0 and OIDC support for Okta, Azure AD, and custom IdPs",
        "icon": "🔐",
        "status": "completed",
        "priority": "high"
      }
    ]
  },
  "map": {
    "id": "map-complete",
    "title": "Global Operations Network",
    "type": "map",
    "description": "Worldwide office locations and data centers",
    "fields": [
      {
        "name": "Global Headquarters",
        "x": 30.2672,
        "y": -97.7431,
        "type": "headquarters",
        "address": "500 Congress Ave, Austin, TX 78701, USA"
      },
      {
        "name": "Americas - East",
        "x": 40.7128,
        "y": -74.006,
        "type": "regional-office",
        "address": "One World Trade Center, New York, NY 10007, USA"
      },
      {
        "name": "Americas - West",
        "x": 37.7749,
        "y": -122.4194,
        "type": "regional-office",
        "address": "525 Market St, San Francisco, CA 94105, USA"
      },
      {
        "name": "EMEA Headquarters",
        "x": 51.5074,
        "y": -0.1278,
        "type": "regional-office",
        "address": "30 St Mary Axe, London EC3A 8BF, UK"
      },
      {
        "name": "EMEA - Central",
        "x": 52.52,
        "y": 13.405,
        "type": "branch",
        "address": "Potsdamer Platz 1, 10785 Berlin, Germany"
      },
      {
        "name": "EMEA - South",
        "x": 48.8566,
        "y": 2.3522,
        "type": "branch",
        "address": "Tour Montparnasse, 75015 Paris, France"
      },
      {
        "name": "APAC Headquarters",
        "x": 1.3521,
        "y": 103.8198,
        "type": "regional-office",
        "address": "Marina Bay Sands Tower 1, Singapore 018956"
      },
      {
        "name": "APAC - North",
        "x": 35.6762,
        "y": 139.6503,
        "type": "branch",
        "address": "Roppongi Hills Mori Tower, Tokyo 106-6108, Japan"
      },
      {
        "name": "APAC - South",
        "x": -33.8688,
        "y": 151.2093,
        "type": "branch",
        "address": "1 Bligh Street, Sydney NSW 2000, Australia"
      },
      {
        "name": "APAC - India",
        "x": 12.9716,
        "y": 77.5946,
        "type": "development-center",
        "address": "Embassy Tech Village, Bangalore 560103, India"
      },
      {
        "name": "LATAM - Brazil",
        "x": -23.5505,
        "y": -46.6333,
        "type": "branch",
        "address": "Av. Paulista 1578, São Paulo, SP, Brazil"
      },
      {
        "name": "Data Center - US East",
        "x": 39.0438,
        "y": -77.4874,
        "type": "data-center",
        "address": "Ashburn, VA, USA"
      },
      {
        "name": "Data Center - EU",
        "x": 50.1109,
        "y": 8.6821,
        "type": "data-center",
        "address": "Frankfurt, Germany"
      }
    ]
  },
  "network-card": {
    "id": "network-card-complete",
    "title": "Strategic Partner Ecosystem",
    "type": "network-card",
    "description": "Key business relationships and strategic partnerships",
    "items": [
      {
        "title": "Amazon Web Services",
        "description": "Premier Consulting Partner - Cloud Infrastructure",
        "meta": {
          "influence": 95,
          "connections": 47,
          "status": "active",
          "type": "Technology Partner"
        }
      },
      {
        "title": "Sequoia Capital",
        "description": "Series C Lead Investor - $50M",
        "meta": {
          "influence": 92,
          "connections": 12,
          "status": "active",
          "type": "Investor"
        }
      },
      {
        "title": "Accenture",
        "description": "Systems Integration Partner - Enterprise Deployments",
        "meta": {
          "influence": 88,
          "connections": 34,
          "status": "active",
          "type": "Implementation Partner"
        }
      },
      {
        "title": "Snowflake",
        "description": "Data Platform Partnership - Native Integration",
        "meta": {
          "influence": 85,
          "connections": 28,
          "status": "active",
          "type": "Technology Partner"
        }
      },
      {
        "title": "Microsoft",
        "description": "Azure Marketplace Partner - Co-sell Agreement",
        "meta": {
          "influence": 90,
          "connections": 52,
          "status": "active",
          "type": "Technology Partner"
        }
      },
      {
        "title": "Deloitte",
        "description": "Advisory Partner - Digital Transformation",
        "meta": {
          "influence": 82,
          "connections": 19,
          "status": "active",
          "type": "Consulting Partner"
        }
      },
      {
        "title": "Goldman Sachs",
        "description": "Strategic Banking Partner",
        "meta": {
          "influence": 78,
          "connections": 8,
          "status": "active",
          "type": "Financial Partner"
        }
      },
      {
        "title": "TechStars",
        "description": "Accelerator Alumni Network",
        "meta": {
          "influence": 65,
          "connections": 156,
          "status": "active",
          "type": "Network"
        }
      }
    ]
  },
  "news": {
    "id": "news-complete",
    "title": "Latest News & Press Coverage",
    "type": "news",
    "description": "Recent company news, press releases, and industry recognition",
    "items": [
      {
        "title": "Nexus Technologies Closes $85M Series C to Accelerate AI Innovation",
        "description": "Funding led by Sequoia Capital will fuel expansion of AI capabilities, global go-to-market, and strategic acquisitions. Company valuation reaches $1.2B.",
        "meta": {
          "source": "TechCrunch",
          "date": "2025-01-20",
          "url": "https://techcrunch.com/nexus-series-c",
          "category": "Funding"
        },
        "status": "published"
      },
      {
        "title": "Nexus Named Leader in Gartner Magic Quadrant for Analytics & BI Platforms",
        "description": "Recognition highlights company's vision completeness and ability to execute, with highest scores for AI/ML capabilities and customer experience.",
        "meta": {
          "source": "Gartner",
          "date": "2024-12-15",
          "url": "https://gartner.com/magic-quadrant/analytics",
          "category": "Recognition"
        },
        "status": "published"
      },
      {
        "title": "Q4 2024 Revenue Exceeds $42M, Up 47% Year-Over-Year",
        "description": "Strong enterprise demand drives record quarterly results. Full-year ARR surpasses $127M with path to profitability in 2025.",
        "meta": {
          "source": "Company Press Release",
          "date": "2025-01-15",
          "category": "Earnings"
        },
        "status": "published"
      }
    ]
  },
  "overview": {
    "id": "overview-complete",
    "title": "Executive Summary",
    "type": "overview",
    "description": "Strategic company overview and positioning",
    "fields": [
      {
        "label": "About",
        "value": "Nexus Technologies is a leading enterprise software company specializing in AI-powered analytics and business intelligence solutions. Founded in 2018, we serve over 450 enterprise customers globally, helping them transform raw data into actionable insights that drive business growth."
      },
      {
        "label": "Mission",
        "value": "To democratize data intelligence by making advanced analytics accessible to every business user, regardless of technical expertise, enabling organizations to make faster, smarter, data-driven decisions."
      },
      {
        "label": "Vision",
        "value": "A world where every business decision is informed by real-time, AI-powered insights, eliminating guesswork and enabling unprecedented operational efficiency."
      },
      {
        "label": "Core Values",
        "value": "Innovation First • Customer Obsession • Radical Transparency • Continuous Learning • Inclusive Excellence"
      },
      {
        "label": "Market Position",
        "value": "Leader in Gartner Magic Quadrant for Analytics & BI Platforms 2024. Top-rated on G2 with 4.8/5 stars across 2,500+ reviews. Named to Forbes Cloud 100 for three consecutive years."
      },
      {
        "label": "Industry Focus",
        "value": "Enterprise Software • Financial Services • Healthcare & Life Sciences • Retail & E-commerce • Manufacturing • Technology"
      },
      {
        "label": "Competitive Advantage",
        "value": "Proprietary AI engine with patent-pending natural language processing, enabling 10x faster insights discovery compared to traditional BI tools."
      },
      {
        "label": "Key Differentiators",
        "value": "Real-time streaming analytics • No-code dashboard builder • Native AI/ML integration • Enterprise-grade security • Industry-specific solutions"
      }
    ]
  },
  "product": {
    "id": "product-complete",
    "title": "Nexus Analytics Enterprise",
    "type": "product",
    "description": "AI-powered business intelligence platform for data-driven enterprises",
    "fields": [
      {
        "label": "Product Name",
        "value": "Nexus Analytics Enterprise Edition"
      },
      {
        "label": "Version",
        "value": "5.2.1 LTS (Long-term Support)"
      },
      {
        "label": "Release Date",
        "value": "January 15, 2025"
      },
      {
        "label": "License Type",
        "value": "Annual Enterprise Subscription"
      },
      {
        "label": "Starting Price",
        "value": "$2,500/month (billed annually)",
        "price": "$2,500/mo"
      },
      {
        "label": "Included Users",
        "value": "Unlimited users with role-based access"
      },
      {
        "label": "Data Connectors",
        "value": "200+ native connectors (Salesforce, SAP, Oracle, etc.)"
      },
      {
        "label": "Storage Included",
        "value": "5TB cloud storage with auto-scaling"
      },
      {
        "label": "API Calls",
        "value": "10M requests/month included"
      },
      {
        "label": "Support Level",
        "value": "24/7 Premium Support with dedicated CSM"
      },
      {
        "label": "SLA Guarantee",
        "value": "99.99% uptime with financial credits"
      },
      {
        "label": "Certifications",
        "value": "SOC 2 Type II, ISO 27001, GDPR, HIPAA"
      },
      {
        "label": "Deployment Options",
        "value": "Cloud, Hybrid, or On-premise"
      },
      {
        "label": "Training",
        "value": "Included: 40 hours onboarding + certification"
      },
      {
        "label": "Status",
        "value": "Generally Available",
        "status": "available"
      }
    ]
  },
  "quotation": {
    "id": "quotation-complete",
    "title": "Customer Success Stories",
    "type": "quotation",
    "description": "What industry leaders say about our platform",
    "fields": [
      {
        "label": "Enterprise Transformation",
        "value": "\"Nexus Analytics has fundamentally transformed how we approach data-driven decision making. Within six months of deployment, we've seen a 47% reduction in time-to-insight and our business users are now self-sufficient in creating their own reports. The ROI has been extraordinary.\"",
        "description": "Jennifer Martinez, Chief Data Officer at Fortune 500 Retailer",
        "author": "Jennifer Martinez",
        "role": "Chief Data Officer",
        "company": "MegaMart Corp",
        "date": "2024-11-15"
      },
      {
        "label": "Healthcare Innovation",
        "value": "\"In healthcare, data accuracy and compliance are non-negotiable. Nexus not only meets our stringent HIPAA requirements but has enabled our research teams to discover patterns that were previously invisible. We've accelerated our clinical trial analysis by 10x.\"",
        "description": "Dr. Michael Chen, VP of Research Analytics at Leading Healthcare System",
        "author": "Dr. Michael Chen",
        "role": "VP of Research Analytics",
        "company": "HealthFirst Systems"
      },
      {
        "label": "Financial Services Excellence",
        "value": "\"The real-time analytics capabilities have been game-changing for our trading desk. We're now making decisions in milliseconds that used to take hours. Our risk management team has never been more confident in their data.\"",
        "description": "Sarah Thompson, Managing Director at Global Investment Bank",
        "author": "Sarah Thompson",
        "role": "Managing Director",
        "company": "Sterling Capital Partners"
      },
      {
        "label": "Manufacturing Efficiency",
        "value": "\"We integrated Nexus with our IoT sensors across 12 manufacturing plants. The predictive maintenance insights alone have saved us $15M annually in unplanned downtime. It's become the central nervous system of our operations.\"",
        "description": "Klaus Weber, Global Head of Operations at Industrial Manufacturer",
        "author": "Klaus Weber",
        "role": "Global Head of Operations",
        "company": "PrecisionWorks AG"
      },
      {
        "label": "Analyst Recognition",
        "value": "\"Nexus Technologies continues to set the standard for modern analytics platforms. Their AI-first approach and commitment to user experience puts them firmly in the Leader quadrant, with the highest scores for innovation and customer satisfaction.\"",
        "description": "Gartner Magic Quadrant for Analytics & BI Platforms, 2024",
        "author": "Gartner Research",
        "company": "Gartner Inc.",
        "date": "2024-09-01"
      }
    ]
  },
  "social-media": {
    "id": "social-media-complete",
    "title": "Social Media Presence",
    "type": "social-media",
    "description": "Official company social profiles and engagement",
    "fields": [
      {
        "platform": "linkedin",
        "handle": "Nexus Technologies",
        "url": "https://linkedin.com/company/nexus-tech",
        "followers": 125000,
        "engagement": 4.8,
        "verified": true
      },
      {
        "platform": "twitter",
        "handle": "@NexusTech",
        "url": "https://twitter.com/NexusTech",
        "followers": 87500,
        "engagement": 3.2,
        "verified": true
      },
      {
        "platform": "youtube",
        "handle": "Nexus Technologies",
        "url": "https://youtube.com/@nexustech",
        "followers": 45000,
        "engagement": 6.1,
        "verified": true
      },
      {
        "platform": "github",
        "handle": "nexus-tech",
        "url": "https://github.com/nexus-tech",
        "followers": 12500,
        "verified": false
      },
      {
        "platform": "instagram",
        "handle": "@nexustech.official",
        "url": "https://instagram.com/nexustech.official",
        "followers": 32000,
        "engagement": 5.4,
        "verified": true
      },
      {
        "platform": "facebook",
        "handle": "NexusTechnologies",
        "url": "https://facebook.com/NexusTechnologies",
        "followers": 28000,
        "engagement": 2.1,
        "verified": true
      }
    ]
  },
  "solutions": {
    "id": "solutions-complete",
    "title": "Professional Services Portfolio",
    "type": "solutions",
    "description": "End-to-end implementation and consulting services",
    "fields": [
      {
        "title": "Enterprise Data Platform Implementation",
        "description": "Complete data infrastructure setup including data warehouse, ETL pipelines, and governance framework tailored to your business needs",
        "category": "Data Infrastructure",
        "benefits": [
          "Unified data architecture",
          "Real-time data processing",
          "Automated data quality",
          "Scalable cloud infrastructure",
          "Built-in compliance controls"
        ],
        "deliveryTime": "12-16 weeks",
        "complexity": "high",
        "outcomes": [
          "80% faster data access",
          "95% data accuracy",
          "50% reduced operational costs"
        ]
      },
      {
        "title": "AI/ML Center of Excellence Setup",
        "description": "Establish internal AI capabilities with MLOps infrastructure, model governance, and team enablement",
        "category": "Artificial Intelligence",
        "benefits": [
          "Production ML infrastructure",
          "Model versioning & monitoring",
          "Automated retraining pipelines",
          "Explainable AI framework"
        ],
        "deliveryTime": "8-12 weeks",
        "complexity": "high",
        "outcomes": [
          "10x faster model deployment",
          "40% improved model accuracy",
          "Reduced AI risk exposure"
        ]
      },
      {
        "title": "Self-Service Analytics Enablement",
        "description": "Empower business users with intuitive dashboards, natural language queries, and embedded analytics",
        "category": "Business Intelligence",
        "benefits": [
          "No-code dashboard builder",
          "Natural language queries",
          "Mobile-optimized reports",
          "Automated insights"
        ],
        "deliveryTime": "6-8 weeks",
        "complexity": "medium",
        "outcomes": [
          "90% self-service adoption",
          "75% reduced IT requests",
          "3x faster decision-making"
        ]
      },
      {
        "title": "Cloud Migration & Modernization",
        "description": "Migrate legacy analytics workloads to modern cloud architecture with zero downtime",
        "category": "Cloud Services",
        "benefits": [
          "Seamless migration",
          "Cost optimization",
          "Auto-scaling infrastructure",
          "Enhanced security"
        ],
        "deliveryTime": "10-14 weeks",
        "complexity": "high",
        "outcomes": [
          "60% infrastructure cost reduction",
          "99.99% availability",
          "10x performance improvement"
        ]
      },
      {
        "title": "Data Governance & Compliance Program",
        "description": "Implement comprehensive data governance including cataloging, lineage, privacy, and regulatory compliance",
        "category": "Governance",
        "benefits": [
          "Automated data discovery",
          "Complete lineage tracking",
          "Privacy by design",
          "Audit-ready reporting"
        ],
        "deliveryTime": "8-10 weeks",
        "complexity": "medium",
        "outcomes": [
          "100% data visibility",
          "GDPR/CCPA compliance",
          "Zero compliance violations"
        ]
      },
      {
        "title": "Executive Dashboard & Reporting Suite",
        "description": "Custom executive dashboards with KPI tracking, alerts, and board-ready presentations",
        "category": "Executive Intelligence",
        "benefits": [
          "Real-time KPI tracking",
          "Automated board reports",
          "Mobile executive app",
          "AI-powered insights"
        ],
        "deliveryTime": "4-6 weeks",
        "complexity": "low",
        "outcomes": [
          "Real-time visibility",
          "50% reduced reporting time",
          "Data-driven board meetings"
        ]
      }
    ]
  },
  "text-reference": {
    "id": "text-reference-complete",
    "title": "Resources & Documentation",
    "type": "text-reference",
    "description": "Essential guides, documentation, and reference materials",
    "fields": [
      {
        "label": "Technical Documentation",
        "value": "Nexus Analytics Platform - Complete Technical Reference",
        "description": "Comprehensive documentation covering architecture, API reference, integration guides, and best practices for enterprise deployments",
        "url": "https://docs.nexustech.io/platform",
        "type": "Documentation",
        "date": "2024-12-01"
      },
      {
        "label": "API Reference",
        "value": "REST API v3.0 Developer Guide",
        "description": "Complete API documentation with authentication, endpoints, request/response schemas, rate limiting, and code examples in Python, JavaScript, and Java",
        "url": "https://api.nexustech.io/docs/v3",
        "type": "API Docs"
      },
      {
        "label": "Security Whitepaper",
        "value": "Enterprise Security & Compliance Framework",
        "description": "Detailed overview of security architecture, encryption standards, access controls, audit logging, and compliance certifications (SOC 2, ISO 27001, GDPR, HIPAA)",
        "url": "https://nexustech.io/security-whitepaper",
        "type": "PDF",
        "date": "2024-10-15"
      },
      {
        "label": "Implementation Guide",
        "value": "Enterprise Deployment Playbook",
        "description": "Step-by-step guide for enterprise implementations including architecture patterns, migration strategies, performance tuning, and go-live checklists",
        "url": "https://docs.nexustech.io/implementation",
        "type": "Guide"
      },
      {
        "label": "Video Training",
        "value": "Nexus Academy - Complete Certification Course",
        "description": "40-hour video training program covering platform fundamentals, advanced analytics, administration, and developer certification paths",
        "url": "https://academy.nexustech.io",
        "type": "Video Course"
      },
      {
        "label": "Case Study",
        "value": "How Fortune 500 Retailer Achieved 47% Faster Insights",
        "description": "Detailed case study covering implementation journey, challenges overcome, technical architecture, and measurable business outcomes",
        "url": "https://nexustech.io/case-studies/retail-transformation",
        "type": "PDF",
        "date": "2024-09-20"
      },
      {
        "label": "Architecture Guide",
        "value": "Multi-tenant Cloud Architecture Deep Dive",
        "description": "Technical architecture documentation covering data isolation, scaling strategies, disaster recovery, and multi-region deployments",
        "url": "https://docs.nexustech.io/architecture",
        "type": "Technical Guide"
      },
      {
        "label": "Release Notes",
        "value": "Version 5.2 Release Notes & Migration Guide",
        "description": "Complete changelog, new features, breaking changes, deprecations, and step-by-step migration instructions for version 5.2",
        "url": "https://docs.nexustech.io/releases/5.2",
        "type": "Release Notes",
        "date": "2025-01-15"
      }
    ]
  },
  "timeline": {
    "id": "timeline-complete",
    "title": "Company Journey",
    "type": "timeline",
    "description": "Key milestones in Nexus Technologies' growth story",
    "items": [
      {
        "title": "Company Founded",
        "description": "Dr. Sarah Mitchell and James Park launch Nexus Technologies in Austin, TX with a vision to democratize data analytics for enterprises",
        "meta": {
          "date": "March 2018",
          "year": "2018",
          "icon": "🚀"
        }
      },
      {
        "title": "Seed Funding Secured",
        "description": "Raised $3.5M seed round from angel investors and TechStars to build initial product and hire founding team",
        "meta": {
          "date": "September 2018",
          "year": "2018",
          "icon": "💰"
        }
      },
      {
        "title": "First Enterprise Customer",
        "description": "Signed first Fortune 500 customer, validating product-market fit for enterprise analytics segment",
        "meta": {
          "date": "February 2019",
          "year": "2019",
          "icon": "🎯"
        }
      }
    ]
  },
  "video": {
    "id": "video-complete",
    "title": "Video Resources",
    "type": "video",
    "description": "Product demos, tutorials, and webinar recordings",
    "items": [
      {
        "title": "Nexus Analytics Platform Overview",
        "description": "Complete walkthrough of the Nexus platform capabilities, AI features, and enterprise integrations",
        "meta": {
          "url": "https://videos.nexustech.io/platform-overview",
          "thumbnail": "https://images.nexustech.io/thumbnails/overview.jpg",
          "duration": "12:45",
          "views": 45000,
          "category": "Product Demo"
        }
      },
      {
        "title": "Getting Started with Nexus in 5 Minutes",
        "description": "Quick-start guide covering account setup, data connection, and your first dashboard",
        "meta": {
          "url": "https://videos.nexustech.io/quickstart",
          "thumbnail": "https://images.nexustech.io/thumbnails/quickstart.jpg",
          "duration": "5:23",
          "views": 125000,
          "category": "Tutorial"
        }
      },
      {
        "title": "AI-Powered Insights Demo",
        "description": "See how our AI engine automatically discovers insights and explains metric changes",
        "meta": {
          "url": "https://videos.nexustech.io/ai-demo",
          "thumbnail": "https://images.nexustech.io/thumbnails/ai-demo.jpg",
          "duration": "8:15",
          "views": 67000,
          "category": "Product Demo"
        }
      }
    ]
  }
};

// ============================================================================
// MINIMAL FIXTURES (Basic examples)
// ============================================================================

export const MINIMAL_FIXTURES: Record<string, CardSection> = {
  "analytics": {
    "id": "analytics-minimal",
    "title": "Key Metric",
    "type": "analytics",
    "fields": [
      {
        "label": "Score",
        "value": "85%",
        "percentage": 85
      }
    ]
  },
  "brand-colors": {
    "id": "brand-colors-minimal",
    "title": "Colors",
    "type": "brand-colors",
    "fields": [
      {
        "label": "Primary",
        "value": "#000000"
      }
    ]
  },
  "chart": {
    "id": "chart-minimal",
    "title": "Basic Chart",
    "type": "chart",
    "chartType": "bar",
    "chartData": {
      "labels": [
        "A",
        "B",
        "C"
      ],
      "datasets": [
        {
          "data": [
            10,
            20,
            30
          ]
        }
      ]
    }
  },
  "contact-card": {
    "id": "contact-card-minimal",
    "title": "Primary Contact",
    "type": "contact-card",
    "fields": [
      {
        "title": "Support Team",
        "email": "support@company.com"
      }
    ]
  },
  "event": {
    "id": "event-minimal",
    "title": "Upcoming Event",
    "type": "event",
    "fields": [
      {
        "label": "Meeting",
        "value": "Team Sync",
        "date": "2025-01-15"
      }
    ]
  },
  "faq": {
    "id": "faq-minimal",
    "title": "FAQ",
    "type": "faq",
    "items": [
      {
        "title": "Question?",
        "description": "Answer here."
      }
    ]
  },
  "financials": {
    "id": "financials-minimal",
    "title": "Revenue",
    "type": "financials",
    "fields": [
      {
        "label": "Total Revenue",
        "value": "$10M"
      }
    ]
  },
  "gallery": {
    "id": "gallery-minimal",
    "title": "Gallery",
    "type": "gallery",
    "items": [
      {
        "title": "Image 1"
      }
    ]
  },
  "info": {
    "id": "info-minimal",
    "title": "Quick Info",
    "type": "info",
    "fields": [
      {
        "label": "Status",
        "value": "Active"
      }
    ]
  },
  "list": {
    "id": "list-minimal",
    "title": "Tasks",
    "type": "list",
    "items": [
      {
        "title": "Task 1"
      }
    ]
  },
  "map": {
    "id": "map-minimal",
    "title": "Location",
    "type": "map",
    "fields": [
      {
        "name": "Main Office",
        "x": 0,
        "y": 0
      }
    ]
  },
  "network-card": {
    "id": "network-card-minimal",
    "title": "Partners",
    "type": "network-card",
    "items": [
      {
        "title": "Partner Organization"
      }
    ]
  },
  "news": {
    "id": "news-minimal",
    "title": "News",
    "type": "news",
    "items": [
      {
        "title": "Company Update"
      }
    ]
  },
  "overview": {
    "id": "overview-minimal",
    "title": "Overview",
    "type": "overview",
    "fields": [
      {
        "label": "Summary",
        "value": "Brief overview of the topic"
      }
    ]
  },
  "product": {
    "id": "product-minimal",
    "title": "Product",
    "type": "product",
    "fields": [
      {
        "label": "Name",
        "value": "Basic Product"
      }
    ]
  },
  "quotation": {
    "id": "quotation-minimal",
    "title": "Testimonial",
    "type": "quotation",
    "fields": [
      {
        "value": "\"Great product!\""
      }
    ]
  },
  "social-media": {
    "id": "social-media-minimal",
    "title": "Social",
    "type": "social-media",
    "fields": [
      {
        "platform": "linkedin",
        "handle": "@company"
      }
    ]
  },
  "solutions": {
    "id": "solutions-minimal",
    "title": "Solution",
    "type": "solutions",
    "fields": [
      {
        "title": "Consulting Service",
        "description": "Professional consultation"
      }
    ]
  },
  "text-reference": {
    "id": "text-reference-minimal",
    "title": "References",
    "type": "text-reference",
    "fields": [
      {
        "label": "Link",
        "value": "Reference Document"
      }
    ]
  },
  "timeline": {
    "id": "timeline-minimal",
    "title": "Timeline",
    "type": "timeline",
    "items": [
      {
        "title": "Event 1",
        "meta": {
          "year": "2024"
        }
      }
    ]
  },
  "video": {
    "id": "video-minimal",
    "title": "Videos",
    "type": "video",
    "items": [
      {
        "title": "Video Title"
      }
    ]
  }
};

// ============================================================================
// EDGE CASE FIXTURES (Testing edge cases)
// ============================================================================

export const EDGE_CASE_FIXTURES: Record<string, CardSection> = {
  "analytics": {
    "id": "analytics-edge",
    "title": "Analytics Edge Cases",
    "type": "analytics",
    "fields": [
      {
        "label": "Zero Performance",
        "value": "0%",
        "percentage": 0,
        "performance": "poor",
        "trend": "down",
        "change": -100
      },
      {
        "label": "Negative Value",
        "value": "-23.5%",
        "percentage": -23,
        "performance": "poor",
        "trend": "down",
        "change": -45.2
      },
      {
        "label": "Maximum Score",
        "value": "100%",
        "percentage": 100,
        "performance": "excellent",
        "trend": "up",
        "change": 999.99
      },
      {
        "label": "No Percentage",
        "value": "N/A",
        "performance": "average"
      },
      {
        "label": "Extreme Change",
        "value": "+1,234%",
        "percentage": 100,
        "trend": "up",
        "change": 1234
      }
    ]
  },
  "brand-colors": {
    "id": "brand-colors-edge",
    "title": "Color Edge Cases",
    "type": "brand-colors",
    "fields": [
      {
        "label": "RGB Format",
        "value": "rgb(255, 121, 0)",
        "description": "RGB color notation"
      },
      {
        "label": "RGBA Transparent",
        "value": "rgba(255, 121, 0, 0.5)",
        "description": "Semi-transparent"
      },
      {
        "label": "HSL Format",
        "value": "hsl(28, 100%, 50%)",
        "description": "HSL color notation"
      },
      {
        "label": "Invalid Color",
        "value": "not-a-valid-color",
        "description": "Testing invalid input"
      },
      {
        "label": "Short Hex",
        "value": "#F90",
        "description": "3-character hex shorthand"
      }
    ]
  },
  "chart": {
    "id": "chart-edge",
    "title": "Chart Edge Cases",
    "type": "chart",
    "chartType": "line",
    "chartData": {
      "labels": [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
      ],
      "datasets": [
        {
          "label": "Negative Values",
          "data": [
            -50,
            -25,
            -10,
            0,
            15,
            30,
            45,
            35,
            20,
            5,
            -15,
            -30
          ]
        },
        {
          "label": "Large Scale",
          "data": [
            1000000,
            2500000,
            1800000,
            3200000,
            2900000,
            4100000,
            3800000,
            4500000,
            5200000,
            4800000,
            5800000,
            6200000
          ]
        },
        {
          "label": "Sparse Data",
          "data": [
            0,
            0,
            100,
            0,
            0,
            200,
            0,
            0,
            300,
            0,
            0,
            400
          ]
        }
      ]
    }
  },
  "contact-card": {
    "id": "contact-card-edge",
    "title": "Contact Edge Cases",
    "type": "contact-card",
    "fields": [
      {
        "title": "No Contact Info",
        "value": "Contact details pending"
      },
      {
        "title": "Dr. Alexandra Konstantinopoulou-Papadimitriou",
        "value": "Senior Director of International Business Development",
        "email": "alexandra.konstantinopoulou@subdomain.longcompanyname.example.com"
      },
      {
        "title": "日本語の名前",
        "value": "Japanese Name Test",
        "department": "国際部門"
      }
    ]
  },
  "event": {
    "id": "event-edge",
    "title": "Event Edge Cases",
    "type": "event",
    "fields": [
      {
        "label": "Past Event",
        "value": "Historical Milestone",
        "date": "2020-01-01",
        "status": "completed"
      },
      {
        "label": "Far Future",
        "value": "Long-term Planning",
        "date": "2030-12-31",
        "status": "tentative"
      },
      {
        "label": "Cancelled Event",
        "value": "Postponed Conference",
        "date": "2025-06-01",
        "status": "cancelled"
      },
      {
        "label": "All Day Event",
        "value": "Company Holiday",
        "date": "2025-12-25",
        "time": "",
        "status": "confirmed"
      }
    ]
  },
  "faq": {
    "id": "faq-edge",
    "title": "FAQ Edge Cases",
    "type": "faq",
    "items": [
      {
        "title": "Question without answer",
        "description": ""
      },
      {
        "title": "Very long question that exceeds normal length and should wrap properly across multiple lines without breaking the accordion component layout?",
        "description": "Short answer."
      },
      {
        "title": "Q with special chars: <>&\"'?!",
        "description": "Answer with special characters: <>&\"'!@#$%^*()"
      }
    ]
  },
  "financials": {
    "id": "financials-edge",
    "title": "Financial Edge Cases",
    "type": "financials",
    "fields": [
      {
        "label": "Zero Revenue",
        "value": "$0",
        "format": "currency",
        "change": 0,
        "trend": "stable"
      },
      {
        "label": "Loss",
        "value": "-$15.8M",
        "format": "currency",
        "change": -234.5,
        "trend": "down"
      },
      {
        "label": "Large Number",
        "value": "$999,999,999,999",
        "format": "currency",
        "change": 9999.99
      },
      {
        "label": "Euro Currency",
        "value": "€45.2M",
        "format": "currency",
        "currency": "EUR"
      },
      {
        "label": "Yen Currency",
        "value": "¥5.2B",
        "format": "currency",
        "currency": "JPY"
      }
    ]
  },
  "gallery": {
    "id": "gallery-edge",
    "title": "Gallery Edge Cases",
    "type": "gallery",
    "items": [
      {
        "title": "No Image URL",
        "description": "Item without image source"
      },
      {
        "title": "Long Caption Test",
        "description": "This is a very long description that should properly wrap and not break the gallery layout even when it contains significantly more text than typical image captions"
      },
      {
        "title": "日本語キャプション",
        "description": "Japanese caption test",
        "meta": {
          "alt": "Alternative text in English"
        }
      }
    ]
  },
  "info": {
    "id": "info-edge",
    "title": "Edge Case Testing - Extended Fields",
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
        "label": "Very Long Label That Exceeds Normal Display Width",
        "value": "Short"
      },
      {
        "label": "Short",
        "value": "This is a very long value that should wrap properly across multiple lines without breaking the layout"
      },
      {
        "label": "Numeric",
        "value": 12345.6789,
        "format": "number"
      },
      {
        "label": "Boolean True",
        "value": true
      },
      {
        "label": "Boolean False",
        "value": false
      },
      {
        "label": "Negative Trend",
        "value": "-15%",
        "trend": "down",
        "change": -15.3
      },
      {
        "label": "Unicode",
        "value": "日本語 中文 العربية 한국어 🎉🚀💡"
      }
    ]
  },
  "list": {
    "id": "list-edge",
    "title": "List Edge Cases",
    "type": "list",
    "items": [
      {
        "title": "",
        "description": "Empty title item"
      },
      {
        "title": "Unicode Support",
        "description": "日本語 中文 العربية 한국어 🎉🚀💡"
      },
      {
        "title": "Very Long Title That Should Wrap Properly Across Multiple Lines Without Breaking Layout",
        "description": "Short description"
      },
      {
        "title": "Short",
        "description": "This is an extremely long description that contains a lot of information and should properly wrap across multiple lines while maintaining readability and not breaking the overall layout of the card section component"
      }
    ]
  },
  "map": {
    "id": "map-edge",
    "title": "Map Edge Cases",
    "type": "map",
    "fields": [
      {
        "name": "North Pole Research Station",
        "x": 90,
        "y": 0,
        "type": "research"
      },
      {
        "name": "South Pole Base",
        "x": -90,
        "y": 0,
        "type": "research"
      },
      {
        "name": "International Date Line",
        "x": 0,
        "y": 180,
        "type": "marker"
      },
      {
        "name": "Prime Meridian",
        "x": 0,
        "y": 0,
        "type": "marker"
      }
    ]
  },
  "network-card": {
    "id": "network-card-edge",
    "title": "Network Edge Cases",
    "type": "network-card",
    "items": [
      {
        "title": "Zero Influence Node",
        "description": "New connection",
        "meta": {
          "influence": 0,
          "connections": 0,
          "status": "pending"
        }
      },
      {
        "title": "Maximum Influence",
        "description": "Highest priority",
        "meta": {
          "influence": 100,
          "connections": 9999,
          "status": "active"
        }
      },
      {
        "title": "Inactive Partner",
        "description": "Partnership on hold",
        "meta": {
          "influence": 45,
          "connections": 5,
          "status": "inactive"
        }
      }
    ]
  },
  "news": {
    "id": "news-edge",
    "title": "News Edge Cases",
    "type": "news",
    "items": [
      {
        "title": "Breaking News",
        "description": "Urgent announcement",
        "status": "breaking"
      },
      {
        "title": "Old Article",
        "description": "Historical archive",
        "meta": {
          "date": "2000-01-01"
        },
        "status": "archived"
      },
      {
        "title": "Draft Article",
        "description": "Not yet published",
        "status": "draft"
      }
    ]
  },
  "overview": {
    "id": "overview-edge",
    "title": "Overview Edge Cases",
    "type": "overview",
    "fields": [
      {
        "label": "Extended Content",
        "value": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
      },
      {
        "label": "Highlighted",
        "value": "This field should be visually emphasized",
        "highlight": true
      }
    ]
  },
  "product": {
    "id": "product-edge",
    "title": "Product Edge Cases",
    "type": "product",
    "fields": [
      {
        "label": "Coming Soon",
        "value": "Next Generation Platform",
        "status": "coming-soon"
      },
      {
        "label": "Deprecated",
        "value": "Legacy System v1.0",
        "status": "deprecated"
      },
      {
        "label": "Out of Stock",
        "value": "Hardware Appliance",
        "status": "out-of-stock"
      },
      {
        "label": "Beta Version",
        "value": "0.9.0-beta.3+build.1234"
      }
    ]
  },
  "quotation": {
    "id": "quotation-edge",
    "title": "Quotation Edge Cases",
    "type": "quotation",
    "fields": [
      {
        "value": "'Single quotes' and \"double quotes\" mixed together"
      },
      {
        "value": "Quote with special characters: <>&\"'!@#$%^*()[]{}|\\:;"
      },
      {
        "value": "Multi-line quote:\nLine 1\nLine 2\nLine 3",
        "description": "Testing line breaks"
      }
    ]
  },
  "social-media": {
    "id": "social-media-edge",
    "title": "Social Edge Cases",
    "type": "social-media",
    "fields": [
      {
        "platform": "twitter",
        "handle": "",
        "followers": 0
      },
      {
        "platform": "linkedin",
        "followers": 9999999,
        "verified": true
      },
      {
        "platform": "tiktok",
        "handle": "@newplatform",
        "followers": 1500000
      }
    ]
  },
  "solutions": {
    "id": "solutions-edge",
    "title": "Solutions Edge Cases",
    "type": "solutions",
    "fields": [
      {
        "title": "No Benefits Listed",
        "description": "Solution without explicit benefits array defined"
      },
      {
        "title": "Many Benefits",
        "description": "Solution with extensive benefits list",
        "benefits": [
          "Benefit 1",
          "Benefit 2",
          "Benefit 3",
          "Benefit 4",
          "Benefit 5",
          "Benefit 6",
          "Benefit 7",
          "Benefit 8",
          "Benefit 9",
          "Benefit 10"
        ]
      },
      {
        "title": "Quick Implementation",
        "description": "Rapid deployment solution",
        "deliveryTime": "1-2 days",
        "complexity": "low"
      }
    ]
  },
  "text-reference": {
    "id": "text-reference-edge",
    "title": "Reference Edge Cases",
    "type": "text-reference",
    "fields": [
      {
        "label": "No URL",
        "value": "Document without web link",
        "description": "Internal document, contact support for access"
      },
      {
        "label": "Long URL",
        "value": "External Resource",
        "url": "https://very-long-subdomain.example.com/path/to/deeply/nested/resource/document.pdf?param1=value1&param2=value2&token=abc123xyz"
      }
    ]
  },
  "timeline": {
    "id": "timeline-edge",
    "title": "Timeline Edge Cases",
    "type": "timeline",
    "items": [
      {
        "title": "No Date",
        "description": "Event without date information"
      },
      {
        "title": "Very Old Event",
        "description": "Historical milestone",
        "meta": {
          "date": "January 1900"
        }
      },
      {
        "title": "Future Event",
        "description": "Planned milestone",
        "meta": {
          "date": "December 2030"
        }
      }
    ]
  },
  "video": {
    "id": "video-edge",
    "title": "Video Edge Cases",
    "type": "video",
    "items": [
      {
        "title": "No Thumbnail",
        "description": "Video without thumbnail image",
        "meta": {
          "duration": "10:00"
        }
      },
      {
        "title": "Very Long Video",
        "description": "Extended content",
        "meta": {
          "duration": "3:45:30",
          "views": 0
        }
      },
      {
        "title": "Short Clip",
        "description": "Brief snippet",
        "meta": {
          "duration": "0:15",
          "views": 1000000
        }
      }
    ]
  }
};

// ============================================================================
// SECTION FIXTURES COMBINED
// ============================================================================

export const SECTION_FIXTURES: Record<string, SectionFixtures> = {
  'analytics': {
    complete: COMPLETE_FIXTURES['analytics']!,
    minimal: MINIMAL_FIXTURES['analytics']!,
    edgeCase: EDGE_CASE_FIXTURES['analytics'] || MINIMAL_FIXTURES['analytics']!
  },
  'brand-colors': {
    complete: COMPLETE_FIXTURES['brand-colors']!,
    minimal: MINIMAL_FIXTURES['brand-colors']!,
    edgeCase: EDGE_CASE_FIXTURES['brand-colors'] || MINIMAL_FIXTURES['brand-colors']!
  },
  'chart': {
    complete: COMPLETE_FIXTURES['chart']!,
    minimal: MINIMAL_FIXTURES['chart']!,
    edgeCase: EDGE_CASE_FIXTURES['chart'] || MINIMAL_FIXTURES['chart']!
  },
  'contact-card': {
    complete: COMPLETE_FIXTURES['contact-card']!,
    minimal: MINIMAL_FIXTURES['contact-card']!,
    edgeCase: EDGE_CASE_FIXTURES['contact-card'] || MINIMAL_FIXTURES['contact-card']!
  },
  'event': {
    complete: COMPLETE_FIXTURES['event']!,
    minimal: MINIMAL_FIXTURES['event']!,
    edgeCase: EDGE_CASE_FIXTURES['event'] || MINIMAL_FIXTURES['event']!
  },
  'faq': {
    complete: COMPLETE_FIXTURES['faq']!,
    minimal: MINIMAL_FIXTURES['faq']!,
    edgeCase: EDGE_CASE_FIXTURES['faq'] || MINIMAL_FIXTURES['faq']!
  },
  'financials': {
    complete: COMPLETE_FIXTURES['financials']!,
    minimal: MINIMAL_FIXTURES['financials']!,
    edgeCase: EDGE_CASE_FIXTURES['financials'] || MINIMAL_FIXTURES['financials']!
  },
  'gallery': {
    complete: COMPLETE_FIXTURES['gallery']!,
    minimal: MINIMAL_FIXTURES['gallery']!,
    edgeCase: EDGE_CASE_FIXTURES['gallery'] || MINIMAL_FIXTURES['gallery']!
  },
  'info': {
    complete: COMPLETE_FIXTURES['info']!,
    minimal: MINIMAL_FIXTURES['info']!,
    edgeCase: EDGE_CASE_FIXTURES['info'] || MINIMAL_FIXTURES['info']!
  },
  'list': {
    complete: COMPLETE_FIXTURES['list']!,
    minimal: MINIMAL_FIXTURES['list']!,
    edgeCase: EDGE_CASE_FIXTURES['list'] || MINIMAL_FIXTURES['list']!
  },
  'map': {
    complete: COMPLETE_FIXTURES['map']!,
    minimal: MINIMAL_FIXTURES['map']!,
    edgeCase: EDGE_CASE_FIXTURES['map'] || MINIMAL_FIXTURES['map']!
  },
  'network-card': {
    complete: COMPLETE_FIXTURES['network-card']!,
    minimal: MINIMAL_FIXTURES['network-card']!,
    edgeCase: EDGE_CASE_FIXTURES['network-card'] || MINIMAL_FIXTURES['network-card']!
  },
  'news': {
    complete: COMPLETE_FIXTURES['news']!,
    minimal: MINIMAL_FIXTURES['news']!,
    edgeCase: EDGE_CASE_FIXTURES['news'] || MINIMAL_FIXTURES['news']!
  },
  'overview': {
    complete: COMPLETE_FIXTURES['overview']!,
    minimal: MINIMAL_FIXTURES['overview']!,
    edgeCase: EDGE_CASE_FIXTURES['overview'] || MINIMAL_FIXTURES['overview']!
  },
  'product': {
    complete: COMPLETE_FIXTURES['product']!,
    minimal: MINIMAL_FIXTURES['product']!,
    edgeCase: EDGE_CASE_FIXTURES['product'] || MINIMAL_FIXTURES['product']!
  },
  'quotation': {
    complete: COMPLETE_FIXTURES['quotation']!,
    minimal: MINIMAL_FIXTURES['quotation']!,
    edgeCase: EDGE_CASE_FIXTURES['quotation'] || MINIMAL_FIXTURES['quotation']!
  },
  'social-media': {
    complete: COMPLETE_FIXTURES['social-media']!,
    minimal: MINIMAL_FIXTURES['social-media']!,
    edgeCase: EDGE_CASE_FIXTURES['social-media'] || MINIMAL_FIXTURES['social-media']!
  },
  'solutions': {
    complete: COMPLETE_FIXTURES['solutions']!,
    minimal: MINIMAL_FIXTURES['solutions']!,
    edgeCase: EDGE_CASE_FIXTURES['solutions'] || MINIMAL_FIXTURES['solutions']!
  },
  'text-reference': {
    complete: COMPLETE_FIXTURES['text-reference']!,
    minimal: MINIMAL_FIXTURES['text-reference']!,
    edgeCase: EDGE_CASE_FIXTURES['text-reference'] || MINIMAL_FIXTURES['text-reference']!
  },
  'timeline': {
    complete: COMPLETE_FIXTURES['timeline']!,
    minimal: MINIMAL_FIXTURES['timeline']!,
    edgeCase: EDGE_CASE_FIXTURES['timeline'] || MINIMAL_FIXTURES['timeline']!
  },
  'video': {
    complete: COMPLETE_FIXTURES['video']!,
    minimal: MINIMAL_FIXTURES['video']!,
    edgeCase: EDGE_CASE_FIXTURES['video'] || MINIMAL_FIXTURES['video']!
  }
};

// ============================================================================
// SAMPLE CARDS (Built from fixtures)
// ============================================================================

export const SAMPLE_COMPANY_CARD: AICardConfig = {
  id: 'sample-company',
  cardTitle: 'Nexus Technologies Inc.',
  cardType: 'company',
  sections: [
    COMPLETE_FIXTURES['info']!,
    COMPLETE_FIXTURES['analytics']!,
    COMPLETE_FIXTURES['chart']!,
    COMPLETE_FIXTURES['financials']!,
  ].filter(Boolean),
  actions: [
    { id: 'view', label: 'View Details', variant: 'primary' },
    { id: 'contact', label: 'Contact', variant: 'secondary' },
  ],
};

export const SAMPLE_ANALYTICS_CARD: AICardConfig = {
  id: 'sample-analytics',
  cardTitle: 'Performance Dashboard',
  cardType: 'analytics',
  sections: [
    COMPLETE_FIXTURES['analytics']!,
    COMPLETE_FIXTURES['chart']!,
  ].filter(Boolean),
};

export const SAMPLE_NEWS_CARD: AICardConfig = {
  id: 'sample-news',
  cardTitle: 'Latest Updates',
  cardType: 'news',
  sections: [COMPLETE_FIXTURES['news']!].filter(Boolean),
};

export const ALL_SECTIONS_CARD: AICardConfig = {
  id: 'all-sections',
  cardTitle: 'Complete Card Example',
  sections: Object.values(COMPLETE_FIXTURES),
};

export const MINIMAL_ALL_SECTIONS_CARD: AICardConfig = {
  id: 'minimal-all-sections',
  cardTitle: 'Minimal Card',
  sections: Object.values(MINIMAL_FIXTURES),
};

export const EDGE_CASE_ALL_SECTIONS_CARD: AICardConfig = {
  id: 'edge-case-all-sections',
  cardTitle: 'Edge Case Card',
  sections: Object.values(EDGE_CASE_FIXTURES),
};

export const SAMPLE_CARDS = {
  company: SAMPLE_COMPANY_CARD,
  analytics: SAMPLE_ANALYTICS_CARD,
  news: SAMPLE_NEWS_CARD,
  allSections: ALL_SECTIONS_CARD,
};

// ============================================================================
// FIXTURE ACCESS FUNCTIONS
// ============================================================================

/**
 * Get a fixture for a specific section type and category
 */
export function getFixture(sectionType: string, category: FixtureCategory = 'complete'): CardSection | undefined {
  const fixtures = SECTION_FIXTURES[sectionType];
  if (!fixtures) return undefined;

  switch (category) {
    case 'complete': return fixtures.complete;
    case 'minimal': return fixtures.minimal;
    case 'edge-case': return fixtures.edgeCase;
    default: return fixtures.complete;
  }
}

/**
 * Get all fixtures for a section type
 */
export function getAllFixtures(sectionType: string): SectionFixtures | undefined {
  return SECTION_FIXTURES[sectionType];
}

/**
 * Get a fixture with a unique ID generated
 */
export function getFixtureWithUniqueId(sectionType: string, category: FixtureCategory = 'complete'): CardSection | undefined {
  const fixture = getFixture(sectionType, category);
  if (!fixture) return undefined;

  return {
    ...fixture,
    id: `${fixture.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  };
}

/**
 * Get list of available section types
 */
export function getAvailableSectionTypes(): string[] {
  return Object.keys(SECTION_FIXTURES);
}
