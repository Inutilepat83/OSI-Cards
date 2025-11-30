/**
 * Copy to Clipboard Directive
 * 
 * Enables one-click copy functionality for any element.
 * Supports text content, custom values, and feedback display.
 * 
 * @example
 * ```html
 * <!-- Copy element text content -->
 * <span [appCopyToClipboard]>contact@example.com</span>
 * 
 * <!-- Copy custom value -->
 * <button [appCopyToClipboard]="customValue" (copySuccess)="onCopied()">
 *   Copy Value
 * </button>
 * 
 * <!-- With feedback message -->
 * <code appCopyToClipboard showFeedback="Copied!">
 *   npm install osi-cards
 * </code>
 * ```
 */

import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  Renderer2,
} from '@angular/core';

/**
 * Copy result event
 */
export interface CopyResult {
  success: boolean;
  text: string;
  error?: string;
}

@Directive({
  selector: '[appCopyToClipboard]',
  standalone: true,
})
export class CopyToClipboardDirective {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  /**
   * Value to copy. If not provided, copies the element's text content.
   */
  @Input('appCopyToClipboard') public value: string | null = null;

  /**
   * Feedback message to show on successful copy
   */
  @Input() public showFeedback: string | boolean = false;

  /**
   * Duration to show feedback in milliseconds
   */
  @Input() public feedbackDuration = 2000;

  /**
   * CSS class to add to element while showing feedback
   */
  @Input() public feedbackClass = 'copy-success';

  /**
   * Emitted when copy succeeds
   */
  @Output() public copySuccess = new EventEmitter<string>();

  /**
   * Emitted when copy fails
   */
  @Output() public copyError = new EventEmitter<string>();

  /**
   * Emitted on any copy attempt with result
   */
  @Output() public copyResult = new EventEmitter<CopyResult>();

  private feedbackElement: HTMLElement | null = null;
  private feedbackTimeout: ReturnType<typeof setTimeout> | null = null;
  private originalCursor: string | null = null;

  @HostListener('click', ['$event'])
  public async onClick(event: MouseEvent): Promise<void> {
    event.preventDefault();
    
    const textToCopy = this.getTextToCopy();
    
    if (!textToCopy) {
      this.handleError('No text to copy');
      return;
    }

    try {
      await this.copyToClipboard(textToCopy);
      this.handleSuccess(textToCopy);
    } catch (error) {
      this.handleError(error instanceof Error ? error.message : 'Copy failed');
    }
  }

  @HostListener('mouseenter')
  public onMouseEnter(): void {
    // Save original cursor and set to pointer
    this.originalCursor = this.el.nativeElement.style.cursor;
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'copy');
  }

  @HostListener('mouseleave')
  public onMouseLeave(): void {
    // Restore original cursor
    if (this.originalCursor !== null) {
      this.renderer.setStyle(this.el.nativeElement, 'cursor', this.originalCursor);
    } else {
      this.renderer.removeStyle(this.el.nativeElement, 'cursor');
    }
  }

  /**
   * Get the text to copy
   */
  private getTextToCopy(): string {
    if (this.value !== null && this.value !== '') {
      return this.value;
    }
    return this.el.nativeElement.textContent?.trim() ?? '';
  }

  /**
   * Copy text to clipboard using modern Clipboard API with fallback
   */
  private async copyToClipboard(text: string): Promise<void> {
    // Try modern Clipboard API first
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return;
    }

    // Fallback for older browsers
    this.fallbackCopy(text);
  }

  /**
   * Fallback copy method using textarea
   */
  private fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.setAttribute('readonly', '');
    
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      const success = document.execCommand('copy');
      if (!success) {
        throw new Error('execCommand failed');
      }
    } finally {
      document.body.removeChild(textarea);
    }
  }

  /**
   * Handle successful copy
   */
  private handleSuccess(text: string): void {
    // Add success class
    this.renderer.addClass(this.el.nativeElement, this.feedbackClass);

    // Show feedback if configured
    if (this.showFeedback) {
      this.showFeedbackMessage(
        typeof this.showFeedback === 'string' ? this.showFeedback : 'Copied!'
      );
    }

    // Emit events
    this.copySuccess.emit(text);
    this.copyResult.emit({ success: true, text });

    // Remove success class after duration
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
    }
    this.feedbackTimeout = setTimeout(() => {
      this.renderer.removeClass(this.el.nativeElement, this.feedbackClass);
      this.removeFeedbackMessage();
    }, this.feedbackDuration);
  }

  /**
   * Handle copy error
   */
  private handleError(error: string): void {
    this.copyError.emit(error);
    this.copyResult.emit({ success: false, text: '', error });
  }

  /**
   * Show feedback message tooltip
   */
  private showFeedbackMessage(message: string): void {
    this.removeFeedbackMessage();

    this.feedbackElement = this.renderer.createElement('span');
    const text = this.renderer.createText(message);
    this.renderer.appendChild(this.feedbackElement, text);

    // Style the feedback element
    this.renderer.addClass(this.feedbackElement, 'copy-feedback');
    this.renderer.setStyle(this.feedbackElement, 'position', 'absolute');
    this.renderer.setStyle(this.feedbackElement, 'bottom', '100%');
    this.renderer.setStyle(this.feedbackElement, 'left', '50%');
    this.renderer.setStyle(this.feedbackElement, 'transform', 'translateX(-50%)');
    this.renderer.setStyle(this.feedbackElement, 'padding', '4px 8px');
    this.renderer.setStyle(this.feedbackElement, 'borderRadius', '4px');
    this.renderer.setStyle(this.feedbackElement, 'backgroundColor', 'var(--osi-color-success, #10b981)');
    this.renderer.setStyle(this.feedbackElement, 'color', 'white');
    this.renderer.setStyle(this.feedbackElement, 'fontSize', '12px');
    this.renderer.setStyle(this.feedbackElement, 'whiteSpace', 'nowrap');
    this.renderer.setStyle(this.feedbackElement, 'marginBottom', '4px');
    this.renderer.setStyle(this.feedbackElement, 'zIndex', '1000');
    this.renderer.setStyle(this.feedbackElement, 'animation', 'fadeIn 0.2s ease-out');

    // Make parent relative if not already positioned
    const parentPosition = getComputedStyle(this.el.nativeElement).position;
    if (parentPosition === 'static') {
      this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    }

    this.renderer.appendChild(this.el.nativeElement, this.feedbackElement);
  }

  /**
   * Remove feedback message
   */
  private removeFeedbackMessage(): void {
    if (this.feedbackElement && this.feedbackElement.parentNode) {
      this.renderer.removeChild(this.el.nativeElement, this.feedbackElement);
      this.feedbackElement = null;
    }
  }
}

