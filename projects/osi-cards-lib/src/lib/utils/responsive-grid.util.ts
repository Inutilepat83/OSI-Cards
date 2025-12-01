/**
 * Responsive Grid Utility
 * 
 * Responsive and adaptive behavior for masonry grid layouts:
 * - Breakpoint-aware column calculation
 * - Smooth breakpoint transitions with animation
 * - Responsive span rules per breakpoint
 * - Container query support
 * - Touch-friendly gap sizing
 * - Orientation change handling
 * - High DPI adjustments
 * - Fluid typography integration
 * - Viewport-aware loading
 * - Dynamic gap scaling
 * 
 * @example
 * ```typescript
 * import { 
 *   ResponsiveGridConfig, 
 *   calculateResponsiveColumns,
 *   ResponsiveTransitionManager 
 * } from './responsive-grid.util';
 * 
 * const columns = calculateResponsiveColumns(containerWidth);
 * const gaps = calculateTouchFriendlyGaps(breakpoint, isTouchDevice);
 * ```
 */

import { CardSection } from '../models/card.model';
import { GRID_GAP } from './grid-config.util';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Breakpoint names
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Breakpoint configuration
 */
export interface BreakpointConfig {
  /** Minimum width for this breakpoint (px) */
  minWidth: number;
  /** Number of columns */
  columns: number;
  /** Gap size (px) */
  gap: number;
  /** Default column span for sections */
  defaultSpan: number;
  /** Maximum column span */
  maxSpan: number;
}

/**
 * Responsive grid configuration
 */
export interface ResponsiveGridConfig {
  breakpoints: Record<Breakpoint, BreakpointConfig>;
  /** Enable container queries instead of viewport */
  useContainerQueries: boolean;
  /** Enable smooth transitions between breakpoints */
  enableTransitions: boolean;
  /** Transition duration (ms) */
  transitionDuration: number;
  /** Touch device detection */
  isTouchDevice: boolean;
  /** High DPI scaling factor */
  dpiScale: number;
}

/**
 * Default breakpoint configurations
 */
export const DEFAULT_BREAKPOINTS: Record<Breakpoint, BreakpointConfig> = {
  'xs': { minWidth: 0, columns: 1, gap: 8, defaultSpan: 1, maxSpan: 1 },
  'sm': { minWidth: 576, columns: 2, gap: 10, defaultSpan: 1, maxSpan: 2 },
  'md': { minWidth: 768, columns: 3, gap: 12, defaultSpan: 1, maxSpan: 3 },
  'lg': { minWidth: 992, columns: 4, gap: 12, defaultSpan: 1, maxSpan: 4 },
  'xl': { minWidth: 1200, columns: 4, gap: 16, defaultSpan: 1, maxSpan: 4 },
  '2xl': { minWidth: 1400, columns: 4, gap: 16, defaultSpan: 1, maxSpan: 4 },
};

/**
 * Default responsive configuration
 */
export const DEFAULT_RESPONSIVE_CONFIG: ResponsiveGridConfig = {
  breakpoints: DEFAULT_BREAKPOINTS,
  useContainerQueries: false,
  enableTransitions: true,
  transitionDuration: 300,
  isTouchDevice: false,
  dpiScale: 1,
};

/**
 * Responsive span rule
 */
export interface ResponsiveSpanRule {
  /** Section type(s) this rule applies to */
  types?: string[];
  /** Span at each breakpoint */
  spans: Partial<Record<Breakpoint, number>>;
  /** Minimum span across all breakpoints */
  minSpan?: number;
  /** Maximum span across all breakpoints */
  maxSpan?: number;
}

/**
 * Container query state
 */
export interface ContainerQueryState {
  width: number;
  height: number;
  inlineSize: number;
  blockSize: number;
  aspectRatio: number;
}

/**
 * Orientation change event
 */
export interface OrientationChange {
  previous: 'portrait' | 'landscape';
  current: 'portrait' | 'landscape';
  width: number;
  height: number;
}

/**
 * Transition state for smooth breakpoint changes
 */
export interface BreakpointTransitionState {
  from: Breakpoint;
  to: Breakpoint;
  progress: number;  // 0 to 1
  startTime: number;
}

// ============================================================================
// BREAKPOINT DETECTION (Item 51)
// ============================================================================

/**
 * Determines the current breakpoint based on width
 */
export function getBreakpoint(
  width: number,
  config: ResponsiveGridConfig = DEFAULT_RESPONSIVE_CONFIG
): Breakpoint {
  const breakpoints = config.breakpoints;
  
  // Sort breakpoints by minWidth descending
  const sorted: [Breakpoint, BreakpointConfig][] = [
    ['2xl', breakpoints['2xl']],
    ['xl', breakpoints['xl']],
    ['lg', breakpoints['lg']],
    ['md', breakpoints['md']],
    ['sm', breakpoints['sm']],
    ['xs', breakpoints['xs']],
  ];
  
  for (const [name, config] of sorted) {
    if (width >= config.minWidth) {
      return name;
    }
  }
  
  return 'xs';
}

/**
 * Calculates responsive column count
 */
export function calculateResponsiveColumns(
  width: number,
  config: ResponsiveGridConfig = DEFAULT_RESPONSIVE_CONFIG
): number {
  const breakpoint = getBreakpoint(width, config);
  return config.breakpoints[breakpoint].columns;
}

/**
 * Gets breakpoint configuration
 */
export function getBreakpointConfig(
  width: number,
  config: ResponsiveGridConfig = DEFAULT_RESPONSIVE_CONFIG
): BreakpointConfig {
  const breakpoint = getBreakpoint(width, config);
  return config.breakpoints[breakpoint];
}

/**
 * Calculates fluid column count based on content
 */
export function calculateFluidColumns(
  containerWidth: number,
  minColumnWidth: number = 280,
  maxColumns: number = 4
): number {
  const idealColumns = Math.floor(containerWidth / minColumnWidth);
  return Math.min(Math.max(1, idealColumns), maxColumns);
}

// ============================================================================
// SMOOTH BREAKPOINT TRANSITIONS (Item 52)
// ============================================================================

/**
 * Manages smooth transitions between breakpoints
 */
export class ResponsiveTransitionManager {
  private currentBreakpoint: Breakpoint;
  private transitionState: BreakpointTransitionState | null = null;
  private animationFrame: number | null = null;
  private readonly config: ResponsiveGridConfig;
  private callbacks: Array<(state: BreakpointTransitionState) => void> = [];

  constructor(
    initialWidth: number,
    config: ResponsiveGridConfig = DEFAULT_RESPONSIVE_CONFIG
  ) {
    this.config = config;
    this.currentBreakpoint = getBreakpoint(initialWidth, config);
  }

  /**
   * Updates width and potentially starts transition
   */
  updateWidth(newWidth: number): void {
    const newBreakpoint = getBreakpoint(newWidth, this.config);
    
    if (newBreakpoint !== this.currentBreakpoint) {
      this.startTransition(this.currentBreakpoint, newBreakpoint);
    }
  }

  /**
   * Starts a transition between breakpoints
   */
  private startTransition(from: Breakpoint, to: Breakpoint): void {
    if (!this.config.enableTransitions) {
      this.currentBreakpoint = to;
      return;
    }

    this.transitionState = {
      from,
      to,
      progress: 0,
      startTime: performance.now(),
    };

    this.animate();
  }

  /**
   * Animates the transition
   */
  private animate(): void {
    if (!this.transitionState) return;

    const elapsed = performance.now() - this.transitionState.startTime;
    const progress = Math.min(1, elapsed / this.config.transitionDuration);
    
    this.transitionState.progress = this.easeOutCubic(progress);

    // Notify callbacks
    for (const callback of this.callbacks) {
      callback(this.transitionState);
    }

    if (progress < 1) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
    } else {
      this.currentBreakpoint = this.transitionState.to;
      this.transitionState = null;
    }
  }

  /**
   * Easing function for smooth transitions
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Subscribes to transition updates
   */
  onTransition(callback: (state: BreakpointTransitionState) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Gets interpolated config during transition
   */
  getInterpolatedConfig(): BreakpointConfig {
    if (!this.transitionState) {
      return this.config.breakpoints[this.currentBreakpoint];
    }

    const from = this.config.breakpoints[this.transitionState.from];
    const to = this.config.breakpoints[this.transitionState.to];
    const t = this.transitionState.progress;

    return {
      minWidth: Math.round(from.minWidth + (to.minWidth - from.minWidth) * t),
      columns: t > 0.5 ? to.columns : from.columns,  // Columns switch at midpoint
      gap: Math.round(from.gap + (to.gap - from.gap) * t),
      defaultSpan: t > 0.5 ? to.defaultSpan : from.defaultSpan,
      maxSpan: t > 0.5 ? to.maxSpan : from.maxSpan,
    };
  }

  /**
   * Gets current breakpoint
   */
  getCurrentBreakpoint(): Breakpoint {
    return this.currentBreakpoint;
  }

  /**
   * Gets transition progress (0-1 or null if not transitioning)
   */
  getTransitionProgress(): number | null {
    return this.transitionState?.progress ?? null;
  }

  /**
   * Cleans up resources
   */
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.callbacks = [];
  }
}

// ============================================================================
// RESPONSIVE SPAN RULES (Item 53)
// ============================================================================

/**
 * Default responsive span rules for section types
 */
export const DEFAULT_SPAN_RULES: ResponsiveSpanRule[] = [
  {
    types: ['overview', 'hero'],
    spans: { xs: 1, sm: 2, md: 3, lg: 4, xl: 4, '2xl': 4 },
    minSpan: 1,
    maxSpan: 4,
  },
  {
    types: ['chart', 'map', 'analytics'],
    spans: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2, '2xl': 2 },
    minSpan: 1,
    maxSpan: 2,
  },
  {
    types: ['contact-card', 'network-card', 'info'],
    spans: { xs: 1, sm: 1, md: 1, lg: 1, xl: 1, '2xl': 1 },
    minSpan: 1,
    maxSpan: 2,
  },
  {
    types: ['list', 'timeline'],
    spans: { xs: 1, sm: 1, md: 2, lg: 2, xl: 2, '2xl': 2 },
    minSpan: 1,
    maxSpan: 2,
  },
];

/**
 * Applies responsive span rules to a section
 */
export function applyResponsiveSpan(
  section: CardSection,
  breakpoint: Breakpoint,
  rules: ResponsiveSpanRule[] = DEFAULT_SPAN_RULES,
  columns: number = 4
): number {
  const sectionType = section.type?.toLowerCase() ?? 'default';
  
  // Find matching rule
  const rule = rules.find(r => 
    !r.types || r.types.includes(sectionType)
  );
  
  if (!rule) {
    return Math.min(section.colSpan ?? 1, columns);
  }
  
  // Get span for breakpoint, falling back to section default
  let span = rule.spans[breakpoint] ?? section.colSpan ?? 1;
  
  // Apply min/max constraints
  if (rule.minSpan !== undefined) {
    span = Math.max(span, rule.minSpan);
  }
  if (rule.maxSpan !== undefined) {
    span = Math.min(span, rule.maxSpan);
  }
  
  // Don't exceed columns
  return Math.min(span, columns);
}

/**
 * Applies responsive spans to all sections
 */
export function applyResponsiveSpans(
  sections: CardSection[],
  breakpoint: Breakpoint,
  rules: ResponsiveSpanRule[] = DEFAULT_SPAN_RULES,
  columns: number = 4
): CardSection[] {
  return sections.map(section => ({
    ...section,
    colSpan: applyResponsiveSpan(section, breakpoint, rules, columns),
  }));
}

// ============================================================================
// CONTAINER QUERY SUPPORT (Item 54)
// ============================================================================

/**
 * Container query observer for CSS container queries
 */
export class ContainerQueryObserver {
  private observer: ResizeObserver | null = null;
  private element: HTMLElement | null = null;
  private callback: ((state: ContainerQueryState) => void) | null = null;
  private lastState: ContainerQueryState | null = null;

  /**
   * Starts observing an element
   */
  observe(
    element: HTMLElement,
    callback: (state: ContainerQueryState) => void
  ): void {
    this.element = element;
    this.callback = callback;

    if (typeof ResizeObserver === 'undefined') {
      console.warn('ResizeObserver not supported, falling back to window resize');
      window.addEventListener('resize', this.handleWindowResize);
      return;
    }

    this.observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const state = this.getContainerState(entry);
        if (this.hasStateChanged(state)) {
          this.lastState = state;
          callback(state);
        }
      }
    });

    this.observer.observe(element);
  }

  /**
   * Gets container state from ResizeObserver entry
   */
  private getContainerState(entry: ResizeObserverEntry): ContainerQueryState {
    const borderBox = entry.borderBoxSize?.[0];
    
    return {
      width: entry.contentRect.width,
      height: entry.contentRect.height,
      inlineSize: borderBox?.inlineSize ?? entry.contentRect.width,
      blockSize: borderBox?.blockSize ?? entry.contentRect.height,
      aspectRatio: entry.contentRect.width / entry.contentRect.height,
    };
  }

  /**
   * Checks if state has meaningfully changed
   */
  private hasStateChanged(state: ContainerQueryState): boolean {
    if (!this.lastState) return true;
    
    // Only update if width changed by more than 1px
    return Math.abs(state.width - this.lastState.width) > 1;
  }

  /**
   * Handles window resize fallback
   */
  private handleWindowResize = (): void => {
    if (!this.element || !this.callback) return;
    
    const rect = this.element.getBoundingClientRect();
    const state: ContainerQueryState = {
      width: rect.width,
      height: rect.height,
      inlineSize: rect.width,
      blockSize: rect.height,
      aspectRatio: rect.width / rect.height,
    };
    
    if (this.hasStateChanged(state)) {
      this.lastState = state;
      this.callback(state);
    }
  };

  /**
   * Gets current state
   */
  getState(): ContainerQueryState | null {
    return this.lastState;
  }

  /**
   * Stops observing
   */
  disconnect(): void {
    this.observer?.disconnect();
    window.removeEventListener('resize', this.handleWindowResize);
    this.element = null;
    this.callback = null;
  }
}

/**
 * Generates container query CSS
 */
export function generateContainerQueryCSS(
  containerName: string,
  breakpoints: Record<Breakpoint, BreakpointConfig>
): string {
  const rules: string[] = [];
  
  for (const [name, config] of Object.entries(breakpoints)) {
    if (config.minWidth === 0) continue;
    
    rules.push(`
      @container ${containerName} (min-width: ${config.minWidth}px) {
        .grid-container {
          --grid-columns: ${config.columns};
          --grid-gap: ${config.gap}px;
        }
      }
    `);
  }
  
  return rules.join('\n');
}

// ============================================================================
// TOUCH-FRIENDLY GAP SIZING (Item 55)
// ============================================================================

/**
 * Calculates touch-friendly gaps based on device and breakpoint
 */
export function calculateTouchFriendlyGaps(
  breakpoint: Breakpoint,
  isTouchDevice: boolean,
  baseConfig: ResponsiveGridConfig = DEFAULT_RESPONSIVE_CONFIG
): { gap: number; padding: number } {
  const config = baseConfig.breakpoints[breakpoint];
  let gap = config.gap;
  let padding = 16;

  if (isTouchDevice) {
    // Increase gaps for touch targets
    gap = Math.max(gap, 12);  // Minimum 12px for touch
    
    // On mobile, use larger padding
    if (breakpoint === 'xs' || breakpoint === 'sm') {
      gap = Math.max(gap, 16);
      padding = 20;
    }
  }

  return { gap, padding };
}

/**
 * Gets minimum touch target size
 */
export function getMinTouchTargetSize(dpi: number = 1): number {
  // 44px is Apple's recommended minimum
  // 48px is Material Design's recommendation
  return Math.round(48 * dpi);
}

// ============================================================================
// ORIENTATION CHANGE HANDLING (Item 56)
// ============================================================================

/**
 * Handles orientation changes
 */
export class OrientationHandler {
  private orientation: 'portrait' | 'landscape';
  private callbacks: Array<(change: OrientationChange) => void> = [];
  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    this.orientation = this.getCurrentOrientation();
    this.setupListener();
  }

  /**
   * Gets current orientation
   */
  private getCurrentOrientation(): 'portrait' | 'landscape' {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }

  /**
   * Sets up orientation change listener
   */
  private setupListener(): void {
    if (typeof window === 'undefined') return;

    // Use media query for better performance
    this.mediaQuery = window.matchMedia('(orientation: portrait)');
    
    const handler = (e: MediaQueryListEvent | MediaQueryList): void => {
      const newOrientation = e.matches ? 'portrait' : 'landscape';
      
      if (newOrientation !== this.orientation) {
        const change: OrientationChange = {
          previous: this.orientation,
          current: newOrientation,
          width: window.innerWidth,
          height: window.innerHeight,
        };
        
        this.orientation = newOrientation;
        
        for (const callback of this.callbacks) {
          callback(change);
        }
      }
    };

    // Support both old and new API
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', handler);
    } else {
      this.mediaQuery.addListener(handler);
    }
  }

  /**
   * Subscribes to orientation changes
   */
  onChange(callback: (change: OrientationChange) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Gets current orientation
   */
  getOrientation(): 'portrait' | 'landscape' {
    return this.orientation;
  }
}

// ============================================================================
// HIGH DPI ADJUSTMENTS (Item 57)
// ============================================================================

/**
 * Gets device pixel ratio for high DPI adjustments
 */
export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

/**
 * Adjusts values for high DPI displays
 */
export function adjustForHighDPI<T extends number | { [key: string]: number }>(
  value: T,
  dpi: number = getDevicePixelRatio()
): T {
  if (typeof value === 'number') {
    return Math.round(value * dpi) as T;
  }
  
  const result: { [key: string]: number } = {};
  for (const [key, val] of Object.entries(value)) {
    result[key] = Math.round(val * dpi);
  }
  return result as T;
}

/**
 * Gets DPI-aware breakpoint configuration
 */
export function getDPIAwareBreakpoints(
  baseBreakpoints: Record<Breakpoint, BreakpointConfig> = DEFAULT_BREAKPOINTS,
  dpi: number = getDevicePixelRatio()
): Record<Breakpoint, BreakpointConfig> {
  if (dpi <= 1) return baseBreakpoints;
  
  const adjusted: Record<Breakpoint, BreakpointConfig> = {} as Record<Breakpoint, BreakpointConfig>;
  
  for (const [name, config] of Object.entries(baseBreakpoints) as [Breakpoint, BreakpointConfig][]) {
    adjusted[name] = {
      ...config,
      // Don't adjust minWidth - it's in CSS pixels
      // Adjust gap for visual consistency on high DPI
      gap: Math.round(config.gap * Math.min(dpi, 1.5)),  // Cap at 1.5x
    };
  }
  
  return adjusted;
}

// ============================================================================
// FLUID TYPOGRAPHY INTEGRATION (Item 58)
// ============================================================================

/**
 * Calculates fluid font size using clamp
 */
export function calculateFluidFontSize(
  minSize: number,
  maxSize: number,
  minViewport: number = 320,
  maxViewport: number = 1200
): string {
  // Calculate preferred value using CSS clamp
  const slope = (maxSize - minSize) / (maxViewport - minViewport);
  const intercept = minSize - slope * minViewport;
  
  return `clamp(${minSize}px, ${intercept.toFixed(2)}px + ${(slope * 100).toFixed(2)}vw, ${maxSize}px)`;
}

/**
 * Gets fluid typography scale for grid sections
 */
export function getFluidTypographyScale(breakpoint: Breakpoint): {
  heading: string;
  body: string;
  small: string;
} {
  const scales: Record<Breakpoint, { heading: number[]; body: number[]; small: number[] }> = {
    'xs': { heading: [16, 20], body: [14, 16], small: [12, 14] },
    'sm': { heading: [18, 24], body: [14, 16], small: [12, 14] },
    'md': { heading: [20, 28], body: [14, 16], small: [12, 14] },
    'lg': { heading: [24, 32], body: [16, 18], small: [13, 14] },
    'xl': { heading: [28, 36], body: [16, 18], small: [14, 15] },
    '2xl': { heading: [32, 40], body: [16, 18], small: [14, 16] },
  };
  
  const scale = scales[breakpoint];
  
  return {
    heading: calculateFluidFontSize(scale.heading[0]!, scale.heading[1]!),
    body: calculateFluidFontSize(scale.body[0]!, scale.body[1]!),
    small: calculateFluidFontSize(scale.small[0]!, scale.small[1]!),
  };
}

// ============================================================================
// VIEWPORT-AWARE LOADING (Item 59)
// ============================================================================

/**
 * Determines which sections are visible in viewport
 */
export function getSectionsInViewport(
  placements: Array<{ key: string; y: number; height: number }>,
  scrollTop: number,
  viewportHeight: number,
  overscan: number = 100
): Set<string> {
  const visible = new Set<string>();
  const visibleTop = scrollTop - overscan;
  const visibleBottom = scrollTop + viewportHeight + overscan;
  
  for (const placement of placements) {
    const top = placement.y;
    const bottom = placement.y + placement.height;
    
    // Check if section intersects visible area
    if (bottom >= visibleTop && top <= visibleBottom) {
      visible.add(placement.key);
    }
  }
  
  return visible;
}

/**
 * Creates virtualized section loading strategy
 */
export function createVirtualizedStrategy(
  placements: Array<{ key: string; y: number; height: number }>,
  viewportHeight: number,
  options?: {
    overscanCount?: number;
    minLoadCount?: number;
  }
): {
  getVisibleRange: (scrollTop: number) => { start: number; end: number };
  shouldLoad: (key: string, scrollTop: number) => boolean;
} {
  const overscan = (options?.overscanCount ?? 5) * 200;  // Assume 200px avg height
  const minLoad = options?.minLoadCount ?? 10;
  
  // Sort by y position
  const sorted = [...placements].sort((a, b) => a.y - b.y);
  
  return {
    getVisibleRange: (scrollTop: number) => {
      const visibleTop = scrollTop - overscan;
      const visibleBottom = scrollTop + viewportHeight + overscan;
      
      let start = 0;
      let end = sorted.length;
      
      // Binary search for start
      let lo = 0, hi = sorted.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        const placement = sorted[mid];
        if (placement && placement.y + placement.height < visibleTop) {
          lo = mid + 1;
        } else {
          hi = mid;
        }
      }
      start = lo;
      
      // Binary search for end
      lo = start;
      hi = sorted.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        const placement = sorted[mid];
        if (placement && placement.y > visibleBottom) {
          hi = mid;
        } else {
          lo = mid + 1;
        }
      }
      end = Math.max(lo, start + minLoad);
      
      return { start, end: Math.min(end, sorted.length) };
    },
    
    shouldLoad: (key: string, scrollTop: number) => {
      const placement = placements.find(p => p.key === key);
      if (!placement) return false;
      
      const visibleTop = scrollTop - overscan;
      const visibleBottom = scrollTop + viewportHeight + overscan;
      
      return placement.y + placement.height >= visibleTop && 
             placement.y <= visibleBottom;
    },
  };
}

// ============================================================================
// DYNAMIC GAP SCALING (Item 60)
// ============================================================================

/**
 * Calculates dynamic gap based on content density and breakpoint
 */
export function calculateDynamicGap(
  breakpoint: Breakpoint,
  contentDensity: 'compact' | 'normal' | 'spacious' = 'normal',
  sectionCount: number = 10
): number {
  const baseGap = DEFAULT_BREAKPOINTS[breakpoint].gap;
  
  // Density modifiers
  const densityModifiers: Record<string, number> = {
    'compact': 0.75,
    'normal': 1,
    'spacious': 1.5,
  };
  
  let gap = baseGap * (densityModifiers[contentDensity] ?? 1);
  
  // Reduce gap slightly for many sections
  if (sectionCount > 20) {
    gap *= 0.9;
  }
  
  // Ensure minimum gap
  return Math.max(4, Math.round(gap));
}

/**
 * Generates CSS custom properties for responsive gaps
 */
export function generateResponsiveGapCSS(
  breakpoints: Record<Breakpoint, BreakpointConfig> = DEFAULT_BREAKPOINTS
): string {
  const rules: string[] = [`:root { --grid-gap: ${breakpoints['xs'].gap}px; }`];
  
  for (const [, config] of Object.entries(breakpoints)) {
    if (config.minWidth === 0) continue;
    
    rules.push(`
      @media (min-width: ${config.minWidth}px) {
        :root { --grid-gap: ${config.gap}px; }
      }
    `);
  }
  
  return rules.join('\n');
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Creates a complete responsive grid configuration
 */
export function createResponsiveGridConfig(
  containerWidth: number,
  options?: {
    isTouchDevice?: boolean;
    preferCompact?: boolean;
    customBreakpoints?: Partial<Record<Breakpoint, Partial<BreakpointConfig>>>;
  }
): {
  breakpoint: Breakpoint;
  columns: number;
  gap: number;
  colSpan: (section: CardSection) => number;
} {
  const config = { ...DEFAULT_RESPONSIVE_CONFIG };
  
  // Apply custom breakpoints
  if (options?.customBreakpoints) {
    for (const [bp, custom] of Object.entries(options.customBreakpoints)) {
      config.breakpoints[bp as Breakpoint] = {
        ...config.breakpoints[bp as Breakpoint],
        ...custom,
      };
    }
  }
  
  config.isTouchDevice = options?.isTouchDevice ?? false;
  
  const breakpoint = getBreakpoint(containerWidth, config);
  const bpConfig = config.breakpoints[breakpoint];
  
  const { gap } = calculateTouchFriendlyGaps(breakpoint, config.isTouchDevice, config);
  
  return {
    breakpoint,
    columns: bpConfig.columns,
    gap: options?.preferCompact ? Math.round(gap * 0.8) : gap,
    colSpan: (section) => applyResponsiveSpan(section, breakpoint, DEFAULT_SPAN_RULES, bpConfig.columns),
  };
}

/**
 * Detects if device is touch-enabled
 */
export function detectTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}

