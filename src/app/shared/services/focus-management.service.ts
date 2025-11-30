import { Injectable, inject, NgZone } from '@angular/core';
import { LoggingService } from '../../core/services/logging.service';

/**
 * Focus Management Service
 * 
 * Provides utilities for managing focus and keyboard navigation throughout the application.
 * Helps improve accessibility by ensuring proper focus management in dynamic content.
 * 
 * @example
 * ```typescript
 * const focusService = inject(FocusManagementService);
 * 
 * // Focus an element
 * focusService.focusElement('#my-element');
 * 
 * // Trap focus within a container
 * focusService.trapFocus(containerElement);
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class FocusManagementService {
  private readonly logger = inject(LoggingService);
  private readonly ngZone = inject(NgZone);
  private focusTraps = new Map<HTMLElement, () => void>();

  /**
   * Focus an element by selector or element reference
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
        this.logger.debug(`Focused element: ${typeof target === 'string' ? target : target.tagName}`, 'FocusManagementService');
      } else {
        this.logger.warn(`Element not found: ${target}`, 'FocusManagementService');
      }
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
   * Trap focus within a container element
   * Useful for modals, dialogs, and dropdowns
   * 
   * @param container - Container element to trap focus within
   * @returns Function to release the focus trap
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    
    if (focusableElements.length === 0) {
      this.logger.warn('No focusable elements found in container', 'FocusManagementService');
      return () => {};
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') {
        return;
      }

      if (!firstElement || !lastElement) {
        return;
      }
      
      if (event.shiftKey) {
        // Shift + Tab: move backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: move forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Store cleanup function
    const release = () => {
      container.removeEventListener('keydown', handleKeyDown);
      this.focusTraps.delete(container);
    };

    this.focusTraps.set(container, release);
    this.logger.debug('Focus trap activated', 'FocusManagementService', { container: container.tagName });

    return release;
  }

  /**
   * Release focus trap for a container
   * 
   * @param container - Container element
   */
  releaseFocusTrap(container: HTMLElement): void {
    const release = this.focusTraps.get(container);
    if (release) {
      release();
    }
  }

  /**
   * Get all focusable elements within a container
   * 
   * @param container - Container element
   * @returns Array of focusable elements
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(selector))
      .filter(el => {
        // Check if element is visible
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });
  }

  /**
   * Move focus to next focusable element
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

    const nextIndex = direction === 'next'
      ? (currentIndex + 1) % allFocusable.length
      : currentIndex === 0 ? allFocusable.length - 1 : currentIndex - 1;

    allFocusable[nextIndex]?.focus();
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
}

