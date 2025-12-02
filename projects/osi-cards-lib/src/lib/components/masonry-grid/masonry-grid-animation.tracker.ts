/**
 * Masonry Grid Animation Tracker
 *
 * Manages animation state for sections during streaming mode.
 * Tracks which sections are new, which have been rendered, and which have completed animations.
 *
 * Extracted from masonry-grid.component.ts for better separation of concerns.
 */

import { CardSection } from '../../models';

export interface PositionedSectionWithAnimation {
  key: string;
  section: CardSection;
  isNew?: boolean;
  hasAnimated?: boolean;
}

export class MasonryGridAnimationTracker {
  /**
   * Track sections that have already been rendered.
   * Prevents re-animating existing sections when new ones are added during streaming.
   * IMPORTANT: This set is PERSISTENT across streaming sessions - only cleared when
   * sections are completely replaced (not when streaming starts/stops).
   */
  private renderedSectionKeys = new Set<string>();

  /**
   * Track section IDs from previous update to detect truly new sections.
   * Used to determine which sections should animate on entrance.
   */
  private previousSectionIds = new Set<string>();

  /**
   * Track section keys that have completed their entrance animation.
   * This prevents sections from re-animating when the component re-renders.
   * CRITICAL: This set prevents the "first section blinking" issue by ensuring
   * animations only play once per section.
   */
  private animatedSectionKeys = new Set<string>();

  /**
   * Track previous streaming state to detect transitions
   */
  private previousStreamingState = false;

  /**
   * Check if streaming state has changed
   */
  updateStreamingState(isStreaming: boolean): { started: boolean; ended: boolean } {
    const wasStreaming = this.previousStreamingState;
    const nowStreaming = isStreaming;

    this.previousStreamingState = nowStreaming;

    return {
      started: !wasStreaming && nowStreaming,
      ended: wasStreaming && !nowStreaming
    };
  }

  /**
   * Finalize all section animations when streaming ends
   */
  finalizeStreamingAnimations(): void {
    // Mark all sections as animated when streaming completes
    this.renderedSectionKeys.forEach(key => {
      this.animatedSectionKeys.add(key);
    });
  }

  /**
   * Detect if this is a completely new card (different section IDs)
   */
  detectNewCard(
    previousSections: CardSection[] | undefined,
    currentSections: CardSection[] | undefined
  ): boolean {
    if (!previousSections || previousSections.length === 0) {
      return true; // First render
    }

    if (!currentSections || currentSections.length === 0) {
      return false; // Empty state
    }

    // Check if any current section ID exists in previous sections
    const previousIds = new Set<string>();
    for (const section of previousSections) {
      if (section.id) {
        previousIds.add(section.id);
      }
    }

    // If no previous IDs, use title-based comparison
    if (previousIds.size === 0) {
      const previousTitles = new Set(
        previousSections.map(s => s.title || '').filter(t => t)
      );
      const hasOverlap = currentSections.some(
        s => s.title && previousTitles.has(s.title)
      );
      return !hasOverlap;
    }

    // Check for ID overlap - if ANY current section has an ID from previous, it's the same card
    for (const section of currentSections) {
      if (section.id && previousIds.has(section.id)) {
        return false; // Same card - found overlap
      }
    }

    return true; // No overlap = new card
  }

  /**
   * Update the previousSectionIds set with current section IDs
   */
  updatePreviousSectionIds(sections: CardSection[] | undefined): void {
    this.previousSectionIds.clear();
    if (!sections) return;

    for (const section of sections) {
      if (section.id) {
        this.previousSectionIds.add(section.id);
      }
    }
  }

  /**
   * Check if a section is truly new (not seen before in this streaming session)
   */
  isTrulyNewSection(section: CardSection, generatedKey: string): boolean {
    // Check by section.id first (most stable)
    if (section.id && this.renderedSectionKeys.has(section.id)) {
      return false;
    }

    // Check by generated key as fallback
    if (this.renderedSectionKeys.has(generatedKey)) {
      return false;
    }

    return true;
  }

  /**
   * Mark a section as rendered (won't animate again)
   */
  markSectionRendered(section: CardSection, generatedKey: string): void {
    // Add both section.id and generated key to ensure no re-animation
    if (section.id) {
      this.renderedSectionKeys.add(section.id);
    }
    this.renderedSectionKeys.add(generatedKey);
  }

  /**
   * Check if a section should animate its entrance
   */
  shouldAnimate(key: string, isStreaming: boolean): boolean {
    // Only animate during streaming and only if not already animated
    return isStreaming && !this.animatedSectionKeys.has(key);
  }

  /**
   * Mark a section as having completed its animation
   */
  markAnimationComplete(key: string): void {
    if (key) {
      this.animatedSectionKeys.add(key);
    }
  }

  /**
   * Check if a section has completed its entrance animation
   */
  hasAnimated(key: string): boolean {
    return this.animatedSectionKeys.has(key);
  }

  /**
   * Clear all animation tracking (for new card)
   */
  clearAll(): void {
    this.renderedSectionKeys.clear();
    this.previousSectionIds.clear();
    this.animatedSectionKeys.clear();
  }

  /**
   * Clear only animation completion tracking (keeps rendered tracking)
   */
  clearAnimationState(): void {
    this.animatedSectionKeys.clear();
  }

  /**
   * Get statistics for debugging
   */
  getStats(): {
    rendered: number;
    animated: number;
    previousIds: number;
  } {
    return {
      rendered: this.renderedSectionKeys.size,
      animated: this.animatedSectionKeys.size,
      previousIds: this.previousSectionIds.size
    };
  }
}

