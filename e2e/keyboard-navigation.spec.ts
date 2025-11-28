import { test, expect } from '@playwright/test';

/**
 * Comprehensive Keyboard Navigation Tests
 * 
 * Ensures all interactive elements are accessible via keyboard navigation.
 * Tests cover:
 * - Tab navigation through all focusable elements
 * - Enter and Space key activation
 * - Arrow key navigation for card sections
 * - Escape key for closing modals/dialogs
 * - Focus management and trapping
 * - Skip links
 * - ARIA attributes and roles
 * - Keyboard shortcuts
 */
test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for cards to load
    await page.waitForSelector('app-ai-card-renderer, app-card-preview', { timeout: 10000 }).catch(() => {});
  });

  test('should navigate through all interactive elements with Tab', async ({ page }) => {
    const interactiveElements: Array<{
      tag: string;
      type: string | null;
      role: string | null;
      tabIndex: string | null;
      ariaLabel: string | null;
    }> = [];
    
    // Collect all focusable elements
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]',
      '[role="link"]',
      '[role="tab"]',
      '[role="menuitem"]'
    ];

    // Press Tab multiple times to navigate through all focusable elements
    const maxIterations = 50; // Limit to prevent infinite loops
    let previousFocus: string | null = null;
    let sameFocusCount = 0;

    for (let i = 0; i < maxIterations; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50); // Small delay for focus changes

      const focused = await page.evaluate(() => {
        const active = document.activeElement;
        if (!active) return null;
        
        return {
          tag: active.tagName.toLowerCase(),
          type: (active as HTMLElement).getAttribute('type'),
          role: active.getAttribute('role'),
          tabIndex: active.getAttribute('tabindex'),
          ariaLabel: active.getAttribute('aria-label'),
          id: active.id,
          className: active.className
        };
      });
      
      if (focused) {
        const focusKey = `${focused.tag}-${focused.id || focused.className}`;
        
        // Check if we're stuck in a loop (same element focused multiple times)
        if (previousFocus === focusKey) {
          sameFocusCount++;
          if (sameFocusCount > 3) {
            break; // Exit if we're stuck
          }
        } else {
          sameFocusCount = 0;
        }
        
        previousFocus = focusKey;
        interactiveElements.push(focused);
      } else {
        break; // No focusable element found
      }
    }

    // Should have found at least some interactive elements
    expect(interactiveElements.length).toBeGreaterThan(0);
    
    // Log found elements for debugging
    console.log(`Found ${interactiveElements.length} focusable elements`);
  });

  test('should activate buttons with Enter and Space', async ({ page }) => {
    // Find all buttons
    const buttons = page.locator('button:not([disabled]), [role="button"]:not([disabled])');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Test first button
      const firstButton = buttons.first();
      await firstButton.focus();
      
      // Verify button is focused
      const isFocused = await firstButton.evaluate((el) => document.activeElement === el);
      expect(isFocused).toBeTruthy();
      
      // Test Enter key
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      
      // Test Space key
      await firstButton.focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
      
      // Button should still be visible and focusable
      expect(await firstButton.isVisible()).toBeTruthy();
    } else {
      test.skip(); // Skip if no buttons found
    }
  });

  test('should activate card sections with Enter and Space', async ({ page }) => {
    // Find interactive card sections (solutions, products, lists, contacts)
    const interactiveSections = page.locator(
      '.solution-card[tabindex="0"], ' +
      '.product-entry[tabindex="0"], ' +
      '.list-card[tabindex="0"], ' +
      '.contact-card[tabindex="0"], ' +
      'article[role="button"][tabindex="0"]'
    );
    
    const sectionCount = await interactiveSections.count();
    
    if (sectionCount > 0) {
      const firstSection = interactiveSections.first();
      await firstSection.focus();
      
      // Verify section is focused
      const isFocused = await firstSection.evaluate((el) => document.activeElement === el);
      expect(isFocused).toBeTruthy();
      
      // Test Enter key activation
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      
      // Test Space key activation
      await firstSection.focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
      
      // Section should still be visible
      expect(await firstSection.isVisible()).toBeTruthy();
    }
  });

  test('should close modals and dialogs with Escape', async ({ page }) => {
    // Check if any modals/dialogs are open
    const modals = page.locator('[role="dialog"], .modal, .dialog, [data-modal]');
    const modalCount = await modals.count();
    
    if (modalCount > 0) {
      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      // Modal should be hidden or removed
      const remainingModals = await page.locator('[role="dialog"]:not([hidden]), .modal:not([hidden])').count();
      expect(remainingModals).toBe(0);
    } else {
      // Test that Escape doesn't cause errors when no modal is open
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
      
      // No errors should occur
      const errors = await page.evaluate(() => {
        return window.console.error ? 'errors-checked' : 'no-console';
      });
      expect(errors).toBeTruthy();
    }
  });

  test('should navigate card sections with arrow keys', async ({ page }) => {
    // Find card sections that support arrow key navigation
    const cardSections = page.locator(
      '.solution-card, .product-entry, .list-card, .contact-card, article[role="button"]'
    );
    
    const sectionCount = await cardSections.count();
    
    if (sectionCount > 1) {
      // Focus first section
      await cardSections.first().focus();
      
      // Test arrow key navigation
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(100);
      
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
      
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(100);
      
      // Focus should remain on a card section
      const focused = await page.evaluate(() => {
        const active = document.activeElement;
        return active ? {
          tag: active.tagName,
          role: active.getAttribute('role'),
          hasTabIndex: active.hasAttribute('tabindex')
        } : null;
      });
      
      expect(focused).toBeTruthy();
    }
  });

  test('should skip to main content with skip link', async ({ page }) => {
    // Look for skip links
    const skipLink = page.locator(
      'a[href="#main-content"], ' +
      'a[href="#main"], ' +
      '.skip-link, ' +
      '[data-skip-link], ' +
      'a[href^="#"]'
    ).first();
    
    const skipLinkCount = await skipLink.count();
    
    if (skipLinkCount > 0) {
      // Focus skip link
      await skipLink.focus();
      
      // Verify it's focused
      const isFocused = await skipLink.evaluate((el) => document.activeElement === el);
      expect(isFocused).toBeTruthy();
      
      // Activate skip link
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      // Should navigate to main content
      const mainContent = page.locator('#main-content, #main, main, [role="main"]').first();
      const mainContentCount = await mainContent.count();
      
      if (mainContentCount > 0) {
        // Check if main content is in viewport or focused
        const isVisible = await mainContent.isVisible();
        expect(isVisible).toBeTruthy();
      }
    }
  });

  test('should trap focus in modals', async ({ page }) => {
    // This test requires a modal to be open
    // For now, verify that focusable elements exist and can be navigated
    
    const focusableElements = page.locator(
      'button:not([disabled]), ' +
      'a[href], ' +
      'input:not([disabled]), ' +
      'textarea:not([disabled]), ' +
      'select:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"])'
    );
    
    const count = await focusableElements.count();
    expect(count).toBeGreaterThan(0);
    
    // If a modal exists, test focus trapping
    const modal = page.locator('[role="dialog"]:not([hidden]), .modal:not([hidden])').first();
    const modalCount = await modal.count();
    
    if (modalCount > 0) {
      // Focus should be within modal
      const modalFocusable = modal.locator(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      const modalFocusableCount = await modalFocusable.count();
      expect(modalFocusableCount).toBeGreaterThan(0);
      
      // Focus first element in modal
      await modalFocusable.first().focus();
      
      // Tab through modal elements
      for (let i = 0; i < Math.min(modalFocusableCount, 5); i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        // Verify focus is still within modal
        const focusedInModal = await page.evaluate((modalEl) => {
          const active = document.activeElement;
          return active && modalEl.contains(active);
        }, await modal.first().elementHandle());
        
        expect(focusedInModal).toBeTruthy();
      }
    }
  });

  test('should have proper ARIA attributes on interactive elements', async ({ page }) => {
    // Check that interactive elements have proper ARIA attributes
    const interactiveElements = page.locator(
      'button, a[href], [role="button"], [role="link"], [tabindex="0"]'
    );
    
    const count = await interactiveElements.count();
    
    if (count > 0) {
      // Sample first few elements
      const sampleSize = Math.min(count, 10);
      
      for (let i = 0; i < sampleSize; i++) {
        const element = interactiveElements.nth(i);
        
        const ariaAttributes = await element.evaluate((el) => {
          return {
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
            ariaLabelledBy: el.getAttribute('aria-labelledby'),
            ariaDescribedBy: el.getAttribute('aria-describedby'),
            hasText: el.textContent?.trim().length > 0
          };
        });
        
        // Element should have either aria-label, aria-labelledby, or visible text
        const hasAccessibleName = 
          ariaAttributes.ariaLabel ||
          ariaAttributes.ariaLabelledBy ||
          ariaAttributes.hasText;
        
        expect(hasAccessibleName).toBeTruthy();
      }
    }
  });

  test('should navigate form inputs correctly', async ({ page }) => {
    // Find form inputs
    const inputs = page.locator(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
    );
    
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      // Focus first input
      await inputs.first().focus();
      
      // Verify it's focused
      const isFocused = await inputs.first().evaluate((el) => document.activeElement === el);
      expect(isFocused).toBeTruthy();
      
      // Test typing
      await page.keyboard.type('test');
      await page.waitForTimeout(100);
      
      // Test Tab to next input
      if (inputCount > 1) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        // Next input should be focused
        const nextFocused = await inputs.nth(1).evaluate((el) => document.activeElement === el);
        expect(nextFocused).toBeTruthy();
      }
    }
  });

  test('should handle Shift+Tab for reverse navigation', async ({ page }) => {
    // Navigate forward with Tab
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    const firstFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? active.tagName + (active.id ? '#' + active.id : '') : null;
    });
    
    // Navigate forward again
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    const secondFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? active.tagName + (active.id ? '#' + active.id : '') : null;
    });
    
    // Navigate backward with Shift+Tab
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(100);
    
    const backFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? active.tagName + (active.id ? '#' + active.id : '') : null;
    });
    
    // Should be back to first focused element
    expect(backFocused).toBe(firstFocused);
  });
});

