/**
 * Data Transformation Pipes
 *
 * Collection of useful Angular pipes for data transformation,
 * formatting, and display in templates.
 *
 * Features:
 * - Data formatting pipes
 * - Array manipulation pipes
 * - Object transformation pipes
 * - Date/number formatting
 * - Safe accessors
 *
 * @example
 * ```html
 * <div>{{ value | safe: 'html' }}</div>
 * <div>{{ items | filter: filterFn }}</div>
 * <div>{{ obj | keys }}</div>
 * <div>{{ text | truncate: 100 }}</div>
 * ```
 */

import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeScript, SafeStyle, SafeUrl } from '@angular/platform-browser';

/**
 * Safe pipe for bypassing sanitization
 *
 * @example
 * ```html
 * <div [innerHTML]="htmlContent | safe: 'html'"></div>
 * <img [src]="imageUrl | safe: 'url'">
 * ```
 */
@Pipe({
  name: 'safe',
  standalone: true
})
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(
    value: string,
    type: 'html' | 'style' | 'script' | 'url' | 'resourceUrl'
  ): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {
    switch (type) {
      case 'html':
        return this.sanitizer.bypassSecurityTrustHtml(value);
      case 'style':
        return this.sanitizer.bypassSecurityTrustStyle(value);
      case 'script':
        return this.sanitizer.bypassSecurityTrustScript(value);
      case 'url':
        return this.sanitizer.bypassSecurityTrustUrl(value);
      case 'resourceUrl':
        return this.sanitizer.bypassSecurityTrustResourceUrl(value);
      default:
        throw new Error(`Invalid safe type: ${type}`);
    }
  }
}

/**
 * Filter array pipe
 *
 * @example
 * ```html
 * <div *ngFor="let item of items | filter: isActive">
 *   {{ item.name }}
 * </div>
 * ```
 */
@Pipe({
  name: 'filter',
  standalone: true,
  pure: false
})
export class FilterPipe implements PipeTransform {
  transform<T>(items: T[] | null | undefined, predicate: (item: T) => boolean): T[] {
    if (!items) return [];
    return items.filter(predicate);
  }
}

/**
 * Map array pipe
 *
 * @example
 * ```html
 * <div *ngFor="let name of users | map: getName">
 *   {{ name }}
 * </div>
 * ```
 */
@Pipe({
  name: 'map',
  standalone: true,
  pure: false
})
export class MapPipe implements PipeTransform {
  transform<T, R>(items: T[] | null | undefined, mapper: (item: T) => R): R[] {
    if (!items) return [];
    return items.map(mapper);
  }
}

/**
 * Get object keys pipe
 *
 * @example
 * ```html
 * <div *ngFor="let key of obj | keys">
 *   {{ key }}: {{ obj[key] }}
 * </div>
 * ```
 */
@Pipe({
  name: 'keys',
  standalone: true
})
export class KeysPipe implements PipeTransform {
  transform(obj: any): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }
}

/**
 * Get object values pipe
 *
 * @example
 * ```html
 * <div *ngFor="let value of obj | values">
 *   {{ value }}
 * </div>
 * ```
 */
@Pipe({
  name: 'values',
  standalone: true
})
export class ValuesPipe implements PipeTransform {
  transform(obj: any): any[] {
    if (!obj) return [];
    return Object.values(obj);
  }
}

/**
 * Get object entries pipe
 *
 * @example
 * ```html
 * <div *ngFor="let entry of obj | entries">
 *   {{ entry[0] }}: {{ entry[1] }}
 * </div>
 * ```
 */
@Pipe({
  name: 'entries',
  standalone: true
})
export class EntriesPipe implements PipeTransform {
  transform(obj: any): Array<[string, any]> {
    if (!obj) return [];
    return Object.entries(obj);
  }
}

/**
 * Truncate text pipe
 *
 * @example
 * ```html
 * <p>{{ longText | truncate: 100 }}</p>
 * <p>{{ text | truncate: 50: '...' }}</p>
 * ```
 */
@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit: number, suffix = '...'): string {
    if (!value) return '';
    if (value.length <= limit) return value;
    return value.substring(0, limit) + suffix;
  }
}

/**
 * Default value pipe
 *
 * @example
 * ```html
 * <div>{{ value | default: 'N/A' }}</div>
 * ```
 */
@Pipe({
  name: 'default',
  standalone: true
})
export class DefaultPipe implements PipeTransform {
  transform<T>(value: T | null | undefined, defaultValue: T): T {
    return value ?? defaultValue;
  }
}

/**
 * Join array pipe
 *
 * @example
 * ```html
 * <div>{{ tags | join: ', ' }}</div>
 * ```
 */
@Pipe({
  name: 'join',
  standalone: true
})
export class JoinPipe implements PipeTransform {
  transform(items: any[] | null | undefined, separator = ', '): string {
    if (!items) return '';
    return items.join(separator);
  }
}

/**
 * Reverse array pipe
 *
 * @example
 * ```html
 * <div *ngFor="let item of items | reverse">
 *   {{ item }}
 * </div>
 * ```
 */
@Pipe({
  name: 'reverse',
  standalone: true
})
export class ReversePipe implements PipeTransform {
  transform<T>(items: T[] | null | undefined): T[] {
    if (!items) return [];
    return [...items].reverse();
  }
}

/**
 * Sort array pipe
 *
 * @example
 * ```html
 * <div *ngFor="let user of users | sort: 'name'">
 *   {{ user.name }}
 * </div>
 * ```
 */
@Pipe({
  name: 'sort',
  standalone: true,
  pure: false
})
export class SortPipe implements PipeTransform {
  transform<T>(items: T[] | null | undefined, key?: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    if (!items) return [];

    return [...items].sort((a, b) => {
      const aVal = key ? a[key] : a;
      const bVal = key ? b[key] : b;

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }
}

/**
 * Group by pipe
 *
 * @example
 * ```html
 * @for (group of items | groupBy: 'category'; track group.key) {
 *   <h3>{{ group.key }}</h3>
 *   <div *ngFor="let item of group.items">{{ item.name }}</div>
 * }
 * ```
 */
@Pipe({
  name: 'groupBy',
  standalone: true,
  pure: false
})
export class GroupByPipe implements PipeTransform {
  transform<T>(items: T[] | null | undefined, key: keyof T): Array<{ key: any; items: T[] }> {
    if (!items) return [];

    const map = new Map<any, T[]>();

    items.forEach(item => {
      const groupKey = item[key];
      const group = map.get(groupKey) || [];
      group.push(item);
      map.set(groupKey, group);
    });

    return Array.from(map.entries()).map(([k, items]) => ({ key: k, items }));
  }
}

/**
 * Unique array pipe
 *
 * @example
 * ```html
 * <div *ngFor="let item of items | unique">
 *   {{ item }}
 * </div>
 * ```
 */
@Pipe({
  name: 'unique',
  standalone: true
})
export class UniquePipe implements PipeTransform {
  transform<T>(items: T[] | null | undefined, key?: keyof T): T[] {
    if (!items) return [];

    if (!key) {
      return Array.from(new Set(items));
    }

    const seen = new Set();
    return items.filter(item => {
      const k = item[key];
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
}

/**
 * Chunk array pipe
 *
 * @example
 * ```html
 * @for (chunk of items | chunk: 3; track $index) {
 *   <div class="row">
 *     <div *ngFor="let item of chunk">{{ item }}</div>
 *   </div>
 * }
 * ```
 */
@Pipe({
  name: 'chunk',
  standalone: true
})
export class ChunkPipe implements PipeTransform {
  transform<T>(items: T[] | null | undefined, size: number): T[][] {
    if (!items) return [];

    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * File size pipe
 *
 * @example
 * ```html
 * <div>Size: {{ bytes | fileSize }}</div>
 * <!-- "Size: 1.5 MB" -->
 * ```
 */
@Pipe({
  name: 'fileSize',
  standalone: true
})
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | null | undefined, decimals = 2): string {
    if (bytes === null || bytes === undefined) return '0 Bytes';
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }
}

/**
 * Relative time pipe
 *
 * @example
 * ```html
 * <div>{{ timestamp | timeAgo }}</div>
 * <!-- "2 hours ago" -->
 * ```
 */
@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string | number | null | undefined): string {
    if (!value) return '';

    const date = new Date(value);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
    return `${Math.floor(seconds / 31536000)} years ago`;
  }
}

/**
 * Highlight pipe for search results
 *
 * @example
 * ```html
 * <div [innerHTML]="text | highlight: searchQuery | safe: 'html'"></div>
 * ```
 */
@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipe implements PipeTransform {
  transform(text: string | null | undefined, search: string): string {
    if (!text || !search) return text || '';

    const regex = new RegExp(`(${this.escapeRegex(search)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * Pluralize pipe
 *
 * @example
 * ```html
 * <div>{{ count }} {{ 'item' | pluralize: count }}</div>
 * <!-- "5 items" -->
 * ```
 */
@Pipe({
  name: 'pluralize',
  standalone: true
})
export class PluralizePipe implements PipeTransform {
  transform(
    singular: string,
    count: number,
    plural?: string
  ): string {
    if (count === 1) return singular;
    return plural || singular + 's';
  }
}

/**
 * Ordinal pipe (1st, 2nd, 3rd, etc.)
 *
 * @example
 * ```html
 * <div>{{ position | ordinal }}</div>
 * <!-- "1st", "2nd", "3rd", "4th" -->
 * ```
 */
@Pipe({
  name: 'ordinal',
  standalone: true
})
export class OrdinalPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';

    const j = value % 10;
    const k = value % 100;

    if (j === 1 && k !== 11) return value + 'st';
    if (j === 2 && k !== 12) return value + 'nd';
    if (j === 3 && k !== 13) return value + 'rd';
    return value + 'th';
  }
}

/**
 * Array of common pipes for importing
 */
export const DATA_PIPES = [
  SafePipe,
  FilterPipe,
  MapPipe,
  KeysPipe,
  ValuesPipe,
  EntriesPipe,
  TruncatePipe,
  DefaultPipe,
  JoinPipe,
  ReversePipe,
  SortPipe,
  GroupByPipe,
  UniquePipe,
  ChunkPipe,
  FileSizePipe,
  TimeAgoPipe,
  HighlightPipe,
  PluralizePipe,
  OrdinalPipe,
] as const;

