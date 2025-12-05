/**
 * Shared Utilities Index
 * Minimal re-exports for backward compatibility
 */

// Sanitizer class
export class Sanitizer {
  static sanitize(value: any): any {
    if (typeof value === 'string') {
      return value.replace(/<script[^>]*>.*?<\/script>/gi, '');
    }
    return value;
  }
}
