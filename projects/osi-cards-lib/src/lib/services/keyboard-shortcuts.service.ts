import { Injectable, inject, OnDestroy, signal, computed } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Subject, fromEvent, takeUntil, filter } from 'rxjs';

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Unique identifier */
  id: string;
  /** Key combination (e.g., 'ctrl+k', 'cmd+shift+p') */
  keys: string;
  /** Description for help display */
  description: string;
  /** Category for grouping */
  category?: string;
  /** Callback function */
  action: () => void;
  /** Whether shortcut is enabled */
  enabled?: boolean;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
}

/**
 * Parsed key combination
 */
interface ParsedKeys {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

/**
 * Keyboard Shortcuts Service
 *
 * Provides a centralized way to manage keyboard shortcuts
 * across the OSI Cards library.
 *
 * @example
 * ```typescript
 * const shortcuts = inject(KeyboardShortcutsService);
 *
 * shortcuts.register({
 *   id: 'search',
 *   keys: 'ctrl+k',
 *   description: 'Open search',
 *   action: () => this.openSearch()
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class KeyboardShortcutsService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly destroy$ = new Subject<void>();

  /** Registered shortcuts */
  private readonly shortcuts = signal<Map<string, KeyboardShortcut>>(new Map());

  /** Whether shortcuts are globally enabled */
  private readonly enabled = signal(true);

  /** Whether help modal is open */
  readonly helpOpen = signal(false);

  /** Get all registered shortcuts as array */
  readonly allShortcuts = computed(() => Array.from(this.shortcuts().values()));

  /** Get shortcuts grouped by category */
  readonly shortcutsByCategory = computed(() => {
    const grouped = new Map<string, KeyboardShortcut[]>();
    this.allShortcuts().forEach((shortcut) => {
      const category = shortcut.category || 'General';
      const existing = grouped.get(category) || [];
      grouped.set(category, [...existing, shortcut]);
    });
    return grouped;
  });

  constructor() {
    this.setupGlobalListener();
    this.registerDefaultShortcuts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    this.shortcuts.update((map) => {
      const newMap = new Map(map);
      newMap.set(shortcut.id, {
        enabled: true,
        preventDefault: true,
        ...shortcut,
      });
      return newMap;
    });
  }

  /**
   * Register multiple shortcuts at once
   */
  registerAll(shortcuts: KeyboardShortcut[]): void {
    shortcuts.forEach((shortcut) => this.register(shortcut));
  }

  /**
   * Unregister a shortcut by ID
   */
  unregister(id: string): void {
    this.shortcuts.update((map) => {
      const newMap = new Map(map);
      newMap.delete(id);
      return newMap;
    });
  }

  /**
   * Enable a specific shortcut
   */
  enable(id: string): void {
    this.shortcuts.update((map) => {
      const shortcut = map.get(id);
      if (shortcut) {
        const newMap = new Map(map);
        newMap.set(id, { ...shortcut, enabled: true });
        return newMap;
      }
      return map;
    });
  }

  /**
   * Disable a specific shortcut
   */
  disable(id: string): void {
    this.shortcuts.update((map) => {
      const shortcut = map.get(id);
      if (shortcut) {
        const newMap = new Map(map);
        newMap.set(id, { ...shortcut, enabled: false });
        return newMap;
      }
      return map;
    });
  }

  /**
   * Enable all shortcuts globally
   */
  enableAll(): void {
    this.enabled.set(true);
  }

  /**
   * Disable all shortcuts globally
   */
  disableAll(): void {
    this.enabled.set(false);
  }

  /**
   * Toggle help modal
   */
  toggleHelp(): void {
    this.helpOpen.update((v) => !v);
  }

  /**
   * Open help modal
   */
  openHelp(): void {
    this.helpOpen.set(true);
  }

  /**
   * Close help modal
   */
  closeHelp(): void {
    this.helpOpen.set(false);
  }

  /**
   * Format key combination for display
   */
  formatKeys(keys: string): string {
    const isMac = this.isMac();
    return keys
      .toLowerCase()
      .replace(/ctrl/g, isMac ? '⌃' : 'Ctrl')
      .replace(/alt/g, isMac ? '⌥' : 'Alt')
      .replace(/shift/g, isMac ? '⇧' : 'Shift')
      .replace(/meta|cmd/g, isMac ? '⌘' : 'Win')
      .replace(/\+/g, ' + ')
      .replace(/escape/g, 'Esc')
      .replace(/arrowup/g, '↑')
      .replace(/arrowdown/g, '↓')
      .replace(/arrowleft/g, '←')
      .replace(/arrowright/g, '→');
  }

  /**
   * Setup global keyboard event listener
   */
  private setupGlobalListener(): void {
    fromEvent<KeyboardEvent>(this.document, 'keydown')
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.enabled()),
        filter((event) => !this.isInputElement(event.target as HTMLElement))
      )
      .subscribe((event) => this.handleKeydown(event));
  }

  /**
   * Handle keydown event
   */
  private handleKeydown(event: KeyboardEvent): void {
    const shortcuts = this.shortcuts();

    for (const [, shortcut] of shortcuts) {
      if (!shortcut.enabled) continue;

      if (this.matchesShortcut(event, shortcut.keys)) {
        if (shortcut.preventDefault) {
          event.preventDefault();
        }
        shortcut.action();
        return;
      }
    }
  }

  /**
   * Check if event matches shortcut keys
   */
  private matchesShortcut(event: KeyboardEvent, keys: string): boolean {
    const parsed = this.parseKeys(keys);
    const key = event.key.toLowerCase();

    // Handle special keys
    const eventKey = this.normalizeKey(key);

    return (
      eventKey === parsed.key &&
      event.ctrlKey === parsed.ctrl &&
      event.altKey === parsed.alt &&
      event.shiftKey === parsed.shift &&
      event.metaKey === parsed.meta
    );
  }

  /**
   * Parse key combination string
   */
  private parseKeys(keys: string): ParsedKeys {
    const parts = keys
      .toLowerCase()
      .split('+')
      .map((p) => p.trim());

    return {
      key: parts.find((p) => !['ctrl', 'alt', 'shift', 'meta', 'cmd'].includes(p)) || '',
      ctrl: parts.includes('ctrl'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      meta: parts.includes('meta') || parts.includes('cmd'),
    };
  }

  /**
   * Normalize key name
   */
  private normalizeKey(key: string): string {
    const keyMap: Record<string, string> = {
      escape: 'escape',
      esc: 'escape',
      enter: 'enter',
      return: 'enter',
      space: ' ',
      ' ': ' ',
      arrowup: 'arrowup',
      arrowdown: 'arrowdown',
      arrowleft: 'arrowleft',
      arrowright: 'arrowright',
    };
    return keyMap[key] || key;
  }

  /**
   * Check if target is an input element
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
   * Check if running on Mac
   */
  private isMac(): boolean {
    return navigator.platform.toLowerCase().includes('mac');
  }

  /**
   * Register default shortcuts
   */
  private registerDefaultShortcuts(): void {
    this.register({
      id: 'help',
      keys: 'shift+?',
      description: 'Show keyboard shortcuts',
      category: 'General',
      action: () => this.toggleHelp(),
    });

    this.register({
      id: 'escape',
      keys: 'escape',
      description: 'Close modal/popup',
      category: 'General',
      action: () => {
        if (this.helpOpen()) {
          this.closeHelp();
        }
      },
    });
  }
}



