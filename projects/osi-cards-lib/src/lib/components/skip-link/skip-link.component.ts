/**
 * Skip Link Component
 *
 * Provides keyboard-accessible skip links for improved navigation.
 * Skip links allow keyboard users to bypass repetitive content and
 * navigate directly to main content areas.
 *
 * @example
 * ```html
 * <app-skip-link
 *   [links]="[
 *     { target: '#main-content', label: 'Skip to main content' },
 *     { target: '#card-sections', label: 'Skip to card sections' }
 *   ]">
 * </app-skip-link>
 * ```
 *
 * @see WCAG 2.1 Success Criterion 2.4.1: Bypass Blocks
 */

import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

/**
 * Configuration for a skip link
 */
export interface SkipLinkConfig {
  /** CSS selector or element ID for the target (e.g., '#main-content' or 'main-content') */
  target: string;
  /** Accessible label for the skip link */
  label: string;
  /** Optional keyboard shortcut hint */
  shortcutHint?: string;
}

/**
 * Default skip links for OSI Cards
 */
export const DEFAULT_SKIP_LINKS: SkipLinkConfig[] = [
  { target: '#main-content', label: 'Skip to main content' },
  { target: '#card-sections', label: 'Skip to card sections' },
];

@Component({
  selector: 'app-skip-link, osi-skip-link',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="skip-link-nav" aria-label="Skip navigation">
      @for (link of links; track link.target) {
        <a
          class="skip-link"
          [href]="normalizeTarget(link.target)"
          (click)="handleClick($event, link.target)"
          (keydown.enter)="handleClick($event, link.target)"
          [attr.aria-label]="link.label + (link.shortcutHint ? ' (' + link.shortcutHint + ')' : '')"
        >
          {{ link.label }}
          @if (link.shortcutHint) {
            <span class="skip-link-shortcut">{{ link.shortcutHint }}</span>
          }
        </a>
      }
    </nav>
  `,
  styles: [
    `
      .skip-link-nav {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 10000;
      }

      .skip-link {
        position: absolute;
        top: -9999px;
        left: -9999px;
        padding: 0.75rem 1rem;
        background-color: var(--osi-color-brand, #ff7900);
        color: white;
        font-weight: 600;
        font-size: 0.875rem;
        text-decoration: none;
        border-radius: 0 0 var(--osi-border-radius-md, 8px) 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: none; /* Instant appearance for accessibility */
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .skip-link:focus,
      .skip-link:focus-visible {
        position: fixed;
        top: 0;
        left: 0;
        outline: 3px solid var(--osi-color-focus, #005fcc);
        outline-offset: 2px;
      }

      .skip-link:hover {
        background-color: var(--osi-color-brand-dark, #e66a00);
      }

      .skip-link-shortcut {
        font-size: 0.75rem;
        opacity: 0.8;
        padding: 0.125rem 0.375rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }

      /* High contrast mode support */
      @media (forced-colors: active) {
        .skip-link {
          background-color: Highlight;
          color: HighlightText;
          border: 2px solid HighlightText;
        }

        .skip-link:focus {
          outline: 3px solid HighlightText;
        }
      }

      /* Reduced motion - instant transitions */
      @media (prefers-reduced-motion: reduce) {
        .skip-link {
          transition: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SkipLinkComponent {
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Array of skip link configurations
   * @default DEFAULT_SKIP_LINKS
   */
  @Input() links: SkipLinkConfig[] = DEFAULT_SKIP_LINKS;

  /**
   * Normalize target to ensure it's a valid href
   */
  normalizeTarget(target: string): string {
    if (target.startsWith('#')) {
      return target;
    }
    return `#${target}`;
  }

  /**
   * Handle skip link click - focuses the target element
   */
  handleClick(event: Event, target: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    event.preventDefault();

    const selector = this.normalizeTarget(target);
    const element = document.querySelector(selector) as HTMLElement;

    if (element) {
      // Make element focusable if it isn't already
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '-1');
      }

      // Scroll to element
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Focus the element
      element.focus({ preventScroll: true });

      // Update URL hash without scrolling
      if (history.pushState) {
        history.pushState(null, '', selector);
      }
    }
  }
}

/**
 * Directive to mark an element as a skip link target
 *
 * @example
 * ```html
 * <main appSkipTarget="main-content">
 *   <!-- Main content -->
 * </main>
 * ```
 */
import { Directive, ElementRef, Input as DirectiveInput, OnInit } from '@angular/core';

@Directive({
  selector: '[appSkipTarget], [osiSkipTarget]',
  standalone: true,
})
export class SkipTargetDirective implements OnInit {
  private readonly el = inject(ElementRef);

  /**
   * ID for the skip target (will be set as element id)
   */
  @DirectiveInput('appSkipTarget') targetId = '';
  @DirectiveInput('osiSkipTarget') set osiTargetId(value: string) {
    this.targetId = value;
  }

  ngOnInit(): void {
    const element = this.el.nativeElement as HTMLElement;

    // Set ID if provided
    if (this.targetId && !element.id) {
      element.id = this.targetId;
    }

    // Ensure element is focusable
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
    }

    // Add landmark role if not present
    if (
      !element.hasAttribute('role') &&
      !['main', 'nav', 'aside', 'header', 'footer', 'section', 'article'].includes(
        element.tagName.toLowerCase()
      )
    ) {
      element.setAttribute('role', 'region');
    }
  }
}
