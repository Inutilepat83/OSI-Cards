/**
 * Grid Debug Utility
 * 
 * Debug and developer experience tools for masonry grid:
 * - Visual debug overlay
 * - Layout performance profiler
 * - Section inspector
 * - Grid metrics dashboard
 * - Console logging utilities
 * - Algorithm comparison tool
 * - Gap visualization
 * - Column balance indicator
 * - Height estimation accuracy tracking
 * - Export/import layout state
 * 
 * @example
 * ```typescript
 * import { 
 *   GridDebugger,
 *   LayoutProfiler,
 *   GridInspector 
 * } from './grid-debug.util';
 * 
 * const debugger = new GridDebugger(containerElement);
 * debugger.showOverlay();
 * debugger.highlightGaps();
 * 
 * const profiler = new LayoutProfiler();
 * profiler.start('layout-calculation');
 * // ... layout code
 * const metrics = profiler.end('layout-calculation');
 * ```
 */

import { SectionPlacement } from './layout-performance.util';
import { LayoutGap, GapMetrics, GapAnalyzer } from './gap-filler-optimizer.util';
import { CardSection } from '../models/card.model';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Debug mode options
 */
export type DebugMode = 
  | 'off'
  | 'basic'        // Shows grid lines only
  | 'detailed'     // Shows all metrics
  | 'performance'  // Focus on performance metrics
  | 'gaps'         // Focus on gap visualization
  | 'priority';    // Shows priority colors

/**
 * Debug overlay configuration
 */
export interface DebugOverlayConfig {
  /** Show column grid lines */
  showGridLines: boolean;
  /** Show section boundaries */
  showBoundaries: boolean;
  /** Show gap regions */
  showGaps: boolean;
  /** Show section keys/IDs */
  showKeys: boolean;
  /** Show height values */
  showHeights: boolean;
  /** Show priority indicators */
  showPriorities: boolean;
  /** Overlay opacity (0-1) */
  opacity: number;
  /** Grid line color */
  gridLineColor: string;
  /** Gap highlight color */
  gapColor: string;
  /** Z-index for overlay */
  zIndex: number;
}

/**
 * Default debug overlay configuration
 */
export const DEFAULT_DEBUG_CONFIG: DebugOverlayConfig = {
  showGridLines: true,
  showBoundaries: true,
  showGaps: true,
  showKeys: true,
  showHeights: false,
  showPriorities: false,
  opacity: 0.3,
  gridLineColor: '#3b82f6',
  gapColor: '#ef4444',
  zIndex: 9999,
};

/**
 * Performance timing entry
 */
export interface PerformanceTiming {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Layout profiler metrics
 */
export interface ProfilerMetrics {
  layoutCalculations: number;
  totalLayoutTime: number;
  averageLayoutTime: number;
  maxLayoutTime: number;
  minLayoutTime: number;
  heightEstimations: number;
  totalEstimationTime: number;
  gapFills: number;
  reflows: number;
}

/**
 * Section inspection result
 */
export interface SectionInspection {
  key: string;
  type: string;
  placement: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  estimatedHeight: number;
  actualHeight?: number;
  heightAccuracy?: number;
  priority: number;
  colSpan: number;
  neighbors: {
    above?: string;
    below?: string;
    left?: string;
    right?: string;
  };
  warnings: string[];
}

/**
 * Grid metrics for dashboard
 */
export interface GridDashboardMetrics {
  sections: {
    total: number;
    byType: Record<string, number>;
    bySpan: Record<number, number>;
  };
  layout: {
    columns: number;
    totalHeight: number;
    utilization: number;
    gapCount: number;
    gapArea: number;
  };
  performance: {
    lastLayoutTime: number;
    averageLayoutTime: number;
    frameRate: number;
  };
  health: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

// ============================================================================
// GRID DEBUGGER CLASS (Items 81-85)
// ============================================================================

/**
 * Visual debugging tool for masonry grid
 */
export class GridDebugger {
  private container: HTMLElement | null = null;
  private overlayElement: HTMLElement | null = null;
  private config: DebugOverlayConfig;
  private mode: DebugMode = 'off';
  private placements: SectionPlacement[] = [];
  private gaps: LayoutGap[] = [];

  constructor(config: Partial<DebugOverlayConfig> = {}) {
    this.config = { ...DEFAULT_DEBUG_CONFIG, ...config };
  }

  /**
   * Attaches debugger to a container
   */
  attach(container: HTMLElement): void {
    this.container = container;
    this.createOverlay();
  }

  /**
   * Creates the debug overlay element
   */
  private createOverlay(): void {
    if (!this.container) return;

    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'grid-debug-overlay';
    this.overlayElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: ${this.config.zIndex};
      opacity: ${this.config.opacity};
    `;

    this.container.style.position = 'relative';
    this.container.appendChild(this.overlayElement);
  }

  /**
   * Sets debug mode
   */
  setMode(mode: DebugMode): void {
    this.mode = mode;
    this.render();
  }

  /**
   * Updates layout data
   */
  updateLayout(
    placements: SectionPlacement[],
    gaps: LayoutGap[],
    columns: number
  ): void {
    this.placements = placements;
    this.gaps = gaps;
    this.render();
  }

  /**
   * Renders the debug overlay
   */
  private render(): void {
    if (!this.overlayElement || this.mode === 'off') {
      if (this.overlayElement) {
        this.overlayElement.innerHTML = '';
      }
      return;
    }

    const html: string[] = [];

    // Grid lines
    if (this.config.showGridLines) {
      html.push(this.renderGridLines());
    }

    // Section boundaries
    if (this.config.showBoundaries) {
      html.push(this.renderBoundaries());
    }

    // Gaps
    if (this.config.showGaps) {
      html.push(this.renderGaps());
    }

    this.overlayElement.innerHTML = html.join('');
  }

  /**
   * Renders grid lines
   */
  private renderGridLines(): string {
    const containerHeight = this.container?.offsetHeight ?? 1000;
    const lines: string[] = [];

    // Vertical column lines (simplified)
    for (let i = 0; i <= 4; i++) {
      const x = i * 25;  // 25% per column for 4 columns
      lines.push(`
        <div style="
          position: absolute;
          top: 0;
          left: ${x}%;
          width: 1px;
          height: ${containerHeight}px;
          background: ${this.config.gridLineColor};
          opacity: 0.5;
        "></div>
      `);
    }

    return lines.join('');
  }

  /**
   * Renders section boundaries
   */
  private renderBoundaries(): string {
    return this.placements.map(p => `
      <div style="
        position: absolute;
        top: ${p.y}px;
        left: ${p.x * 25}%;
        width: ${p.width * 25}%;
        height: ${p.height}px;
        border: 2px dashed ${this.config.gridLineColor};
        box-sizing: border-box;
      ">
        ${this.config.showKeys ? `
          <span style="
            position: absolute;
            top: 2px;
            left: 2px;
            background: ${this.config.gridLineColor};
            color: white;
            font-size: 10px;
            padding: 1px 4px;
            border-radius: 2px;
          ">${p.key.substring(0, 20)}</span>
        ` : ''}
        ${this.config.showHeights ? `
          <span style="
            position: absolute;
            bottom: 2px;
            right: 2px;
            background: rgba(0,0,0,0.5);
            color: white;
            font-size: 10px;
            padding: 1px 4px;
            border-radius: 2px;
          ">${p.height}px</span>
        ` : ''}
      </div>
    `).join('');
  }

  /**
   * Renders gap regions
   */
  private renderGaps(): string {
    return this.gaps.map(gap => `
      <div style="
        position: absolute;
        top: ${gap.top}px;
        left: ${gap.column * 25}%;
        width: ${gap.width * 25}%;
        height: ${gap.height}px;
        background: ${this.config.gapColor};
        opacity: 0.3;
        border: 1px solid ${this.config.gapColor};
      ">
        <span style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 10px;
          color: white;
          background: ${this.config.gapColor};
          padding: 1px 4px;
          border-radius: 2px;
        ">GAP: ${Math.round(gap.area)}px²</span>
      </div>
    `).join('');
  }

  /**
   * Shows the overlay
   */
  show(): void {
    if (this.mode === 'off') {
      this.mode = 'basic';
    }
    this.render();
    if (this.overlayElement) {
      this.overlayElement.style.display = 'block';
    }
  }

  /**
   * Hides the overlay
   */
  hide(): void {
    if (this.overlayElement) {
      this.overlayElement.style.display = 'none';
    }
  }

  /**
   * Toggles the overlay
   */
  toggle(): void {
    if (this.overlayElement?.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Destroys the debugger
   */
  destroy(): void {
    this.overlayElement?.remove();
    this.overlayElement = null;
    this.container = null;
  }
}

// ============================================================================
// LAYOUT PROFILER (Item 82)
// ============================================================================

/**
 * Profiles layout performance
 */
export class LayoutProfiler {
  private timings: Map<string, PerformanceTiming> = new Map();
  private history: PerformanceTiming[] = [];
  private metrics: ProfilerMetrics = this.createEmptyMetrics();

  private createEmptyMetrics(): ProfilerMetrics {
    return {
      layoutCalculations: 0,
      totalLayoutTime: 0,
      averageLayoutTime: 0,
      maxLayoutTime: 0,
      minLayoutTime: Infinity,
      heightEstimations: 0,
      totalEstimationTime: 0,
      gapFills: 0,
      reflows: 0,
    };
  }

  /**
   * Starts a timing
   */
  start(name: string, metadata?: Record<string, unknown>): void {
    this.timings.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * Ends a timing and returns duration
   */
  end(name: string): number {
    const timing = this.timings.get(name);
    if (!timing) return 0;

    timing.endTime = performance.now();
    timing.duration = timing.endTime - timing.startTime;
    
    this.history.push({ ...timing });
    this.timings.delete(name);
    
    this.updateMetrics(name, timing.duration);
    
    return timing.duration;
  }

  /**
   * Updates aggregated metrics
   */
  private updateMetrics(name: string, duration: number): void {
    if (name.includes('layout')) {
      this.metrics.layoutCalculations++;
      this.metrics.totalLayoutTime += duration;
      this.metrics.averageLayoutTime = 
        this.metrics.totalLayoutTime / this.metrics.layoutCalculations;
      this.metrics.maxLayoutTime = Math.max(this.metrics.maxLayoutTime, duration);
      this.metrics.minLayoutTime = Math.min(this.metrics.minLayoutTime, duration);
    }

    if (name.includes('estimate') || name.includes('height')) {
      this.metrics.heightEstimations++;
      this.metrics.totalEstimationTime += duration;
    }

    if (name.includes('gap') || name.includes('fill')) {
      this.metrics.gapFills++;
    }

    if (name.includes('reflow')) {
      this.metrics.reflows++;
    }
  }

  /**
   * Measures a function's execution time
   */
  measure<T>(name: string, fn: () => T): T {
    this.start(name);
    const result = fn();
    this.end(name);
    return result;
  }

  /**
   * Measures an async function
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    const result = await fn();
    this.end(name);
    return result;
  }

  /**
   * Gets current metrics
   */
  getMetrics(): ProfilerMetrics {
    return { ...this.metrics };
  }

  /**
   * Gets timing history
   */
  getHistory(): PerformanceTiming[] {
    return [...this.history];
  }

  /**
   * Gets slow operations (above threshold)
   */
  getSlowOperations(thresholdMs: number = 16): PerformanceTiming[] {
    return this.history.filter(t => (t.duration ?? 0) > thresholdMs);
  }

  /**
   * Prints report to console
   */
  printReport(): void {
    console.group('Layout Performance Report');
    console.table(this.metrics);
    
    const slow = this.getSlowOperations();
    if (slow.length > 0) {
      console.warn(`${slow.length} slow operations detected:`);
      console.table(slow.map(t => ({
        name: t.name,
        duration: `${t.duration?.toFixed(2)}ms`,
      })));
    }
    
    console.groupEnd();
  }

  /**
   * Resets all metrics
   */
  reset(): void {
    this.timings.clear();
    this.history = [];
    this.metrics = this.createEmptyMetrics();
  }
}

// ============================================================================
// SECTION INSPECTOR (Item 83)
// ============================================================================

/**
 * Inspects individual sections
 */
export class GridInspector {
  /**
   * Inspects a section
   */
  static inspect(
    section: CardSection,
    placement: SectionPlacement,
    allPlacements: SectionPlacement[],
    estimatedHeight: number,
    actualHeight?: number
  ): SectionInspection {
    const warnings: string[] = [];

    // Check height accuracy
    let heightAccuracy: number | undefined;
    if (actualHeight !== undefined) {
      heightAccuracy = 100 - Math.abs(estimatedHeight - actualHeight) / actualHeight * 100;
      if (heightAccuracy < 80) {
        warnings.push(`Low height estimation accuracy: ${heightAccuracy.toFixed(1)}%`);
      }
    }

    // Find neighbors
    const neighbors = this.findNeighbors(placement, allPlacements);

    // Check for issues
    if (placement.width > 4) {
      warnings.push('Section spans more than 4 columns');
    }
    if (placement.height > 600) {
      warnings.push('Section height exceeds recommended maximum');
    }
    if (placement.y < 0) {
      warnings.push('Section has negative Y position');
    }

    return {
      key: section.id ?? section.title ?? '',
      type: section.type ?? 'unknown',
      placement: {
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height,
      },
      estimatedHeight,
      actualHeight,
      heightAccuracy,
      priority: (section as unknown as { priority?: number }).priority ?? 0,
      colSpan: section.colSpan ?? 1,
      neighbors,
      warnings,
    };
  }

  /**
   * Finds neighboring sections
   */
  private static findNeighbors(
    placement: SectionPlacement,
    allPlacements: SectionPlacement[]
  ): { above?: string; below?: string; left?: string; right?: string } {
    const result: { above?: string; below?: string; left?: string; right?: string } = {};

    for (const other of allPlacements) {
      if (other.key === placement.key) continue;

      // Above: same column, ends right before this one starts
      if (other.x === placement.x && 
          Math.abs(other.y + other.height - placement.y) < 20) {
        result.above = other.key;
      }

      // Below: same column, starts right after this one ends
      if (other.x === placement.x && 
          Math.abs(placement.y + placement.height - other.y) < 20) {
        result.below = other.key;
      }

      // Left: adjacent column to the left
      if (other.x + other.width === placement.x &&
          other.y < placement.y + placement.height &&
          other.y + other.height > placement.y) {
        result.left = other.key;
      }

      // Right: adjacent column to the right
      if (placement.x + placement.width === other.x &&
          other.y < placement.y + placement.height &&
          other.y + other.height > placement.y) {
        result.right = other.key;
      }
    }

    return result;
  }

  /**
   * Batch inspects all sections
   */
  static inspectAll(
    sections: CardSection[],
    placements: SectionPlacement[],
    heights: Map<string, { estimated: number; actual?: number }>
  ): SectionInspection[] {
    return sections.map(section => {
      const key = section.id ?? section.title ?? '';
      const placement = placements.find(p => p.key === key);
      const heightData = heights.get(key);

      if (!placement) {
        return {
          key,
          type: section.type ?? 'unknown',
          placement: { x: 0, y: 0, width: 1, height: 0 },
          estimatedHeight: 0,
          priority: 0,
          colSpan: section.colSpan ?? 1,
          neighbors: {},
          warnings: ['Section has no placement'],
        };
      }

      return this.inspect(
        section,
        placement,
        placements,
        heightData?.estimated ?? placement.height,
        heightData?.actual
      );
    });
  }
}

// ============================================================================
// METRICS DASHBOARD (Item 84)
// ============================================================================

/**
 * Generates grid metrics for dashboard display
 */
export function generateGridDashboard(
  sections: CardSection[],
  placements: SectionPlacement[],
  gapMetrics: GapMetrics,
  performanceMetrics: ProfilerMetrics
): GridDashboardMetrics {
  // Section analysis
  const byType: Record<string, number> = {};
  const bySpan: Record<number, number> = {};
  
  for (const section of sections) {
    const type = section.type ?? 'unknown';
    byType[type] = (byType[type] ?? 0) + 1;
    
    const span = section.colSpan ?? 1;
    bySpan[span] = (bySpan[span] ?? 0) + 1;
  }

  // Layout analysis
  const totalHeight = placements.length > 0
    ? Math.max(...placements.map(p => p.y + p.height))
    : 0;

  // Health score
  const issues: string[] = [];
  const suggestions: string[] = [];
  let healthScore = 100;

  if (gapMetrics.utilizationPercent < 85) {
    healthScore -= 15;
    issues.push(`Low utilization: ${gapMetrics.utilizationPercent.toFixed(1)}%`);
    suggestions.push('Consider enabling flexible column spans');
  }

  if (gapMetrics.totalGaps > sections.length * 0.3) {
    healthScore -= 10;
    issues.push(`High gap count: ${gapMetrics.totalGaps}`);
    suggestions.push('Try different packing algorithm');
  }

  if (performanceMetrics.averageLayoutTime > 16) {
    healthScore -= 20;
    issues.push(`Slow layout: ${performanceMetrics.averageLayoutTime.toFixed(2)}ms avg`);
    suggestions.push('Enable layout memoization');
  }

  return {
    sections: {
      total: sections.length,
      byType,
      bySpan,
    },
    layout: {
      columns: 4,  // Would come from config
      totalHeight,
      utilization: gapMetrics.utilizationPercent,
      gapCount: gapMetrics.totalGaps,
      gapArea: gapMetrics.totalGapArea,
    },
    performance: {
      lastLayoutTime: performanceMetrics.totalLayoutTime / Math.max(1, performanceMetrics.layoutCalculations),
      averageLayoutTime: performanceMetrics.averageLayoutTime,
      frameRate: performanceMetrics.averageLayoutTime > 0 ? 1000 / performanceMetrics.averageLayoutTime : 60,
    },
    health: {
      score: Math.max(0, healthScore),
      issues,
      suggestions,
    },
  };
}

// ============================================================================
// CONSOLE LOGGING UTILITIES (Item 85)
// ============================================================================

/**
 * Debug logging with categories
 */
export class GridLogger {
  private enabled = true;
  private enabledCategories: Set<string> = new Set(['error', 'warn']);

  /**
   * Enables/disables logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Enables specific categories
   */
  enableCategory(category: string): void {
    this.enabledCategories.add(category);
  }

  /**
   * Disables specific category
   */
  disableCategory(category: string): void {
    this.enabledCategories.delete(category);
  }

  /**
   * Logs with category
   */
  log(category: string, message: string, data?: unknown): void {
    if (!this.enabled || !this.enabledCategories.has(category)) return;

    const prefix = `[Grid:${category}]`;
    
    if (data !== undefined) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }

  /**
   * Logs layout event
   */
  layout(message: string, data?: unknown): void {
    this.log('layout', message, data);
  }

  /**
   * Logs performance event
   */
  perf(message: string, data?: unknown): void {
    this.log('perf', message, data);
  }

  /**
   * Logs warning
   */
  warn(message: string, data?: unknown): void {
    this.log('warn', `⚠️ ${message}`, data);
  }

  /**
   * Logs error
   */
  error(message: string, data?: unknown): void {
    this.log('error', `❌ ${message}`, data);
  }

  /**
   * Logs section info
   */
  section(key: string, message: string, data?: unknown): void {
    this.log('section', `[${key}] ${message}`, data);
  }
}

// ============================================================================
// EXPORT/IMPORT UTILITIES (Item 90)
// ============================================================================

/**
 * Layout state for export/import
 */
export interface LayoutState {
  version: string;
  timestamp: number;
  sections: CardSection[];
  placements: SectionPlacement[];
  config: {
    columns: number;
    gap: number;
    algorithm: string;
  };
  metrics: {
    utilization: number;
    gapCount: number;
    totalHeight: number;
  };
}

/**
 * Exports layout state to JSON
 */
export function exportLayoutState(
  sections: CardSection[],
  placements: SectionPlacement[],
  config: { columns: number; gap: number; algorithm: string },
  metrics: { utilization: number; gapCount: number; totalHeight: number }
): string {
  const state: LayoutState = {
    version: '1.0',
    timestamp: Date.now(),
    sections,
    placements,
    config,
    metrics,
  };
  
  return JSON.stringify(state, null, 2);
}

/**
 * Imports layout state from JSON
 */
export function importLayoutState(json: string): LayoutState | null {
  try {
    const state = JSON.parse(json) as LayoutState;
    
    // Validate structure
    if (!state.version || !state.sections || !state.placements) {
      return null;
    }
    
    return state;
  } catch {
    return null;
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

/** Global logger instance */
export const gridLogger = new GridLogger();

/** Global profiler instance */
export const gridProfiler = new LayoutProfiler();

