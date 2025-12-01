import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CardField, CardItem, CardSection } from '../../../../models';

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
 *
 * Provides common functionality and ensures consistency across all section types.
 * All section components should extend this class to inherit:
 * - Animation state management (staggered field/item animations)
 * - Interaction event handling (fieldInteraction, itemInteraction)
 * - TrackBy functions for optimal *ngFor performance
 * - Change detection optimization (OnPush strategy with batched updates)
 * - Standardized data access patterns (getFields, getItems)
 *
 * @template T - The type of field/item this section handles (CardField or CardItem)
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-my-section',
 *   standalone: true,
 *   imports: [CommonModule],
 *   templateUrl: './my-section.component.html',
 *   changeDetection: ChangeDetectionStrategy.OnPush
 * })
 * export class MySectionComponent extends BaseSectionComponent<CardField> {
 *   // Component-specific logic here
 * }
 * ```
 */
@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class BaseSectionComponent<
  T extends CardField | CardItem = CardField,
> implements OnChanges {
  @Input({ required: true }) section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<SectionInteraction<T>>();
  @Output() itemInteraction = new EventEmitter<SectionInteraction<T>>();

  protected readonly cdr = inject(ChangeDetectorRef);

  // Animation state tracking
  private readonly fieldAnimationStates = new Map<string, 'entering' | 'entered' | 'none'>();
  private readonly itemAnimationStates = new Map<string, 'entering' | 'entered' | 'none'>();
  private readonly fieldAnimationTimes = new Map<string, number>();
  private readonly itemAnimationTimes = new Map<string, number>();
  private readonly FIELD_STAGGER_DELAY_MS = 30;
  private readonly ITEM_STAGGER_DELAY_MS = 40;
  private readonly FIELD_ANIMATION_DURATION_MS = 300;
  private readonly ITEM_ANIMATION_DURATION_MS = 350;

  // Performance: Batch change detection for animation state updates
  private pendingFieldAnimationUpdates = new Set<string>();
  private pendingItemAnimationUpdates = new Set<string>();
  private fieldAnimationUpdateRafId: number | null = null;
  private itemAnimationUpdateRafId: number | null = null;

  /**
   * Get fields from section (standardized access pattern)
   *
   * Returns the fields array from the section, or an empty array if not available.
   * This method provides a consistent way to access fields across all section components.
   *
   * @returns Array of CardField objects from the section
   *
   * @example
   * ```typescript
   * const fields = this.getFields();
   * fields.forEach(field => {
   *   // Process each field
   * });
   * ```
   */
  protected getFields(): CardField[] {
    return (this.section.fields as CardField[]) ?? [];
  }

  /**
   * Get items from section (standardized access pattern)
   *
   * Returns the items array from the section, or falls back to fields if items are not available.
   * This method provides a consistent way to access items across all section components.
   * If items are not available, it converts fields to items by mapping field properties.
   *
   * @returns Array of CardItem objects from the section, or converted from fields
   *
   * @example
   * ```typescript
   * const items = this.getItems();
   * items.forEach(item => {
   *   // Process each item
   * });
   * ```
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
      // Clear pending updates
      this.pendingFieldAnimationUpdates.clear();
      this.pendingItemAnimationUpdates.clear();
    }
  }

  /**
   * Get animation class for a field based on its appearance state
   *
   * Returns the appropriate CSS class for field animations based on the field's
   * current animation state (entering, entered, or none). Automatically marks new
   * fields as entering if they haven't been seen before.
   *
   * @param fieldId - Unique identifier for the field
   * @param index - Index of the field in the array (used for stagger delay)
   * @returns CSS class name for the animation state ('field-streaming', 'field-entered', or '')
   *
   * @example
   * ```html
   * <div [ngClass]="getFieldAnimationClass(getFieldId(field, i), i)">
   *   {{ field.value }}
   * </div>
   * ```
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
    return this.getFields().length > 0;
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
   *
   * Emits a fieldInteraction event with the field data and metadata.
   * Automatically includes section ID and title in the metadata.
   *
   * @param field - The field that was interacted with
   * @param metadata - Optional additional metadata to include
   *
   * @example
   * ```typescript
   * onFieldClick(field: CardField): void {
   *   this.emitFieldInteraction(field, { action: 'click' });
   * }
   * ```
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
   * TrackBy function for fields - uses stable field ID for optimal *ngFor performance
   *
   * This function should be used with *ngFor trackBy to prevent unnecessary
   * DOM re-renders when the fields array changes. Uses the field's ID if available,
   * otherwise generates a stable ID from the index and label.
   *
   * Can be overridden by child classes for custom tracking logic.
   *
   * @param index - Index of the field in the array
   * @param field - The field object
   * @returns A stable identifier for the field
   *
   * @example
   * ```html
   * <div *ngFor="let field of fields; trackBy: trackField">
   *   {{ field.value }}
   * </div>
   * ```
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
    // Try text (for text-reference fields)
    if ('text' in field && (field as any).text !== undefined && (field as any).text !== null) {
      return (field as any).text;
    }
    // Try quote (for quotation fields)
    if ('quote' in field && (field as any).quote !== undefined && (field as any).quote !== null) {
      return (field as any).quote;
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
}
