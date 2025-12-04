/**
 * Clipboard Service
 *
 * Enhanced clipboard service with history and formatting.
 *
 * @example
 * ```typescript
 * const clipboard = inject(ClipboardService);
 *
 * await clipboard.copy('Hello World');
 * const text = await clipboard.paste();
 * const history = clipboard.getHistory();
 * ```
 */

import { Injectable, signal } from '@angular/core';

export interface ClipboardEntry {
  text: string;
  timestamp: Date;
  type: 'text' | 'html' | 'image';
}

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  private history = signal<ClipboardEntry[]>([]);
  private maxHistory = 10;

  /**
   * Copy text to clipboard
   */
  async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.addToHistory(text, 'text');
    } catch (error) {
      this.fallbackCopy(text);
      this.addToHistory(text, 'text');
    }
  }

  /**
   * Copy HTML to clipboard
   */
  async copyHTML(html: string, plainText: string): Promise<void> {
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const data = [new ClipboardItem({ 'text/html': blob })];
      await navigator.clipboard.write(data);
      this.addToHistory(plainText, 'html');
    } catch (error) {
      await this.copy(plainText);
    }
  }

  /**
   * Paste from clipboard
   */
  async paste(): Promise<string> {
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      throw new Error('Clipboard read permission denied');
    }
  }

  /**
   * Copy element content
   */
  async copyElement(element: HTMLElement): Promise<void> {
    const text = element.textContent || '';
    await this.copy(text);
  }

  /**
   * Get clipboard history
   */
  getHistory(): ClipboardEntry[] {
    return this.history();
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history.set([]);
  }

  /**
   * Add to history
   */
  private addToHistory(text: string, type: ClipboardEntry['type']): void {
    this.history.update((history) => {
      const entry: ClipboardEntry = {
        text,
        timestamp: new Date(),
        type,
      };

      const newHistory = [entry, ...history];
      return newHistory.slice(0, this.maxHistory);
    });
  }

  /**
   * Fallback copy method
   */
  private fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  /**
   * Check if clipboard API is available
   */
  isAvailable(): boolean {
    return !!(navigator.clipboard && navigator.clipboard.writeText);
  }
}
