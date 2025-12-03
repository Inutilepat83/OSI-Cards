/**
 * Accessibility Directives
 *
 * A collection of 10 accessibility directives for WCAG compliance.
 *
 * Directives:
 * 1. AriaLabel
 * 2. AriaDescribedBy
 * 3. SkipLink
 * 4. FocusVisible
 * 5. LiveRegion
 * 6. KeyboardNav
 * 7. RoleButton
 * 8. ScreenReaderOnly
 * 9. HighContrast
 * 10. ReducedMotion
 */

import { Directive, ElementRef, HostBinding, HostListener, Input, OnInit, Renderer2 } from '@angular/core';

/**
 * 1. ARIA Label Directive
 */
@Directive({
  selector: '[a11yLabel]',
  standalone: true,
})
export class AriaLabelDirective {
  @Input() set a11yLabel(value: string) {
    this.elementRef.nativeElement.setAttribute('aria-label', value);
  }

  constructor(private elementRef: ElementRef) {}
}

/**
 * 2. ARIA Described By Directive
 */
@Directive({
  selector: '[a11yDescribedBy]',
  standalone: true,
})
export class AriaDescribedByDirective {
  @Input() set a11yDescribedBy(value: string) {
    this.elementRef.nativeElement.setAttribute('aria-describedby', value);
  }

  constructor(private elementRef: ElementRef) {}
}

/**
 * 3. Skip Link Directive
 */
@Directive({
  selector: '[skipLink]',
  standalone: true,
})
export class SkipLinkDirective {
  @Input() skipLink!: string;

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.preventDefault();
    const target = document.getElementById(this.skipLink);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  constructor(private elementRef: ElementRef) {
    this.elementRef.nativeElement.classList.add('skip-link');
  }
}

/**
 * 4. Focus Visible Directive
 */
@Directive({
  selector: '[focusVisible]',
  standalone: true,
})
export class FocusVisibleDirective {
  @HostBinding('class.focus-visible') isFocusVisible = false;

  @HostListener('focus')
  onFocus(): void {
    this.isFocusVisible = true;
  }

  @HostListener('blur')
  onBlur(): void {
    this.isFocusVisible = false;
  }

  @HostListener('mousedown')
  onMouseDown(): void {
    this.isFocusVisible = false;
  }
}

/**
 * 5. Live Region Directive
 */
@Directive({
  selector: '[liveRegion]',
  standalone: true,
})
export class LiveRegionDirective implements OnInit {
  @Input() liveRegion: 'polite' | 'assertive' = 'polite';
  @Input() atomic = false;
  @Input() relevant: 'additions' | 'removals' | 'text' | 'all' = 'additions';

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    const element = this.elementRef.nativeElement;
    element.setAttribute('aria-live', this.liveRegion);
    element.setAttribute('aria-atomic', String(this.atomic));
    element.setAttribute('aria-relevant', this.relevant);
  }
}

/**
 * 6. Keyboard Navigation Directive
 */
@Directive({
  selector: '[keyboardNav]',
  standalone: true,
})
export class KeyboardNavDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const element = this.elementRef.nativeElement;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusNext(element);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPrevious(element);
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirst(element);
        break;
      case 'End':
        event.preventDefault();
        this.focusLast(element);
        break;
    }
  }

  constructor(private elementRef: ElementRef) {}

  private getFocusableElements(): HTMLElement[] {
    const element = this.elementRef.nativeElement;
    const selector = 'button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(element.querySelectorAll(selector));
  }

  private focusNext(container: HTMLElement): void {
    const elements = this.getFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
    if (currentIndex < elements.length - 1) {
      elements[currentIndex + 1].focus();
    }
  }

  private focusPrevious(container: HTMLElement): void {
    const elements = this.getFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
    if (currentIndex > 0) {
      elements[currentIndex - 1].focus();
    }
  }

  private focusFirst(container: HTMLElement): void {
    const elements = this.getFocusableElements();
    elements[0]?.focus();
  }

  private focusLast(container: HTMLElement): void {
    const elements = this.getFocusableElements();
    elements[elements.length - 1]?.focus();
  }
}

/**
 * 7. Role Button Directive
 */
@Directive({
  selector: '[roleButton]',
  standalone: true,
})
export class RoleButtonDirective implements OnInit {
  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    event.preventDefault();
    this.elementRef.nativeElement.click();
  }

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    const element = this.elementRef.nativeElement;
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
  }
}

/**
 * 8. Screen Reader Only Directive
 */
@Directive({
  selector: '[srOnly]',
  standalone: true,
})
export class ScreenReaderOnlyDirective implements OnInit {
  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    const styles = {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0,0,0,0)',
      whiteSpace: 'nowrap',
      border: '0',
    };

    Object.entries(styles).forEach(([prop, value]) => {
      this.renderer.setStyle(this.elementRef.nativeElement, prop, value);
    });
  }
}

/**
 * 9. High Contrast Directive
 */
@Directive({
  selector: '[highContrast]',
  standalone: true,
})
export class HighContrastDirective implements OnInit {
  @HostBinding('class.high-contrast') hasHighContrast = false;

  ngOnInit(): void {
    this.hasHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
  }
}

/**
 * 10. Reduced Motion Directive
 */
@Directive({
  selector: '[reducedMotion]',
  standalone: true,
})
export class ReducedMotionDirective implements OnInit {
  @HostBinding('class.reduced-motion') prefersReducedMotion = false;

  ngOnInit(): void {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

// Export all directives
export const ACCESSIBILITY_DIRECTIVES = [
  AriaLabelDirective,
  AriaDescribedByDirective,
  SkipLinkDirective,
  FocusVisibleDirective,
  LiveRegionDirective,
  KeyboardNavDirective,
  RoleButtonDirective,
  ScreenReaderOnlyDirective,
  HighContrastDirective,
  ReducedMotionDirective,
];

