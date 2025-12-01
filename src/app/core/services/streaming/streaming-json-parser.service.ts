/**
 * Streaming JSON Parser Service
 *
 * Incremental JSON parser for streaming card data.
 * Parses incomplete JSON and extracts available data progressively.
 *
 * @since 2.0.0
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AICardConfig, CardSection } from '../../../models';
import { StreamParseError } from './streaming-errors';

/**
 * Parser state
 */
export type ParserState = 'idle' | 'parsing' | 'partial' | 'complete' | 'error';

/**
 * Parsed result from incremental parsing
 */
export interface ParsedResult {
  /** Current parser state */
  state: ParserState;
  /** Partially or fully parsed card */
  card: Partial<AICardConfig> | null;
  /** Number of complete sections */
  completeSections: number;
  /** Indices of newly completed sections */
  newlyCompletedSections: number[];
  /** Total bytes parsed */
  bytesParsed: number;
  /** Whether card title is complete */
  hasTitleComplete: boolean;
  /** Parse errors encountered */
  errors: StreamParseError[];
}

/**
 * Section parse state tracking
 */
interface SectionParseState {
  index: number;
  isComplete: boolean;
  hasTitle: boolean;
  fieldsComplete: number;
  itemsComplete: number;
  raw: string;
}

/**
 * Streaming JSON Parser Service
 *
 * Incrementally parses JSON for AICardConfig as data streams in.
 * Uses balanced brace detection and partial extraction for incomplete JSON.
 *
 * @example
 * ```typescript
 * const parser = inject(StreamingJsonParser);
 *
 * parser.results$.subscribe(result => {
 *   if (result.card) {
 *     console.log('Partial card:', result.card);
 *   }
 * });
 *
 * // Feed chunks as they arrive
 * parser.feed('{"cardTitle": "Test",');
 * parser.feed('"sections": [{"title": "S1"');
 * parser.feed(', "type": "info"}]}');
 *
 * parser.complete();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class StreamingJsonParser {
  private buffer = '';
  private sectionStates: SectionParseState[] = [];
  private cardTitle = '';
  private lastCompleteSectionCount = 0;

  private readonly stateSubject = new BehaviorSubject<ParserState>('idle');
  private readonly resultSubject = new Subject<ParsedResult>();

  /** Observable of parser state */
  readonly state$ = this.stateSubject.asObservable();

  /** Observable of parse results */
  readonly results$ = this.resultSubject.asObservable();

  /**
   * Reset parser state
   */
  reset(): void {
    this.buffer = '';
    this.sectionStates = [];
    this.cardTitle = '';
    this.lastCompleteSectionCount = 0;
    this.stateSubject.next('idle');
  }

  /**
   * Feed a chunk of JSON data
   * @param chunk The JSON chunk to parse
   * @returns ParsedResult with current state
   */
  feed(chunk: string): ParsedResult {
    this.buffer += chunk;
    this.stateSubject.next('parsing');

    const result = this.parse();
    this.resultSubject.next(result);

    return result;
  }

  /**
   * Mark parsing as complete and return final result
   */
  complete(): ParsedResult {
    const result = this.parse();

    // Try final parse of complete JSON
    if (result.state === 'partial') {
      try {
        const finalCard = JSON.parse(this.buffer) as AICardConfig;
        result.card = finalCard;
        result.state = 'complete';
        result.completeSections = finalCard.sections?.length || 0;
      } catch {
        // Keep partial result
      }
    }

    this.stateSubject.next(result.state);
    this.resultSubject.next(result);

    return result;
  }

  /**
   * Get current buffer contents
   */
  getBuffer(): string {
    return this.buffer;
  }

  /**
   * Get current parse state
   */
  getState(): ParserState {
    return this.stateSubject.value;
  }

  // ============================================
  // Private Methods
  // ============================================

  private parse(): ParsedResult {
    const errors: StreamParseError[] = [];
    const newlyCompletedSections: number[] = [];

    // Try to parse complete JSON first
    try {
      const complete = JSON.parse(this.buffer) as AICardConfig;

      // Mark all sections as newly completed if they weren't before
      const sectionCount = complete.sections?.length || 0;
      for (let i = this.lastCompleteSectionCount; i < sectionCount; i++) {
        newlyCompletedSections.push(i);
      }
      this.lastCompleteSectionCount = sectionCount;

      return {
        state: 'complete',
        card: complete,
        completeSections: sectionCount,
        newlyCompletedSections,
        bytesParsed: this.buffer.length,
        hasTitleComplete: !!complete.cardTitle,
        errors,
      };
    } catch {
      // JSON is incomplete, parse incrementally
    }

    // Extract card title
    this.extractCardTitle();

    // Extract complete sections using balanced brace detection
    const { sections, newlyCompleted } = this.extractCompleteSections();
    newlyCompletedSections.push(...newlyCompleted);

    // Build partial card
    const partialCard: Partial<AICardConfig> = {};

    if (this.cardTitle) {
      partialCard.cardTitle = this.cardTitle;
    }

    if (sections.length > 0) {
      partialCard.sections = sections;
    }

    return {
      state: 'partial',
      card: Object.keys(partialCard).length > 0 ? partialCard : null,
      completeSections: sections.length,
      newlyCompletedSections,
      bytesParsed: this.buffer.length,
      hasTitleComplete: !!this.cardTitle && this.isStringComplete('"cardTitle"'),
      errors,
    };
  }

  private extractCardTitle(): void {
    const titleMatch = this.buffer.match(/"cardTitle"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    if (titleMatch && titleMatch[1]) {
      this.cardTitle = this.unescapeString(titleMatch[1]);
    }
  }

  private extractCompleteSections(): { sections: CardSection[]; newlyCompleted: number[] } {
    const sections: CardSection[] = [];
    const newlyCompleted: number[] = [];

    // Find sections array
    const sectionsMatch = this.buffer.match(/"sections"\s*:\s*\[/);
    if (!sectionsMatch || sectionsMatch.index === undefined) {
      return { sections, newlyCompleted };
    }

    const sectionsStart = sectionsMatch.index + sectionsMatch[0].length;
    const sectionsContent = this.buffer.slice(sectionsStart);

    // Parse individual sections using balanced braces
    let sectionIndex = 0;
    let i = 0;

    while (i < sectionsContent.length) {
      // Skip whitespace and commas
      while (i < sectionsContent.length && /[\s,]/.test(sectionsContent[i] || '')) {
        i++;
      }

      if (i >= sectionsContent.length || sectionsContent[i] === ']') {
        break;
      }

      if (sectionsContent[i] === '{') {
        const { endIndex, json } = this.extractBalancedObject(sectionsContent, i);

        if (endIndex !== -1 && json) {
          try {
            const section = JSON.parse(json) as CardSection;
            const sectionWithId: CardSection = {
              ...section,
              id: section.id ?? `streaming-section-${sectionIndex}`,
            };

            sections.push(sectionWithId);

            // Check if this is newly completed
            if (!this.sectionStates[sectionIndex]?.isComplete) {
              this.sectionStates[sectionIndex] = {
                index: sectionIndex,
                isComplete: true,
                hasTitle: !!section.title,
                fieldsComplete: section.fields?.length || 0,
                itemsComplete: section.items?.length || 0,
                raw: json,
              };
              newlyCompleted.push(sectionIndex);
            }

            i = endIndex + 1;
            sectionIndex++;
          } catch {
            // Section JSON is malformed, skip
            i++;
          }
        } else {
          // Section is incomplete
          break;
        }
      } else {
        i++;
      }
    }

    return { sections, newlyCompleted };
  }

  private extractBalancedObject(
    str: string,
    startIndex: number
  ): { endIndex: number; json: string | null } {
    let braceDepth = 0;
    let inString = false;
    let escapeNext = false;

    for (let j = startIndex; j < str.length; j++) {
      const char = str[j];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === '{') {
        braceDepth++;
      } else if (char === '}') {
        braceDepth--;
        if (braceDepth === 0) {
          return {
            endIndex: j,
            json: str.slice(startIndex, j + 1),
          };
        }
      }
    }

    return { endIndex: -1, json: null };
  }

  private isStringComplete(pattern: string): boolean {
    const match = this.buffer.indexOf(pattern);
    if (match === -1) {
      return false;
    }

    // Find the value after the pattern
    const afterPattern = this.buffer.slice(match + pattern.length);
    const valueMatch = afterPattern.match(/^\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);

    return valueMatch !== null;
  }

  private unescapeString(str: string): string {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

/**
 * Utility function to parse streaming JSON chunks
 * @param chunks Array of JSON chunks
 * @returns Parsed AICardConfig or null
 */
export function parseStreamingChunks(chunks: string[]): AICardConfig | null {
  const parser = new StreamingJsonParser();

  for (const chunk of chunks) {
    parser.feed(chunk);
  }

  const result = parser.complete();
  return result.card as AICardConfig | null;
}

/**
 * RxJS operator for parsing streaming JSON
 */
export function parseStreamingJson() {
  return (source: Observable<string>): Observable<ParsedResult> => {
    return new Observable((observer) => {
      const parser = new StreamingJsonParser();

      const subscription = source.subscribe({
        next: (chunk) => {
          const result = parser.feed(chunk);
          observer.next(result);
        },
        error: (err) => observer.error(err),
        complete: () => {
          const finalResult = parser.complete();
          observer.next(finalResult);
          observer.complete();
        },
      });

      return () => {
        subscription.unsubscribe();
        parser.reset();
      };
    });
  };
}
