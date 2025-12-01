/**
 * Card State Engine
 *
 * Centralized, immutable state management for cards.
 * Provides a single source of truth with:
 * - Immutable state updates
 * - State snapshots for undo/redo
 * - Computed selectors with memoization
 * - Observable state changes
 *
 * @example
 * ```typescript
 * const engine = new CardStateEngine();
 *
 * // Add a card
 * engine.addCard(cardData);
 *
 * // Subscribe to changes
 * engine.cards$.subscribe(cards => updateUI(cards));
 *
 * // Get specific card
 * const card = engine.selectCard('card-id');
 *
 * // Undo last action
 * engine.undo();
 * ```
 */

import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

// ============================================================================
// TYPES
// ============================================================================

/** Card data structure */
export interface CardData {
  id: string;
  title: string;
  sections: SectionData[];
  metadata?: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
}

/** Section data structure */
export interface SectionData {
  id: string;
  type: string;
  title?: string;
  fields?: FieldData[];
  items?: ItemData[];
  [key: string]: unknown;
}

/** Field data structure */
export interface FieldData {
  label: string;
  value: string | number | boolean;
  type?: string;
}

/** Item data structure */
export interface ItemData {
  id?: string;
  title: string;
  description?: string;
  [key: string]: unknown;
}

/** State snapshot for history */
interface StateSnapshot {
  cards: Map<string, CardData>;
  timestamp: number;
  action: string;
}

/** Engine configuration */
export interface CardStateConfig {
  /** Maximum history size */
  maxHistory: number;
  /** Enable immutable updates */
  immutable: boolean;
  /** Auto-save interval (0 to disable) */
  autoSaveInterval: number;
}

const DEFAULT_CONFIG: CardStateConfig = {
  maxHistory: 50,
  immutable: true,
  autoSaveInterval: 0,
};

// ============================================================================
// CARD STATE ENGINE
// ============================================================================

export class CardStateEngine {
  private readonly config: CardStateConfig;
  private readonly cardsSubject = new BehaviorSubject<Map<string, CardData>>(new Map());
  private readonly history: StateSnapshot[] = [];
  private historyIndex = -1;
  private autoSaveTimer?: ReturnType<typeof setInterval>;

  /** All cards observable */
  readonly cards$: Observable<CardData[]>;

  /** Card count observable */
  readonly count$: Observable<number>;

  constructor(config: Partial<CardStateConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.cards$ = this.cardsSubject.pipe(
      map(m => Array.from(m.values())),
      distinctUntilChanged((a, b) => a.length === b.length && a.every((c, i) => c.id === b[i]?.id))
    );

    this.count$ = this.cardsSubject.pipe(
      map(m => m.size),
      distinctUntilChanged()
    );

    // Save initial state
    this.saveSnapshot('init');

    // Setup auto-save if configured
    if (this.config.autoSaveInterval > 0) {
      this.autoSaveTimer = setInterval(() => {
        this.persist();
      }, this.config.autoSaveInterval);
    }
  }

  // ==========================================================================
  // QUERIES (Read Operations)
  // ==========================================================================

  /** Get all cards */
  getCards(): CardData[] {
    return Array.from(this.cardsSubject.value.values());
  }

  /** Get card by ID */
  getCard(id: string): CardData | undefined {
    return this.cardsSubject.value.get(id);
  }

  /** Check if card exists */
  hasCard(id: string): boolean {
    return this.cardsSubject.value.has(id);
  }

  /** Get card count */
  getCount(): number {
    return this.cardsSubject.value.size;
  }

  /** Select card observable */
  selectCard(id: string): Observable<CardData | undefined> {
    return this.cardsSubject.pipe(
      map(m => m.get(id)),
      distinctUntilChanged()
    );
  }

  /** Select cards by type */
  selectByType(type: string): Observable<CardData[]> {
    return this.cards$.pipe(
      map(cards => cards.filter(c => c.sections.some(s => s.type === type)))
    );
  }

  // ==========================================================================
  // COMMANDS (Write Operations)
  // ==========================================================================

  /** Add a new card */
  addCard(card: CardData): void {
    const newCard = this.config.immutable ? this.deepClone(card) : card;
    newCard.id = newCard.id || this.generateId();
    newCard.createdAt = newCard.createdAt || Date.now();
    newCard.updatedAt = Date.now();

    const newState = new Map(this.cardsSubject.value);
    newState.set(newCard.id, newCard);

    this.updateState(newState, `addCard:${newCard.id}`);
  }

  /** Add multiple cards */
  addCards(cards: CardData[]): void {
    const newState = new Map(this.cardsSubject.value);

    for (const card of cards) {
      const newCard = this.config.immutable ? this.deepClone(card) : card;
      newCard.id = newCard.id || this.generateId();
      newCard.createdAt = newCard.createdAt || Date.now();
      newCard.updatedAt = Date.now();
      newState.set(newCard.id, newCard);
    }

    this.updateState(newState, `addCards:${cards.length}`);
  }

  /** Update an existing card */
  updateCard(id: string, updates: Partial<CardData>): boolean {
    const existing = this.cardsSubject.value.get(id);
    if (!existing) return false;

    const updated: CardData = {
      ...existing,
      ...updates,
      id, // Preserve ID
      updatedAt: Date.now(),
    };

    const newState = new Map(this.cardsSubject.value);
    newState.set(id, this.config.immutable ? this.deepClone(updated) : updated);

    this.updateState(newState, `updateCard:${id}`);
    return true;
  }

  /** Update a section within a card */
  updateSection(cardId: string, sectionId: string, updates: Partial<SectionData>): boolean {
    const card = this.cardsSubject.value.get(cardId);
    if (!card) return false;

    const sectionIndex = card.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return false;

    const newSections = [...card.sections];
    newSections[sectionIndex] = { ...newSections[sectionIndex], ...updates };

    return this.updateCard(cardId, { sections: newSections });
  }

  /** Remove a card */
  removeCard(id: string): boolean {
    if (!this.cardsSubject.value.has(id)) return false;

    const newState = new Map(this.cardsSubject.value);
    newState.delete(id);

    this.updateState(newState, `removeCard:${id}`);
    return true;
  }

  /** Clear all cards */
  clear(): void {
    this.updateState(new Map(), 'clear');
  }

  /** Replace all cards */
  setCards(cards: CardData[]): void {
    const newState = new Map<string, CardData>();

    for (const card of cards) {
      const newCard = this.config.immutable ? this.deepClone(card) : card;
      newCard.id = newCard.id || this.generateId();
      newState.set(newCard.id, newCard);
    }

    this.updateState(newState, `setCards:${cards.length}`);
  }

  // ==========================================================================
  // HISTORY (Undo/Redo)
  // ==========================================================================

  /** Undo last action */
  undo(): boolean {
    if (this.historyIndex <= 0) return false;

    this.historyIndex--;
    const snapshot = this.history[this.historyIndex];
    if (snapshot) {
      this.cardsSubject.next(new Map(snapshot.cards));
    }
    return true;
  }

  /** Redo last undone action */
  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) return false;

    this.historyIndex++;
    const snapshot = this.history[this.historyIndex];
    if (snapshot) {
      this.cardsSubject.next(new Map(snapshot.cards));
    }
    return true;
  }

  /** Check if undo is available */
  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  /** Check if redo is available */
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /** Get history length */
  getHistoryLength(): number {
    return this.history.length;
  }

  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================

  /** Export state as JSON */
  export(): string {
    const cards = this.getCards();
    return JSON.stringify(cards, null, 2);
  }

  /** Import state from JSON */
  import(json: string): boolean {
    try {
      const cards = JSON.parse(json) as CardData[];
      this.setCards(cards);
      return true;
    } catch {
      return false;
    }
  }

  /** Persist to storage (override in subclass) */
  persist(): void {
    // Default: no-op. Override for localStorage, IndexedDB, etc.
  }

  /** Restore from storage (override in subclass) */
  restore(): boolean {
    // Default: no-op. Override for localStorage, IndexedDB, etc.
    return false;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /** Destroy engine and cleanup */
  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    this.history.length = 0;
    this.cardsSubject.complete();
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private updateState(newState: Map<string, CardData>, action: string): void {
    // Remove future history if we're in the middle
    if (this.historyIndex < this.history.length - 1) {
      this.history.splice(this.historyIndex + 1);
    }

    this.cardsSubject.next(newState);
    this.saveSnapshot(action);
  }

  private saveSnapshot(action: string): void {
    const snapshot: StateSnapshot = {
      cards: new Map(this.cardsSubject.value),
      timestamp: Date.now(),
      action,
    };

    this.history.push(snapshot);
    this.historyIndex = this.history.length - 1;

    // Trim history if too long
    while (this.history.length > this.config.maxHistory) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private generateId(): string {
    return `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/** Create a new CardStateEngine */
export function createCardStateEngine(config?: Partial<CardStateConfig>): CardStateEngine {
  return new CardStateEngine(config);
}

/** Create a CardStateEngine with localStorage persistence */
export function createPersistentCardStateEngine(
  storageKey = 'osi-cards-state',
  config?: Partial<CardStateConfig>
): CardStateEngine {
  const engine = new CardStateEngine(config);

  // Override persist
  engine.persist = () => {
    try {
      localStorage.setItem(storageKey, engine.export());
    } catch {
      // Storage full or unavailable
    }
  };

  // Override restore
  engine.restore = () => {
    try {
      const data = localStorage.getItem(storageKey);
      if (data) {
        return engine.import(data);
      }
    } catch {
      // Storage unavailable
    }
    return false;
  };

  // Restore on creation
  engine.restore();

  return engine;
}

