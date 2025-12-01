/**
 * Tooltip Directive
 * 
 * Provides configurable tooltips for any element.
 * Supports multiple positions, delays, and custom styling.
 * 
 * @example
 * ```html
 * <!-- Simple tooltip -->
 * <button appTooltip="Click to save">Save</button>
 * 
 * <!-- Positioned tooltip -->
 * <span [appTooltip]="helpText" tooltipPosition="bottom">
 *   Help
 * </span>
 * 
 * <!-- Delayed tooltip -->
 * <icon appTooltip="Settings" [tooltipDelay]="500" tooltipPosition="left">
 *   ⚙️
 * </icon>
 * ```
 */

import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnDestroy,
  Renderer2,
} from '@angular/core';

/**
 * Tooltip position options
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  /**
   * Tooltip text content
   */
  @Input('appTooltip') public text = '';

  /**
   * Tooltip position relative to element
   */
  @Input() public tooltipPosition: TooltipPosition = 'top';

  /**
   * Delay before showing tooltip (ms)
   */
  @Input() public tooltipDelay = 300;

  /**
   * Duration tooltip stays visible (0 = indefinite)
   */
  @Input() public tooltipDuration = 0;

  /**
   * Custom CSS class for tooltip
   */
  @Input() public tooltipClass = '';

  /**
   * Disable tooltip
   */
  @Input() public tooltipDisabled = false;

  /**
   * Show arrow pointer
   */
  @Input() public tooltipShowArrow = true;

  /**
   * Max width of tooltip
   */
  @Input() public tooltipMaxWidth = 250;

  private tooltipElement: HTMLElement | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private isVisible = false;

  @HostListener('mouseenter')
  public onMouseEnter(): void {
    if (this.tooltipDisabled || !this.text) return;
    
    this.clearTimeouts();
    this.showTimeout = setTimeout(() => {
      this.show();
    }, this.tooltipDelay);
  }

  @HostListener('mouseleave')
  public onMouseLeave(): void {
    this.clearTimeouts();
    this.hide();
  }

  @HostListener('focusin')
  public onFocus(): void {
    if (this.tooltipDisabled || !this.text) return;
    
    this.clearTimeouts();
    this.show();
  }

  @HostListener('focusout')
  public onBlur(): void {
    this.clearTimeouts();
    this.hide();
  }

  public ngOnDestroy(): void {
    this.clearTimeouts();
    this.remove();
  }

  /**
   * Show the tooltip
   */
  private show(): void {
    if (this.isVisible) return;
    
    this.create();
    this.position();
    this.isVisible = true;

    // Auto-hide after duration if set
    if (this.tooltipDuration > 0) {
      this.hideTimeout = setTimeout(() => {
        this.hide();
      }, this.tooltipDuration);
    }
  }

  /**
   * Hide the tooltip
   */
  private hide(): void {
    if (!this.isVisible) return;
    
    if (this.tooltipElement) {
      this.renderer.addClass(this.tooltipElement, 'tooltip-hiding');
      
      // Wait for animation then remove
      setTimeout(() => {
        this.remove();
        this.isVisible = false;
      }, 150);
    }
  }

  /**
   * Create tooltip element
   */
  private create(): void {
    this.remove();

    // Create tooltip container
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'osi-tooltip');
    this.renderer.addClass(this.tooltipElement, `tooltip-${this.tooltipPosition}`);
    
    if (this.tooltipClass) {
      this.renderer.addClass(this.tooltipElement, this.tooltipClass);
    }

    // Create text content
    const textNode = this.renderer.createText(this.text);
    this.renderer.appendChild(this.tooltipElement, textNode);

    // Create arrow if enabled
    if (this.tooltipShowArrow) {
      const arrow = this.renderer.createElement('div');
      this.renderer.addClass(arrow, 'tooltip-arrow');
      this.renderer.appendChild(this.tooltipElement, arrow);
    }

    // Apply base styles
    this.applyStyles();

    // Add to document
    this.renderer.appendChild(document.body, this.tooltipElement);

    // Trigger animation
    requestAnimationFrame(() => {
      if (this.tooltipElement) {
        this.renderer.addClass(this.tooltipElement, 'tooltip-visible');
      }
    });
  }

  /**
   * Apply inline styles to tooltip
   */
  private applyStyles(): void {
    if (!this.tooltipElement) return;

    // Base styles
    const styles: Record<string, string> = {
      'position': 'fixed',
      'z-index': '10000',
      'padding': '6px 10px',
      'border-radius': '4px',
      'font-size': '12px',
      'line-height': '1.4',
      'max-width': `${this.tooltipMaxWidth}px`,
      'word-wrap': 'break-word',
      'pointer-events': 'none',
      'opacity': '0',
      'transition': 'opacity 0.15s ease-out, transform 0.15s ease-out',
      'background-color': 'var(--osi-tooltip-bg, #1f2937)',
      'color': 'var(--osi-tooltip-color, #ffffff)',
      'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    };

    // Position-specific transform
    switch (this.tooltipPosition) {
      case 'top':
        styles['transform'] = 'translateY(4px)';
        break;
      case 'bottom':
        styles['transform'] = 'translateY(-4px)';
        break;
      case 'left':
        styles['transform'] = 'translateX(4px)';
        break;
      case 'right':
        styles['transform'] = 'translateX(-4px)';
        break;
    }

    Object.entries(styles).forEach(([prop, value]) => {
      this.renderer.setStyle(this.tooltipElement, prop, value);
    });

    // Add visible state styles via class
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .osi-tooltip.tooltip-visible {
        opacity: 1 !important;
        transform: translate(0) !important;
      }
      .osi-tooltip.tooltip-hiding {
        opacity: 0 !important;
      }
      .tooltip-arrow {
        position: absolute;
        width: 8px;
        height: 8px;
        background: inherit;
        transform: rotate(45deg);
      }
      .tooltip-top .tooltip-arrow {
        bottom: -4px;
        left: 50%;
        margin-left: -4px;
      }
      .tooltip-bottom .tooltip-arrow {
        top: -4px;
        left: 50%;
        margin-left: -4px;
      }
      .tooltip-left .tooltip-arrow {
        right: -4px;
        top: 50%;
        margin-top: -4px;
      }
      .tooltip-right .tooltip-arrow {
        left: -4px;
        top: 50%;
        margin-top: -4px;
      }
    `;
    
    // Only add once
    if (!document.querySelector('#osi-tooltip-styles')) {
      styleSheet.id = 'osi-tooltip-styles';
      document.head.appendChild(styleSheet);
    }
  }

  /**
   * Position tooltip relative to element
   */
  private position(): void {
    if (!this.tooltipElement) return;

    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();

    const OFFSET = 8;
    let top: number;
    let left: number;

    switch (this.tooltipPosition) {
      case 'top':
        top = hostRect.top - tooltipRect.height - OFFSET;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + OFFSET;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - OFFSET;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + OFFSET;
        break;
      default:
        top = hostRect.top - tooltipRect.height - OFFSET;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
    }

    // Boundary checks
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Keep tooltip within viewport
    if (left < 8) left = 8;
    if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }
    if (top < 8) top = 8;
    if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }

  /**
   * Remove tooltip from DOM
   */
  private remove(): void {
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}







