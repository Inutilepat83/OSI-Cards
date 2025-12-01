/**
 * Keyboard Shortcuts Directive (Improvement #70)
 * 
 * Provides customizable keyboard shortcuts for card interactions.
 * Supports navigation, actions, and accessibility features.
 * 
 * @example
 * ```html
 * <osi-card 
 *   osiKeyboardShortcuts
 *   [shortcuts]="customShortcuts"
 *   (shortcutTriggered)="onShortcut($event)">
 * </osi-card>
 * ```
 */

import {
  Directive,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Modifier keys
 */
export interface ModifierKeys {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Unique identifier */
  id: string;
  /** Key to press (e.g., 'Enter', 'Escape', 'a', 'ArrowDown') */
  key: string;
  /** Modifier keys required */
  modifiers?: ModifierKeys;
  /** Human-readable description */
  description: string;
  /** Action to perform */
  action: string;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether the shortcut is enabled */
  enabled?: boolean;
  /** Context/scope for the shortcut */
  scope?: 'card' | 'section' | 'grid' | 'global';
}

/**
 * Shortcut triggered event
 */
export interface ShortcutTriggeredEvent {
  shortcut: KeyboardShortcut;
  originalEvent: KeyboardEvent;
  target: HTMLElement;
}

/**
 * Shortcut configuration preset
 */
export type ShortcutPreset = 'default' | 'vim' | 'accessibility' | 'minimal';

// ============================================================================
// DEFAULT SHORTCUTS
// ============================================================================

/**
 * Default keyboard shortcuts
 */
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  {
    id: 'nav-next-card',
    key: 'ArrowDown',
    description: 'Navigate to next card',
    action: 'navigate:next-card',
    scope: 'grid'
  },
  {
    id: 'nav-prev-card',
    key: 'ArrowUp',
    description: 'Navigate to previous card',
    action: 'navigate:prev-card',
    scope: 'grid'
  },
  {
    id: 'nav-next-section',
    key: 'ArrowDown',
    description: 'Navigate to next section',
    action: 'navigate:next-section',
    scope: 'card'
  },
  {
    id: 'nav-prev-section',
    key: 'ArrowUp',
    description: 'Navigate to previous section',
    action: 'navigate:prev-section',
    scope: 'card'
  },
  {
    id: 'nav-first',
    key: 'Home',
    description: 'Go to first item',
    action: 'navigate:first'
  },
  {
    id: 'nav-last',
    key: 'End',
    description: 'Go to last item',
    action: 'navigate:last'
  },

  // Actions
  {
    id: 'action-expand',
    key: 'Enter',
    description: 'Expand/activate current item',
    action: 'action:expand'
  },
  {
    id: 'action-collapse',
    key: 'Escape',
    description: 'Collapse/close current item',
    action: 'action:collapse'
  },
  {
    id: 'action-copy',
    key: 'c',
    modifiers: { ctrl: true },
    description: 'Copy current content',
    action: 'action:copy',
    preventDefault: true
  },
  {
    id: 'action-select-all',
    key: 'a',
    modifiers: { ctrl: true },
    description: 'Select all',
    action: 'action:select-all',
    preventDefault: true
  },

  // Accessibility
  {
    id: 'a11y-announce',
    key: 'i',
    modifiers: { alt: true },
    description: 'Announce current card info',
    action: 'a11y:announce'
  },
  {
    id: 'a11y-help',
    key: '?',
    modifiers: { shift: true },
    description: 'Show keyboard shortcuts help',
    action: 'a11y:help'
  },

  // Search
  {
    id: 'search-focus',
    key: '/',
    description: 'Focus search',
    action: 'search:focus',
    scope: 'global'
  },
  {
    id: 'search-clear',
    key: 'Escape',
    description: 'Clear search and close',
    action: 'search:clear',
    scope: 'global'
  }
];

/**
 * Vim-style shortcuts preset
 */
export const VIM_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: 'vim-down',
    key: 'j',
    description: 'Move down',
    action: 'navigate:next'
  },
  {
    id: 'vim-up',
    key: 'k',
    description: 'Move up',
    action: 'navigate:prev'
  },
  {
    id: 'vim-left',
    key: 'h',
    description: 'Move left',
    action: 'navigate:left'
  },
  {
    id: 'vim-right',
    key: 'l',
    description: 'Move right',
    action: 'navigate:right'
  },
  {
    id: 'vim-top',
    key: 'g',
    modifiers: { shift: false },
    description: 'Go to top',
    action: 'navigate:first'
  },
  {
    id: 'vim-bottom',
    key: 'G',
    modifiers: { shift: true },
    description: 'Go to bottom',
    action: 'navigate:last'
  },
  {
    id: 'vim-open',
    key: 'o',
    description: 'Open/expand',
    action: 'action:expand'
  },
  {
    id: 'vim-close',
    key: 'q',
    description: 'Close/collapse',
    action: 'action:collapse'
  }
];

/**
 * Accessibility-focused shortcuts preset
 */
export const ACCESSIBILITY_SHORTCUTS: KeyboardShortcut[] = [
  ...DEFAULT_SHORTCUTS,
  {
    id: 'a11y-toggle-high-contrast',
    key: 'h',
    modifiers: { alt: true },
    description: 'Toggle high contrast mode',
    action: 'a11y:toggle-high-contrast'
  },
  {
    id: 'a11y-toggle-reduced-motion',
    key: 'm',
    modifiers: { alt: true },
    description: 'Toggle reduced motion',
    action: 'a11y:toggle-reduced-motion'
  },
  {
    id: 'a11y-increase-font',
    key: '+',
    modifiers: { ctrl: true },
    description: 'Increase font size',
    action: 'a11y:increase-font',
    preventDefault: true
  },
  {
    id: 'a11y-decrease-font',
    key: '-',
    modifiers: { ctrl: true },
    description: 'Decrease font size',
    action: 'a11y:decrease-font',
    preventDefault: true
  }
];

// ============================================================================
// KEYBOARD SHORTCUTS DIRECTIVE
// ============================================================================

@Directive({
  selector: '[osiKeyboardShortcuts]',
  standalone: true,
  exportAs: 'osiKeyboardShortcuts'
})
export class KeyboardShortcutsDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  
  /**
   * Custom shortcuts to register
   */
  @Input() shortcuts: KeyboardShortcut[] = [];
  
  /**
   * Use a preset configuration
   */
  @Input() preset: ShortcutPreset = 'default';
  
  /**
   * Enable/disable shortcuts
   */
  @Input() enabled = true;
  
  /**
   * Current scope for shortcuts
   */
  @Input() scope: KeyboardShortcut['scope'] = 'card';
  
  /**
   * Allow shortcuts in input elements
   */
  @Input() allowInInputs = false;
  
  /**
   * Emitted when a shortcut is triggered
   */
  @Output() shortcutTriggered = new EventEmitter<ShortcutTriggeredEvent>();
  
  /**
   * Emitted when help is requested
   */
  @Output() helpRequested = new EventEmitter<void>();
  
  private activeShortcuts: KeyboardShortcut[] = [];
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.initializeShortcuts();
    this.attachEventListener();
  }
  
  ngOnDestroy(): void {
    this.detachEventListener();
  }
  
  /**
   * Initialize shortcuts based on preset and custom shortcuts
   */
  private initializeShortcuts(): void {
    let presetShortcuts: KeyboardShortcut[] = [];
    
    switch (this.preset) {
      case 'vim':
        presetShortcuts = VIM_SHORTCUTS;
        break;
      case 'accessibility':
        presetShortcuts = ACCESSIBILITY_SHORTCUTS;
        break;
      case 'minimal':
        presetShortcuts = DEFAULT_SHORTCUTS.filter(s => 
          ['nav-next-card', 'nav-prev-card', 'action-expand', 'action-collapse'].includes(s.id)
        );
        break;
      case 'default':
      default:
        presetShortcuts = DEFAULT_SHORTCUTS;
    }
    
    // Merge preset with custom shortcuts (custom takes precedence)
    const shortcutMap = new Map<string, KeyboardShortcut>();
    
    for (const shortcut of presetShortcuts) {
      shortcutMap.set(shortcut.id, { ...shortcut, enabled: shortcut.enabled ?? true });
    }
    
    for (const shortcut of this.shortcuts) {
      shortcutMap.set(shortcut.id, { ...shortcut, enabled: shortcut.enabled ?? true });
    }
    
    this.activeShortcuts = Array.from(shortcutMap.values());
  }
  
  /**
   * Attach keyboard event listener
   */
  private attachEventListener(): void {
    this.keydownHandler = (e: KeyboardEvent) => this.handleKeydown(e);
    this.el.nativeElement.addEventListener('keydown', this.keydownHandler);
    
    // Make element focusable if it isn't already
    if (!this.el.nativeElement.hasAttribute('tabindex')) {
      this.el.nativeElement.setAttribute('tabindex', '0');
    }
  }
  
  /**
   * Detach keyboard event listener
   */
  private detachEventListener(): void {
    if (this.keydownHandler) {
      this.el.nativeElement.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }
  
  /**
   * Handle keydown events
   */
  private handleKeydown(event: KeyboardEvent): void {
    if (!this.enabled) return;
    
    // Check if we're in an input element
    const target = event.target as HTMLElement;
    if (!this.allowInInputs && this.isInputElement(target)) {
      // Allow some shortcuts even in inputs
      if (!['Escape', 'Tab'].includes(event.key)) {
        return;
      }
    }
    
    // Find matching shortcut
    const shortcut = this.findMatchingShortcut(event);
    
    if (shortcut) {
      if (shortcut.preventDefault) {
        event.preventDefault();
      }
      
      // Handle help action specially
      if (shortcut.action === 'a11y:help') {
        this.helpRequested.emit();
        return;
      }
      
      this.shortcutTriggered.emit({
        shortcut,
        originalEvent: event,
        target
      });
    }
  }
  
  /**
   * Find a shortcut that matches the key event
   */
  private findMatchingShortcut(event: KeyboardEvent): KeyboardShortcut | null {
    for (const shortcut of this.activeShortcuts) {
      if (!shortcut.enabled) continue;
      
      // Check scope
      if (shortcut.scope && shortcut.scope !== this.scope && shortcut.scope !== 'global') {
        continue;
      }
      
      // Check key
      if (this.normalizeKey(event.key) !== this.normalizeKey(shortcut.key)) {
        continue;
      }
      
      // Check modifiers
      if (!this.checkModifiers(event, shortcut.modifiers)) {
        continue;
      }
      
      return shortcut;
    }
    
    return null;
  }
  
  /**
   * Check if modifier keys match
   */
  private checkModifiers(event: KeyboardEvent, modifiers?: ModifierKeys): boolean {
    if (!modifiers) {
      // No modifiers required - make sure none are pressed (except Shift for special chars)
      return !event.ctrlKey && !event.altKey && !event.metaKey;
    }
    
    return (
      (modifiers.ctrl ?? false) === event.ctrlKey &&
      (modifiers.alt ?? false) === event.altKey &&
      (modifiers.shift ?? false) === event.shiftKey &&
      (modifiers.meta ?? false) === event.metaKey
    );
  }
  
  /**
   * Normalize key names
   */
  private normalizeKey(key: string): string {
    // Handle common key name variations
    const keyMap: Record<string, string> = {
      'esc': 'escape',
      'return': 'enter',
      'spacebar': ' ',
      'up': 'arrowup',
      'down': 'arrowdown',
      'left': 'arrowleft',
      'right': 'arrowright'
    };
    
    const normalized = key.toLowerCase();
    return keyMap[normalized] || normalized;
  }
  
  /**
   * Check if element is an input element
   */
  private isInputElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      element.isContentEditable
    );
  }
  
  /**
   * Get all active shortcuts for display
   */
  getActiveShortcuts(): KeyboardShortcut[] {
    return this.activeShortcuts.filter(s => s.enabled);
  }
  
  /**
   * Enable a specific shortcut
   */
  enableShortcut(id: string): void {
    const shortcut = this.activeShortcuts.find(s => s.id === id);
    if (shortcut) {
      shortcut.enabled = true;
    }
  }
  
  /**
   * Disable a specific shortcut
   */
  disableShortcut(id: string): void {
    const shortcut = this.activeShortcuts.find(s => s.id === id);
    if (shortcut) {
      shortcut.enabled = false;
    }
  }
  
  /**
   * Add a new shortcut dynamically
   */
  addShortcut(shortcut: KeyboardShortcut): void {
    this.activeShortcuts.push({ ...shortcut, enabled: shortcut.enabled ?? true });
  }
  
  /**
   * Remove a shortcut
   */
  removeShortcut(id: string): void {
    const index = this.activeShortcuts.findIndex(s => s.id === id);
    if (index !== -1) {
      this.activeShortcuts.splice(index, 1);
    }
  }
  
  /**
   * Format shortcut for display
   */
  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    
    if (shortcut.modifiers?.ctrl) parts.push('Ctrl');
    if (shortcut.modifiers?.alt) parts.push('Alt');
    if (shortcut.modifiers?.shift) parts.push('Shift');
    if (shortcut.modifiers?.meta) parts.push('⌘');
    
    // Format key
    let keyDisplay = shortcut.key;
    const keyDisplayMap: Record<string, string> = {
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'Enter': '↵',
      'Escape': 'Esc',
      ' ': 'Space',
      'Tab': '⇥'
    };
    keyDisplay = keyDisplayMap[keyDisplay] || keyDisplay.toUpperCase();
    
    parts.push(keyDisplay);
    
    return parts.join('+');
  }
}

// ============================================================================
// SHORTCUT HELP COMPONENT HELPER
// ============================================================================

/**
 * Generate HTML for keyboard shortcuts help
 */
export function generateShortcutsHelp(shortcuts: KeyboardShortcut[]): string {
  const formatShortcut = (s: KeyboardShortcut): string => {
    const parts: string[] = [];
    if (s.modifiers?.ctrl) parts.push('Ctrl');
    if (s.modifiers?.alt) parts.push('Alt');
    if (s.modifiers?.shift) parts.push('Shift');
    if (s.modifiers?.meta) parts.push('⌘');
    
    const keyDisplayMap: Record<string, string> = {
      'ArrowUp': '↑', 'ArrowDown': '↓', 'ArrowLeft': '←', 'ArrowRight': '→',
      'Enter': '↵', 'Escape': 'Esc', ' ': 'Space', 'Tab': '⇥'
    };
    parts.push(keyDisplayMap[s.key] || s.key.toUpperCase());
    
    return parts.join('+');
  };
  
  const grouped = shortcuts.reduce((acc, s) => {
    const scope = s.scope || 'general';
    if (!acc[scope]) acc[scope] = [];
    acc[scope].push(s);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);
  
  let html = '<div class="osi-shortcuts-help">';
  
  for (const [scope, items] of Object.entries(grouped)) {
    html += `<h4>${scope.charAt(0).toUpperCase() + scope.slice(1)}</h4>`;
    html += '<dl>';
    for (const shortcut of items) {
      if (shortcut.enabled !== false) {
        html += `<dt><kbd>${formatShortcut(shortcut)}</kbd></dt>`;
        html += `<dd>${shortcut.description}</dd>`;
      }
    }
    html += '</dl>';
  }
  
  html += '</div>';
  return html;
}

