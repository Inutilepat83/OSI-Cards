/**
 * Layout Debug Utilities
 * 
 * Real-time debug overlay for grid layouts showing:
 * - Column boundaries
 * - Gap areas
 * - Section bounding boxes
 * - Animation timelines
 * - Performance metrics
 * 
 * @example
 * ```typescript
 * import { LayoutDebugOverlay } from 'osi-cards-lib';
 * 
 * const debug = new LayoutDebugOverlay(container);
 * debug.show();
 * 
 * // Update with layout data
 * debug.updateLayout(sections, columns);
 * ```
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Debug overlay configuration
 */
export interface DebugOverlayConfig {
  /** Show column boundaries */
  showColumns?: boolean;
  /** Show gap regions */
  showGaps?: boolean;
  /** Show section bounding boxes */
  showBoundingBoxes?: boolean;
  /** Show animation timeline */
  showAnimationTimeline?: boolean;
  /** Show performance metrics */
  showPerformance?: boolean;
  /** Show live height measurements */
  showHeights?: boolean;
  /** Overlay opacity (0-1) */
  opacity?: number;
  /** Update interval (ms) */
  updateInterval?: number;
}

/**
 * Section debug info
 */
export interface SectionDebugInfo {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  column: number;
  colSpan: number;
  type: string;
  state: 'placeholder' | 'streaming' | 'complete';
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  fps: number;
  layoutTime: number;
  renderTime: number;
  memoryUsed: number;
  sectionCount: number;
  pendingAnimations: number;
}

/**
 * Animation debug info
 */
export interface AnimationDebugInfo {
  id: string;
  name: string;
  element: HTMLElement;
  progress: number;
  duration: number;
  state: 'running' | 'paused' | 'finished';
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_DEBUG_CONFIG: Required<DebugOverlayConfig> = {
  showColumns: true,
  showGaps: true,
  showBoundingBoxes: true,
  showAnimationTimeline: false,
  showPerformance: true,
  showHeights: true,
  opacity: 0.8,
  updateInterval: 100,
};

// ============================================================================
// COLORS
// ============================================================================

const COLORS = {
  column: 'rgba(99, 102, 241, 0.2)',
  columnBorder: 'rgba(99, 102, 241, 0.5)',
  gap: 'rgba(251, 146, 60, 0.3)',
  boundingBox: 'rgba(34, 197, 94, 0.3)',
  boundingBoxBorder: 'rgba(34, 197, 94, 0.8)',
  placeholder: 'rgba(156, 163, 175, 0.3)',
  streaming: 'rgba(59, 130, 246, 0.3)',
  complete: 'rgba(16, 185, 129, 0.3)',
  text: '#ffffff',
  textBg: 'rgba(0, 0, 0, 0.7)',
  warning: '#fbbf24',
  error: '#ef4444',
};

// ============================================================================
// LAYOUT DEBUG OVERLAY
// ============================================================================

/**
 * Debug overlay for visualizing grid layouts
 */
export class LayoutDebugOverlay {
  private container: HTMLElement;
  private overlay: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private metricsPanel: HTMLElement | null = null;
  private animationPanel: HTMLElement | null = null;
  
  private config: Required<DebugOverlayConfig>;
  private isVisible = false;
  private updateTimer: number | null = null;
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsHistory: number[] = [];
  
  private sections: SectionDebugInfo[] = [];
  private columns = 4;
  private gap = 12;
  private performanceMetrics: PerformanceMetrics = {
    fps: 0,
    layoutTime: 0,
    renderTime: 0,
    memoryUsed: 0,
    sectionCount: 0,
    pendingAnimations: 0,
  };

  constructor(container: HTMLElement, config?: DebugOverlayConfig) {
    this.container = container;
    this.config = { ...DEFAULT_DEBUG_CONFIG, ...config };
  }

  /**
   * Shows the debug overlay
   */
  show(): void {
    if (this.isVisible) return;

    this.createOverlay();
    this.startUpdating();
    this.isVisible = true;
  }

  /**
   * Hides the debug overlay
   */
  hide(): void {
    if (!this.isVisible) return;

    this.stopUpdating();
    this.destroyOverlay();
    this.isVisible = false;
  }

  /**
   * Toggles the debug overlay
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Updates overlay configuration
   */
  configure(config: Partial<DebugOverlayConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.isVisible) {
      this.render();
    }
  }

  /**
   * Updates layout data for visualization
   */
  updateLayout(
    sections: SectionDebugInfo[],
    columns: number,
    gap: number = 12
  ): void {
    this.sections = sections;
    this.columns = columns;
    this.gap = gap;
    this.performanceMetrics.sectionCount = sections.length;

    if (this.isVisible) {
      this.render();
    }
  }

  /**
   * Records layout timing
   */
  recordLayoutTime(ms: number): void {
    this.performanceMetrics.layoutTime = Math.round(ms * 100) / 100;
  }

  /**
   * Records render timing
   */
  recordRenderTime(ms: number): void {
    this.performanceMetrics.renderTime = Math.round(ms * 100) / 100;
  }

  /**
   * Cleans up resources
   */
  destroy(): void {
    this.hide();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private createOverlay(): void {
    // Create main overlay container
    this.overlay = document.createElement('div');
    this.overlay.className = 'layout-debug-overlay';
    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 10000;
      font-family: monospace;
      font-size: 10px;
    `;

    // Create canvas for drawing
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `;
    this.overlay.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // Create metrics panel
    if (this.config.showPerformance) {
      this.metricsPanel = document.createElement('div');
      this.metricsPanel.className = 'debug-metrics-panel';
      this.metricsPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px;
        background: ${COLORS.textBg};
        color: ${COLORS.text};
        border-radius: 4px;
        font-size: 11px;
        line-height: 1.5;
        pointer-events: auto;
        z-index: 10001;
        min-width: 180px;
      `;
      document.body.appendChild(this.metricsPanel);
    }

    // Create animation timeline panel
    if (this.config.showAnimationTimeline) {
      this.animationPanel = document.createElement('div');
      this.animationPanel.className = 'debug-animation-panel';
      this.animationPanel.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        right: 10px;
        height: 60px;
        background: ${COLORS.textBg};
        border-radius: 4px;
        pointer-events: auto;
        z-index: 10001;
      `;
      document.body.appendChild(this.animationPanel);
    }

    this.container.style.position = 'relative';
    this.container.appendChild(this.overlay);

    // Resize canvas
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private destroyOverlay(): void {
    if (this.overlay?.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    if (this.metricsPanel?.parentNode) {
      this.metricsPanel.parentNode.removeChild(this.metricsPanel);
    }
    if (this.animationPanel?.parentNode) {
      this.animationPanel.parentNode.removeChild(this.animationPanel);
    }
    this.overlay = null;
    this.canvas = null;
    this.ctx = null;
    this.metricsPanel = null;
    this.animationPanel = null;
  }

  private resizeCanvas(): void {
    if (!this.canvas || !this.container) return;

    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  private startUpdating(): void {
    this.lastFrameTime = performance.now();
    this.updateTimer = window.setInterval(() => {
      this.updateFPS();
      this.updateMetrics();
      this.render();
    }, this.config.updateInterval);
  }

  private stopUpdating(): void {
    if (this.updateTimer !== null) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  private updateFPS(): void {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const fps = Math.round(1000 / delta);
    this.fpsHistory.push(fps);

    if (this.fpsHistory.length > 10) {
      this.fpsHistory.shift();
    }

    this.performanceMetrics.fps = Math.round(
      this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
    );
  }

  private updateMetrics(): void {
    // Get memory usage if available
    if ((performance as any).memory) {
      this.performanceMetrics.memoryUsed = Math.round(
        (performance as any).memory.usedJSHeapSize / (1024 * 1024)
      );
    }

    // Count running animations
    const animations = document.getAnimations();
    this.performanceMetrics.pendingAnimations = animations.filter(
      a => a.playState === 'running'
    ).length;
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return;

    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.globalAlpha = this.config.opacity;

    if (this.config.showColumns) {
      this.renderColumns(width, height);
    }

    if (this.config.showGaps) {
      this.renderGaps(width);
    }

    if (this.config.showBoundingBoxes) {
      this.renderBoundingBoxes();
    }

    if (this.config.showHeights) {
      this.renderHeightLabels();
    }

    this.renderMetricsPanel();
  }

  private renderColumns(width: number, height: number): void {
    if (!this.ctx) return;

    const totalGaps = this.gap * (this.columns - 1);
    const columnWidth = (width - totalGaps) / this.columns;

    this.ctx.fillStyle = COLORS.column;
    this.ctx.strokeStyle = COLORS.columnBorder;
    this.ctx.lineWidth = 1;

    for (let i = 0; i < this.columns; i++) {
      const x = i * (columnWidth + this.gap);

      // Fill column
      this.ctx.fillRect(x, 0, columnWidth, height);

      // Draw column number
      this.ctx.fillStyle = COLORS.text;
      this.ctx.font = 'bold 12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`Col ${i + 1}`, x + columnWidth / 2, 20);

      this.ctx.fillStyle = COLORS.column;
    }
  }

  private renderGaps(width: number): void {
    if (!this.ctx) return;

    const totalGaps = this.gap * (this.columns - 1);
    const columnWidth = (width - totalGaps) / this.columns;

    this.ctx.fillStyle = COLORS.gap;

    for (let i = 0; i < this.columns - 1; i++) {
      const x = (i + 1) * columnWidth + i * this.gap;
      this.ctx.fillRect(x, 0, this.gap, this.canvas!.height);
    }
  }

  private renderBoundingBoxes(): void {
    if (!this.ctx) return;

    for (const section of this.sections) {
      // Choose color based on state
      let fillColor = COLORS.boundingBox;
      switch (section.state) {
        case 'placeholder':
          fillColor = COLORS.placeholder;
          break;
        case 'streaming':
          fillColor = COLORS.streaming;
          break;
        case 'complete':
          fillColor = COLORS.complete;
          break;
      }

      // Draw bounding box
      this.ctx.fillStyle = fillColor;
      this.ctx.strokeStyle = COLORS.boundingBoxBorder;
      this.ctx.lineWidth = 1;

      this.ctx.fillRect(section.left, section.top, section.width, section.height);
      this.ctx.strokeRect(section.left, section.top, section.width, section.height);

      // Draw section label
      this.ctx.fillStyle = COLORS.textBg;
      const labelHeight = 18;
      this.ctx.fillRect(section.left, section.top, section.width, labelHeight);

      this.ctx.fillStyle = COLORS.text;
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(
        `${section.type} (${section.colSpan}col)`,
        section.left + 4,
        section.top + 13
      );
    }
  }

  private renderHeightLabels(): void {
    if (!this.ctx) return;

    for (const section of this.sections) {
      this.ctx.fillStyle = COLORS.textBg;
      const labelWidth = 50;
      const labelHeight = 16;
      this.ctx.fillRect(
        section.left + section.width - labelWidth,
        section.top + section.height - labelHeight,
        labelWidth,
        labelHeight
      );

      this.ctx.fillStyle = COLORS.text;
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(
        `${Math.round(section.height)}px`,
        section.left + section.width - 4,
        section.top + section.height - 4
      );
    }
  }

  private renderMetricsPanel(): void {
    if (!this.metricsPanel) return;

    const { fps, layoutTime, renderTime, memoryUsed, sectionCount, pendingAnimations } = 
      this.performanceMetrics;

    const fpsColor = fps < 30 ? COLORS.error : fps < 55 ? COLORS.warning : '#10b981';

    this.metricsPanel.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #444; padding-bottom: 4px;">
        📊 Layout Debug
      </div>
      <div style="color: ${fpsColor}">
        FPS: <strong>${fps}</strong>
      </div>
      <div>Layout: ${layoutTime}ms</div>
      <div>Render: ${renderTime}ms</div>
      <div>Memory: ${memoryUsed}MB</div>
      <div style="margin-top: 8px; border-top: 1px solid #444; padding-top: 4px;">
        Sections: ${sectionCount}
      </div>
      <div>Columns: ${this.columns}</div>
      <div>Gap: ${this.gap}px</div>
      <div>Animations: ${pendingAnimations}</div>
      <div style="margin-top: 8px; font-size: 9px; color: #888;">
        Press <kbd style="background:#333;padding:2px 4px;border-radius:2px;">Ctrl+Shift+D</kbd> to toggle
      </div>
    `;
  }
}

// ============================================================================
// GLOBAL DEBUG TOGGLE
// ============================================================================

let globalDebugOverlay: LayoutDebugOverlay | null = null;

/**
 * Enables global debug mode for a container
 */
export function enableLayoutDebug(
  container: HTMLElement,
  config?: DebugOverlayConfig
): LayoutDebugOverlay {
  if (globalDebugOverlay) {
    globalDebugOverlay.destroy();
  }

  globalDebugOverlay = new LayoutDebugOverlay(container, config);

  // Add keyboard shortcut
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      globalDebugOverlay?.toggle();
      e.preventDefault();
    }
  };
  document.addEventListener('keydown', handler);

  return globalDebugOverlay;
}

/**
 * Disables global debug mode
 */
export function disableLayoutDebug(): void {
  if (globalDebugOverlay) {
    globalDebugOverlay.destroy();
    globalDebugOverlay = null;
  }
}

/**
 * Gets the global debug overlay instance
 */
export function getLayoutDebugOverlay(): LayoutDebugOverlay | null {
  return globalDebugOverlay;
}




