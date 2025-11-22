import { Directive, Input, ElementRef, OnInit, Renderer2, inject } from '@angular/core';

/**
 * Directive for improving ARIA labels
 * Adds comprehensive ARIA labels to interactive elements
 */
@Directive({
  selector: '[appImprovedAriaLabel]',
  standalone: true
})
export class ImprovedAriaLabelDirective implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  @Input() appImprovedAriaLabel?: string;
  @Input() ariaDescription?: string;
  @Input() ariaLive?: 'polite' | 'assertive' | 'off';

  ngOnInit(): void {
    const element = this.elementRef.nativeElement as HTMLElement;

    // Set aria-label if provided
    if (this.appImprovedAriaLabel) {
      this.renderer.setAttribute(element, 'aria-label', this.appImprovedAriaLabel);
    }

    // Set aria-describedby if description provided
    if (this.ariaDescription) {
      const descriptionId = `aria-desc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const descriptionElement = this.renderer.createElement('span');
      this.renderer.setAttribute(descriptionElement, 'id', descriptionId);
      this.renderer.setAttribute(descriptionElement, 'class', 'sr-only');
      this.renderer.setProperty(descriptionElement, 'textContent', this.ariaDescription);
      this.renderer.setStyle(descriptionElement, 'position', 'absolute');
      this.renderer.setStyle(descriptionElement, 'width', '1px');
      this.renderer.setStyle(descriptionElement, 'height', '1px');
      this.renderer.setStyle(descriptionElement, 'padding', '0');
      this.renderer.setStyle(descriptionElement, 'margin', '-1px');
      this.renderer.setStyle(descriptionElement, 'overflow', 'hidden');
      this.renderer.setStyle(descriptionElement, 'clip', 'rect(0, 0, 0, 0)');
      this.renderer.setStyle(descriptionElement, 'white-space', 'nowrap');
      this.renderer.setStyle(descriptionElement, 'border-width', '0');
      this.renderer.appendChild(element.parentElement || document.body, descriptionElement);
      this.renderer.setAttribute(element, 'aria-describedby', descriptionId);
    }

    // Set aria-live if provided
    if (this.ariaLive) {
      this.renderer.setAttribute(element, 'aria-live', this.ariaLive);
    }

    // Ensure role is set for interactive elements
    if (element.tagName === 'BUTTON' || element.tagName === 'A') {
      if (!element.getAttribute('role')) {
        this.renderer.setAttribute(element, 'role', element.tagName === 'BUTTON' ? 'button' : 'link');
      }
    }
  }
}


