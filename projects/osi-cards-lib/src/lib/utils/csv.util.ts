/**
 * CSV Export Utilities
 *
 * Utilities for CSV generation and export with proper escaping.
 *
 * @example
 * ```typescript
 * import { exportToCSV, arrayToCSV } from '@osi-cards/utils';
 *
 * const data = [
 *   { name: 'John', age: 30, city: 'New York' },
 *   { name: 'Jane', age: 25, city: 'London' }
 * ];
 *
 * exportToCSV(data, 'users.csv');
 * ```
 */

export interface CSVOptions {
  delimiter?: string;
  lineBreak?: string;
  includeHeaders?: boolean;
  quote?: string;
  escape?: string;
}

/**
 * Convert array of objects to CSV
 */
export function arrayToCSV(data: any[], options: CSVOptions = {}): string {
  const {
    delimiter = ',',
    lineBreak = '\n',
    includeHeaders = true,
    quote = '"',
    escape = '"',
  } = options;

  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows: string[] = [];

  // Add headers
  if (includeHeaders) {
    rows.push(headers.map((h) => escapeCSV(h, delimiter, quote, escape)).join(delimiter));
  }

  // Add data rows
  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      return escapeCSV(String(value ?? ''), delimiter, quote, escape);
    });
    rows.push(values.join(delimiter));
  });

  return rows.join(lineBreak);
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string, delimiter: string, quote: string, escape: string): string {
  if (value.includes(delimiter) || value.includes(quote) || value.includes('\n')) {
    return quote + value.replace(new RegExp(quote, 'g'), escape + quote) + quote;
  }
  return value;
}

/**
 * Export to CSV file
 */
export function exportToCSV(data: any[], filename: string, options?: CSVOptions): void {
  const csv = arrayToCSV(data, options);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV string
 */
export function parseCSV(csv: string, options: CSVOptions = {}): any[] {
  const { delimiter = ',', lineBreak = '\n' } = options;
  const lines = csv.split(lineBreak).filter((line) => line.trim());

  if (lines.length === 0) return [];

  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: any = {};

    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    data.push(row);
  }

  return data;
}
