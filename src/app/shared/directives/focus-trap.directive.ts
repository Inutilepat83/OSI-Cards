import { Directive, Input, ElementRef, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

/**
 * Directive for trapping focus within a container (useful for modals, dialogs)
 * Improves keyboard navigation and accessibility
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


