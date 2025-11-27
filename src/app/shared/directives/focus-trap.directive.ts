import { Directive, Input, ElementRef, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

/**
 * Focus Trap Directive
 * 
 * Traps keyboard focus within a container element, preventing focus from escaping.
 * Essential for modals, dialogs, and other overlay components to maintain proper
 * keyboard navigation and accessibility.
 * 
 * Features:
 * - Automatic focus trapping on mount
 * - Initial element focus
 * - Cleanup on destroy
 * - Optional enable/disable via input
 * 
 * @example
 * ```html
 * <div appFocusTrap class="modal">
 *   <button>First focusable</button>
 *   <button>Last focusable</button>
 * </div>
 * ```
 */
@Directive({
  selector: '[appFocusTrap]',
  standalone: true
})
export class FocusTrapDirective implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private focusTrap?: FocusTrap;

  @Input() appFocusTrap: boolean = true;

  ngAfterViewInit(): void {
    if (this.appFocusTrap) {
      this.focusTrap = this.focusTrapFactory.create(this.elementRef.nativeElement);
      this.focusTrap.focusInitialElement();
    }
  }

  ngOnDestroy(): void {
    if (this.focusTrap) {
      this.focusTrap.destroy();
    }
  }

  /**
   * Focus the first focusable element
   */
  focusFirstElement(): void {
    if (this.focusTrap) {
      this.focusTrap.focusInitialElement();
    }
  }
}


