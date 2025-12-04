/**
 * Streaming Layout Utilities
 *
 * Improvements for section placement during streaming scenarios:
 * - Mini-batch streaming layout for better packing (Point 36)
 * - Simplified animation state management (Point 37)
 * - Progressive optimization during streaming (Point 38)
 * - Smooth transition on streaming end (Point 39)
 * - Explicit card identity detection (Point 40)
 *
 * @example
 * ```typescript
 * import { StreamingLayoutManager } from './streaming-layout.util';
 *
 * const manager = new StreamingLayoutManager({ columns: 4 });
 *
 * // During streaming
 * manager.addSection(section);
 * const layout = manager.getLayout();
 *
 * // When streaming ends
 * manager.finalizeLayout();
 * ```
 */

import { CardSection } from '../models/card.model';
import {
  generateWidthExpression,
  generateLeftExpression,
  GRID_GAP,
  calculateColumns,
} from './grid-config.util';
import { estimateSectionHeight } from './height-estimation.util';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Animation state for a section (Point 37)
 */
export type AnimationPhase =
  | 'pending' // Not yet visible
  | 'entering' // Playing entrance animation
  | 'positioned' // In final position, animation complete
  | 'repositioning' // Moving to new position
  | 'exiting'; // Leaving the layout

/**
 * Comprehensive animation state for a section
 */
export interface SectionAnimationState {
  /** Unique section identifier */
  key: string;
  /** Current animation phase */
  phase: AnimationPhase;
  /** Timestamp when animation started */
  startTime: number;
  /** Duration of current animation (ms) */
  duration: number;
  /** Previous position (for repositioning) */
  previousTop?: number;
  previousLeft?: string;
  /** Target position */
  targetTop: number;
  targetLeft: string;
  /** Whether animation has completed */
  completed: boolean;
}

/**
 * Positioned section in streaming layout
 */
export interface StreamingPositionedSection {
  section: CardSection;
  key: string;
  colSpan: number;
  left: string;
  top: number;
  width: string;
  height: number;
  /** Animation state */
  animationState: SectionAnimationState;
}

/**
 * Card identity for tracking (Point 40)
 */
export interface CardIdentity {
  /** Explicit card ID from config */
  cardId?: string;
  /** Generated hash from content */
  contentHash: string;
  /** Timestamp when card was created */
  createdAt: number;
  /** Number of sections in the card */
  sectionCount: number;
}

/**
 * Streaming layout configuration
 */
export interface StreamingLayoutConfig {
  /** Number of columns in grid */
  columns: number;
  /** Gap between sections (px) */
  gap: number;
  /** Container width (px) */
  containerWidth: number;
  /** Mini-batch size for streaming (Point 36) */
  batchSize: number;
  /** Sections between progressive optimizations (Point 38) */
  optimizationInterval: number;
  /** Animation duration for entrance (ms) */
  enterAnimationDuration: number;
  /** Animation duration for repositioning (ms) */
  repositionAnimationDuration: number;
  /** Whether to animate streaming end transition (Point 39) */
  animateStreamingEnd: boolean;
}

/**
 * Default streaming configuration
 */
export const DEFAULT_STREAMING_CONFIG: StreamingLayoutConfig = {
  columns: 4,
  gap: GRID_GAP,
  containerWidth: 1200,
  batchSize: 4, // Buffer 4 sections before placing (Point 36)
  optimizationInterval: 5, // Optimize after every 5 sections (Point 38)
  enterAnimationDuration: 300,
  repositionAnimationDuration: 200,
  animateStreamingEnd: true,
};

/**
 * Layout metrics during streaming
 */
export interface StreamingLayoutMetrics {
  /** Total sections placed */
  totalSections: number;
  /** Sections in current batch */
  batchedSections: number;
  /** Number of optimizations performed */
  optimizationCount: number;
  /** Current layout height */
  totalHeight: number;
  /** Estimated utilization */
  utilizationPercent: number;
  /** Whether streaming is active */
  isStreaming: boolean;
}

// ============================================================================
// STREAMING LAYOUT MANAGER CLASS
// ============================================================================

/**
 * Manages layout during streaming with mini-batching and progressive optimization.
 */
export class StreamingLayoutManager {
  private config: StreamingLayoutConfig;

  // Section storage
  private sections: Map<string, StreamingPositionedSection> = new Map();
  private sectionOrder: string[] = [];

  // Batching state (Point 36)
  private pendingBatch: CardSection[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;

  // Animation state (Point 37)
  private animationStates: Map<string, SectionAnimationState> = new Map();

  // Card identity (Point 40)
  private currentCardIdentity: CardIdentity | null = null;

  // Column heights for placement
  private columnHeights: number[] = [];

  // Metrics
  private metrics: StreamingLayoutMetrics = {
    totalSections: 0,
    batchedSections: 0,
    optimizationCount: 0,
    totalHeight: 0,
    utilizationPercent: 0,
    isStreaming: false,
  };

  // Callbacks
  private onLayoutChange?: (sections: StreamingPositionedSection[]) => void;
  private onBatchPlaced?: (batch: StreamingPositionedSection[]) => void;
  private onOptimization?: (metrics: StreamingLayoutMetrics) => void;

  constructor(config: Partial<StreamingLayoutConfig> = {}) {
    this.config = { ...DEFAULT_STREAMING_CONFIG, ...config };
    this.reset();
  }

  /**
   * Configure the manager
   */
  configure(config: Partial<StreamingLayoutConfig>): void {
    this.config = { ...this.config, ...config };
    this.columnHeights = new Array(this.config.columns).fill(0);
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: {
    onLayoutChange?: (sections: StreamingPositionedSection[]) => void;
    onBatchPlaced?: (batch: StreamingPositionedSection[]) => void;
    onOptimization?: (metrics: StreamingLayoutMetrics) => void;
  }): void {
    this.onLayoutChange = callbacks.onLayoutChange;
    this.onBatchPlaced = callbacks.onBatchPlaced;
    this.onOptimization = callbacks.onOptimization;
  }

  // ==========================================================================
  // CARD IDENTITY (Point 40)
  // ==========================================================================

  /**
   * Starts a new card with explicit identity
   */
  startNewCard(cardId?: string): void {
    this.currentCardIdentity = {
      cardId,
      contentHash: this.generateCardHash(),
      createdAt: Date.now(),
      sectionCount: 0,
    };

    this.reset();
    this.metrics.isStreaming = true;
  }

  /**
   * Checks if this is a new card based on identity
   */
  isNewCard(cardId?: string, sections?: CardSection[]): boolean {
    // Explicit cardId check (most reliable)
    if (cardId && this.currentCardIdentity?.cardId) {
      return cardId !== this.currentCardIdentity.cardId;
    }

    // Content hash check
    if (sections && sections.length > 0) {
      const newHash = this.generateContentHash(sections);
      return newHash !== this.currentCardIdentity?.contentHash;
    }

    // Section count heuristic
    if (this.currentCardIdentity) {
      const currentCount = this.sections.size;
      // If section count drops significantly, likely new card
      return currentCount < this.currentCardIdentity.sectionCount * 0.5;
    }

    return true; // Assume new card if no identity
  }

  /**
   * Generates a hash for the current card
   */
  private generateCardHash(): string {
    return `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a content hash from sections
   */
  private generateContentHash(sections: CardSection[]): string {
    const parts = sections.map((s) => `${s.type}:${s.title}:${s.fields?.length ?? 0}`);
    return parts.join('|');
  }

  // ==========================================================================
  // MINI-BATCH STREAMING (Point 36)
  // ==========================================================================

  /**
   * Adds a section to the streaming layout.
   * Sections are batched for better placement decisions.
   */
  addSection(section: CardSection): void {
    this.pendingBatch.push(section);
    this.metrics.batchedSections = this.pendingBatch.length;

    // Check if batch is full
    if (this.pendingBatch.length >= this.config.batchSize) {
      this.processBatch();
    } else {
      // Set a timer to flush partial batches
      this.scheduleBatchFlush();
    }
  }

  /**
   * Adds multiple sections at once
   */
  addSections(sections: CardSection[]): void {
    for (const section of sections) {
      this.addSection(section);
    }
  }

  /**
   * Schedules a batch flush after a short delay
   */
  private scheduleBatchFlush(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Flush after 100ms of no new sections
    this.batchTimer = setTimeout(() => {
      if (this.pendingBatch.length > 0) {
        this.processBatch();
      }
    }, 100);
  }

  /**
   * Processes the current batch of sections
   */
  private processBatch(): void {
    if (this.pendingBatch.length === 0) return;

    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const batch = [...this.pendingBatch];
    this.pendingBatch = [];
    this.metrics.batchedSections = 0;

    // Sort batch for better packing (optional)
    // batch.sort((a, b) => estimateSectionHeight(b) - estimateSectionHeight(a));

    // Place each section in the batch
    const placedBatch: StreamingPositionedSection[] = [];

    for (const section of batch) {
      const positioned = this.placeSection(section);
      placedBatch.push(positioned);
    }

    // Update card identity
    if (this.currentCardIdentity) {
      this.currentCardIdentity.sectionCount = this.sections.size;
    }

    // Notify
    this.onBatchPlaced?.(placedBatch);
    this.onLayoutChange?.(this.getLayout());

    // Check if progressive optimization is needed (Point 38)
    this.checkProgressiveOptimization();
  }

  /**
   * Places a single section using greedy first-fit
   */
  private placeSection(section: CardSection): StreamingPositionedSection {
    const key = this.generateSectionKey(section);
    const height = estimateSectionHeight(section);
    const colSpan = this.calculateColSpan(section);

    // Find best position
    const { column, top } = this.findBestPosition(colSpan, height);

    // Generate CSS expressions
    const left = generateLeftExpression(this.config.columns, column, this.config.gap);
    const width = generateWidthExpression(this.config.columns, colSpan, this.config.gap);

    // Create animation state (Point 37)
    const animationState: SectionAnimationState = {
      key,
      phase: 'entering',
      startTime: Date.now(),
      duration: this.config.enterAnimationDuration,
      targetTop: top,
      targetLeft: left,
      completed: false,
    };

    // Create positioned section
    const positioned: StreamingPositionedSection = {
      section,
      key,
      colSpan,
      left,
      top,
      width,
      height,
      animationState,
    };

    // Store
    this.sections.set(key, positioned);
    this.sectionOrder.push(key);
    this.animationStates.set(key, animationState);

    // Update column heights
    this.updateColumnHeights(column, colSpan, top + height);

    // Update metrics
    this.metrics.totalSections = this.sections.size;
    this.metrics.totalHeight = Math.max(...this.columnHeights, 0);
    this.updateUtilization();

    return positioned;
  }

  /**
   * Finds the best position for a section
   */
  private findBestPosition(colSpan: number, height: number): { column: number; top: number } {
    const columns = this.config.columns;
    let bestColumn = 0;
    let bestTop = Infinity;

    // Find column with minimum height that can fit the span
    for (let col = 0; col <= columns - colSpan; col++) {
      let maxHeight = 0;

      for (let c = col; c < col + colSpan; c++) {
        const colHeight = this.columnHeights[c] ?? 0;
        if (colHeight > maxHeight) {
          maxHeight = colHeight;
        }
      }

      if (maxHeight < bestTop) {
        bestTop = maxHeight;
        bestColumn = col;
      }
    }

    return {
      column: bestColumn,
      top: bestTop === Infinity ? 0 : bestTop,
    };
  }

  /**
   * Updates column heights after placing a section
   */
  private updateColumnHeights(startCol: number, colSpan: number, newHeight: number): void {
    const endCol = Math.min(startCol + colSpan, this.config.columns);

    for (let c = startCol; c < endCol; c++) {
      this.columnHeights[c] = newHeight + this.config.gap;
    }
  }

  /**
   * Calculates column span for a section
   */
  private calculateColSpan(section: CardSection): number {
    if (section.colSpan && section.colSpan > 0) {
      return Math.min(section.colSpan, this.config.columns);
    }

    if (section.preferredColumns && section.preferredColumns > 0) {
      return Math.min(section.preferredColumns, this.config.columns);
    }

    // Default to 1
    return 1;
  }

  /**
   * Generates a unique key for a section
   */
  private generateSectionKey(section: CardSection): string {
    if (section.id) {
      return section.id;
    }

    return `section-${section.type}-${section.title}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  // ==========================================================================
  // PROGRESSIVE OPTIMIZATION (Point 38)
  // ==========================================================================

  /**
   * Checks if progressive optimization should run
   */
  private checkProgressiveOptimization(): void {
    const sectionCount = this.sections.size;
    const interval = this.config.optimizationInterval;

    // Run optimization at intervals
    if (sectionCount > 0 && sectionCount % interval === 0) {
      this.runProgressiveOptimization();
    }
  }

  /**
   * Runs lightweight gap-fill optimization during streaming
   */
  private runProgressiveOptimization(): void {
    // Simple optimization: check for obvious gaps and try to fill them
    const layout = this.getLayout();
    let madeChanges = false;

    // Find gaps in each column
    for (let col = 0; col < this.config.columns; col++) {
      const sectionsInCol = layout.filter((s) => {
        const colIndex = this.parseColumnIndex(s.left);
        return colIndex <= col && colIndex + s.colSpan > col;
      });

      if (sectionsInCol.length < 2) continue;

      // Sort by top position
      sectionsInCol.sort((a, b) => a.top - b.top);

      // Check for gaps
      for (let i = 0; i < sectionsInCol.length - 1; i++) {
        const current = sectionsInCol[i];
        const next = sectionsInCol[i + 1];
        if (!current || !next) continue;

        const gapTop = current.top + current.height + this.config.gap;
        const gapHeight = next.top - gapTop;

        // If significant gap, try to fill it
        if (gapHeight > 50) {
          // Find a section that could fit
          const filler = this.findFillerSection(col, gapHeight);
          if (filler) {
            // Move filler to gap
            this.repositionSection(filler.key, col, gapTop);
            madeChanges = true;
          }
        }
      }
    }

    if (madeChanges) {
      this.metrics.optimizationCount++;
      this.onOptimization?.(this.metrics);
      this.onLayoutChange?.(this.getLayout());
    }
  }

  /**
   * Finds a section that could fill a gap
   */
  private findFillerSection(
    targetCol: number,
    maxHeight: number
  ): StreamingPositionedSection | null {
    for (const section of this.sections.values()) {
      // Single-column sections at the bottom are best candidates
      if (section.colSpan === 1 && section.height <= maxHeight) {
        const col = this.parseColumnIndex(section.left);
        // Don't move sections that are already well-positioned
        if (col !== targetCol && section.top > this.metrics.totalHeight * 0.7) {
          return section;
        }
      }
    }
    return null;
  }

  /**
   * Repositions a section with animation
   */
  private repositionSection(key: string, newCol: number, newTop: number): void {
    const section = this.sections.get(key);
    if (!section) return;

    const oldTop = section.top;
    const oldLeft = section.left;

    // Update position
    section.top = newTop;
    section.left = generateLeftExpression(this.config.columns, newCol, this.config.gap);

    // Update animation state (Point 37)
    const animState = this.animationStates.get(key);
    if (animState) {
      animState.phase = 'repositioning';
      animState.previousTop = oldTop;
      animState.previousLeft = oldLeft;
      animState.targetTop = newTop;
      animState.targetLeft = section.left;
      animState.startTime = Date.now();
      animState.duration = this.config.repositionAnimationDuration;
      animState.completed = false;
    }

    section.animationState = animState ?? section.animationState;
  }

  /**
   * Parses column index from CSS left expression
   */
  private parseColumnIndex(left: string): number {
    if (left === '0px' || left === '0') return 0;

    const match = left.match(/\*\s*(\d+)\s*\)/);
    return match?.[1] ? parseInt(match[1], 10) : 0;
  }

  // ==========================================================================
  // SMOOTH STREAMING END TRANSITION (Point 39)
  // ==========================================================================

  /**
   * Finalizes the layout when streaming ends.
   * Triggers a full optimization and smooth transition.
   */
  finalizeLayout(): StreamingPositionedSection[] {
    // Flush any remaining batch
    if (this.pendingBatch.length > 0) {
      this.processBatch();
    }

    this.metrics.isStreaming = false;

    if (!this.config.animateStreamingEnd) {
      // Instant finalization
      return this.getLayout();
    }

    // Run full optimization
    this.runFinalOptimization();

    // Mark all sections for smooth transition
    for (const [key, section] of this.sections) {
      const animState = this.animationStates.get(key);
      if (animState && animState.phase !== 'positioned') {
        animState.phase = 'repositioning';
        animState.duration = this.config.repositionAnimationDuration;
        animState.startTime = Date.now();
      }
    }

    return this.getLayout();
  }

  /**
   * Runs final optimization when streaming ends
   */
  private runFinalOptimization(): void {
    // Recalculate all positions for optimal layout
    const sections = Array.from(this.sections.values());

    // Sort by height descending for FFDH
    sections.sort((a, b) => b.height - a.height);

    // Reset column heights
    this.columnHeights = new Array(this.config.columns).fill(0);

    // Reposition all sections
    for (const section of sections) {
      const { column, top } = this.findBestPosition(section.colSpan, section.height);

      const oldTop = section.top;
      const oldLeft = section.left;
      const newLeft = generateLeftExpression(this.config.columns, column, this.config.gap);

      // Only update if position changed
      if (top !== oldTop || newLeft !== oldLeft) {
        // Update animation state for smooth transition
        const animState = this.animationStates.get(section.key);
        if (animState) {
          animState.phase = 'repositioning';
          animState.previousTop = oldTop;
          animState.previousLeft = oldLeft;
          animState.targetTop = top;
          animState.targetLeft = newLeft;
          animState.startTime = Date.now();
          animState.duration = this.config.repositionAnimationDuration;
        }

        section.top = top;
        section.left = newLeft;
      }

      // Update column heights
      this.updateColumnHeights(column, section.colSpan, top + section.height);
    }

    // Update metrics
    this.metrics.totalHeight = Math.max(...this.columnHeights, 0);
    this.updateUtilization();
  }

  // ==========================================================================
  // ANIMATION STATE MANAGEMENT (Point 37)
  // ==========================================================================

  /**
   * Gets the animation state for a section
   */
  getAnimationState(key: string): SectionAnimationState | undefined {
    return this.animationStates.get(key);
  }

  /**
   * Marks an animation as complete
   */
  completeAnimation(key: string): void {
    const state = this.animationStates.get(key);
    if (state) {
      state.phase = 'positioned';
      state.completed = true;
    }

    const section = this.sections.get(key);
    if (section && state) {
      section.animationState = state;
    }
  }

  /**
   * Gets all active animations
   */
  getActiveAnimations(): SectionAnimationState[] {
    return Array.from(this.animationStates.values()).filter(
      (s) => !s.completed && (s.phase === 'entering' || s.phase === 'repositioning')
    );
  }

  /**
   * Updates all animation states (call from animation frame)
   */
  updateAnimations(): void {
    const now = Date.now();

    for (const [key, state] of this.animationStates) {
      if (state.completed) continue;

      const elapsed = now - state.startTime;

      if (elapsed >= state.duration) {
        // Animation complete
        state.phase = 'positioned';
        state.completed = true;

        const section = this.sections.get(key);
        if (section) {
          section.animationState = state;
        }
      }
    }
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Gets the current layout
   */
  getLayout(): StreamingPositionedSection[] {
    return this.sectionOrder
      .map((key) => this.sections.get(key))
      .filter((s): s is StreamingPositionedSection => s !== undefined);
  }

  /**
   * Gets current metrics
   */
  getMetrics(): StreamingLayoutMetrics {
    return { ...this.metrics };
  }

  /**
   * Resets the manager
   */
  reset(): void {
    this.sections.clear();
    this.sectionOrder = [];
    this.pendingBatch = [];
    this.animationStates.clear();
    this.columnHeights = new Array(this.config.columns).fill(0);

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    this.metrics = {
      totalSections: 0,
      batchedSections: 0,
      optimizationCount: 0,
      totalHeight: 0,
      utilizationPercent: 0,
      isStreaming: false,
    };
  }

  /**
   * Updates utilization metric
   */
  private updateUtilization(): void {
    const totalArea = this.config.columns * this.metrics.totalHeight;
    if (totalArea === 0) {
      this.metrics.utilizationPercent = 100;
      return;
    }

    let usedArea = 0;
    for (const section of this.sections.values()) {
      usedArea += section.colSpan * section.height;
    }

    this.metrics.utilizationPercent = (usedArea / totalArea) * 100;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

let _streamingManagerInstance: StreamingLayoutManager | null = null;

/**
 * Gets the global streaming layout manager instance
 */
export function getStreamingLayoutManager(
  config?: Partial<StreamingLayoutConfig>
): StreamingLayoutManager {
  if (!_streamingManagerInstance) {
    _streamingManagerInstance = new StreamingLayoutManager(config);
  } else if (config) {
    _streamingManagerInstance.configure(config);
  }
  return _streamingManagerInstance;
}

/**
 * Resets the global streaming layout manager
 */
export function resetStreamingLayoutManager(): void {
  _streamingManagerInstance = null;
}

/**
 * Checks if given sections represent a new card compared to previous
 */
export function detectNewCard(
  currentSections: CardSection[],
  previousSections: CardSection[],
  cardId?: string,
  previousCardId?: string
): boolean {
  // Explicit ID check
  if (cardId && previousCardId) {
    return cardId !== previousCardId;
  }

  // Section count drop check
  if (currentSections.length < previousSections.length * 0.5) {
    return true;
  }

  // Type signature check
  const currentTypes = currentSections.map((s) => s.type).join(',');
  const previousTypes = previousSections
    .slice(0, currentSections.length)
    .map((s) => s.type)
    .join(',');

  if (currentSections.length <= 3 && currentTypes !== previousTypes) {
    return true;
  }

  return false;
}
