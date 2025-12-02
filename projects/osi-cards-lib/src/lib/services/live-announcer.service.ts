import { Injectable, inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * ARIA live region politeness setting
 */
export type AriaLivePoliteness = 'off' | 'polite' | 'assertive';

/**
 * Live Announcer Service
 *
 * Provides screen reader announcements using ARIA live regions.
 * Used to announce dynamic content changes, loading states,
 * and important updates to assistive technology users.
 *
 * @example
 * ```typescript
 * const announcer = inject(LiveAnnouncerService);
 *
 * // Announce politely (waits for pause in speech)
 * announcer.announce('Card loaded successfully');
 *
 * // Announce immediately (interrupts current speech)
 * announcer.announce('Error loading card', 'assertive');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class LiveAnnouncerService implements OnDestroy {
  private readonly document = inject(DOCUMENT);

  /** Live region elements for different politeness levels */
  private liveElements = new Map<AriaLivePoliteness, HTMLElement>();

  /** Duration to show announcement before clearing */
  private readonly clearDelay = 150;

  /** Pending clear timeout */
  private clearTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.createLiveRegions();
  }

  ngOnDestroy(): void {
    this.clearTimeout && clearTimeout(this.clearTimeout);
    this.removeLiveRegions();
  }

  /**
   * Announce a message to screen readers
   *
   * @param message The message to announce
   * @param politeness Politeness level: 'polite' (default) or 'assertive'
   * @param duration Optional duration before clearing (ms)
   * @returns Promise that resolves when announcement starts
   */
  announce(
    message: string,
    politeness: AriaLivePoliteness = 'polite',
    duration?: number
  ): Promise<void> {
    return new Promise(resolve => {
      const element = this.liveElements.get(politeness);
      if (!element) {
        resolve();
        return;
      }

      // Clear any pending timeout
      if (this.clearTimeout) {
        clearTimeout(this.clearTimeout);
      }

      // Clear previous content first (forces re-announcement)
      element.textContent = '';

      // Set new content after brief delay
      requestAnimationFrame(() => {
        element.textContent = message;
        resolve();

        // Clear after specified duration
        const clearAfter = duration ?? this.clearDelay + message.length * 50;
        this.clearTimeout = setTimeout(() => {
          element.textContent = '';
        }, clearAfter);
      });
    });
  }

  /**
   * Announce politely (waits for pause in speech)
   */
  announcePolite(message: string): Promise<void> {
    return this.announce(message, 'polite');
  }

  /**
   * Announce assertively (interrupts current speech)
   */
  announceAssertive(message: string): Promise<void> {
    return this.announce(message, 'assertive');
  }

  /**
   * Announce loading state
   */
  announceLoading(itemName?: string): Promise<void> {
    const message = itemName ? `Loading ${itemName}...` : 'Loading...';
    return this.announce(message, 'polite');
  }

  /**
   * Announce loaded state
   */
  announceLoaded(itemName?: string): Promise<void> {
    const message = itemName ? `${itemName} loaded` : 'Content loaded';
    return this.announce(message, 'polite');
  }

  /**
   * Announce error state
   */
  announceError(error?: string): Promise<void> {
    const message = error || 'An error occurred';
    return this.announce(message, 'assertive');
  }

  /**
   * Announce navigation/focus change
   */
  announceNavigation(destination: string): Promise<void> {
    return this.announce(`Navigated to ${destination}`, 'polite');
  }

  /**
   * Announce form validation error
   */
  announceValidationError(fieldName: string, error: string): Promise<void> {
    return this.announce(`${fieldName}: ${error}`, 'assertive');
  }

  /**
   * Announce a list of items
   */
  announceList(count: number, itemType: string): Promise<void> {
    const pluralized = count === 1 ? itemType : `${itemType}s`;
    return this.announce(`${count} ${pluralized} found`, 'polite');
  }

  /**
   * Announce selection change
   */
  announceSelection(itemName: string, selected: boolean): Promise<void> {
    const action = selected ? 'selected' : 'deselected';
    return this.announce(`${itemName} ${action}`, 'polite');
  }

  /**
   * Announce expansion state change
   */
  announceExpansion(itemName: string, expanded: boolean): Promise<void> {
    const state = expanded ? 'expanded' : 'collapsed';
    return this.announce(`${itemName} ${state}`, 'polite');
  }

  /**
   * Clear all announcements
   */
  clear(): void {
    if (this.clearTimeout) {
      clearTimeout(this.clearTimeout);
    }
    this.liveElements.forEach(element => {
      element.textContent = '';
    });
  }

  /**
   * Create live region elements
   */
  private createLiveRegions(): void {
    const politenessLevels: AriaLivePoliteness[] = ['polite', 'assertive'];

    politenessLevels.forEach(politeness => {
      const element = this.document.createElement('div');

      // Make visually hidden but accessible to screen readers
      Object.assign(element.style, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0'
      });

      // Set ARIA attributes
      element.setAttribute('aria-live', politeness);
      element.setAttribute('aria-atomic', 'true');
      element.setAttribute('role', 'status');
      element.id = `osi-cards-live-${politeness}`;

      // Add to document
      this.document.body.appendChild(element);
      this.liveElements.set(politeness, element);
    });
  }

  /**
   * Remove live region elements
   */
  private removeLiveRegions(): void {
    this.liveElements.forEach(element => {
      element.remove();
    });
    this.liveElements.clear();
  }
}



