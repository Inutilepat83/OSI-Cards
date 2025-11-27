import { Directive, Input, ElementRef, OnInit, Renderer2, inject } from '@angular/core';

/**
 * Skip Link Directive
 * 
 * Creates accessible skip navigation links that allow keyboard users to bypass
 * repetitive navigation and jump directly to main content. Essential for WCAG
 * 2.1 AA compliance and improved keyboard navigation.
 * 
 * Features:
 * - Automatically positioned off-screen until focused
 * - Smooth focus/blur transitions
 * - Customizable target and text
 * - High z-index to appear above all content
 * 
 * @example
 * ```html
 * <div appSkipLink="main-content" skipLinkText="Skip to main content">
 *   <!-- Navigation content -->
 * </div>
 * <main id="main-content">
 *   <!-- Main content -->
 * </main>
 * ```
 */
@Directive({
  selector: '[appSkipLink]',
  standalone: true
})
export class SkipLinkDirective implements OnInit {
  @Input() appSkipLink?: string;
  @Input() skipLinkText: string = 'Skip to main content';

  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  ngOnInit(): void {
    const element = this.elementRef.nativeElement as HTMLElement;
    const targetId = this.appSkipLink || 'main-content';

    // Create skip link
    const skipLink = this.renderer.createElement('a');
    this.renderer.setAttribute(skipLink, 'href', `#${targetId}`);
    this.renderer.setAttribute(skipLink, 'class', 'skip-link');
    this.renderer.setAttribute(skipLink, 'aria-label', this.skipLinkText);
    this.renderer.setProperty(skipLink, 'textContent', this.skipLinkText);

    // Add styles
    this.renderer.setStyle(skipLink, 'position', 'absolute');
    this.renderer.setStyle(skipLink, 'top', '-40px');
    this.renderer.setStyle(skipLink, 'left', '0');
    this.renderer.setStyle(skipLink, 'background', 'var(--color-brand, #FF7900)');
    this.renderer.setStyle(skipLink, 'color', 'white');
    this.renderer.setStyle(skipLink, 'padding', '0.5rem 1rem');
    this.renderer.setStyle(skipLink, 'text-decoration', 'none');
    this.renderer.setStyle(skipLink, 'z-index', '1000');
    this.renderer.setStyle(skipLink, 'border-radius', '0 0 0.25rem 0');

    skipLink.addEventListener('focus', () => {
      this.renderer.setStyle(skipLink, 'top', '0');
    });

    skipLink.addEventListener('blur', () => {
      this.renderer.setStyle(skipLink, 'top', '-40px');
    });

    // Insert skip link
    const parent = this.renderer.parentNode(element);
    this.renderer.insertBefore(parent, skipLink, element);
  }
}


