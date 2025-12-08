/**
 * Keyboard Shortcuts Documentation Component (Point 61)
 *
 * Displays keyboard shortcuts reference panel accessible via `?` key.
 * Provides comprehensive keyboard navigation help for accessibility.
 *
 * @example
 * ```html
 * <app-keyboard-shortcuts></app-keyboard-shortcuts>
 * ```
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';

// =============================================================================
// TYPES
// =============================================================================

export interface KeyboardShortcut {
  /** Key combination (e.g., 'Ctrl+S', '?', 'Escape') */
  keys: string[];
  /** Description of what the shortcut does */
  description: string;
  /** Category for grouping */
  category: ShortcutCategory;
  /** Whether shortcut is available globally */
  global?: boolean;
  /** Context where shortcut is available */
  context?: string;
}

export type ShortcutCategory = 'navigation' | 'cards' | 'editing' | 'accessibility' | 'general';

// =============================================================================
// SHORTCUT DEFINITIONS
// =============================================================================

const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  {
    keys: ['Tab'],
    description: 'Move focus to next interactive element',
    category: 'navigation',
    global: true,
  },
  {
    keys: ['Shift', 'Tab'],
    description: 'Move focus to previous interactive element',
    category: 'navigation',
    global: true,
  },
  {
    keys: ['Enter', 'Space'],
    description: 'Activate focused button or link',
    category: 'navigation',
    global: true,
  },
  {
    keys: ['Escape'],
    description: 'Close modal, menu, or cancel action',
    category: 'navigation',
    global: true,
  },
  {
    keys: ['Home'],
    description: 'Go to first item in list',
    category: 'navigation',
  },
  {
    keys: ['End'],
    description: 'Go to last item in list',
    category: 'navigation',
  },

  // Cards
  {
    keys: ['↑', '↓'],
    description: 'Navigate between cards vertically',
    category: 'cards',
    context: 'Card grid',
  },
  {
    keys: ['←', '→'],
    description: 'Navigate between cards horizontally',
    category: 'cards',
    context: 'Card grid',
  },
  {
    keys: ['Enter'],
    description: 'Expand/collapse card details',
    category: 'cards',
    context: 'Card focused',
  },
  {
    keys: ['Ctrl', 'Enter'],
    description: 'Open card in new tab',
    category: 'cards',
    context: 'Card focused',
  },

  // Editing
  {
    keys: ['Ctrl', 'S'],
    description: 'Save current changes',
    category: 'editing',
    context: 'Editor',
  },
  {
    keys: ['Ctrl', 'Z'],
    description: 'Undo last action',
    category: 'editing',
    context: 'Editor',
  },
  {
    keys: ['Ctrl', 'Shift', 'Z'],
    description: 'Redo last action',
    category: 'editing',
    context: 'Editor',
  },
  {
    keys: ['Ctrl', 'C'],
    description: 'Copy selected card configuration',
    category: 'editing',
    context: 'Card selected',
  },
  {
    keys: ['Ctrl', 'V'],
    description: 'Paste card configuration',
    category: 'editing',
    context: 'Editor',
  },

  // Accessibility
  {
    keys: ['?'],
    description: 'Open keyboard shortcuts panel',
    category: 'accessibility',
    global: true,
  },
  {
    keys: ['Alt', '1'],
    description: 'Skip to main content',
    category: 'accessibility',
    global: true,
  },
  {
    keys: ['Alt', '2'],
    description: 'Skip to navigation',
    category: 'accessibility',
    global: true,
  },
  {
    keys: ['Ctrl', 'Alt', 'H'],
    description: 'Toggle high contrast mode',
    category: 'accessibility',
    global: true,
  },

  // General
  {
    keys: ['/'],
    description: 'Focus search input',
    category: 'general',
    global: true,
  },
  {
    keys: ['Ctrl', 'K'],
    description: 'Open command palette',
    category: 'general',
    global: true,
  },
  {
    keys: ['F1'],
    description: 'Open help documentation',
    category: 'general',
    global: true,
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

@Component({
  selector: 'app-keyboard-shortcuts',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div
        class="shortcuts-overlay"
        (click)="close()"
        (keydown.escape)="close()"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div class="shortcuts-panel" (click)="$event.stopPropagation()" tabindex="-1" #panel>
          <header class="shortcuts-header">
            <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
            <button class="close-button" (click)="close()" aria-label="Close keyboard shortcuts">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div class="shortcuts-content">
            @for (category of categories(); track category.id) {
              <section class="shortcut-category">
                <h3 class="category-title">{{ category.label }}</h3>
                <ul class="shortcut-list" role="list">
                  @for (
                    shortcut of getShortcutsByCategory(category.id);
                    track shortcut.description
                  ) {
                    <li class="shortcut-item">
                      <span class="shortcut-keys">
                        @for (key of shortcut.keys; track key; let last = $last) {
                          <kbd class="key">{{ formatKey(key) }}</kbd>
                          @if (!last) {
                            <span class="key-separator">+</span>
                          }
                        }
                      </span>
                      <span class="shortcut-description">
                        {{ shortcut.description }}
                        @if (shortcut.context) {
                          <span class="shortcut-context">({{ shortcut.context }})</span>
                        }
                      </span>
                    </li>
                  }
                </ul>
              </section>
            }
          </div>

          <footer class="shortcuts-footer">
            <p>Press <kbd>?</kbd> to toggle this panel</p>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .shortcuts-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.15s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .shortcuts-panel {
        background: var(--osi-color-background, #fff);
        border-radius: 12px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        max-width: 700px;
        max-height: 80vh;
        width: 90%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.2s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .shortcuts-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--osi-color-border, #e5e7eb);
      }

      .shortcuts-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--osi-color-text, #111827);
      }

      .close-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        border-radius: 8px;
        cursor: pointer;
        color: var(--osi-color-text-secondary, #6b7280);
        transition:
          background-color 0.15s,
          color 0.15s;
      }

      .close-button:hover {
        background: var(--osi-color-background-soft, #f3f4f6);
        color: var(--osi-color-text, #111827);
      }

      .close-button:focus-visible {
        outline: 2px solid var(--osi-color-brand, #ff7900);
        outline-offset: 2px;
      }

      .shortcuts-content {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
      }

      .shortcut-category {
        min-width: 0;
      }

      .category-title {
        margin: 0 0 0.75rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--osi-color-text-secondary, #6b7280);
      }

      .shortcut-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .shortcut-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--osi-color-border, #e5e7eb);
      }

      .shortcut-item:last-child {
        border-bottom: none;
      }

      .shortcut-keys {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex-shrink: 0;
      }

      .key {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.75rem;
        height: 1.75rem;
        padding: 0 0.5rem;
        font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, monospace;
        font-size: 0.75rem;
        font-weight: 500;
        background: var(--osi-color-background-soft, #f3f4f6);
        border: 1px solid var(--osi-color-border, #e5e7eb);
        border-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        color: var(--osi-color-text, #111827);
      }

      .key-separator {
        font-size: 0.75rem;
        color: var(--osi-color-text-secondary, #6b7280);
      }

      .shortcut-description {
        font-size: 0.875rem;
        color: var(--osi-color-text, #111827);
        text-align: right;
      }

      .shortcut-context {
        font-size: 0.75rem;
        color: var(--osi-color-text-secondary, #6b7280);
        margin-left: 0.25rem;
      }

      .shortcuts-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--osi-color-border, #e5e7eb);
        text-align: center;
      }

      .shortcuts-footer p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--osi-color-text-secondary, #6b7280);
      }

      .shortcuts-footer kbd {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.5rem;
        height: 1.5rem;
        padding: 0 0.375rem;
        font-family: inherit;
        font-size: 0.75rem;
        font-weight: 500;
        background: var(--osi-color-background-soft, #f3f4f6);
        border: 1px solid var(--osi-color-border, #e5e7eb);
        border-radius: 4px;
      }

      @media (prefers-reduced-motion: reduce) {
        .shortcuts-overlay,
        .shortcuts-panel {
          animation: none;
        }
      }

      @media (prefers-color-scheme: dark) {
        .shortcuts-panel {
          background: #1f2937;
        }

        .shortcuts-header h2,
        .shortcut-description,
        .key {
          color: #f9fafb;
        }

        .category-title,
        .shortcut-context,
        .shortcuts-footer p,
        .key-separator {
          color: #9ca3af;
        }

        .key,
        .shortcuts-footer kbd {
          background: #374151;
          border-color: #4b5563;
        }

        .shortcuts-header,
        .shortcuts-footer,
        .shortcut-item {
          border-color: #374151;
        }

        .close-button:hover {
          background: #374151;
          color: #f9fafb;
        }
      }
    `,
  ],
})
export class KeyboardShortcutsComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);

  /** Whether the panel is open */
  isOpen = signal(false);

  /** Available shortcut categories */
  categories = computed(() => [
    { id: 'navigation' as const, label: 'Navigation' },
    { id: 'cards' as const, label: 'Cards' },
    { id: 'editing' as const, label: 'Editing' },
    { id: 'accessibility' as const, label: 'Accessibility' },
    { id: 'general' as const, label: 'General' },
  ]);

  /** All shortcuts */
  private readonly shortcuts = KEYBOARD_SHORTCUTS;

  ngOnInit(): void {
    // Focus trap when open
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  /**
   * Handle global keydown events
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    // Toggle with ? key
    if (event.key === '?' && !this.isInputFocused()) {
      event.preventDefault();
      this.toggle();
      return;
    }

    // Close with Escape
    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      this.close();
      return;
    }
  }

  /**
   * Toggle the shortcuts panel
   */
  toggle(): void {
    this.isOpen.update((open) => !open);
  }

  /**
   * Open the shortcuts panel
   */
  open(): void {
    this.isOpen.set(true);
  }

  /**
   * Close the shortcuts panel
   */
  close(): void {
    this.isOpen.set(false);
  }

  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category: ShortcutCategory): KeyboardShortcut[] {
    return this.shortcuts.filter((s) => s.category === category);
  }

  /**
   * Format key for display
   */
  formatKey(key: string): string {
    const keyMap: Record<string, string> = {
      Ctrl: '⌘',
      Alt: '⌥',
      Shift: '⇧',
      Enter: '↵',
      Escape: 'Esc',
      Space: '␣',
      Tab: '⇥',
      ArrowUp: '↑',
      ArrowDown: '↓',
      ArrowLeft: '←',
      ArrowRight: '→',
    };

    // Use Mac symbols on Mac
    if (this.isMac()) {
      return keyMap[key] || key;
    }

    return key;
  }

  /**
   * Check if an input element is focused
   */
  private isInputFocused(): boolean {
    const activeElement = this.document.activeElement;
    if (!activeElement) {
      return false;
    }

    const tagName = activeElement.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      (activeElement as HTMLElement).isContentEditable
    );
  }

  /**
   * Check if running on Mac
   */
  private isMac(): boolean {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  }
}
