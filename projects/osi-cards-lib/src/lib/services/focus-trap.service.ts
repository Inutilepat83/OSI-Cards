import { Injectable, inject, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Focus Trap Configuration
 */
export interface FocusTrapConfig {
  /** Element to trap focus within */
  element: HTMLElement;
  /** Restore focus to this element when trap is released */
  returnFocusTo?: HTMLElement;
  /** Initial element to focus */
  initialFocus?: HTMLElement | string;
  /** Allow escape key to release trap */
  escapeDeactivates?: boolean;
  /** Callback when escape is pressed */
  onEscape?: () => void;
  /** Callback when focus leaves the trap */
  onFocusOut?: () => void;
}

/**
 * Focusable element selectors
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
  'audio[controls]',
  'video[controls]',
  'details>summary:first-of-type',
  'details',
].join(',');

/**
 * Focus Trap Service
 *
 * Traps focus within a specified element for accessibility.
 * Used for modals, dialogs, and other overlay components.
 *
 * @dependencies
 * - DOCUMENT: For DOM manipulation and focus management
 *
 * @example
 * ```typescript
 * const focusTrap = inject(FocusTrapService);
 *
 * // Activate trap
 * focusTrap.activate({
 *   element: dialogElement,
 *   escapeDeactivates: true,
 *   onEscape: () => this.closeDialog()
 * });
 *
 * // Deactivate when done
 * focusTrap.deactivate();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class FocusTrapService {
  private readonly document = inject(DOCUMENT);
  private activeTraps: FocusTrapConfig[] = [];
  private boundHandleKeydown: ((event: KeyboardEvent) => void) | null = null;
  private boundHandleFocusIn: ((event: FocusEvent) => void) | null = null;

  /**
   * Activate a focus trap
   */
  activate(config: FocusTrapConfig): void {
    const { element, returnFocusTo, initialFocus } = config;

    // Store the currently focused element if no returnFocusTo specified
    const previouslyFocused = returnFocusTo || (this.document.activeElement as HTMLElement);

    // Add to stack
    this.activeTraps.push({
      ...config,
      returnFocusTo: previouslyFocused,
    });

    // Setup event listeners
    this.setupListeners();

    // Focus initial element
    this.focusInitialElement(element, initialFocus);
  }

  /**
   * Deactivate the current focus trap
   */
  deactivate(): void {
    const trap = this.activeTraps.pop();

    if (trap?.returnFocusTo) {
      // Return focus to previous element
      try {
        trap.returnFocusTo.focus();
      } catch {
        // Element may no longer exist
      }
    }

    // Remove listeners if no more traps
    if (this.activeTraps.length === 0) {
      this.removeListeners();
    }
  }

  /**
   * Deactivate all focus traps
   */
  deactivateAll(): void {
    while (this.activeTraps.length > 0) {
      this.deactivate();
    }
  }

  /**
   * Get focusable elements within an element
   */
  getFocusableElements(element: HTMLElement): HTMLElement[] {
    const elements = Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));

    return elements.filter((el) => {
      // Check if visible
      const style = getComputedStyle(el);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !el.hasAttribute('hidden') &&
        el.offsetParent !== null
      );
    });
  }

  /**
   * Focus the first focusable element
   */
  focusFirst(element: HTMLElement): void {
    const focusable = this.getFocusableElements(element);
    focusable[0]?.focus();
  }

  /**
   * Focus the last focusable element
   */
  focusLast(element: HTMLElement): void {
    const focusable = this.getFocusableElements(element);
    focusable[focusable.length - 1]?.focus();
  }

  /**
   * Setup event listeners for active trap
   */
  private setupListeners(): void {
    if (!this.boundHandleKeydown) {
      this.boundHandleKeydown = this.handleKeydown.bind(this);
      this.document.addEventListener('keydown', this.boundHandleKeydown);
    }

    if (!this.boundHandleFocusIn) {
      this.boundHandleFocusIn = this.handleFocusIn.bind(this);
      this.document.addEventListener('focusin', this.boundHandleFocusIn);
    }
  }

  /**
   * Remove event listeners
   */
  private removeListeners(): void {
    if (this.boundHandleKeydown) {
      this.document.removeEventListener('keydown', this.boundHandleKeydown);
      this.boundHandleKeydown = null;
    }

    if (this.boundHandleFocusIn) {
      this.document.removeEventListener('focusin', this.boundHandleFocusIn);
      this.boundHandleFocusIn = null;
    }
  }

  /**
   * Handle keydown events for focus trap
   */
  private handleKeydown(event: KeyboardEvent): void {
    const currentTrap = this.activeTraps[this.activeTraps.length - 1];
    if (!currentTrap) return;

    if (event.key === 'Tab') {
      this.handleTab(event, currentTrap);
    } else if (event.key === 'Escape') {
      this.handleEscape(event, currentTrap);
    }
  }

  /**
   * Handle tab key for focus wrapping
   */
  private handleTab(event: KeyboardEvent, trap: FocusTrapConfig): void {
    const focusable = this.getFocusableElements(trap.element);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!first || !last) return;

    if (event.shiftKey) {
      // Shift+Tab: wrap from first to last
      if (this.document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      // Tab: wrap from last to first
      if (this.document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  /**
   * Handle escape key
   */
  private handleEscape(event: KeyboardEvent, trap: FocusTrapConfig): void {
    if (trap.escapeDeactivates !== false) {
      event.preventDefault();
      trap.onEscape?.();
      this.deactivate();
    }
  }

  /**
   * Handle focus moving outside trap
   */
  private handleFocusIn(event: FocusEvent): void {
    const currentTrap = this.activeTraps[this.activeTraps.length - 1];
    if (!currentTrap) return;

    const target = event.target as HTMLElement;

    if (!currentTrap.element.contains(target)) {
      // Focus escaped - bring it back
      event.preventDefault();
      currentTrap.onFocusOut?.();
      this.focusFirst(currentTrap.element);
    }
  }

  /**
   * Focus initial element in trap
   */
  private focusInitialElement(container: HTMLElement, initialFocus?: HTMLElement | string): void {
    if (initialFocus instanceof HTMLElement) {
      initialFocus.focus();
    } else if (typeof initialFocus === 'string') {
      const element = container.querySelector<HTMLElement>(initialFocus);
      element?.focus();
    } else {
      // Focus first focusable element
      this.focusFirst(container);
    }
  }
}

/**
 * Create a focus trap for an element reference
 */
export function createFocusTrap(
  elementRef: ElementRef<HTMLElement>,
  options?: Partial<FocusTrapConfig>
): FocusTrapConfig {
  return {
    element: elementRef.nativeElement,
    escapeDeactivates: true,
    ...options,
  };
}
