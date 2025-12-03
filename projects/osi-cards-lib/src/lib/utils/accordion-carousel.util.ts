/**
 * Accordion & Carousel Utilities
 *
 * Utilities for building accordion and carousel components.
 *
 * @example
 * ```typescript
 * import { AccordionManager, CarouselManager } from '@osi-cards/utils';
 *
 * const accordion = new AccordionManager();
 * accordion.toggle(0);
 *
 * const carousel = new CarouselManager(5);
 * carousel.next();
 * ```
 */

export class AccordionManager {
  private openPanels = new Set<number>();

  constructor(private allowMultiple = false) {}

  toggle(index: number): void {
    if (this.openPanels.has(index)) {
      this.close(index);
    } else {
      this.open(index);
    }
  }

  open(index: number): void {
    if (!this.allowMultiple) {
      this.closeAll();
    }
    this.openPanels.add(index);
  }

  close(index: number): void {
    this.openPanels.delete(index);
  }

  closeAll(): void {
    this.openPanels.clear();
  }

  isOpen(index: number): boolean {
    return this.openPanels.has(index);
  }

  getOpenPanels(): number[] {
    return Array.from(this.openPanels);
  }
}

export class CarouselManager {
  private currentIndex = 0;

  constructor(private totalItems: number, private autoRotate = false, private interval = 5000) {
    if (autoRotate) {
      this.startAutoRotate();
    }
  }

  private timer?: ReturnType<typeof setInterval>;

  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.totalItems;
  }

  previous(): void {
    this.currentIndex = (this.currentIndex - 1 + this.totalItems) % this.totalItems;
  }

  goTo(index: number): void {
    if (index >= 0 && index < this.totalItems) {
      this.currentIndex = index;
    }
  }

  getCurrent(): number {
    return this.currentIndex;
  }

  startAutoRotate(): void {
    this.stopAutoRotate();
    this.timer = setInterval(() => this.next(), this.interval);
  }

  stopAutoRotate(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  destroy(): void {
    this.stopAutoRotate();
  }
}

export function createAccordion(allowMultiple = false): AccordionManager {
  return new AccordionManager(allowMultiple);
}

export function createCarousel(totalItems: number, autoRotate = false): CarouselManager {
  return new CarouselManager(totalItems, autoRotate);
}

