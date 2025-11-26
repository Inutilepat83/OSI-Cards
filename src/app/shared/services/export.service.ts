import { Injectable, inject } from '@angular/core';
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
 * Allows users to export cards as JSON, PDF, or images
 */
@Injectable({
  providedIn: 'root'
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
    let text = `Card: ${card.cardTitle}\n`;
    if (card.cardSubtitle) {
      text += `Subtitle: ${card.cardSubtitle}\n`;
    }
    text += '\n';

    card.sections?.forEach((section, index) => {
      text += `Section ${index + 1}: ${section.title}\n`;
      if (section.description) {
        text += `  ${section.description}\n`;
      }

      section.fields?.forEach(field => {
        text += `  - ${field.label || field.title || 'Field'}: ${field.value || ''}\n`;
      });

      section.items?.forEach(item => {
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
    const cardsWithoutIds = cards.map(card => removeAllIds(card));
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

    card.sections?.forEach(section => {
      section.fields?.forEach(field => {
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
      let jsPDF: any;
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
        includeMetadata = true
      } = options;

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format
      });

      // Add metadata
      if (includeMetadata) {
        pdf.setProperties({
          title,
          subject: 'OSI Card Export',
          author: 'OSI Cards',
          creator: 'OSI Cards Application'
        });
      }

      // Add title
      pdf.setFontSize(18);
      pdf.text(title, margin, margin + 10);

      // Convert element to image and add to PDF
      const imageData = await this.elementToImage(element, { format: 'png', scale: 2 });
      const imgWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
      const imgHeight = (element.offsetHeight * imgWidth) / element.offsetWidth;
      
      pdf.addImage(imageData, 'PNG', margin, margin + 20, imgWidth, imgHeight);

      // Save PDF
      pdf.save(filename || `${title}.pdf`);
      this.logger.info('Card exported as PDF', 'ExportService');
    } catch (error) {
      this.logger.error('Failed to export as PDF. jsPDF may not be installed.', 'ExportService', error);
      throw new Error('PDF export requires jsPDF library. Install with: npm install jspdf');
    }
  }

  /**
   * Export card as PNG using native browser APIs (SVG foreignObject + Canvas)
   * No external libraries required - uses only native browser APIs
   */
  async exportAsPngNative(element: HTMLElement, filename?: string, scale: number = 2): Promise<void> {
    try {
      if (!element) {
        throw new Error('Element is required for PNG export');
      }

      // Get dimensions
      const width = element.offsetWidth || element.clientWidth;
      const height = element.offsetHeight || element.clientHeight;

      if (width === 0 || height === 0) {
        throw new Error('Element has no dimensions');
      }

      const scaledWidth = width * scale;
      const scaledHeight = height * scale;

      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Apply scaling to the cloned element using CSS transform
      clonedElement.style.transform = `scale(${scale})`;
      clonedElement.style.transformOrigin = 'top left';
      clonedElement.style.width = `${width}px`;
      clonedElement.style.height = `${height}px`;
      
      // Create a container for the cloned element with scaled dimensions
      const container = document.createElement('div');
      container.style.width = `${scaledWidth}px`;
      container.style.height = `${scaledHeight}px`;
      container.style.position = 'relative';
      container.style.overflow = 'hidden';
      container.appendChild(clonedElement);

      // Create SVG element with foreignObject
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', String(scaledWidth));
      svg.setAttribute('height', String(scaledHeight));
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Create foreignObject to embed HTML
      const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      foreignObject.setAttribute('width', String(scaledWidth));
      foreignObject.setAttribute('height', String(scaledHeight));
      foreignObject.setAttribute('x', '0');
      foreignObject.setAttribute('y', '0');

      // Append container to foreignObject
      foreignObject.appendChild(container);
      svg.appendChild(foreignObject);

      // Serialize SVG to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      
      // Create data URL from SVG
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgDataUrl = URL.createObjectURL(svgBlob);

      // Create image element and load SVG
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            // Create canvas and draw image
            const canvas = document.createElement('canvas');
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }

            // Fill background (white by default)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw the image onto canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Convert canvas to PNG data URL
            const pngDataUrl = canvas.toDataURL('image/png');

            // Convert data URL to blob for download
            this.dataUrlToBlob(pngDataUrl, (blob) => {
              // Download the PNG file
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = filename || 'card.png';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              URL.revokeObjectURL(svgDataUrl);

              this.logger.info('Card exported as PNG', 'ExportService');
              resolve();
            });
          } catch (error) {
            URL.revokeObjectURL(svgDataUrl);
            this.logger.error('Failed to export as PNG', 'ExportService', error);
            reject(error);
          }
        };

        img.onerror = (error) => {
          URL.revokeObjectURL(svgDataUrl);
          this.logger.error('Failed to load SVG for PNG export', 'ExportService', error);
          reject(new Error('Failed to load SVG image'));
        };

        img.src = svgDataUrl;
      });
    } catch (error) {
      this.logger.error('Failed to export as PNG', 'ExportService', error);
      throw error;
    }
  }

  /**
   * Convert data URL to Blob
   */
  private dataUrlToBlob(dataUrl: string, callback: (blob: Blob) => void): void {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
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
      const {
        format = 'png',
        quality = 0.92,
        scale = 2,
        backgroundColor = '#ffffff'
      } = options;

      const imageData = await this.elementToImage(element, { format, quality, scale, backgroundColor });
      
      // Determine MIME type
      const mimeType = format === 'png' ? 'image/png' : 
                      format === 'jpeg' ? 'image/jpeg' : 
                      'image/svg+xml';

      // Download image
      this.downloadFile(imageData, filename || `card.${format}`, mimeType);
      this.logger.info(`Card exported as ${format.toUpperCase()}`, 'ExportService');
    } catch (error) {
      this.logger.error('Failed to export as image. html2canvas may not be installed.', 'ExportService', error);
      throw new Error('Image export requires html2canvas library. Install with: npm install html2canvas');
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
      let jsPDF: any;
      try {
        const jsPDFModule = await import('jspdf' as any);
        jsPDF = jsPDFModule.jsPDF || jsPDFModule.default?.jsPDF || jsPDFModule.default;
      } catch (importError) {
        throw new Error('jsPDF is not installed. Install with: npm install jspdf');
      }
      
      const {
        format = 'a4',
        orientation = 'portrait',
        margin = 20
      } = options;

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format
      });

      for (let i = 0; i < elements.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const card = cards[i];
        const element = elements[i];

        // Add card title
        pdf.setFontSize(18);
        pdf.text(card.cardTitle || `Card ${i + 1}`, margin, margin + 10);

        // Convert element to image
        const imageData = await this.elementToImage(element, { format: 'png', scale: 2 });
        const imgWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
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
      let html2canvas: any;
      try {
        const html2canvasModule = await import('html2canvas' as any);
        html2canvas = html2canvasModule.default || html2canvasModule;
      } catch (importError) {
        throw new Error('html2canvas is not installed. Install with: npm install html2canvas');
      }
      const canvas = await html2canvas(element, {
        scale,
        backgroundColor,
        useCORS: true,
        logging: false
      });

      return canvas.toDataURL(`image/${format}`, quality);
    } catch (error) {
      this.logger.error('html2canvas not available', 'ExportService', error);
      throw new Error('html2canvas is required for image export');
    }
  }
}


