/**
 * Card PDF HTML2PDF Service
 *
 * Service for generating PDFs using html2pdf.js library.
 * Provides superior CSS replication compared to jsPDF's html() method.
 * Uses html2canvas to capture visual appearance of cards (including Shadow DOM).
 *
 * @dependencies
 * - html2pdf.js: Optional dependency for PDF generation
 * - html2canvas: Used by html2pdf.js for DOM to canvas conversion
 * - LoggerService: For logging PDF generation operations
 *
 * @example
 * ```typescript
 * const html2pdfService = inject(CardPdfHtml2PdfService);
 *
 * await html2pdfService.generatePdf(card, {
 *   format: 'a4',
 *   orientation: 'portrait',
 *   cardElement: cardElement
 * });
 * ```
 */

import { inject, Injectable } from '@angular/core';
import { AICardConfig } from '../models';
import { LoggerService } from './logger.service';
import { generateCardHtml } from '../utils/card-pdf-html-generator.util';
import { generateCardPdfStyles } from '../utils/card-pdf-styles.util';
import { CardPdfExportOptions } from './card-pdf.service';
import { sendDebugLog } from '../utils/debug-log.util';
import { normalizeStylesForPdf, getColorProperties } from '../utils/pdf-style-normalizer.util';
import {
  normalizeColorForPdf,
  normalizeComplexColorValue,
  isUnsupportedColorFunction,
} from '../utils/color-conversion.util';

const COLOR_PROPERTIES = getColorProperties();

/**
 * html2pdf.js type definitions (minimal)
 */
interface Html2PdfOptions {
  margin?: number | [number, number, number, number];
  filename?: string;
  image?: {
    type?: string;
    quality?: number;
  };
  html2canvas?: {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    letterRendering?: boolean;
    allowTaint?: boolean;
    onclone?: (clonedDoc: Document, element: HTMLElement) => void;
  };
  jsPDF?: {
    unit?: string;
    format?: string | [number, number];
    orientation?: 'portrait' | 'landscape';
  };
  pagebreak?: {
    mode?: string[];
    before?: string;
    after?: string;
    avoid?: string;
  };
}

interface Html2PdfBuilder {
  set(options: Html2PdfOptions): Html2PdfBuilder;
  from(element: HTMLElement): Html2PdfBuilder;
  save(): Promise<void>;
}

type Html2PdfFunction = () => Html2PdfBuilder;

/**
 * Extract the card element from Shadow DOM for PDF generation
 */
function extractCardElementFromShadowDom(cardElement: HTMLElement): HTMLElement | null {
  // If element has shadow root, get the card surface
  if (cardElement.shadowRoot) {
    const cardSurface = cardElement.shadowRoot.querySelector('.ai-card-surface') as HTMLElement;
    if (cardSurface) {
      return cardSurface;
    }
    // Fallback to first child if card-surface not found
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
 * Clone element with styles for PDF generation
 * This ensures all computed styles are preserved
 */
function cloneElementWithStyles(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;

  // Copy computed styles
  const computedStyles = window.getComputedStyle(element);
  const style = clone.style;

  // Copy important style properties
  const importantProps = [
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
    'max-height',
    'padding',
    'margin',
    'background-color',
    'background-image',
    'color',
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'border',
    'border-radius',
    'box-shadow',
    'display',
    'flex-direction',
    'flex-wrap',
    'align-items',
    'justify-content',
    'grid-template-columns',
    'grid-template-rows',
    'gap',
  ];

  for (const prop of importantProps) {
    const value = computedStyles.getPropertyValue(prop);
    if (value) {
      style.setProperty(prop, value, computedStyles.getPropertyPriority(prop));
    }
  }

  return clone;
}

/**
 * Card PDF HTML2PDF Service
 *
 * Generates PDF files using html2pdf.js for superior CSS replication.
 * Works with Shadow DOM by extracting content from shadow root.
 */
@Injectable({
  providedIn: 'root',
})
export class CardPdfHtml2PdfService {
  private readonly logger = inject(LoggerService);
  private html2pdfCache: Html2PdfFunction | null = null;

  /**
   * Load html2pdf.js dynamically
   * Uses a runtime-constructed module name to prevent Vite from statically analyzing the import
   * This prevents build-time errors when html2pdf.js is an optional dependency
   */
  private async loadHtml2Pdf(): Promise<Html2PdfFunction> {
    // #region agent log
    sendDebugLog(
      {
        location: 'card-pdf-html2pdf.service.ts:148',
        message: 'loadHtml2Pdf called',
        data: { hasCache: !!this.html2pdfCache },
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      },
      'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
    );
    console.log('[PDF Export] loadHtml2Pdf called', { hasCache: !!this.html2pdfCache });
    // #endregion
    if (this.html2pdfCache) {
      // #region agent log
      sendDebugLog(
        {
          location: 'card-pdf-html2pdf.service.ts:150',
          message: 'Returning cached html2pdf',
          data: {},
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
        },
        'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
      );
      // #endregion
      return this.html2pdfCache;
    }

    // html2pdf.js is a UMD bundle, so we need to load it differently
    // First try ES module import (works if Vite processes it)
    // Fall back to script tag loading if import fails
    let html2pdf: any;

    try {
      // #region agent log
      sendDebugLog(
        {
          location: 'card-pdf-html2pdf.service.ts:162',
          message: 'Attempting ES module import of html2pdf.js',
          data: {},
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        },
        'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
      );
      // #endregion

      // Try ES module import first - Vite should process this since it's in allowedCommonJsDependencies
      // Don't use @vite-ignore - we want Vite to process and bundle it
      const html2pdfModule = (await import('html2pdf.js')) as any;

      // #region agent log
      sendDebugLog(
        {
          location: 'card-pdf-html2pdf.service.ts:168',
          message: 'ES module import succeeded',
          data: {
            hasModule: !!html2pdfModule,
            hasDefault: !!html2pdfModule?.default,
            moduleKeys: html2pdfModule ? Object.keys(html2pdfModule).slice(0, 5) : [],
          },
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        },
        'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
      );
      // #endregion

      // Extract html2pdf function from module
      html2pdf = html2pdfModule.default || html2pdfModule.html2pdf || html2pdfModule;
    } catch (importError) {
      // #region agent log
      sendDebugLog(
        {
          location: 'card-pdf-html2pdf.service.ts:175',
          message: 'ES module import failed, trying script tag',
          data: {
            errorMessage: importError instanceof Error ? importError.message : String(importError),
          },
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        },
        'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
      );
      // #endregion

      // Fall back to script tag loading for UMD bundle
      // Check if already loaded globally
      if (typeof (window as any).html2pdf !== 'undefined') {
        // #region agent log
        sendDebugLog(
          {
            location: 'card-pdf-html2pdf.service.ts:180',
            message: 'html2pdf found in global scope',
            data: {},
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'E',
          },
          'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
        );
        // #endregion
        html2pdf = (window as any).html2pdf;
      } else {
        // Load via script tag
        // #region agent log
        sendDebugLog(
          {
            location: 'card-pdf-html2pdf.service.ts:185',
            message: 'Loading html2pdf.js via script tag',
            data: {},
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'E',
          },
          'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
        );
        // #endregion

        await this.loadHtml2PdfScript();
        html2pdf = (window as any).html2pdf;
      }
    }

    // #region agent log
    sendDebugLog(
      {
        location: 'card-pdf-html2pdf.service.ts:192',
        message: 'html2pdf function extracted',
        data: { hasHtml2pdf: !!html2pdf, isFunction: typeof html2pdf === 'function' },
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E',
      },
      'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
    );
    // #endregion

    if (!html2pdf || typeof html2pdf !== 'function') {
      // #region agent log
      sendDebugLog(
        {
          location: 'card-pdf-html2pdf.service.ts:177',
          message: 'html2pdf not a function',
          data: { html2pdfType: typeof html2pdf, hasHtml2pdf: !!html2pdf },
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        },
        'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
      );
      // #endregion
      throw new Error('html2pdf.js not available or invalid');
    }

    this.html2pdfCache = html2pdf as Html2PdfFunction;

    // #region agent log
    sendDebugLog(
      {
        location: 'card-pdf-html2pdf.service.ts:183',
        message: 'html2pdf loaded successfully',
        data: { isFunction: typeof this.html2pdfCache === 'function' },
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E',
      },
      'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
    );
    // #endregion

    return this.html2pdfCache;
  }

  /**
   * Load html2pdf.js via script tag (fallback for UMD bundle)
   * Uses CDN as fallback since Vite doesn't serve node_modules directly
   */
  private loadHtml2PdfScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof (window as any).html2pdf !== 'undefined') {
        resolve();
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[data-html2pdf]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () =>
          reject(new Error('Failed to load html2pdf.js script'))
        );
        return;
      }

      // Create script tag to load UMD bundle from CDN
      // Using jsDelivr CDN as fallback since Vite doesn't serve node_modules directly
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.setAttribute('data-html2pdf', 'true');
      script.src = 'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.3/dist/html2pdf.bundle.min.js';

      script.onload = () => {
        // #region agent log
        sendDebugLog(
          {
            location: 'card-pdf-html2pdf.service.ts:loadHtml2PdfScript',
            message: 'Script tag loaded successfully from CDN',
            data: { hasGlobal: typeof (window as any).html2pdf !== 'undefined' },
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'E',
          },
          'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
        );
        // #endregion

        if (typeof (window as any).html2pdf === 'undefined') {
          reject(new Error('html2pdf.js script loaded but not available in global scope'));
        } else {
          resolve();
        }
      };

      script.onerror = () => {
        // #region agent log
        sendDebugLog(
          {
            location: 'card-pdf-html2pdf.service.ts:loadHtml2PdfScript',
            message: 'Script tag load failed from CDN',
            data: {},
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'E',
          },
          'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
        );
        // #endregion
        reject(
          new Error('Failed to load html2pdf.js from CDN. Please check your internet connection.')
        );
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Check if html2pdf.js is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.loadHtml2Pdf();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate PDF from card configuration using html2pdf.js
   * @param card - Card configuration to export
   * @param options - PDF export options
   */
  async generatePdf(card: AICardConfig, options: CardPdfExportOptions = {}): Promise<void> {
    // #region agent log
    sendDebugLog(
      {
        location: 'card-pdf-html2pdf.service.ts:generatePdf:ENTRY',
        message: 'generatePdf called',
        data: {
          hasCard: !!card,
          hasOptions: !!options,
          hasCardElement: !!options.cardElement,
          cardTitle: card?.cardTitle,
        },
        sessionId: 'debug-session',
        runId: 'pdf-export-debug',
        hypothesisId: 'A',
      },
      'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
    );
    console.log('[PDF Export] generatePdf called', {
      hasCard: !!card,
      hasOptions: !!options,
      hasCardElement: !!options.cardElement,
      cardTitle: card?.cardTitle,
    });
    // #endregion
    try {
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

      this.logger.info('Generating PDF with html2pdf.js', {
        service: 'CardPdfHtml2PdfService',
        cardTitle: card.cardTitle,
        theme,
        format,
        hasCardElement: !!cardElement,
      });

      let elementToUse: HTMLElement;

      // If card element provided, use it directly (html2canvas handles Shadow DOM)
      if (cardElement) {
        const extractedElement = extractCardElementFromShadowDom(cardElement);
        if (extractedElement) {
          elementToUse = extractedElement;
        } else {
          // Fallback: create element from HTML
          elementToUse = this.createElementFromHtml(card, theme);
        }
      } else {
        // Generate HTML from config
        elementToUse = this.createElementFromHtml(card, theme);
      }

      // CRITICAL FIX: html2canvas reads from document stylesheets and encounters color functions
      // Solution: Inline ALL computed styles on element BEFORE html2canvas processes it
      // This ensures html2canvas sees rgb/rgba values (from computed styles) instead of color functions
      // We inline styles directly on the element (not a clone) to ensure html2canvas uses them

      // #region agent log
      sendDebugLog(
        {
          location: 'card-pdf-html2pdf.service.ts:generatePdf:BEFORE_INLINE',
          message: 'Preparing element for PDF generation',
          data: {
            elementTag: elementToUse.tagName,
            isConnected: elementToUse.isConnected,
            hasChildren: elementToUse.children.length > 0,
          },
          sessionId: 'debug-session',
          runId: 'pdf-export-debug',
          hypothesisId: 'H1',
        },
        'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
      );
      // #endregion

      // Ensure element is in DOM for computed styles
      let tempContainer: HTMLElement | null = null;
      const wasInDom = elementToUse.isConnected;
      if (!wasInDom) {
        try {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:CREATING_TEMP_CONTAINER',
              message: 'Element not in DOM, creating temp container',
              data: {},
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H7',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          tempContainer = document.createElement('div');
          tempContainer.style.position = 'absolute';
          tempContainer.style.visibility = 'hidden';
          tempContainer.style.top = '-9999px';
          tempContainer.style.left = '-9999px';
          tempContainer.style.width = '800px';
          document.body.appendChild(tempContainer);
          tempContainer.appendChild(elementToUse);
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:TEMP_CONTAINER_CREATED',
              message: 'Temp container created and element added',
              data: { isNowConnected: elementToUse.isConnected },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H7',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
        } catch (containerError) {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:TEMP_CONTAINER_ERROR',
              message: 'Error creating temp container',
              data: {
                errorMessage:
                  containerError instanceof Error ? containerError.message : String(containerError),
              },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H7',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          throw containerError;
        }
      }

      // Force a reflow to ensure styles are computed
      try {
        void elementToUse.offsetHeight;
        // #region agent log
        sendDebugLog(
          {
            location: 'card-pdf-html2pdf.service.ts:generatePdf:REFLOW_FORCED',
            message: 'Reflow forced, styles should be computed',
            data: { offsetHeight: elementToUse.offsetHeight },
            sessionId: 'debug-session',
            runId: 'pdf-export-debug',
            hypothesisId: 'H1',
          },
          'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
        );
        // #endregion
      } catch (reflowError) {
        // #region agent log
        sendDebugLog(
          {
            location: 'card-pdf-html2pdf.service.ts:generatePdf:REFLOW_ERROR',
            message: 'Error forcing reflow',
            data: {
              errorMessage:
                reflowError instanceof Error ? reflowError.message : String(reflowError),
            },
            sessionId: 'debug-session',
            runId: 'pdf-export-debug',
            hypothesisId: 'H1',
          },
          'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
        );
        // #endregion
      }

      // Inline ALL computed styles directly on the element
      // Browser's computed styles have color functions already resolved to rgb/rgba
      // By inlining with !important, we ensure html2canvas uses these instead of parsing stylesheets
      try {
        // #region agent log
        sendDebugLog(
          {
            location: 'card-pdf-html2pdf.service.ts:generatePdf:INLINING_STYLES_START',
            message: 'Starting to inline all computed styles',
            data: {},
            sessionId: 'debug-session',
            runId: 'pdf-export-debug',
            hypothesisId: 'H2',
          },
          'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
        );
        // #endregion
        this.inlineAllComputedStyles(elementToUse, elementToUse);
        // #region agent log
        sendDebugLog(
          {
            location: 'card-pdf-html2pdf.service.ts:generatePdf:INLINING_STYLES_COMPLETE',
            message: 'All computed styles inlined successfully',
            data: {},
            sessionId: 'debug-session',
            runId: 'pdf-export-debug',
            hypothesisId: 'H2',
          },
          'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
        );
        // #endregion
      } catch (inlineError) {
        // #region agent log
        sendDebugLog(
          {
            location: 'card-pdf-html2pdf.service.ts:generatePdf:INLINING_STYLES_ERROR',
            message: 'Error inlining computed styles',
            data: {
              errorMessage:
                inlineError instanceof Error ? inlineError.message : String(inlineError),
              errorStack: inlineError instanceof Error ? inlineError.stack : undefined,
            },
            sessionId: 'debug-session',
            runId: 'pdf-export-debug',
            hypothesisId: 'H2',
          },
          'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
        );
        // #endregion
        // Continue anyway - might still work
        console.warn('[PDF Export] Error inlining styles:', inlineError);
      }

      // Use the element directly (with all styles inlined)
      const elementForPdf = elementToUse;

      // Generate PDF using html2canvas directly (not through html2pdf.js)
      // This gives us full control over the onclone callback to remove stylesheets
      // #region agent log
      sendDebugLog(
        {
          location: 'card-pdf-html2pdf.service.ts:generatePdf:BEFORE_HTML2CANVAS',
          message: 'Using html2canvas directly with onclone',
          data: { hasElementForPdf: !!elementForPdf, elementTag: elementForPdf?.tagName },
          sessionId: 'debug-session',
          runId: 'pdf-export-debug',
          hypothesisId: 'I',
        },
        'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
      );
      // #endregion

      try {
        // Import html2canvas and jsPDF directly for better control
        // This allows us to use html2canvas's onclone callback properly
        let html2canvas: any;
        let JsPDF: any;

        try {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:IMPORTING_HTML2CANVAS',
              message: 'Importing html2canvas module',
              data: {},
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H3',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          const html2canvasModule = await import('html2canvas');
          html2canvas = html2canvasModule.default || html2canvasModule;
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:HTML2CANVAS_IMPORTED',
              message: 'html2canvas imported',
              data: {
                hasDefault: !!html2canvasModule.default,
                hasModule: !!html2canvasModule,
                isFunction: typeof html2canvas === 'function',
              },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H3',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
        } catch (html2canvasImportError) {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:HTML2CANVAS_IMPORT_ERROR',
              message: 'Error importing html2canvas',
              data: {
                errorMessage:
                  html2canvasImportError instanceof Error
                    ? html2canvasImportError.message
                    : String(html2canvasImportError),
                errorStack:
                  html2canvasImportError instanceof Error
                    ? html2canvasImportError.stack
                    : undefined,
              },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H3',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          throw new Error(
            `Failed to import html2canvas: ${html2canvasImportError instanceof Error ? html2canvasImportError.message : String(html2canvasImportError)}`
          );
        }

        try {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:IMPORTING_JSPDF',
              message: 'Importing jsPDF module',
              data: {},
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H4',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          const jsPDFModule = await import('jspdf');
          // jsPDF exports as { jsPDF: class, ... } or default export
          JsPDF = (jsPDFModule as any).jsPDF || jsPDFModule.default || jsPDFModule;
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:JSPDF_IMPORTED',
              message: 'jsPDF imported',
              data: {
                hasJsPDF: !!(jsPDFModule as any).jsPDF,
                hasDefault: !!jsPDFModule.default,
                hasModule: !!jsPDFModule,
                hasJsPDFClass: !!JsPDF,
              },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H4',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
        } catch (jsPDFImportError) {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:JSPDF_IMPORT_ERROR',
              message: 'Error importing jsPDF',
              data: {
                errorMessage:
                  jsPDFImportError instanceof Error
                    ? jsPDFImportError.message
                    : String(jsPDFImportError),
                errorStack: jsPDFImportError instanceof Error ? jsPDFImportError.stack : undefined,
              },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H4',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          throw new Error(
            `Failed to import jsPDF: ${jsPDFImportError instanceof Error ? jsPDFImportError.message : String(jsPDFImportError)}`
          );
        }

        if (!html2canvas || typeof html2canvas !== 'function') {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:HTML2CANVAS_INVALID',
              message: 'html2canvas is not a function',
              data: { html2canvasType: typeof html2canvas, hasHtml2Canvas: !!html2canvas },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H3',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          throw new Error('html2canvas not available or not a function');
        }
        if (!JsPDF) {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:JSPDF_INVALID',
              message: 'jsPDF class not available',
              data: { hasJsPDF: !!JsPDF },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H4',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          throw new Error('jsPDF not available');
        }

        // #region agent log
        sendDebugLog(
          {
            location: 'card-pdf-html2pdf.service.ts:generatePdf:HTML2CANVAS_LOADED',
            message: 'html2canvas and jsPDF loaded and validated',
            data: { hasHtml2Canvas: !!html2canvas, hasJsPDF: !!JsPDF },
            sessionId: 'debug-session',
            runId: 'pdf-export-debug',
            hypothesisId: 'H3',
          },
          'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
        );
        // #endregion

        // Use html2canvas with onclone to remove stylesheets
        // This is the key fix - remove stylesheets from cloned document so html2canvas can't parse them
        let canvas: HTMLCanvasElement;
        try {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:CALLING_HTML2CANVAS',
              message: 'Calling html2canvas',
              data: {
                elementTag: elementForPdf.tagName,
                isConnected: elementForPdf.isConnected,
                hasChildren: elementForPdf.children.length > 0,
              },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H5',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          canvas = await html2canvas(elementForPdf, {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: false,
            onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
              try {
                // #region agent log
                sendDebugLog(
                  {
                    location: 'card-pdf-html2pdf.service.ts:html2canvas:onclone:ENTRY',
                    message: 'html2canvas onclone executing',
                    data: { hasClonedDoc: !!clonedDoc, hasClonedElement: !!clonedElement },
                    sessionId: 'debug-session',
                    runId: 'pdf-export-debug',
                    hypothesisId: 'H8',
                  },
                  'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
                );
                // #endregion

                // Remove ALL stylesheets from cloned document
                // This prevents html2canvas from parsing stylesheets with color functions
                const stylesheets = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
                const styleTags = clonedDoc.querySelectorAll('style');

                // #region agent log
                sendDebugLog(
                  {
                    location: 'card-pdf-html2pdf.service.ts:html2canvas:onclone:REMOVING',
                    message: 'Removing stylesheets from cloned document',
                    data: { stylesheetCount: stylesheets.length, styleTagCount: styleTags.length },
                    sessionId: 'debug-session',
                    runId: 'pdf-export-debug',
                    hypothesisId: 'H8',
                  },
                  'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
                );
                // #endregion

                stylesheets.forEach((link) => link.remove());
                styleTags.forEach((style) => style.remove());

                // #region agent log
                sendDebugLog(
                  {
                    location: 'card-pdf-html2pdf.service.ts:html2canvas:onclone:COMPLETED',
                    message: 'Stylesheets removed from cloned document',
                    data: {
                      remainingStylesheets:
                        clonedDoc.querySelectorAll('link[rel="stylesheet"]').length,
                      remainingStyleTags: clonedDoc.querySelectorAll('style').length,
                    },
                    sessionId: 'debug-session',
                    runId: 'pdf-export-debug',
                    hypothesisId: 'H8',
                  },
                  'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
                );
                // #endregion
              } catch (cloneError) {
                // #region agent log
                sendDebugLog(
                  {
                    location: 'card-pdf-html2pdf.service.ts:html2canvas:onclone:ERROR',
                    message: 'Error in html2canvas onclone',
                    data: {
                      errorMessage:
                        cloneError instanceof Error ? cloneError.message : String(cloneError),
                      errorStack: cloneError instanceof Error ? cloneError.stack : undefined,
                    },
                    sessionId: 'debug-session',
                    runId: 'pdf-export-debug',
                    hypothesisId: 'H8',
                  },
                  'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
                );
                // #endregion
              }
            },
          });
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:CANVAS_CREATED',
              message: 'Canvas created from html2canvas',
              data: { canvasWidth: canvas.width, canvasHeight: canvas.height, hasCanvas: !!canvas },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H5',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
        } catch (canvasError) {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:CANVAS_ERROR',
              message: 'Error creating canvas with html2canvas',
              data: {
                errorMessage:
                  canvasError instanceof Error ? canvasError.message : String(canvasError),
                errorStack: canvasError instanceof Error ? canvasError.stack : undefined,
                errorName: canvasError instanceof Error ? canvasError.name : typeof canvasError,
              },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H5',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          throw new Error(
            `Failed to create canvas: ${canvasError instanceof Error ? canvasError.message : String(canvasError)}`
          );
        }

        // Convert canvas to image and create PDF with jsPDF
        let imgData: string;
        try {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:CONVERTING_CANVAS',
              message: 'Converting canvas to image data',
              data: { canvasWidth: canvas.width, canvasHeight: canvas.height },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H6',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          imgData = canvas.toDataURL('image/jpeg', 0.98);
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:IMAGE_DATA_CREATED',
              message: 'Image data created from canvas',
              data: { imgDataLength: imgData.length, imgDataPrefix: imgData.substring(0, 50) },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H6',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
        } catch (imgDataError) {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:IMAGE_DATA_ERROR',
              message: 'Error converting canvas to image data',
              data: {
                errorMessage:
                  imgDataError instanceof Error ? imgDataError.message : String(imgDataError),
              },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H6',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          throw new Error(
            `Failed to convert canvas to image: ${imgDataError instanceof Error ? imgDataError.message : String(imgDataError)}`
          );
        }

        let pdf: any;
        try {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:CREATING_PDF',
              message: 'Creating jsPDF instance',
              data: { format, orientation, unit: 'mm' },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H4',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          pdf = new JsPDF({
            unit: 'mm',
            format: format,
            orientation: orientation,
          });
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:PDF_CREATED',
              message: 'jsPDF instance created',
              data: { hasPdf: !!pdf, hasInternal: !!pdf?.internal },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H4',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
        } catch (pdfCreateError) {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:PDF_CREATE_ERROR',
              message: 'Error creating jsPDF instance',
              data: {
                errorMessage:
                  pdfCreateError instanceof Error ? pdfCreateError.message : String(pdfCreateError),
                errorStack: pdfCreateError instanceof Error ? pdfCreateError.stack : undefined,
              },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H4',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          throw new Error(
            `Failed to create PDF: ${pdfCreateError instanceof Error ? pdfCreateError.message : String(pdfCreateError)}`
          );
        }

        try {
          const imgWidth = pdf.internal.pageSize.getWidth();
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:ADDING_IMAGE',
              message: 'Adding image to PDF',
              data: {
                imgWidth,
                imgHeight,
                margin,
                calculatedWidth: imgWidth - margin * 2,
                calculatedHeight: imgHeight - margin * 2,
              },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H6',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          pdf.addImage(
            imgData,
            'JPEG',
            margin,
            margin,
            imgWidth - margin * 2,
            imgHeight - margin * 2
          );
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:IMAGE_ADDED',
              message: 'Image added to PDF successfully',
              data: {},
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H6',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
        } catch (addImageError) {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:ADD_IMAGE_ERROR',
              message: 'Error adding image to PDF',
              data: {
                errorMessage:
                  addImageError instanceof Error ? addImageError.message : String(addImageError),
              },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H6',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          throw new Error(
            `Failed to add image to PDF: ${addImageError instanceof Error ? addImageError.message : String(addImageError)}`
          );
        }

        try {
          const finalFilename = filename || `${this.sanitizeFilename(title)}.pdf`;
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:SAVING_PDF',
              message: 'Saving PDF file',
              data: { filename: finalFilename },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H6',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          pdf.save(finalFilename);
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:PDF_SAVED',
              message: 'PDF saved successfully',
              data: { filename: finalFilename },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H6',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
        } catch (saveError) {
          // #region agent log
          sendDebugLog(
            {
              location: 'card-pdf-html2pdf.service.ts:generatePdf:PDF_SAVE_ERROR',
              message: 'Error saving PDF file',
              data: {
                errorMessage: saveError instanceof Error ? saveError.message : String(saveError),
              },
              sessionId: 'debug-session',
              runId: 'pdf-export-debug',
              hypothesisId: 'H6',
            },
            'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
          );
          // #endregion
          throw new Error(
            `Failed to save PDF: ${saveError instanceof Error ? saveError.message : String(saveError)}`
          );
        }
      } finally {
        // Clean up the temporary container if we created it
        if (tempContainer && tempContainer.parentNode === document.body) {
          document.body.removeChild(tempContainer);
        }
      }

      this.logger.info('PDF generated successfully with html2pdf.js', {
        service: 'CardPdfHtml2PdfService',
        filename: filename || `${this.sanitizeFilename(title)}.pdf`,
      });
    } catch (error) {
      // #region agent log
      sendDebugLog(
        {
          location: 'card-pdf-html2pdf.service.ts:generatePdf:ERROR',
          message: 'Error during PDF generation',
          data: {
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
          },
          sessionId: 'debug-session',
          runId: 'pdf-export-debug',
          hypothesisId: 'E',
        },
        'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
      );
      // #endregion
      this.logger.error(
        'Failed to generate PDF with html2pdf.js',
        { service: 'CardPdfHtml2PdfService' },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Create DOM element from card HTML
   */
  private createElementFromHtml(card: AICardConfig, theme: 'day' | 'night'): HTMLElement {
    const html = generateCardHtml(card, theme);
    const styles = generateCardPdfStyles(theme);

    // Create container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px'; // Fixed width for consistent rendering
    document.body.appendChild(container);

    // Create style element
    const styleEl = document.createElement('style');
    styleEl.textContent = styles.replace(/<style>|<\/style>/g, '').trim();
    container.appendChild(styleEl);

    // Set HTML content
    container.innerHTML += html;

    const cardElement = container.querySelector(
      '.card-pdf-container, .ai-card-surface'
    ) as HTMLElement;
    const elementToUse = cardElement || (container.firstElementChild as HTMLElement);

    if (!elementToUse) {
      document.body.removeChild(container);
      throw new Error('Failed to create card element from HTML');
    }

    // Return the element (container will be cleaned up after PDF generation)
    // Note: html2pdf.js will handle the element, so we keep container in DOM
    return elementToUse;
  }

  /**
   * Inline all computed styles from source element to target element
   * This ensures html2canvas only sees inline styles (with normalized colors)
   * instead of parsing stylesheets with unsupported color functions
   *
   * CRITICAL: This must inline ALL properties that might contain colors,
   * not just color-specific properties, because html2canvas reads from stylesheets
   */
  private inlineAllComputedStyles(targetElement: HTMLElement, sourceElement: HTMLElement): void {
    // #region agent log
    sendDebugLog(
      {
        location: 'card-pdf-html2pdf.service.ts:inlineAllComputedStyles:ENTRY',
        message: 'inlineAllComputedStyles called',
        data: {
          hasTargetElement: !!targetElement,
          hasSourceElement: !!sourceElement,
          targetTag: targetElement?.tagName,
          sourceTag: sourceElement?.tagName,
        },
        sessionId: 'debug-session',
        runId: 'pdf-export-debug',
        hypothesisId: 'C',
      },
      'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
    );
    // #endregion
    try {
      // Get computed styles from source (in main document with stylesheets)
      // These will have color functions already resolved to rgb/rgba by the browser
      const sourceComputed = window.getComputedStyle(sourceElement);
      const targetStyle = targetElement.style;

      // Get all CSS properties from computed style
      // CRITICAL: We must inline ALL properties that might contain colors
      // This includes complex properties like background (gradients), box-shadow, etc.
      // html2canvas reads from stylesheets, so we need to inline everything with !important
      const allProperties = [
        // Color properties (MUST be inlined - html2canvas reads these from stylesheets)
        'color',
        'background-color',
        'background', // Can contain gradients with color-mix()
        'background-image', // Can contain gradients with color-mix()
        'background-position',
        'background-size',
        'background-repeat',
        'border-color',
        'border-top-color',
        'border-right-color',
        'border-bottom-color',
        'border-left-color',
        'border',
        'border-top',
        'border-right',
        'border-bottom',
        'border-left',
        'border-width',
        'border-style',
        'outline-color',
        'outline',
        'outline-width',
        'outline-style',
        'box-shadow', // CRITICAL: Can contain color-mix() - found in _card-skeleton.scss
        'text-shadow',
        'filter', // Can contain drop-shadow with color-mix()
        'fill',
        'stroke',
        'stop-color',
        // Layout properties (important for PDF rendering)
        'width',
        'height',
        'min-width',
        'min-height',
        'max-width',
        'max-height',
        'padding',
        'padding-top',
        'padding-right',
        'padding-bottom',
        'padding-left',
        'margin',
        'margin-top',
        'margin-right',
        'margin-bottom',
        'margin-left',
        'display',
        'position',
        'top',
        'right',
        'bottom',
        'left',
        'flex-direction',
        'flex-wrap',
        'align-items',
        'justify-content',
        'gap',
        'grid-template-columns',
        'grid-template-rows',
        'grid-gap',
        // Typography
        'font-family',
        'font-size',
        'font-weight',
        'line-height',
        'text-align',
        // Other visual properties
        'border-radius',
        'opacity',
        'transform',
        'z-index',
      ];

      // Inline all computed styles
      // CRITICAL: Browser's computed styles already have color functions resolved to rgb/rgba
      // By inlining these, we ensure html2canvas sees rgb/rgba values, not color functions
      let colorPropertiesInlined = 0;
      let colorFunctionsFound = 0;
      let colorFunctionsNormalized = 0;
      let totalPropertiesInlined = 0;

      for (const property of allProperties) {
        try {
          const computedValue = sourceComputed.getPropertyValue(property);
          if (computedValue && computedValue.trim() !== 'none' && computedValue.trim() !== '') {
            totalPropertiesInlined++;

            // For color properties, check if computed value still contains color functions
            // (shouldn't happen, but check anyway)
            if (COLOR_PROPERTIES.includes(property as any)) {
              colorPropertiesInlined++;

              // Check if computed value still contains unsupported color functions
              // This shouldn't happen (browser resolves them), but handle it
              if (isUnsupportedColorFunction(computedValue)) {
                colorFunctionsFound++;
                // Normalize the color function
                const normalized = this.normalizeColorValue(computedValue, sourceElement);
                if (normalized !== computedValue && !isUnsupportedColorFunction(normalized)) {
                  colorFunctionsNormalized++;
                }
                // Inline the normalized value with !important to override stylesheets
                targetStyle.setProperty(property, normalized, 'important');
              } else {
                // Computed value is already rgb/rgba - inline it directly
                // The !important flag ensures html2canvas uses this instead of stylesheets
                targetStyle.setProperty(property, computedValue, 'important');
              }
            } else {
              // For non-color properties, inline as-is
              // But check complex values (like gradients, box-shadow) for color functions
              if (isUnsupportedColorFunction(computedValue)) {
                // This property contains a color function - normalize it
                const normalized = normalizeComplexColorValue(computedValue, sourceElement);
                targetStyle.setProperty(property, normalized, 'important');
              } else {
                targetStyle.setProperty(property, computedValue, 'important');
              }
            }
          }
        } catch (propError) {
          // Skip this property if there's an error
        }
      }
      // #region agent log
      sendDebugLog(
        {
          location: 'card-pdf-html2pdf.service.ts:inlineAllComputedStyles:PROPERTIES_INLINED',
          message: 'Properties inlined',
          data: {
            totalPropertiesInlined,
            colorPropertiesInlined,
            colorFunctionsFound,
            colorFunctionsNormalized,
          },
          sessionId: 'debug-session',
          runId: 'pdf-export-debug',
          hypothesisId: 'C',
        },
        'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
      );
      // #endregion

      // Recursively inline styles for child elements
      // CRITICAL: We must inline styles for ALL descendants, not just direct children
      // html2canvas reads styles for all elements, so all must have inlined styles
      const sourceChildren = sourceElement.querySelectorAll('*');
      const targetChildren = targetElement.querySelectorAll('*');
      const childCount = Math.min(sourceChildren.length, targetChildren.length);
      // #region agent log
      sendDebugLog(
        {
          location: 'card-pdf-html2pdf.service.ts:inlineAllComputedStyles:RECURSING',
          message: 'Recursing to child elements',
          data: {
            childCount,
            sourceChildrenCount: sourceChildren.length,
            targetChildrenCount: targetChildren.length,
          },
          sessionId: 'debug-session',
          runId: 'pdf-export-debug',
          hypothesisId: 'C',
        },
        'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
      );
      // #endregion

      let childrenProcessed = 0;
      for (let i = 0; i < childCount; i++) {
        const sourceChild = sourceChildren[i] as HTMLElement;
        const targetChild = targetChildren[i] as HTMLElement;

        if (sourceChild instanceof HTMLElement && targetChild instanceof HTMLElement) {
          this.inlineAllComputedStyles(targetChild, sourceChild);
          childrenProcessed++;
        }
      }
      // #region agent log
      sendDebugLog(
        {
          location: 'card-pdf-html2pdf.service.ts:inlineAllComputedStyles:CHILDREN_PROCESSED',
          message: 'Child elements processed',
          data: { childrenProcessed },
          sessionId: 'debug-session',
          runId: 'pdf-export-debug',
          hypothesisId: 'C',
        },
        'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
      );
      // #endregion
      // #region agent log
      sendDebugLog(
        {
          location: 'card-pdf-html2pdf.service.ts:inlineAllComputedStyles:COMPLETED',
          message: 'inlineAllComputedStyles completed',
          data: {},
          sessionId: 'debug-session',
          runId: 'pdf-export-debug',
          hypothesisId: 'C',
        },
        'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
      );
      // #endregion
    } catch (error) {
      // #region agent log
      sendDebugLog(
        {
          location: 'card-pdf-html2pdf.service.ts:inlineAllComputedStyles:ERROR',
          message: 'Error inlining computed styles',
          data: { errorMessage: error instanceof Error ? error.message : String(error) },
          sessionId: 'debug-session',
          runId: 'pdf-export-debug',
          hypothesisId: 'C',
        },
        'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a'
      );
      // #endregion
      console.warn('[PDF Export] Error inlining computed styles:', error);
    }
  }

  /**
   * Normalize a single color value for PDF
   */
  private normalizeColorValue(value: string, element: HTMLElement): string {
    if (isUnsupportedColorFunction(value)) {
      // Try simple normalization first
      const normalized = normalizeColorForPdf(value, element);
      if (normalized !== value && !isUnsupportedColorFunction(normalized)) {
        return normalized;
      }
      // Try complex normalization
      return normalizeComplexColorValue(value, element);
    }

    return value;
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
