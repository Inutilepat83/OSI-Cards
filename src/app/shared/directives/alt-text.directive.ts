import { Directive, ElementRef, inject, Input, OnInit, Renderer2 } from '@angular/core';
import { generateAltText, validateAltText } from '../utils/alt-text.util';

/**
 * Directive for ensuring images have descriptive alt text
 * Automatically generates or validates alt text for images
 */
@Directive({
  selector: 'img[appAltText]',
  standalone: true,
})
export class AltTextDirective implements OnInit {
  private readonly elementRef = inject(ElementRef<HTMLImageElement>);
  private readonly renderer = inject(Renderer2);

  @Input() appAltText?: string;
  @Input() altTextContext?: {
    title?: string;
    description?: string;
    sectionTitle?: string;
  };

  ngOnInit(): void {
    const img = this.elementRef.nativeElement;
    const currentAlt = img.getAttribute('alt');

    // If alt text is explicitly provided, use it
    if (this.appAltText) {
      if (validateAltText(this.appAltText)) {
        this.renderer.setAttribute(img, 'alt', this.appAltText);
      } else {
        // Generate alt text if provided one is invalid
        const generated = generateAltText(img.src, this.altTextContext);
        this.renderer.setAttribute(img, 'alt', generated);
      }
      return;
    }

    // If no alt text exists, generate one
    if (!currentAlt || !validateAltText(currentAlt)) {
      const generated = generateAltText(img.src, this.altTextContext);
      this.renderer.setAttribute(img, 'alt', generated);
    }
  }
}
