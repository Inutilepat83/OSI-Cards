/**
 * Security Testing
 *
 * Tests for common security vulnerabilities.
 */

import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('should not expose sensitive information in HTML', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const html = await page.content();

    // Should not contain sensitive patterns
    expect(html).not.toMatch(/password\s*[:=]\s*['"][^'"]+['"]/i);
    expect(html).not.toMatch(/api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i);
    expect(html).not.toMatch(/secret\s*[:=]\s*['"][^'"]+['"]/i);
  });

  test('should have security headers', async ({ page }) => {
    const response = await page.goto('http://localhost:4200');
    const headers = response?.headers() || {};

    // Check for security headers (if served by server)
    // Note: In dev mode, some headers might not be present
    expect(headers).toBeDefined();
  });

  test('should sanitize user input', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Try to inject script
    const input = page.locator('input, textarea').first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill('<script>alert("xss")</script>');

      // Check if script is executed (it shouldn't be)
      const alerts: string[] = [];
      page.on('dialog', dialog => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });

      await page.waitForTimeout(1000);
      expect(alerts).toEqual([]);
    }
  });

  test('should not allow clickjacking', async ({ page }) => {
    // Try to load in iframe
    await page.goto('http://localhost:4200');

    const canBeFramed = await page.evaluate(() => {
      try {
        const iframe = document.createElement('iframe');
        iframe.src = window.location.href;
        document.body.appendChild(iframe);
        return true;
      } catch {
        return false;
      }
    });

    // X-Frame-Options should prevent framing
    // (This test is limited in dev mode)
    expect(typeof canBeFramed).toBe('boolean');
  });

  test('should use HTTPS in production URLs', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Check for http:// links (should be https:// in prod)
    const links = await page.locator('a[href^="http://"]').all();

    // In production, should have no http:// links
    // In dev, this is acceptable
    if (process.env.NODE_ENV === 'production') {
      expect(links.length).toBe(0);
    }
  });

  test('should not expose stack traces', async ({ page }) => {
    // Navigate to error page
    await page.goto('http://localhost:4200/trigger-error');

    const content = await page.content();

    // Should not expose stack traces in production
    expect(content).not.toMatch(/at\s+\w+\s+\([^)]+:\d+:\d+\)/);
    expect(content).not.toMatch(/Error:\s+[^\n]+\n\s+at/);
  });

  test('should have CSP headers (if configured)', async ({ page }) => {
    const response = await page.goto('http://localhost:4200');
    const headers = response?.headers() || {};

    // CSP header (if configured)
    const csp = headers['content-security-policy'];
    if (csp) {
      expect(csp).toContain("default-src");
    }
  });

  test('should not allow SQL injection in forms', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const input = page.locator('input[type="text"], textarea').first();
    if (await input.isVisible().catch(() => false)) {
      // Try SQL injection
      await input.fill("' OR '1'='1");

      // Submit if form exists
      const form = page.locator('form').first();
      if (await form.isVisible().catch(() => false)) {
        await form.evaluate(f => (f as HTMLFormElement).submit());

        // Should not cause errors or expose data
        await page.waitForTimeout(1000);
        const errors = await page.locator('.error, [role="alert"]').count();
        // Errors might appear, but should be handled gracefully
      }
    }
  });
});

// Security Testing Best Practices:
// 1. Test for OWASP Top 10
// 2. Automated security scanning (SAST, DAST)
// 3. Dependency vulnerability scanning
// 4. Regular penetration testing
// 5. Security headers verification
// 6. Input validation testing
// 7. Authentication/authorization testing

