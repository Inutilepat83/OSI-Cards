/**
 * AUTO-GENERATED FILE
 * Section Type E2E Tests generated from section-registry.json
 * Run: npm run generate:tests
 */

import { test, expect } from '@playwright/test';

// Test configurations from registry
const SECTION_CONFIGS = {
  "info": {
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
  "analytics": {
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
  "contact-card": {
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
  "network-card": {
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
  "map": {
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
  "financials": {
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
  "event": {
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
  "list": {
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
  "chart": {
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
  "product": {
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
  "solutions": {
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
  "overview": {
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
  "quotation": {
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
  "text-reference": {
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
  "brand-colors": {
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
  "news": {
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
  "social-media": {
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

test.describe('Section Types - Registry Generated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });


  test.describe('Info Section', () => {
    test('renders info section correctly', async ({ page }) => {
      // Load card with info section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['info']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="info"]')).toBeVisible();
    });

    test('info section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="info"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Analytics Section', () => {
    test('renders analytics section correctly', async ({ page }) => {
      // Load card with analytics section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['analytics']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="analytics"]')).toBeVisible();
    });

    test('analytics section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="analytics"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Contact Card Section', () => {
    test('renders contact-card section correctly', async ({ page }) => {
      // Load card with contact-card section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['contact-card']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="contact-card"]')).toBeVisible();
    });

    test('contact-card section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="contact-card"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Network Card Section', () => {
    test('renders network-card section correctly', async ({ page }) => {
      // Load card with network-card section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['network-card']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="network-card"]')).toBeVisible();
    });

    test('network-card section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="network-card"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Map Section', () => {
    test('renders map section correctly', async ({ page }) => {
      // Load card with map section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['map']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="map"]')).toBeVisible();
    });

    test('map section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="map"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Financials Section', () => {
    test('renders financials section correctly', async ({ page }) => {
      // Load card with financials section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['financials']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="financials"]')).toBeVisible();
    });

    test('financials section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="financials"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Event Section', () => {
    test('renders event section correctly', async ({ page }) => {
      // Load card with event section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['event']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="event"]')).toBeVisible();
    });

    test('event section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="event"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('List Section', () => {
    test('renders list section correctly', async ({ page }) => {
      // Load card with list section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['list']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="list"]')).toBeVisible();
    });

    test('list section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="list"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Chart Section', () => {
    test('renders chart section correctly', async ({ page }) => {
      // Load card with chart section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['chart']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="chart"]')).toBeVisible();
    });

    test('chart section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="chart"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Product Section', () => {
    test('renders product section correctly', async ({ page }) => {
      // Load card with product section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['product']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="product"]')).toBeVisible();
    });

    test('product section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="product"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Solutions Section', () => {
    test('renders solutions section correctly', async ({ page }) => {
      // Load card with solutions section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['solutions']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="solutions"]')).toBeVisible();
    });

    test('solutions section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="solutions"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Overview Section', () => {
    test('renders overview section correctly', async ({ page }) => {
      // Load card with overview section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['overview']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="overview"]')).toBeVisible();
    });

    test('overview section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="overview"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Quotation Section', () => {
    test('renders quotation section correctly', async ({ page }) => {
      // Load card with quotation section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['quotation']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="quotation"]')).toBeVisible();
    });

    test('quotation section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="quotation"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Text Reference Section', () => {
    test('renders text-reference section correctly', async ({ page }) => {
      // Load card with text-reference section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['text-reference']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="text-reference"]')).toBeVisible();
    });

    test('text-reference section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="text-reference"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Brand Colors Section', () => {
    test('renders brand-colors section correctly', async ({ page }) => {
      // Load card with brand-colors section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['brand-colors']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="brand-colors"]')).toBeVisible();
    });

    test('brand-colors section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="brand-colors"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('News Section', () => {
    test('renders news section correctly', async ({ page }) => {
      // Load card with news section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['news']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="news"]')).toBeVisible();
    });

    test('news section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="news"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Social Media Section', () => {
    test('renders social-media section correctly', async ({ page }) => {
      // Load card with social-media section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['social-media']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="social-media"]')).toBeVisible();
    });

    test('social-media section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="social-media"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(`Interactive element ${i} missing label`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });


  test('renders all section types in kitchen sink', async ({ page }) => {
    // Load kitchen sink card
    await page.evaluate((configs) => {
      // @ts-ignore
      window.__testCard = {
        cardTitle: 'Kitchen Sink',
        sections: Object.values(configs)
      };
    }, SECTION_CONFIGS);

    // Verify all sections render
    const sectionTypes = Object.keys(SECTION_CONFIGS);
    for (const type of sectionTypes) {
      await expect(page.locator(`[data-section-type="${type}"]`).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
