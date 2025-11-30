import { Injectable, inject, DestroyRef, OnDestroy } from '@angular/core';
import { Subject, Observable, fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
  preventDefault?: boolean;
}

/**
 * Keyboard shortcuts service
 * Manages keyboard shortcuts throughout the application
 */
@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutsService implements OnDestroy {
  private readonly shortcuts = new Map<string, KeyboardShortcut>();
  private readonly shortcutTriggered$ = new Subject<KeyboardShortcut>();
  private readonly destroyRef = inject(DestroyRef);

  readonly shortcutTriggered: Observable<KeyboardShortcut> = this.shortcutTriggered$.asObservable();

  constructor() {
    // Setup global listener in constructor to ensure shortcuts are active immediately
    this.setupGlobalListener();
  }

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.delete(key);
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcut by key combination
   */
  getShortcut(key: string, ctrlKey = false, shiftKey = false, altKey = false, metaKey = false): KeyboardShortcut | undefined {
    const shortcutKey = this.buildShortcutKey(key, ctrlKey, shiftKey, altKey, metaKey);
    return this.shortcuts.get(shortcutKey);
  }

  /**
   * Setup global keyboard listener
   */
  private setupGlobalListener(): void {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.handleKeyDown(event);
      });
  }

  /**
   * Handle keydown event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const shortcut = this.getShortcut(
      event.key,
      event.ctrlKey,
      event.shiftKey,
      event.altKey,
      event.metaKey
    );

    if (shortcut) {
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      shortcut.action();
      this.shortcutTriggered$.next(shortcut);
    }
  }

  /**
   * Get shortcut key string
   */
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    return this.buildShortcutKey(
      shortcut.key,
      shortcut.ctrlKey || false,
      shortcut.shiftKey || false,
      shortcut.altKey || false,
      shortcut.metaKey || false
    );
  }

  /**
   * Build shortcut key string
   */
  private buildShortcutKey(key: string, ctrlKey: boolean, shiftKey: boolean, altKey: boolean, metaKey: boolean): string {
    const parts: string[] = [];
    if (ctrlKey) parts.push('Ctrl');
    if (metaKey) parts.push('Meta');
    if (shiftKey) parts.push('Shift');
    if (altKey) parts.push('Alt');
    parts.push(key);
    return parts.join('+');
  }

  ngOnDestroy(): void {
    this.shortcuts.clear();
    this.shortcutTriggered$.complete();
  }
}

