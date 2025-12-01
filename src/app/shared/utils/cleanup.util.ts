/**
 * Cleanup utilities for proper resource management
 * Ensures all subscriptions, timers, and event listeners are properly cleaned up
 */

export type CleanupFunction = () => void;

/**
 * Cleanup manager for tracking and executing cleanup functions
 */
export class CleanupManager {
  private cleanupFunctions: CleanupFunction[] = [];

  /**
   * Add a cleanup function
   */
  add(cleanup: CleanupFunction): void {
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Execute all cleanup functions
   */
  cleanup(): void {
    this.cleanupFunctions.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    this.cleanupFunctions = [];
  }

  /**
   * Get cleanup function count
   */
  get size(): number {
    return this.cleanupFunctions.length;
  }
}

/**
 * Create a cleanup function for a subscription
 */
export function createSubscriptionCleanup(subscription: {
  unsubscribe: () => void;
}): CleanupFunction {
  return () => subscription.unsubscribe();
}

/**
 * Create a cleanup function for a timer
 */
export function createTimerCleanup(
  timerId: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>
): CleanupFunction {
  return () => {
    if (typeof timerId === 'number') {
      clearTimeout(timerId);
      clearInterval(timerId);
    }
  };
}

/**
 * Create a cleanup function for an event listener
 */
export function createEventListenerCleanup(
  target: EventTarget,
  event: string,
  handler: EventListener
): CleanupFunction {
  return () => target.removeEventListener(event, handler);
}

/**
 * Create a cleanup function for an AbortController
 */
export function createAbortControllerCleanup(controller: AbortController): CleanupFunction {
  return () => controller.abort();
}
