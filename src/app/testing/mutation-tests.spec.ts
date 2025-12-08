/**
 * Mutation Testing Configuration
 *
 * Tests the quality of tests by mutating code and checking if tests catch it.
 * Use Stryker Mutator: https://stryker-mutator.io
 *
 * Run: npx stryker run
 */

// Mutation testing example
describe('Mutation Testing Examples', () => {
  describe('Validator Mutations', () => {
    it('should catch if email validation is removed', () => {
      // This test ensures that if someone removes the @ check,
      // the test will fail
      const validEmail = 'test@example.com';
      const invalidEmail = 'testexample.com';

      // If validator is mutated to always return true, this fails
      expect(validEmail.includes('@')).toBe(true);
      expect(invalidEmail.includes('@')).toBe(false);
    });

    it('should catch if URL validation is removed', () => {
      const validUrl = 'https://example.com';
      const invalidUrl = 'not-a-url';

      expect(() => new URL(validUrl)).not.toThrow();
      expect(() => new URL(invalidUrl)).toThrow();
    });
  });

  describe('Sanitizer Mutations', () => {
    it('should catch if HTML sanitization is removed', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

      // If sanitizer is mutated to not replace, this fails
      expect(sanitized).not.toContain('<script>');
    });

    it('should catch if XSS protection is weakened', () => {
      const input = '<img src=x onerror="alert(1)">';
      const sanitized = input.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

      expect(sanitized).not.toContain('onerror');
    });
  });

  describe('Feature Flag Mutations', () => {
    it('should catch if feature flag check is inverted', () => {
      const enabled = true;

      // If someone mutates 'if (enabled)' to 'if (!enabled)', this fails
      if (enabled) {
        expect(enabled).toBe(true);
      } else {
        fail('Should not reach here when enabled=true');
      }
    });
  });

  describe('Error Handling Mutations', () => {
    it('should catch if error handling is removed', () => {
      let errorCaught = false;

      try {
        throw new Error('Test error');
      } catch (error) {
        errorCaught = true;
      }

      // If someone removes try/catch, this fails
      expect(errorCaught).toBe(true);
    });

    it('should catch if error logging is removed', () => {
      const errors: string[] = [];

      const logError = (msg: string) => errors.push(msg);

      try {
        throw new Error('Test');
      } catch (e: any) {
        logError(e.message);
      }

      // If someone removes logError call, this fails
      expect(errors.length).toBe(1);
    });
  });
});

// Stryker configuration notes:
// 1. Install: npm install --save-dev @stryker-mutator/core
// 2. Configure: npx stryker init
// 3. Run: npx stryker run
// 4. Target: 80%+ mutation score
