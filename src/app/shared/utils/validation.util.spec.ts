import { ValidationUtil } from './validation.util';

describe('ValidationUtil', () => {
  describe('isValidUrl', () => {
    it('should return true for valid HTTP URLs', () => {
      expect(ValidationUtil.isValidUrl('http://example.com')).toBe(true);
      expect(ValidationUtil.isValidUrl('https://example.com')).toBe(true);
    });

    it('should return true for valid URLs with paths', () => {
      expect(ValidationUtil.isValidUrl('https://example.com/path')).toBe(true);
      expect(ValidationUtil.isValidUrl('https://example.com/path?query=value')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(ValidationUtil.isValidUrl('not-a-url')).toBe(false);
      expect(ValidationUtil.isValidUrl('ftp://example.com')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(ValidationUtil.isValidUrl('')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(ValidationUtil.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtil.isValidEmail('user.name@example.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(ValidationUtil.isValidEmail('not-an-email')).toBe(false);
      expect(ValidationUtil.isValidEmail('@example.com')).toBe(false);
      expect(ValidationUtil.isValidEmail('test@')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(ValidationUtil.isValidEmail('')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = ValidationUtil.sanitizeString(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should preserve safe text', () => {
      const input = 'Safe text content';
      const result = ValidationUtil.sanitizeString(input);
      expect(result).toBe('Safe text content');
    });

    it('should handle empty string', () => {
      expect(ValidationUtil.sanitizeString('')).toBe('');
    });
  });

  describe('sanitizeCardTitle', () => {
    it('should sanitize card title', () => {
      const input = '<script>alert("xss")</script>Card Title';
      const result = ValidationUtil.sanitizeCardTitle(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Card Title');
    });

    it('should limit title length', () => {
      const longTitle = 'a'.repeat(200);
      const result = ValidationUtil.sanitizeCardTitle(longTitle);
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });
});







