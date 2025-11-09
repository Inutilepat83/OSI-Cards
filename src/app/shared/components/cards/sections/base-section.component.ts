import { ChangeDetectionStrategy, Component, Input, EventEmitter, Output } from '@angular/core';
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
 * Provides common functionality and ensures consistency
 */
@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export abstract class BaseSectionComponent<T extends CardField | CardItem = CardField> {
  @Input({ required: true }) section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<SectionInteraction<T>>();
  @Output() itemInteraction = new EventEmitter<SectionInteraction<T>>();

  /**
   * Get fields from section (standardized access pattern)
   */
  protected getFields(): CardField[] {
    return (this.section.fields as CardField[]) ?? [];
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
          description: cardField.description ?? (typeof cardField.meta?.['description'] === 'string' 
            ? cardField.meta['description'] as string 
            : undefined)
        } as CardItem;
      });
    }
    
    return [];
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
   */
  protected emitFieldInteraction(field: T, metadata?: Record<string, unknown>): void {
    this.fieldInteraction.emit({
      field,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title,
        ...metadata
      }
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
        ...metadata
      }
    });
  }

  /**
   * Get standardized animation delay for staggered animations
   * Public for template access
   */
  getAnimationDelay(index: number, baseDelay: number = 60): string {
    return `${index * baseDelay}ms`;
  }

  /**
   * Get standardized animation duration
   * Public for template access
   */
  getAnimationDuration(duration: number = 0.6): string {
    return `fadeInUp ${duration}s ease-out forwards`;
  }
}

