/**
 * Streaming Layout Utilities
 * 
 * Integrates streaming data flow with grid layout calculations.
 * Manages skeleton placeholders, section morphing, and progressive reveal.
 * 
 * Layout States:
 * - measuring: Initial measurement of skeleton placeholders
 * - estimating: Predicting layout based on partial data
 * - placing: Positioning sections using bin-packing
 * - refining: Adjusting positions as heights become known
 * - stable: Layout is complete and stable
 * 
 * @example
 * ```typescript
 * import { StreamingLayoutManager } from 'osi-cards-lib';
 * 
 * const layout = new StreamingLayoutManager(container, { columns: 4 });
 * 
 * // As sections stream in
 * layout.addPlaceholder(sectionId, sectionType);
 * 
 * // When section data is ready
 * layout.morphToContent(sectionId, actualSection);
 * ```
 */

import { CardSection } from '../models/card.model';
import { IncrementalLayoutEngine, LayoutUpdate } from './incremental-layout.util';
import { estimateSectionHeight } from './smart-grid.util';
import { FlipAnimator } from './flip-animation.util';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Streaming layout states
 */
export type StreamingLayoutState = 
  | 'idle'
  | 'measuring'
  | 'estimating'
  | 'placing'
  | 'refining'
  | 'stable';

/**
 * Section streaming state
 */
export type SectionStreamState = 
  | 'placeholder'
  | 'partial'
  | 'complete'
  | 'measured';

/**
 * Streamed section with state
 */
export interface StreamedSection {
  id: string;
  section: CardSection | null;
  state: SectionStreamState;
  estimatedHeight: number;
  measuredHeight?: number;
  placeholder: HTMLElement | null;
  contentElement: HTMLElement | null;
}

/**
 * Skeleton configuration
 */
export interface SkeletonConfig {
  /** Base height for skeleton placeholder */
  baseHeight?: number;
  /** Height per expected field */
  fieldHeight?: number;
  /** Height per expected item */
  itemHeight?: number;
  /** Animation duration for morphing */
  morphDuration?: number;
}

/**
 * Reveal zone configuration
 */
export interface RevealZoneConfig {
  /** Items to render immediately (in viewport) */
  immediate: number;
  /** Items to render eagerly (near viewport) */
  eager: number;
  /** Items to render lazily (far from viewport) */
  lazy: number;
}

/**
 * Layout manager configuration
 */
export interface StreamingLayoutConfig {
  columns: number;
  containerWidth: number;
  gap?: number;
  skeleton?: SkeletonConfig;
  revealZones?: RevealZoneConfig;
  enableMorphing?: boolean;
  enableFlip?: boolean;
}

/**
 * Layout state change event
 */
export interface LayoutStateChange {
  previousState: StreamingLayoutState;
  currentState: StreamingLayoutState;
  sectionsAffected: string[];
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_SKELETON_CONFIG: Required<SkeletonConfig> = {
  baseHeight: 100,
  fieldHeight: 36,
  itemHeight: 60,
  morphDuration: 250,
};

const DEFAULT_REVEAL_ZONES: Required<RevealZoneConfig> = {
  immediate: 6,
  eager: 12,
  lazy: 20,
};

// ============================================================================
// STREAMING LAYOUT MANAGER
// ============================================================================

/**
 * Manages layout during streaming data flow
 */
export class StreamingLayoutManager {
  private state: StreamingLayoutState = 'idle';
  private sections = new Map<string, StreamedSection>();
  private sectionOrder: string[] = [];
  private layoutEngine: IncrementalLayoutEngine;
  private flipAnimator: FlipAnimator | null = null;
  
  private readonly config: Required<StreamingLayoutConfig>;
  private readonly skeletonConfig: Required<SkeletonConfig>;
  private readonly revealZones: Required<RevealZoneConfig>;
  
  private container: HTMLElement | null = null;
  private stateListeners: Array<(change: LayoutStateChange) => void> = [];
  private measureQueue: string[] = [];
  private measureRAF: number | null = null;

  constructor(config: StreamingLayoutConfig) {
    this.config = {
      columns: config.columns,
      containerWidth: config.containerWidth,
      gap: config.gap ?? 12,
      skeleton: config.skeleton ?? DEFAULT_SKELETON_CONFIG,
      revealZones: config.revealZones ?? DEFAULT_REVEAL_ZONES,
      enableMorphing: config.enableMorphing ?? true,
      enableFlip: config.enableFlip ?? true,
    };

    this.skeletonConfig = { ...DEFAULT_SKELETON_CONFIG, ...config.skeleton };
    this.revealZones = { ...DEFAULT_REVEAL_ZONES, ...config.revealZones };

    this.layoutEngine = new IncrementalLayoutEngine({
      columns: this.config.columns,
      containerWidth: this.config.containerWidth,
      gap: this.config.gap,
    });
  }

  /**
   * Sets the container element for FLIP animations
   */
  setContainer(container: HTMLElement): void {
    this.container = container;
    if (this.config.enableFlip) {
      this.flipAnimator = new FlipAnimator(container, {
        duration: this.skeletonConfig.morphDuration,
        animateSize: true,
      });
    }
  }

  /**
   * Adds a placeholder section during streaming
   */
  addPlaceholder(
    id: string,
    type: string,
    expectedContent?: {
      fieldCount?: number;
      itemCount?: number;
      title?: string;
    }
  ): StreamedSection {
    const estimatedHeight = this.estimatePlaceholderHeight(type, expectedContent);

    const section: StreamedSection = {
      id,
      section: null,
      state: 'placeholder',
      estimatedHeight,
      placeholder: null,
      contentElement: null,
    };

    this.sections.set(id, section);
    this.sectionOrder.push(id);

    // Create placeholder section for layout
    const placeholderSection: CardSection = {
      id,
      type: type as CardSection['type'],
      title: expectedContent?.title ?? `Loading ${type}...`,
      fields: [],
      items: [],
      meta: { placeholder: true },
    };

    this.layoutEngine.addSection(placeholderSection);
    this.transitionState('measuring');

    return section;
  }

  /**
   * Updates a section with partial data
   */
  updatePartial(id: string, partialSection: Partial<CardSection>): LayoutUpdate | null {
    const section = this.sections.get(id);
    if (!section) return null;

    // Create or update section data
    const currentSection = section.section ?? {
      id,
      type: 'info',
      title: '',
      fields: [],
      items: [],
    };

    const updatedSection: CardSection = {
      ...currentSection,
      ...partialSection,
      id,
    };

    section.section = updatedSection;
    section.state = 'partial';
    section.estimatedHeight = estimateSectionHeight(updatedSection);

    const update = this.layoutEngine.updateSection(updatedSection);
    this.transitionState('refining');

    return update;
  }

  /**
   * Completes a section with full data and triggers morphing
   */
  async completeSection(id: string, fullSection: CardSection): Promise<void> {
    const section = this.sections.get(id);
    if (!section) return;

    // Record first position for FLIP
    if (this.flipAnimator && this.config.enableFlip) {
      this.flipAnimator.first();
    }

    section.section = fullSection;
    section.state = 'complete';
    section.estimatedHeight = estimateSectionHeight(fullSection);

    this.layoutEngine.updateSection(fullSection);

    // Trigger FLIP animation
    if (this.flipAnimator && this.config.enableFlip) {
      await this.flipAnimator.play();
    }

    // Queue measurement
    this.queueMeasurement(id);
  }

  /**
   * Morphs a skeleton placeholder to actual content
   */
  async morphToContent(
    id: string,
    contentElement: HTMLElement
  ): Promise<void> {
    const section = this.sections.get(id);
    if (!section || !this.config.enableMorphing) return;

    section.contentElement = contentElement;

    if (section.placeholder) {
      await this.animateMorph(section.placeholder, contentElement);
    }

    // Measure actual height
    this.queueMeasurement(id);
  }

  /**
   * Registers measured height for a section
   */
  setMeasuredHeight(id: string, height: number): void {
    const section = this.sections.get(id);
    if (!section) return;

    section.measuredHeight = height;
    section.state = 'measured';

    this.layoutEngine.updateMeasuredHeight(id, height);
    this.checkStableState();
  }

  /**
   * Gets current layout positions
   */
  getPositions(): Map<string, { left: string; top: number; width: string }> {
    const positions = new Map<string, { left: string; top: number; width: string }>();
    const layoutPositions = this.layoutEngine.getPositions();

    for (const [key, layout] of layoutPositions) {
      positions.set(key, {
        left: layout.left,
        top: layout.top,
        width: layout.width,
      });
    }

    return positions;
  }

  /**
   * Gets current layout state
   */
  getState(): StreamingLayoutState {
    return this.state;
  }

  /**
   * Gets sections in reveal zone order
   */
  getSectionsForReveal(): {
    immediate: string[];
    eager: string[];
    lazy: string[];
  } {
    const { immediate, eager, lazy } = this.revealZones;

    return {
      immediate: this.sectionOrder.slice(0, immediate),
      eager: this.sectionOrder.slice(immediate, immediate + eager),
      lazy: this.sectionOrder.slice(immediate + eager, immediate + eager + lazy),
    };
  }

  /**
   * Subscribes to state changes
   */
  onStateChange(callback: (change: LayoutStateChange) => void): () => void {
    this.stateListeners.push(callback);
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== callback);
    };
  }

  /**
   * Gets total container height
   */
  getContainerHeight(): number {
    return this.layoutEngine.getContainerHeight();
  }

  /**
   * Resets the layout manager
   */
  reset(): void {
    this.sections.clear();
    this.sectionOrder = [];
    this.layoutEngine.reset();
    this.transitionState('idle');
    
    if (this.measureRAF) {
      cancelAnimationFrame(this.measureRAF);
      this.measureRAF = null;
    }
    this.measureQueue = [];
  }

  /**
   * Cleans up resources
   */
  destroy(): void {
    this.reset();
    this.stateListeners = [];
    this.flipAnimator?.cancelAll();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private estimatePlaceholderHeight(
    type: string,
    content?: { fieldCount?: number; itemCount?: number }
  ): number {
    const { baseHeight, fieldHeight, itemHeight } = this.skeletonConfig;

    // Type-based base heights
    const typeHeights: Record<string, number> = {
      'overview': 180,
      'contact-card': 160,
      'chart': 280,
      'map': 250,
      'analytics': 200,
    };

    const base = typeHeights[type.toLowerCase()] ?? baseHeight;
    const fieldsHeight = (content?.fieldCount ?? 3) * fieldHeight;
    const itemsHeight = (content?.itemCount ?? 0) * itemHeight;

    return base + Math.max(fieldsHeight, itemsHeight);
  }

  private async animateMorph(
    placeholder: HTMLElement,
    content: HTMLElement
  ): Promise<void> {
    const duration = this.skeletonConfig.morphDuration;

    // Fade out skeleton shimmer
    const fadeOut = placeholder.animate(
      [
        { opacity: 1 },
        { opacity: 0 },
      ],
      { duration: duration / 2, fill: 'forwards' }
    );

    await fadeOut.finished;

    // Fade in actual content
    const fadeIn = content.animate(
      [
        { opacity: 0, transform: 'scale(0.98)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      { duration: duration / 2, fill: 'forwards' }
    );

    await fadeIn.finished;
  }

  private queueMeasurement(id: string): void {
    if (!this.measureQueue.includes(id)) {
      this.measureQueue.push(id);
    }

    if (!this.measureRAF) {
      this.measureRAF = requestAnimationFrame(() => {
        this.processMeasurements();
        this.measureRAF = null;
      });
    }
  }

  private processMeasurements(): void {
    for (const id of this.measureQueue) {
      const section = this.sections.get(id);
      if (section?.contentElement) {
        const height = section.contentElement.offsetHeight;
        if (height > 0) {
          this.setMeasuredHeight(id, height);
        }
      }
    }
    this.measureQueue = [];
  }

  private transitionState(newState: StreamingLayoutState): void {
    if (this.state === newState) return;

    const previousState = this.state;
    this.state = newState;

    const affectedSections = Array.from(this.sections.keys());
    const change: LayoutStateChange = {
      previousState,
      currentState: newState,
      sectionsAffected: affectedSections,
    };

    for (const listener of this.stateListeners) {
      listener(change);
    }
  }

  private checkStableState(): void {
    // Check if all sections are measured
    const allMeasured = Array.from(this.sections.values()).every(
      s => s.state === 'measured' || s.state === 'complete'
    );

    if (allMeasured && this.sections.size > 0) {
      this.transitionState('stable');
    }
  }
}

// ============================================================================
// SKELETON UTILITIES
// ============================================================================

/**
 * Creates skeleton placeholder HTML for a section type
 */
export function createSkeletonHTML(
  type: string,
  expectedContent?: { fieldCount?: number; itemCount?: number; title?: string }
): string {
  const title = expectedContent?.title ?? `Loading ${type}...`;
  const fieldCount = expectedContent?.fieldCount ?? 3;
  const itemCount = expectedContent?.itemCount ?? 0;

  let fieldsHTML = '';
  for (let i = 0; i < fieldCount; i++) {
    fieldsHTML += `
      <div class="skeleton-field">
        <div class="skeleton-label shimmer"></div>
        <div class="skeleton-value shimmer"></div>
      </div>
    `;
  }

  let itemsHTML = '';
  for (let i = 0; i < itemCount; i++) {
    itemsHTML += `
      <div class="skeleton-item">
        <div class="skeleton-item-title shimmer"></div>
        <div class="skeleton-item-desc shimmer"></div>
      </div>
    `;
  }

  return `
    <div class="skeleton-section" data-section-type="${type}">
      <div class="skeleton-header">
        <div class="skeleton-title shimmer">${title}</div>
      </div>
      <div class="skeleton-content">
        ${fieldsHTML}
        ${itemsHTML}
      </div>
    </div>
  `;
}

/**
 * Creates skeleton styles CSS
 */
export function getSkeletonStyles(): string {
  return `
    .skeleton-section {
      padding: 16px;
      border-radius: 8px;
      background: var(--skeleton-bg, #f0f0f0);
    }
    
    .skeleton-field,
    .skeleton-item {
      margin-bottom: 12px;
    }
    
    .skeleton-label,
    .skeleton-title,
    .skeleton-item-title {
      height: 14px;
      width: 40%;
      margin-bottom: 8px;
      border-radius: 4px;
    }
    
    .skeleton-value,
    .skeleton-item-desc {
      height: 18px;
      width: 70%;
      border-radius: 4px;
    }
    
    .shimmer {
      background: linear-gradient(
        90deg,
        var(--skeleton-shimmer-start, #e0e0e0) 0%,
        var(--skeleton-shimmer-mid, #f0f0f0) 50%,
        var(--skeleton-shimmer-start, #e0e0e0) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite linear;
    }
    
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    @media (prefers-reduced-motion: reduce) {
      .shimmer {
        animation: none;
        background: var(--skeleton-static, #e0e0e0);
      }
    }
  `;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a streaming layout manager with default configuration
 */
export function createStreamingLayout(
  columns: number,
  containerWidth: number,
  options?: Partial<StreamingLayoutConfig>
): StreamingLayoutManager {
  return new StreamingLayoutManager({
    columns,
    containerWidth,
    ...options,
  });
}

