import { Directive, ElementRef, Input, OnInit, inject, Renderer2 } from '@angular/core';

/**
 * Live Region Directive
 * 
 * Creates an ARIA live region for announcing dynamic content changes to screen readers.
 * Useful for status updates, notifications, and dynamic content changes.
 * 
 * @example
 * ```html
 * <div appLiveRegion="polite" [appLiveRegionAtomic]="true">
 *   {{ statusMessage }}
 * </div>
 * ```
 */
@Directive({
  selector: '[appLiveRegion]',
  standalone: true
})
export class LiveRegionDirective implements OnInit {
  /**
   * Live region politeness level
   * - 'polite': Announces changes when user is idle (default)
   * - 'assertive': Announces changes immediately
   * - 'off': Disables live region
   */
  @Input() appLiveRegion: 'polite' | 'assertive' | 'off' = 'polite';

  /**
   * Whether to announce the entire region when content changes
   */
  @Input() appLiveRegionAtomic = false;

  /**
   * Whether to announce only relevant changes
   */
  @Input() appLiveRegionRelevant: 'additions' | 'removals' | 'text' | 'all' | 'additions text' = 'additions text';

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  ngOnInit(): void {
    const element = this.el.nativeElement;
    
    // Set ARIA live region attributes
    this.renderer.setAttribute(element, 'role', 'status');
    this.renderer.setAttribute(element, 'aria-live', this.appLiveRegion);
    this.renderer.setAttribute(element, 'aria-atomic', String(this.appLiveRegionAtomic));
    this.renderer.setAttribute(element, 'aria-relevant', this.appLiveRegionRelevant);
    
    // Hide visually but keep accessible to screen readers
    this.renderer.addClass(element, 'sr-only');
  }
}








