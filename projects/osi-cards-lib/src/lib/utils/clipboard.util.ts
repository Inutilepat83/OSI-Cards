/**
 * Clipboard Utilities
 *
 * Utilities for clipboard operations with fallback support
 * for older browsers and error handling.
 *
 * @example
 * ```typescript
 * import { copyToClipboard, readFromClipboard } from '@osi-cards/utils';
 *
 * await copyToClipboard('Hello, World!');
 * const text = await readFromClipboard();
 * ```
 */

/**
 * Copy text to clipboard
 *
 * @param text - Text to copy
 * @returns Promise that resolves when copied
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }

  // Fallback for older browsers
  return copyToClipboardFallback(text);
}

/**
 * Read text from clipboard
 *
 * @returns Promise with clipboard text
 */
export async function readFromClipboard(): Promise<string> {
  if (navigator.clipboard && navigator.clipboard.readText) {
    return navigator.clipboard.readText();
  }

  throw new Error('Clipboard API not available');
}

/**
 * Copy HTML to clipboard
 *
 * @param html - HTML string
 * @param plainText - Plain text fallback
 */
export async function copyHTMLToClipboard(html: string, plainText: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.write) {
    const blob = new Blob([html], { type: 'text/html' });
    const data = [new ClipboardItem({ 'text/html': blob })];
    return navigator.clipboard.write(data);
  }

  return copyToClipboard(plainText);
}

/**
 * Copy image to clipboard
 *
 * @param imageBlob - Image blob
 */
export async function copyImageToClipboard(imageBlob: Blob): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.write) {
    const data = [new ClipboardItem({ [imageBlob.type]: imageBlob })];
    return navigator.clipboard.write(data);
  }

  throw new Error('Clipboard API not available for images');
}

/**
 * Fallback copy method
 */
function copyToClipboardFallback(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      resolve();
    } catch (error) {
      document.body.removeChild(textarea);
      reject(error);
    }
  });
}

/**
 * Copy element content to clipboard
 *
 * @param element - Element to copy
 * @returns Promise that resolves when copied
 */
export async function copyElementContent(element: HTMLElement): Promise<void> {
  const text = element.textContent || '';
  return copyToClipboard(text);
}

/**
 * Copy with notification
 *
 * @param text - Text to copy
 * @param onSuccess - Success callback
 * @param onError - Error callback
 */
export async function copyWithFeedback(
  text: string,
  onSuccess?: () => void,
  onError?: (error: any) => void
): Promise<void> {
  try {
    await copyToClipboard(text);
    if (onSuccess) onSuccess();
  } catch (error) {
    if (onError) onError(error);
    throw error;
  }
}

/**
 * Check if clipboard API is available
 */
export function isClipboardAvailable(): boolean {
  return !!(navigator.clipboard && navigator.clipboard.writeText);
}

