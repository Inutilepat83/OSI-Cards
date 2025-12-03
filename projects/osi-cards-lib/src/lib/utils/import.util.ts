/**
 * Import Utilities
 *
 * Multi-format import utilities (CSV, JSON, XML, Excel).
 *
 * @example
 * ```typescript
 * import { importFromCSV, importFromJSON } from '@osi-cards/utils';
 *
 * const data = await importFromCSV(file);
 * const json = await importFromJSON(file);
 * ```
 */

/**
 * Import from CSV file
 */
export async function importFromCSV(file: File): Promise<any[]> {
  const text = await file.text();
  return parseCSV(text);
}

/**
 * Parse CSV text
 */
export function parseCSV(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    data.push(row);
  }

  return data;
}

/**
 * Parse CSV line
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Import from JSON file
 */
export async function importFromJSON<T = any>(file: File): Promise<T> {
  const text = await file.text();
  return JSON.parse(text);
}

/**
 * Import from XML file
 */
export async function importFromXML(file: File): Promise<Document> {
  const text = await file.text();
  const parser = new DOMParser();
  return parser.parseFromString(text, 'text/xml');
}

/**
 * Import from text file
 */
export async function importFromText(file: File): Promise<string> {
  return file.text();
}

/**
 * Import from file with auto-detection
 */
export async function importFromFile(file: File): Promise<any> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'json':
      return importFromJSON(file);
    case 'csv':
      return importFromCSV(file);
    case 'xml':
      return importFromXML(file);
    case 'txt':
      return importFromText(file);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

/**
 * Parse Excel-like CSV (with BOM)
 */
export async function importFromExcelCSV(file: File): Promise<any[]> {
  let text = await file.text();

  // Remove BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  return parseCSV(text);
}

/**
 * Batch import multiple files
 */
export async function batchImport(files: File[]): Promise<any[]> {
  const results = await Promise.all(
    files.map(file => importFromFile(file))
  );
  return results;
}

