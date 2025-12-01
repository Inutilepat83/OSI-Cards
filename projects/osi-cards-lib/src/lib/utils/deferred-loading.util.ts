/**
 * Deferred Loading Utilities (Improvement Plan Point #2)
 * 
 * Provides utilities for deferring heavy section loading using Angular's
 * @defer blocks and IntersectionObserver for lazy rendering.
 * 
 * Heavy sections (chart, map) benefit from deferred loading to:
 * - Reduce initial bundle size
 * - Improve First Contentful Paint (FCP)
 * - Lazy load external dependencies (Chart.js, Leaflet)
 * 
 * @example
 * ```typescript
 * import { isHeavySection, getDeferTrigger, HEAVY_SECTION_TYPES } from 'osi-cards-lib';
 * 
 * // Check if a section should be deferred
 * if (isHeavySection(section)) {
 *   // Load with @defer
 * }
 * 
 * // Get the appropriate defer trigger for a section
 * const trigger = getDeferTrigger(section);
 * // trigger === 'viewport' | 'idle' | 'immediate'
 * ```
 */

import { InjectionToken, Signal, signal, computed, inject } from '@angular/core';
import { CardSection } from '../models';
import { SectionType } from '../models/generated-section-types';

// ============================================================================
// HEAVY SECTION TYPES
// ============================================================================

/**
 * Section types that require external libraries and should be deferred
 */
export const HEAVY_SECTION_TYPES: readonly SectionType[] = [
  'chart',  // Requires Chart.js
  'map'     // Requires Leaflet
] as const;

/**
 * Section types that are computationally expensive
 */
export const EXPENSIVE_SECTION_TYPES: readonly SectionType[] = [
  'chart',
  'map',
  'network-card'  // Complex SVG rendering
] as const;

/**
 * Section types that benefit from idle-time loading
 */
export const IDLE_LOAD_SECTION_TYPES: readonly SectionType[] = [
  'brand-colors',  // Non-critical visual
  'social-media',  // Usually below the fold
  'news'           // Usually below the fold
] as const;

/**
 * All deferrable section types
 */
export const DEFERRABLE_SECTION_TYPES = [
  ...HEAVY_SECTION_TYPES,
  ...EXPENSIVE_SECTION_TYPES,
  ...IDLE_LOAD_SECTION_TYPES
] as const;

// ============================================================================
// DEFER CONFIGURATION
// ============================================================================

/**
 * Defer trigger types matching Angular @defer syntax
 */
export type DeferTrigger = 
  | 'immediate'   // Load immediately (no defer)
  | 'idle'        // Load when browser is idle
  | 'viewport'    // Load when visible in viewport
  | 'interaction' // Load on user interaction
  | 'hover'       // Load on hover
  | 'timer';      // Load after timer

/**
 * Configuration for deferred loading
 */
export interface DeferredLoadingConfig {
  /** Enable deferred loading globally */
  enabled: boolean;
  /** Default trigger for heavy sections */
  heavyTrigger: DeferTrigger;
  /** Default trigger for expensive sections */
  expensiveTrigger: DeferTrigger;
  /** Default trigger for idle-load sections */
  idleTrigger: DeferTrigger;
  /** Timer duration in ms for timer trigger */
  timerMs: number;
  /** Viewport margin for preloading */
  viewportMargin: string;
  /** Show placeholder while loading */
  showPlaceholder: boolean;
  /** Show loading indicator */
  showLoading: boolean;
  /** Minimum loading time (prevents flash) */
  minLoadingMs: number;
}

/**
 * Default deferred loading configuration
 */
export const DEFAULT_DEFERRED_CONFIG: DeferredLoadingConfig = {
  enabled: true,
  heavyTrigger: 'viewport',
  expensiveTrigger: 'viewport',
  idleTrigger: 'idle',
  timerMs: 2000,
  viewportMargin: '100px',
  showPlaceholder: true,
  showLoading: true,
  minLoadingMs: 200
};

/**
 * Injection token for deferred loading configuration
 */
export const OSI_DEFERRED_CONFIG = new InjectionToken<DeferredLoadingConfig>(
  'OSI_DEFERRED_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULT_DEFERRED_CONFIG
  }
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a section type requires heavy external libraries
 */
export function isHeavySection(section: CardSection): boolean {
  if (!section?.type) return false;
  const type = section.type.toLowerCase() as SectionType;
  return (HEAVY_SECTION_TYPES as readonly string[]).includes(type);
}

/**
 * Check if a section type is computationally expensive
 */
export function isExpensiveSection(section: CardSection): boolean {
  if (!section?.type) return false;
  const type = section.type.toLowerCase() as SectionType;
  return (EXPENSIVE_SECTION_TYPES as readonly string[]).includes(type);
}

/**
 * Check if a section should use idle-time loading
 */
export function isIdleLoadSection(section: CardSection): boolean {
  if (!section?.type) return false;
  const type = section.type.toLowerCase() as SectionType;
  return (IDLE_LOAD_SECTION_TYPES as readonly string[]).includes(type);
}

/**
 * Check if a section should be deferred at all
 */
export function isDeferrableSection(section: CardSection): boolean {
  return isHeavySection(section) || isExpensiveSection(section) || isIdleLoadSection(section);
}

/**
 * Get the appropriate defer trigger for a section
 */
export function getDeferTrigger(
  section: CardSection,
  config: DeferredLoadingConfig = DEFAULT_DEFERRED_CONFIG
): DeferTrigger {
  if (!config.enabled) return 'immediate';
  if (!section?.type) return 'immediate';
  
  // Critical sections never defer
  if (section.priority === 'critical') return 'immediate';
  
  // Heavy sections (external libs)
  if (isHeavySection(section)) return config.heavyTrigger;
  
  // Expensive sections
  if (isExpensiveSection(section)) return config.expensiveTrigger;
  
  // Idle-load sections
  if (isIdleLoadSection(section)) return config.idleTrigger;
  
  // Default - no defer
  return 'immediate';
}

/**
 * Get prefetch strategy for a section
 */
export function getPrefetchStrategy(section: CardSection): 'none' | 'idle' | 'viewport' {
  if (!section?.type) return 'none';
  
  // Heavy sections should prefetch on idle
  if (isHeavySection(section)) return 'idle';
  
  // Expensive sections prefetch on viewport approach
  if (isExpensiveSection(section)) return 'viewport';
  
  return 'none';
}

// ============================================================================
// DEFERRED SECTION STATE MANAGEMENT
// ============================================================================

/**
 * State for a deferred section
 */
export interface DeferredSectionState {
  /** Section ID */
  sectionId: string;
  /** Whether loading has been triggered */
  triggered: boolean;
  /** Whether the section is currently loading */
  loading: boolean;
  /** Whether the section has loaded */
  loaded: boolean;
  /** Error if loading failed */
  error: Error | null;
  /** Time when loading started */
  loadStartTime: number | null;
  /** Time when loading completed */
  loadEndTime: number | null;
}

/**
 * Create initial state for a deferred section
 */
export function createDeferredSectionState(sectionId: string): DeferredSectionState {
  return {
    sectionId,
    triggered: false,
    loading: false,
    loaded: false,
    error: null,
    loadStartTime: null,
    loadEndTime: null
  };
}

/**
 * Signal-based deferred section state manager
 */
export class DeferredSectionManager {
  private readonly states = new Map<string, DeferredSectionState>();
  private readonly stateSignal = signal<Map<string, DeferredSectionState>>(new Map());
  
  /**
   * Get state signal (read-only)
   */
  readonly state: Signal<Map<string, DeferredSectionState>> = this.stateSignal.asReadonly();
  
  /**
   * Get or create state for a section
   */
  getState(sectionId: string): DeferredSectionState {
    if (!this.states.has(sectionId)) {
      this.states.set(sectionId, createDeferredSectionState(sectionId));
      this.stateSignal.set(new Map(this.states));
    }
    return this.states.get(sectionId)!;
  }
  
  /**
   * Check if a section is loaded
   */
  isLoaded(sectionId: string): boolean {
    return this.states.get(sectionId)?.loaded ?? false;
  }
  
  /**
   * Check if a section is loading
   */
  isLoading(sectionId: string): boolean {
    return this.states.get(sectionId)?.loading ?? false;
  }
  
  /**
   * Trigger loading for a section
   */
  triggerLoad(sectionId: string): void {
    const state = this.getState(sectionId);
    if (state.triggered) return;
    
    this.states.set(sectionId, {
      ...state,
      triggered: true,
      loading: true,
      loadStartTime: Date.now()
    });
    this.stateSignal.set(new Map(this.states));
  }
  
  /**
   * Mark a section as loaded
   */
  markLoaded(sectionId: string): void {
    const state = this.getState(sectionId);
    
    this.states.set(sectionId, {
      ...state,
      loading: false,
      loaded: true,
      loadEndTime: Date.now()
    });
    this.stateSignal.set(new Map(this.states));
  }
  
  /**
   * Mark a section as failed
   */
  markFailed(sectionId: string, error: Error): void {
    const state = this.getState(sectionId);
    
    this.states.set(sectionId, {
      ...state,
      loading: false,
      loaded: false,
      error,
      loadEndTime: Date.now()
    });
    this.stateSignal.set(new Map(this.states));
  }
  
  /**
   * Reset state for a section
   */
  reset(sectionId: string): void {
    this.states.delete(sectionId);
    this.stateSignal.set(new Map(this.states));
  }
  
  /**
   * Get load time for a section
   */
  getLoadTime(sectionId: string): number | null {
    const state = this.states.get(sectionId);
    if (!state?.loadStartTime || !state?.loadEndTime) return null;
    return state.loadEndTime - state.loadStartTime;
  }
  
  /**
   * Get all loaded sections
   */
  getLoadedSections(): string[] {
    return Array.from(this.states.entries())
      .filter(([_, state]) => state.loaded)
      .map(([id]) => id);
  }
  
  /**
   * Clear all state
   */
  clear(): void {
    this.states.clear();
    this.stateSignal.set(new Map());
  }
}

// ============================================================================
// PLACEHOLDER TEMPLATES
// ============================================================================

/**
 * Placeholder configuration for deferred sections
 */
export interface DeferredPlaceholderConfig {
  /** Placeholder type */
  type: 'skeleton' | 'spinner' | 'text' | 'custom';
  /** Height of placeholder */
  height?: string;
  /** Custom placeholder content */
  content?: string;
  /** CSS class for placeholder */
  className?: string;
  /** Show shimmer animation */
  shimmer?: boolean;
}

/**
 * Get default placeholder config for a section type
 */
export function getDefaultPlaceholder(section: CardSection): DeferredPlaceholderConfig {
  const type = section?.type?.toLowerCase();
  
  switch (type) {
    case 'chart':
      return {
        type: 'skeleton',
        height: '200px',
        className: 'deferred-placeholder--chart',
        shimmer: true
      };
    case 'map':
      return {
        type: 'skeleton',
        height: '300px',
        className: 'deferred-placeholder--map',
        shimmer: true
      };
    case 'network-card':
      return {
        type: 'skeleton',
        height: '250px',
        className: 'deferred-placeholder--network',
        shimmer: true
      };
    default:
      return {
        type: 'skeleton',
        height: '100px',
        className: 'deferred-placeholder--default',
        shimmer: true
      };
  }
}

// ============================================================================
// INTERSECTION OBSERVER INTEGRATION
// ============================================================================

/**
 * Options for viewport-based defer trigger
 */
export interface ViewportTriggerOptions {
  /** Root margin for early trigger */
  rootMargin?: string;
  /** Visibility threshold (0-1) */
  threshold?: number;
  /** Trigger once and disconnect */
  once?: boolean;
}

/**
 * Create an IntersectionObserver for viewport-based defer
 */
export function createDeferObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: ViewportTriggerOptions = {}
): IntersectionObserver {
  const {
    rootMargin = '100px',
    threshold = 0,
    once = true
  } = options;
  
  return new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry);
          if (once) {
            observer.unobserve(entry.target);
          }
        }
      });
    },
    { rootMargin, threshold }
  );
}

// ============================================================================
