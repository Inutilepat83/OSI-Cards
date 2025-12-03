/**
 * Keyboard Utilities
 *
 * Utilities for keyboard navigation and shortcuts.
 *
 * @example
 * ```typescript
 * import { onKeyPress, createShortcut } from '@osi-cards/utils';
 *
 * onKeyPress('Escape', () => closeModal());
 * createShortcut('ctrl+s', () => save());
 * ```
 */

export type KeyboardModifier = 'ctrl' | 'shift' | 'alt' | 'meta';

export interface ShortcutOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * Listen for specific key
 */
export function onKeyPress(key: string, callback: (e: KeyboardEvent) => void): () => void {
  const handler = (e: KeyboardEvent): void => {
    if (e.key === key) {
      callback(e);
    }
  };

  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}

/**
 * Create keyboard shortcut
 */
export function createShortcut(
  combination: string,
  callback: () => void,
  options: ShortcutOptions = {}
): () => void {
  const parts = combination.toLowerCase().split('+');
  const modifiers = parts.slice(0, -1) as KeyboardModifier[];
  const key = parts[parts.length - 1];

  const handler = (e: KeyboardEvent): void => {
    const hasModifiers = modifiers.every(mod => {
      switch (mod) {
        case 'ctrl': return e.ctrlKey;
        case 'shift': return e.shiftKey;
        case 'alt': return e.altKey;
        case 'meta': return e.metaKey;
        default: return false;
      }
    });

    if (hasModifiers && e.key.toLowerCase() === key) {
      if (options.preventDefault) e.preventDefault();
      if (options.stopPropagation) e.stopPropagation();
      callback();
    }
  };

  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}

/**
 * Check if key is modifier
 */
export function isModifierKey(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.shiftKey || e.altKey || e.metaKey;
}

/**
 * Get key name
 */
export function getKeyName(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  if (e.metaKey) parts.push('Meta');
  parts.push(e.key);
  return parts.join('+');
}

/**
 * Navigate focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selector));
}

/**
 * Focus first element
 */
export function focusFirst(container: HTMLElement): void {
  const elements = getFocusableElements(container);
  elements[0]?.focus();
}

/**
 * Focus last element
 */
export function focusLast(container: HTMLElement): void {
  const elements = getFocusableElements(container);
  elements[elements.length - 1]?.focus();
}

/**
 * Focus next element
 */
export function focusNext(container: HTMLElement): void {
  const elements = getFocusableElements(container);
  const current = document.activeElement;
  const currentIndex = elements.indexOf(current as HTMLElement);

  if (currentIndex < elements.length - 1) {
    elements[currentIndex + 1].focus();
  }
}

/**
 * Focus previous element
 */
export function focusPrevious(container: HTMLElement): void {
  const elements = getFocusableElements(container);
  const current = document.activeElement;
  const currentIndex = elements.indexOf(current as HTMLElement);

  if (currentIndex > 0) {
    elements[currentIndex - 1].focus();
  }
}

/**
 * Trap focus within container
 */
export function trapFocus(container: HTMLElement): () => void {
  const handler = (e: KeyboardEvent): void => {
    if (e.key === 'Tab') {
      const elements = getFocusableElements(container);
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  };

  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
}

