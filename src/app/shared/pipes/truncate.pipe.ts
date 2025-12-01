import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncate pipe for limiting text length
 *
 * Truncates text to a specified length and appends a trail string. Useful for
 * displaying previews of long text content in cards and lists.
 *
 * @example
 * ```html
 * {{ longText | truncate:50 }}
 * {{ longText | truncate:50:'...' }}
 * ```
 */
@Pipe({
  name: 'truncate',
  standalone: true,
})
export class TruncatePipe implements PipeTransform {
  /**
   * Transform text by truncating to specified length
   *
   * @param value - The text to truncate (can be null or undefined)
   * @param limit - Maximum length before truncation (default: 100)
   * @param trail - String to append when truncated (default: '...')
   * @returns Truncated text with trail, or original text if within limit
   */
  transform(value: string | null | undefined, limit = 100, trail = '...'): string {
    if (!value) {
      return '';
    }
    if (value.length <= limit) {
      return value;
    }
    return value.substring(0, limit) + trail;
  }
}
