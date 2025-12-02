/**
 * Detached DOM Detection Utility (Point 20)
 *
 * Detects and warns about detached DOM nodes in development mode.
 * Helps identify memory leaks from components holding references
 * to removed DOM elements.
 *
 * @example
 * ```typescript
 * // In development mode
 * import { detectDetachedNodes, startDetachedNodeMonitor } from './detached-dom.util';
 *
 * // One-time check
 * const detached = detectDetachedNodes();
 * console.log('Detached nodes:', detached);
 *
 * // Continuous monitoring
 * const monitor = startDetachedNodeMonitor({
 *   interval: 5000,
 *   onDetect: (nodes) => console.warn('Detached nodes found:', nodes)
 * });
 *
 * // Stop monitoring
 * monitor.stop();
 * ```
 */

import { isDevMode } from '@angular/core';

// =============================================================================
// TYPES
// =============================================================================

export interface DetachedNodeInfo {
  /** Node tag name or type */
  type: string;
  /** Node ID if available */
  id?: string;
  /** Node classes */
  classes?: string[];
  /** Approximate size in memory (estimated) */
  estimatedSize?: number;
  /** Stack trace if available */
  stack?: string;
  /** Reference path if tracked */
  referencePath?: string;
}

export interface MonitorConfig {
  /** Check interval in ms */
  interval?: number;
  /** Callback when detached nodes are found */
  onDetect?: (nodes: DetachedNodeInfo[]) => void;
  /** Maximum nodes to track */
  maxTracked?: number;
  /** Whether to log to console */
  logToConsole?: boolean;
}

export interface MonitorHandle {
  /** Stop monitoring */
  stop: () => void;
  /** Get current stats */
  getStats: () => MonitorStats;
  /** Force a check */
  check: () => DetachedNodeInfo[];
}

export interface MonitorStats {
  /** Total checks performed */
  totalChecks: number;
  /** Total detached nodes found */
  totalDetached: number;
  /** Last check timestamp */
  lastCheck: number;
  /** Is currently running */
  isRunning: boolean;
}

// =============================================================================
// WEAK REFERENCE TRACKING
// =============================================================================

/** WeakRef for tracking DOM nodes without preventing GC */
const trackedNodes = new Map<number, WeakRef<Node>>();
let nodeIdCounter = 0;

/**
 * Track a DOM node for detachment detection
 */
export function trackNode(node: Node): number {
  const id = ++nodeIdCounter;
  trackedNodes.set(id, new WeakRef(node));
  return id;
}

/**
 * Untrack a DOM node
 */
export function untrackNode(id: number): void {
  trackedNodes.delete(id);
}

/**
 * Check if a tracked node is detached
 */
export function isNodeDetached(id: number): boolean {
  const ref = trackedNodes.get(id);
  if (!ref) {
    return false;
  }

  const node = ref.deref();
  if (!node) {
    // Node was garbage collected
    trackedNodes.delete(id);
    return false;
  }

  return !document.contains(node);
}

// =============================================================================
// DETECTION FUNCTIONS
// =============================================================================

/**
 * Check if a node is detached from the DOM
 */
export function isDetached(node: Node | null | undefined): boolean {
  if (!node) {
    return false;
  }
  return !document.contains(node);
}

/**
 * Get information about a node
 */
export function getNodeInfo(node: Node): DetachedNodeInfo {
  const info: DetachedNodeInfo = {
    type: node.nodeName,
  };

  if (node instanceof Element) {
    if (node.id) {
      info.id = node.id;
    }
    if (node.classList.length > 0) {
      info.classes = Array.from(node.classList);
    }
  }

  // Estimate memory size (rough approximation)
  info.estimatedSize = estimateNodeSize(node);

  return info;
}

/**
 * Estimate memory size of a node (rough approximation)
 */
function estimateNodeSize(node: Node): number {
  let size = 100; // Base size for node object

  if (node instanceof Element) {
    // Add attribute sizes
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes.item(i);
      if (attr) {
        size += attr.name.length + attr.value.length;
      }
    }

    // Add text content size
    if (node.textContent) {
      size += node.textContent.length;
    }

    // Add child sizes (shallow)
    size += node.childNodes.length * 50;
  }

  return size;
}

/**
 * Detect detached nodes from tracked references
 */
export function detectDetachedNodes(): DetachedNodeInfo[] {
  const detached: DetachedNodeInfo[] = [];

  for (const [id, ref] of trackedNodes.entries()) {
    const node = ref.deref();

    if (!node) {
      // Node was garbage collected, remove from tracking
      trackedNodes.delete(id);
      continue;
    }

    if (!document.contains(node)) {
      detached.push(getNodeInfo(node));
    }
  }

  return detached;
}

// =============================================================================
// COMPONENT TRACKING
// =============================================================================

/** Map of component instances to their root elements */
const componentElements = new WeakMap<object, Element>();

/**
 * Register a component's root element for tracking
 */
export function registerComponentElement(component: object, element: Element): void {
  componentElements.set(component, element);
}

/**
 * Check if a component's element is detached
 */
export function isComponentDetached(component: object): boolean {
  const element = componentElements.get(component);
  return element ? isDetached(element) : false;
}

// =============================================================================
// MONITORING
// =============================================================================

/**
 * Start monitoring for detached DOM nodes
 */
export function startDetachedNodeMonitor(config: MonitorConfig = {}): MonitorHandle {
  const { interval = 10000, onDetect, maxTracked = 1000, logToConsole = true } = config;

  // Only run in development mode
  if (!isDevMode()) {
    return {
      stop: () => {},
      getStats: () => ({
        totalChecks: 0,
        totalDetached: 0,
        lastCheck: 0,
        isRunning: false,
      }),
      check: () => [],
    };
  }

  let isRunning = true;
  let totalChecks = 0;
  let totalDetached = 0;
  let lastCheck = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const performCheck = (): DetachedNodeInfo[] => {
    totalChecks++;
    lastCheck = Date.now();

    const detached = detectDetachedNodes();
    totalDetached += detached.length;

    if (detached.length > 0) {
      if (logToConsole) {
        console.warn(`[DetachedDOM] Found ${detached.length} detached nodes:`, detached);
      }

      if (onDetect) {
        onDetect(detached);
      }
    }

    // Cleanup old tracking entries if exceeding max
    if (trackedNodes.size > maxTracked) {
      const entriesToRemove = trackedNodes.size - maxTracked;
      const iterator = trackedNodes.keys();

      for (let i = 0; i < entriesToRemove; i++) {
        const key = iterator.next().value;
        if (key !== undefined) {
          trackedNodes.delete(key);
        }
      }
    }

    return detached;
  };

  // Start interval
  intervalId = setInterval(performCheck, interval);

  // Initial check
  performCheck();

  return {
    stop: () => {
      isRunning = false;
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
    getStats: () => ({
      totalChecks,
      totalDetached,
      lastCheck,
      isRunning,
    }),
    check: performCheck,
  };
}

// =============================================================================
// DEVELOPMENT HELPERS
// =============================================================================

/**
 * Log detached node warnings to console
 */
export function logDetachedWarning(context: string, node: Node): void {
  if (!isDevMode()) {
    return;
  }

  const info = getNodeInfo(node);
  console.warn(`[DetachedDOM] ${context}: Node is detached from DOM`, info);
}

/**
 * Assert that a node is attached to the DOM
 */
export function assertAttached(node: Node | null, context: string): asserts node is Node {
  if (!node) {
    throw new Error(`[DetachedDOM] ${context}: Node is null`);
  }

  if (!isDevMode()) {
    return;
  }

  if (isDetached(node)) {
    logDetachedWarning(context, node);
  }
}

/**
 * Create a proxy that warns when accessing detached elements
 */
export function createDetachedProxy<T extends Element>(element: T, context: string): T {
  if (!isDevMode()) {
    return element;
  }

  return new Proxy(element, {
    get(target, prop, receiver) {
      if (isDetached(target)) {
        console.warn(
          `[DetachedDOM] ${context}: Accessing property '${String(prop)}' on detached element`
        );
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

// =============================================================================
// CLEANUP UTILITIES
// =============================================================================

/**
 * Cleanup tracking data (call on app destroy)
 */
export function cleanupTracking(): void {
  trackedNodes.clear();
}

/**
 * Get tracking statistics
 */
export function getTrackingStats(): {
  trackedCount: number;
  detachedCount: number;
} {
  let detachedCount = 0;

  for (const [id, ref] of trackedNodes.entries()) {
    const node = ref.deref();
    if (!node) {
      trackedNodes.delete(id);
    } else if (!document.contains(node)) {
      detachedCount++;
    }
  }

  return {
    trackedCount: trackedNodes.size,
    detachedCount,
  };
}
