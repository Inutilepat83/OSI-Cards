/**
 * Alt text utilities
 * Ensures all images have descriptive alt text
 */

/**
 * Generate alt text for an image based on context
 */
export function generateAltText(
  imageUrl: string,
  context?: {
    title?: string;
    description?: string;
    sectionTitle?: string;
  }
): string {
  // If context provides title, use it
  if (context?.title) {
    return context.title;
  }

  // If context provides description, use it
  if (context?.description) {
    return context.description;
  }

  // Try to extract meaningful name from URL
  const urlParts = imageUrl.split('/');
  const filename = urlParts[urlParts.length - 1];
  const nameWithoutExt = filename.split('.')[0];

  // Clean up filename (remove dashes, underscores, etc.)
  const cleanName = nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  // If we have section context, include it
  if (context?.sectionTitle) {
    return `${context.sectionTitle} - ${cleanName}`;
  }

  return cleanName || 'Image';
}

/**
 * Validate alt text
 */
export function validateAltText(altText: string | null | undefined): boolean {
  if (!altText || altText.trim() === '') {
    return false;
  }

  // Alt text should not be too long (recommended max 125 characters)
  if (altText.length > 125) {
    return false;
  }

  // Alt text should not be just the filename
  if (altText.includes('.jpg') || altText.includes('.png') || altText.includes('.svg')) {
    return false;
  }

  return true;
}

/**
 * Get default alt text for missing alt attributes
 */
export function getDefaultAltText(imageUrl: string, fallback: string = 'Image'): string {
  const urlParts = imageUrl.split('/');
  const filename = urlParts[urlParts.length - 1];
  const nameWithoutExt = filename.split('.')[0];

  if (nameWithoutExt && nameWithoutExt !== filename) {
    return nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return fallback;
}


