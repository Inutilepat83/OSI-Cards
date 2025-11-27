import { SanitizationUtil } from './sanitization.util';
import { ValidationUtil } from './validation.util';

describe('SanitizationUtil', () => {
  beforeEach(() => {
    spyOn(ValidationUtil, 'sanitizeCardTitle').and.callFake((title: string) => title.trim());
    spyOn(ValidationUtil, 'sanitizeString').and.callFake((str: string) => str.trim());
    spyOn(ValidationUtil, 'isValidUrl').and.callFake((url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });
    spyOn(ValidationUtil, 'isValidEmail').and.callFake((email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    });
  });

  describe('sanitizeHtml', () => {
    it('should sanitize HTML by escaping special characters', () => {
      const html = '<script>alert("XSS")</script>';
      const result = SanitizationUtil.sanitizeHtml(html);
      expect(result).not.toContain('<script>');
      expect(result).toContain('alert');
    });

    it('should handle empty string', () => {
      const result = SanitizationUtil.sanitizeHtml('');
      expect(result).toBe('');
    });

    it('should handle plain text', () => {
      const text = 'Plain text without HTML';
      const result = SanitizationUtil.sanitizeHtml(text);
      expect(result).toBe(text);
    });
  });

  describe('sanitizeCardTitle', () => {
    it('should call ValidationUtil.sanitizeCardTitle', () => {
      const title = '  My Card Title  ';
      SanitizationUtil.sanitizeCardTitle(title);
      expect(ValidationUtil.sanitizeCardTitle).toHaveBeenCalledWith(title);
    });

    it('should return sanitized title', () => {
      const title = '  My Card Title  ';
      const result = SanitizationUtil.sanitizeCardTitle(title);
      expect(result).toBe('My Card Title');
    });
  });

  describe('sanitizeSectionTitle', () => {
    it('should sanitize and truncate section title', () => {
      const title = '  My Section Title  ';
      const result = SanitizationUtil.sanitizeSectionTitle(title);
      expect(ValidationUtil.sanitizeString).toHaveBeenCalled();
      expect(result.length).toBeLessThanOrEqual(100);
    });

    it('should return empty string for non-string input', () => {
      const result = SanitizationUtil.sanitizeSectionTitle(null as any);
      expect(result).toBe('');
    });
  });

  describe('sanitizeFieldValue', () => {
    it('should return null for null input', () => {
      expect(SanitizationUtil.sanitizeFieldValue(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(SanitizationUtil.sanitizeFieldValue(undefined)).toBeNull();
    });

    it('should return number as-is', () => {
      expect(SanitizationUtil.sanitizeFieldValue(42)).toBe(42);
    });

    it('should return boolean as-is', () => {
      expect(SanitizationUtil.sanitizeFieldValue(true)).toBe(true);
    });

    it('should sanitize string values', () => {
      const value = '  test value  ';
      SanitizationUtil.sanitizeFieldValue(value);
      expect(ValidationUtil.sanitizeString).toHaveBeenCalledWith(value);
    });
  });

  describe('sanitizeUrl', () => {
    it('should return null for empty string', () => {
      expect(SanitizationUtil.sanitizeUrl('')).toBeNull();
    });

    it('should return null for invalid URL', () => {
      (ValidationUtil.isValidUrl as jasmine.Spy).and.returnValue(false);
      expect(SanitizationUtil.sanitizeUrl('not-a-url')).toBeNull();
    });

    it('should return URL for valid http URL', () => {
      (ValidationUtil.isValidUrl as jasmine.Spy).and.returnValue(true);
      const url = 'http://example.com';
      const result = SanitizationUtil.sanitizeUrl(url);
      expect(result).toBe(url);
    });

    it('should return URL for valid https URL', () => {
      (ValidationUtil.isValidUrl as jasmine.Spy).and.returnValue(true);
      const url = 'https://example.com';
      const result = SanitizationUtil.sanitizeUrl(url);
      expect(result).toBe(url);
    });

    it('should return URL for valid mailto URL', () => {
      (ValidationUtil.isValidUrl as jasmine.Spy).and.returnValue(true);
      const url = 'mailto:test@example.com';
      const result = SanitizationUtil.sanitizeUrl(url);
      expect(result).toBe(url);
    });

    it('should return null for javascript: protocol', () => {
      (ValidationUtil.isValidUrl as jasmine.Spy).and.returnValue(true);
      const url = 'javascript:alert(1)';
      const result = SanitizationUtil.sanitizeUrl(url);
      expect(result).toBeNull();
    });
  });

  describe('sanitizeEmail', () => {
    it('should return null for empty string', () => {
      expect(SanitizationUtil.sanitizeEmail('')).toBeNull();
    });

    it('should return null for invalid email', () => {
      (ValidationUtil.isValidEmail as jasmine.Spy).and.returnValue(false);
      expect(SanitizationUtil.sanitizeEmail('not-an-email')).toBeNull();
    });

    it('should return lowercase trimmed email for valid email', () => {
      (ValidationUtil.isValidEmail as jasmine.Spy).and.returnValue(true);
      const email = '  TEST@EXAMPLE.COM  ';
      const result = SanitizationUtil.sanitizeEmail(email);
      expect(result).toBe('test@example.com');
    });
  });

  describe('sanitizeJsonInput', () => {
    it('should return empty string for empty input', () => {
      expect(SanitizationUtil.sanitizeJsonInput('')).toBe('');
    });

    it('should remove script tags', () => {
      const input = '{"data": "<script>alert(1)</script>"}';
      const result = SanitizationUtil.sanitizeJsonInput(input);
      expect(result).not.toContain('<script>');
    });

    it('should remove event handlers', () => {
      const input = '{"data": "<div onclick="alert(1)">Test</div>"}';
      const result = SanitizationUtil.sanitizeJsonInput(input);
      expect(result).not.toContain('onclick=');
    });

    it('should remove javascript: protocol', () => {
      const input = '{"url": "javascript:alert(1)"}';
      const result = SanitizationUtil.sanitizeJsonInput(input);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('sanitizeObject', () => {
    it('should return null for null input', () => {
      expect(SanitizationUtil.sanitizeObject(null)).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(SanitizationUtil.sanitizeObject(undefined)).toBeUndefined();
    });

    it('should sanitize string values', () => {
      const obj = { name: '  test  ' };
      SanitizationUtil.sanitizeObject(obj);
      expect(ValidationUtil.sanitizeString).toHaveBeenCalled();
    });

    it('should return number as-is', () => {
      expect(SanitizationUtil.sanitizeObject(42)).toBe(42);
    });

    it('should return boolean as-is', () => {
      expect(SanitizationUtil.sanitizeObject(true)).toBe(true);
    });

    it('should sanitize array elements', () => {
      const arr = ['  test1  ', '  test2  '];
      SanitizationUtil.sanitizeObject(arr);
      expect(ValidationUtil.sanitizeString).toHaveBeenCalledTimes(2);
    });

    it('should sanitize object properties recursively', () => {
      const obj = {
        name: '  test  ',
        nested: {
          value: '  nested  '
        }
      };
      SanitizationUtil.sanitizeObject(obj);
      expect(ValidationUtil.sanitizeString).toHaveBeenCalled();
    });
  });
});

