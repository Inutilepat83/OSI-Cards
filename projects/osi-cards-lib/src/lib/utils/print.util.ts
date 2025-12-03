/**
 * Print Utilities
 *
 * Utilities for printing web content with custom styling.
 *
 * @example
 * ```typescript
 * import { printElement, printHTML } from '@osi-cards/utils';
 *
 * printElement(document.getElementById('card'));
 * printHTML('<h1>Hello World</h1>');
 * ```
 */

export interface PrintOptions {
  styles?: string;
  title?: string;
  delay?: number;
  removeAfterPrint?: boolean;
}

/**
 * Print element
 */
export function printElement(element: HTMLElement, options: PrintOptions = {}): void {
  const { styles = '', title = document.title, delay = 100 } = options;

  const content = element.outerHTML;
  printHTML(content, { styles, title, delay });
}

/**
 * Print HTML content
 */
export function printHTML(html: string, options: PrintOptions = {}): void {
  const { styles = '', title = document.title, delay = 100, removeAfterPrint = true } = options;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          ${styles}
          @media print {
            body { margin: 0; padding: 20px; }
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.print();

    if (removeAfterPrint) {
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 100);
    }
  }, delay);
}

/**
 * Print current page
 */
export function printPage(): void {
  window.print();
}

/**
 * Create print-friendly version
 */
export function createPrintFriendly(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove interactive elements
  clone.querySelectorAll('button, input, select, textarea').forEach(el => el.remove());

  // Remove navigation
  clone.querySelectorAll('nav, .nav, .navigation').forEach(el => el.remove());

  // Expand collapsed sections
  clone.querySelectorAll('[hidden]').forEach(el => {
    el.removeAttribute('hidden');
  });

  return clone;
}

