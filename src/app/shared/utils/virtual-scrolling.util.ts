/**
 * Virtual Scrolling Utility
 * Stub for backward compatibility - use library version from 'osi-cards-lib'
 */

export interface VirtualScrollConfig {
  itemHeight: number;
  bufferSize?: number;
}

export interface VirtualScrollResult {
  visibleItems: any[];
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
}

export class VirtualScrollManager {
  constructor(private config: VirtualScrollConfig) {}

  calculate(items: any[], scrollTop: number, viewportHeight: number): VirtualScrollResult {
    return calculateVirtualScroll(items, scrollTop, viewportHeight, this.config);
  }
}

export function calculateVirtualScroll(
  items: any[],
  scrollTop: number,
  viewportHeight: number,
  config: VirtualScrollConfig
): VirtualScrollResult {
  const itemHeight = config.itemHeight;
  const bufferSize = config.bufferSize || 3;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + bufferSize
  );

  return {
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight,
  };
}
