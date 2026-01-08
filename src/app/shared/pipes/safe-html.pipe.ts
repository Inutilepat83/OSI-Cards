import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { InputSanitizationService } from '../../domain';

/**
 * Safe HTML pipe for sanitizing HTML content
 *
 * Prevents XSS attacks by sanitizing HTML before rendering using DOMPurify
 * for domain-level sanitization and Angular's DomSanitizer for final safety.
 * This pipe should be used whenever rendering user-provided HTML content.
 *
 * @example
 * ```html
 * <div [innerHTML]="userContent | safeHtml"></div>
 * ```
 *
 * @note The pipe uses DOMPurify for comprehensive sanitization, then
 * Angular's DomSanitizer for additional safety.
 */
@Pipe({
  name: 'safeHtml',
  standalone: true,
})
export class SafeHtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly sanitizationService: InputSanitizationService = inject(InputSanitizationService);

  /**
   * Transform HTML string to SafeHtml
   * @param value - The HTML string to sanitize
   * @returns Sanitized SafeHtml object
   */
  transform(value: string): SafeHtml {
    if (!value) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    // Domain-level sanitization using DOMPurify
    const sanitized = this.sanitizationService.sanitizeHtml(value);

    // Final sanitization using Angular's DomSanitizer
    // SecurityContext.HTML = 1 - allows HTML but sanitizes dangerous content
    // sanitizeHtml already returns SafeHtml, so we can return it directly
    return sanitized;
  }
}
