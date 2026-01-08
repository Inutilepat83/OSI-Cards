import { Directive, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';
import { FocusManagementService } from '../services/focus-management.service';

/**
 * Focus Trap Directive
 *
 * Traps focus within an element (useful for modals, dialogs, etc.)
 */
@Directive({
  selector: '[appFocusTrap]',
  standalone: true,
})
export class FocusTrapDirective implements OnInit, OnDestroy {
  private cleanup?: () => void;
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly focusService: FocusManagementService = inject(FocusManagementService);

  ngOnInit(): void {
    this.cleanup = this.focusService.trapFocusWithRelease(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.cleanup) {
      this.cleanup();
    }
  }
}
