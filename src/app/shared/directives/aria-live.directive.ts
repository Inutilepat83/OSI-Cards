import { Directive, ElementRef, inject, Input, OnInit } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';

/**
 * Directive for managing ARIA live regions for dynamic content updates
 * Improves accessibility for screen reader users
 */
@Directive({
  selector: '[appAriaLive]',
  standalone: true,
})
export class AriaLiveDirective implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  @Input() appAriaLive: 'polite' | 'assertive' = 'polite';
  @Input() ariaLiveMessage?: string;

  ngOnInit(): void {
    const element = this.elementRef.nativeElement as HTMLElement;
    element.setAttribute('aria-live', this.appAriaLive);
    element.setAttribute('aria-atomic', 'true');

    if (this.ariaLiveMessage) {
      this.announce(this.ariaLiveMessage);
    }
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string): void {
    this.liveAnnouncer.announce(message, this.appAriaLive);
  }
}
