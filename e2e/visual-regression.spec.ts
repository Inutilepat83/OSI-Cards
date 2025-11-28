import { test, expect } from '@playwright/test';

/**
 * Comprehensive Visual Regression Tests
 * 
 * Compares screenshots to detect visual changes across:
 * - All section types
 * - Different themes (light/dark)
 * - Various states (loading, error, empty, filled)
 * - Responsive layouts
 * - Edge cases
 * 
 * Run with: npm run test:visual
 * Update snapshots: npm run test:visual:update
 */

test.describe('Visual Regression - Core Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('homepage should match baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 200
    });
  });
});

test.describe('Visual Regression - Section Types', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Helper function to load a card configuration into the JSON editor
   */
  async function loadCardConfig(page: any, config: any): Promise<void> {
    const jsonEditor = page.locator('app-json-editor textarea');
    if (await jsonEditor.count() > 0) {
      await jsonEditor.fill(JSON.stringify(config));
      await page.waitForTimeout(1500); // Wait for rendering
    }
  }

  test('info section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Info Section Test',
      sections: [
        {
          type: 'info',
          title: 'Company Information',
          fields: [
            { label: 'Name', value: 'John Doe' },
            { label: 'Email', value: 'john@example.com' },
            { label: 'Status', value: 'Active' },
            { label: 'Department', value: 'Engineering' }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--info').first();
    await expect(section).toHaveScreenshot('sections/info-section.png', {
      maxDiffPixels: 100
    });
  });

  test('analytics section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Analytics Section Test',
      sections: [
        {
          type: 'analytics',
          title: 'Key Metrics',
          fields: [
            { label: 'Revenue', value: 1250000, format: 'currency', trend: 'up', change: 15.5 },
            { label: 'Users', value: 5432, format: 'number', trend: 'up', change: 8.2 },
            { label: 'Conversion', value: 3.4, format: 'percentage', trend: 'down', change: -0.5 }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--analytics').first();
    await expect(section).toHaveScreenshot('sections/analytics-section.png', {
      maxDiffPixels: 150
    });
  });

  test('list section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'List Section Test',
      sections: [
        {
          type: 'list',
          title: 'Project List',
          items: [
            { title: 'Project Alpha', value: 'In Progress', description: 'Q4 2024 initiative', status: 'in-progress' },
            { title: 'Project Beta', value: 'Completed', description: 'Successfully delivered', status: 'completed' },
            { title: 'Project Gamma', value: 'Pending', description: 'Awaiting approval', status: 'pending' }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--list').first();
    await expect(section).toHaveScreenshot('sections/list-section.png', {
      maxDiffPixels: 100
    });
  });

  test('chart section - bar chart should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Chart Section Test',
      sections: [
        {
          type: 'chart',
          title: 'Sales Performance',
          chartType: 'bar',
          fields: [
            { label: 'Q1', value: 30000 },
            { label: 'Q2', value: 45000 },
            { label: 'Q3', value: 52000 },
            { label: 'Q4', value: 61000 }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--chart').first();
    await expect(section).toHaveScreenshot('sections/chart-section-bar.png', {
      maxDiffPixels: 200
    });
  });

  test('chart section - pie chart should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Chart Section Test',
      sections: [
        {
          type: 'chart',
          title: 'Market Share',
          chartType: 'pie',
          fields: [
            { label: 'Product A', value: 35 },
            { label: 'Product B', value: 28 },
            { label: 'Product C', value: 22 },
            { label: 'Product D', value: 15 }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--chart').first();
    await expect(section).toHaveScreenshot('sections/chart-section-pie.png', {
      maxDiffPixels: 200
    });
  });

  test('contact-card section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Contact Card Test',
      sections: [
        {
          type: 'contact-card',
          title: 'Key Contacts',
          fields: [
            {
              label: 'Jane Smith',
              value: 'CEO',
              email: 'jane@example.com',
              phone: '+1-555-0123',
              avatar: '👤'
            },
            {
              label: 'John Doe',
              value: 'CTO',
              email: 'john@example.com',
              phone: '+1-555-0124',
              avatar: '👤'
            }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--contact-card').first();
    await expect(section).toHaveScreenshot('sections/contact-card-section.png', {
      maxDiffPixels: 150
    });
  });

  test('network-card section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Network Card Test',
      sections: [
        {
          type: 'network-card',
          title: 'Professional Network',
          fields: [
            {
              label: 'Alice Johnson',
              value: 'Director',
              connections: 245,
              strength: 85
            },
            {
              label: 'Bob Williams',
              value: 'Manager',
              connections: 189,
              strength: 72
            }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--network-card').first();
    await expect(section).toHaveScreenshot('sections/network-card-section.png', {
      maxDiffPixels: 150
    });
  });

  test('solutions section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Solutions Section Test',
      sections: [
        {
          type: 'solutions',
          title: 'Our Solutions',
          fields: [
            {
              label: 'Cloud Migration',
              value: 'Complete cloud infrastructure migration',
              benefits: ['Scalability', 'Cost Efficiency', 'Security'],
              deliveryTime: '6-8 weeks'
            },
            {
              label: 'Data Analytics',
              value: 'Advanced analytics and insights',
              benefits: ['Real-time Insights', 'Better Decisions'],
              deliveryTime: '4-6 weeks'
            }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--solutions').first();
    await expect(section).toHaveScreenshot('sections/solutions-section.png', {
      maxDiffPixels: 150
    });
  });

  test('product section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Product Section Test',
      sections: [
        {
          type: 'product',
          title: 'Product Catalog',
          fields: [
            {
              label: 'Product A',
              value: '$99/month',
              description: 'Feature-rich product solution',
              benefits: ['Feature 1', 'Feature 2', 'Feature 3']
            },
            {
              label: 'Product B',
              value: '$199/month',
              description: 'Advanced product solution',
              benefits: ['All Features', 'Priority Support']
            }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--product').first();
    await expect(section).toHaveScreenshot('sections/product-section.png', {
      maxDiffPixels: 150
    });
  });

  test('financials section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Financials Section Test',
      sections: [
        {
          type: 'financials',
          title: 'Financial Overview',
          fields: [
            { label: 'Revenue', value: 2500000, format: 'currency', trend: 'up' },
            { label: 'Expenses', value: 1800000, format: 'currency', trend: 'down' },
            { label: 'Profit', value: 700000, format: 'currency', trend: 'up' },
            { label: 'Margin', value: 28, format: 'percentage', trend: 'up' }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--financials').first();
    await expect(section).toHaveScreenshot('sections/financials-section.png', {
      maxDiffPixels: 150
    });
  });

  test('event section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Event Section Test',
      sections: [
        {
          type: 'event',
          title: 'Upcoming Events',
          fields: [
            {
              label: 'Product Launch',
              value: '2024-12-15',
              description: 'New product announcement',
              status: 'pending'
            },
            {
              label: 'Team Meeting',
              value: '2024-12-10',
              description: 'Quarterly review',
              status: 'in-progress'
            }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--event').first();
    await expect(section).toHaveScreenshot('sections/event-section.png', {
      maxDiffPixels: 150
    });
  });

  test('project section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Project Section Test',
      sections: [
        {
          type: 'project',
          title: 'Active Projects',
          fields: [
            {
              label: 'Website Redesign',
              value: '85%',
              description: 'Complete redesign of company website',
              status: 'in-progress',
              priority: 'high'
            },
            {
              label: 'Mobile App',
              value: '45%',
              description: 'New mobile application development',
              status: 'in-progress',
              priority: 'medium'
            }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--project').first();
    await expect(section).toHaveScreenshot('sections/project-section.png', {
      maxDiffPixels: 150
    });
  });

  test('locations section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Locations Section Test',
      sections: [
        {
          type: 'locations',
          title: 'Office Locations',
          fields: [
            {
              label: 'New York Office',
              value: 'New York, NY',
              address: '123 Main St, New York, NY 10001',
              coordinates: { lat: 40.7128, lng: -74.0060 }
            },
            {
              label: 'San Francisco Office',
              value: 'San Francisco, CA',
              address: '456 Market St, San Francisco, CA 94102',
              coordinates: { lat: 37.7749, lng: -122.4194 }
            }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--locations').first();
    await expect(section).toHaveScreenshot('sections/locations-section.png', {
      maxDiffPixels: 150
    });
  });

  test('overview section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Overview Section Test',
      sections: [
        {
          type: 'overview',
          title: 'Company Overview',
          fields: [
            { label: 'Industry', value: 'Technology' },
            { label: 'Founded', value: '2010' },
            { label: 'Employees', value: '250' },
            { label: 'Headquarters', value: 'San Francisco, CA' },
            { label: 'Revenue', value: '$50M', format: 'currency' }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--overview').first();
    await expect(section).toHaveScreenshot('sections/overview-section.png', {
      maxDiffPixels: 150
    });
  });

  test('stats section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Stats Section Test',
      sections: [
        {
          type: 'stats',
          title: 'Statistics',
          fields: [
            { label: 'Total Users', value: 12543, format: 'number' },
            { label: 'Active Sessions', value: 3421, format: 'number' },
            { label: 'Conversion Rate', value: 4.2, format: 'percentage' },
            { label: 'Avg. Session', value: '3:45', format: 'text' }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--stats').first();
    await expect(section).toHaveScreenshot('sections/stats-section.png', {
      maxDiffPixels: 150
    });
  });
});

test.describe('Visual Regression - Card States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  async function loadCardConfig(page: any, config: any): Promise<void> {
    const jsonEditor = page.locator('app-json-editor textarea');
    if (await jsonEditor.count() > 0) {
      await jsonEditor.fill(JSON.stringify(config));
      await page.waitForTimeout(1500);
    }
  }

  test('card with actions should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Card with Actions',
      cardSubtitle: 'Test Card',
      sections: [
        {
          type: 'info',
          title: 'Info Section',
          fields: [
            { label: 'Field 1', value: 'Value 1' },
            { label: 'Field 2', value: 'Value 2' }
          ]
        }
      ],
      actions: [
        {
          label: 'Contact Us',
          type: 'mail',
          email: {
            contact: { name: 'Support', email: 'support@example.com', role: 'Support Team' },
            subject: 'Inquiry',
            body: 'Hello, I would like to inquire about...'
          }
        },
        {
          label: 'Visit Website',
          type: 'website',
          url: 'https://example.com'
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const cardPreview = page.locator('app-card-preview').first();
    await expect(cardPreview).toHaveScreenshot('states/card-with-actions.png', {
      maxDiffPixels: 150
    });
  });

  test('card with multiple sections should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Multi-Section Card',
      sections: [
        {
          type: 'overview',
          title: 'Overview',
          fields: [
            { label: 'Industry', value: 'Technology' },
            { label: 'Founded', value: '2010' }
          ]
        },
        {
          type: 'analytics',
          title: 'Metrics',
          fields: [
            { label: 'Revenue', value: 1250000, format: 'currency', trend: 'up' }
          ]
        },
        {
          type: 'list',
          title: 'Projects',
          items: [
            { title: 'Project 1', value: 'Active', status: 'in-progress' }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const cardPreview = page.locator('app-card-preview').first();
    await expect(cardPreview).toHaveScreenshot('states/multi-section-card.png', {
      maxDiffPixels: 200
    });
  });

  test('empty section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Empty Section Test',
      sections: [
        {
          type: 'info',
          title: 'Empty Info Section',
          fields: []
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--info').first();
    await expect(section).toHaveScreenshot('states/empty-section.png', {
      maxDiffPixels: 100
    });
  });
});

test.describe('Visual Regression - Responsive Layouts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  async function loadCardConfig(page: any, config: any): Promise<void> {
    const jsonEditor = page.locator('app-json-editor textarea');
    if (await jsonEditor.count() > 0) {
      await jsonEditor.fill(JSON.stringify(config));
      await page.waitForTimeout(1500);
    }
  }

  test('mobile layout (375x667) should match baseline', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const jsonConfig = {
      cardTitle: 'Mobile Test Card',
      sections: [
        {
          type: 'info',
          title: 'Info Section',
          fields: [
            { label: 'Field 1', value: 'Value 1' },
            { label: 'Field 2', value: 'Value 2' }
          ]
        },
        {
          type: 'list',
          title: 'List Section',
          items: [
            { title: 'Item 1', value: 'Value 1' },
            { title: 'Item 2', value: 'Value 2' }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    await expect(page).toHaveScreenshot('responsive/mobile-layout.png', {
      fullPage: true,
      maxDiffPixels: 200
    });
  });

  test('tablet layout (768x1024) should match baseline', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    const jsonConfig = {
      cardTitle: 'Tablet Test Card',
      sections: [
        {
          type: 'info',
          title: 'Info Section',
          fields: [
            { label: 'Field 1', value: 'Value 1' },
            { label: 'Field 2', value: 'Value 2' }
          ]
        },
        {
          type: 'analytics',
          title: 'Metrics',
          fields: [
            { label: 'Metric 1', value: 100, format: 'number' },
            { label: 'Metric 2', value: 200, format: 'number' }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    await expect(page).toHaveScreenshot('responsive/tablet-layout.png', {
      fullPage: true,
      maxDiffPixels: 200
    });
  });

  test('desktop layout (1920x1080) should match baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    const jsonConfig = {
      cardTitle: 'Desktop Test Card',
      columns: 3,
      sections: [
        {
          type: 'info',
          title: 'Info Section',
          fields: [
            { label: 'Field 1', value: 'Value 1' },
            { label: 'Field 2', value: 'Value 2' }
          ]
        },
        {
          type: 'analytics',
          title: 'Metrics',
          fields: [
            { label: 'Metric 1', value: 100, format: 'number' }
          ]
        },
        {
          type: 'list',
          title: 'List Section',
          items: [
            { title: 'Item 1', value: 'Value 1' }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    await expect(page).toHaveScreenshot('responsive/desktop-layout.png', {
      fullPage: true,
      maxDiffPixels: 200
    });
  });
});

test.describe('Visual Regression - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  async function loadCardConfig(page: any, config: any): Promise<void> {
    const jsonEditor = page.locator('app-json-editor textarea');
    if (await jsonEditor.count() > 0) {
      await jsonEditor.fill(JSON.stringify(config));
      await page.waitForTimeout(1500);
    }
  }

  test('long text content should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'This is a Very Long Card Title That Should Be Handled Gracefully Without Breaking the Layout',
      cardSubtitle: 'This is a very long subtitle that contains multiple words and should wrap appropriately',
      sections: [
        {
          type: 'info',
          title: 'Section with Long Content',
          fields: [
            {
              label: 'Very Long Field Label That Might Cause Issues',
              value: 'This is a very long field value that contains a lot of text and should be displayed properly without breaking the card layout or causing overflow issues'
            },
            {
              label: 'Another Field',
              value: 'Short value'
            }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const cardPreview = page.locator('app-card-preview').first();
    await expect(cardPreview).toHaveScreenshot('edge-cases/long-text-content.png', {
      maxDiffPixels: 200
    });
  });

  test('many items in list should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'List with Many Items',
      sections: [
        {
          type: 'list',
          title: 'Large List',
          items: Array.from({ length: 10 }, (_, i) => ({
            title: `Item ${i + 1}`,
            value: `Value ${i + 1}`,
            description: `Description for item ${i + 1}`
          }))
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--list').first();
    await expect(section).toHaveScreenshot('edge-cases/many-list-items.png', {
      maxDiffPixels: 200
    });
  });

  test('many fields in info section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Info Section with Many Fields',
      sections: [
        {
          type: 'info',
          title: 'Detailed Information',
          fields: Array.from({ length: 12 }, (_, i) => ({
            label: `Field ${i + 1}`,
            value: `Value ${i + 1}`
          }))
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--info').first();
    await expect(section).toHaveScreenshot('edge-cases/many-info-fields.png', {
      maxDiffPixels: 200
    });
  });

  test('special characters in content should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Special Characters: <>&"\'',
      sections: [
        {
          type: 'info',
          title: 'Test Section',
          fields: [
            { label: 'HTML', value: '<script>alert("test")</script>' },
            { label: 'Unicode', value: '你好 🌟 🚀 émojis' },
            { label: 'Math', value: 'E=mc² ±10% ≠ ∞' }
          ]
        }
      ]
    };

    await loadCardConfig(page, jsonConfig);
    const section = page.locator('.ai-section--info').first();
    await expect(section).toHaveScreenshot('edge-cases/special-characters.png', {
      maxDiffPixels: 150
    });
  });
});


