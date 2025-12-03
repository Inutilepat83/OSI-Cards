/**
 * Lazy Section Loader Service
 *
 * Provides dynamic imports for optional/heavy section components
 * that require external libraries (Chart.js, Leaflet, etc.)
 *
 * This reduces initial bundle size by loading these components only when needed.
 *
 * @example
 * ```typescript
 * const ChartSection = await lazySectionLoader.loadSection('chart');
 * ```
 */

import { inject, Injectable, NgZone, Type } from '@angular/core';
import { BaseSectionComponent } from '../sections/base-section.component';

/** Sections that should be lazy loaded due to external dependencies */
export const LAZY_SECTION_TYPES = ['chart', 'map'] as const;
export type LazySectionType = (typeof LAZY_SECTION_TYPES)[number];

/** Loading state for lazy sections */
export interface LazySectionState {
  loading: boolean;
  loaded: boolean;
  error: Error | null;
  component: Type<BaseSectionComponent> | null;
}

/** Factory function type for lazy loading */
type LazyComponentFactory = () => Promise<Type<BaseSectionComponent>>;

/**
 * Service for lazy loading heavy section components
 *
 * Features:
 * - Dynamic imports for chart and map sections
 * - Caching of loaded components
 * - Loading state tracking
 * - Error handling with retry capability
 */
@Injectable({
  providedIn: 'root',
})
export class LazySectionLoaderService {
  private readonly ngZone = inject(NgZone);

  /** Cache for loaded components */
  private readonly componentCache = new Map<LazySectionType, Type<BaseSectionComponent>>();

  /** Loading states for each lazy section type */
  private readonly loadingStates = new Map<LazySectionType, LazySectionState>();

  /** Pending load promises to prevent duplicate loads */
  private readonly pendingLoads = new Map<LazySectionType, Promise<Type<BaseSectionComponent>>>();

  /** Lazy load factories for each section type */
  private readonly lazyFactories: Record<LazySectionType, LazyComponentFactory> = {
    chart: async () => {
      const module = await import('../sections/chart-section/chart-section.component');
      return module.ChartSectionComponent as unknown as Type<BaseSectionComponent>;
    },
    map: async () => {
      const module = await import('../sections/map-section/map-section.component');
      return module.MapSectionComponent as unknown as Type<BaseSectionComponent>;
    },
  };

  constructor() {
    // Initialize loading states
    for (const type of LAZY_SECTION_TYPES) {
      this.loadingStates.set(type, {
        loading: false,
        loaded: false,
        error: null,
        component: null,
      });
    }
  }

  /**
   * Check if a section type should be lazy loaded
   */
  isLazySection(type: string): type is LazySectionType {
    return LAZY_SECTION_TYPES.includes(type as LazySectionType);
  }

  /**
   * Get the loading state for a lazy section type
   */
  getLoadingState(type: LazySectionType): LazySectionState {
    return (
      this.loadingStates.get(type) ?? {
        loading: false,
        loaded: false,
        error: null,
        component: null,
      }
    );
  }

  /**
   * Check if a lazy section is already loaded
   */
  isLoaded(type: LazySectionType): boolean {
    return this.componentCache.has(type);
  }

  /**
   * Get a cached component if available
   */
  getCachedComponent(type: LazySectionType): Type<BaseSectionComponent> | null {
    return this.componentCache.get(type) ?? null;
  }

  /**
   * Load a lazy section component
   *
   * @param type - The section type to load
   * @returns Promise resolving to the component class
   */
  async loadSection(type: LazySectionType): Promise<Type<BaseSectionComponent>> {
    // Return cached component if available
    if (this.componentCache.has(type)) {
      return this.componentCache.get(type)!;
    }

    // Return pending promise if already loading
    if (this.pendingLoads.has(type)) {
      return this.pendingLoads.get(type)!;
    }

    // Start loading
    const state = this.loadingStates.get(type)!;
    state.loading = true;
    state.error = null;

    const loadPromise = this.executeLoad(type);
    this.pendingLoads.set(type, loadPromise);

    try {
      const component = await loadPromise;

      // Update state
      state.loading = false;
      state.loaded = true;
      state.component = component;

      // Cache the component
      this.componentCache.set(type, component);

      return component;
    } catch (error) {
      state.loading = false;
      state.error = error instanceof Error ? error : new Error(String(error));
      throw error;
    } finally {
      this.pendingLoads.delete(type);
    }
  }

  /**
   * Execute the actual dynamic import
   */
  private async executeLoad(type: LazySectionType): Promise<Type<BaseSectionComponent>> {
    const factory = this.lazyFactories[type];

    if (!factory) {
      throw new Error(`No lazy loader defined for section type: ${type}`);
    }

    // Run outside Angular zone for better performance
    return this.ngZone.runOutsideAngular(async () => {
      try {
        return await factory();
      } catch (error) {
        console.error(`Failed to lazy load section "${type}":`, error);
        throw error;
      }
    });
  }

  /**
   * Preload a lazy section (useful for anticipated navigation)
   *
   * @param type - The section type to preload
   */
  preload(type: LazySectionType): void {
    if (!this.isLoaded(type) && !this.pendingLoads.has(type)) {
      // Fire and forget - preload in background
      this.loadSection(type).catch(() => {
        // Silently ignore preload failures
      });
    }
  }

  /**
   * Preload all lazy sections
   * Useful for applications that know they'll need these sections
   */
  preloadAll(): void {
    for (const type of LAZY_SECTION_TYPES) {
      this.preload(type);
    }
  }

  /**
   * Clear the component cache (useful for testing or hot reload)
   */
  clearCache(): void {
    this.componentCache.clear();
    for (const [_type, state] of this.loadingStates) {
      state.loading = false;
      state.loaded = false;
      state.error = null;
      state.component = null;
    }
  }

  /**
   * Retry loading a failed section
   */
  async retryLoad(type: LazySectionType): Promise<Type<BaseSectionComponent>> {
    const state = this.loadingStates.get(type);
    if (state) {
      state.error = null;
    }
    return this.loadSection(type);
  }
}
