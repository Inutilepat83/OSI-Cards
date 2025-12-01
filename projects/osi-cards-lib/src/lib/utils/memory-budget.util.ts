/**
 * Memory Budget Utility (Point 43)
 * 
 * Monitors memory usage and performs automatic cleanup when approaching limits.
 * 
 * @example
 * ```typescript
 * import { MemoryBudget, createMemoryBudget } from 'osi-cards-lib';
 * 
 * const budget = createMemoryBudget({
 *   maxHeapSize: 100 * 1024 * 1024, // 100MB
 *   warningThreshold: 0.8,
 *   criticalThreshold: 0.95
 * });
 * 
 * budget.onWarning(() => {
 *   // Clear caches
 *   layoutCache.clear();
 * });
 * 
 * budget.onCritical(() => {
 *   // Emergency cleanup
 *   destroyOffscreenCards();
 * });
 * 
 * budget.startMonitoring();
 * ```
 */

import { BehaviorSubject, Observable, interval } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

/**
 * Memory usage info
 */
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercent: number;
  timestamp: Date;
}

/**
 * Memory budget configuration
 */
export interface MemoryBudgetConfig {
  /** Maximum heap size in bytes (default: auto-detect or 256MB) */
  maxHeapSize?: number;
  /** Percentage threshold for warning (default: 0.75) */
  warningThreshold?: number;
  /** Percentage threshold for critical (default: 0.9) */
  criticalThreshold?: number;
  /** Monitoring interval in ms (default: 5000) */
  checkInterval?: number;
  /** Auto-start monitoring */
  autoStart?: boolean;
}

/**
 * Memory budget state
 */
export type MemoryState = 'normal' | 'warning' | 'critical';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<MemoryBudgetConfig> = {
  maxHeapSize: 256 * 1024 * 1024, // 256MB
  warningThreshold: 0.75,
  criticalThreshold: 0.9,
  checkInterval: 5000,
  autoStart: false,
};

/**
 * Memory budget manager
 */
export class MemoryBudget {
  private readonly config: Required<MemoryBudgetConfig>;
  private readonly state$ = new BehaviorSubject<MemoryState>('normal');
  private readonly memoryInfo$ = new BehaviorSubject<MemoryInfo | null>(null);
  private readonly stop$ = new BehaviorSubject<boolean>(false);
  
  private warningCallbacks: Array<() => void> = [];
  private criticalCallbacks: Array<() => void> = [];
  private isMonitoring = false;

  constructor(config: MemoryBudgetConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Auto-detect heap limit if available
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as unknown as { memory: { jsHeapSizeLimit: number } }).memory;
      if (memory && !config.maxHeapSize) {
        this.config.maxHeapSize = memory.jsHeapSizeLimit * 0.9; // 90% of limit
      }
    }
    
    if (this.config.autoStart) {
      this.startMonitoring();
    }
  }

  /**
   * Get current state observable
   */
  public getState$(): Observable<MemoryState> {
    return this.state$.asObservable();
  }

  /**
   * Get current state
   */
  public getState(): MemoryState {
    return this.state$.value;
  }

  /**
   * Get memory info observable
   */
  public getMemoryInfo$(): Observable<MemoryInfo | null> {
    return this.memoryInfo$.asObservable();
  }

  /**
   * Get current memory info
   */
  public getMemoryInfo(): MemoryInfo | null {
    return this.checkMemory();
  }

  /**
   * Register warning callback
   */
  public onWarning(callback: () => void): () => void {
    this.warningCallbacks.push(callback);
    return () => {
      this.warningCallbacks = this.warningCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register critical callback
   */
  public onCritical(callback: () => void): () => void {
    this.criticalCallbacks.push(callback);
    return () => {
      this.criticalCallbacks = this.criticalCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Start memory monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.stop$.next(false);
    
    interval(this.config.checkInterval)
      .pipe(
        takeUntil(this.stop$.pipe(filter(stop => stop)))
      )
      .subscribe(() => this.check());
  }

  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    this.stop$.next(true);
    this.isMonitoring = false;
  }

  /**
   * Check memory and update state
   */
  public check(): MemoryInfo | null {
    const info = this.checkMemory();
    
    if (!info) return null;
    
    this.memoryInfo$.next(info);
    
    // Determine state
    let newState: MemoryState = 'normal';
    
    if (info.usagePercent >= this.config.criticalThreshold) {
      newState = 'critical';
    } else if (info.usagePercent >= this.config.warningThreshold) {
      newState = 'warning';
    }
    
    // Handle state transitions
    const previousState = this.state$.value;
    
    if (newState !== previousState) {
      this.state$.next(newState);
      
      if (newState === 'warning') {
        this.warningCallbacks.forEach(cb => cb());
      } else if (newState === 'critical') {
        this.criticalCallbacks.forEach(cb => cb());
      }
    }
    
    return info;
  }

  /**
   * Force garbage collection (if available)
   */
  public requestGC(): boolean {
    // V8 exposes gc() when run with --expose-gc flag
    if (typeof (globalThis as { gc?: () => void }).gc === 'function') {
      (globalThis as { gc: () => void }).gc();
      return true;
    }
    return false;
  }

  /**
   * Check current memory usage
   */
  private checkMemory(): MemoryInfo | null {
    if (typeof performance === 'undefined' || !('memory' in performance)) {
      // Fallback for browsers without memory API
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: this.config.maxHeapSize,
        jsHeapSizeLimit: this.config.maxHeapSize,
        usagePercent: 0,
        timestamp: new Date(),
      };
    }
    
    const memory = (performance as unknown as { 
      memory: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      }
    }).memory;
    
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercent: memory.usedJSHeapSize / this.config.maxHeapSize,
      timestamp: new Date(),
    };
  }
}

/**
 * Create a memory budget instance
 */
export function createMemoryBudget(config?: MemoryBudgetConfig): MemoryBudget {
  return new MemoryBudget(config);
}

/**
 * Global memory budget singleton
 */
let globalBudget: MemoryBudget | null = null;

/**
 * Get global memory budget
 */
export function getGlobalMemoryBudget(): MemoryBudget {
  if (!globalBudget) {
    globalBudget = createMemoryBudget({ autoStart: true });
  }
  return globalBudget;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

