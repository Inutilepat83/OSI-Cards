/**
 * Tooltip Service
 *
 * Manages tooltips with positioning, delays, and accessibility.
 *
 * @example
 * ```typescript
 * const tooltip = inject(TooltipService);
 *
 * tooltip.show(element, 'This is a tooltip');
 * tooltip.hide();
 * ```
 */

import { Injectable, signal } from '@angular/core';

export interface TooltipConfig {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TooltipService {
  private currentTooltip = signal<{ element: HTMLElement; config: TooltipConfig } | null>(null);
  private tooltipElement: HTMLElement | null = null;
  private showTimer: ReturnType<typeof setTimeout> | null = null;

  show(target: HTMLElement, content: string, position: TooltipConfig['position'] = 'top'): void {
    this.hide();

    this.showTimer = setTimeout(() => {
      this.currentTooltip.set({ element: target, config: { content, position } });
      this.createTooltipElement(target, content, position);
    }, 100);
  }

  hide(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }

    if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }

    this.currentTooltip.set(null);
  }

  private createTooltipElement(target: HTMLElement, content: string, position: string): void {
    const tooltip = document.createElement('div');
    tooltip.className = `tooltip tooltip--${position}`;
    tooltip.textContent = content;
    tooltip.role = 'tooltip';

    document.body.appendChild(tooltip);
    this.tooltipElement = tooltip;

    // Position tooltip
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 8;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + 8;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + 8;
        break;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.style.position = 'fixed';
  }
}

export function attachTooltip(
  element: HTMLElement,
  content: string | (() => string),
  position: 'top' | 'bottom' | 'left' | 'right' = 'top'
): () => void {
  const showTooltip = (): void => {
    const text = typeof content === 'function' ? content() : content;
    element.setAttribute('title', text);
  };

  const hideTooltip = (): void => {
    element.removeAttribute('title');
  };

  element.addEventListener('mouseenter', showTooltip);
  element.addEventListener('mouseleave', hideTooltip);

  return () => {
    element.removeEventListener('mouseenter', showTooltip);
    element.removeEventListener('mouseleave', hideTooltip);
  };
}

