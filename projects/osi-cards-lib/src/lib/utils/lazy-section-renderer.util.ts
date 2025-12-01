/**
 * Lazy Section Renderer (Improvement Plan Point #6)
 * 
 * IntersectionObserver-based section lazy rendering for optimal performance.
 * Renders sections only when they become visible in the viewport.
 * 
 * @example
 * ```typescript
 * import { LazySectionRenderer, createLazySectionRenderer } from 'osi-cards-lib';
 * 
 * // Create a lazy renderer
 * const renderer = createLazySectionRenderer({
 *   rootMargin: '100px',
 *   threshold: 0.1
 * });
 * 
 * // Observe sections
 * renderer.observe(sectionElement, () => {
 *   loadSection();
 * });
 * 
 * // Cleanup
 * renderer.disconnect();
 * ```
 */

import { 
  Injectable, 
  InjectionToken, 
  signal, 
  Signal, 
  computed,
  inject,
  DestroyRef,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CardSection } from '../models';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration for lazy section rendering
 */
export interface LazySectionConfig {
  /** Root margin for early loading (CSS margin format) */
  rootMargin: string;
  /** Visibility threshold (0-1) to trigger loading */
  threshold: number | number[];
  /** Render sections only once (default: true) */
  once: boolean;
  /** Enable skeleton placeholders while loading */
  showSkeleton: boolean;
  /** Skeleton animation duration in ms */
  skeletonDuration: number;
  /** Track visibility for analytics */
  trackVisibility: boolean;
  /** Minimum visibility time before marking as "viewed" (ms) */
  minViewTime: number;
  /** Debug mode */
  debug: boolean;
}

/**
 * Default lazy section configuration
 */
export const DEFAULT_LAZY_CONFIG: LazySectionConfig = {
  rootMargin: '100px 0px',
  threshold: 0.1,
  once: true,
  showSkeleton: true,
  skeletonDuration: 300,
  trackVisibility: true,
  minViewTime: 1000,
  debug: false
};

/**
 * Injection token for lazy section configuration
 */
export const OSI_LAZY_SECTION_CONFIG = new InjectionToken<LazySectionConfig>(
  'OSI_LAZY_SECTION_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULT_LAZY_CONFIG
  }
);

// ============================================================================
// VISIBILITY STATE
// ============================================================================

/**
 * Visibility state for a section
 */
export interface SectionVisibility {
  /** Section ID */
  sectionId: string;
  /** Whether section is currently visible */
  isVisible: boolean;
  /** Whether section has ever been visible */
  hasBeenVisible: boolean;
  /** Whether section is currently rendered */
  isRendered: boolean;
  /** First visibility timestamp */
  firstVisibleAt: number | null;
  /** Last visibility timestamp */
  lastVisibleAt: number | null;
  /** Total time visible (ms) */
  totalVisibleTime: number;
  /** Current visibility ratio (0-1) */
  visibilityRatio: number;
}

/**
 * Create initial visibility state
 */
export function createVisibilityState(sectionId: string): SectionVisibility {
  return {
    sectionId,
    isVisible: false,
    hasBeenVisible: false,
    isRendered: false,
    firstVisibleAt: null,
    lastVisibleAt: null,
    totalVisibleTime: 0,
    visibilityRatio: 0
  };
}

// ============================================================================
// LAZY SECTION RENDERER
// ============================================================================

/**
 * Callback when a section becomes visible
 */
export type OnSectionVisible = (
  sectionId: string, 
  entry: IntersectionObserverEntry
) => void;

/**
 * Callback when a section leaves viewport
 */
export type OnSectionHidden = (
  sectionId: string,
  state: SectionVisibility
) => void;

/**
 * Lazy Section Renderer
 * 
 * Uses IntersectionObserver to efficiently track section visibility
 * and render sections only when they enter the viewport.
 */
export class LazySectionRenderer {
  private observer: IntersectionObserver | null = null;
  private readonly elementMap = new Map<Element, string>();
  private readonly stateMap = new Map<string, SectionVisibility>();
  private readonly renderCallbacks = new Map<string, OnSectionVisible>();
  private readonly hideCallbacks = new Map<string, OnSectionHidden>();
  
  private readonly visibilitySignal = signal<Map<string, SectionVisibility>>(new Map());
  private visibilityTrackingInterval: number | null = null;
  
  /** Signal with current visibility states */
  readonly visibility: Signal<Map<string, SectionVisibility>> = this.visibilitySignal.asReadonly();
  
  constructor(
    private readonly config: LazySectionConfig = DEFAULT_LAZY_CONFIG,
    private readonly isBrowser: boolean = true
  ) {
    if (this.isBrowser) {
      this.initObserver();
      if (config.trackVisibility) {
        this.startVisibilityTracking();
      }
    }
  }
  
  /**
   * Initialize the IntersectionObserver
   */
  private initObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('[LazySectionRenderer] IntersectionObserver not supported');
      return;
    }
    
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        rootMargin: this.config.rootMargin,
        threshold: this.config.threshold
      }
    );
  }
  
  /**
   * Handle intersection changes
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    const now = Date.now();
    
    entries.forEach(entry => {
      const sectionId = this.elementMap.get(entry.target);
      if (!sectionId) return;
      
      const state = this.stateMap.get(sectionId) ?? createVisibilityState(sectionId);
      
      if (entry.isIntersecting) {
        // Section became visible
        const wasVisible = state.isVisible;
        
        state.isVisible = true;
        state.visibilityRatio = entry.intersectionRatio;
        state.lastVisibleAt = now;
        
        if (!state.hasBeenVisible) {
          state.hasBeenVisible = true;
          state.firstVisibleAt = now;
        }
        
        if (!wasVisible) {
          // Trigger render callback
          const callback = this.renderCallbacks.get(sectionId);
          if (callback && !state.isRendered) {
            callback(sectionId, entry);
            state.isRendered = true;
            
            // Unobserve if configured for once-only rendering
            if (this.config.once) {
              this.observer?.unobserve(entry.target);
            }
          }
          
          if (this.config.debug) {
            console.log(`[LazySectionRenderer] Section visible: ${sectionId}`, {
              ratio: entry.intersectionRatio,
              bounds: entry.boundingClientRect
            });
          }
        }
      } else {
        // Section left viewport
        if (state.isVisible) {
          state.isVisible = false;
          state.visibilityRatio = 0;
          
          // Trigger hide callback
          const hideCallback = this.hideCallbacks.get(sectionId);
          if (hideCallback) {
            hideCallback(sectionId, state);
          }
        }
      }
      
      this.stateMap.set(sectionId, state);
    });
    
    // Update signal
    this.visibilitySignal.set(new Map(this.stateMap));
  }
  
  /**
   * Start tracking visibility time
   */
  private startVisibilityTracking(): void {
    if (this.visibilityTrackingInterval) return;
    
    this.visibilityTrackingInterval = window.setInterval(() => {
      let changed = false;
      
      this.stateMap.forEach((state, sectionId) => {
        if (state.isVisible) {
          state.totalVisibleTime += 100;
          changed = true;
        }
      });
      
      if (changed) {
        this.visibilitySignal.set(new Map(this.stateMap));
      }
    }, 100) as unknown as number;
  }
  
  /**
   * Observe a section element
   */
  observe(
    element: Element, 
    sectionId: string,
    onVisible?: OnSectionVisible,
    onHidden?: OnSectionHidden
  ): void {
    if (!this.observer) return;
    
    this.elementMap.set(element, sectionId);
    this.stateMap.set(sectionId, createVisibilityState(sectionId));
    
    if (onVisible) {
      this.renderCallbacks.set(sectionId, onVisible);
    }
    if (onHidden) {
      this.hideCallbacks.set(sectionId, onHidden);
    }
    
    this.observer.observe(element);
    this.visibilitySignal.set(new Map(this.stateMap));
  }
  
  /**
   * Stop observing a section element
   */
  unobserve(element: Element): void {
    if (!this.observer) return;
    
    const sectionId = this.elementMap.get(element);
    if (sectionId) {
      this.elementMap.delete(element);
      this.stateMap.delete(sectionId);
      this.renderCallbacks.delete(sectionId);
      this.hideCallbacks.delete(sectionId);
      this.visibilitySignal.set(new Map(this.stateMap));
    }
    
    this.observer.unobserve(element);
  }
  
  /**
   * Check if a section is visible
   */
  isVisible(sectionId: string): boolean {
    return this.stateMap.get(sectionId)?.isVisible ?? false;
  }
  
  /**
   * Check if a section has been rendered
   */
  isRendered(sectionId: string): boolean {
    return this.stateMap.get(sectionId)?.isRendered ?? false;
  }
  
  /**
   * Check if a section has been viewed long enough
   */
  hasBeenViewed(sectionId: string): boolean {
    const state = this.stateMap.get(sectionId);
    if (!state) return false;
    return state.totalVisibleTime >= this.config.minViewTime;
  }
  
  /**
   * Get visibility state for a section
   */
  getState(sectionId: string): SectionVisibility | undefined {
    return this.stateMap.get(sectionId);
  }
  
  /**
   * Get all currently visible sections
   */
  getVisibleSections(): string[] {
    return Array.from(this.stateMap.entries())
      .filter(([_, state]) => state.isVisible)
      .map(([id]) => id);
  }
  
  /**
   * Get visibility analytics
   */
  getAnalytics(): {
    totalSections: number;
    visibleSections: number;
    renderedSections: number;
    viewedSections: number;
    averageVisibilityTime: number;
  } {
    const states = Array.from(this.stateMap.values());
    const visibleCount = states.filter(s => s.isVisible).length;
    const renderedCount = states.filter(s => s.isRendered).length;
    const viewedCount = states.filter(s => s.totalVisibleTime >= this.config.minViewTime).length;
    const totalTime = states.reduce((sum, s) => sum + s.totalVisibleTime, 0);
    
    return {
      totalSections: states.length,
      visibleSections: visibleCount,
      renderedSections: renderedCount,
      viewedSections: viewedCount,
      averageVisibilityTime: states.length > 0 ? totalTime / states.length : 0
    };
  }
  
  /**
   * Force render all sections (bypass lazy loading)
   */
  renderAll(): void {
    this.stateMap.forEach((state, sectionId) => {
      if (!state.isRendered) {
        const callback = this.renderCallbacks.get(sectionId);
        if (callback) {
          // Create a mock entry for immediate rendering
          callback(sectionId, {} as IntersectionObserverEntry);
        }
        state.isRendered = true;
      }
    });
    this.visibilitySignal.set(new Map(this.stateMap));
  }
  
  /**
   * Disconnect the observer and clean up
   */
  disconnect(): void {
    if (this.visibilityTrackingInterval) {
      clearInterval(this.visibilityTrackingInterval);
      this.visibilityTrackingInterval = null;
    }
    
    this.observer?.disconnect();
    this.observer = null;
    this.elementMap.clear();
    this.stateMap.clear();
    this.renderCallbacks.clear();
    this.hideCallbacks.clear();
    this.visibilitySignal.set(new Map());
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a lazy section renderer with custom configuration
 */
export function createLazySectionRenderer(
  config: Partial<LazySectionConfig> = {},
  isBrowser = true
): LazySectionRenderer {
  return new LazySectionRenderer(
    { ...DEFAULT_LAZY_CONFIG, ...config },
    isBrowser
  );
}

// ============================================================================
// ANGULAR SERVICE
// ============================================================================

/**
 * Injectable lazy section renderer service
 */
@Injectable({
  providedIn: 'root'
})
export class LazySectionRendererService {
  private readonly config = inject(OSI_LAZY_SECTION_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  
  private renderer: LazySectionRenderer | null = null;
  
  /**
   * Get or create the lazy renderer
   */
  getRenderer(): LazySectionRenderer {
    if (!this.renderer) {
      const isBrowser = isPlatformBrowser(this.platformId);
      this.renderer = createLazySectionRenderer(this.config, isBrowser);
      
      this.destroyRef.onDestroy(() => {
        this.renderer?.disconnect();
        this.renderer = null;
      });
    }
    return this.renderer;
  }
  
  /**
   * Observe a section element
   */
  observe(
    element: Element,
    sectionId: string,
    onVisible?: OnSectionVisible,
    onHidden?: OnSectionHidden
  ): void {
    this.getRenderer().observe(element, sectionId, onVisible, onHidden);
  }
  
  /**
   * Unobserve a section element
   */
  unobserve(element: Element): void {
    this.renderer?.unobserve(element);
  }
  
  /**
   * Check if a section is visible
   */
  isVisible(sectionId: string): boolean {
    return this.renderer?.isVisible(sectionId) ?? false;
  }
  
  /**
   * Get visibility analytics
   */
  getAnalytics() {
    return this.renderer?.getAnalytics() ?? {
      totalSections: 0,
      visibleSections: 0,
      renderedSections: 0,
      viewedSections: 0,
      averageVisibilityTime: 0
    };
  }
}

// ============================================================================
// DIRECTIVE UTILITIES
// ============================================================================

/**
 * Utility to create skeleton placeholder CSS
 */
export function getSkeletonStyles(height: string = '100px'): Record<string, string> {
  return {
    'min-height': height,
    'background': 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    'background-size': '200% 100%',
    'animation': 'osi-skeleton-shimmer 1.5s infinite',
    'border-radius': '8px'
  };
}

/**
 * CSS keyframes for skeleton shimmer animation
 */
export const SKELETON_SHIMMER_CSS = `
@keyframes osi-skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.osi-lazy-skeleton {
  min-height: 100px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: osi-skeleton-shimmer 1.5s infinite;
  border-radius: 8px;
}

.osi-lazy-skeleton--chart { min-height: 200px; }
.osi-lazy-skeleton--map { min-height: 300px; }
.osi-lazy-skeleton--network { min-height: 250px; }
`;

// ============================================================================
// EXPORTS
// ============================================================================
