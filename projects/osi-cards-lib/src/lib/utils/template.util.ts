/**
 * Template Utilities
 *
 * String templating and interpolation utilities.
 *
 * @example
 * ```typescript
 * import { template, compile } from '@osi-cards/utils';
 *
 * const result = template('Hello {{name}}!', { name: 'John' });
 * const fn = compile('Hello {{name}}!');
 * ```
 */

export interface TemplateOptions {
  delimiter?: [string, string];
  escape?: boolean;
}

/**
 * Simple template interpolation
 */
export function template(str: string, data: Record<string, any>, options: TemplateOptions = {}): string {
  const { delimiter = ['{{', '}}'], escape = false } = options;
  const [start, end] = delimiter;

  const regex = new RegExp(`${escapeRegex(start)}\\s*(\\w+)\\s*${escapeRegex(end)}`, 'g');

  return str.replace(regex, (_, key) => {
    const value = data[key];
    if (value === undefined) return '';
    const str = String(value);
    return escape ? escapeHTML(str) : str;
  });
}

/**
 * Compile template to function
 */
export function compile(str: string, options: TemplateOptions = {}): (data: Record<string, any>) => string {
  return (data) => template(str, data, options);
}

/**
 * Advanced template with expressions
 */
export function advancedTemplate(str: string, data: Record<string, any>): string {
  return str.replace(/\{\{(.+?)\}\}/g, (_, expr) => {
    try {
      const func = new Function(...Object.keys(data), `return ${expr}`);
      return String(func(...Object.values(data)));
    } catch {
      return '';
    }
  });
}

/**
 * Escape regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escape HTML
 */
function escapeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Tagged template literal helper
 */
export function html(strings: TemplateStringsArray, ...values: any[]): string {
  return strings.reduce((result, str, i) => {
    return result + str + (values[i] !== undefined ? values[i] : '');
  }, '');
}

/**
 * SQL tagged template (for safe queries)
 */
export function sql(strings: TemplateStringsArray, ...values: any[]): { text: string; values: any[] } {
  const text = strings.reduce((result, str, i) => {
    return result + str + (i < values.length ? `$${i + 1}` : '');
  }, '');
  return { text, values };
}

