/**
 * OSI Cards Event System
 * 
 * Provides isolated, typed events that properly bubble through Shadow DOM.
 * Uses CustomEvent with composed: true to ensure events cross shadow boundaries.
 * 
 * @example
 * ```typescript
 * // Dispatching an event
 * const event = createFieldClickEvent(field, section);
 * element.dispatchEvent(event);
 * 
 * // Listening to events
 * element.addEventListener('osi-field-click', (e: OSIFieldClickEvent) => {
 *   console.log(e.detail.field);
 * });
 * ```
 */

import { CardAction, CardField, CardItem, CardSection, AICardConfig } from '../models';

// ============================================
// EVENT TYPE DEFINITIONS
// ============================================

/**
 * Base event detail interface
 */
export interface OSIEventDetail {
  /** Timestamp when the event was created */
  timestamp: number;
  /** Source component that dispatched the event */
  source: string;
}

/**
 * Field interaction event detail
 */
export interface FieldClickEventDetail extends OSIEventDetail {
  field: CardField;
  section?: CardSection;
  metadata?: Record<string, unknown>;
}

/**
 * Item interaction event detail
 */
export interface ItemClickEventDetail extends OSIEventDetail {
  item: CardItem | CardField;
  section?: CardSection;
  metadata?: Record<string, unknown>;
}

/**
 * Action click event detail
 */
export interface ActionClickEventDetail extends OSIEventDetail {
  action: CardAction;
  card?: AICardConfig;
  metadata?: Record<string, unknown>;
}

/**
 * Card interaction event detail
 */
export interface CardInteractionEventDetail extends OSIEventDetail {
  type: 'click' | 'hover' | 'focus' | 'expand' | 'collapse';
  card?: AICardConfig;
  metadata?: Record<string, unknown>;
}

/**
 * Theme change event detail
 */
export interface ThemeChangeEventDetail extends OSIEventDetail {
  previousTheme: 'day' | 'night';
  newTheme: 'day' | 'night';
}

/**
 * Streaming state event detail
 */
export interface StreamingStateEventDetail extends OSIEventDetail {
  stage: 'idle' | 'starting' | 'streaming' | 'complete' | 'error';
  progress?: number;
  error?: string;
}

/**
 * Section rendered event detail
 */
export interface SectionRenderedEventDetail extends OSIEventDetail {
  section: CardSection;
  isNew: boolean;
}

// ============================================
// TYPED CUSTOM EVENT CLASSES
// ============================================

export type OSIFieldClickEvent = CustomEvent<FieldClickEventDetail>;
export type OSIItemClickEvent = CustomEvent<ItemClickEventDetail>;
export type OSIActionClickEvent = CustomEvent<ActionClickEventDetail>;
export type OSICardInteractionEvent = CustomEvent<CardInteractionEventDetail>;
export type OSIThemeChangeEvent = CustomEvent<ThemeChangeEventDetail>;
export type OSIStreamingStateEvent = CustomEvent<StreamingStateEventDetail>;
export type OSISectionRenderedEvent = CustomEvent<SectionRenderedEventDetail>;

// ============================================
// EVENT NAME CONSTANTS
// ============================================

export const OSI_EVENTS = {
  FIELD_CLICK: 'osi-field-click',
  ITEM_CLICK: 'osi-item-click',
  ACTION_CLICK: 'osi-action-click',
  CARD_INTERACTION: 'osi-card-interaction',
  THEME_CHANGE: 'osi-theme-change',
  STREAMING_STATE: 'osi-streaming-state',
  SECTION_RENDERED: 'osi-section-rendered'
} as const;

export type OSIEventName = typeof OSI_EVENTS[keyof typeof OSI_EVENTS];

// ============================================
// EVENT FACTORY FUNCTIONS
// ============================================

/**
 * Create base event options that ensure proper Shadow DOM traversal
 */
function createEventOptions<T extends OSIEventDetail>(detail: T): CustomEventInit<T> {
  return {
    bubbles: true,
    composed: true, // Ensures event crosses Shadow DOM boundaries
    cancelable: true,
    detail
  };
}

/**
 * Create a field click event
 */
export function createFieldClickEvent(
  field: CardField,
  section?: CardSection,
  metadata?: Record<string, unknown>,
  source = 'osi-cards'
): OSIFieldClickEvent {
  return new CustomEvent(OSI_EVENTS.FIELD_CLICK, createEventOptions({
    timestamp: Date.now(),
    source,
    field,
    section,
    metadata
  }));
}

/**
 * Create an item click event
 */
export function createItemClickEvent(
  item: CardItem | CardField,
  section?: CardSection,
  metadata?: Record<string, unknown>,
  source = 'osi-cards'
): OSIItemClickEvent {
  return new CustomEvent(OSI_EVENTS.ITEM_CLICK, createEventOptions({
    timestamp: Date.now(),
    source,
    item,
    section,
    metadata
  }));
}

/**
 * Create an action click event
 */
export function createActionClickEvent(
  action: CardAction,
  card?: AICardConfig,
  metadata?: Record<string, unknown>,
  source = 'osi-cards'
): OSIActionClickEvent {
  return new CustomEvent(OSI_EVENTS.ACTION_CLICK, createEventOptions({
    timestamp: Date.now(),
    source,
    action,
    card,
    metadata
  }));
}

/**
 * Create a card interaction event
 */
export function createCardInteractionEvent(
  type: CardInteractionEventDetail['type'],
  card?: AICardConfig,
  metadata?: Record<string, unknown>,
  source = 'osi-cards'
): OSICardInteractionEvent {
  return new CustomEvent(OSI_EVENTS.CARD_INTERACTION, createEventOptions({
    timestamp: Date.now(),
    source,
    type,
    card,
    metadata
  }));
}

/**
 * Create a theme change event
 */
export function createThemeChangeEvent(
  previousTheme: 'day' | 'night',
  newTheme: 'day' | 'night',
  source = 'osi-cards'
): OSIThemeChangeEvent {
  return new CustomEvent(OSI_EVENTS.THEME_CHANGE, createEventOptions({
    timestamp: Date.now(),
    source,
    previousTheme,
    newTheme
  }));
}

/**
 * Create a streaming state event
 */
export function createStreamingStateEvent(
  stage: StreamingStateEventDetail['stage'],
  progress?: number,
  error?: string,
  source = 'osi-cards'
): OSIStreamingStateEvent {
  return new CustomEvent(OSI_EVENTS.STREAMING_STATE, createEventOptions({
    timestamp: Date.now(),
    source,
    stage,
    progress,
    error
  }));
}

/**
 * Create a section rendered event
 */
export function createSectionRenderedEvent(
  section: CardSection,
  isNew: boolean,
  source = 'osi-cards'
): OSISectionRenderedEvent {
  return new CustomEvent(OSI_EVENTS.SECTION_RENDERED, createEventOptions({
    timestamp: Date.now(),
    source,
    section,
    isNew
  }));
}

// ============================================
// TYPE GUARD FUNCTIONS
// ============================================

/**
 * Type guard for OSI field click events
 */
export function isOSIFieldClickEvent(event: Event): event is OSIFieldClickEvent {
  return event.type === OSI_EVENTS.FIELD_CLICK;
}

/**
 * Type guard for OSI item click events
 */
export function isOSIItemClickEvent(event: Event): event is OSIItemClickEvent {
  return event.type === OSI_EVENTS.ITEM_CLICK;
}

/**
 * Type guard for OSI action click events
 */
export function isOSIActionClickEvent(event: Event): event is OSIActionClickEvent {
  return event.type === OSI_EVENTS.ACTION_CLICK;
}

/**
 * Type guard for OSI card interaction events
 */
export function isOSICardInteractionEvent(event: Event): event is OSICardInteractionEvent {
  return event.type === OSI_EVENTS.CARD_INTERACTION;
}

// ============================================
// GLOBAL EVENT TYPE AUGMENTATION
// ============================================

// Augment GlobalEventHandlersEventMap for type-safe addEventListener
declare global {
  interface GlobalEventHandlersEventMap {
    'osi-field-click': OSIFieldClickEvent;
    'osi-item-click': OSIItemClickEvent;
    'osi-action-click': OSIActionClickEvent;
    'osi-card-interaction': OSICardInteractionEvent;
    'osi-theme-change': OSIThemeChangeEvent;
    'osi-streaming-state': OSIStreamingStateEvent;
    'osi-section-rendered': OSISectionRenderedEvent;
  }
}






