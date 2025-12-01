import { inject, Injectable } from '@angular/core';
import { CardField, CardItem, CardSection } from '../../models';
import { AppConfigService } from '../../core/services/app-config.service';

export interface SectionCompletionState {
  sectionId: string;
  isComplete: boolean;
  completionPercentage: number;
  fieldCount: number;
  itemCount: number;
  completedFieldCount: number;
  completedItemCount: number;
}

/**
 * Service for tracking section completion states
 * Extracted from HomePageComponent for better testability and reusability
 */
@Injectable({
  providedIn: 'root',
})
export class SectionCompletionService {
  private readonly config = inject(AppConfigService);
  private readonly completionStates = new Map<string, boolean>();
  private readonly completionPercentages = new Map<string, number>();

  /**
   * Check if a section is complete
   */
  isSectionComplete(section: CardSection): boolean {
    const fields = section.fields ?? [];
    for (const field of fields) {
      const meta = field.meta as Record<string, unknown> | undefined;
      const isPlaceholder =
        field.value === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
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
      const isPlaceholder =
        item.description === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
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
   * Calculate completion percentage for a section (0-1)
   */
  calculateCompletionPercentage(section: CardSection): number {
    const fields = section.fields ?? [];
    const items = section.items ?? [];
    const totalElements = fields.length + items.length;

    if (totalElements === 0) {
      return section.title ? 0.5 : 0;
    }

    let completedCount = 0;

    // Check fields
    fields.forEach((field) => {
      const meta = field.meta as Record<string, unknown> | undefined;
      const isPlaceholder =
        field.value === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
        field.value === undefined ||
        field.value === null ||
        (meta && meta['placeholder'] === true);
      if (!isPlaceholder && field.value !== '') {
        completedCount++;
      }
    });

    // Check items
    items.forEach((item) => {
      const meta = item.meta as Record<string, unknown> | undefined;
      const isPlaceholder =
        (meta && meta['placeholder'] === true) || (item.title === 'Item' && !item.description);
      if (!isPlaceholder && item.title) {
        completedCount++;
      }
    });

    return totalElements > 0 ? completedCount / totalElements : 0;
  }

  /**
   * Get completion state for a section
   */
  getCompletionState(section: CardSection, sectionIndex: number): SectionCompletionState {
    const sectionId = section.id || `section-${sectionIndex}`;
    const fields = section.fields ?? [];
    const items = section.items ?? [];
    const isComplete = this.isSectionComplete(section);
    const completionPercentage = this.calculateCompletionPercentage(section);

    let completedFieldCount = 0;
    fields.forEach((field) => {
      const meta = field.meta as Record<string, unknown> | undefined;
      const isPlaceholder =
        field.value === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
        field.value === undefined ||
        field.value === null ||
        (meta && meta['placeholder'] === true);
      if (!isPlaceholder && field.value !== '') {
        completedFieldCount++;
      }
    });

    let completedItemCount = 0;
    items.forEach((item) => {
      const meta = item.meta as Record<string, unknown> | undefined;
      const isPlaceholder =
        (meta && meta['placeholder'] === true) || (item.title === 'Item' && !item.description);
      if (!isPlaceholder && item.title) {
        completedItemCount++;
      }
    });

    return {
      sectionId,
      isComplete,
      completionPercentage,
      fieldCount: fields.length,
      itemCount: items.length,
      completedFieldCount,
      completedItemCount,
    };
  }

  /**
   * Check if a field is a placeholder
   */
  isFieldPlaceholder(field: CardField): boolean {
    const meta = field.meta as Record<string, unknown> | undefined;
    return (
      field.value === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
      field.value === undefined ||
      field.value === null ||
      (!!meta && meta['placeholder'] === true)
    );
  }

  /**
   * Check if an item is a placeholder
   */
  isItemPlaceholder(item: CardItem): boolean {
    const meta = item.meta as Record<string, unknown> | undefined;
    return (
      item.description === this.config.SECTION_COMPLETION.PLACEHOLDER_VALUE ||
      !item.title ||
      item.title.startsWith('Item ') ||
      (!!meta && meta['placeholder'] === true)
    );
  }

  /**
   * Set completion state for a section
   */
  setCompletionState(sectionId: string, isComplete: boolean, completionPercentage: number): void {
    this.completionStates.set(sectionId, isComplete);
    this.completionPercentages.set(sectionId, completionPercentage);
  }

  /**
   * Get stored completion state
   */
  getStoredCompletionState(
    sectionId: string
  ): { isComplete: boolean; completionPercentage: number } | null {
    const isComplete = this.completionStates.get(sectionId) || false;
    const completionPercentage = this.completionPercentages.get(sectionId) || 0;
    return { isComplete, completionPercentage };
  }

  /**
   * Clear all completion states
   */
  clearStates(): void {
    this.completionStates.clear();
    this.completionPercentages.clear();
  }

  /**
   * Clear completion state for a specific section
   */
  clearState(sectionId: string): void {
    this.completionStates.delete(sectionId);
    this.completionPercentages.delete(sectionId);
  }
}
