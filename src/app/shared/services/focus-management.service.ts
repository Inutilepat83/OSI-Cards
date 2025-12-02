import { ElementRef, inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { fromEvent, Subject, takeUntil } from 'rxjs';
import { LoggingService } from '../../core/services/logging.service';

/**
 * Focus trap configuration
 */
export interface FocusTrap {
  id: string;
  container: HTMLElement;
  focusableElements: HTMLElement[];
  previousFocus: HTMLElement | null;
  handleKeyDown: (e: KeyboardEvent) => void;
}

/**
 * Consolidated Focus Management Service
 *
 * Unified focus management for modals, drawers, and dynamic content.
 * Combines features from both core and shared implementations:
 * - Focus trapping with ID-based management
 * - Focus restoration and history
 * - Keyboard navigation helpers
 * - Focus indicators
 * - Skip links support
 *
 * @example
 * ```typescript
 * const focusService = inject(FocusManagementService);
 *
 * // Trap focus in modal (returns ID for later release)
 * const trapId = focusService.trapFocus(modalElement);
 *
 * // Or trap and get release function
 * const release = focusService.trapFocusWithRelease(modalElement);
 *
 * // Focus an element by selector or reference
 * focusService.focusElement('#my-element');
 *
 * // Restore focus when closing
 * focusService.releaseTrap(trapId);
 * // Or
 * release();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class FocusManagementService implements OnDestroy {
  private readonly logger = inject(LoggingService);
  private readonly ngZone = inject(NgZone);

  private focusTraps = new Map<string, FocusTrap>();
  private focusHistory: HTMLElement[] = [];
  private readonly maxHistorySize = 10;
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.setupGlobalListeners();
  }

  /**
   * Focus an element by selector, ID, or element reference
   *
   * @param target - CSS selector, element ID, or HTMLElement
   * @param options - Focus options
   */
  focusElement(target: string | HTMLElement, options?: FocusOptions): void {
    this.ngZone.runOutsideAngular(() => {
      let element: HTMLElement | null = null;

      if (typeof target === 'string') {
        // Try as ID first
        element = document.getElementById(target);
        // If not found, try as selector
        if (!element) {
          element = document.querySelector<HTMLElement>(target);
        }
      } else {
        element = target;
      }

      if (element) {
        // Make element focusable if needed
        if (element.tabIndex === -1 && !this.isFocusable(element)) {
          element.tabIndex = 0;
        }

        element.focus(options);
        this.logger.debug(
          `Focused element: ${typeof target === 'string' ? target : target.tagName}`,
          'FocusManagementService'
        );
      } else {
        this.logger.warn(`Element not found: ${target}`, 'FocusManagementService');
      }
    });
  }

  /**
   * Trap focus within an element (e.g., modal, drawer)
   * Returns trap ID for later release.
   *
   * @param element - Element to trap focus within
   * @param id - Optional ID for the trap (auto-generated if not provided)
   * @returns Trap ID for later restoration
   */
  trapFocus(element: HTMLElement | ElementRef<HTMLElement>, id?: string): string {
    const el = element instanceof ElementRef ? element.nativeElement : element;
    const trapId = id || `focus-trap-${Date.now()}`;

    // Store previous focus
    const previousFocus = document.activeElement as HTMLElement;
    if (previousFocus) {
      this.addToFocusHistory(previousFocus);
    }

    // Find all focusable elements
    const focusableElements = this.getFocusableElements(el);

    if (focusableElements.length === 0) {
      this.logger.warn('No focusable elements found in trap container', 'FocusManagementService');
      return trapId;
    }

    // Focus first element
    focusableElements[0]?.focus();

    // Create trap
    const trap: FocusTrap = {
      id: trapId,
      container: el,
      focusableElements,
      previousFocus,
      handleKeyDown: this.createKeyDownHandler(focusableElements),
    };

    // Add keyboard listener
    el.addEventListener('keydown', trap.handleKeyDown);

    this.focusTraps.set(trapId, trap);
    this.logger.debug('Focus trap activated', 'FocusManagementService', {
      trapId,
      container: el.tagName,
    });

    return trapId;
  }

  /**
   * Trap focus and return a release function
   * Useful for components that don't want to track trap IDs.
   *
   * @param container - Container element
   * @returns Function to release the focus trap
   */
  trapFocusWithRelease(container: HTMLElement): () => void {
    const trapId = this.trapFocus(container);
    return () => this.releaseTrap(trapId);
  }

  /**
   * Release focus trap by ID
   *
   * @param trapId - ID of the trap to release
   * @param restoreFocus - Whether to restore previous focus (default: true)
   */
  releaseTrap(trapId: string, restoreFocus = true): void {
    const trap = this.focusTraps.get(trapId);
    if (!trap) {
      return;
    }

    // Remove keyboard listener
    trap.container.removeEventListener('keydown', trap.handleKeyDown);

    // Restore focus
    if (restoreFocus && trap.previousFocus && document.contains(trap.previousFocus)) {
      trap.previousFocus.focus();
    }

    this.focusTraps.delete(trapId);
    this.logger.debug('Focus trap released', 'FocusManagementService', { trapId });
  }

  /**
   * Release focus trap by container element
   *
   * @param container - Container element
   */
  releaseFocusTrap(container: HTMLElement): void {
    for (const [trapId, trap] of this.focusTraps.entries()) {
      if (trap.container === container) {
        this.releaseTrap(trapId);
        return;
      }
    }
  }

  /**
   * Restore focus to previous element
   *
   * @param trapId - Optional trap ID (uses most recent from history if not provided)
   */
  restoreFocus(trapId?: string): void {
    if (trapId) {
      const trap = this.focusTraps.get(trapId);
      if (trap?.previousFocus && document.contains(trap.previousFocus)) {
        trap.previousFocus.focus();
      }
      return;
    }

    // Restore from history
    const previousFocus = this.focusHistory.pop();
    if (previousFocus && document.contains(previousFocus)) {
      previousFocus.focus();
    }
  }

  /**
   * Save current focus for later restoration
   *
   * @returns Function to restore focus
   */
  saveFocus(): () => void {
    const activeElement = document.activeElement as HTMLElement;

    return () => {
      if (activeElement && document.body.contains(activeElement)) {
        this.focusElement(activeElement);
      }
    };
  }

  /**
   * Move focus to next/previous focusable element
   *
   * @param currentElement - Current focused element
   * @param direction - 'next' or 'previous'
   */
  moveFocus(currentElement: HTMLElement, direction: 'next' | 'previous' = 'next'): void {
    const allFocusable = this.getFocusableElements(document.body);
    const currentIndex = allFocusable.indexOf(currentElement);

    if (currentIndex === -1) {
      return;
    }

    const nextIndex =
      direction === 'next'
        ? (currentIndex + 1) % allFocusable.length
        : currentIndex === 0
          ? allFocusable.length - 1
          : currentIndex - 1;

    allFocusable[nextIndex]?.focus();
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((el) => {
      // Filter out hidden elements
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
  }

  /**
   * Get focusable elements count in a container
   */
  getFocusableCount(container: HTMLElement): number {
    return this.getFocusableElements(container).length;
  }

  /**
   * Clear all focus traps
   */
  clearAllTraps(): void {
    this.focusTraps.forEach((_trap, id) => {
      this.releaseTrap(id, false);
    });
  }

  /**
   * Check if an element is focusable
   */
  private isFocusable(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    const tabIndex = element.tabIndex;

    // Native focusable elements
    if (['input', 'select', 'textarea', 'button', 'a'].includes(tagName)) {
      return true;
    }

    // Elements with tabindex >= 0
    if (tabIndex >= 0) {
      return true;
    }

    // Check for contenteditable
    if (element.contentEditable === 'true') {
      return true;
    }

    return false;
  }

  /**
   * Create keyboard handler for focus trap
   */
  private createKeyDownHandler(focusableElements: HTMLElement[]): (e: KeyboardEvent) => void {
    return (e: KeyboardEvent) => {
      if (e.key !== 'Tab') {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
  }

  /**
   * Add element to focus history
   */
  private addToFocusHistory(element: HTMLElement): void {
    this.focusHistory.push(element);
    if (this.focusHistory.length > this.maxHistorySize) {
      this.focusHistory.shift();
    }
  }

  /**
   * Setup global listeners for focus management
   */
  private setupGlobalListeners(): void {
    // Handle Escape key to emit escape event for modals
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event.key === 'Escape' && this.focusTraps.size > 0) {
          // Find the most recent trap and emit escape event
          const traps = Array.from(this.focusTraps.values());
          if (traps.length > 0) {
            const latestTrap = traps[traps.length - 1];
            if (latestTrap) {
              // Emit event that can be handled by components
              const escapeEvent = new CustomEvent('focus-trap-escape', {
                detail: { trapId: latestTrap.id },
              });
              document.dispatchEvent(escapeEvent);
            }
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.clearAllTraps();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
