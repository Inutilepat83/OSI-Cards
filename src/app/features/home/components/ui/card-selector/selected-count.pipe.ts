import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe to format selected count text
 * Pure pipe for better performance
 */
@Pipe({
  name: 'selectedCount',
  pure: true,
  standalone: true
})
export class SelectedCountPipe implements PipeTransform {
  transform(count: number): string {
    if (count === 0) {
      return '';
    }
    return `${count} card${count !== 1 ? 's' : ''} selected`;
  }
}
