import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Safe HTML pipe for sanitizing HTML content
 *
 * Prevents XSS attacks by sanitizing HTML before rendering using Angular's DomSanitizer.
 * This pipe should be used whenever rendering user-provided HTML content.
 *
 * @example
 * ```html
 * <div [innerHTML]="userContent | safeHtml"></div>
 * ```
 *
 * @note The pipe uses SecurityContext.HTML (value 1) which allows HTML but sanitizes
 * dangerous elements and attributes like script tags, event handlers, etc.
 */
@Pipe({
  name: 'safeHtml',
  standalone: true,
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  /**
   * Transform HTML string to SafeHtml
   * @param value - The HTML string to sanitize
   * @returns Sanitized SafeHtml object
   */
  transform(value: string): SafeHtml {
    if (!value) {
      return '';
    }
    // SecurityContext.HTML = 1 - allows HTML but sanitizes dangerous content
    return this.sanitizer.sanitize(1, value) || '';
  }
}
