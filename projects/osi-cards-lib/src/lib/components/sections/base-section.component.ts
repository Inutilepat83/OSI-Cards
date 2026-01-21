import {
  ChangeDetectionStrategy,
  Component,
  Input,
  EventEmitter,
  Output,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CardField, CardItem, CardSection } from '../../models';
import { SectionDesignParams, getSectionDesignParams } from '../../models';
import { sendDebugLog, safeDebugFetch } from '../../utils';
// #region agent log - Track module evaluation start
if (typeof window !== 'undefined') {
  safeDebugFetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
    location: 'base-section.component.ts:1',
    message: 'Module evaluation START - base-section.component.ts',
    data: { timestamp: Date.now(), moduleId: 'base-section' },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'A',
  });
}
// #endregion

/**
 * Layout configuration for a section type.
 * Each section component defines its own static layoutConfig.
 * @deprecated Use SectionLayoutPreferences instead
 */
export interface SectionLayoutConfig {
  /** Preferred column span (1-4) */
  preferredColumns: number;
  /** Minimum columns the section should span */
  minColumns: number;
  /** Maximum columns the section can span */
  maxColumns: number;
  /** Expand by 1 column when field count exceeds this threshold */
  expandOnFieldCount?: number;
  /** Expand by 1 column when item count exceeds this threshold */
  expandOnItemCount?: number;
  /** Expand by 1 column when description exceeds this character count */
  expandOnDescriptionLength?: number;
  /** For horizontal layouts: set columns to match item count (up to maxColumns) */
  matchItemCount?: boolean;
}

/**
 * Default layout configuration for sections without explicit config
 */
export const DEFAULT_LAYOUT_CONFIG: SectionLayoutConfig = {
  preferredColumns: 1,
  minColumns: 1,
  maxColumns: 4,
};

/**
 * Layout preferences for a section component.
 * Each section component defines its own responsive behavior dynamically.
 */
export interface SectionLayoutPreferences {
  /** Preferred column count (1-4) */
  preferredColumns: 1 | 2 | 3 | 4;
  /** Minimum columns the section should span */
  minColumns: 1 | 2 | 3 | 4;
  /** Maximum columns the section can span */
  maxColumns: 1 | 2 | 3 | 4;
  /** Can shrink to 1 column to fill grid gaps */
  canShrinkToFill: boolean;
  /** Priority when multiple sections can shrink (lower = shrink first) */
  shrinkPriority?: number;
  /** Content-based expansion rules */
  expandOnContent?: {
    /** Expand by 1 column when field count exceeds this threshold */
    fieldCount?: number;
    /** Expand by 1 column when item count exceeds this threshold */
    itemCount?: number;
    /** Expand by 1 column when description exceeds this character count */
    descriptionLength?: number;
  };
}

/**
 * Context for layout suggestions
 */
export interface LayoutSuggestionContext {
  /** Available columns in the grid */
  availableColumns: number;
  /** Current column heights */
  columnHeights?: number[];
  /** Container width */
  containerWidth?: number;
  /** Whether grid has gaps that need filling */
  hasGaps?: boolean;
  /** Remaining sections to be placed */
  pendingSections?: number;
}

/**
 * Layout suggestion event
 */
export interface LayoutSuggestionEvent {
  /** Section ID */
  sectionId?: string;
  /** Suggested column span */
  suggestedColSpan: number;
  /** Reason for suggestion */
  reason: string;
  /** Priority of suggestion (higher = more important) */
  priority?: number;
}

/**
 * Base interface for section field/item interactions
 */
export interface SectionInteraction<T = CardField | CardItem> {
  field?: T;
  item?: T;
  metadata?: Record<string, unknown>;
}

/**
 * Base component class for all section components
 * Provides common functionality and ensures consistency
 */
// #region agent log
if (typeof window !== 'undefined') {
  safeDebugFetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
    location: 'base-section.component.ts:118',
    message: 'BaseSectionComponent class definition starting',
    data: { timestamp: Date.now(), module: 'base-section.component' },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run2',
    hypothesisId: 'A',
  });
}
// #endregion
@Component({
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// CRITICAL: Export as a named export AND ensure it's not tree-shaken
// The 'export abstract class' ensures it's available for extension
export abstract class BaseSectionComponent<
  T extends CardField | CardItem = CardField,
> implements OnChanges {
  // #region agent log
  static readonly __DEBUG_BASE_CLASS_DEFINED = true;
  // Force the class to be included by adding a static property that's always present
  static readonly __FORCE_INCLUDE = true;
  // #endregion
  @Input({ required: true }) section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<SectionInteraction<T>>();
  @Output() itemInteraction = new EventEmitter<SectionInteraction<T>>();
  @Output() layoutSuggestion = new EventEmitter<LayoutSuggestionEvent>();

  protected readonly cdr = inject(ChangeDetectorRef);

  // Animation state tracking
  private readonly fieldAnimationStates = new Map<string, 'entering' | 'entered' | 'none'>();
  private readonly itemAnimationStates = new Map<string, 'entering' | 'entered' | 'none'>();
  private readonly fieldAnimationTimes = new Map<string, number>();
  private readonly itemAnimationTimes = new Map<string, number>();
  private readonly FIELD_STAGGER_DELAY_MS = 40;
  private readonly ITEM_STAGGER_DELAY_MS = 40;
  private readonly FIELD_ANIMATION_DURATION_MS = 300;
  private readonly ITEM_ANIMATION_DURATION_MS = 350;
  private fieldsAnimated = false;
  private itemsAnimated = false;

  // Performance: Batch change detection for animation state updates
  private pendingFieldAnimationUpdates = new Set<string>();
  private pendingItemAnimationUpdates = new Set<string>();
  private fieldAnimationUpdateRafId: number | null = null;
  private itemAnimationUpdateRafId: number | null = null;

  /**
   * Get fields from section (standardized access pattern)
   */
  protected getFields(): CardField[] {
    const fields = (this.section.fields as CardField[]) ?? [];
    // #region agent log
    if (this.section?.type === 'overview' && this.section?.title?.includes('Executive Summary')) {
      sendDebugLog(
        {
          location: 'base-section.component.ts:167',
          message: 'getFields: Executive Summary fields',
          data: {
            sectionType: this.section?.type,
            sectionTitle: this.section?.title,
            fieldsCount: fields.length,
            fields: fields,
            sectionFields: this.section?.fields,
            hasFields: !!this.section?.fields,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H3',
        },
        'http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc'
      );
    }
    // #endregion
    return fields;
  }

  /**
   * Get items from section (standardized access pattern)
   * Falls back to fields if items are not available
   */
  protected getItems(): CardItem[] {
    if (Array.isArray(this.section.items) && this.section.items.length > 0) {
      return this.section.items as CardItem[];
    }

    // Fallback to fields if items are not available
    if (Array.isArray(this.section.fields) && this.section.fields.length > 0) {
      return (this.section.fields as CardField[]).map((field) => {
        const cardField = field as CardField;
        return {
          ...cardField,
          title: cardField.title ?? cardField.label ?? cardField.id,
          description:
            cardField.description ??
            (typeof cardField.meta?.['description'] === 'string'
              ? (cardField.meta['description'] as string)
              : undefined),
        } as CardItem;
      });
    }

    return [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['section']) {
      // #region agent log
      if (this.section?.type === 'overview' && this.section?.title?.includes('Executive Summary')) {
        sendDebugLog(
          {
            location: 'base-section.component.ts:205',
            message: 'BaseSectionComponent: ngOnChanges - Executive Summary',
            data: {
              sectionType: this.section?.type,
              sectionTitle: this.section?.title,
              fieldsCount: this.section?.fields?.length || 0,
              itemsCount: this.section?.items?.length || 0,
              fields: this.section?.fields,
              hasFields: this.hasFields,
              getFieldsResult: this.getFields(),
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'H4',
          },
          'http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc'
        );
      }
      // #endregion

      // Cancel pending RAFs
      if (this.fieldAnimationUpdateRafId !== null) {
        cancelAnimationFrame(this.fieldAnimationUpdateRafId);
        this.fieldAnimationUpdateRafId = null;
      }
      if (this.itemAnimationUpdateRafId !== null) {
        cancelAnimationFrame(this.itemAnimationUpdateRafId);
        this.itemAnimationUpdateRafId = null;
      }
      // Reset animation states when section changes
      this.resetFieldAnimations();
      this.resetItemAnimations();
      this.fieldsAnimated = false;
      this.itemsAnimated = false;
      // Clear pending updates
      this.pendingFieldAnimationUpdates.clear();
      this.pendingItemAnimationUpdates.clear();
    }
  }

  /**
   * Get animation class for a field based on its appearance state
   */
  getFieldAnimationClass(fieldId: string, index: number): string {
    const state = this.fieldAnimationStates.get(fieldId);

    if (state === 'entering') {
      return 'field-streaming';
    }

    if (state === 'entered') {
      return 'field-entered';
    }

    // New field - mark as entering
    if (state === undefined || state === 'none') {
      this.markFieldEntering(fieldId, index);
      return 'field-streaming';
    }

    return '';
  }

  /**
   * Get animation class for an item based on its appearance state
   */
  getItemAnimationClass(itemId: string, index: number): string {
    const state = this.itemAnimationStates.get(itemId);

    if (state === 'entering') {
      return 'item-streaming';
    }

    if (state === 'entered') {
      return 'item-entered';
    }

    // New item - mark as entering
    if (state === undefined || state === 'none') {
      this.markItemEntering(itemId, index);
      return 'item-streaming';
    }

    return '';
  }

  /**
   * Get stagger delay index for field animation
   */
  getFieldStaggerIndex(index: number): number {
    return Math.min(index, 15);
  }

  /**
   * Get stagger delay index for item animation
   */
  getItemStaggerIndex(index: number): number {
    return Math.min(index, 15);
  }

  /**
   * Mark field as entering and schedule entered state
   * Optimized: Batches change detection for better performance
   */
  private markFieldEntering(fieldId: string, index: number): void {
    this.fieldAnimationStates.set(fieldId, 'entering');
    const appearanceTime = Date.now();
    this.fieldAnimationTimes.set(fieldId, appearanceTime);

    // Calculate total delay (stagger + animation duration)
    const staggerDelay = index * this.FIELD_STAGGER_DELAY_MS;
    const totalDelay = staggerDelay + this.FIELD_ANIMATION_DURATION_MS;

    // Mark as entered after animation completes
    // Batch change detection for multiple fields
    setTimeout(() => {
      // Only update if this is still the latest appearance
      if (this.fieldAnimationTimes.get(fieldId) === appearanceTime) {
        this.fieldAnimationStates.set(fieldId, 'entered');
        // Batch change detection - add to pending updates
        this.pendingFieldAnimationUpdates.add(fieldId);
        this.scheduleBatchedFieldChangeDetection();
      }
    }, totalDelay);
  }

  /**
   * Batch change detection for field animation state updates
   */
  private scheduleBatchedFieldChangeDetection(): void {
    if (this.fieldAnimationUpdateRafId !== null) {
      return; // Already scheduled
    }

    this.fieldAnimationUpdateRafId = requestAnimationFrame(() => {
      if (this.pendingFieldAnimationUpdates.size > 0) {
        // Single change detection for all pending updates
        this.cdr.markForCheck();
        this.pendingFieldAnimationUpdates.clear();
      }
      this.fieldAnimationUpdateRafId = null;
    });
  }

  /**
   * Mark item as entering and schedule entered state
   * Optimized: Batches change detection for better performance
   */
  private markItemEntering(itemId: string, index: number): void {
    this.itemAnimationStates.set(itemId, 'entering');
    const appearanceTime = Date.now();
    this.itemAnimationTimes.set(itemId, appearanceTime);

    // Calculate total delay (stagger + animation duration)
    const staggerDelay = index * this.ITEM_STAGGER_DELAY_MS;
    const totalDelay = staggerDelay + this.ITEM_ANIMATION_DURATION_MS;

    // Mark as entered after animation completes
    // Batch change detection for multiple items
    setTimeout(() => {
      // Only update if this is still the latest appearance
      if (this.itemAnimationTimes.get(itemId) === appearanceTime) {
        this.itemAnimationStates.set(itemId, 'entered');
        // Batch change detection - add to pending updates
        this.pendingItemAnimationUpdates.add(itemId);
        this.scheduleBatchedItemChangeDetection();
      }
    }, totalDelay);
  }

  /**
   * Batch change detection for item animation state updates
   */
  private scheduleBatchedItemChangeDetection(): void {
    if (this.itemAnimationUpdateRafId !== null) {
      return; // Already scheduled
    }

    this.itemAnimationUpdateRafId = requestAnimationFrame(() => {
      if (this.pendingItemAnimationUpdates.size > 0) {
        // Single change detection for all pending updates
        this.cdr.markForCheck();
        this.pendingItemAnimationUpdates.clear();
      }
      this.itemAnimationUpdateRafId = null;
    });
  }

  /**
   * Reset field animation states
   */
  private resetFieldAnimations(): void {
    this.fieldAnimationStates.clear();
    this.fieldAnimationTimes.clear();
  }

  /**
   * Reset item animation states
   */
  private resetItemAnimations(): void {
    this.itemAnimationStates.clear();
    this.itemAnimationTimes.clear();
  }

  /**
   * Get field ID for tracking
   */
  protected getFieldId(field: CardField, index: number): string {
    return field.id || `field-${index}-${field.label || ''}`;
  }

  /**
   * Get item ID for tracking
   */
  protected getItemId(item: CardItem, index: number): string {
    return item.id || `item-${index}-${item.title || ''}`;
  }

  /**
   * Check if section has fields
   * Public getter for template access
   */
  get hasFields(): boolean {
    const fields = this.getFields();
    const result = fields.length > 0;
    // #region agent log
    if (this.section?.type === 'overview' && this.section?.title?.includes('Executive Summary')) {
      sendDebugLog(
        {
          location: 'base-section.component.ts:415',
          message: 'hasFields getter: Executive Summary',
          data: {
            sectionType: this.section?.type,
            sectionTitle: this.section?.title,
            fieldsLength: fields.length,
            result: result,
            fields: fields,
            sectionFieldsLength: this.section?.fields?.length || 0,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run2',
          hypothesisId: 'H3',
        },
        'http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc'
      );
    }
    // #endregion
    return result;
  }

  /**
   * Check if section has items
   * Public getter for template access
   */
  get hasItems(): boolean {
    return this.getItems().length > 0;
  }

  /**
   * Emit field interaction event (standardized pattern)
   */
  protected emitFieldInteraction(field: T, metadata?: Record<string, unknown>): void {
    this.fieldInteraction.emit({
      field,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title,
        ...metadata,
      },
    });
  }

  /**
   * Emit item interaction event (standardized pattern)
   */
  protected emitItemInteraction(item: T, metadata?: Record<string, unknown>): void {
    this.itemInteraction.emit({
      item,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title,
        ...metadata,
      },
    });
  }

  /**
   * Phase 5: Perfect trackBy function for fields - uses stable field ID
   * Can be overridden by child classes for custom tracking
   */
  protected trackField(index: number, field: CardField): string {
    return field.id || `field-${index}-${field.label || ''}`;
  }

  /**
   * Phase 5: Perfect trackBy function for items - uses stable item ID
   * Can be overridden by child classes for custom tracking
   */
  protected trackItem(index: number, item: CardItem): string {
    return item.id || `item-${index}-${item.title || ''}`;
  }

  // Display methods removed - each component now implements its own to avoid TypeScript override conflicts
  // The logic is consistent: filter out "Streaming…" placeholder text

  /**
   * Safe value accessor - extracts value from field with fallback options
   * Handles field.value, field.text, field.quote based on field type
   */
  protected getFieldValue(field: CardField): string | number | boolean | undefined | null {
    // Try value first (most common)
    if (field.value !== undefined && field.value !== null) {
      return field.value;
    }
    // Try text (for text-reference fields) - use index signature
    const textValue = field['text'];
    if (textValue !== undefined && textValue !== null) {
      return textValue as string | number | boolean;
    }
    // Try quote (for quotation fields) - use index signature
    const quoteValue = field['quote'];
    if (quoteValue !== undefined && quoteValue !== null) {
      return quoteValue as string | number | boolean;
    }
    return undefined;
  }

  /**
   * Safe metadata accessor - extracts metadata value safely
   */
  protected getMetaValue(field: CardField, key: string): unknown {
    return field.meta?.[key];
  }

  /**
   * Check if a value represents streaming placeholder
   */
  protected isStreamingPlaceholder(value: unknown): boolean {
    return value === 'Streaming…' || value === 'Streaming...';
  }

  /**
   * Get design parameters from section meta
   * Provides easy access to design customization in templates
   */
  protected getDesignParams(): SectionDesignParams | undefined {
    return getSectionDesignParams(this.section.meta);
  }

  /**
   * Check if section has custom design parameters
   */
  protected get hasDesignParams(): boolean {
    return !!this.getDesignParams();
  }

  // ============================================================================
  // LAYOUT PREFERENCES (Dynamic Section Responsive Layout System)
  // ============================================================================

  /**
   * Get layout preferences for this section.
   * Each section component should override this method to define its own
   * responsive behavior based on content and context.
   *
   * @param availableColumns - Number of columns available in the grid
   * @returns Layout preferences for this section
   */
  getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    // Default implementation - sections should override
    const fieldCount = this.getFields().length;
    const itemCount = this.getItems().length;
    const descriptionLength = this.section.description?.length ?? 0;

    // Calculate preferred columns based on content
    let preferredColumns: 1 | 2 | 3 | 4 = 1;
    if (fieldCount > 6 || itemCount > 6) {
      preferredColumns = 2;
    }
    if (fieldCount > 10 || itemCount > 10 || descriptionLength > 200) {
      preferredColumns = 3;
    }

    return {
      preferredColumns: Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4,
      minColumns: 1,
      maxColumns: Math.min(4, availableColumns) as 1 | 2 | 3 | 4,
      canShrinkToFill: true, // Default: allow shrinking to fill grid (promotes side-by-side)
      shrinkPriority: 40, // Lower priority = more willing to shrink (better consolidation)
      expandOnContent: {
        fieldCount: 6,
        itemCount: 6,
        descriptionLength: 200,
      },
    };
  }

  /**
   * Suggest a layout change to the grid system.
   * Called when section wants to proactively suggest a different column span.
   *
   * @param suggestedColSpan - Suggested column span
   * @param reason - Reason for the suggestion
   * @param priority - Priority of suggestion (higher = more important)
   */
  suggestLayout(suggestedColSpan: number, reason: string, priority: number = 50): void {
    this.layoutSuggestion.emit({
      sectionId: this.section.id,
      suggestedColSpan: Math.max(1, Math.min(4, suggestedColSpan)),
      reason,
      priority,
    });
  }

  /**
   * Calculate optimal column count based on section content.
   * Helper method that sections can use in their getLayoutPreferences() implementation.
   *
   * @param availableColumns - Maximum columns available
   * @param options - Calculation options
   * @returns Optimal column count
   */
  protected calculateOptimalColumns(
    availableColumns: number = 4,
    options?: {
      fieldCount?: number;
      itemCount?: number;
      descriptionLength?: number;
      baseColumns?: number;
    }
  ): 1 | 2 | 3 | 4 {
    const fieldCount = options?.fieldCount ?? this.getFields().length;
    const itemCount = options?.itemCount ?? this.getItems().length;
    const descriptionLength = options?.descriptionLength ?? this.section.description?.length ?? 0;
    const baseColumns = options?.baseColumns ?? 1;

    let optimal = baseColumns;

    // Expand based on content
    if (fieldCount > 6 || itemCount > 6) {
      optimal = Math.max(optimal, 2);
    }
    if (fieldCount > 10 || itemCount > 10 || descriptionLength > 200) {
      optimal = Math.max(optimal, 3);
    }
    if (fieldCount > 15 || itemCount > 15 || descriptionLength > 400) {
      optimal = Math.max(optimal, 4);
    }

    return Math.min(optimal, availableColumns) as 1 | 2 | 3 | 4;
  }
}
// #region agent log
if (typeof window !== 'undefined') {
  safeDebugFetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
    location: 'base-section.component.ts:594',
    message: 'BaseSectionComponent class definition complete',
    data: {
      classDefined: typeof BaseSectionComponent !== 'undefined',
      isConstructor: typeof BaseSectionComponent === 'function',
      name: BaseSectionComponent?.name || 'undefined',
      hasStaticProp: !!BaseSectionComponent?.__DEBUG_BASE_CLASS_DEFINED,
    },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run3',
    hypothesisId: 'A',
  });
}
// Ensure BaseSectionComponent is available globally to prevent chunk loading issues
if (typeof window !== 'undefined') {
  (window as any).__BaseSectionComponent = BaseSectionComponent;
  console.log(
    '[DEBUG] BaseSectionComponent registered globally:',
    typeof BaseSectionComponent,
    BaseSectionComponent.name
  );
  // Also ensure it's the same reference as the one in main.ts
  if ((window as any).__BaseSectionComponentForced) {
    const same = (window as any).__BaseSectionComponentForced === BaseSectionComponent;
    console.log('[DEBUG] BaseSectionComponent reference match:', same);
    if (!same) {
      console.error(
        '[FATAL] BaseSectionComponent references differ! This indicates chunk isolation issue.'
      );
    }
  }
}
// #endregion
