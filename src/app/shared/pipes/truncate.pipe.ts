import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncate pipe for limiting text length
 * 
 * @example
 * ```html
 * {{ longText | truncate:50 }}
 * {{ longText | truncate:50:'...' }}
 * ```
 */
@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit: number = 100, trail: string = '...'): string {
    if (!value) {
      return '';
    }
    if (value.length <= limit) {
      return value;
    }
    return value.substring(0, limit) + trail;
  }
}


