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
      expect(result.length).toBeLessThanOrEqual(200);
    });

    it('should handle non-string input', () => {
      expect(ValidationUtil.sanitizeCardTitle(null as any)).toBe('');
      expect(ValidationUtil.sanitizeCardTitle(undefined as any)).toBe('');
      expect(ValidationUtil.sanitizeCardTitle(123 as any)).toBe('');
    });
  });

  describe('validateCard', () => {
    it('should validate valid card', () => {
      const card = {
        cardTitle: 'Test Card',
        sections: [
          {
            title: 'Section 1',
            type: 'info',
            fields: [{ label: 'Field 1', value: 'Value 1' }],
          },
        ],
      };

      const result = ValidationUtil.validateCard(card);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject card without title', () => {
      const card = {
        sections: [{ title: 'Section 1', type: 'info' }],
      };

      const result = ValidationUtil.validateCard(card);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject card with empty title', () => {
      const card = {
        cardTitle: '',
        sections: [{ title: 'Section 1', type: 'info' }],
      };

      const result = ValidationUtil.validateCard(card);
      expect(result.isValid).toBe(false);
    });

    it('should reject card with title too long', () => {
      const card = {
        cardTitle: 'A'.repeat(201),
        sections: [{ title: 'Section 1', type: 'info' }],
      };

      const result = ValidationUtil.validateCard(card);
      expect(result.isValid).toBe(false);
    });

    it('should reject card without sections', () => {
      const card = {
        cardTitle: 'Test Card',
        sections: [],
      };

      const result = ValidationUtil.validateCard(card);
      expect(result.isValid).toBe(false);
    });

    it('should reject card with null sections', () => {
      const card = {
        cardTitle: 'Test Card',
        sections: null as any,
      };

      const result = ValidationUtil.validateCard(card);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateSection', () => {
    it('should validate valid section', () => {
      const section = {
        title: 'Section 1',
        type: 'info',
        fields: [{ label: 'Field 1', value: 'Value 1' }],
      };

      const errors = ValidationUtil.validateSection(section, 0);
      expect(errors.length).toBe(0);
    });

    it('should reject section without title', () => {
      const section = {
        type: 'info',
      };

      const errors = ValidationUtil.validateSection(section, 0);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject section with empty title', () => {
      const section = {
        title: '',
        type: 'info',
      };

      const errors = ValidationUtil.validateSection(section, 0);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject section with title too long', () => {
      const section = {
        title: 'A'.repeat(101),
        type: 'info',
      };

      const errors = ValidationUtil.validateSection(section, 0);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject section without type', () => {
      const section = {
        title: 'Section 1',
      };

      const errors = ValidationUtil.validateSection(section, 0);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject section with too many fields', () => {
      const fields = Array.from({ length: 1001 }, (_, i) => ({
        label: `Field ${i}`,
        value: `Value ${i}`,
      }));

      const section = {
        title: 'Section 1',
        type: 'info',
        fields,
      };

      const errors = ValidationUtil.validateSection(section, 0);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject section with too many items', () => {
      const items = Array.from({ length: 1001 }, (_, i) => ({
        title: `Item ${i}`,
      }));

      const section = {
        title: 'Section 1',
        type: 'info',
        items,
      };

      const errors = ValidationUtil.validateSection(section, 0);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateField', () => {
    it('should validate valid field with label', () => {
      const field = {
        label: 'Field 1',
        value: 'Value 1',
      };

      const errors = ValidationUtil.validateField(field, 0, 0);
      expect(errors.length).toBe(0);
    });

    it('should validate valid field with title', () => {
      const field = {
        title: 'Field 1',
        value: 'Value 1',
      };

      const errors = ValidationUtil.validateField(field, 0, 0);
      expect(errors.length).toBe(0);
    });

    it('should reject field without label or title', () => {
      const field = {
        value: 'Value 1',
      };

      const errors = ValidationUtil.validateField(field, 0, 0);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate field with number value', () => {
      const field = {
        label: 'Field 1',
        value: 123,
      };

      const errors = ValidationUtil.validateField(field, 0, 0);
      expect(errors.length).toBe(0);
    });

    it('should validate field with boolean value', () => {
      const field = {
        label: 'Field 1',
        value: true,
      };

      const errors = ValidationUtil.validateField(field, 0, 0);
      expect(errors.length).toBe(0);
    });

    it('should reject field with invalid value type', () => {
      const field = {
        label: 'Field 1',
        value: {} as any,
      };

      const errors = ValidationUtil.validateField(field, 0, 0);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateItem', () => {
    it('should validate valid item', () => {
      const item = {
        title: 'Item 1',
        description: 'Description',
      };

      const errors = ValidationUtil.validateItem(item, 0, 0);
      expect(errors.length).toBe(0);
    });

    it('should reject item without title', () => {
      const item = {
        description: 'Description',
      };

      const errors = ValidationUtil.validateItem(item, 0, 0);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject item with non-string title', () => {
      const item = {
        title: 123 as any,
      };

      const errors = ValidationUtil.validateItem(item, 0, 0);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle URLs with special characters', () => {
      expect(ValidationUtil.isValidUrl('https://example.com/path?query=value&other=test')).toBe(
        true
      );
      expect(ValidationUtil.isValidUrl('https://example.com/path#fragment')).toBe(true);
    });

    it('should handle internationalized domain names', () => {
      // Note: This may fail in some environments, but should not throw
      expect(() => ValidationUtil.isValidUrl('https://例え.テスト')).not.toThrow();
    });

    it('should handle email with plus sign', () => {
      expect(ValidationUtil.isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should handle email with dots', () => {
      expect(ValidationUtil.isValidEmail('user.name@example.com')).toBe(true);
    });

    it('should sanitize string with various XSS attempts', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        'javascript:alert("xss")',
        '<svg onload=alert("xss")>',
        '<iframe src="javascript:alert(\'xss\')"></iframe>',
      ];

      xssAttempts.forEach((attempt) => {
        const result = ValidationUtil.sanitizeString(attempt);
        expect(result).not.toContain('<script');
        expect(result).not.toContain('onerror');
        expect(result).not.toContain('javascript:');
      });
    });

    it('should handle empty and whitespace strings', () => {
      expect(ValidationUtil.sanitizeString('')).toBe('');
      expect(ValidationUtil.sanitizeString('   ')).toBe('   ');
      expect(ValidationUtil.sanitizeCardTitle('')).toBe('');
    });
  });
});
