import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { Subject } from 'rxjs';
import { VirtualScrollManager, VirtualScrollResult } from '../../utils/virtual-scrolling.util';

/**
 * Virtual scroll component
 * Implements virtual scrolling for large lists to improve performance
 */
@Component({
  selector: 'app-virtual-scroll',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #scrollContainer
      class="virtual-scroll-container"
      (scroll)="onScroll($event)"
      [style.height.px]="containerHeight"
    >
      <div [style.height.px]="totalHeight" class="virtual-scroll-spacer"></div>
      <div
        [style.transform]="'translate3d(0, ' + offsetY + 'px, 0)'"
        class="virtual-scroll-content"
      >
        <ng-container *ngFor="let index of visibleIndices; trackBy: trackByIndex">
          <ng-container
            *ngTemplateOutlet="itemTemplate; context: { $implicit: items[index], index: index }"
          ></ng-container>
        </ng-container>
      </div>
    </div>
  `,
  styles: [
    `
      .virtual-scroll-container {
        overflow-y: auto;
        overflow-x: hidden;
        position: relative;
      }

      .virtual-scroll-spacer {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        pointer-events: none;
      }

      .virtual-scroll-content {
        position: relative;
        /* Performance optimization: GPU acceleration */
        will-change: transform;
        /* Performance optimization: CSS containment */
        contain: layout style paint;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualScrollComponent<T> implements AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLElement>;
  @Input() items: T[] = [];
  @Input() itemHeight = 100;
  @Input() containerHeight = 400;
  @Input() overscan = 3;
  @Input() itemTemplate?: any; // TemplateRef

  @Output() scrollChange = new EventEmitter<VirtualScrollResult>();

  visibleIndices: number[] = [];
  totalHeight = 0;
  offsetY = 0;

  private scrollManager?: VirtualScrollManager;
  private readonly destroy$ = new Subject<void>();

  ngAfterViewInit(): void {
    this.scrollManager = new VirtualScrollManager({
      itemHeight: this.itemHeight,
      // containerHeight: this.containerHeight,
      bufferSize: this.overscan,
    });

    this.updateVirtualScroll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (this.scrollManager) {
      const result = this.scrollManager.calculate(
        this.items,
        target.scrollTop,
        target.clientHeight
      );
      this.updateDisplay(result);
      this.scrollChange.emit(result);
    }
  }

  private updateVirtualScroll(): void {
    if (this.scrollManager) {
      // Stub implementation - get scroll values from somewhere
      const scrollTop = 0;
      const viewportHeight = 600;
      const result = this.scrollManager.calculate(this.items, scrollTop, viewportHeight);
      this.updateDisplay(result);
    }
  }

  private updateDisplay(result: VirtualScrollResult): void {
    this.visibleIndices = result.visibleItems;
    this.totalHeight = result.totalHeight;
    this.offsetY = result.offsetY;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
