import { Injectable, inject } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { AICardConfig, CardSection, CardField, CardItem } from '../../models';
import { CardChangeType } from '../../shared/utils/card-diff.util';
import { AppConfigService } from './app-config.service';
import { ensureCardIds } from '../../shared/utils/card-utils';
import { CardTypeGuards } from '../../models';

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
 * Service for managing LLM streaming simulation
 * Handles chunking, parsing, and progressive card updates
 */
@Injectable({
  providedIn: 'root'
})
export class LLMStreamingService {
  private readonly config = inject(AppConfigService);

  private readonly stateSubject = new BehaviorSubject<LLMStreamingState>({
    isActive: false,
    stage: 'idle',
    progress: 0,
    bufferLength: 0,
    targetLength: 0
  });

  private readonly cardUpdateSubject = new Subject<{
    card: AICardConfig;
    changeType: CardChangeType;
    completedSections?: number[];
  }>();

  readonly state$ = this.stateSubject.asObservable();
  readonly cardUpdates$ = this.cardUpdateSubject.asObservable();

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
  private pendingCompletedSectionIndices: number[] = [];

  /**
   * Start LLM simulation with target JSON
   */
  start(targetJson: string): void {
    this.stop();
    this.targetJson = targetJson;
    this.buffer = '';
    this.chunksQueue = this.createChunks(targetJson);
    this.parsedCard = null;
    this.lastKnownSectionCount = 0;
    this.sectionCompletionStates.clear();
    this.sectionCompletionPercentages.clear();
    this.pendingCompletedSectionIndices = [];

    if (!this.chunksQueue.length) {
      this.updateState({
        isActive: false,
        stage: 'error',
        progress: 0,
        bufferLength: 0,
        targetLength: 0
      });
      return;
    }

    // Create empty card structure immediately
    const emptyCard: AICardConfig = {
      cardTitle: 'Generating card…',
      sections: []
    };
    this.placeholderCard = ensureCardIds(emptyCard);

    this.updateState({
      isActive: true,
      stage: 'thinking',
      progress: 0,
      bufferLength: 0,
      targetLength: targetJson.length
    });

    // Begin streaming after thinking delay
    this.thinkingTimer = setTimeout(() => {
      this.updateState({ stage: 'streaming' });
      this.scheduleNextChunk();
    }, this.config.LLM_SIMULATION.THINKING_DELAY_MS);
  }

  /**
   * Stop LLM simulation
   */
  stop(): void {
    this.clearTimers();
    this.updateState({
      isActive: false,
      stage: 'idle',
      progress: 0,
      bufferLength: 0,
      targetLength: 0
    });
    this.buffer = '';
    this.chunksQueue = [];
    this.placeholderCard = null;
    this.parsedCard = null;
    this.lastKnownSectionCount = 0;
    this.sectionCompletionStates.clear();
    this.sectionCompletionPercentages.clear();
    this.pendingCompletedSectionIndices = [];
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

    // Parse and check for section completions
    const parsed = this.tryParseBuffer();
    if (parsed) {
      // Initialize placeholders if sections are declared for first time
      const placeholdersCreated = this.initializePlaceholdersIfNeeded(parsed);
      if (placeholdersCreated && this.placeholderCard) {
        this.emitCardUpdate(this.placeholderCard, 'structural');
      }

      // Check if any sections completed
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
      }
    }

    // Update progress
    const progress = this.targetJson.length > 0
      ? Math.min(1, this.buffer.length / this.targetJson.length)
      : 0;

    this.updateState({
      progress,
      bufferLength: this.buffer.length
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
      progress: 1
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
      sections: placeholderSections
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
      id: section.id ?? `llm-section-${sectionIndex}`,
      title: section.title || `Section ${sectionIndex + 1}`,
      fields: (section.fields ?? []).map((field, fieldIndex) =>
        this.createPlaceholderField(field, sectionIndex, fieldIndex)
      ),
      items: (section.items ?? []).map((item, itemIndex) =>
        this.createPlaceholderItem(item, sectionIndex, itemIndex)
      ),
      meta: { ...(section.meta ?? {}), placeholder: true, streamingOrder: sectionIndex }
    };
  }

  /**
   * Create placeholder field
   */
  private createPlaceholderField(field: CardField, sectionIndex: number, fieldIndex: number): CardField {
    return {
      ...field,
      id: field.id ?? `llm-field-${sectionIndex}-${fieldIndex}`,
      label: field.label || field.title || `Field ${fieldIndex + 1}`,
      value: field.value ?? '',
      meta: { ...(field.meta ?? {}), placeholder: true }
    };
  }

  /**
   * Create placeholder item
   */
  private createPlaceholderItem(item: CardItem, sectionIndex: number, itemIndex: number): CardItem {
    return {
      ...item,
      id: item.id ?? `llm-item-${sectionIndex}-${itemIndex}`,
      title: item.title || `Item ${itemIndex + 1}`,
      description: item.description ?? '',
      meta: { ...(item.meta ?? {}), placeholder: true }
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
        if (completionPercentage > previousPercentage + this.config.SECTION_COMPLETION.PROGRESS_UPDATE_THRESHOLD) {
          newlyCompleted.push(index);
        }
      }
    });

    return newlyCompleted;
  }

  /**
   * Check which fields have completed
   */
  private checkFieldCompletions(parsed: AICardConfig): Array<{ sectionIndex: number; fieldIndex: number }> {
    const sections = parsed.sections ?? [];
    const completedFields: Array<{ sectionIndex: number; fieldIndex: number }> = [];

    sections.forEach((section, sectionIndex) => {
      const fields = section.fields ?? [];
      fields.forEach((field, fieldIndex) => {
        const meta = field.meta as Record<string, unknown> | undefined;
        const isPlaceholder = field.value === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
                             field.value === undefined ||
                             field.value === null ||
                             (meta && meta['placeholder'] === true);

        if (!isPlaceholder && field.value !== '') {
          const placeholderSection = this.placeholderCard?.sections?.[sectionIndex];
          const placeholderField = placeholderSection?.fields?.[fieldIndex];
          if (placeholderField) {
            const placeholderMeta = placeholderField.meta as Record<string, unknown> | undefined;
            const wasPlaceholder = placeholderField.value === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
                                  placeholderMeta?.['placeholder'] === true;
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

    completedIndices.forEach(index => {
      const placeholderSection = placeholderSections[index];
      const incomingSection = incomingSections[index];

      if (!placeholderSection || !incomingSection) {
        return;
      }

      // Update section properties in-place
      placeholderSection.title = incomingSection.title ?? placeholderSection.title;
      placeholderSection.subtitle = incomingSection.subtitle ?? placeholderSection.subtitle;
      placeholderSection.type = incomingSection.type ?? placeholderSection.type;
      placeholderSection.description = incomingSection.description ?? placeholderSection.description;
      placeholderSection.emoji = incomingSection.emoji ?? placeholderSection.emoji;
      placeholderSection.columns = incomingSection.columns ?? placeholderSection.columns;
      placeholderSection.colSpan = incomingSection.colSpan ?? placeholderSection.colSpan;
      placeholderSection.chartType = incomingSection.chartType ?? placeholderSection.chartType;
      placeholderSection.chartData = incomingSection.chartData ?? placeholderSection.chartData;

      // Update fields and items in-place
      this.updateFieldsInPlace(placeholderSection.fields ?? [], incomingSection.fields ?? [], index);
      this.updateItemsInPlace(placeholderSection.items ?? [], incomingSection.items ?? [], index);

      // Remove placeholder flag
      const meta = placeholderSection.meta as Record<string, unknown> | undefined;
      if (meta) {
        meta['placeholder'] = false;
      }
    });
  }

  /**
   * Update fields array in-place
   */
  private updateFieldsInPlace(existing: CardField[], incoming: CardField[], sectionIndex: number): void {
    const maxLength = Math.max(existing.length, incoming.length);

    while (existing.length < maxLength) {
      const fieldIndex = existing.length;
      const incomingField = incoming[fieldIndex];
      existing.push({
        id: incomingField?.id ?? `llm-field-${sectionIndex}-${fieldIndex}`,
        label: incomingField?.label ?? `Field ${fieldIndex + 1}`,
        value: incomingField?.value ?? '',
        meta: { placeholder: true, ...(incomingField?.meta ?? {}) }
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
        meta['placeholder'] = false;
      }
    }
  }

  /**
   * Update items array in-place
   */
  private updateItemsInPlace(existing: CardItem[], incoming: CardItem[], sectionIndex: number): void {
    const maxLength = Math.max(existing.length, incoming.length);

    while (existing.length < maxLength) {
      const itemIndex = existing.length;
      const incomingItem = incoming[itemIndex];
      existing.push({
        id: incomingItem?.id ?? `llm-item-${sectionIndex}-${itemIndex}`,
        title: incomingItem?.title ?? `Item ${itemIndex + 1}`,
        description: incomingItem?.description ?? '',
        meta: { placeholder: true, ...(incomingItem?.meta ?? {}) }
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
        meta['placeholder'] = false;
      }
    }
  }

  /**
   * Update only completed fields in-place
   */
  private updateCompletedFieldsOnly(incoming: AICardConfig, completedFields: Array<{ sectionIndex: number; fieldIndex: number }>): void {
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
        meta['placeholder'] = false;
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

    fields.forEach(field => {
      const meta = field.meta as Record<string, unknown> | undefined;
      const isPlaceholder = field.value === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
                           field.value === undefined ||
                           field.value === null ||
                           (meta && meta['placeholder'] === true);
      if (!isPlaceholder && field.value !== '') {
        completedCount++;
      }
    });

    items.forEach(item => {
      const meta = item.meta as Record<string, unknown> | undefined;
      const isPlaceholder = (meta && meta['placeholder'] === true) ||
                           (item.title === 'Item' && !item.description);
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
      const isPlaceholder = field.value === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
                           field.value === undefined ||
                           field.value === null ||
                           (meta && meta['placeholder'] === true);
      if (isPlaceholder) {
        return false;
      }
    }

    const items = section.items ?? [];
    for (const item of items) {
      const meta = item.meta as Record<string, unknown> | undefined;
      const isPlaceholder = item.description === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
                           !item.title ||
                           item.title.startsWith('Item ') ||
                           (meta && meta['placeholder'] === true);
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
        const changeType: CardChangeType = this.pendingCompletedSectionIndices.length > 0 ? 'structural' : 'content';
        const completedSet = new Set(this.pendingCompletedSectionIndices);

        const updatedCard: AICardConfig = {
          ...this.placeholderCard,
          cardTitle: this.placeholderCard.cardTitle || '',
          sections: (this.placeholderCard.sections || []).map((section, index) => {
            if (completedSet.has(index)) {
              return {
                ...section,
                fields: section.fields?.map(field => ({ ...field })),
                items: section.items?.map(item => ({ ...item }))
              };
            }
            return section;
          })
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
   * Emit card update
   */
  private emitCardUpdate(card: AICardConfig, changeType: CardChangeType, completedSections?: number[]): void {
    this.cardUpdateSubject.next({
      card,
      changeType,
      completedSections
    });
  }

  /**
   * Update state
   */
  private updateState(updates: Partial<LLMStreamingState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...updates
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
  }
}

