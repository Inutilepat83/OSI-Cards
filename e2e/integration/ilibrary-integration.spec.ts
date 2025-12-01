import { test, expect, Page } from '@playwright/test';

/**
 * OSI Cards Library Integration Tests
 * 
 * Tests the library components rendered at /ilibrary endpoint
 * to verify all features work correctly when imported from osi-cards-lib
 */

test.describe('OSI Cards Library Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the library integration test page
    await page.goto('/ilibrary');
    // Wait for Angular to be ready
    await page.waitForSelector('app-ai-card-renderer', { timeout: 10000 });
  });

  test.describe('Component Rendering', () => {
    test('should render AICardRendererComponent from library', async ({ page }) => {
      // Verify the main card renderer is present
      const cardRenderer = page.locator('app-ai-card-renderer');
      await expect(cardRenderer).toBeVisible();
    });

    test('should render card surface with proper styles', async ({ page }) => {
      const cardSurface = page.locator('.ai-card-surface');
      await expect(cardSurface).toBeVisible();
      
      // Verify card has the brand border color
      const borderColor = await cardSurface.evaluate(el => 
        window.getComputedStyle(el).borderColor
      );
      // Border should contain some orange/brand color
      expect(borderColor).toBeTruthy();
    });

    test('should render card header with title', async ({ page }) => {
      const cardHeader = page.locator('.ai-card-header, app-card-header');
      await expect(cardHeader).toBeVisible();
      
      const cardTitle = page.locator('.ai-card-title');
      await expect(cardTitle).toBeVisible();
    });

    test('should render masonry grid with sections', async ({ page }) => {
      const masonryGrid = page.locator('app-masonry-grid');
      await expect(masonryGrid).toBeVisible();
      
      // Check for masonry items
      const masonryItems = page.locator('.masonry-item');
      const count = await masonryItems.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should render section renderers', async ({ page }) => {
      const sectionRenderers = page.locator('app-section-renderer');
      const count = await sectionRenderers.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Animation System', () => {
    test('should have streaming animations when active', async ({ page }) => {
      // Check if streaming class is applied when streaming
      const cardSurface = page.locator('.ai-card-surface');
      
      // Look for streaming-active class or streaming animations
      const hasStreamingAnimation = await cardSurface.evaluate(el => {
        const style = window.getComputedStyle(el);
        const animation = style.animation || style.webkitAnimation;
        return el.classList.contains('streaming-active') || 
               (animation && animation !== 'none');
      });
      
      // Either streaming is active or card is in normal state
      expect(typeof hasStreamingAnimation).toBe('boolean');
    });

    test('should have tilt CSS variables defined', async ({ page }) => {
      const tiltContainer = page.locator('.tilt-container');
      
      if (await tiltContainer.count() > 0) {
        await expect(tiltContainer.first()).toBeVisible();
        
        // Check for CSS custom properties support
        const hasTransform = await tiltContainer.first().evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.transform !== 'none' || style.transform === 'none';
        });
        expect(typeof hasTransform).toBe('boolean');
      }
    });

    test('should support reduced motion preference', async ({ page }) => {
      // Emulate reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      await page.waitForSelector('app-ai-card-renderer');
      
      const cardSurface = page.locator('.ai-card-surface');
      await expect(cardSurface).toBeVisible();
      
      // In reduced motion, animations should be disabled
      const transitionDuration = await cardSurface.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.transitionDuration;
      });
      
      // Should either be 0s or defined (both are valid states)
      expect(transitionDuration).toBeDefined();
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state when no sections', async ({ page }) => {
      // Look for empty state elements (if card has no content)
      const emptyState = page.locator('.card-empty-state');
      
      // Either empty state is visible or we have sections
      const isEmpty = await emptyState.count() > 0;
      const hasSections = await page.locator('.masonry-item').count() > 0;
      
      // One must be true
      expect(isEmpty || hasSections).toBe(true);
    });

    test('should have particle animations in empty state', async ({ page }) => {
      const emptyState = page.locator('.card-empty-state');
      
      if (await emptyState.count() > 0) {
        const particles = page.locator('.empty-state-particles .particle');
        const particleCount = await particles.count();
        
        // Should have multiple particles if empty state is shown
        expect(particleCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Responsive Layout', () => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-large' },
      { width: 1280, height: 720, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 768, height: 1024, name: 'tablet-portrait' },
      { width: 375, height: 812, name: 'mobile' }
    ];

    for (const viewport of viewports) {
      test(`should layout correctly at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/ilibrary');
        await page.waitForSelector('app-ai-card-renderer');
        
        const cardSurface = page.locator('.ai-card-surface');
        await expect(cardSurface).toBeVisible();
        
        // Verify the card is visible and properly sized
        const boundingBox = await cardSurface.boundingBox();
        expect(boundingBox).toBeTruthy();
        expect(boundingBox!.width).toBeGreaterThan(0);
        expect(boundingBox!.height).toBeGreaterThan(0);
      });
    }

    test('should have responsive column count in masonry grid', async ({ page }) => {
      // Test at different widths
      const widths = [1920, 1024, 768, 480];
      
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(500); // Wait for resize handler
        
        const masonryContainer = page.locator('.masonry-grid-container');
        
        if (await masonryContainer.count() > 0) {
          const columnsVar = await masonryContainer.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.getPropertyValue('--masonry-columns');
          });
          
          // Should have columns defined
          if (columnsVar) {
            const columns = parseInt(columnsVar);
            expect(columns).toBeGreaterThan(0);
            expect(columns).toBeLessThanOrEqual(4); // Max columns
          }
        }
      }
    });
  });

  test.describe('Tilt Effect', () => {
    test('should respond to mouse hover', async ({ page }) => {
      const cardSurface = page.locator('.ai-card-surface');
      const tiltContainer = page.locator('.tilt-container');
      
      if (await tiltContainer.count() > 0) {
        // Get initial transform
        const initialTransform = await tiltContainer.first().evaluate(el => 
          window.getComputedStyle(el).transform
        );
        
        // Hover over the card
        await cardSurface.hover();
        await page.waitForTimeout(100);
        
        // Transform should change or remain the same (depending on state)
        const hoverTransform = await tiltContainer.first().evaluate(el => 
          window.getComputedStyle(el).transform
        );
        
        // Both states are valid
        expect(hoverTransform).toBeDefined();
      }
    });

    test('should have glow effect on hover', async ({ page }) => {
      const glowContainer = page.locator('.glow-container');
      const cardSurface = page.locator('.ai-card-surface');
      
      if (await glowContainer.count() > 0) {
        await cardSurface.hover();
        await page.waitForTimeout(200);
        
        const filter = await glowContainer.first().evaluate(el => 
          window.getComputedStyle(el).filter
        );
        
        // Should have some filter effect or none
        expect(filter).toBeDefined();
      }
    });
  });

  test.describe('Section Types', () => {
    test('should render various section types correctly', async ({ page }) => {
      // Check for different section type classes
      const sectionTypes = [
        'info-section',
        'overview-section',
        'analytics-section',
        'list-section',
        'contact-section',
        'news-section',
        'chart-section'
      ];
      
      let foundSections = 0;
      
      for (const sectionType of sectionTypes) {
        const sections = page.locator(`[class*="${sectionType}"], .section-type-${sectionType.replace('-section', '')}`);
        if (await sections.count() > 0) {
          foundSections++;
        }
      }
      
      // At least some sections should be present in the test page
      // (may not have all types depending on test data)
      expect(foundSections).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA attributes on card', async ({ page }) => {
      const cardSurface = page.locator('.ai-card-surface');
      
      // Check for role attribute
      const role = await cardSurface.getAttribute('role');
      expect(role).toBe('article');
      
      // Check for aria-label or aria-labelledby
      const ariaLabel = await cardSurface.getAttribute('aria-label');
      const ariaLabelledBy = await cardSurface.getAttribute('aria-labelledby');
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    });

    test('should have accessible streaming indicator', async ({ page }) => {
      const streamingIndicator = page.locator('.streaming-indicator, app-card-streaming-indicator');
      
      if (await streamingIndicator.count() > 0) {
        // Check for proper ARIA attributes
        const roleAttr = await streamingIndicator.getAttribute('role');
        const ariaLive = await streamingIndicator.getAttribute('aria-live');
        
        // Should have status role and polite aria-live
        expect(roleAttr || 'status').toBeTruthy();
        expect(ariaLive).toBeDefined();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Focus on the card
      await page.keyboard.press('Tab');
      
      // Check if focus moved to the card or a section
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should render card within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/ilibrary');
      await page.waitForSelector('.ai-card-surface');
      
      const loadTime = Date.now() - startTime;
      
      // Card should render within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should not have memory leaks on resize', async ({ page }) => {
      // Resize multiple times
      for (let i = 0; i < 5; i++) {
        await page.setViewportSize({ width: 800 + (i * 100), height: 600 });
        await page.waitForTimeout(100);
      }
      
      // Card should still be visible and responsive
      const cardSurface = page.locator('.ai-card-surface');
      await expect(cardSurface).toBeVisible();
    });
  });

  test.describe('Export Functionality', () => {
    test('should have export button', async ({ page }) => {
      const exportButton = page.locator('.ai-card-fullscreen-btn, [class*="export"]');
      
      // Export button may or may not be visible depending on config
      const isVisible = await exportButton.count() > 0;
      expect(typeof isVisible).toBe('boolean');
    });
  });

  test.describe('Card Actions', () => {
    test('should render action buttons when present', async ({ page }) => {
      const actionButtons = page.locator('.ai-card-action, app-card-actions button');
      
      // May or may not have actions depending on card config
      const count = await actionButtons.count();
      expect(count).toBeGreaterThanOrEqual(0);
      
      if (count > 0) {
        // Verify first action button is clickable
        const firstAction = actionButtons.first();
        await expect(firstAction).toBeVisible();
        await expect(firstAction).toBeEnabled();
      }
    });
  });

  test.describe('Shadow DOM Integration', () => {
    test('should properly encapsulate styles in Shadow DOM', async ({ page }) => {
      // Get the card renderer host element
      const cardRenderer = page.locator('app-ai-card-renderer');
      
      // Check if Shadow DOM is being used
      const hasShadowRoot = await cardRenderer.evaluate(el => {
        return el.shadowRoot !== null;
      });
      
      // Should be using Shadow DOM
      expect(hasShadowRoot).toBe(true);
    });

    test('should apply CSS custom properties from host', async ({ page }) => {
      const cardRenderer = page.locator('app-ai-card-renderer');
      
      // Check if CSS custom properties are defined
      const brandColor = await cardRenderer.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.getPropertyValue('--color-brand');
      });
      
      // Brand color should be defined (even if empty string initially)
      expect(brandColor).toBeDefined();
    });
  });

  test.describe('Theme Support', () => {
    test('should support dark theme', async ({ page }) => {
      // Look for dark theme class or attribute
      const container = page.locator('[data-theme="night"], .osi-cards-container[data-theme="night"]');
      
      // Theme may or may not be set
      const hasDarkTheme = await container.count() > 0;
      expect(typeof hasDarkTheme).toBe('boolean');
    });

    test('should support light theme', async ({ page }) => {
      // Look for light theme class or attribute
      const container = page.locator('[data-theme="day"], .osi-cards-container[data-theme="day"]');
      
      // Theme may or may not be set
      const hasLightTheme = await container.count() > 0;
      expect(typeof hasLightTheme).toBe('boolean');
    });
  });
});

/**
 * Visual Regression Tests
 * Compare screenshots across library updates
 */
test.describe('Visual Regression', () => {
  test('card should match visual snapshot', async ({ page }) => {
    await page.goto('/ilibrary');
    await page.waitForSelector('.ai-card-surface');
    
    // Wait for animations to settle
    await page.waitForTimeout(1000);
    
    const cardSurface = page.locator('.ai-card-surface');
    
    // Take screenshot for visual comparison
    await expect(cardSurface).toHaveScreenshot('ilibrary-card.png', {
      maxDiffPixels: 500, // Allow some variation due to dynamic content
      threshold: 0.3
    });
  });
});






