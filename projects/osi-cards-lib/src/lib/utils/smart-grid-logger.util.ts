/**
 * Smart Grid Logger
 * 
 * Comprehensive logging system for debugging and optimizing grid layout.
 * Logs placement decisions, gap analysis, and layout metrics.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

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
  private currentMetrics: Partial<LayoutMetrics> = {};
  private phaseTimers: Map<LayoutPhase, number> = new Map();
  private startTime = 0;
  private enabled = true;
  private consoleOutput = true;

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
  }): void {
    if (options.level !== undefined) this.logLevel = options.level;
    if (options.enabled !== undefined) this.enabled = options.enabled;
    if (options.consoleOutput !== undefined) this.consoleOutput = options.consoleOutput;
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

  /**
   * Internal log method
   */
  private log(level: LogLevel, phase: LayoutPhase, message: string, data?: Record<string, unknown>): void {
    if (!this.enabled || !this.shouldLog(level)) return;
    
    const entry: GridLayoutLogEntry = {
      timestamp: Date.now(),
      phase,
      message,
      data,
    };
    
    this.logs.push(entry);
    
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

// Enable debug mode by default in development
if (typeof window !== 'undefined' && (window as any).__SMART_GRID_DEBUG__) {
  gridLogger.configure({ level: 'debug', consoleOutput: true });
}

