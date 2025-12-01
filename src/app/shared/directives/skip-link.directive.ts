import { Directive, ElementRef, HostListener, inject, OnInit, Renderer2 } from '@angular/core';

/**
 * Skip Link Directive
 *
 * Provides skip navigation links for keyboard users to jump to main content areas.
 * Improves accessibility by allowing users to bypass repetitive navigation.
 *
 * @example
 * ```html
 * <a appSkipLink="#main-content">Skip to main content</a>
 * ```
 */
@Directive({
  selector: '[appSkipLink]',
  standalone: true,
})
export class SkipLinkDirective implements OnInit {
  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.preventDefault();
    const targetId = this.getTargetId();
    if (targetId) {
      this.navigateToTarget(targetId);
    }
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const targetId = this.getTargetId();
      if (targetId) {
        this.navigateToTarget(targetId);
      }
    }
  }

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  ngOnInit(): void {
    // Ensure skip link is accessible
    const element = this.el.nativeElement;
    if (element.tagName.toLowerCase() !== 'a') {
      this.renderer.setAttribute(element, 'role', 'link');
      this.renderer.setAttribute(element, 'tabindex', '0');
    }

    // Add skip link styling
    this.renderer.addClass(element, 'skip-link');
  }

  private getTargetId(): string | null {
    const element = this.el.nativeElement;
    const href = element.getAttribute('href') || element.getAttribute('appSkipLink');

    if (href) {
      // Remove # if present
      return href.startsWith('#') ? href.substring(1) : href;
    }

    return null;
  }

  private navigateToTarget(targetId: string): void {
    const target = document.getElementById(targetId);

    if (target) {
      // Focus the target element
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Add temporary focus indicator
      target.classList.add('skip-link-target');
      setTimeout(() => {
        target.classList.remove('skip-link-target');
      }, 2000);
    }
  }
}
