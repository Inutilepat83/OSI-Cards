/**
 * Smart Grid Logger
 *
 * Comprehensive logging system for debugging and optimizing grid layout.
 * Logs placement decisions, gap analysis, and layout metrics.
 *
 * Enhanced with:
 * - Dev mode auto-enable (Point 46)
 * - Log persistence with rotation (Point 47)
 * - Counterfactual logging (Point 48)
 * - ASCII art layout visualization (Point 49)
 * - Structured JSON format for E2E tests (Point 50)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

/**
 * Counterfactual placement option (Point 48)
 */
export interface CounterfactualPlacement {
  column: number;
  top: number;
  score: number;
  reason: string;
  wastedSpace: number;
}

/**
 * Structured log format for E2E tests (Point 50)
 */
export interface StructuredLogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  phase: LayoutPhase;
  message: string;
  data?: Record<string, unknown>;
  duration?: number;
  metrics?: {
    utilization?: number;
    gapCount?: number;
    balanceScore?: number;
  };
}

/**
 * Log persistence configuration (Point 47)
 */
export interface LogPersistenceConfig {
  enabled: boolean;
  storageKey: string;
  maxEntries: number;
  rotationThreshold: number;
}

export interface GridLayoutLogEntry {
  timestamp: number;
  phase: LayoutPhase;
  message: string;
  data?: Record<string, unknown>;
  duration?: number;
}

export type LayoutPhase =
  | 'init'
  | 'measure'
  | 'sort'
  | 'pack'
  | 'place'
  | 'reflow'
  | 'gap-fill'
  | 'balance'
  | 'complete';

export interface PlacementDecision {
  sectionId: string;
  sectionType: string;
  title: string;
  requestedColSpan: number;
  actualColSpan: number;
  column: number;
  row: number;
  top: number;
  reason: string;
  alternatives?: Array<{ column: number; reason: string }>;
}

export interface GapAnalysis {
  totalGaps: number;
  gapArea: number;
  gaps: Array<{
    column: number;
    startRow: number;
    endRow: number;
    height: number;
  }>;
  utilizationPercent: number;
}

export interface ColumnAnalysis {
  heights: number[];
  variance: number;
  maxDiff: number;
  balanceScore: number;
}

export interface LayoutMetrics {
  totalSections: number;
  columns: number;
  containerWidth: number;
  containerHeight: number;
  placementDecisions: PlacementDecision[];
  gapAnalysis: GapAnalysis;
  columnAnalysis: ColumnAnalysis;
  phases: Array<{ phase: LayoutPhase; duration: number }>;
  totalDuration: number;
}

class SmartGridLogger {
  private logLevel: LogLevel = 'info';
  private logs: GridLayoutLogEntry[] = [];
  private structuredLogs: StructuredLogEntry[] = []; // Point 50
  private currentMetrics: Partial<LayoutMetrics> = {};
  private phaseTimers: Map<LayoutPhase, number> = new Map();
  private startTime = 0;
  private enabled = true;
  private consoleOutput = true;
  private logIdCounter = 0;

  // Log persistence (Point 47)
  private persistenceConfig: LogPersistenceConfig = {
    enabled: false,
    storageKey: 'osi-grid-logs',
    maxEntries: 500,
    rotationThreshold: 400,
  };

  // Color codes for console output
  private readonly colors = {
    debug: '\x1b[36m',   // Cyan
    info: '\x1b[32m',    // Green
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
  };

  private readonly phaseEmojis: Record<LayoutPhase, string> = {
    'init': '🚀',
    'measure': '📏',
    'sort': '📊',
    'pack': '📦',
    'place': '📍',
    'reflow': '🔄',
    'gap-fill': '🧩',
    'balance': '⚖️',
    'complete': '✅',
  };

  /**
   * Configure the logger
   */
  configure(options: {
    level?: LogLevel;
    enabled?: boolean;
    consoleOutput?: boolean;
    persistence?: Partial<LogPersistenceConfig>;
  }): void {
    if (options.level !== undefined) this.logLevel = options.level;
    if (options.enabled !== undefined) this.enabled = options.enabled;
    if (options.consoleOutput !== undefined) this.consoleOutput = options.consoleOutput;
    if (options.persistence) {
      this.persistenceConfig = { ...this.persistenceConfig, ...options.persistence };
      if (this.persistenceConfig.enabled) {
        this.loadPersistedLogs();
      }
    }
  }

  /**
   * Enable dev mode auto-detection (Point 46)
   * Call this during app initialization to auto-enable debugging in dev mode
   */
  autoEnableForDevMode(isProduction: boolean): void {
    if (!isProduction) {
      this.configure({
        level: 'debug',
        consoleOutput: true,
        persistence: { enabled: true },
      });
      this.log('info', 'init', '🔧 Smart Grid Logger auto-enabled for development mode');
    }
  }

  /**
   * Start a new layout session
   */
  startSession(context: { columns: number; containerWidth: number; sectionCount: number }): void {
    if (!this.enabled) return;

    this.logs = [];
    this.currentMetrics = {
      columns: context.columns,
      containerWidth: context.containerWidth,
      totalSections: context.sectionCount,
      placementDecisions: [],
      phases: [],
    };
    this.phaseTimers.clear();
    this.startTime = performance.now();

    this.log('info', 'init', '═══════════════════════════════════════════════════════════');
    this.log('info', 'init', `SMART GRID LAYOUT SESSION STARTED`);
    this.log('info', 'init', `Columns: ${context.columns} | Width: ${context.containerWidth}px | Sections: ${context.sectionCount}`);
    this.log('info', 'init', '═══════════════════════════════════════════════════════════');
  }

  /**
   * Start a phase timer
   */
  startPhase(phase: LayoutPhase): void {
    if (!this.enabled) return;
    this.phaseTimers.set(phase, performance.now());
    this.log('debug', phase, `${this.phaseEmojis[phase]} Starting phase: ${phase.toUpperCase()}`);
  }

  /**
   * End a phase timer
   */
  endPhase(phase: LayoutPhase, summary?: string): void {
    if (!this.enabled) return;

    const startTime = this.phaseTimers.get(phase);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.currentMetrics.phases?.push({ phase, duration });
      this.log('debug', phase, `${this.phaseEmojis[phase]} Phase ${phase.toUpperCase()} completed in ${duration.toFixed(2)}ms${summary ? ` - ${summary}` : ''}`);
    }
  }

  /**
   * Log a placement decision
   */
  logPlacement(decision: PlacementDecision): void {
    if (!this.enabled) return;

    this.currentMetrics.placementDecisions?.push(decision);

    const colSpanNote = decision.requestedColSpan !== decision.actualColSpan
      ? ` (requested ${decision.requestedColSpan}, got ${decision.actualColSpan})`
      : '';

    this.log('debug', 'place',
      `📍 Placed "${decision.title}" [${decision.sectionType}] at col ${decision.column}, row ${decision.row}${colSpanNote}`,
      { reason: decision.reason, alternatives: decision.alternatives }
    );
  }

  /**
   * Log gap analysis
   */
  logGapAnalysis(analysis: GapAnalysis): void {
    if (!this.enabled) return;

    this.currentMetrics.gapAnalysis = analysis;

    if (analysis.totalGaps > 0) {
      this.log('warn', 'gap-fill',
        `🕳️ Found ${analysis.totalGaps} gaps (${analysis.gapArea}px² unused, ${analysis.utilizationPercent.toFixed(1)}% utilized)`,
        { gaps: analysis.gaps }
      );
    } else {
      this.log('info', 'gap-fill', `✨ Perfect fill! ${analysis.utilizationPercent.toFixed(1)}% space utilized`);
    }
  }

  /**
   * Log column balance analysis
   */
  logColumnBalance(analysis: ColumnAnalysis): void {
    if (!this.enabled) return;

    this.currentMetrics.columnAnalysis = analysis;

    const balanceLevel = analysis.balanceScore > 90 ? '🟢' : analysis.balanceScore > 70 ? '🟡' : '🔴';

    this.log('info', 'balance',
      `${balanceLevel} Column balance: ${analysis.balanceScore.toFixed(1)}% | Heights: [${analysis.heights.map(h => h.toFixed(0)).join(', ')}]px`,
      { variance: analysis.variance, maxDiff: analysis.maxDiff }
    );
  }

  /**
   * Log section sorting order
   */
  logSortOrder(sections: Array<{ title: string; type: string; priority: number; colSpan: number }>): void {
    if (!this.enabled) return;

    this.log('debug', 'sort', '📊 Section order after sorting:');
    sections.forEach((s, i) => {
      this.log('debug', 'sort', `  ${i + 1}. "${s.title}" [${s.type}] - priority: ${s.priority}, span: ${s.colSpan}`);
    });
  }

  /**
   * Log a row being built
   */
  logRowBuilt(rowIndex: number, sections: Array<{ title: string; colSpan: number }>, remainingCapacity: number): void {
    if (!this.enabled) return;

    const rowContents = sections.map(s => `${s.title}(${s.colSpan})`).join(' + ');
    const status = remainingCapacity === 0 ? '✅ Full' : `⚠️ ${remainingCapacity} col(s) unused`;

    this.log('debug', 'pack', `Row ${rowIndex}: [${rowContents}] ${status}`);
  }

  /**
   * Log reflow results
   */
  logReflow(before: { height: number }, after: { height: number }, changes: number): void {
    if (!this.enabled) return;

    const diff = after.height - before.height;
    const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;

    this.log('info', 'reflow',
      `🔄 Reflow: ${changes} sections adjusted | Height: ${before.height}px → ${after.height}px (${diffStr}px)`
    );
  }

  /**
   * End the layout session and return metrics
   */
  endSession(): LayoutMetrics | null {
    if (!this.enabled) return null;

    const totalDuration = performance.now() - this.startTime;
    this.currentMetrics.totalDuration = totalDuration;

    this.log('info', 'complete', '═══════════════════════════════════════════════════════════');
    this.log('info', 'complete', `LAYOUT COMPLETE in ${totalDuration.toFixed(2)}ms`);

    // Phase breakdown
    if (this.currentMetrics.phases && this.currentMetrics.phases.length > 0) {
      this.log('info', 'complete', 'Phase breakdown:');
      this.currentMetrics.phases.forEach(p => {
        const pct = ((p.duration / totalDuration) * 100).toFixed(1);
        this.log('info', 'complete', `  ${this.phaseEmojis[p.phase]} ${p.phase}: ${p.duration.toFixed(2)}ms (${pct}%)`);
      });
    }

    // Summary stats
    const placements = this.currentMetrics.placementDecisions?.length ?? 0;
    const balance = this.currentMetrics.columnAnalysis?.balanceScore ?? 0;
    const utilization = this.currentMetrics.gapAnalysis?.utilizationPercent ?? 0;

    this.log('info', 'complete', `Summary: ${placements} placements | ${balance.toFixed(0)}% balanced | ${utilization.toFixed(0)}% utilized`);
    this.log('info', 'complete', '═══════════════════════════════════════════════════════════');

    return this.currentMetrics as LayoutMetrics;
  }

  /**
   * Get all logs
   */
  getLogs(): GridLayoutLogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
    this.currentMetrics = {};
  }

  /**
   * Export logs as formatted string
   */
  export(): string {
    return this.logs.map(entry => {
      const time = new Date(entry.timestamp).toISOString();
      const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
      return `[${time}] [${entry.phase.toUpperCase()}] ${entry.message}${dataStr}`;
    }).join('\n');
  }

  // ==========================================================================
  // LOG PERSISTENCE (Point 47)
  // ==========================================================================

  /**
   * Save logs to localStorage with rotation
   */
  private persistLogs(): void {
    if (!this.persistenceConfig.enabled || typeof localStorage === 'undefined') {
      return;
    }

    try {
      // Rotate if needed
      if (this.structuredLogs.length > this.persistenceConfig.maxEntries) {
        this.structuredLogs = this.structuredLogs.slice(-this.persistenceConfig.rotationThreshold);
      }

      localStorage.setItem(
        this.persistenceConfig.storageKey,
        JSON.stringify(this.structuredLogs)
      );
    } catch (e) {
      // Storage full or other error - clear old logs
      try {
        this.structuredLogs = this.structuredLogs.slice(-100);
        localStorage.setItem(
          this.persistenceConfig.storageKey,
          JSON.stringify(this.structuredLogs)
        );
      } catch {
        // Give up on persistence
        console.warn('[SmartGridLogger] Failed to persist logs');
      }
    }
  }

  /**
   * Load persisted logs from localStorage
   */
  private loadPersistedLogs(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.persistenceConfig.storageKey);
      if (stored) {
        this.structuredLogs = JSON.parse(stored);
      }
    } catch {
      // Invalid data - ignore
    }
  }

  /**
   * Export logs to downloadable file
   */
  exportToFile(): void {
    if (typeof document === 'undefined') return;

    const data = JSON.stringify(this.structuredLogs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `grid-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Get structured logs for E2E testing (Point 50)
   */
  getStructuredLogs(): StructuredLogEntry[] {
    return [...this.structuredLogs];
  }

  /**
   * Clear persisted logs
   */
  clearPersistedLogs(): void {
    this.structuredLogs = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.persistenceConfig.storageKey);
    }
  }

  // ==========================================================================
  // COUNTERFACTUAL LOGGING (Point 48)
  // ==========================================================================

  /**
   * Log counterfactual placements - what would have happened with different choices
   */
  logCounterfactual(
    sectionKey: string,
    chosenPlacement: { column: number; top: number; score: number },
    alternatives: CounterfactualPlacement[]
  ): void {
    if (!this.enabled) return;

    this.log('debug', 'place',
      `🔮 Counterfactual for "${sectionKey}": Chose col ${chosenPlacement.column} (score: ${chosenPlacement.score.toFixed(1)})`,
      { chosen: chosenPlacement, alternatives }
    );

    // Log top alternatives
    const topAlternatives = alternatives
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    for (const alt of topAlternatives) {
      const diff = chosenPlacement.score - alt.score;
      this.log('debug', 'place',
        `  ↳ Alternative: col ${alt.column} (score: ${alt.score.toFixed(1)}, ${diff > 0 ? '+' : ''}${diff.toFixed(1)} diff) - ${alt.reason}`
      );
    }
  }

  /**
   * Log algorithm comparison (counterfactual at algorithm level)
   */
  logAlgorithmComparison(results: Array<{
    algorithm: string;
    utilization: number;
    gaps: number;
    time: number;
  }>): void {
    if (!this.enabled) return;

    this.log('info', 'complete', '📊 Algorithm Comparison:');

    for (const result of results) {
      const stars = '★'.repeat(Math.round(result.utilization / 20)) + '☆'.repeat(5 - Math.round(result.utilization / 20));
      this.log('info', 'complete',
        `  ${result.algorithm}: ${stars} ${result.utilization.toFixed(1)}% | ${result.gaps} gaps | ${result.time.toFixed(1)}ms`
      );
    }
  }

  // ==========================================================================
  // ASCII ART VISUALIZATION (Point 49)
  // ==========================================================================

  /**
   * Generate ASCII art representation of the grid layout
   */
  generateAsciiGrid(
    sections: Array<{
      key: string;
      column: number;
      colSpan: number;
      top: number;
      height: number;
    }>,
    columns: number,
    containerHeight: number
  ): string {
    // Scale to reasonable size
    const charWidth = columns * 10; // 10 chars per column
    const charHeight = Math.min(30, Math.ceil(containerHeight / 20)); // Max 30 rows
    const scale = containerHeight / charHeight;

    // Initialize grid with dots
    const grid: string[][] = Array.from({ length: charHeight }, () =>
      Array(charWidth).fill('·')
    );

    // Character mapping for section types
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    // Place sections
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (!section) continue;

      const charIndex = i % chars.length;
      const char = chars[charIndex] ?? 'X';
      const startCol = section.column * 10;
      const endCol = startCol + (section.colSpan * 10) - 1;
      const startRow = Math.floor(section.top / scale);
      const endRow = Math.min(charHeight - 1, Math.floor((section.top + section.height) / scale));

      // Draw section box
      for (let row = startRow; row <= endRow; row++) {
        const gridRow = grid[row];
        if (!gridRow) continue;

        for (let col = startCol; col <= endCol && col < charWidth; col++) {
          let cellChar: string;
          if (row === startRow || row === endRow) {
            // Top/bottom border
            cellChar = col === startCol || col === endCol ? '+' : '-';
          } else if (col === startCol || col === endCol) {
            // Side border
            cellChar = '|';
          } else if (row === startRow + 1) {
            // Section identifier row
            const keyChar = section.key.length > 0 ? (section.key[0] ?? ' ') : ' ';
            cellChar = col === startCol + 1 ? char : (col === startCol + 2 && section.key.length > 0) ? keyChar : ' ';
          } else {
            // Inner fill
            cellChar = ' ';
          }
          gridRow[col] = cellChar;
        }
      }
    }

    // Build output string
    const header = '┌' + '─'.repeat(charWidth) + '┐';
    const footer = '└' + '─'.repeat(charWidth) + '┘';
    const columnHeader = Array.from({ length: columns }, (_, i) =>
      `Col ${i}`.padStart(10)
    ).join('');

    const lines = [
      '📐 GRID LAYOUT VISUALIZATION',
      columnHeader,
      header,
      ...grid.map(row => '│' + row.join('') + '│'),
      footer,
      '',
      '📝 Legend:',
      ...sections.slice(0, 10).map((s, i) => `  ${chars[i]}: ${s.key}`),
      sections.length > 10 ? `  ... and ${sections.length - 10} more` : '',
    ];

    return lines.join('\n');
  }

  /**
   * Print ASCII grid to console
   */
  printAsciiGrid(
    sections: Array<{
      key: string;
      column: number;
      colSpan: number;
      top: number;
      height: number;
    }>,
    columns: number,
    containerHeight: number
  ): void {
    if (!this.enabled || !this.consoleOutput) return;

    const ascii = this.generateAsciiGrid(sections, columns, containerHeight);
    console.log('%c' + ascii, 'font-family: monospace; white-space: pre;');
  }

  /**
   * Log algorithm selection result (used by algorithm-selector)
   */
  logAlgorithmSelection?(result: {
    selectedAlgorithm: string;
    selectionReason: string;
    confidence: number;
  }): void {
    if (!this.enabled) return;

    const confidence = '▓'.repeat(Math.round(result.confidence * 10)) +
                      '░'.repeat(10 - Math.round(result.confidence * 10));

    this.log('info', 'init',
      `🎯 Algorithm selected: ${result.selectedAlgorithm} [${confidence}] - ${result.selectionReason}`
    );
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, phase: LayoutPhase, message: string, data?: Record<string, unknown>): void {
    if (!this.enabled || !this.shouldLog(level)) return;

    const timestamp = Date.now();

    const entry: GridLayoutLogEntry = {
      timestamp,
      phase,
      message,
      data,
    };

    this.logs.push(entry);

    // Create structured entry for E2E tests (Point 50)
    const structuredEntry: StructuredLogEntry = {
      id: `log-${this.logIdCounter++}`,
      timestamp,
      level,
      phase,
      message,
      data,
      metrics: {
        utilization: this.currentMetrics.gapAnalysis?.utilizationPercent,
        gapCount: this.currentMetrics.gapAnalysis?.totalGaps,
        balanceScore: this.currentMetrics.columnAnalysis?.balanceScore,
      },
    };

    this.structuredLogs.push(structuredEntry);

    // Persist if enabled (Point 47)
    if (this.persistenceConfig.enabled) {
      this.persistLogs();
    }

    if (this.consoleOutput) {
      this.printToConsole(level, phase, message, data);
    }
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'none'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  /**
   * Print to console with formatting
   */
  private printToConsole(level: LogLevel, phase: LayoutPhase, message: string, data?: Record<string, unknown>): void {
    const prefix = `[SmartGrid:${phase}]`;

    // Use appropriate console method
    switch (level) {
      case 'debug':
        console.debug(`%c${prefix}%c ${message}`, 'color: #888; font-weight: bold', 'color: inherit', data || '');
        break;
      case 'info':
        console.info(`%c${prefix}%c ${message}`, 'color: #4CAF50; font-weight: bold', 'color: inherit', data || '');
        break;
      case 'warn':
        console.warn(`%c${prefix}%c ${message}`, 'color: #FF9800; font-weight: bold', 'color: inherit', data || '');
        break;
      case 'error':
        console.error(`%c${prefix}%c ${message}`, 'color: #F44336; font-weight: bold', 'color: inherit', data || '');
        break;
    }
  }
}

// Singleton instance
export const gridLogger = new SmartGridLogger();

// Enable debug mode by default in development (Point 46)
if (typeof window !== 'undefined') {
  // Check for explicit debug flag
  if ((window as any).__SMART_GRID_DEBUG__) {
    gridLogger.configure({ level: 'debug', consoleOutput: true });
  }

  // Check for development mode via common indicators
  const isDev =
    (window as any).__DEV__ === true ||
    (window as any).ng?.isDevMode?.() === true ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isDev) {
    gridLogger.autoEnableForDevMode(false);
  }
}

// Helper function to enable debug mode from console
if (typeof window !== 'undefined') {
  (window as any).enableGridDebug = () => {
    gridLogger.configure({ level: 'debug', consoleOutput: true });
    console.log('🔧 Smart Grid debug mode enabled');
  };

  (window as any).disableGridDebug = () => {
    gridLogger.configure({ level: 'none', consoleOutput: false });
    console.log('🔕 Smart Grid debug mode disabled');
  };

  (window as any).exportGridLogs = () => {
    gridLogger.exportToFile();
    console.log('📥 Grid logs exported');
  };
}

