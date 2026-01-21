/**
 * Grid Accessibility Utilities
 *
 * Provides accessibility enhancements for grid layouts including:
 * - Reduced motion alternatives
 * - Screen reader announcements
 * - Keyboard navigation (roving tabindex)
 * - Focus management
 * - High contrast mode support
 *
 * @example
 * ```typescript
 * import { GridAccessibilityManager } from '../../public-api';
 *
 * const a11y = new GridAccessibilityManager(gridContainer);
 * a11y.enableKeyboardNavigation();
 * a11y.announceLoadProgress(3, 8);
 * ```
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Keyboard navigation configuration
 */
export interface KeyboardNavConfig {
  /** Enable arrow key navigation */
  arrowKeys?: boolean;
  /** Enable Home/End navigation */
  homeEndKeys?: boolean;
  /** Wrap navigation at edges */
  wrapNavigation?: boolean;
  /** Navigate by rows (vs linear) */
  rowNavigation?: boolean;
  /** Focus trap within container */
  trapFocus?: boolean;
}

/**
 * Announcement configuration
 */
export interface AnnouncementConfig {
  /** ARIA live region politeness */
  politeness?: 'polite' | 'assertive' | 'off';
  /** Delay before announcement (ms) */
  delay?: number;
  /** Clear announcement after (ms) */
  clearAfter?: number;
}

/**
 * Focus management state
 */
export interface FocusState {
  currentIndex: number;
  totalItems: number;
  currentRow: number;
  currentColumn: number;
  columns: number;
}

/**
 * Accessibility preferences
 */
export interface A11yPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  prefersColorScheme: 'light' | 'dark' | 'no-preference';
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_NAV_CONFIG: Required<KeyboardNavConfig> = {
  arrowKeys: true,
  homeEndKeys: true,
  wrapNavigation: false,
  rowNavigation: true,
  trapFocus: false,
};

const DEFAULT_ANNOUNCEMENT_CONFIG: Required<AnnouncementConfig> = {
  politeness: 'polite',
  delay: 100,
  clearAfter: 3000,
};

// ============================================================================
// GRID ACCESSIBILITY MANAGER
// ============================================================================

/**
 * Manages accessibility features for grid layouts
 */
export class GridAccessibilityManager {
  private container: HTMLElement;
  private items: HTMLElement[] = [];
  private focusState: FocusState;
  private navConfig: Required<KeyboardNavConfig>;
  private announcementConfig: Required<AnnouncementConfig>;

  private liveRegion: HTMLElement | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private prefChangeCleanup: (() => void)[] = [];

  private preferences: A11yPreferences = {
    reducedMotion: false,
    highContrast: false,
    prefersColorScheme: 'no-preference',
  };

  constructor(
    container: HTMLElement,
    options?: {
      navConfig?: KeyboardNavConfig;
      announcementConfig?: AnnouncementConfig;
      columns?: number;
    }
  ) {
    this.container = container;
    this.navConfig = { ...DEFAULT_NAV_CONFIG, ...options?.navConfig };
    this.announcementConfig = { ...DEFAULT_ANNOUNCEMENT_CONFIG, ...options?.announcementConfig };

    this.focusState = {
      currentIndex: 0,
      totalItems: 0,
      currentRow: 0,
      currentColumn: 0,
      columns: options?.columns ?? 4,
    };

    this.setupPreferenceListeners();
    this.setupLiveRegion();
  }

  /**
   * Cleans up resources
   */
  destroy(): void {
    this.disableKeyboardNavigation();
    this.removeLiveRegion();
    this.prefChangeCleanup.forEach((cleanup) => cleanup());
    this.prefChangeCleanup = [];
  }

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================

  /**
   * Enables keyboard navigation for grid items
   */
  enableKeyboardNavigation(items?: HTMLElement[]): void {
    if (items) {
      this.setItems(items);
    }

    // Set up roving tabindex
    this.setupRovingTabindex();

    // Add keyboard handler
    this.keydownHandler = (e: KeyboardEvent) => this.handleKeydown(e);
    this.container.addEventListener('keydown', this.keydownHandler);

    // Set container role
    this.container.setAttribute('role', 'grid');
    this.container.setAttribute('aria-label', 'Card sections grid');
  }

  /**
   * Disables keyboard navigation
   */
  disableKeyboardNavigation(): void {
    if (this.keydownHandler) {
      this.container.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    // Reset tabindex
    for (const item of this.items) {
      item.setAttribute('tabindex', '0');
    }
  }

  /**
   * Updates the list of navigable items
   */
  setItems(items: HTMLElement[]): void {
    this.items = items;
    this.focusState.totalItems = items.length;
    this.setupRovingTabindex();
  }

  /**
   * Updates the column count
   */
  setColumns(columns: number): void {
    this.focusState.columns = columns;
    this.updateRowColumn();
  }

  /**
   * Focuses a specific item
   */
  focusItem(index: number): void {
    if (index < 0 || index >= this.items.length) return;

    // Update roving tabindex
    const previousItem = this.items[this.focusState.currentIndex];
    if (previousItem) {
      previousItem.setAttribute('tabindex', '-1');
    }

    const item = this.items[index];
    if (item) {
      item.setAttribute('tabindex', '0');
      item.focus();
      this.focusState.currentIndex = index;
      this.updateRowColumn();
    }
  }

  private setupRovingTabindex(): void {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (item) {
        item.setAttribute('tabindex', i === this.focusState.currentIndex ? '0' : '-1');
        item.setAttribute('role', 'gridcell');
        item.setAttribute('aria-rowindex', String(Math.floor(i / this.focusState.columns) + 1));
        item.setAttribute('aria-colindex', String((i % this.focusState.columns) + 1));
      }
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (!this.navConfig.arrowKeys && !this.navConfig.homeEndKeys) return;

    let newIndex = this.focusState.currentIndex;
    const { currentIndex, columns, totalItems } = this.focusState;

    switch (e.key) {
      case 'ArrowRight':
        if (this.navConfig.arrowKeys) {
          newIndex = this.getNextIndex(currentIndex, 1);
          e.preventDefault();
        }
        break;

      case 'ArrowLeft':
        if (this.navConfig.arrowKeys) {
          newIndex = this.getNextIndex(currentIndex, -1);
          e.preventDefault();
        }
        break;

      case 'ArrowDown':
        if (this.navConfig.arrowKeys && this.navConfig.rowNavigation) {
          newIndex = this.getNextIndex(currentIndex, columns);
          e.preventDefault();
        }
        break;

      case 'ArrowUp':
        if (this.navConfig.arrowKeys && this.navConfig.rowNavigation) {
          newIndex = this.getNextIndex(currentIndex, -columns);
          e.preventDefault();
        }
        break;

      case 'Home':
        if (this.navConfig.homeEndKeys) {
          newIndex = e.ctrlKey ? 0 : Math.floor(currentIndex / columns) * columns;
          e.preventDefault();
        }
        break;

      case 'End':
        if (this.navConfig.homeEndKeys) {
          newIndex = e.ctrlKey
            ? totalItems - 1
            : Math.min(Math.floor(currentIndex / columns) * columns + columns - 1, totalItems - 1);
          e.preventDefault();
        }
        break;

      case 'Enter':
      case ' ':
        // Activate current item
        this.items[currentIndex]?.click();
        e.preventDefault();
        break;
    }

    if (newIndex !== currentIndex) {
      this.focusItem(newIndex);
    }
  }

  private getNextIndex(current: number, delta: number): number {
    let newIndex = current + delta;

    if (this.navConfig.wrapNavigation) {
      if (newIndex < 0) {
        newIndex = this.focusState.totalItems - 1;
      } else if (newIndex >= this.focusState.totalItems) {
        newIndex = 0;
      }
    } else {
      newIndex = Math.max(0, Math.min(newIndex, this.focusState.totalItems - 1));
    }

    return newIndex;
  }

  private updateRowColumn(): void {
    const { currentIndex, columns } = this.focusState;
    this.focusState.currentRow = Math.floor(currentIndex / columns);
    this.focusState.currentColumn = currentIndex % columns;
  }

  // ============================================================================
  // SCREEN READER ANNOUNCEMENTS
  // ============================================================================

  /**
   * Announces loading progress
   */
  announceLoadProgress(loaded: number, total: number): void {
    this.announce(`${loaded} of ${total} sections loaded`);
  }

  /**
   * Announces section completion
   */
  announceSectionComplete(sectionTitle: string): void {
    this.announce(`Section "${sectionTitle}" loaded`);
  }

  /**
   * Announces layout change
   */
  announceLayoutChange(columns: number): void {
    this.announce(`Layout changed to ${columns} columns`);
  }

  /**
   * Announces section expansion/collapse
   */
  announceSectionToggle(sectionTitle: string, expanded: boolean): void {
    this.announce(`Section "${sectionTitle}" ${expanded ? 'expanded' : 'collapsed'}`);
  }

  /**
   * Announces streaming state
   */
  announceStreamingState(state: 'started' | 'complete' | 'error'): void {
    const messages: Record<string, string> = {
      started: 'Loading card content',
      complete: 'Card content loaded',
      error: 'Error loading card content',
    };
    this.announce(messages[state] ?? '');
  }

  /**
   * Generic announcement
   */
  announce(message: string, config?: AnnouncementConfig): void {
    if (!this.liveRegion) return;

    const { politeness, delay, clearAfter } = {
      ...this.announcementConfig,
      ...config,
    };

    this.liveRegion.setAttribute('aria-live', politeness);

    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }

      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = '';
        }
      }, clearAfter);
    }, delay);
  }

  private setupLiveRegion(): void {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', this.announcementConfig.politeness);
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this.liveRegion);
  }

  private removeLiveRegion(): void {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
      this.liveRegion = null;
    }
  }

  // ============================================================================
  // PREFERENCE DETECTION
  // ============================================================================

  /**
   * Gets current accessibility preferences
   */
  getPreferences(): A11yPreferences {
    return { ...this.preferences };
  }

  /**
   * Checks if reduced motion is preferred
   */
  prefersReducedMotion(): boolean {
    return this.preferences.reducedMotion;
  }

  /**
   * Checks if high contrast is active
   */
  hasHighContrast(): boolean {
    return this.preferences.highContrast;
  }

  private setupPreferenceListeners(): void {
    // Reduced motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotion = (e: MediaQueryListEvent | MediaQueryList) => {
      this.preferences.reducedMotion = e.matches;
    };
    handleReducedMotion(reducedMotionQuery);
    reducedMotionQuery.addEventListener('change', handleReducedMotion);
    this.prefChangeCleanup.push(() =>
      reducedMotionQuery.removeEventListener('change', handleReducedMotion)
    );

    // High contrast
    const highContrastQuery = window.matchMedia('(forced-colors: active)');
    const handleHighContrast = (e: MediaQueryListEvent | MediaQueryList) => {
      this.preferences.highContrast = e.matches;
    };
    handleHighContrast(highContrastQuery);
    highContrastQuery.addEventListener('change', handleHighContrast);
    this.prefChangeCleanup.push(() =>
      highContrastQuery.removeEventListener('change', handleHighContrast)
    );

    // Color scheme
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorScheme = (e: MediaQueryListEvent | MediaQueryList) => {
      this.preferences.prefersColorScheme = e.matches ? 'dark' : 'light';
    };
    handleColorScheme(darkModeQuery);
    darkModeQuery.addEventListener('change', handleColorScheme);
    this.prefChangeCleanup.push(() =>
      darkModeQuery.removeEventListener('change', handleColorScheme)
    );
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a screen reader only element
 */
export function createSROnly(text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'sr-only';
  span.textContent = text;
  span.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  return span;
}

/**
 * Adds screen reader only text to an element
 */
export function addSRLabel(element: HTMLElement, label: string): void {
  const existing = element.querySelector('.sr-only');
  if (existing) {
    existing.textContent = label;
  } else {
    element.appendChild(createSROnly(label));
  }
}

/**
 * Gets CSS for reduced motion alternatives
 */
export function getReducedMotionStyles(): string {
  return `
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      
      /* Alternative feedback for state changes */
      .section-complete {
        outline: 2px solid var(--success-color, #10b981);
        outline-offset: 2px;
      }
      
      .section-loading {
        background: var(--loading-bg, #f3f4f6);
        opacity: 0.8;
      }
      
      .section-error {
        outline: 2px solid var(--error-color, #ef4444);
        outline-offset: 2px;
      }
    }
  `;
}

/**
 * Gets CSS for high contrast mode
 */
export function getHighContrastStyles(): string {
  return `
    @media (forced-colors: active) {
      .masonry-section {
        border: 2px solid CanvasText;
      }
      
      .section-header {
        border-bottom: 1px solid CanvasText;
      }
      
      .field-value {
        color: CanvasText;
      }
      
      .skeleton-placeholder {
        background: Canvas;
        border: 1px dashed CanvasText;
      }
      
      .card-item:focus {
        outline: 3px solid Highlight;
        outline-offset: 2px;
      }
      
      /* Use shape changes instead of color for status */
      .status-success::before {
        content: "✓ ";
      }
      
      .status-error::before {
        content: "✗ ";
      }
      
      .status-loading::before {
        content: "⏳ ";
      }
    }
  `;
}

/**
 * Applies focus ring styles that respect user preferences
 */
export function applyFocusStyles(element: HTMLElement): void {
  element.style.cssText = `
    outline: 2px solid var(--focus-color, #4f46e5);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px var(--focus-ring, rgba(79, 70, 229, 0.2));
  `;
}

/**
 * Checks if element is currently visible to assistive technology
 */
export function isAccessiblyVisible(element: HTMLElement): boolean {
  if (element.hidden) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;

  const style = getComputedStyle(element);
  if (style.display === 'none') return false;
  if (style.visibility === 'hidden') return false;

  return true;
}

/**
 * Sets up focus trap within a container
 */
export function createFocusTrap(container: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
} {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  let firstFocusable: HTMLElement | null = null;
  let lastFocusable: HTMLElement | null = null;
  let handler: ((e: KeyboardEvent) => void) | null = null;

  const updateFocusables = () => {
    const focusables = container.querySelectorAll<HTMLElement>(focusableSelectors);
    firstFocusable = focusables[0] ?? null;
    lastFocusable = focusables[focusables.length - 1] ?? null;
  };

  const trapHandler = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    updateFocusables();

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  return {
    activate() {
      updateFocusables();
      handler = trapHandler;
      container.addEventListener('keydown', handler);
      firstFocusable?.focus();
    },
    deactivate() {
      if (handler) {
        container.removeEventListener('keydown', handler);
        handler = null;
      }
    },
  };
}
