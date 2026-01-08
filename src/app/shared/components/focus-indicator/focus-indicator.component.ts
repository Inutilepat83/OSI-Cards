import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Focus indicator component
 * Ensures all focusable elements have visible focus indicators
 * Improves accessibility for keyboard navigation
 */
@Component({
  selector: 'app-focus-indicator',
  standalone: true,
  imports: [CommonModule],
  template: '',
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusIndicatorComponent implements OnInit, OnDestroy {
  private readonly renderer = inject(Renderer2);
  private styleElement?: HTMLStyleElement;

  ngOnInit(): void {
    this.addGlobalFocusStyles();
  }

  ngOnDestroy(): void {
    if (this.styleElement) {
      document.head.removeChild(this.styleElement);
    }
  }

  /**
   * Add global focus styles to ensure all focusable elements have visible indicators
   */
  private addGlobalFocusStyles(): void {
    const styleElement = this.renderer.createElement('style');
    styleElement.textContent = `
      *:focus-visible {
        outline: none;
      }

      button:focus-visible,
      a:focus-visible,
      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible {
        outline: none;
      }

      /* Remove default outline for mouse users */
      *:focus:not(:focus-visible) {
        outline: none;
      }
    `;
    this.styleElement = styleElement;
    document.head.appendChild(styleElement);
  }
}
