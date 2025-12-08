/**
 * TrackBy Utility Functions
 *
 * Optimized trackBy functions for common Angular *ngFor scenarios.
 * Prevents unnecessary DOM re-renders by tracking items by stable identifiers.
 */

import { TrackByFunction } from '@angular/core';
import { CardSection, CardField, CardItem } from '../models/card.model';

/**
 * Generic trackBy by ID
 */
export function trackById<T extends { id?: string }>(index: number, item: T): string | number {
  return item.id ?? index;
}

/**
 * TrackBy for array index
 */
export const trackByIndex: TrackByFunction<any> = (index: number) => index;

/**
 * TrackBy for card sections
 */
export const trackBySection: TrackByFunction<CardSection> = (
  index: number,
  section: CardSection
) => {
  return section.id ?? section.title ?? index;
};

/**
 * TrackBy for card fields
 */
export const trackByField: TrackByFunction<CardField> = (index: number, field: CardField) => {
  return field.id ?? field.label ?? index;
};

/**
 * TrackBy for card items
 */
export const trackByItem: TrackByFunction<CardItem> = (index: number, item: CardItem) => {
  return item.id ?? item.title ?? index;
};

/**
 * TrackBy for string arrays
 */
export const trackByValue: TrackByFunction<string> = (index: number, value: string) => {
  return value ?? index;
};

/**
 * TrackBy by property
 */
export function trackByProperty<T>(property: keyof T): TrackByFunction<T> {
  return (index: number, item: T) => item[property] ?? index;
}

/**
 * TrackBy with custom key function
 */
export function createTrackBy<T>(keyFn: (item: T) => string | number): TrackByFunction<T> {
  return (index: number, item: T) => keyFn(item) ?? index;
}
