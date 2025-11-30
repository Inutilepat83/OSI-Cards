import {
  validateUrl,
  isSafeUrl,
  validateEmail,
  validateEmailConfig,
  escapeHtml,
  sanitizeHtml,
  sanitizeText,
  sanitizeTitle,
  validateCardConfig
} from './input-validation.util';

describe('Input Validation Utilities', () => {
  // ============================================================================
  // URL Validation Tests
  // ============================================================================
  describe('validateUrl', () => {
    it('should validate valid HTTPS URLs', () => {
      const result = validateUrl('https://example.com');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('https://example.com/');
    });

    it('should validate valid HTTP URLs', () => {
      const result = validateUrl('http://example.com/path?query=value');
      expect(result.valid).toBe(true);
    });

    it('should validate mailto URLs', () => {
      const result = validateUrl('mailto:test@example.com');
      expect(result.valid).toBe(true);
    });

    it('should validate tel URLs', () => {
      const result = validateUrl('tel:+1234567890');
      expect(result.valid).toBe(true);
    });

    it('should reject javascript: URLs', () => {
      const result = validateUrl('javascript:alert("xss")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Script URLs');
    });

    it('should reject vbscript: URLs', () => {
      const result = validateUrl('vbscript:alert("xss")');
      expect(result.valid).toBe(false);
    });

    it('should reject data: URLs by default', () => {
      const result = validateUrl('data:text/html,<script>alert("xss")</script>');
      expect(result.valid).toBe(false);
    });

    it('should allow data: URLs when explicitly enabled', () => {
      const result = validateUrl('data:image/png;base64,abc123', { allowDataUrls: true });
      expect(result.valid).toBe(true);
    });

    it('should reject non-string values', () => {
      expect(validateUrl(null).valid).toBe(false);
      expect(validateUrl(undefined).valid).toBe(false);
      expect(validateUrl(123).valid).toBe(false);
      expect(validateUrl({}).valid).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(validateUrl('').valid).toBe(false);
      expect(validateUrl('   ').valid).toBe(false);
    });

    it('should reject URLs exceeding max length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(3000);
      const result = validateUrl(longUrl);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('maximum length');
    });

    it('should handle custom allowed protocols', () => {
      const result = validateUrl('ftp://example.com', { allowedProtocols: ['ftp:'] });
      expect(result.valid).toBe(true);
    });

    it('should allow relative URLs when enabled', () => {
      const result = validateUrl('/path/to/resource', { allowRelative: true });
      expect(result.valid).toBe(true);
    });
  });

  describe('isSafeUrl', () => {
    it('should return true for safe URLs', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
    });

    it('should return false for unsafe URLs', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    });
  });

  // ============================================================================
  // Email Validation Tests
  // ============================================================================
  describe('validateEmail', () => {
    it('should validate valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@.com')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
      expect(validateEmail(123)).toBe(false);
    });

    it('should reject emails exceeding max length', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
    });
  });

  describe('validateEmailConfig', () => {
    it('should validate valid email config', () => {
      const config = {
        contact: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Manager'
        },
        subject: 'Test Subject',
        body: 'Test Body'
      };

      const result = validateEmailConfig(config);
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBeDefined();
    });

    it('should reject invalid contact email', () => {
      const config = {
        contact: {
          name: 'John',
          email: 'invalid-email',
          role: 'Manager'
        }
      };

      const result = validateEmailConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should filter invalid CC emails', () => {
      const config = {
        contact: { name: 'John', email: 'john@example.com', role: 'Manager' },
        cc: ['valid@example.com', 'invalid', 'another@valid.com']
      };

      const result = validateEmailConfig(config);
      expect(result.valid).toBe(true);
      expect((result.sanitized?.['cc'] as string[]).length).toBe(2);
    });

    it('should reject non-object config', () => {
      expect(validateEmailConfig(null).valid).toBe(false);
      expect(validateEmailConfig('string').valid).toBe(false);
    });
  });

  // ============================================================================
  // HTML Sanitization Tests
  // ============================================================================
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
      expect(escapeHtml("'hello'")).toBe('&#x27;hello&#x27;');
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('should handle non-string values', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml(123)).toBe('');
    });

    it('should leave safe characters unchanged', () => {
      expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const html = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('script');
      expect(result).toContain('<p>Hello</p>');
    });

    it('should remove style tags', () => {
      const html = '<p>Hello</p><style>body { display: none; }</style>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('style');
    });

    it('should remove event handlers', () => {
      const html = '<button onclick="alert(1)">Click</button>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('onclick');
    });

    it('should remove javascript: from href', () => {
      const html = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('javascript:');
    });

    it('should keep allowed tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const result = sanitizeHtml(html);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should remove disallowed tags', () => {
      const html = '<p>Hello</p><iframe src="evil.com"></iframe>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('iframe');
    });

    it('should strip all HTML when stripHtml is true', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const result = sanitizeHtml(html, { stripHtml: true });
      expect(result).toBe('Hello World');
    });

    it('should handle non-string values', () => {
      expect(sanitizeHtml(null)).toBe('');
      expect(sanitizeHtml(undefined)).toBe('');
    });
  });

  // ============================================================================
  // Text Sanitization Tests
  // ============================================================================
  describe('sanitizeText', () => {
    it('should trim whitespace', () => {
      expect(sanitizeText('  hello  ')).toBe('hello');
    });

    it('should remove null bytes', () => {
      expect(sanitizeText('hello\0world')).toBe('helloworld');
    });

    it('should normalize whitespace', () => {
      expect(sanitizeText('hello    world')).toBe('hello world');
    });

    it('should preserve single line breaks', () => {
      expect(sanitizeText('hello\nworld')).toBe('hello\nworld');
    });

    it('should collapse multiple line breaks', () => {
      expect(sanitizeText('hello\n\n\n\nworld')).toBe('hello\n\nworld');
    });

    it('should truncate to max length', () => {
      const long = 'a'.repeat(100);
      expect(sanitizeText(long, 50).length).toBe(50);
    });

    it('should handle non-string values', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
      expect(sanitizeText(123)).toBe('');
    });
  });

  describe('sanitizeTitle', () => {
    it('should sanitize and escape title', () => {
      expect(sanitizeTitle('Hello <World>')).toBe('Hello &lt;World&gt;');
    });

    it('should truncate long titles', () => {
      const long = 'a'.repeat(300);
      expect(sanitizeTitle(long).length).toBeLessThanOrEqual(200);
    });
  });

  // ============================================================================
  // Card Config Validation Tests
  // ============================================================================
  describe('validateCardConfig', () => {
    it('should validate valid card config', () => {
      const config = {
        cardTitle: 'Test Card',
        sections: [
          { title: 'Section 1', type: 'info' }
        ]
      };

      const result = validateCardConfig(config);
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBeDefined();
    });

    it('should reject config without cardTitle', () => {
      const config = { sections: [] };
      const result = validateCardConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should reject config without sections array', () => {
      const config = { cardTitle: 'Test' };
      const result = validateCardConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should sanitize card title', () => {
      const config = {
        cardTitle: '<script>alert("xss")</script>Test',
        sections: []
      };

      const result = validateCardConfig(config);
      expect(result.valid).toBe(true);
      expect(result.sanitized?.['cardTitle']).not.toContain('<script>');
    });

    it('should sanitize sections', () => {
      const config = {
        cardTitle: 'Test',
        sections: [
          {
            title: '<b>Section</b>',
            type: 'info',
            fields: [
              { label: 'Field<script>', value: 'Value' }
            ]
          }
        ]
      };

      const result = validateCardConfig(config);
      expect(result.valid).toBe(true);
      const sections = result.sanitized?.['sections'] as unknown[];
      expect(sections.length).toBe(1);
    });

    it('should validate and sanitize actions', () => {
      const config = {
        cardTitle: 'Test',
        sections: [],
        actions: [
          { label: 'Click Me', type: 'website', url: 'https://example.com' },
          { label: 'Email', type: 'mail', email: { contact: { email: 'test@test.com', name: 'Test', role: 'Dev' } } }
        ]
      };

      const result = validateCardConfig(config);
      expect(result.valid).toBe(true);
      expect(result.sanitized?.['actions']).toBeDefined();
    });

    it('should reject non-object config', () => {
      expect(validateCardConfig(null).valid).toBe(false);
      expect(validateCardConfig('string').valid).toBe(false);
      expect(validateCardConfig(undefined).valid).toBe(false);
    });
  });
});

