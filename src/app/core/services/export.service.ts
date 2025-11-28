import { Injectable, inject } from '@angular/core';
import { AICardConfig } from '../../models';
import { LoggingService } from './logging.service';

export type ExportFormat = 'json' | 'pdf' | 'png' | 'svg';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeMetadata?: boolean;
  prettyPrint?: boolean;
}

/**
 * Export Service
 * 
 * Provides functionality to export cards in various formats (JSON, PDF, PNG, SVG).
 * 
 * @example
 * ```typescript
 * const exportService = inject(ExportService);
 * await exportService.exportCard(card, { format: 'json' });
 * await exportService.exportCard(card, { format: 'png', filename: 'my-card.png' });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private readonly logger = inject(LoggingService);

  /**
   * Export a single card
   */
  async exportCard(card: AICardConfig, options: ExportOptions): Promise<void> {
    this.logger.info('Exporting card', 'ExportService', {
      format: options.format,
      cardTitle: card.cardTitle
    });

    switch (options.format) {
      case 'json':
        return this.exportAsJson(card, options);
      case 'pdf':
        return this.exportAsPdf(card, options);
      case 'png':
      case 'svg':
        return this.exportAsImage(card, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export multiple cards
   */
  async exportCards(cards: AICardConfig[], options: ExportOptions): Promise<void> {
    this.logger.info('Exporting multiple cards', 'ExportService', {
      format: options.format,
      count: cards.length
    });

    switch (options.format) {
      case 'json':
        return this.exportMultipleAsJson(cards, options);
      case 'pdf':
        return this.exportMultipleAsPdf(cards, options);
      default:
        throw new Error(`Unsupported export format for multiple cards: ${options.format}`);
    }
  }

  /**
   * Export card as JSON
   */
  private async exportAsJson(card: AICardConfig, options: ExportOptions): Promise<void> {
    const data = options.includeMetadata ? card : this.removeMetadata(card);
    const jsonString = options.prettyPrint
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = options.filename || `${this.sanitizeFilename(card.cardTitle)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.logger.debug('Card exported as JSON', 'ExportService', {
      filename: link.download
    });
  }

  /**
   * Export multiple cards as JSON array
   */
  private async exportMultipleAsJson(cards: AICardConfig[], options: ExportOptions): Promise<void> {
    const data = cards.map(card => 
      options.includeMetadata ? card : this.removeMetadata(card)
    );
    const jsonString = options.prettyPrint
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = options.filename || `cards-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.logger.debug('Multiple cards exported as JSON', 'ExportService', {
      filename: link.download,
      count: cards.length
    });
  }

  /**
   * Export card as PDF
   * Note: Requires jsPDF library - install with: npm install jspdf
   */
  private async exportAsPdf(card: AICardConfig, options: ExportOptions): Promise<void> {
    // Dynamic import to avoid bundle size if not used
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Add card title
      doc.setFontSize(18);
      doc.text(card.cardTitle, 10, 20);
      
      // Add card subtitle if present
      if (card.cardSubtitle) {
        doc.setFontSize(12);
        doc.text(card.cardSubtitle, 10, 30);
      }
      
      let yPosition = 40;
      
      // Add sections
      card.sections.forEach((section, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text(section.title, 10, yPosition);
        yPosition += 10;
        
        // Add fields
        if (section.fields) {
          section.fields.forEach(field => {
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 20;
            }
            doc.setFontSize(10);
            const text = `${field.label || ''}: ${field.value || ''}`;
            doc.text(text, 15, yPosition);
            yPosition += 7;
          });
        }
        
        yPosition += 5;
      });
      
      const filename = options.filename || `${this.sanitizeFilename(card.cardTitle)}.pdf`;
      doc.save(filename);
      
      this.logger.debug('Card exported as PDF', 'ExportService', { filename });
    } catch (error) {
      this.logger.error('Failed to export as PDF. Install jsPDF: npm install jspdf', 'ExportService', { error });
      throw new Error('PDF export requires jsPDF library. Install with: npm install jspdf');
    }
  }

  /**
   * Export multiple cards as PDF
   */
  private async exportMultipleAsPdf(cards: AICardConfig[], options: ExportOptions): Promise<void> {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      cards.forEach((card, cardIndex) => {
        if (cardIndex > 0) {
          doc.addPage();
        }
        
        let yPosition = 20;
        
        // Add card title
        doc.setFontSize(18);
        doc.text(card.cardTitle, 10, yPosition);
        yPosition += 10;
        
        // Add sections
        card.sections.forEach(section => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(14);
          doc.text(section.title, 10, yPosition);
          yPosition += 10;
          
          if (section.fields) {
            section.fields.forEach(field => {
              if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
              }
              doc.setFontSize(10);
              doc.text(`${field.label || ''}: ${field.value || ''}`, 15, yPosition);
              yPosition += 7;
            });
          }
          
          yPosition += 5;
        });
      });
      
      const filename = options.filename || `cards-export-${Date.now()}.pdf`;
      doc.save(filename);
      
      this.logger.debug('Multiple cards exported as PDF', 'ExportService', {
        filename,
        count: cards.length
      });
    } catch (error) {
      this.logger.error('Failed to export as PDF', 'ExportService', { error });
      throw new Error('PDF export requires jsPDF library. Install with: npm install jspdf');
    }
  }

  /**
   * Export card as image (PNG or SVG)
   * Note: Requires html2canvas for PNG - install with: npm install html2canvas
   */
  private async exportAsImage(card: AICardConfig, options: ExportOptions): Promise<void> {
    if (options.format === 'svg') {
      // SVG export would require different approach
      this.logger.warn('SVG export not yet implemented', 'ExportService');
      throw new Error('SVG export not yet implemented');
    }

    // PNG export using html2canvas
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      // Find the card element in the DOM
      const cardElement = document.querySelector(`[data-card-id="${card.id}"]`) ||
                         document.querySelector('app-ai-card-renderer') ||
                         document.querySelector('app-card-preview');
      
      if (!cardElement) {
        throw new Error('Card element not found in DOM');
      }

      const canvas = await html2canvas(cardElement as HTMLElement, {
        backgroundColor: null,
        scale: 2, // Higher quality
        logging: false
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create image blob');
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = options.filename || `${this.sanitizeFilename(card.cardTitle)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.logger.debug('Card exported as PNG', 'ExportService', {
          filename: link.download
        });
      }, 'image/png');
    } catch (error) {
      this.logger.error('Failed to export as image. Install html2canvas: npm install html2canvas', 'ExportService', { error });
      throw new Error('Image export requires html2canvas library. Install with: npm install html2canvas');
    }
  }

  /**
   * Remove metadata from card for cleaner export
   */
  private removeMetadata(card: AICardConfig): AICardConfig {
    const { processedAt, ...cardWithoutMetadata } = card;
    return cardWithoutMetadata;
  }

  /**
   * Sanitize filename to remove invalid characters
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .substring(0, 50);
  }

  /**
   * Get supported export formats
   */
  getSupportedFormats(): ExportFormat[] {
    return ['json', 'pdf', 'png', 'svg'];
  }

  /**
   * Check if a format is supported
   */
  isFormatSupported(format: string): format is ExportFormat {
    return this.getSupportedFormats().includes(format as ExportFormat);
  }
}

