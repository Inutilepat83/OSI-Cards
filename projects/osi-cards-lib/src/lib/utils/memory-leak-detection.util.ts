/**
 * Memory Leak Detection Utilities
 * Provides tools to detect and prevent memory leaks in development mode
 */

/**
 * Memory snapshot for comparison
 */
export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Memory leak warning
 */
export interface MemoryLeakWarning {
  type: 'growth' | 'listeners' | 'subscriptions' | 'dom';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  details?: Record<string, unknown>;
}

/**
 * Subscription tracker entry
 */
interface SubscriptionEntry {
  id: string;
  created: number;
  component?: string;
  stack?: string;
}

/**
 * WeakRef type fallback for older TypeScript
 */
type WeakRefLike<T> = { deref(): T | undefined };

/**
 * Event listener tracker entry
 */
interface ListenerEntry {
  element: WeakRefLike<EventTarget>;
  event: string;
  created: number;
  component?: string;
}

/**
 * Memory leak detector class
 */
export class MemoryLeakDetector {
  private enabled = false;
  private snapshots: MemorySnapshot[] = [];
  private warnings: MemoryLeakWarning[] = [];
  private subscriptions: Map<string, SubscriptionEntry> = new Map();
  private listeners: ListenerEntry[] = [];
  private monitorInterval: number | null = null;
  private growthThreshold = 10; // MB
  private snapshotInterval = 5000; // 5 seconds
  private maxSnapshots = 100;

  /**
   * Enable memory leak detection
   */
  public enable(): void {
    if (this.enabled) return;

    this.enabled = true;
    this.startMonitoring();
    this.patchEventListeners();
    console.log('[MemoryLeakDetector] Enabled - monitoring for memory leaks');
  }

  /**
   * Disable memory leak detection
   */
  public disable(): void {
    if (!this.enabled) return;

    this.enabled = false;
    this.stopMonitoring();
    this.subscriptions.clear();
    this.listeners = [];
    this.snapshots = [];
    console.log('[MemoryLeakDetector] Disabled');
  }

  /**
   * Start periodic memory monitoring
   */
  private startMonitoring(): void {
    if (this.monitorInterval !== null) return;

    this.takeSnapshot(); // Initial snapshot

    this.monitorInterval = window.setInterval(() => {
      this.takeSnapshot();
      this.analyzeSnapshots();
      this.checkSubscriptions();
      this.checkListeners();
    }, this.snapshotInterval);
  }

  /**
   * Stop periodic monitoring
   */
  private stopMonitoring(): void {
    if (this.monitorInterval !== null) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  /**
   * Take a memory snapshot
   */
  private takeSnapshot(): void {
    if (!('memory' in performance)) {
      return; // Memory API not available
    }

    const memory = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /**
   * Analyze snapshots for memory growth
   */
  private analyzeSnapshots(): void {
    if (this.snapshots.length < 10) return; // Need enough data

    const recent = this.snapshots.slice(-10);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];

    const growthMB = (newest.usedJSHeapSize - oldest.usedJSHeapSize) / 1024 / 1024;
    const timeSpanSeconds = (newest.timestamp - oldest.timestamp) / 1000;

    // Check for sustained memory growth
    if (growthMB > this.growthThreshold && timeSpanSeconds > 30) {
      const growthRate = growthMB / (timeSpanSeconds / 60); // MB per minute

      this.addWarning({
        type: 'growth',
        message: `Sustained memory growth detected: ${growthMB.toFixed(2)}MB over ${timeSpanSeconds.toFixed(0)}s`,
        severity: growthRate > 5 ? 'high' : growthRate > 2 ? 'medium' : 'low',
        timestamp: Date.now(),
        details: {
          growthMB,
          growthRate,
          timeSpanSeconds,
          currentUsageMB: newest.usedJSHeapSize / 1024 / 1024,
        },
      });
    }
  }

  /**
   * Register a subscription
   */
  public registerSubscription(id: string, component?: string): void {
    if (!this.enabled) return;

    this.subscriptions.set(id, {
      id,
      created: Date.now(),
      component,
      stack: new Error().stack,
    });
  }

  /**
   * Unregister a subscription
   */
  public unregisterSubscription(id: string): void {
    if (!this.enabled) return;

    this.subscriptions.delete(id);
  }

  /**
   * Check for leaked subscriptions
   */
  private checkSubscriptions(): void {
    const now = Date.now();
    const longLived = Array.from(this.subscriptions.values())
      .filter(sub => now - sub.created > 60000); // More than 1 minute

    if (longLived.length > 50) {
      this.addWarning({
        type: 'subscriptions',
        message: `High number of long-lived subscriptions: ${longLived.length}`,
        severity: longLived.length > 100 ? 'high' : 'medium',
        timestamp: now,
        details: {
          count: longLived.length,
          byComponent: this.groupByComponent(longLived),
        },
      });
    }
  }

  /**
   * Group subscription entries by component
   */
  private groupByComponent(entries: SubscriptionEntry[]): Record<string, number> {
    return entries.reduce((acc, entry) => {
      const component = entry.component || 'unknown';
      acc[component] = (acc[component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Patch addEventListener to track listeners
   */
  private patchEventListeners(): void {
    if (typeof EventTarget === 'undefined') return;

    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    const detector = this;

    // @ts-ignore - Patching native method
    EventTarget.prototype.addEventListener = function (
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) {
      if (detector.enabled) {
        const element = this;
        const elementRef: WeakRefLike<EventTarget> = (typeof (globalThis as any).WeakRef !== 'undefined')
          ? new (globalThis as any).WeakRef(element)
          : { deref: () => element };

        detector.listeners.push({
          element: elementRef,
          event: type,
          created: Date.now(),
        });
      }

      return originalAddEventListener.call(this, type, listener, options);
    };

    // @ts-ignore - Patching native method
    EventTarget.prototype.removeEventListener = function (
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ) {
      if (detector.enabled) {
        // Remove from tracking (simplified - in real implementation would match exact listener)
        const index = detector.listeners.findIndex(
          l => l.element.deref() === this && l.event === type
        );
        if (index !== -1) {
          detector.listeners.splice(index, 1);
        }
      }

      return originalRemoveEventListener.call(this, type, listener, options);
    };
  }

  /**
   * Check for leaked event listeners
   */
  private checkListeners(): void {
    // Clean up listeners for garbage collected elements
    this.listeners = this.listeners.filter(l => l.element.deref() !== undefined);

    if (this.listeners.length > 500) {
      this.addWarning({
        type: 'listeners',
        message: `High number of event listeners: ${this.listeners.length}`,
        severity: this.listeners.length > 1000 ? 'high' : 'medium',
        timestamp: Date.now(),
        details: {
          count: this.listeners.length,
          byEvent: this.groupListenersByEvent(),
        },
      });
    }
  }

  /**
   * Group listeners by event type
   */
  private groupListenersByEvent(): Record<string, number> {
    return this.listeners.reduce((acc, listener) => {
      acc[listener.event] = (acc[listener.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Add a warning
   */
  private addWarning(warning: MemoryLeakWarning): void {
    this.warnings.push(warning);

    // Log warning
    const prefix = `[MemoryLeakDetector][${warning.severity.toUpperCase()}]`;
    const style = warning.severity === 'high'
      ? 'color: red; font-weight: bold;'
      : warning.severity === 'medium'
      ? 'color: orange;'
      : 'color: yellow;';

    console.warn(`%c${prefix} ${warning.message}`, style, warning.details);

    // Keep only recent warnings
    if (this.warnings.length > 100) {
      this.warnings = this.warnings.slice(-100);
    }
  }

  /**
   * Get all warnings
   */
  public getWarnings(): MemoryLeakWarning[] {
    return [...this.warnings];
  }

  /**
   * Get warnings by severity
   */
  public getWarningsBySeverity(severity: 'low' | 'medium' | 'high'): MemoryLeakWarning[] {
    return this.warnings.filter(w => w.severity === severity);
  }

  /**
   * Get current statistics
   */
  public getStatistics(): MemoryLeakStatistics {
    const latestSnapshot = this.snapshots[this.snapshots.length - 1];

    return {
      enabled: this.enabled,
      snapshotCount: this.snapshots.length,
      warningCount: this.warnings.length,
      activeSubscriptions: this.subscriptions.size,
      activeListeners: this.listeners.length,
      currentMemoryMB: latestSnapshot
        ? latestSnapshot.usedJSHeapSize / 1024 / 1024
        : null,
      warnings: {
        high: this.getWarningsBySeverity('high').length,
        medium: this.getWarningsBySeverity('medium').length,
        low: this.getWarningsBySeverity('low').length,
      },
    };
  }

  /**
   * Clear all warnings
   */
  public clearWarnings(): void {
    this.warnings = [];
  }

  /**
   * Generate detailed report
   */
  public generateReport(): string {
    const stats = this.getStatistics();
    const lines: string[] = [
      '=== Memory Leak Detection Report ===',
      '',
      `Status: ${stats.enabled ? 'ENABLED' : 'DISABLED'}`,
      `Snapshots Collected: ${stats.snapshotCount}`,
      `Active Subscriptions: ${stats.activeSubscriptions}`,
      `Active Event Listeners: ${stats.activeListeners}`,
      `Current Memory Usage: ${stats.currentMemoryMB?.toFixed(2) ?? 'N/A'} MB`,
      '',
      '=== Warnings ===',
      `High Severity: ${stats.warnings.high}`,
      `Medium Severity: ${stats.warnings.medium}`,
      `Low Severity: ${stats.warnings.low}`,
      '',
    ];

    if (this.warnings.length > 0) {
      lines.push('=== Recent Warnings ===');
      this.warnings.slice(-10).forEach(warning => {
        const time = new Date(warning.timestamp).toLocaleTimeString();
        lines.push(`[${time}] [${warning.severity}] ${warning.type}: ${warning.message}`);
      });
    }

    return lines.join('\n');
  }
}

/**
 * Memory leak statistics
 */
export interface MemoryLeakStatistics {
  enabled: boolean;
  snapshotCount: number;
  warningCount: number;
  activeSubscriptions: number;
  activeListeners: number;
  currentMemoryMB: number | null;
  warnings: {
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Global memory leak detector instance (only in development)
 */
export const globalMemoryLeakDetector = new MemoryLeakDetector();

/**
 * Initialize memory leak detection in development mode
 */
export function initMemoryLeakDetection(): void {
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return; // Only enable in development
  }

  globalMemoryLeakDetector.enable();

  // Add global methods for debugging
  if (typeof window !== 'undefined') {
    (window as any).__memoryLeakDetector = {
      getReport: () => globalMemoryLeakDetector.generateReport(),
      getStats: () => globalMemoryLeakDetector.getStatistics(),
      getWarnings: () => globalMemoryLeakDetector.getWarnings(),
      clearWarnings: () => globalMemoryLeakDetector.clearWarnings(),
    };

    console.log('[MemoryLeakDetector] Available at window.__memoryLeakDetector');
  }
}

/**
 * Decorator to track component subscriptions
 */
export function TrackSubscriptions(componentName?: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      private __subscriptionIds: Set<string> = new Set();
      private __componentName = componentName || constructor.name;

      constructor(...args: any[]) {
        super(...args);

        // Track subscriptions on destroy
        const originalNgOnDestroy = (this as any).ngOnDestroy;
        (this as any).ngOnDestroy = function () {
          // Check for leaked subscriptions
          if (this.__subscriptionIds.size > 0) {
            console.warn(
              `[MemoryLeakDetector] Component ${this.__componentName} destroyed with ${this.__subscriptionIds.size} active subscriptions`
            );
          }

          // Clean up
          this.__subscriptionIds.forEach((id: string) => {
            globalMemoryLeakDetector.unregisterSubscription(id);
          });

          if (originalNgOnDestroy) {
            originalNgOnDestroy.call(this);
          }
        };
      }
    };
  };
}

