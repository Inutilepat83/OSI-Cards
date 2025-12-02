/**
 * Incremental Layout Utilities
 * 
 * Optimized layout calculation for streaming mode that only recalculates
 * affected sections instead of performing full reflows. Uses dirty-tracking
 * and partial updates for smooth streaming experiences.
 * 
 * @example
 * ```typescript
 * import { IncrementalLayoutEngine } from 'osi-cards-lib';
 * 
 * const engine = new IncrementalLayoutEngine(4, 1200);
 * const update = engine.addSection(newSection);
 * const positions = engine.getPositions();
 * ```
 */

import { CardSection } from '../models/card.model';
import { computeSectionHash, computeStructureHash } from './layout-cache.util';
import { estimateSectionHeight, calculateOptimalColumns } from './smart-grid.util';
import { generateWidthExpression, generateLeftExpression, GRID_GAP } from './grid-config.util';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Section with layout metadata
 */
export interface LayoutSection {
  section: CardSection;
  key: string;
  contentHash: number;
  colSpan: number;
  estimatedHeight: number;
  measuredHeight?: number;
  column: number;
  top: number;
  left: string;
  width: string;
  isDirty: boolean;
  isNew: boolean;
  renderIndex: number;
}

/**
 * Layout update result
 */
export interface LayoutUpdate {
  type: 'add' | 'remove' | 'update' | 'reposition' | 'full';
  affectedSections: string[];
  newPositions: Map<string, { left: string; top: number; width: string }>;
  containerHeight: number;
  needsFullReflow: boolean;
}

/**
 * Column state for incremental placement
 */
interface ColumnState {
  index: number;
  height: number;
  sections: string[];
}

/**
 * Layout engine configuration
 */
export interface IncrementalLayoutConfig {
  columns: number;
  containerWidth: number;
  gap?: number;
  maxColumns?: number;
  minColumnWidth?: number;
  enableOptimization?: boolean;
}

// ============================================================================
// INCREMENTAL LAYOUT ENGINE
// ============================================================================

/**
 * Engine for incremental layout calculations during streaming
 */
export class IncrementalLayoutEngine {
  private sections = new Map<string, LayoutSection>();
  private sectionOrder: string[] = [];
  private columns: ColumnState[] = [];
  private containerHeight = 0;
  private lastStructureHash = 0;
  private renderCounter = 0;
  
  private readonly config: Required<IncrementalLayoutConfig>;
  private readonly columnWidth: number;

  constructor(config: IncrementalLayoutConfig) {
    this.config = {
      columns: config.columns,
      containerWidth: config.containerWidth,
      gap: config.gap ?? GRID_GAP,
      maxColumns: config.maxColumns ?? 4,
      minColumnWidth: config.minColumnWidth ?? 260,
      enableOptimization: config.enableOptimization ?? true,
    };

    // Calculate column width
    const totalGaps = this.config.gap * (this.config.columns - 1);
    this.columnWidth = (this.config.containerWidth - totalGaps) / this.config.columns;

    this.initializeColumns();
  }

  /**
   * Initializes column states
   */
  private initializeColumns(): void {
    this.columns = Array.from({ length: this.config.columns }, (_, i) => ({
      index: i,
      height: 0,
      sections: [],
    }));
  }

  /**
   * Resets the layout engine
   */
  reset(): void {
    this.sections.clear();
    this.sectionOrder = [];
    this.containerHeight = 0;
    this.lastStructureHash = 0;
    this.renderCounter = 0;
    this.initializeColumns();
  }

  /**
   * Updates column count (triggers full reflow)
   */
  setColumns(columns: number, containerWidth: number): LayoutUpdate {
    this.config.columns = columns;
    this.config.containerWidth = containerWidth;
    
    const totalGaps = this.config.gap * (columns - 1);
    (this as any).columnWidth = (containerWidth - totalGaps) / columns;
    
    this.initializeColumns();
    return this.fullReflow();
  }

  /**
   * Adds a new section to the layout
   */
  addSection(section: CardSection): LayoutUpdate {
    const key = this.getSectionKey(section);
    
    // Check if section already exists
    if (this.sections.has(key)) {
      return this.updateSection(section);
    }

    const contentHash = computeSectionHash(section);
    const colSpan = Math.min(calculateOptimalColumns(section, this.config.columns), this.config.columns);
    const estimatedHeight = estimateSectionHeight(section);

    // Find best column for placement
    const placement = this.findBestPlacement(colSpan, estimatedHeight);

    const layoutSection: LayoutSection = {
      section,
      key,
      contentHash,
      colSpan,
      estimatedHeight,
      column: placement.column,
      top: placement.top,
      left: generateLeftExpression(this.config.columns, placement.column, this.config.gap),
      width: generateWidthExpression(this.config.columns, colSpan, this.config.gap),
      isDirty: false,
      isNew: true,
      renderIndex: this.renderCounter++,
    };

    // Update state
    this.sections.set(key, layoutSection);
    this.sectionOrder.push(key);
    this.updateColumnHeights(layoutSection);
    this.updateContainerHeight();

    return {
      type: 'add',
      affectedSections: [key],
      newPositions: new Map([[key, {
        left: layoutSection.left,
        top: layoutSection.top,
        width: layoutSection.width,
      }]]),
      containerHeight: this.containerHeight,
      needsFullReflow: false,
    };
  }

  /**
   * Updates an existing section
   */
  updateSection(section: CardSection): LayoutUpdate {
    const key = this.getSectionKey(section);
    const existing = this.sections.get(key);

    if (!existing) {
      return this.addSection(section);
    }

    const newHash = computeSectionHash(section);
    const hashChanged = newHash !== existing.contentHash;
    
    // Check if colSpan changed
    const newColSpan = Math.min(calculateOptimalColumns(section, this.config.columns), this.config.columns);
    const colSpanChanged = newColSpan !== existing.colSpan;

    // Check if height estimate changed significantly
    const newHeight = estimateSectionHeight(section);
    const heightChanged = Math.abs(newHeight - existing.estimatedHeight) > 20;

    if (!hashChanged && !colSpanChanged && !heightChanged) {
      // No significant changes
      return {
        type: 'update',
        affectedSections: [],
        newPositions: new Map(),
        containerHeight: this.containerHeight,
        needsFullReflow: false,
      };
    }

    // Update section data
    existing.section = section;
    existing.contentHash = newHash;
    existing.isDirty = true;
    existing.isNew = false;

    // If colSpan changed, need to reposition
    if (colSpanChanged || heightChanged) {
      existing.colSpan = newColSpan;
      existing.estimatedHeight = newHeight;
      
      if (this.config.enableOptimization && !colSpanChanged) {
        // Only height changed - try in-place update
        return this.updateInPlace(existing);
      } else {
        // Structure changed - need partial reflow
        return this.partialReflow(key);
      }
    }

    return {
      type: 'update',
      affectedSections: [key],
      newPositions: new Map([[key, {
        left: existing.left,
        top: existing.top,
        width: existing.width,
      }]]),
      containerHeight: this.containerHeight,
      needsFullReflow: false,
    };
  }

  /**
   * Removes a section from the layout
   */
  removeSection(sectionOrKey: CardSection | string): LayoutUpdate {
    const key = typeof sectionOrKey === 'string' 
      ? sectionOrKey 
      : this.getSectionKey(sectionOrKey);

    if (!this.sections.has(key)) {
      return {
        type: 'remove',
        affectedSections: [],
        newPositions: new Map(),
        containerHeight: this.containerHeight,
        needsFullReflow: false,
      };
    }

    this.sections.delete(key);
    this.sectionOrder = this.sectionOrder.filter(k => k !== key);

    // Sections below may need repositioning
    return this.partialReflow(key);
  }

  /**
   * Updates measured height for a section
   */
  updateMeasuredHeight(key: string, height: number): LayoutUpdate | null {
    const section = this.sections.get(key);
    if (!section) return null;

    const heightDiff = Math.abs((section.measuredHeight ?? section.estimatedHeight) - height);
    section.measuredHeight = height;

    // Only reflow if height changed significantly
    if (heightDiff > 10) {
      return this.updateInPlace(section);
    }

    return null;
  }

  /**
   * Batch update multiple sections
   */
  batchUpdate(sections: CardSection[]): LayoutUpdate {
    const newStructureHash = computeStructureHash(sections);
    const structureChanged = newStructureHash !== this.lastStructureHash;
    this.lastStructureHash = newStructureHash;

    // If structure changed significantly, do full reflow
    if (structureChanged && this.shouldDoFullReflow(sections)) {
      this.sections.clear();
      this.sectionOrder = [];
      this.initializeColumns();
      
      for (const section of sections) {
        this.addSection(section);
      }
      
      return this.fullReflow();
    }

    // Otherwise, do incremental updates
    const affectedSections: string[] = [];
    const newPositions = new Map<string, { left: string; top: number; width: string }>();

    // Track which sections exist in new list
    const newKeys = new Set(sections.map(s => this.getSectionKey(s)));

    // Remove sections that no longer exist
    for (const key of this.sectionOrder) {
      if (!newKeys.has(key)) {
        this.removeSection(key);
        affectedSections.push(key);
      }
    }

    // Add or update sections
    for (const section of sections) {
      const key = this.getSectionKey(section);
      const update = this.sections.has(key) 
        ? this.updateSection(section)
        : this.addSection(section);

      if (update.affectedSections.length > 0) {
        affectedSections.push(...update.affectedSections);
        for (const [k, pos] of update.newPositions) {
          newPositions.set(k, pos);
        }
      }
    }

    return {
      type: affectedSections.length > this.sections.size / 2 ? 'full' : 'update',
      affectedSections,
      newPositions,
      containerHeight: this.containerHeight,
      needsFullReflow: false,
    };
  }

  /**
   * Gets all current positions
   */
  getPositions(): Map<string, LayoutSection> {
    return new Map(this.sections);
  }

  /**
   * Gets positioned sections in render order
   */
  getOrderedSections(): LayoutSection[] {
    return this.sectionOrder
      .map(key => this.sections.get(key))
      .filter((s): s is LayoutSection => s !== undefined)
      .sort((a, b) => a.renderIndex - b.renderIndex);
  }

  /**
   * Gets current container height
   */
  getContainerHeight(): number {
    return this.containerHeight;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private getSectionKey(section: CardSection): string {
    return section.id || `${section.title ?? 'section'}-${section.type ?? 'info'}`;
  }

  private findBestPlacement(colSpan: number, height: number): { column: number; top: number } {
    // Find the shortest column(s) that can accommodate the span
    let bestColumn = 0;
    let bestTop = Infinity;

    for (let col = 0; col <= this.config.columns - colSpan; col++) {
      // Find max height across the span
      let maxHeight = 0;
      for (let c = col; c < col + colSpan; c++) {
        const colState = this.columns[c];
        if (colState && colState.height > maxHeight) {
          maxHeight = colState.height;
        }
      }

      if (maxHeight < bestTop) {
        bestTop = maxHeight;
        bestColumn = col;
      }
    }

    return { column: bestColumn, top: bestTop === Infinity ? 0 : bestTop };
  }

  private updateColumnHeights(section: LayoutSection): void {
    const newHeight = section.top + (section.measuredHeight ?? section.estimatedHeight) + this.config.gap;

    for (let c = section.column; c < section.column + section.colSpan; c++) {
      const col = this.columns[c];
      if (col) {
        col.height = Math.max(col.height, newHeight);
        col.sections.push(section.key);
      }
    }
  }

  private updateContainerHeight(): void {
    this.containerHeight = Math.max(...this.columns.map(c => c.height), 0);
  }

  private updateInPlace(section: LayoutSection): LayoutUpdate {
    const height = section.measuredHeight ?? section.estimatedHeight;
    const oldHeight = section.estimatedHeight;
    const heightDiff = height - oldHeight;

    if (Math.abs(heightDiff) < 5) {
      return {
        type: 'update',
        affectedSections: [section.key],
        newPositions: new Map([[section.key, {
          left: section.left,
          top: section.top,
          width: section.width,
        }]]),
        containerHeight: this.containerHeight,
        needsFullReflow: false,
      };
    }

    // Update column heights
    for (let c = section.column; c < section.column + section.colSpan; c++) {
      const col = this.columns[c];
      if (col) {
        col.height += heightDiff;
      }
    }

    this.updateContainerHeight();

    // Find sections below that need repositioning
    const affectedSections: string[] = [section.key];
    const newPositions = new Map<string, { left: string; top: number; width: string }>();

    for (const [key, s] of this.sections) {
      if (s.top > section.top && this.sectionsOverlap(section, s)) {
        s.top += heightDiff;
        affectedSections.push(key);
        newPositions.set(key, { left: s.left, top: s.top, width: s.width });
      }
    }

    newPositions.set(section.key, {
      left: section.left,
      top: section.top,
      width: section.width,
    });

    return {
      type: 'reposition',
      affectedSections,
      newPositions,
      containerHeight: this.containerHeight,
      needsFullReflow: false,
    };
  }

  private sectionsOverlap(a: LayoutSection, b: LayoutSection): boolean {
    const aEnd = a.column + a.colSpan;
    const bEnd = b.column + b.colSpan;
    return a.column < bEnd && aEnd > b.column;
  }

  private partialReflow(fromKey: string): LayoutUpdate {
    // Find the section that changed
    const changedSection = this.sections.get(fromKey);
    const changedTop = changedSection?.top ?? 0;

    // Get all sections that need repositioning (below the changed one)
    const sectionsToReposition = this.sectionOrder
      .map(key => this.sections.get(key)!)
      .filter(s => s && s.top >= changedTop)
      .sort((a, b) => a.renderIndex - b.renderIndex);

    // Reset column heights up to the changed section
    this.initializeColumns();
    
    // First, place all sections above the changed one
    for (const [key, section] of this.sections) {
      if (section.top < changedTop) {
        this.updateColumnHeights(section);
      }
    }

    // Reposition affected sections
    const affectedSections: string[] = [];
    const newPositions = new Map<string, { left: string; top: number; width: string }>();

    for (const section of sectionsToReposition) {
      const placement = this.findBestPlacement(section.colSpan, section.estimatedHeight);
      
      const positionChanged = 
        section.column !== placement.column || 
        Math.abs(section.top - placement.top) > 1;

      section.column = placement.column;
      section.top = placement.top;
      section.left = generateLeftExpression(this.config.columns, placement.column, this.config.gap);

      if (positionChanged) {
        affectedSections.push(section.key);
        newPositions.set(section.key, {
          left: section.left,
          top: section.top,
          width: section.width,
        });
      }

      this.updateColumnHeights(section);
    }

    this.updateContainerHeight();

    return {
      type: 'reposition',
      affectedSections,
      newPositions,
      containerHeight: this.containerHeight,
      needsFullReflow: false,
    };
  }

  private fullReflow(): LayoutUpdate {
    this.initializeColumns();

    const allSections = this.sectionOrder
      .map(key => this.sections.get(key)!)
      .filter(s => s !== undefined)
      .sort((a, b) => a.renderIndex - b.renderIndex);

    const affectedSections: string[] = [];
    const newPositions = new Map<string, { left: string; top: number; width: string }>();

    for (const section of allSections) {
      const placement = this.findBestPlacement(section.colSpan, section.estimatedHeight);
      
      section.column = placement.column;
      section.top = placement.top;
      section.left = generateLeftExpression(this.config.columns, placement.column, this.config.gap);
      section.width = generateWidthExpression(this.config.columns, section.colSpan, this.config.gap);

      affectedSections.push(section.key);
      newPositions.set(section.key, {
        left: section.left,
        top: section.top,
        width: section.width,
      });

      this.updateColumnHeights(section);
    }

    this.updateContainerHeight();

    return {
      type: 'full',
      affectedSections,
      newPositions,
      containerHeight: this.containerHeight,
      needsFullReflow: true,
    };
  }

  private shouldDoFullReflow(sections: CardSection[]): boolean {
    // Full reflow if section count changed significantly
    const currentCount = this.sections.size;
    const newCount = sections.length;
    
    if (Math.abs(newCount - currentCount) > 3) {
      return true;
    }

    // Full reflow if more than half the sections are new
    const existingKeys = new Set(this.sectionOrder);
    const newSections = sections.filter(s => !existingKeys.has(this.getSectionKey(s)));
    
    return newSections.length > sections.length / 2;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates an incremental layout engine with default configuration
 */
export function createIncrementalLayout(
  columns: number,
  containerWidth: number,
  gap?: number
): IncrementalLayoutEngine {
  return new IncrementalLayoutEngine({
    columns,
    containerWidth,
    gap,
  });
}

/**
 * Converts layout sections to positioned sections format
 */
export function toPositionedSections(
  engine: IncrementalLayoutEngine
): Array<{
  section: CardSection;
  key: string;
  colSpan: number;
  left: string;
  top: number;
  width: string;
  isNew: boolean;
}> {
  return engine.getOrderedSections().map(s => ({
    section: s.section,
    key: s.key,
    colSpan: s.colSpan,
    left: s.left,
    top: s.top,
    width: s.width,
    isNew: s.isNew,
  }));
}









