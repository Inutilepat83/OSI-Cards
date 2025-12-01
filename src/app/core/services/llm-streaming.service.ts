import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AICardConfig, CardField, CardItem, CardSection } from '../../models';
import { CardChangeType } from 'projects/osi-cards-lib/src/lib/utils/card-diff.util';
import { AppConfigService } from './app-config.service';
import { ensureCardIds } from '../../shared/utils/card-utils';
import { CardTypeGuards } from '../../models';
import { RequestCanceller } from '../../shared/utils/request-cancellation.util';

export interface LLMStreamingState {
  isActive: boolean;
  stage: 'idle' | 'thinking' | 'streaming' | 'complete' | 'aborted' | 'error';
  progress: number; // 0-1
  bufferLength: number;
  targetLength: number;
}

export interface SectionCompletionInfo {
  sectionIndex: number;
  sectionId: string;
  isComplete: boolean;
  completionPercentage: number;
}

/**
 * @ngDoc LLMStreamingService
 * @name LLMStreamingService
 * @description
 * LLM Streaming Service for progressive card generation.
 *
 * Simulates LLM (Large Language Model) streaming behavior for progressive card generation.
 * Provides realistic streaming experience with chunked updates, thinking delays, and
 * progressive section completion. Essential for creating an engaging user experience
 * during card generation.
 *
 * ## Features
 * - Realistic streaming simulation with configurable chunk sizes
 * - Thinking delay simulation before streaming starts
 * - Progressive section completion tracking
 * - Buffer management and JSON parsing
 * - State management with observables
 * - Automatic cleanup and cancellation
 *
 * ## LLM Integration
 * This service is designed to work with LLM APIs that stream JSON responses.
 * It handles the progressive parsing and merging of card data as it arrives.
 *
 * @example
 * ```typescript
 * import { inject } from '@angular/core';
 * import { LLMStreamingService } from './core/services/llm-streaming.service';
 *
 * const streamingService = inject(LLMStreamingService);
 *
 * // Start streaming from LLM response
 * const targetJson = JSON.stringify({
 *   cardTitle: 'Company Profile',
 *   sections: [...]
 * });
 * streamingService.start(targetJson);
 *
 * // Subscribe to card updates as they stream in
 * streamingService.cardUpdates$.subscribe(update => {
 *   console.log('Card updated:', update.card);
 *   console.log('Change type:', update.changeType);
 * });
 *
 * // Subscribe to state changes
 * streamingService.state$.subscribe(state => {
 *   console.log('Streaming state:', state.stage);
 *   console.log('Progress:', state.progress);
 * });
 *
 * // Stop streaming if needed
 * streamingService.stop();
 * ```
 *
 * @see {@link AgentService} for LLM agent integration
 * @see {@link ChatService} for chat-based card generation
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root',
})
export class LLMStreamingService implements OnDestroy {
  private readonly config = inject(AppConfigService);
  private requestCanceller = new RequestCanceller();

  private readonly stateSubject = new BehaviorSubject<LLMStreamingState>({
    isActive: false,
    stage: 'idle',
    progress: 0,
    bufferLength: 0,
    targetLength: 0,
  });

  private readonly cardUpdateSubject = new Subject<{
    card: AICardConfig;
    changeType: CardChangeType;
    completedSections?: number[];
  }>();

  private readonly bufferUpdateSubject = new Subject<string>();

  readonly state$ = this.stateSubject.asObservable();
  readonly cardUpdates$ = this.cardUpdateSubject.asObservable();
  readonly bufferUpdates$ = this.bufferUpdateSubject.asObservable();

  private targetJson = '';
  private buffer = '';
  private chunksQueue: string[] = [];
  private placeholderCard: AICardConfig | null = null;
  private parsedCard: AICardConfig | null = null;
  private sectionCompletionStates = new Map<string, boolean>();
  private sectionCompletionPercentages = new Map<string, number>();
  private lastKnownSectionCount = 0;
  private thinkingTimer: ReturnType<typeof setTimeout> | null = null;
  private chunkTimer: ReturnType<typeof setTimeout> | null = null;
  private completionBatchTimer: ReturnType<typeof setTimeout> | null = null;
  private cardUpdateThrottleTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingCompletedSectionIndices: number[] = [];

  // Throttled card update buffer - stores the latest update while throttling
  private pendingCardUpdate: {
    card: AICardConfig;
    changeType: CardChangeType;
    completedSections?: number[];
  } | null = null;
  private lastCardUpdateTime = 0;

  // Track detected section titles for structural change detection
  // New title = new section = structural change (masonry recalculates)
  private detectedSectionTitles = new Set<string>();

  /**
   * Start LLM simulation with target JSON
   * @param targetJson The JSON string to stream
   * @param options Optional settings for streaming behavior
   * @param options.instant When true, processes all chunks immediately without delays (useful for initial page load)
   */
  start(targetJson: string, options?: { instant?: boolean }): void {
    this.stop();
    this.targetJson = targetJson;
    this.buffer = '';
    this.chunksQueue = this.createChunks(targetJson);
    this.parsedCard = null;
    this.lastKnownSectionCount = 0;
    this.sectionCompletionStates.clear();
    this.sectionCompletionPercentages.clear();
    this.pendingCompletedSectionIndices = [];

    // Reset partial section tracking for smart detection
    this.partiallyCompletedSectionIndices.clear();
    this.partialSections = [];
    this.partialCardTitle = '';

    // Reset section title tracking for structural change detection
    this.detectedSectionTitles.clear();

    if (!this.chunksQueue.length) {
      this.updateState({
        isActive: false,
        stage: 'error',
        progress: 0,
        bufferLength: 0,
        targetLength: 0,
      });
      return;
    }

    // Create empty card structure immediately
    const emptyCard: AICardConfig = {
      cardTitle: 'Generating card…',
      sections: [],
    };
    this.placeholderCard = ensureCardIds(emptyCard);

    this.updateState({
      isActive: true,
      stage: options?.instant ? 'streaming' : 'thinking',
      progress: 0,
      bufferLength: 0,
      targetLength: targetJson.length,
    });

    if (options?.instant) {
      // Process all chunks immediately without delays (instant mode for page load)
      this.processAllChunksInstantly();
    } else {
      // Begin streaming after thinking delay (normal simulation mode)
      this.thinkingTimer = setTimeout(() => {
        this.updateState({ stage: 'streaming' });
        this.scheduleNextChunk();
      }, this.config.LLM_SIMULATION.THINKING_DELAY_MS);
    }
  }

  /**
   * Process all chunks instantly without delays
   * Used for initial page load to show cards immediately while still going through the streaming pipeline
   */
  private processAllChunksInstantly(): void {
    // In instant mode, concatenate all chunks immediately to get complete JSON
    while (this.chunksQueue.length > 0) {
      const nextChunk = this.chunksQueue.shift() ?? '';
      this.buffer += nextChunk;
    }

    // Emit the complete buffer for JSON editor synchronization
    this.bufferUpdateSubject.next(this.buffer);

    // Now parse the complete JSON
    const parsed = this.tryParseBuffer();
    if (!parsed) {
      // JSON parsing failed - finish with error state
      this.updateState({
        isActive: false,
        stage: 'error',
        progress: 0,
        bufferLength: this.buffer.length,
        targetLength: this.targetJson.length,
      });
      return;
    }

    // Initialize placeholders with the complete parsed card
    this.initializePlaceholdersIfNeeded(parsed);

    // In instant mode, mark ALL sections as complete since we have the full JSON
    if (this.placeholderCard) {
      const allSectionIndices = (this.placeholderCard.sections || []).map((_, index) => index);

      // Mark all sections as complete in the completion states
      allSectionIndices.forEach((index) => {
        const section = this.placeholderCard?.sections?.[index];
        if (section) {
          const sectionKey = section.id || `section-${index}`;
          this.sectionCompletionStates.set(sectionKey, true);
          this.sectionCompletionPercentages.set(sectionKey, 1.0);
        }
      });

      // Apply all content from parsed JSON to placeholder card
      this.updateCompletedSectionsOnly(parsed, allSectionIndices);

      // Create the final card with all placeholders removed
      const finalCard: AICardConfig = {
        ...this.placeholderCard,
        cardTitle: parsed.cardTitle || this.placeholderCard.cardTitle || '',
        sections: (this.placeholderCard.sections || []).map((section, index) => ({
          ...section,
          fields: section.fields?.map((field) => ({
            ...field,
            meta: { ...((field.meta as Record<string, unknown>) || {}), placeholder: false },
          })),
          items: section.items?.map((item) => ({
            ...item,
            meta: { ...((item.meta as Record<string, unknown>) || {}), placeholder: false },
          })),
          meta: { ...((section.meta as Record<string, unknown>) || {}), placeholder: false },
        })),
      };

      this.placeholderCard = finalCard;

      // Update progress to 100%
      this.updateState({
        progress: 1,
        bufferLength: this.buffer.length,
      });

      // Emit the complete card with ALL sections marked as complete
      this.emitCardUpdate(finalCard, 'structural', allSectionIndices);
      this.pendingCompletedSectionIndices = [];
    }

    // Mark streaming as complete
    this.updateState({
      isActive: false,
      stage: 'complete',
      progress: 1,
    });
  }

  /**
   * Stop LLM simulation
   */
  stop(): void {
    this.requestCanceller.cancel();
    this.clearTimers();
    this.updateState({
      isActive: false,
      stage: 'aborted',
      progress: 0,
      bufferLength: 0,
      targetLength: 0,
    });
    this.buffer = '';
    this.chunksQueue = [];
    this.placeholderCard = null;
    this.parsedCard = null;
    this.lastKnownSectionCount = 0;
    this.sectionCompletionStates.clear();
    this.sectionCompletionPercentages.clear();
    this.pendingCompletedSectionIndices = [];
    this.pendingCardUpdate = null;
    this.lastCardUpdateTime = 0;
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.stop();
  }

  /**
   * Get current state
   */
  getState(): LLMStreamingState {
    return this.stateSubject.value;
  }

  /**
   * Get current placeholder card
   */
  getPlaceholderCard(): AICardConfig | null {
    return this.placeholderCard;
  }

  /**
   * Create chunks from payload
   */
  private createChunks(payload: string): string[] {
    const sanitized = payload.replace(/\r\n/g, '\n');
    const chunks: string[] = [];
    let buffer = '';
    const { MIN_CHUNK_SIZE, MAX_CHUNK_SIZE } = this.config.LLM_SIMULATION;

    for (const char of sanitized) {
      buffer += char;
      const isBoundary = /[\n,}\]]/.test(char);
      const reachedMax = buffer.length >= MAX_CHUNK_SIZE;
      const reachedBoundary = buffer.length >= MIN_CHUNK_SIZE && isBoundary;
      if (reachedMax || reachedBoundary) {
        chunks.push(buffer);
        buffer = '';
      }
    }

    if (buffer) {
      chunks.push(buffer);
    }

    return chunks;
  }

  /**
   * Schedule next chunk processing
   */
  private scheduleNextChunk(): void {
    if (!this.getState().isActive) {
      return;
    }

    if (!this.chunksQueue.length) {
      this.finish();
      return;
    }

    const nextChunk = this.chunksQueue.shift() ?? '';
    this.buffer += nextChunk;
    const hasMore = this.chunksQueue.length > 0;

    // Emit buffer update for JSON editor synchronization
    this.bufferUpdateSubject.next(this.buffer);

    // Try to parse complete JSON first
    const parsed = this.tryParseBuffer();
    if (parsed) {
      // Full JSON is valid - use standard processing
      const placeholdersCreated = this.initializePlaceholdersIfNeeded(parsed);
      if (placeholdersCreated && this.placeholderCard) {
        this.emitCardUpdate(this.placeholderCard, 'structural');
      }

      if (this.placeholderCard) {
        const completedSections = this.checkSectionCompletions(parsed);
        const completedFields = this.checkFieldCompletions(parsed);

        if (completedSections.length > 0 || completedFields.length > 0) {
          if (completedSections.length > 0) {
            this.updateCompletedSectionsOnly(parsed, completedSections);
          }
          if (completedFields.length > 0) {
            this.updateCompletedFieldsOnly(parsed, completedFields);
          }
          this.pendingCompletedSectionIndices.push(...completedSections);
          this.batchSectionCompletions();
        }

        this.emitProgressiveUpdate(parsed);
      }
    } else {
      // JSON is incomplete - use balanced-brace detection
      // Only show sections when their JSON is complete (ensures fields/items are populated)
      const { newlyCompleted, card } = this.detectCompletedSectionsFromBuffer();

      if (card) {
        this.placeholderCard = card;
        // New section completed = structural (masonry recalculates)
        // Same sections = content (smooth update)
        const changeType: CardChangeType = newlyCompleted.length > 0 ? 'structural' : 'content';
        this.emitCardUpdate(card, changeType);
      }
    }

    // Update progress
    const progress =
      this.targetJson.length > 0 ? Math.min(1, this.buffer.length / this.targetJson.length) : 0;

    this.updateState({
      progress,
      bufferLength: this.buffer.length,
    });

    // Schedule next chunk
    const delay = hasMore ? this.computeChunkDelay(nextChunk) : 100;
    this.chunkTimer = setTimeout(() => {
      if (hasMore) {
        this.scheduleNextChunk();
      } else {
        this.finish();
      }
    }, delay);
  }

  /**
   * Finish streaming
   */
  private finish(): void {
    const parsed = this.tryParseBuffer();
    if (parsed && this.placeholderCard) {
      const completedSections = this.checkSectionCompletions(parsed);
      if (completedSections.length > 0) {
        this.updateCompletedSectionsOnly(parsed, completedSections);
      }
      this.emitCardUpdate(this.placeholderCard, 'structural');
    }

    this.updateState({
      isActive: false,
      stage: 'complete',
      progress: 1,
    });
  }

  /**
   * Try to parse buffer as AICardConfig
   */
  private tryParseBuffer(): AICardConfig | null {
    try {
      const parsed = JSON.parse(this.buffer) as unknown;
      if (CardTypeGuards.isAICardConfig(parsed)) {
        return ensureCardIds(parsed);
      }
    } catch {
      return null;
    }
    return null;
  }

  // Track which sections have been detected as complete from partial JSON
  private partiallyCompletedSectionIndices = new Set<number>();
  private partialSections: CardSection[] = [];
  private partialCardTitle = '';

  /**
   * Detect completed sections from partial/incomplete JSON buffer.
   * This allows progressive section reveal even when overall JSON is incomplete.
   * A section is "complete" when its JSON object has balanced braces.
   */
  private detectCompletedSectionsFromBuffer(): {
    newlyCompleted: number[];
    card: AICardConfig | null;
  } {
    const newlyCompleted: number[] = [];

    // Find sections array in buffer
    const sectionsMatch = this.buffer.match(/"sections"\s*:\s*\[/);
    if (!sectionsMatch || sectionsMatch.index === undefined) {
      return { newlyCompleted, card: null };
    }

    const sectionsStartIndex = sectionsMatch.index + sectionsMatch[0].length;
    const sectionsContent = this.buffer.slice(sectionsStartIndex);

    // Extract card title if present
    const titleMatch = this.buffer.match(/"cardTitle"\s*:\s*"([^"]*)"/);
    if (titleMatch && titleMatch[1]) {
      this.partialCardTitle = titleMatch[1];
    }

    // Parse individual section objects by tracking brace balance
    let sectionIndex = 0;
    let i = 0;

    while (i < sectionsContent.length) {
      // Skip whitespace and commas
      let currentChar = sectionsContent[i];
      while (i < sectionsContent.length && currentChar && /[\s,]/.test(currentChar)) {
        i++;
        currentChar = sectionsContent[i];
      }

      if (i >= sectionsContent.length || currentChar === ']') {
        break; // End of sections array
      }

      if (currentChar === '{') {
        // Found start of a section object
        const sectionStart = i;
        let braceDepth = 0;
        let inString = false;
        let escapeNext = false;
        let sectionEnd = -1;

        // Find matching closing brace
        for (let j = i; j < sectionsContent.length; j++) {
          const char = sectionsContent[j];

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
              sectionEnd = j;
              break;
            }
          }
        }

        if (sectionEnd !== -1) {
          // Complete section found - try to parse it
          const sectionJson = sectionsContent.slice(sectionStart, sectionEnd + 1);

          try {
            const section = JSON.parse(sectionJson) as CardSection;

            // Create section with consistent ID
            const sectionWithId = {
              ...section,
              id: section.id ?? `section_${sectionIndex}`,
            };

            // Check if this section is newly completed (for structural change detection)
            const wasComplete = this.partiallyCompletedSectionIndices.has(sectionIndex);
            if (!wasComplete) {
              this.partiallyCompletedSectionIndices.add(sectionIndex);
              newlyCompleted.push(sectionIndex);
            }

            // ALWAYS update the stored section with latest data
            // This ensures fields/items added after initial parse are preserved
            const existingSection = this.partialSections[sectionIndex];
            if (existingSection) {
              // Merge: keep existing data, add new data
              // Only overwrite if new data has MORE content
              const existingContentCount =
                (existingSection.fields?.length ?? 0) + (existingSection.items?.length ?? 0);
              const newContentCount =
                (sectionWithId.fields?.length ?? 0) + (sectionWithId.items?.length ?? 0);

              if (newContentCount >= existingContentCount) {
                this.partialSections[sectionIndex] = sectionWithId;
              }
            } else {
              // First time storing this section
              this.partialSections[sectionIndex] = sectionWithId;
            }

            i = sectionEnd + 1;
            sectionIndex++;
          } catch {
            // Section JSON is malformed, skip it
            i++;
          }
        } else {
          // Section is incomplete (no closing brace yet)
          break;
        }
      } else {
        i++;
      }
    }

    // Build card from partial sections
    if (this.partialSections.length > 0 || this.partialCardTitle) {
      // IMPORTANT: Update lastKnownSectionCount to prevent initializePlaceholdersIfNeeded
      // from creating duplicate sections when JSON becomes complete.
      // This ensures consistent section_X IDs are used throughout streaming.
      if (this.partialSections.length > this.lastKnownSectionCount) {
        this.lastKnownSectionCount = this.partialSections.length;
      }

      const partialCard: AICardConfig = {
        cardTitle: this.partialCardTitle || 'Generating...',
        sections: [...this.partialSections],
      };
      return { newlyCompleted, card: ensureCardIds(partialCard) };
    }

    return { newlyCompleted, card: null };
  }

  /**
   * Detect section titles in buffer and build partial card.
   * Uses title detection to determine structural vs content changes:
   * - New title detected = structural change (masonry recalculates)
   * - Same titles, more content = content change (smooth update)
   */
  private detectSectionTitlesAndBuildCard(): {
    hasNewSection: boolean;
    partialCard: AICardConfig | null;
  } {
    // Find all section titles within the sections array
    const sectionsMatch = this.buffer.match(/"sections"\s*:\s*\[/);
    if (!sectionsMatch || sectionsMatch.index === undefined) {
      // No sections array yet - just extract card title if available
      const titleMatch = this.buffer.match(/"cardTitle"\s*:\s*"([^"]*)"/);
      if (titleMatch && titleMatch[1]) {
        return {
          hasNewSection: false,
          partialCard: ensureCardIds({
            cardTitle: titleMatch[1],
            sections: [],
          }),
        };
      }
      return { hasNewSection: false, partialCard: null };
    }

    // Extract content after sections array starts
    const sectionsStartIndex = sectionsMatch.index + sectionsMatch[0].length;
    const sectionsContent = this.buffer.slice(sectionsStartIndex);

    // Find all section titles using regex
    // Look for "title": "..." patterns within the sections content
    const titleRegex = /"title"\s*:\s*"([^"]+)"/g;
    const currentTitles: string[] = [];
    let match;
    while ((match = titleRegex.exec(sectionsContent)) !== null) {
      if (match[1]) {
        currentTitles.push(match[1]);
      }
    }

    // Check for new titles (structural change)
    let hasNewSection = false;
    for (const title of currentTitles) {
      if (!this.detectedSectionTitles.has(title)) {
        this.detectedSectionTitles.add(title);
        hasNewSection = true;
      }
    }

    // Build partial card using existing extraction logic
    const partialCard = this.extractPartialCardFromBuffer();

    return { hasNewSection, partialCard };
  }

  /**
   * Extract partial card from buffer for LIVE streaming display.
   * Shows content as it appears - doesn't wait for complete sections.
   * Extracts whatever is available: partial titles, partial fields, etc.
   */
  extractPartialCardFromBuffer(): AICardConfig | null {
    // Extract card title (even if incomplete)
    let cardTitle = '';
    const titleMatch = this.buffer.match(/"cardTitle"\s*:\s*"([^"]*)"?/);
    if (titleMatch && titleMatch[1]) {
      cardTitle = titleMatch[1];
    }

    // Find sections array start
    const sectionsMatch = this.buffer.match(/"sections"\s*:\s*\[/);
    if (!sectionsMatch || sectionsMatch.index === undefined) {
      // No sections yet - return card with just title if available
      if (cardTitle) {
        return ensureCardIds({
          cardTitle,
          sections: [],
        });
      }
      return null;
    }

    const sectionsStartIndex = sectionsMatch.index + sectionsMatch[0].length;
    const sectionsContent = this.buffer.slice(sectionsStartIndex);

    // Extract sections - including incomplete ones
    const sections: CardSection[] = [];
    let i = 0;
    let sectionIndex = 0;

    while (i < sectionsContent.length) {
      // Skip whitespace and commas
      while (i < sectionsContent.length && /[\s,]/.test(sectionsContent[i] || '')) {
        i++;
      }

      if (i >= sectionsContent.length || sectionsContent[i] === ']') {
        break;
      }

      if (sectionsContent[i] === '{') {
        // Found section start - extract whatever we can
        const sectionStart = i;
        const section = this.extractPartialSection(
          sectionsContent.slice(sectionStart),
          sectionIndex
        );
        if (section) {
          sections.push(section);
        }

        // Find end of this section (balanced or not) to move to next
        let braceDepth = 0;
        let inString = false;
        let escapeNext = false;

        for (let j = i; j < sectionsContent.length; j++) {
          const char = sectionsContent[j];
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
              i = j + 1;
              break;
            }
          }
        }

        // If we didn't find closing brace, we're at the last incomplete section
        if (braceDepth > 0) {
          break; // This section is still being written
        }

        sectionIndex++;
      } else {
        i++;
      }
    }

    if (cardTitle || sections.length > 0) {
      return ensureCardIds({
        cardTitle: cardTitle || 'Generating...',
        sections,
      });
    }

    return null;
  }

  /**
   * Extract a partial section from JSON string.
   * Uses regex to extract available properties even from incomplete JSON.
   *
   * IMPORTANT: Prefers already-parsed complete sections to avoid data loss.
   */
  private extractPartialSection(sectionJson: string, index: number): CardSection | null {
    // FIRST: Check if we already have a complete version of this section
    // This prevents partial extraction from overwriting complete data
    const existingComplete = this.partialSections[index];
    if (existingComplete) {
      // Return the complete section we already have
      return existingComplete;
    }

    // Try to parse as complete JSON first
    try {
      // Find the complete object if possible
      let braceDepth = 0;
      let inString = false;
      let escapeNext = false;
      let endIndex = -1;

      for (let i = 0; i < sectionJson.length; i++) {
        const char = sectionJson[i];
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (char === '\\' && inString) {
          escapeNext = true;
          continue;
        }
        if (char === '"') {
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
            endIndex = i;
            break;
          }
        }
      }

      if (endIndex !== -1) {
        const completeJson = sectionJson.slice(0, endIndex + 1);
        const parsed = JSON.parse(completeJson) as CardSection;
        return {
          ...parsed,
          id: parsed.id ?? `section_${index}`,
        };
      }
    } catch {
      // Fall through to partial extraction
    }

    // Extract available properties via regex (for incomplete sections)
    const section: CardSection = {
      id: `section_${index}`,
      title: '', // Will be populated if found
      type: 'info',
      fields: [],
      items: [],
    };

    // Extract title
    const titleMatch = sectionJson.match(/"title"\s*:\s*"([^"]*)"?/);
    if (titleMatch && titleMatch[1]) {
      section.title = titleMatch[1];
    }

    // Extract type
    const typeMatch = sectionJson.match(/"type"\s*:\s*"([^"]*)"?/);
    if (typeMatch && typeMatch[1]) {
      section.type = typeMatch[1] as CardSection['type'];
    }

    // Extract description
    const descMatch = sectionJson.match(/"description"\s*:\s*"([^"]*)"?/);
    if (descMatch && descMatch[1]) {
      section.description = descMatch[1];
    }

    // Extract fields array
    const fieldsMatch = sectionJson.match(/"fields"\s*:\s*\[/);
    if (fieldsMatch && fieldsMatch.index !== undefined) {
      const fieldsStart = fieldsMatch.index + fieldsMatch[0].length;
      const fieldsContent = sectionJson.slice(fieldsStart);
      section.fields = this.extractPartialFields(fieldsContent);
    }

    // Extract items array
    const itemsMatch = sectionJson.match(/"items"\s*:\s*\[/);
    if (itemsMatch && itemsMatch.index !== undefined) {
      const itemsStart = itemsMatch.index + itemsMatch[0].length;
      const itemsContent = sectionJson.slice(itemsStart);
      section.items = this.extractPartialItems(itemsContent);
    }

    // Only return if we have at least a title or type
    if (section.title || section.type !== 'info') {
      return section;
    }

    return null;
  }

  /**
   * Extract partial fields from incomplete JSON
   */
  private extractPartialFields(fieldsJson: string): CardField[] {
    const fields: CardField[] = [];
    let fieldIndex = 0;

    // Find field objects
    const fieldRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}?/g;
    let match;

    while ((match = fieldRegex.exec(fieldsJson)) !== null) {
      const fieldStr = match[0];

      // Extract field properties
      const labelMatch = fieldStr.match(/"label"\s*:\s*"([^"]*)"?/);
      const valueMatch = fieldStr.match(/"value"\s*:\s*"([^"]*)"?/);
      const typeMatch = fieldStr.match(/"type"\s*:\s*"([^"]*)"?/);

      if (labelMatch || valueMatch) {
        fields.push({
          id: `field-${fieldIndex}`,
          label: labelMatch?.[1] || '',
          value: valueMatch?.[1] || '',
          type: (typeMatch?.[1] as CardField['type']) || 'text',
        });
        fieldIndex++;
      }

      // Stop at closing bracket
      if (
        fieldsJson.indexOf(']', match.index) !== -1 &&
        fieldsJson.indexOf(']', match.index) < match.index + match[0].length + 10
      ) {
        break;
      }
    }

    return fields;
  }

  /**
   * Extract partial items from incomplete JSON
   */
  private extractPartialItems(itemsJson: string): CardItem[] {
    const items: CardItem[] = [];
    let itemIndex = 0;

    // Find item objects
    const itemRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}?/g;
    let match;

    while ((match = itemRegex.exec(itemsJson)) !== null) {
      const itemStr = match[0];

      // Extract item properties
      const titleMatch = itemStr.match(/"title"\s*:\s*"([^"]*)"?/);
      const descMatch = itemStr.match(/"description"\s*:\s*"([^"]*)"?/);
      const valueMatch = itemStr.match(/"value"\s*:\s*"([^"]*)"?/);

      if (titleMatch || descMatch) {
        items.push({
          id: `item-${itemIndex}`,
          title: titleMatch?.[1] || '',
          description: descMatch?.[1],
          value: valueMatch?.[1],
        });
        itemIndex++;
      }

      // Stop at closing bracket
      if (
        itemsJson.indexOf(']', match.index) !== -1 &&
        itemsJson.indexOf(']', match.index) < match.index + match[0].length + 10
      ) {
        break;
      }
    }

    return items;
  }

  /**
   * Initialize placeholders when sections are first declared
   */
  private initializePlaceholdersIfNeeded(parsed: AICardConfig): boolean {
    const sections = parsed.sections ?? [];
    const currentSectionCount = sections.length;

    if (currentSectionCount > this.lastKnownSectionCount && currentSectionCount > 0) {
      this.lastKnownSectionCount = currentSectionCount;
      this.initializePlaceholders(parsed);
      return true;
    }

    return false;
  }

  /**
   * Initialize placeholder card structure
   */
  private initializePlaceholders(card: AICardConfig): void {
    const sections = card.sections ?? [];
    const placeholderSections = sections.map((section, index) =>
      this.createPlaceholderSection(section, index)
    );

    this.placeholderCard = {
      ...card,
      sections: placeholderSections,
    };
    this.parsedCard = card;

    sections.forEach((section, index) => {
      const sectionKey = section.id || `section-${index}`;
      this.sectionCompletionStates.set(sectionKey, false);
    });
  }

  /**
   * Create placeholder section
   */
  private createPlaceholderSection(section: CardSection, sectionIndex: number): CardSection {
    return {
      ...section,
      id: section.id ?? `section_${sectionIndex}`,
      title: section.title || `Section ${sectionIndex + 1}`,
      fields: (section.fields ?? []).map((field, fieldIndex) =>
        this.createPlaceholderField(field, sectionIndex, fieldIndex)
      ),
      items: (section.items ?? []).map((item, itemIndex) =>
        this.createPlaceholderItem(item, sectionIndex, itemIndex)
      ),
      meta: { ...(section.meta ?? {}), placeholder: true, streamingOrder: sectionIndex },
    };
  }

  /**
   * Create placeholder field
   */
  private createPlaceholderField(
    field: CardField,
    sectionIndex: number,
    fieldIndex: number
  ): CardField {
    return {
      ...field,
      id: field.id ?? `field_${sectionIndex}_${fieldIndex}`,
      label: field.label || field.title || `Field ${fieldIndex + 1}`,
      value: field.value ?? '',
      meta: { ...(field.meta ?? {}), placeholder: true },
    };
  }

  /**
   * Create placeholder item
   */
  private createPlaceholderItem(item: CardItem, sectionIndex: number, itemIndex: number): CardItem {
    return {
      ...item,
      id: item.id ?? `item_${sectionIndex}_${itemIndex}`,
      title: item.title || `Item ${itemIndex + 1}`,
      description: item.description ?? '',
      meta: { ...(item.meta ?? {}), placeholder: true },
    };
  }

  /**
   * Check which sections are complete
   */
  private checkSectionCompletions(parsed: AICardConfig): number[] {
    const sections = parsed.sections ?? [];
    const newlyCompleted: number[] = [];

    sections.forEach((section, index) => {
      const sectionKey = section.id || `section-${index}`;
      const wasComplete = this.sectionCompletionStates.get(sectionKey) || false;

      if (wasComplete) {
        return;
      }

      const completionPercentage = this.calculateSectionCompletionPercentage(section);
      this.sectionCompletionPercentages.set(sectionKey, completionPercentage);

      const isComplete = this.isSectionComplete(section);

      if (isComplete) {
        this.sectionCompletionStates.set(sectionKey, true);
        this.sectionCompletionPercentages.set(sectionKey, 1.0);
        newlyCompleted.push(index);
      } else if (completionPercentage > 0) {
        const previousPercentage = this.sectionCompletionPercentages.get(sectionKey) || 0;
        if (
          completionPercentage >
          previousPercentage + this.config.SECTION_COMPLETION.PROGRESS_UPDATE_THRESHOLD
        ) {
          newlyCompleted.push(index);
        }
      }
    });

    return newlyCompleted;
  }

  /**
   * Check which fields have completed
   */
  private checkFieldCompletions(
    parsed: AICardConfig
  ): { sectionIndex: number; fieldIndex: number }[] {
    const sections = parsed.sections ?? [];
    const completedFields: { sectionIndex: number; fieldIndex: number }[] = [];

    sections.forEach((section, sectionIndex) => {
      const fields = section.fields ?? [];
      fields.forEach((field, fieldIndex) => {
        const meta = field.meta as Record<string, unknown> | undefined;
        const isPlaceholder =
          field.value === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
          field.value === undefined ||
          field.value === null ||
          (meta && meta.placeholder === true);

        if (!isPlaceholder && field.value !== '') {
          const placeholderSection = this.placeholderCard?.sections?.[sectionIndex];
          const placeholderField = placeholderSection?.fields?.[fieldIndex];
          if (placeholderField) {
            const placeholderMeta = placeholderField.meta as Record<string, unknown> | undefined;
            const wasPlaceholder =
              placeholderField.value === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
              placeholderMeta?.placeholder === true;
            if (wasPlaceholder) {
              completedFields.push({ sectionIndex, fieldIndex });
            }
          }
        }
      });
    });

    return completedFields;
  }

  /**
   * Update only completed sections in-place
   */
  private updateCompletedSectionsOnly(incoming: AICardConfig, completedIndices: number[]): void {
    if (!this.placeholderCard) {
      return;
    }

    const incomingSections = incoming.sections ?? [];
    const placeholderSections = this.placeholderCard.sections ?? [];

    completedIndices.forEach((index) => {
      const placeholderSection = placeholderSections[index];
      const incomingSection = incomingSections[index];

      if (!placeholderSection || !incomingSection) {
        return;
      }

      // Update section properties in-place
      placeholderSection.title = incomingSection.title ?? placeholderSection.title;
      placeholderSection.subtitle = incomingSection.subtitle ?? placeholderSection.subtitle;
      placeholderSection.type = incomingSection.type ?? placeholderSection.type;
      placeholderSection.description =
        incomingSection.description ?? placeholderSection.description;
      placeholderSection.emoji = incomingSection.emoji ?? placeholderSection.emoji;
      placeholderSection.columns = incomingSection.columns ?? placeholderSection.columns;
      placeholderSection.colSpan = incomingSection.colSpan ?? placeholderSection.colSpan;
      placeholderSection.chartType = incomingSection.chartType ?? placeholderSection.chartType;
      placeholderSection.chartData = incomingSection.chartData ?? placeholderSection.chartData;

      // Update fields and items in-place
      this.updateFieldsInPlace(
        placeholderSection.fields ?? [],
        incomingSection.fields ?? [],
        index
      );
      this.updateItemsInPlace(placeholderSection.items ?? [], incomingSection.items ?? [], index);

      // Remove placeholder flag
      const meta = placeholderSection.meta as Record<string, unknown> | undefined;
      if (meta) {
        meta.placeholder = false;
      }
    });
  }

  /**
   * Update fields array in-place
   */
  private updateFieldsInPlace(
    existing: CardField[],
    incoming: CardField[],
    sectionIndex: number
  ): void {
    const maxLength = Math.max(existing.length, incoming.length);

    while (existing.length < maxLength) {
      const fieldIndex = existing.length;
      const incomingField = incoming[fieldIndex];
      existing.push({
        id: incomingField?.id ?? `field_${sectionIndex}_${fieldIndex}`,
        label: incomingField?.label ?? `Field ${fieldIndex + 1}`,
        value: incomingField?.value ?? '',
        meta: { placeholder: true, ...(incomingField?.meta ?? {}) },
      } as CardField);
    }

    for (let i = 0; i < maxLength; i++) {
      const existingField = existing[i];
      const incomingField = incoming[i];

      if (!incomingField || !existingField) {
        continue;
      }

      existingField.label = incomingField.label ?? existingField.label;
      existingField.value = incomingField.value ?? existingField.value;
      existingField.percentage = incomingField.percentage ?? existingField.percentage;
      existingField.trend = incomingField.trend ?? existingField.trend;
      existingField.type = incomingField.type ?? existingField.type;
      existingField.status = existingField.status ?? existingField.status;
      existingField.priority = existingField.priority ?? existingField.priority;
      existingField.format = existingField.format ?? existingField.format;
      existingField.description = existingField.description ?? existingField.description;

      const meta = existingField.meta as Record<string, unknown> | undefined;
      if (meta) {
        meta.placeholder = false;
      }
    }
  }

  /**
   * Update items array in-place
   */
  private updateItemsInPlace(
    existing: CardItem[],
    incoming: CardItem[],
    sectionIndex: number
  ): void {
    const maxLength = Math.max(existing.length, incoming.length);

    while (existing.length < maxLength) {
      const itemIndex = existing.length;
      const incomingItem = incoming[itemIndex];
      existing.push({
        id: incomingItem?.id ?? `item_${sectionIndex}_${itemIndex}`,
        title: incomingItem?.title ?? `Item ${itemIndex + 1}`,
        description: incomingItem?.description ?? '',
        meta: { placeholder: true, ...(incomingItem?.meta ?? {}) },
      } as CardItem);
    }

    for (let i = 0; i < maxLength; i++) {
      const existingItem = existing[i];
      const incomingItem = incoming[i];

      if (!incomingItem || !existingItem) {
        continue;
      }

      existingItem.title = incomingItem.title ?? existingItem.title;
      existingItem.description = incomingItem.description ?? existingItem.description;
      existingItem.value = existingItem.value ?? existingItem.value;
      existingItem.status = existingItem.status ?? existingItem.status;
      existingItem.icon = existingItem.icon ?? existingItem.icon;

      const meta = existingItem.meta as Record<string, unknown> | undefined;
      if (meta) {
        meta.placeholder = false;
      }
    }
  }

  /**
   * Update only completed fields in-place
   */
  private updateCompletedFieldsOnly(
    incoming: AICardConfig,
    completedFields: { sectionIndex: number; fieldIndex: number }[]
  ): void {
    if (!this.placeholderCard) {
      return;
    }

    const incomingSections = incoming.sections ?? [];
    const placeholderSections = this.placeholderCard.sections ?? [];

    completedFields.forEach(({ sectionIndex, fieldIndex }) => {
      const placeholderSection = placeholderSections[sectionIndex];
      const incomingSection = incomingSections[sectionIndex];

      if (!placeholderSection || !incomingSection) {
        return;
      }

      const placeholderFields = placeholderSection.fields ?? [];
      const incomingFields = incomingSection.fields ?? [];
      const placeholderField = placeholderFields[fieldIndex];
      const incomingField = incomingFields[fieldIndex];

      if (!placeholderField || !incomingField) {
        return;
      }

      placeholderField.label = incomingField.label ?? placeholderField.label;
      placeholderField.value = incomingField.value ?? placeholderField.value;
      placeholderField.type = incomingField.type ?? placeholderField.type;
      placeholderField.format = incomingField.format ?? placeholderField.format;

      const meta = placeholderField.meta as Record<string, unknown> | undefined;
      if (meta) {
        meta.placeholder = false;
      }
    });
  }

  /**
   * Calculate completion percentage for a section
   */
  private calculateSectionCompletionPercentage(section: CardSection): number {
    const fields = section.fields ?? [];
    const items = section.items ?? [];
    const totalElements = fields.length + items.length;

    if (totalElements === 0) {
      return section.title ? 0.5 : 0;
    }

    let completedCount = 0;

    fields.forEach((field) => {
      const meta = field.meta as Record<string, unknown> | undefined;
      const isPlaceholder =
        field.value === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
        field.value === undefined ||
        field.value === null ||
        (meta && meta.placeholder === true);
      if (!isPlaceholder && field.value !== '') {
        completedCount++;
      }
    });

    items.forEach((item) => {
      const meta = item.meta as Record<string, unknown> | undefined;
      const isPlaceholder =
        (meta && meta.placeholder === true) || (item.title === 'Item' && !item.description);
      if (!isPlaceholder && item.title) {
        completedCount++;
      }
    });

    return totalElements > 0 ? completedCount / totalElements : 0;
  }

  /**
   * Check if a section is complete
   */
  private isSectionComplete(section: CardSection): boolean {
    const fields = section.fields ?? [];
    for (const field of fields) {
      const meta = field.meta as Record<string, unknown> | undefined;
      const isPlaceholder =
        field.value === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
        field.value === undefined ||
        field.value === null ||
        (meta && meta.placeholder === true);
      if (isPlaceholder) {
        return false;
      }
    }

    const items = section.items ?? [];
    for (const item of items) {
      const meta = item.meta as Record<string, unknown> | undefined;
      const isPlaceholder =
        item.description === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
        !item.title ||
        item.title.startsWith('Item ') ||
        (meta && meta.placeholder === true);
      if (isPlaceholder) {
        return false;
      }
    }

    return true;
  }

  /**
   * Batch section completions and emit updates
   */
  private batchSectionCompletions(): void {
    if (this.completionBatchTimer) {
      clearTimeout(this.completionBatchTimer);
    }

    this.completionBatchTimer = setTimeout(() => {
      if (this.placeholderCard && this.pendingCompletedSectionIndices.length > 0) {
        const changeType: CardChangeType =
          this.pendingCompletedSectionIndices.length > 0 ? 'structural' : 'content';
        const completedSet = new Set(this.pendingCompletedSectionIndices);

        const updatedCard: AICardConfig = {
          ...this.placeholderCard,
          cardTitle: this.placeholderCard.cardTitle || '',
          sections: (this.placeholderCard.sections || []).map((section, index) => {
            if (completedSet.has(index)) {
              return {
                ...section,
                fields: section.fields?.map((field) => ({ ...field })),
                items: section.items?.map((item) => ({ ...item })),
              };
            }
            return section;
          }),
        };

        this.placeholderCard = updatedCard;
        this.emitCardUpdate(updatedCard, changeType, [...this.pendingCompletedSectionIndices]);
        this.pendingCompletedSectionIndices = [];
      }
      this.completionBatchTimer = null;
    }, this.config.LLM_SIMULATION.COMPLETION_BATCH_DELAY_MS);
  }

  /**
   * Compute delay for chunk to achieve target tokens per second
   */
  private computeChunkDelay(chunk: string): number {
    const { CHARS_PER_TOKEN, TOKENS_PER_SECOND } = this.config.LLM_SIMULATION;
    const msPerToken = 1000 / TOKENS_PER_SECOND;
    const tokensInChunk = Math.max(1, chunk.length / CHARS_PER_TOKEN);
    return Math.round(tokensInChunk * msPerToken);
  }

  /**
   * Emit progressive content update during streaming
   * Updates placeholder card with latest parsed content and emits throttled update
   */
  private emitProgressiveUpdate(parsed: AICardConfig): void {
    if (!this.placeholderCard) {
      return;
    }

    // Update card title progressively
    if (parsed.cardTitle) {
      this.placeholderCard.cardTitle = parsed.cardTitle;
    }

    // Update all sections with latest content from parsed JSON
    const incomingSections = parsed.sections ?? [];
    const placeholderSections = this.placeholderCard.sections ?? [];

    incomingSections.forEach((incomingSection, index) => {
      const placeholderSection = placeholderSections[index];
      if (!placeholderSection) {
        return;
      }

      // Update section content progressively
      if (incomingSection.title) {
        placeholderSection.title = incomingSection.title;
      }
      if (incomingSection.description) {
        placeholderSection.description = incomingSection.description;
      }

      // Update fields progressively
      const incomingFields = incomingSection.fields ?? [];
      const placeholderFields = placeholderSection.fields ?? [];
      incomingFields.forEach((incomingField, fieldIndex) => {
        const placeholderField = placeholderFields[fieldIndex];
        if (placeholderField && incomingField.value !== undefined) {
          placeholderField.label = incomingField.label ?? placeholderField.label;
          placeholderField.value = incomingField.value;
        }
      });

      // Update items progressively
      const incomingItems = incomingSection.items ?? [];
      const placeholderItems = placeholderSection.items ?? [];
      incomingItems.forEach((incomingItem, itemIndex) => {
        const placeholderItem = placeholderItems[itemIndex];
        if (placeholderItem) {
          if (incomingItem.title) {
            placeholderItem.title = incomingItem.title;
          }
          if (incomingItem.description) {
            placeholderItem.description = incomingItem.description;
          }
        }
      });
    });

    // Emit throttled content update - the throttle mechanism will limit frequency
    this.emitCardUpdate(this.placeholderCard, 'content');
  }

  /**
   * Emit card update with intelligent throttling for smooth streaming
   *
   * Throttling strategy:
   * - Structural changes (new sections): Emit immediately for responsive section appearance
   * - Content-only changes: Throttle more aggressively to prevent rapid re-renders
   * - Completion events: Emit immediately to show final state
   * - Non-streaming contexts: Emit immediately (instant mode, completion)
   */
  private emitCardUpdate(
    card: AICardConfig,
    changeType: CardChangeType,
    completedSections?: number[]
  ): void {
    const now = Date.now();
    const isStreaming = this.getState().isActive && this.getState().stage === 'streaming';
    const isStructuralChange = changeType === 'structural';
    const isCompletionEvent = completedSections && completedSections.length > 0;

    // Use different throttle times based on change type
    // Structural changes use shorter throttle for responsive section appearance
    // Content changes use longer throttle to reduce visual noise
    const throttleMs = isStructuralChange
      ? this.config.LLM_SIMULATION.CARD_UPDATE_THROTTLE_MS
      : (this.config.LLM_SIMULATION.CONTENT_UPDATE_THROTTLE_MS ??
        this.config.LLM_SIMULATION.CARD_UPDATE_THROTTLE_MS);

    // Allow immediate update if:
    // 1. Not actively streaming (instant mode, completion, etc.)
    // 2. Structural change (new sections added) - always immediate for responsive feel
    // 3. Section completion event - always immediate
    // 4. Enough time has passed since last update
    const shouldEmitImmediately =
      !isStreaming ||
      isStructuralChange ||
      isCompletionEvent ||
      now - this.lastCardUpdateTime >= throttleMs;

    if (shouldEmitImmediately) {
      // Emit immediately
      this.lastCardUpdateTime = now;
      this.pendingCardUpdate = null;

      // Clear any pending throttled update
      if (this.cardUpdateThrottleTimer) {
        clearTimeout(this.cardUpdateThrottleTimer);
        this.cardUpdateThrottleTimer = null;
      }

      this.cardUpdateSubject.next({
        card,
        changeType,
        completedSections,
      });
    } else {
      // Buffer the update for throttled emission
      // If there's already a pending update, merge with it (keep latest card, preserve changeType)
      if (this.pendingCardUpdate) {
        // If pending is structural and new is content, keep structural
        const mergedChangeType =
          this.pendingCardUpdate.changeType === 'structural' ? 'structural' : changeType;
        this.pendingCardUpdate = {
          card,
          changeType: mergedChangeType,
          completedSections: completedSections ?? this.pendingCardUpdate.completedSections,
        };
      } else {
        this.pendingCardUpdate = { card, changeType, completedSections };
      }

      // Schedule throttled emission if not already scheduled
      if (!this.cardUpdateThrottleTimer) {
        const remainingTime = throttleMs - (now - this.lastCardUpdateTime);
        this.cardUpdateThrottleTimer = setTimeout(
          () => {
            this.cardUpdateThrottleTimer = null;
            if (this.pendingCardUpdate) {
              const update = this.pendingCardUpdate;
              this.pendingCardUpdate = null;
              this.lastCardUpdateTime = Date.now();
              this.cardUpdateSubject.next(update);
            }
          },
          Math.max(0, remainingTime)
        );
      }
    }
  }

  /**
   * Update state
   */
  private updateState(updates: Partial<LLMStreamingState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...updates,
    });
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.thinkingTimer) {
      clearTimeout(this.thinkingTimer);
      this.thinkingTimer = null;
    }
    if (this.chunkTimer) {
      clearTimeout(this.chunkTimer);
      this.chunkTimer = null;
    }
    if (this.completionBatchTimer) {
      clearTimeout(this.completionBatchTimer);
      this.completionBatchTimer = null;
    }
    if (this.cardUpdateThrottleTimer) {
      clearTimeout(this.cardUpdateThrottleTimer);
      this.cardUpdateThrottleTimer = null;
    }
  }
}
