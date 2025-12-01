import { ElementRef, inject, Injectable, QueryList } from '@angular/core';
import { fromEvent, Subject, takeUntil } from 'rxjs';

/**
 * Focus Management Service
 *
 * Centralized focus management for modals, drawers, and dynamic content.
 * Provides focus trapping, focus restoration, and focus indicators.
 *
 * Features:
 * - Focus trap in modals and drawers
 * - Return focus after modal close
 * - Focus visible indicators
 * - Skip links
 * - Keyboard navigation helpers
 *
 * @example
 * ```typescript
 * const focusService = inject(FocusManagementService);
 *
 * // Trap focus in modal
 * const trapId = focusService.trapFocus(modalElement);
 *
 * // Restore focus when closing
 * focusService.restoreFocus(trapId);
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class FocusManagementService {
  private focusTraps = new Map<string, FocusTrap>();
  private focusHistory: HTMLElement[] = [];
  private readonly maxHistorySize = 10;
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.setupGlobalListeners();
  }

  /**
   * Trap focus within an element (e.g., modal, drawer)
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
      console.warn('No focusable elements found in trap container');
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

    return trapId;
  }

  /**
   * Release focus trap
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
    if (restoreFocus && trap.previousFocus) {
      trap.previousFocus.focus();
    }

    this.focusTraps.delete(trapId);
  }

  /**
   * Restore focus to previous element
   * @param trapId - Optional trap ID (uses most recent if not provided)
   */
  restoreFocus(trapId?: string): void {
    if (trapId) {
      const trap = this.focusTraps.get(trapId);
      if (trap?.previousFocus) {
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
   * Get all focusable elements within a container
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((el) => {
      // Filter out hidden elements
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
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

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
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
    // Handle Escape key to close modals
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event.key === 'Escape' && this.focusTraps.size > 0) {
          // Find the most recent trap and release it
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

  /**
   * Clear all focus traps
   */
  clearAllTraps(): void {
    this.focusTraps.forEach((trap, id) => {
      this.releaseTrap(id, false);
    });
  }

  /**
   * Get focusable elements count in a container
   */
  getFocusableCount(container: HTMLElement): number {
    return this.getFocusableElements(container).length;
  }
}

interface FocusTrap {
  id: string;
  container: HTMLElement;
  focusableElements: HTMLElement[];
  previousFocus: HTMLElement | null;
  handleKeyDown: (e: KeyboardEvent) => void;
}
