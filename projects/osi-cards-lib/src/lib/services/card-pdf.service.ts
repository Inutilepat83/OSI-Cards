/**
 * Card PDF Service
 *
 * Service for generating PDFs from card configurations.
 * Uses actual rendered card element when available to avoid style duplication.
 *
 * @dependencies
 * - LoggerService: For logging PDF generation operations
 * - Utility functions: generateCardHtml, generateCardPdfStyles
 *
 * @example
 * ```typescript
 * const pdfService = inject(CardPdfService);
 *
 * const pdfBlob = await pdfService.exportToPdf(card, {
 *   format: 'a4',
 *   orientation: 'portrait'
 * });
 * ```
 */

import { inject, Injectable } from '@angular/core';
import { AICardConfig } from '../models';
import { LoggerService } from './logger.service';
import { generateCardHtml } from '../utils/card-pdf-html-generator.util';
import { generateCardPdfStyles } from '../utils/card-pdf-styles.util';
import { CardPdfHtml2PdfService } from './card-pdf-html2pdf.service';
import { sendDebugLog } from '../utils/debug-log.util';

/**
 * PDF export options
 */
export interface CardPdfExportOptions {
  format?: 'a4' | 'letter' | [number, number];
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  title?: string;
  includeMetadata?: boolean;
  theme?: 'day' | 'night';
  filename?: string;
  /** Optional: Use actual rendered card element (avoids style duplication) */
  cardElement?: HTMLElement;
}

/**
 * Extract styles from shadow root stylesheets
 */
function extractShadowRootStyles(shadowRoot: ShadowRoot): string {
  const styles: string[] = [];

  try {
    // Get styles from <style> elements in shadow root
    const styleElements = shadowRoot.querySelectorAll('style');
    const styleArray = Array.from(styleElements);
    for (const styleEl of styleArray) {
      if (styleEl.textContent) {
        styles.push(styleEl.textContent);
      }
    }

    // Get styles from stylesheets (if accessible)
    const styleSheets = shadowRoot.styleSheets;
    if (styleSheets) {
      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const sheet = styleSheets[i];
          if (sheet) {
            const rules = Array.from(sheet.cssRules || []);
            for (const rule of rules) {
              if (rule.cssText) {
                styles.push(rule.cssText);
              }
            }
          }
        } catch (e) {
          // Cross-origin or inaccessible stylesheet - skip
        }
      }
    }
  } catch (e) {
    // Styles might not be accessible
  }

  return styles.join('\n');
}

/**
 * Extract styles from a card renderer element (Shadow DOM)
 */
function extractStylesFromCardElement(cardElement: HTMLElement): string | null {
  // Check if it's a card renderer with shadow root
  if (cardElement.shadowRoot) {
    return extractShadowRootStyles(cardElement.shadowRoot);
  }

  // If not shadow DOM, try to find card renderer within
  const cardRenderer = cardElement.querySelector('app-ai-card-renderer') as HTMLElement;
  if (cardRenderer?.shadowRoot) {
    return extractShadowRootStyles(cardRenderer.shadowRoot);
  }

  return null;
}

/**
 * Extract the card element from Shadow DOM for PDF generation
 * Improved version that handles nested shadow roots and various element structures
 */
function extractCardElementFromShadowDom(cardElement: HTMLElement): HTMLElement | null {
  // If element has shadow root, get the card surface
  if (cardElement.shadowRoot) {
    // Try to find the main card surface element
    const cardSurface = cardElement.shadowRoot.querySelector('.ai-card-surface') as HTMLElement;
    if (cardSurface) {
      return cardSurface;
    }

    // Try card container wrapper
    const cardContainer = cardElement.shadowRoot.querySelector(
      '.card-container-wrapper'
    ) as HTMLElement;
    if (cardContainer) {
      return cardContainer;
    }

    // Fallback to first child if specific elements not found
    return (cardElement.shadowRoot.firstElementChild as HTMLElement) || null;
  }

  // If not shadow DOM, try to find card renderer within
  const cardRenderer = cardElement.querySelector('app-ai-card-renderer') as HTMLElement;
  if (cardRenderer?.shadowRoot) {
    const cardSurface = cardRenderer.shadowRoot.querySelector('.ai-card-surface') as HTMLElement;
    if (cardSurface) {
      return cardSurface;
    }
    return (cardRenderer.shadowRoot.firstElementChild as HTMLElement) || null;
  }

  // Return the element itself if no shadow DOM
  return cardElement;
}

/**
 * Card PDF Service
 *
 * Generates PDF files from card configurations using HTML-to-PDF conversion.
 * Prefers html2pdf.js for superior CSS replication, falls back to jsPDF's html() method.
 * When cardElement is provided, uses actual card styles (no duplication).
 */
@Injectable({
  providedIn: 'root',
})
export class CardPdfService {
  private readonly logger = inject(LoggerService);
  private readonly html2pdfService = inject(CardPdfHtml2PdfService);

  /**
   * Load jsPDF dynamically
   */
  private async loadJsPDF(): Promise<any> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jsPDFModule = await import('jspdf' as any);
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default?.jsPDF || jsPDFModule.default;
      if (!jsPDF) {
        throw new Error('jsPDF not available');
      }
      return jsPDF;
    } catch (error) {
      this.logger.error('Failed to load jsPDF', { service: 'CardPdfService' }, error as Error);
      throw new Error('jsPDF is not installed. Install with: npm install jspdf');
    }
  }

  /**
   * Generate PDF from card configuration
   * Tries html2pdf.js first (better CSS support), falls back to jsPDF if not available.
   * @param card - Card configuration to export
   * @param options - PDF export options
   */
  async generatePdf(card: AICardConfig, options: CardPdfExportOptions = {}): Promise<void> {
    // #region agent log
    sendDebugLog(
      {
        location: 'card-pdf.service.ts:179',
        message: 'generatePdf called',
        data: {
          hasCard: !!card,
          hasOptions: !!options,
          hasCardElement: !!options.cardElement,
          cardTitle: card?.cardTitle,
        },
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E',
      },
      'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
    );
    // #endregion
    // Try html2pdf.js first (better CSS replication)
    // #region agent log
    sendDebugLog(
      {
        location: 'card-pdf.service.ts:181',
        message: 'Checking html2pdf availability',
        data: {},
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E',
      },
      'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
    );
    // #endregion
    let html2pdfAvailable = false;
    try {
      html2pdfAvailable = await this.html2pdfService.isAvailable();
    } catch (error) {
      // #region agent log
      sendDebugLog(
        {
          location: 'card-pdf.service.ts:isAvailable',
          message: 'html2pdf availability check threw error',
          data: { errorMessage: error instanceof Error ? error.message : String(error) },
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        },
        'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
      );
      // #endregion
    }
    // #region agent log
    sendDebugLog(
      {
        location: 'card-pdf.service.ts:182',
        message: 'html2pdf availability check result',
        data: { html2pdfAvailable },
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E',
      },
      'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
    );
    // #endregion

    if (html2pdfAvailable) {
      try {
        // #region agent log
        sendDebugLog(
          {
            location: 'card-pdf.service.ts:193',
            message: 'Attempting PDF generation with html2pdf.js',
            data: { cardTitle: card.cardTitle },
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'E',
          },
          'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
        );
        // #endregion
        this.logger.info('Using html2pdf.js for PDF generation', {
          service: 'CardPdfService',
          cardTitle: card.cardTitle,
        });
        await this.html2pdfService.generatePdf(card, options);
        // #region agent log
        sendDebugLog(
          {
            location: 'card-pdf.service.ts:198',
            message: 'PDF generation with html2pdf.js completed successfully',
            data: {},
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'E',
          },
          'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
        );
        // #endregion
        return;
      } catch (error) {
        // #region agent log
        sendDebugLog(
          {
            location: 'card-pdf.service.ts:200',
            message: 'html2pdf.js failed, falling back to jsPDF',
            data: {
              errorMessage: error instanceof Error ? error.message : String(error),
              errorName: error instanceof Error ? error.name : typeof error,
            },
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'E',
          },
          'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
        );
        // #endregion
        this.logger.warn('html2pdf.js failed, falling back to jsPDF', {
          service: 'CardPdfService',
          error: error instanceof Error ? error.message : String(error),
        });
        // Fall through to jsPDF fallback
      }
    }

    // Fallback to jsPDF
    // #region agent log
    sendDebugLog(
      {
        location: 'card-pdf.service.ts:209',
        message: 'Using jsPDF fallback for PDF generation',
        data: { cardTitle: card.cardTitle },
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E',
      },
      'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
    );
    // #endregion
    this.logger.info('Using jsPDF for PDF generation (fallback)', {
      service: 'CardPdfService',
      cardTitle: card.cardTitle,
    });
    return await this.generatePdfWithJsPdf(card, options);
  }

  /**
   * Generate PDF using jsPDF (fallback method)
   * @param card - Card configuration to export
   * @param options - PDF export options
   */
  private async generatePdfWithJsPdf(
    card: AICardConfig,
    options: CardPdfExportOptions = {}
  ): Promise<void> {
    try {
      const jsPDF = await this.loadJsPDF();

      const {
        format = 'a4',
        orientation = 'portrait',
        margin = 20,
        title = card.cardTitle || 'Card',
        includeMetadata = true,
        theme = 'day',
        filename,
        cardElement,
      } = options;

      this.logger.info('Generating PDF from card config', {
        service: 'CardPdfService',
        cardTitle: card.cardTitle,
        theme,
        format,
        hasCardElement: !!cardElement,
      });

      let stylesToUse = '';
      let htmlToUse = '';
      let elementToUse: HTMLElement | null = null;

      // If card element provided, use its actual styles (no duplication)
      if (cardElement) {
        // Try to extract element from Shadow DOM
        const extractedElement = extractCardElementFromShadowDom(cardElement);
        if (extractedElement) {
          elementToUse = extractedElement;
          const extractedStyles = extractStylesFromCardElement(cardElement);
          if (extractedStyles) {
            stylesToUse = extractedStyles;
          }
        } else {
          // Fallback: extract HTML and styles
          const extractedStyles = extractStylesFromCardElement(cardElement);
          if (extractedStyles) {
            stylesToUse = extractedStyles;
            // Use the card element's innerHTML directly (from shadow root)
            if (cardElement.shadowRoot) {
              const cardSurface = cardElement.shadowRoot.querySelector('.ai-card-surface');
              if (cardSurface) {
                htmlToUse = cardSurface.outerHTML;
              }
            }
          }
        }
      }

      // If no card element or extraction failed, generate HTML from config
      if (!elementToUse && !htmlToUse) {
        htmlToUse = generateCardHtml(card, theme);
        // Use minimal overrides only (no style duplication)
        const overrides = generateCardPdfStyles(theme);
        stylesToUse = overrides.replace(/<style>|<\/style>/g, '').trim();
      }

      // If we have a direct element, use it; otherwise create from HTML
      let finalElementToUse: HTMLElement;
      let tempDiv: HTMLElement | null = null;
      let styleEl: HTMLStyleElement | null = null;

      if (elementToUse) {
        // Use the extracted element directly
        finalElementToUse = elementToUse;
      } else {
        // Create a temporary container element
        tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.style.width = '800px'; // Fixed width for consistent rendering
        document.body.appendChild(tempDiv);

        // Create style element and add to document head temporarily
        styleEl = document.createElement('style');
        styleEl.textContent = stylesToUse;
        document.head.appendChild(styleEl);

        // Set inner HTML with content
        tempDiv.innerHTML = htmlToUse;

        const cardElementForPdf = tempDiv.querySelector(
          '.card-pdf-container, .ai-card-surface'
        ) as HTMLElement;
        finalElementToUse = cardElementForPdf || (tempDiv.firstElementChild as HTMLElement);

        if (!finalElementToUse) {
          if (styleEl && document.head.contains(styleEl)) {
            document.head.removeChild(styleEl);
          }
          if (tempDiv && document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
          }
          throw new Error('Failed to create card element from HTML');
        }
      }

      // Create PDF document
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

      try {
        // Add HTML to PDF using html() method
        await pdf.html(finalElementToUse, {
          callback: (doc: any) => {
            const finalFilename = filename || `${this.sanitizeFilename(title)}.pdf`;
            doc.save(finalFilename);
            this.logger.info('PDF generated successfully with jsPDF', {
              service: 'CardPdfService',
              filename: finalFilename,
            });
            // Clean up temporary elements
            if (styleEl && document.head.contains(styleEl)) {
              document.head.removeChild(styleEl);
            }
            if (tempDiv && document.body.contains(tempDiv)) {
              document.body.removeChild(tempDiv);
            }
          },
          x: margin,
          y: margin,
          width: pdf.internal.pageSize.getWidth() - margin * 2,
          windowWidth: 800, // Window width for CSS calculations
        });
      } catch (error) {
        // Clean up on error
        if (styleEl && document.head.contains(styleEl)) {
          document.head.removeChild(styleEl);
        }
        if (tempDiv && document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
        throw error;
      }
    } catch (error) {
      this.logger.error('Failed to generate PDF', { service: 'CardPdfService' }, error as Error);
      throw error;
    }
  }

  /**
   * Sanitize filename by removing invalid characters
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100); // Limit length
  }
}
