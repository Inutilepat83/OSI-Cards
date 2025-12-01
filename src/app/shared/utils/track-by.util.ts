/**
 * TrackBy utility functions for Angular *ngFor performance optimization
 * Provides reusable trackBy functions for common use cases
 */

/**
 * Track by index
 */
export function trackByIndex(index: number): number {
  return index;
}

/**
 * Track by ID
 */
export function trackById<T extends { id?: string }>(index: number, item: T): string {
  return item.id || `item-${index}`;
}

/**
 * Track by key property
 */
export function trackByKey<T>(key: keyof T) {
  return (index: number, item: T): any => {
    return item[key] ?? index;
  };
}

/**
 * Track by function
 */
export function trackByFunction<T>(fn: (item: T) => any) {
  return (index: number, item: T): any => {
    return fn(item) ?? index;
  };
}

/**
 * Track by card ID
 */
export function trackByCardId(index: number, card: { id?: string; cardTitle?: string }): string {
  return card.id || card.cardTitle || `card-${index}`;
}

/**
 * Track by section ID
 */
export function trackBySectionId(index: number, section: { id?: string; title?: string }): string {
  return section.id || section.title || `section-${index}`;
}

/**
 * Track by field ID
 */
export function trackByFieldId(index: number, field: { id?: string; label?: string }): string {
  return field.id || field.label || `field-${index}`;
}

/**
 * Track by item ID
 */
export function trackByItemId(index: number, item: { id?: string; title?: string }): string {
  return item.id || item.title || `item-${index}`;
}


