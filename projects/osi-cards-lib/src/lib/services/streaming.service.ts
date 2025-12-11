/**
 * OSI Cards Streaming Service
 *
 * Provides progressive card generation with streaming support.
 * Simulates LLM (Large Language Model) streaming behavior for realistic
 * card generation experiences.
 *
 * @example
 * ```typescript
 * import { OSICardsStreamingService } from 'osi-cards-lib';
 *
 * const streamingService = inject(OSICardsStreamingService);
 *
 * // Start streaming
 * streamingService.start(jsonString);
 *
 * // Subscribe to card updates
 * streamingService.cardUpdates$.subscribe(update => {
 *   console.log('Card updated:', update.card);
 * });
 *
 * // Subscribe to state changes
 * streamingService.state$.subscribe(state => {
 *   console.log('Stage:', state.stage);
 * });
 * ```
 */

import { DestroyRef, Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AICardConfig, CardField, CardItem, CardSection, CardTypeGuards } from '../models';
import { CardChangeType } from '../types';

/**
 * Streaming stage type
 */
export type StreamingStage = 'idle' | 'thinking' | 'streaming' | 'complete' | 'aborted' | 'error';

/**
 * Streaming state interface
 */
export interface StreamingState {
  /** Whether streaming is currently active */
  isActive: boolean;
  /** Current stage of streaming */
  stage: StreamingStage;
  /** Progress from 0-1 */
  progress: number;
  /** Current buffer length */
  bufferLength: number;
  /** Target JSON length */
  targetLength: number;
}

/**
 * Card update event interface
 */
export interface CardUpdate {
  /** The updated card configuration */
  card: AICardConfig;
  /** Type of change (structural or content) */
  changeType: CardChangeType;
  /** Indices of completed sections */
  completedSections?: number[];
}

/**
 * Streaming configuration options
 */
export interface StreamingConfig {
  /** Minimum chunk size in characters */
  minChunkSize: number;
  /** Maximum chunk size in characters */
  maxChunkSize: number;
  /** Thinking delay in milliseconds */
  thinkingDelayMs: number;
  /** Characters per token for speed calculation */
  charsPerToken: number;
  /** Target tokens per second */
  tokensPerSecond: number;
  /** Card update throttle in milliseconds */
  cardUpdateThrottleMs: number;
  /** Completion batch delay in milliseconds */
  completionBatchDelayMs: number;
}

/** Default streaming configuration */
const DEFAULT_CONFIG: StreamingConfig = {
  minChunkSize: 10,
  maxChunkSize: 50,
  thinkingDelayMs: 100,
  charsPerToken: 4,
  tokensPerSecond: 80,
  cardUpdateThrottleMs: 50,
  completionBatchDelayMs: 100,
};

/**
 * Generate unique ID for card elements
 */
function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Ensure all card elements have IDs
 */
function ensureCardIds(card: AICardConfig): AICardConfig {
  return {
    ...card,
    sections: (card.sections || []).map((section, sectionIndex) => ({
      ...section,
      id: section.id || generateId(`section-${sectionIndex}`),
      fields: (section.fields || []).map((field, fieldIndex) => ({
        ...field,
        id: field.id || generateId(`field-${sectionIndex}-${fieldIndex}`),
      })),
      items: (section.items || []).map((item, itemIndex) => ({
        ...item,
        id: item.id || generateId(`item-${sectionIndex}-${itemIndex}`),
      })),
    })),
  };
}

/**
 * OSI Cards Streaming Service
 *
 * Handles progressive card generation with streaming simulation.
 * Use this service to display cards as they're being generated,
 * providing a smooth streaming experience.
 */
@Injectable({
  providedIn: 'root',
})
export class OSICardsStreamingService implements OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private config: StreamingConfig = { ...DEFAULT_CONFIG };

  private readonly stateSubject = new BehaviorSubject<StreamingState>({
    isActive: false,
    stage: 'idle',
    progress: 0,
    bufferLength: 0,
    targetLength: 0,
  });

  private readonly cardUpdateSubject = new Subject<CardUpdate>();
  private readonly bufferUpdateSubject = new Subject<string>();

  /** Observable of streaming state changes */
  readonly state$: Observable<StreamingState> = this.stateSubject.asObservable();

  /** Observable of card updates as they stream in */
  readonly cardUpdates$: Observable<CardUpdate> = this.cardUpdateSubject.asObservable();

  /** Observable of raw buffer updates (for JSON editor sync) */
  readonly bufferUpdates$: Observable<string> = this.bufferUpdateSubject.asObservable();

  private targetJson = '';
  private buffer = '';
  private chunksQueue: string[] = [];
  private placeholderCard: AICardConfig | null = null;
  private parsedCard: AICardConfig | null = null;
  private sectionCompletionStates = new Map<string, boolean>();
  private lastKnownSectionCount = 0;

  // Timers
  private thinkingTimer: ReturnType<typeof setTimeout> | null = null;
  private chunkTimer: ReturnType<typeof setTimeout> | null = null;
  private completionBatchTimer: ReturnType<typeof setTimeout> | null = null;
  private cardUpdateThrottleTimer: ReturnType<typeof setTimeout> | null = null;

  // Throttling state
  private pendingCompletedSectionIndices: number[] = [];
  private pendingCardUpdate: CardUpdate | null = null;
  private lastCardUpdateTime = 0;

  // Partial section tracking
  private partiallyCompletedSectionIndices = new Set<number>();
  private partialSections: CardSection[] = [];
  private partialCardTitle = '';
  private detectedSectionTitles = new Set<string>();

  /**
   * Configure streaming behavior
   * @param config Partial configuration to override defaults
   */
  configure(config: Partial<StreamingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Start streaming with target JSON
   * @param targetJson The JSON string to stream
   * @param options Optional settings for streaming behavior
   */
  start(targetJson: string, options?: { instant?: boolean }): void {
    this.stop();
    this.targetJson = targetJson;
    this.buffer = '';
    this.chunksQueue = this.createChunks(targetJson);
    this.parsedCard = null;
    this.lastKnownSectionCount = 0;
    this.sectionCompletionStates.clear();
    this.pendingCompletedSectionIndices = [];
    this.partiallyCompletedSectionIndices.clear();
    this.partialSections = [];
    this.partialCardTitle = '';
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

    // Create placeholder card
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
      this.processAllChunksInstantly();
    } else {
      this.thinkingTimer = setTimeout(() => {
        this.updateState({ stage: 'streaming' });
        this.scheduleNextChunk();
      }, this.config.thinkingDelayMs);
    }
  }

  /**
   * Stop streaming
   */
  stop(): void {
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
    this.pendingCompletedSectionIndices = [];
    this.pendingCardUpdate = null;
    this.lastCardUpdateTime = 0;
  }

  /**
   * Get current state
   */
  getState(): StreamingState {
    return this.stateSubject.value;
  }

  /**
   * Get current placeholder card
   */
  getPlaceholderCard(): AICardConfig | null {
    return this.placeholderCard;
  }

  ngOnDestroy(): void {
    this.stop();
  }

  // ============================================
  // Private Methods
  // ============================================

  private processAllChunksInstantly(): void {
    while (this.chunksQueue.length > 0) {
      const nextChunk = this.chunksQueue.shift() ?? '';
      this.buffer += nextChunk;
    }

    this.bufferUpdateSubject.next(this.buffer);

    const parsed = this.tryParseBuffer();
    if (!parsed) {
      this.updateState({
        isActive: false,
        stage: 'error',
        progress: 0,
        bufferLength: this.buffer.length,
        targetLength: this.targetJson.length,
      });
      return;
    }

    // In instant mode, use parsed sections directly since we have the complete card
    const hasSections = parsed.sections && parsed.sections.length > 0;

    if (parsed && hasSections) {
      // Use parsed card directly with IDs ensured - no need for placeholder merging in instant mode
      const finalCard = ensureCardIds(parsed);

      // Update section completion states
      const allSectionIndices = (finalCard.sections || []).map((_, index) => index);
      allSectionIndices.forEach((index) => {
        const section = finalCard.sections?.[index];
        if (section) {
          const sectionKey = section.id || `section-${index}`;
          this.sectionCompletionStates.set(sectionKey, true);
        }
      });

      // Update placeholder card for consistency (used by other methods)
      this.placeholderCard = finalCard;
      this.lastKnownSectionCount = finalCard.sections.length;

      this.updateState({
        progress: 1,
        bufferLength: this.buffer.length,
      });

      this.emitCardUpdate(finalCard, 'structural', allSectionIndices);
      this.pendingCompletedSectionIndices = [];
    } else if (parsed) {
      // Card parsed but no sections - emit it anyway (might be a card with no sections)
      const cardWithIds = ensureCardIds(parsed);
      this.placeholderCard = cardWithIds;
      this.emitCardUpdate(cardWithIds, 'structural');
    } else if (this.placeholderCard) {
      // Fallback: if we have placeholders but parsing failed, use placeholders
      const allSectionIndices = (this.placeholderCard.sections || []).map((_, index) => index);

      allSectionIndices.forEach((index) => {
        const section = this.placeholderCard?.sections?.[index];
        if (section) {
          const sectionKey = section.id || `section-${index}`;
          this.sectionCompletionStates.set(sectionKey, true);
        }
      });

      this.updateState({
        progress: 1,
        bufferLength: this.buffer.length,
      });

      this.emitCardUpdate(this.placeholderCard, 'structural', allSectionIndices);
      this.pendingCompletedSectionIndices = [];
    }

    this.updateState({
      isActive: false,
      stage: 'complete',
      progress: 1,
    });
  }

  private createChunks(payload: string): string[] {
    const sanitized = payload.replace(/\r\n/g, '\n');
    const chunks: string[] = [];
    let buffer = '';
    const { minChunkSize, maxChunkSize } = this.config;

    for (const char of sanitized) {
      buffer += char;
      const isBoundary = /[\n,}\]]/.test(char);
      const reachedMax = buffer.length >= maxChunkSize;
      const reachedBoundary = buffer.length >= minChunkSize && isBoundary;
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

    this.bufferUpdateSubject.next(this.buffer);

    const parsed = this.tryParseBuffer();
    if (parsed) {
      const placeholdersCreated = this.initializePlaceholdersIfNeeded(parsed);
      if (placeholdersCreated && this.placeholderCard) {
        this.emitCardUpdate(this.placeholderCard, 'structural');
      }

      if (this.placeholderCard) {
        const completedSections = this.checkSectionCompletions(parsed);

        if (completedSections.length > 0) {
          this.updateCompletedSectionsOnly(parsed, completedSections);
          this.pendingCompletedSectionIndices.push(...completedSections);
          this.batchSectionCompletions();
        }

        this.emitProgressiveUpdate(parsed);
      }
    } else {
      const { newlyCompleted, card } = this.detectCompletedSectionsFromBuffer();

      if (card) {
        this.placeholderCard = card;
        const changeType: CardChangeType = newlyCompleted.length > 0 ? 'structural' : 'content';
        this.emitCardUpdate(card, changeType);
      }
    }

    const progress =
      this.targetJson.length > 0 ? Math.min(1, this.buffer.length / this.targetJson.length) : 0;

    this.updateState({
      progress,
      bufferLength: this.buffer.length,
    });

    const delay = hasMore ? this.computeChunkDelay(nextChunk) : 100;
    this.chunkTimer = setTimeout(() => {
      if (hasMore) {
        this.scheduleNextChunk();
      } else {
        this.finish();
      }
    }, delay);
  }

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

  private detectCompletedSectionsFromBuffer(): {
    newlyCompleted: number[];
    card: AICardConfig | null;
  } {
    const newlyCompleted: number[] = [];

    const sectionsMatch = this.buffer.match(/"sections"\s*:\s*\[/);
    if (!sectionsMatch || sectionsMatch.index === undefined) {
      return { newlyCompleted, card: null };
    }

    const sectionsStartIndex = sectionsMatch.index + sectionsMatch[0].length;
    const sectionsContent = this.buffer.slice(sectionsStartIndex);

    const titleMatch = this.buffer.match(/"cardTitle"\s*:\s*"([^"]*)"/);
    if (titleMatch && titleMatch[1]) {
      this.partialCardTitle = titleMatch[1];
    }

    let sectionIndex = 0;
    let i = 0;

    while (i < sectionsContent.length) {
      let currentChar = sectionsContent[i];
      while (i < sectionsContent.length && currentChar && /[\s,]/.test(currentChar)) {
        i++;
        currentChar = sectionsContent[i];
      }

      if (i >= sectionsContent.length || currentChar === ']') {
        break;
      }

      if (currentChar === '{') {
        const sectionStart = i;
        let braceDepth = 0;
        let inString = false;
        let escapeNext = false;
        let sectionEnd = -1;

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

          if (inString) continue;

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
          const sectionJson = sectionsContent.slice(sectionStart, sectionEnd + 1);

          try {
            const section = JSON.parse(sectionJson) as CardSection;

            if (!this.partiallyCompletedSectionIndices.has(sectionIndex)) {
              this.partiallyCompletedSectionIndices.add(sectionIndex);
              newlyCompleted.push(sectionIndex);

              const sectionWithId = {
                ...section,
                id: section.id ?? `llm-section-${sectionIndex}`,
              };
              this.partialSections[sectionIndex] = sectionWithId;
            }

            i = sectionEnd + 1;
            sectionIndex++;
          } catch {
            i++;
          }
        } else {
          break;
        }
      } else {
        i++;
      }
    }

    if (this.partialSections.length > 0 || this.partialCardTitle) {
      const partialCard: AICardConfig = {
        cardTitle: this.partialCardTitle || 'Generating...',
        sections: [...this.partialSections],
      };
      return { newlyCompleted, card: ensureCardIds(partialCard) };
    }

    return { newlyCompleted, card: null };
  }

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

  private createPlaceholderSection(section: CardSection, sectionIndex: number): CardSection {
    return {
      ...section,
      id: section.id ?? `llm-section-${sectionIndex}`,
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

  private createPlaceholderField(
    field: CardField,
    sectionIndex: number,
    fieldIndex: number
  ): CardField {
    return {
      ...field,
      id: field.id ?? `llm-field-${sectionIndex}-${fieldIndex}`,
      label: field.label || field.title || `Field ${fieldIndex + 1}`,
      value: field.value ?? '',
      meta: { ...(field.meta ?? {}), placeholder: true },
    };
  }

  private createPlaceholderItem(item: CardItem, sectionIndex: number, itemIndex: number): CardItem {
    return {
      ...item,
      id: item.id ?? `llm-item-${sectionIndex}-${itemIndex}`,
      title: item.title || `Item ${itemIndex + 1}`,
      description: item.description ?? '',
      meta: { ...(item.meta ?? {}), placeholder: true },
    };
  }

  private checkSectionCompletions(parsed: AICardConfig): number[] {
    const sections = parsed.sections ?? [];
    const newlyCompleted: number[] = [];

    sections.forEach((section, index) => {
      const sectionKey = section.id || `section-${index}`;
      const wasComplete = this.sectionCompletionStates.get(sectionKey) || false;

      if (wasComplete) {
        return;
      }

      const isComplete = this.isSectionComplete(section);

      if (isComplete) {
        this.sectionCompletionStates.set(sectionKey, true);
        newlyCompleted.push(index);
      }
    });

    return newlyCompleted;
  }

  private isSectionComplete(section: CardSection): boolean {
    const fields = section.fields ?? [];
    for (const field of fields) {
      const meta = field.meta as Record<string, unknown> | undefined;
      const isPlaceholder =
        field.value === undefined || field.value === null || (meta && meta['placeholder'] === true);
      if (isPlaceholder) {
        return false;
      }
    }

    const items = section.items ?? [];
    for (const item of items) {
      const meta = item.meta as Record<string, unknown> | undefined;
      const isPlaceholder =
        !item.title || item.title.startsWith('Item ') || (meta && meta['placeholder'] === true);
      if (isPlaceholder) {
        return false;
      }
    }

    return true;
  }

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

      placeholderSection.title = incomingSection.title ?? placeholderSection.title;
      placeholderSection.subtitle = incomingSection.subtitle ?? placeholderSection.subtitle;
      placeholderSection.type = incomingSection.type ?? placeholderSection.type;
      placeholderSection.description =
        incomingSection.description ?? placeholderSection.description;

      this.updateFieldsInPlace(
        placeholderSection.fields ?? [],
        incomingSection.fields ?? [],
        index
      );
      this.updateItemsInPlace(placeholderSection.items ?? [], incomingSection.items ?? [], index);

      const meta = placeholderSection.meta as Record<string, unknown> | undefined;
      if (meta) {
        meta['placeholder'] = false;
      }
    });
  }

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
        id: incomingField?.id ?? `llm-field-${sectionIndex}-${fieldIndex}`,
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
      existingField.type = incomingField.type ?? existingField.type;

      const meta = existingField.meta as Record<string, unknown> | undefined;
      if (meta) {
        meta['placeholder'] = false;
      }
    }
  }

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
        id: incomingItem?.id ?? `llm-item-${sectionIndex}-${itemIndex}`,
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
      existingItem.value = incomingItem.value ?? existingItem.value;

      const meta = existingItem.meta as Record<string, unknown> | undefined;
      if (meta) {
        meta['placeholder'] = false;
      }
    }
  }

  private batchSectionCompletions(): void {
    if (this.completionBatchTimer) {
      clearTimeout(this.completionBatchTimer);
    }

    this.completionBatchTimer = setTimeout(() => {
      if (this.placeholderCard && this.pendingCompletedSectionIndices.length > 0) {
        const changeType: CardChangeType = 'structural';
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
    }, this.config.completionBatchDelayMs);
  }

  private computeChunkDelay(chunk: string): number {
    const { charsPerToken, tokensPerSecond } = this.config;
    const msPerToken = 1000 / tokensPerSecond;
    const tokensInChunk = Math.max(1, chunk.length / charsPerToken);
    return Math.round(tokensInChunk * msPerToken);
  }

  private emitProgressiveUpdate(parsed: AICardConfig): void {
    if (!this.placeholderCard) {
      return;
    }

    if (parsed.cardTitle) {
      this.placeholderCard.cardTitle = parsed.cardTitle;
    }

    const incomingSections = parsed.sections ?? [];
    const placeholderSections = this.placeholderCard.sections ?? [];

    incomingSections.forEach((incomingSection, index) => {
      const placeholderSection = placeholderSections[index];
      if (!placeholderSection) return;

      if (incomingSection.title) {
        placeholderSection.title = incomingSection.title;
      }
      if (incomingSection.description) {
        placeholderSection.description = incomingSection.description;
      }

      const incomingFields = incomingSection.fields ?? [];
      const placeholderFields = placeholderSection.fields ?? [];
      incomingFields.forEach((incomingField, fieldIndex) => {
        const placeholderField = placeholderFields[fieldIndex];
        if (placeholderField && incomingField.value !== undefined) {
          placeholderField.label = incomingField.label ?? placeholderField.label;
          placeholderField.value = incomingField.value;
        }
      });

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

    this.emitCardUpdate(this.placeholderCard, 'content');
  }

  private emitCardUpdate(
    card: AICardConfig,
    changeType: CardChangeType,
    completedSections?: number[]
  ): void {
    const now = Date.now();
    const throttleMs = this.config.cardUpdateThrottleMs;
    const isStreaming = this.getState().isActive && this.getState().stage === 'streaming';
    const isStructuralChange = changeType === 'structural';
    const isCompletionEvent = completedSections && completedSections.length > 0;

    const shouldEmitImmediately =
      !isStreaming ||
      isStructuralChange ||
      isCompletionEvent ||
      now - this.lastCardUpdateTime >= throttleMs;

    if (shouldEmitImmediately) {
      this.lastCardUpdateTime = now;
      this.pendingCardUpdate = null;

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
      this.pendingCardUpdate = { card, changeType, completedSections };

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

  private updateState(updates: Partial<StreamingState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...updates,
    });
  }

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
