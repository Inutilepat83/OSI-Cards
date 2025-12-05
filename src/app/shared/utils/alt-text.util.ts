/**
 * Alt Text Utility
 * Stub for backward compatibility
 */

export function generateAltText(src: string, context?: any): string {
  console.warn('generateAltText: Implement in your app');
  return context?.altText || 'Image';
}

export function validateAltText(altText: string): boolean {
  return Boolean(altText && altText.trim().length > 0);
}
