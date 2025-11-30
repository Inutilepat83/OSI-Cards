import { isValidUrl, isAllowedProtocol, sanitizeUrl, getDomain, isExternalUrl } from './url.util';

describe('URL Utilities', () => {
  describe('isValidUrl', () => {
    it('should return true for valid http URL', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('should return true for valid https URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should return true for valid mailto URL', () => {
      expect(isValidUrl('mailto:test@example.com')).toBe(true);
    });

    it('should return false for invalid URL', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });

    it('should return false for URL without protocol', () => {
      expect(isValidUrl('example.com')).toBe(false);
    });
  });

  describe('isAllowedProtocol', () => {
    it('should return true for http protocol', () => {
      expect(isAllowedProtocol('http://example.com')).toBe(true);
    });

    it('should return true for https protocol', () => {
      expect(isAllowedProtocol('https://example.com')).toBe(true);
    });

    it('should return true for mailto protocol', () => {
      expect(isAllowedProtocol('mailto:test@example.com')).toBe(true);
    });

    it('should return false for javascript protocol', () => {
      expect(isAllowedProtocol('javascript:alert(1)')).toBe(false);
    });

    it('should return false for file protocol', () => {
      expect(isAllowedProtocol('file:///path/to/file')).toBe(false);
    });

    it('should respect custom allowed protocols', () => {
      expect(isAllowedProtocol('ftp://example.com', ['ftp:', 'http:'])).toBe(true);
      expect(isAllowedProtocol('https://example.com', ['ftp:', 'http:'])).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should return null for empty string', () => {
      expect(sanitizeUrl('')).toBeNull();
    });

    it('should return null for invalid URL', () => {
      expect(sanitizeUrl('not-a-url')).toBeNull();
    });

    it('should return URL for valid http URL', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should return URL for valid https URL', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should return URL for valid mailto URL', () => {
      expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    });

    it('should return null for javascript protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('should respect custom allowed protocols', () => {
      expect(sanitizeUrl('ftp://example.com', ['ftp:', 'http:'])).toBe('ftp://example.com');
      expect(sanitizeUrl('https://example.com', ['ftp:', 'http:'])).toBeNull();
    });
  });

  describe('getDomain', () => {
    it('should extract domain from http URL', () => {
      expect(getDomain('http://example.com/path')).toBe('example.com');
    });

    it('should extract domain from https URL', () => {
      expect(getDomain('https://example.com/path')).toBe('example.com');
    });

    it('should extract domain with subdomain', () => {
      expect(getDomain('https://www.example.com')).toBe('www.example.com');
    });

    it('should return null for invalid URL', () => {
      expect(getDomain('not-a-url')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getDomain('')).toBeNull();
    });
  });

  describe('isExternalUrl', () => {
    it('should return true for different domain', () => {
      expect(isExternalUrl('https://example.com', 'mysite.com')).toBe(true);
    });

    it('should return false for same domain', () => {
      expect(isExternalUrl('https://mysite.com/page', 'mysite.com')).toBe(false);
    });

    it('should return false for subdomain of current domain', () => {
      expect(isExternalUrl('https://sub.mysite.com', 'mysite.com')).toBe(false);
    });

    it('should return false for invalid URL', () => {
      expect(isExternalUrl('not-a-url', 'mysite.com')).toBe(false);
    });

    it('should return false for empty URL', () => {
      expect(isExternalUrl('', 'mysite.com')).toBe(false);
    });
  });
});









