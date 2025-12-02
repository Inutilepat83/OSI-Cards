import { inject, Injectable } from '@angular/core';
import { AICardConfig, CardField, CardItem, CardSection } from '../../models';
import { removeAllIds } from '../utils/card-utils';
import { LoggingService } from '../../core/services/logging.service';

/**
 * Export format types
 */
export type ExportFormat = 'json' | 'pdf' | 'png' | 'svg' | 'jpeg' | 'csv' | 'text';

/**
 * Base export options
 */
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeMetadata?: boolean;
  prettyPrint?: boolean;
}

/**
 * PDF export options
 */
export interface PdfExportOptions {
  format?: 'a4' | 'letter' | [number, number];
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
  quality?: number;
  scale?: number;
  backgroundColor?: string;
}

/**
 * Consolidated Export Service
 *
 * Provides comprehensive export functionality for OSI Cards with unified API.
 * Combines features from both core and shared implementations:
 * - Multiple export formats (JSON, PDF, PNG, SVG, JPEG, CSV, text)
 * - Single card and batch exports
 * - Clipboard integration
 * - Optional dependency support (jsPDF, html2canvas, dom-to-image-more)
 * - High-resolution exports with configurable scaling
 *
 * @example
 * ```typescript
 * const exportService = inject(ExportService);
 *
 * // Export as JSON
 * exportService.exportAsJson(card, 'my-card.json');
 *
 * // Export using unified API
 * await exportService.exportCard(card, { format: 'json' });
 *
 * // Export as PNG (native, uses dom-to-image-more)
 * await exportService.exportAsPngNative(element, 'card.png', 2);
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

  // ============================================================================
  // UNIFIED API
  // ============================================================================

  /**
   * Export a single card using unified API
   */
  async exportCard(card: AICardConfig, options: ExportOptions): Promise<void> {
    this.logger.info('Exporting card', 'ExportService', {
      format: options.format,
      cardTitle: card.cardTitle,
    });

    switch (options.format) {
      case 'json':
        return this.exportAsJson(card, options.filename);
      case 'text':
        return this.exportAsText(card, options.filename);
      case 'csv':
        return this.exportAsCsv(card, options.filename);
      case 'pdf':
        this.logger.warn(
          'PDF export requires element reference. Use exportAsPdf() directly.',
          'ExportService'
        );
        throw new Error('PDF export requires element reference. Use exportAsPdf() directly.');
      case 'png':
      case 'svg':
      case 'jpeg':
        this.logger.warn(
          'Image export requires element reference. Use exportAsImage() directly.',
          'ExportService'
        );
        throw new Error('Image export requires element reference. Use exportAsImage() directly.');
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export multiple cards using unified API
   */
  async exportCards(cards: AICardConfig[], options: ExportOptions): Promise<void> {
    this.logger.info('Exporting multiple cards', 'ExportService', {
      format: options.format,
      count: cards.length,
    });

    switch (options.format) {
      case 'json':
        return this.exportMultipleAsJson(cards, options.filename);
      default:
        throw new Error(`Unsupported export format for multiple cards: ${options.format}`);
    }
  }

  // ============================================================================
  // JSON EXPORTS
  // ============================================================================

  /**
   * Export card as JSON
   */
  exportAsJson(card: AICardConfig, filename?: string): void {
    const cardWithoutIds = removeAllIds(card);
    const json = JSON.stringify(cardWithoutIds, null, 2);
    this.downloadFile(json, filename || `${card.cardTitle || 'card'}.json`, 'application/json');
  }

  /**
   * Export card as formatted JSON (alias for exportAsJson)
   */
  exportAsFormattedJson(card: AICardConfig, filename?: string): void {
    this.exportAsJson(card, filename);
  }

  /**
   * Export multiple cards as JSON array
   */
  exportMultipleAsJson(cards: AICardConfig[], filename?: string): void {
    const cardsWithoutIds = cards.map((card) => removeAllIds(card));
    const json = JSON.stringify(cardsWithoutIds, null, 2);
    this.downloadFile(json, filename || 'cards.json', 'application/json');
  }

  // ============================================================================
  // TEXT EXPORTS
  // ============================================================================

  /**
   * Export card as plain text
   */
  exportAsText(card: AICardConfig, filename?: string): void {
    let text = `Card: ${card.cardTitle}\n\n`;

    card.sections?.forEach((section: CardSection, index: number) => {
      text += `Section ${index + 1}: ${section.title}\n`;
      if (section.description) {
        text += `  ${section.description}\n`;
      }

      section.fields?.forEach((field: CardField) => {
        text += `  - ${field.label || field.title || 'Field'}: ${field.value || ''}\n`;
      });

      section.items?.forEach((item: CardItem) => {
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
   * Export card as CSV
   */
  exportAsCsv(card: AICardConfig, filename?: string): void {
    let csv = 'Section,Field,Value\n';

    card.sections?.forEach((section: CardSection) => {
      section.fields?.forEach((field: CardField) => {
        const sectionTitle = (section.title || '').replace(/"/g, '""');
        const fieldLabel = (field.label || field.title || '').replace(/"/g, '""');
        const fieldValue = String(field.value || '').replace(/"/g, '""');
        csv += `"${sectionTitle}","${fieldLabel}","${fieldValue}"\n`;
      });
    });

    this.downloadFile(csv, filename || `${card.cardTitle || 'card'}.csv`, 'text/csv');
  }

  // ============================================================================
  // CLIPBOARD
  // ============================================================================

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

  // ============================================================================
  // PDF EXPORTS (requires jsPDF)
  // ============================================================================

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
      const jsPDF = await this.loadJsPDF();

      const {
        format = 'a4',
        orientation = 'portrait',
        margin = 20,
        title = card.cardTitle || 'Card',
        includeMetadata = true,
      } = options;

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format,
      });

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

      pdf.save(filename || `${title}.pdf`);
      this.logger.info('Card exported as PDF', 'ExportService');
    } catch (error) {
      this.logger.error('Failed to export as PDF', 'ExportService', error);
      throw new Error('PDF export requires jsPDF library. Install with: npm install jspdf');
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
      const jsPDF = await this.loadJsPDF();

      const { format = 'a4', orientation = 'portrait', margin = 20 } = options;

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

        pdf.setFontSize(18);
        pdf.text(card.cardTitle || `Card ${i + 1}`, margin, margin + 10);

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

  // ============================================================================
  // IMAGE EXPORTS
  // ============================================================================

  /**
   * Export card as PNG using dom-to-image-more library
   * Recommended method - has better support for modern CSS
   */
  async exportAsPngNative(element: HTMLElement, filename?: string, scale = 2): Promise<void> {
    try {
      if (!element) {
        throw new Error('Element is required for PNG export');
      }

      const rect = element.getBoundingClientRect();
      const width = Math.max(rect.width, element.offsetWidth || element.clientWidth || 0);
      const height = Math.max(rect.height, element.offsetHeight || element.clientHeight || 0);

      if (width === 0 || height === 0) {
        throw new Error(`Element has no dimensions: width=${width}, height=${height}`);
      }

      this.logger.info('Starting PNG export', 'ExportService', { width, height, scale });

      const domToImage = await import('dom-to-image-more');

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

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename || 'card.png';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

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
   * Export as image using html2canvas (supports PNG, JPEG, SVG)
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

      const mimeType =
        format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/svg+xml';

      this.downloadFile(imageData, filename || `card.${format}`, mimeType);
      this.logger.info(`Card exported as ${format.toUpperCase()}`, 'ExportService');
    } catch (error) {
      this.logger.error('Failed to export as image', 'ExportService', error);
      throw new Error(
        'Image export requires html2canvas library. Install with: npm install html2canvas'
      );
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get supported export formats
   */
  getSupportedFormats(): ExportFormat[] {
    return ['json', 'pdf', 'png', 'svg', 'jpeg', 'csv', 'text'];
  }

  /**
   * Check if a format is supported
   */
  isFormatSupported(format: string): format is ExportFormat {
    return this.getSupportedFormats().includes(format as ExportFormat);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

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
   * Load jsPDF dynamically
   */
  private async loadJsPDF(): Promise<typeof import('jspdf').jsPDF> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jsPDFModule = await import('jspdf' as any);
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default?.jsPDF || jsPDFModule.default;
      if (!jsPDF) {
        throw new Error('jsPDF not available');
      }
      return jsPDF;
    } catch {
      throw new Error('jsPDF is not installed. Install with: npm install jspdf');
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
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(element);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      return URL.createObjectURL(svgBlob);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2canvasModule = await import('html2canvas' as any);
      const html2canvas = html2canvasModule.default || html2canvasModule;

      if (!html2canvas || typeof html2canvas !== 'function') {
        throw new Error('html2canvas not available');
      }

      const canvas = await html2canvas(element, {
        scale,
        backgroundColor,
        useCORS: true,
        logging: false,
      });

      return canvas.toDataURL(`image/${format}`, quality);
    } catch {
      throw new Error('html2canvas is required for image export');
    }
  }

  /**
   * Sanitize filename to remove invalid characters
   */
  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .substring(0, 50);
  }
}
