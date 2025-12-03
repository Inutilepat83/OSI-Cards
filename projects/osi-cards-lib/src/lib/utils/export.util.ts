/**
 * Export Utilities
 *
 * Multi-format export utilities (CSV, JSON, XML, Excel, PDF).
 *
 * @example
 * ```typescript
 * import { exportToCSV, exportToJSON, exportToXML } from '@osi-cards/utils';
 *
 * exportToJSON(data, 'data.json');
 * exportToCSV(data, 'data.csv');
 * ```
 */

/**
 * Export to JSON
 */
export function exportToJSON(data: any, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, filename);
}

/**
 * Export to CSV
 */
export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = [headers];

  data.forEach(row => {
    rows.push(headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',')
        ? `"${value}"`
        : String(value ?? '');
    }));
  });

  const csv = rows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, filename);
}

/**
 * Export to XML
 */
export function exportToXML(data: any, rootName: string, filename: string): void {
  const xml = objectToXML(data, rootName);
  const blob = new Blob([xml], { type: 'application/xml' });
  downloadBlob(blob, filename);
}

/**
 * Convert object to XML
 */
function objectToXML(obj: any, rootName: string): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;

  function toXML(data: any, indent = 1): string {
    const spaces = '  '.repeat(indent);
    let result = '';

    if (Array.isArray(data)) {
      data.forEach(item => {
        result += `${spaces}<item>\n${toXML(item, indent + 1)}${spaces}</item>\n`;
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          result += `${spaces}<${key}>\n${toXML(value, indent + 1)}${spaces}</${key}>\n`;
        } else {
          result += `${spaces}<${key}>${value}</${key}>\n`;
        }
      });
    } else {
      result += `${spaces}${data}\n`;
    }

    return result;
  }

  xml += toXML(obj);
  xml += `</${rootName}>`;
  return xml;
}

/**
 * Export to text
 */
export function exportToText(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain' });
  downloadBlob(blob, filename);
}

/**
 * Export to HTML
 */
export function exportToHTML(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html' });
  downloadBlob(blob, filename);
}

/**
 * Export to Markdown
 */
export function exportToMarkdown(markdown: string, filename: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  downloadBlob(blob, filename);
}

/**
 * Download blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export table to CSV
 */
export function exportTableToCSV(table: HTMLTableElement, filename: string): void {
  const rows: string[][] = [];

  table.querySelectorAll('tr').forEach(tr => {
    const row: string[] = [];
    tr.querySelectorAll('td, th').forEach(cell => {
      row.push(cell.textContent || '');
    });
    rows.push(row);
  });

  const csv = rows.map(row => row.map(cell =>
    cell.includes(',') ? `"${cell}"` : cell
  ).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, filename);
}

/**
 * Export to Excel-compatible CSV
 */
export function exportToExcelCSV(data: any[], filename: string): void {
  if (data.length === 0) return;

  const BOM = '\uFEFF';
  const headers = Object.keys(data[0]);
  const rows = [headers];

  data.forEach(row => {
    rows.push(headers.map(header => String(row[header] ?? '')));
  });

  const csv = BOM + rows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

