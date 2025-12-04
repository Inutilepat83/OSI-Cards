/**
 * Utility Pipes Collection
 *
 * A collection of 15 utility pipes for common transformations.
 *
 * 1. Capitalize
 * 2. Slugify
 * 3. Abbreviate
 * 4. ByteFormat
 * 5. Ordinal
 * 6. PhoneMask
 * 7. CreditCardMask
 * 8. InitialsPipe
 * 9. RangePipe
 * 10. RepeatPipe
 * 11. ReversePipe
 * 12. ShufflePipe
 * 13. ChunkPipe
 * 14. PluckPipe
 * 15. DiffPipe
 */

import { Pipe, PipeTransform } from '@angular/core';

/** 1. Capitalize Pipe */
@Pipe({ name: 'capitalize', standalone: true })
export class CapitalizePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}

/** 2. Slugify Pipe */
@Pipe({ name: 'slugify', standalone: true })
export class SlugifyPipe implements PipeTransform {
  transform(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

/** 3. Abbreviate Pipe */
@Pipe({ name: 'abbreviate', standalone: true })
export class AbbreviatePipe implements PipeTransform {
  transform(value: string, maxLength: number, suffix = '...'): string {
    if (!value || value.length <= maxLength) return value;
    return value.slice(0, maxLength - suffix.length) + suffix;
  }
}

/** 4. Byte Format Pipe */
@Pipe({ name: 'byteFormat', standalone: true })
export class ByteFormatPipe implements PipeTransform {
  transform(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }
}

/** 5. Ordinal Pipe */
@Pipe({ name: 'ordinal', standalone: true })
export class OrdinalPipe implements PipeTransform {
  transform(value: number): string {
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = value % 100;
    return value + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
  }
}

/** 6. Phone Mask Pipe */
@Pipe({ name: 'phoneMask', standalone: true })
export class PhoneMaskPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    const cleaned = ('' + value).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    return match ? '(' + match[1] + ') ' + match[2] + '-' + match[3] : value;
  }
}

/** 7. Credit Card Mask Pipe */
@Pipe({ name: 'creditCardMask', standalone: true })
export class CreditCardMaskPipe implements PipeTransform {
  transform(value: string, showLast = 4): string {
    if (!value) return '';
    const cleaned = value.replace(/\s/g, '');
    return '*'.repeat(cleaned.length - showLast) + cleaned.slice(-showLast);
  }
}

/** 8. Initials Pipe */
@Pipe({ name: 'initials', standalone: true })
export class InitialsPipe implements PipeTransform {
  transform(value: string): string {
    return value
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  }
}

/** 9. Range Pipe */
@Pipe({ name: 'range', standalone: true })
export class RangePipe implements PipeTransform {
  transform(start: number, end: number, step = 1): number[] {
    const result: number[] = [];
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
    return result;
  }
}

/** 10. Repeat Pipe */
@Pipe({ name: 'repeat', standalone: true })
export class RepeatPipe implements PipeTransform {
  transform(value: any, times: number): any[] {
    return Array(times).fill(value);
  }
}

/** 11. Reverse Pipe */
@Pipe({ name: 'reverse', standalone: true })
export class ReversePipe implements PipeTransform {
  transform(value: any[]): any[] {
    return [...value].reverse();
  }
}

/** 12. Shuffle Pipe */
@Pipe({ name: 'shuffle', standalone: true })
export class ShufflePipe implements PipeTransform {
  transform(value: any[]): any[] {
    const result = [...value];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/** 13. Chunk Pipe */
@Pipe({ name: 'chunk', standalone: true })
export class ChunkPipe implements PipeTransform {
  transform(value: any[], size: number): any[][] {
    const chunks: any[][] = [];
    for (let i = 0; i < value.length; i += size) {
      chunks.push(value.slice(i, i + size));
    }
    return chunks;
  }
}

/** 14. Pluck Pipe */
@Pipe({ name: 'pluck', standalone: true })
export class PluckPipe implements PipeTransform {
  transform(value: any[], key: string): any[] {
    return value.map((item) => item[key]);
  }
}

/** 15. Diff Pipe */
@Pipe({ name: 'diff', standalone: true })
export class DiffPipe implements PipeTransform {
  transform(value: any[], compare: any[]): any[] {
    return value.filter((item) => !compare.includes(item));
  }
}

// Export all pipes as an array
export const UTILITY_PIPES = [
  CapitalizePipe,
  SlugifyPipe,
  AbbreviatePipe,
  ByteFormatPipe,
  OrdinalPipe,
  PhoneMaskPipe,
  CreditCardMaskPipe,
  InitialsPipe,
  RangePipe,
  RepeatPipe,
  ReversePipe,
  ShufflePipe,
  ChunkPipe,
  PluckPipe,
  DiffPipe,
];
