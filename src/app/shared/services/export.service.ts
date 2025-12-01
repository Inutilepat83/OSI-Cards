import { inject, Injectable } from '@angular/core';
import { AICardConfig } from '../../models';
import { removeAllIds } from '../utils/card-utils';
import { LoggingService } from '../../core/services/logging.service';

/**
 * PDF export options
 */
export interface PdfExportOptions {
  format?: 'a4' | 'letter' | [number, number]; // Page size
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  title?: string;
  includeMetadata?: boolean;
}

/**
 * Image export options
 */
export interface ImageExportOptions {
  format?: 'png' | 'svg' | 'jpeg';
  quality?: number; // 0-1 for JPEG
  scale?: number; // Scale factor for higher resolution
  backgroundColor?: string;
}

/**
 * Export service for exporting cards in various formats
 *
 * Provides comprehensive export functionality for OSI Cards, supporting multiple
 * formats including JSON, PDF, PNG, SVG, JPEG, CSV, and text. Handles both single
 * card and batch exports with configurable options.
 *
 * Features:
 * - Multiple export formats (JSON, PDF, PNG, SVG, JPEG, CSV, text)
 * - Batch export support for multiple cards
 * - Clipboard integration for quick sharing
 * - Optional dependency support (jsPDF, html2canvas)
 * - High-resolution exports with configurable scaling
 * - Native browser API support (no dependencies for PNG export)
 *
 * @example
 * ```typescript
 * const exportService = inject(ExportService);
 *
 * // Export as JSON
 * exportService.exportAsJson(card, 'my-card.json');
 *
 * // Export as PNG (native, no dependencies)
 * await exportService.exportAsPngNative(element, 'card.png', 2);
 *
 * // Export as PDF (requires jsPDF)
 * await exportService.exportAsPdf(card, element, {
 *   format: 'a4',
 *   orientation: 'portrait'
 * }, 'card.pdf');
 *
 * // Copy to clipboard
 * await exportService.copyToClipboard(card);
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ExportService {
  private readonly logger = inject(LoggingService);

  /**
   * Export card as JSON
   */
  exportAsJson(card: AICardConfig, filename?: string): void {
    const cardWithoutIds = removeAllIds(card);
    const json = JSON.stringify(cardWithoutIds, null, 2);
    this.downloadFile(json, filename || `${card.cardTitle || 'card'}.json`, 'application/json');
  }

  /**
   * Export card as formatted JSON (pretty printed)
   */
  exportAsFormattedJson(card: AICardConfig, filename?: string): void {
    this.exportAsJson(card, filename);
  }

  /**
   * Export card as text
   */
  exportAsText(card: AICardConfig, filename?: string): void {
    let text = `Card: ${card.cardTitle}\n\n`;

    card.sections?.forEach((section, index) => {
      text += `Section ${index + 1}: ${section.title}\n`;
      if (section.description) {
        text += `  ${section.description}\n`;
      }

      section.fields?.forEach((field) => {
        text += `  - ${field.label || field.title || 'Field'}: ${field.value || ''}\n`;
      });

      section.items?.forEach((item) => {
        text += `  - ${item.title}\n`;
        if (item.description) {
          text += `    ${item.description}\n`;
        }
      });

      text += '\n';
    });

    this.downloadFile(text, filename || `${card.cardTitle || 'card'}.txt`, 'text/plain');
  }

  /**
   * Copy card JSON to clipboard
   */
  async copyToClipboard(card: AICardConfig): Promise<boolean> {
    try {
      const cardWithoutIds = removeAllIds(card);
      const json = JSON.stringify(cardWithoutIds, null, 2);
      await navigator.clipboard.writeText(json);
      return true;
    } catch (error) {
      this.logger.error('Failed to copy to clipboard', 'ExportService', error);
      return false;
    }
  }

  /**
   * Export multiple cards as JSON array
   */
  exportMultipleAsJson(cards: AICardConfig[], filename?: string): void {
    const cardsWithoutIds = cards.map((card) => removeAllIds(card));
    const json = JSON.stringify(cardsWithoutIds, null, 2);
    this.downloadFile(json, filename || 'cards.json', 'application/json');
  }

  /**
   * Download file helper
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export card as CSV (for sections with table-like data)
   */
  exportAsCsv(card: AICardConfig, filename?: string): void {
    let csv = 'Section,Field,Value\n';

    card.sections?.forEach((section) => {
      section.fields?.forEach((field) => {
        const sectionTitle = (section.title || '').replace(/"/g, '""');
        const fieldLabel = (field.label || field.title || '').replace(/"/g, '""');
        const fieldValue = String(field.value || '').replace(/"/g, '""');
        csv += `"${sectionTitle}","${fieldLabel}","${fieldValue}"\n`;
      });
    });

    this.downloadFile(csv, filename || `${card.cardTitle || 'card'}.csv`, 'text/csv');
  }

  /**
   * Export card as PDF
   * Requires jsPDF library (optional dependency)
   */
  async exportAsPdf(
    card: AICardConfig,
    element: HTMLElement,
    options: PdfExportOptions = {},
    filename?: string
  ): Promise<void> {
    try {
      // Dynamic import of jsPDF (optional dependency)
      // Using type assertion to avoid TypeScript errors when package is not installed
      // Dynamic import for optional dependency

      let jsPDF: typeof import('jspdf').jsPDF | null = null;
      try {
        const jsPDFModule = await import('jspdf' as any);
        jsPDF = jsPDFModule.jsPDF || jsPDFModule.default?.jsPDF || jsPDFModule.default;
      } catch (importError) {
        throw new Error('jsPDF is not installed. Install with: npm install jspdf');
      }

      const {
        format = 'a4',
        orientation = 'portrait',
        margin = 20,
        title = card.cardTitle || 'Card',
        includeMetadata = true,
      } = options;

      if (!jsPDF) {
        throw new Error('jsPDF is not available');
      }

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format,
      });

      // Add metadata
      if (includeMetadata) {
        pdf.setProperties({
          title,
          subject: 'OSI Card Export',
          author: 'OSI Cards',
          creator: 'OSI Cards Application',
        });
      }

      // Add title
      pdf.setFontSize(18);
      pdf.text(title, margin, margin + 10);

      // Convert element to image and add to PDF
      const imageData = await this.elementToImage(element, { format: 'png', scale: 2 });
      const imgWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const imgHeight = (element.offsetHeight * imgWidth) / element.offsetWidth;

      pdf.addImage(imageData, 'PNG', margin, margin + 20, imgWidth, imgHeight);

      // Save PDF
      pdf.save(filename || `${title}.pdf`);
      this.logger.info('Card exported as PDF', 'ExportService');
    } catch (error) {
      this.logger.error(
        'Failed to export as PDF. jsPDF may not be installed.',
        'ExportService',
        error
      );
      throw new Error('PDF export requires jsPDF library. Install with: npm install jspdf');
    }
  }

  /**
   * Export card as PNG using dom-to-image-more library
   * This library has better support for modern CSS including color-mix() and oklab()
   */
  async exportAsPngNative(element: HTMLElement, filename?: string, scale = 2): Promise<void> {
    try {
      if (!element) {
        throw new Error('Element is required for PNG export');
      }

      this.logger.info('Starting PNG export with dom-to-image-more', 'ExportService', {
        elementTag: element.tagName,
        elementClass: element.className,
      });

      // Get dimensions for logging
      const rect = element.getBoundingClientRect();
      const width = Math.max(rect.width, element.offsetWidth || element.clientWidth || 0);
      const height = Math.max(rect.height, element.offsetHeight || element.clientHeight || 0);

      if (width === 0 || height === 0) {
        throw new Error(`Element has no dimensions: width=${width}, height=${height}`);
      }

      this.logger.info('Element dimensions', 'ExportService', { width, height, scale });

      // Dynamic import of dom-to-image-more
      const domToImage = await import('dom-to-image-more');

      // Use dom-to-image-more to capture the element as PNG
      const dataUrl = await domToImage.toPng(element, {
        quality: 1,
        bgcolor: '#ffffff',
        width: width * scale,
        height: height * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        },
      });

      // Download the PNG
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename || 'card.png';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);

      this.logger.info('Card exported as PNG successfully', 'ExportService', { filename });
    } catch (error) {
      this.logger.error('Failed to export as PNG', 'ExportService', error);
      throw error;
    }
  }

  /**
   * Create an exportable clone of the element with all styles inlined
   * This avoids html2canvas parsing issues with modern CSS functions like color-mix()
   * @internal Reserved for future use
   */
  protected async createExportableClone(
    element: HTMLElement,
    scale: number
  ): Promise<{ container: HTMLElement; cleanup: () => void }> {
    const rect = element.getBoundingClientRect();
    const width = rect.width * scale;
    const height = rect.height * scale;

    // Create an off-screen container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.overflow = 'visible';
    container.style.backgroundColor = '#ffffff';
    container.style.zIndex = '-9999';

    // Deep clone the element
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.transform = `scale(${scale})`;
    clone.style.transformOrigin = 'top left';
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.left = '0';

    // Inline all computed styles to avoid CSS parsing
    this.deepInlineStyles(element, clone);

    container.appendChild(clone);
    document.body.appendChild(container);

    // Wait for rendering
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    return {
      container,
      cleanup: () => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      },
    };
  }

  /**
   * Recursively inline computed styles from source to clone
   */
  private deepInlineStyles(source: Element, clone: Element): void {
    if (!(source instanceof HTMLElement) || !(clone instanceof HTMLElement)) {
      return;
    }

    // Get computed styles from the original element
    const computedStyle = window.getComputedStyle(source);

    // List of important visual properties to inline
    const propertiesToInline = [
      'color',
      'background-color',
      'background-image',
      'background',
      'border',
      'border-color',
      'border-width',
      'border-style',
      'border-radius',
      'box-shadow',
      'text-shadow',
      'outline',
      'outline-color',
      'font-family',
      'font-size',
      'font-weight',
      'font-style',
      'line-height',
      'letter-spacing',
      'text-align',
      'text-decoration',
      'padding',
      'margin',
      'width',
      'height',
      'min-width',
      'min-height',
      'max-width',
      'max-height',
      'display',
      'flex-direction',
      'justify-content',
      'align-items',
      'gap',
      'grid-template-columns',
      'grid-template-rows',
      'opacity',
      'visibility',
      'overflow',
      'position',
      'fill',
      'stroke',
      'stroke-width',
    ];

    for (const prop of propertiesToInline) {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'normal' && value !== 'auto') {
        // Sanitize value - replace any color-mix or unsupported functions
        const sanitizedValue = this.sanitizeStyleValue(value);
        try {
          clone.style.setProperty(prop, sanitizedValue);
        } catch {
          // Ignore if setting fails
        }
      }
    }

    // Process children recursively
    const sourceChildren = source.children;
    const cloneChildren = clone.children;
    for (let i = 0; i < sourceChildren.length && i < cloneChildren.length; i++) {
      const sourceChild = sourceChildren[i];
      const cloneChild = cloneChildren[i];
      if (sourceChild && cloneChild) {
        this.deepInlineStyles(sourceChild, cloneChild);
      }
    }
  }

  /**
   * Sanitize a CSS style value, replacing unsupported functions
   */
  private sanitizeStyleValue(value: string): string {
    if (!value) {
      return value;
    }

    // Replace color-mix() with fallback
    let sanitized = this.replaceColorMix(value);

    // Replace oklab() with rgb fallback (convert to a neutral color)
    sanitized = sanitized.replace(/oklab\([^)]+\)/gi, 'rgb(128, 128, 128)');

    return sanitized;
  }

  /**
   * Download canvas as PNG
   * @internal Reserved for future use
   */
  protected downloadCanvasToPng(canvas: HTMLCanvasElement, filename?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create PNG blob'));
          return;
        }

        // Download using data URL to avoid CSP issues
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = filename || 'card.png';
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();

          // Cleanup after a delay to ensure download starts
          setTimeout(() => {
            document.body.removeChild(link);
          }, 100);

          this.logger.info('Card exported as PNG successfully', 'ExportService', { filename });
          resolve();
        };
        reader.onerror = () => {
          reject(new Error('Failed to read PNG blob'));
        };
        reader.readAsDataURL(blob);
      }, 'image/png');
    });
  }

  /**
   * Sanitize unsupported CSS properties in cloned document for html2canvas
   * Replaces color-mix() and other modern CSS functions with fallback values
   * @internal Reserved for future use
   */
  protected sanitizeUnsupportedCSS(doc: Document): void {
    // Process all style elements
    const styleElements = doc.querySelectorAll('style');
    styleElements.forEach((style) => {
      if (style.textContent) {
        style.textContent = this.replaceColorMix(style.textContent);
      }
    });

    // Process inline styles on all elements
    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style && htmlEl.style.cssText) {
        htmlEl.style.cssText = this.replaceColorMix(htmlEl.style.cssText);
      }

      // Also check the style attribute directly
      const styleAttr = htmlEl.getAttribute('style');
      if (styleAttr && styleAttr.includes('color-mix')) {
        htmlEl.setAttribute('style', this.replaceColorMix(styleAttr));
      }
    });
  }

  /**
   * Replace color-mix() CSS function with a fallback color
   * color-mix(in srgb, color1 percentage, color2) -> extracts color1 as fallback
   */
  private replaceColorMix(css: string): string {
    // Match color-mix(in srgb, color percentage, transparent/color)
    // Replace with the first color as a reasonable fallback
    return css.replace(
      /color-mix\s*\(\s*in\s+\w+\s*,\s*([^,]+?)\s+\d+%?\s*,\s*[^)]+\)/gi,
      (_match, color) => {
        // Extract the color value, removing any percentage
        const cleanColor = color.trim().replace(/\s+\d+%$/, '');

        // If it's a CSS variable, try to provide a reasonable fallback
        if (cleanColor.startsWith('var(')) {
          // Extract fallback from var() if present, or use a default
          const varMatch = cleanColor.match(/var\([^,]+,\s*([^)]+)\)/);
          if (varMatch) {
            return varMatch[1].trim();
          }
          // Common fallbacks for known variables
          if (cleanColor.includes('--color-brand')) {
            return '#FF7900';
          }
          if (cleanColor.includes('--primary')) {
            return '#FF7900';
          }
          if (cleanColor.includes('--foreground')) {
            return '#1c1c1f';
          }
          if (cleanColor.includes('--background')) {
            return '#ffffff';
          }
          if (cleanColor.includes('--muted')) {
            return '#f4f4f6';
          }
          if (cleanColor.includes('--border')) {
            return 'rgba(200,200,200,0.5)';
          }
          if (cleanColor.includes('--card')) {
            return '#fefefe';
          }
          return 'inherit';
        }

        return cleanColor;
      }
    );
  }

  /**
   * Inline computed styles on elements to avoid CSS parsing issues with modern functions
   * This ensures html2canvas can properly render elements without parsing color-mix() etc.
   * @internal Reserved for future use
   */
  protected inlineComputedStyles(element: HTMLElement, doc: Document): void {
    const walker = doc.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
    let node: Node | null = walker.currentNode;

    // Properties that commonly use color-mix and need special handling
    const colorProperties = [
      'color',
      'backgroundColor',
      'borderColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
      'outlineColor',
      'boxShadow',
      'textShadow',
      'fill',
      'stroke',
    ];

    while (node) {
      if (node instanceof HTMLElement) {
        const computedStyle = window.getComputedStyle(node);

        // Only inline specific color properties to avoid breaking layout
        for (const prop of colorProperties) {
          const value = computedStyle.getPropertyValue(this.camelToKebab(prop));
          if (value && !value.includes('color-mix') && !value.includes('oklab')) {
            // Only set if the value is a valid color (not complex functions)
            try {
              node.style.setProperty(this.camelToKebab(prop), value);
            } catch {
              // Ignore invalid values
            }
          }
        }
      }
      node = walker.nextNode();
    }
  }

  /**
   * Convert camelCase to kebab-case for CSS properties
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Convert data URL to Blob
   * @internal Reserved for future use
   */
  protected dataUrlToBlob(dataUrl: string, callback: (blob: Blob) => void): void {
    const arr = dataUrl.split(',');
    const firstPart = arr[0];
    const secondPart = arr[1];
    if (!firstPart || !secondPart) {
      callback(new Blob());
      return;
    }
    const mimeMatch = firstPart.match(/:(.*?);/);
    const mime = mimeMatch?.[1] || 'image/png';
    const bstr = atob(secondPart);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    callback(new Blob([u8arr], { type: mime }));
  }

  /**
   * Export card as image (PNG/SVG/JPEG)
   * Requires html2canvas library (optional dependency)
   */
  async exportAsImage(
    element: HTMLElement,
    options: ImageExportOptions = {},
    filename?: string
  ): Promise<void> {
    try {
      const { format = 'png', quality = 0.92, scale = 2, backgroundColor = '#ffffff' } = options;

      const imageData = await this.elementToImage(element, {
        format,
        quality,
        scale,
        backgroundColor,
      });

      // Determine MIME type
      const mimeType =
        format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/svg+xml';

      // Download image
      this.downloadFile(imageData, filename || `card.${format}`, mimeType);
      this.logger.info(`Card exported as ${format.toUpperCase()}`, 'ExportService');
    } catch (error) {
      this.logger.error(
        'Failed to export as image. html2canvas may not be installed.',
        'ExportService',
        error
      );
      throw new Error(
        'Image export requires html2canvas library. Install with: npm install html2canvas'
      );
    }
  }

  /**
   * Export multiple cards as PDF
   */
  async exportMultipleAsPdf(
    cards: AICardConfig[],
    elements: HTMLElement[],
    options: PdfExportOptions = {},
    filename?: string
  ): Promise<void> {
    try {
      // Dynamic import of jsPDF (optional dependency)
      // Using type assertion to avoid TypeScript errors when package is not installed
      // Dynamic import for optional dependency

      let jsPDF: typeof import('jspdf').jsPDF | null = null;
      try {
        const jsPDFModule = await import('jspdf' as any);
        jsPDF = jsPDFModule.jsPDF || jsPDFModule.default?.jsPDF || jsPDFModule.default;
      } catch (importError) {
        throw new Error('jsPDF is not installed. Install with: npm install jspdf');
      }

      const { format = 'a4', orientation = 'portrait', margin = 20 } = options;

      if (!jsPDF) {
        throw new Error('jsPDF is not available');
      }

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format,
      });

      for (let i = 0; i < elements.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const card = cards[i];
        const element = elements[i];
        if (!element || !card) {
          continue;
        }

        // Add card title
        pdf.setFontSize(18);
        pdf.text(card.cardTitle || `Card ${i + 1}`, margin, margin + 10);

        // Convert element to image
        const imageData = await this.elementToImage(element, { format: 'png', scale: 2 });
        const imgWidth = pdf.internal.pageSize.getWidth() - margin * 2;
        const imgHeight = (element.offsetHeight * imgWidth) / element.offsetWidth;

        pdf.addImage(imageData, 'PNG', margin, margin + 20, imgWidth, imgHeight);
      }

      pdf.save(filename || 'cards.pdf');
      this.logger.info(`Exported ${cards.length} cards as PDF`, 'ExportService');
    } catch (error) {
      this.logger.error('Failed to export multiple cards as PDF', 'ExportService', error);
      throw error;
    }
  }

  /**
   * Convert HTML element to image data URL
   */
  private async elementToImage(
    element: HTMLElement,
    options: {
      format?: 'png' | 'svg' | 'jpeg';
      quality?: number;
      scale?: number;
      backgroundColor?: string;
    }
  ): Promise<string> {
    const { format = 'png', quality = 0.92, scale = 2, backgroundColor = '#ffffff' } = options;

    if (format === 'svg') {
      // For SVG, serialize the element
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(element);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      return URL.createObjectURL(svgBlob);
    }

    // For PNG/JPEG, use html2canvas (optional dependency)
    // Using type assertion to avoid TypeScript errors when package is not installed
    try {
      // Dynamic import for optional dependency

      let html2canvas:
        | ((element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>)
        | null = null;
      try {
        const html2canvasModule = await import('html2canvas' as any);
        html2canvas = html2canvasModule.default || html2canvasModule;
      } catch (importError) {
        throw new Error('html2canvas is not installed. Install with: npm install html2canvas');
      }

      if (!html2canvas || typeof html2canvas !== 'function') {
        throw new Error('html2canvas is not available or is not a function');
      }

      const canvas = await html2canvas(element, {
        scale,
        backgroundColor,
        useCORS: true,
        logging: false,
      });

      return canvas.toDataURL(`image/${format}`, quality);
    } catch (error) {
      this.logger.error('html2canvas not available', 'ExportService', error);
      throw new Error('html2canvas is required for image export');
    }
  }
}
