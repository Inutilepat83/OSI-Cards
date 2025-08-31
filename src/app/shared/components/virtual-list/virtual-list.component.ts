import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewChild,
} from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

export interface VirtualListItem {
  id: string | number;
  [key: string]: any;
}

@Component({
  selector: 'app-virtual-list',
  templateUrl: './virtual-list.component.html',
  styleUrls: ['./virtual-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualListComponent {
  @Input() items: VirtualListItem[] = [];
  @Input() itemSize: number = 50;
  @Input() minBufferPx: number = 200;
  @Input() maxBufferPx: number = 400;
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';

  @Output() itemClick = new EventEmitter<VirtualListItem>();
  @Output() scrolledIndexChanged = new EventEmitter<any>();

  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

  trackByFn(index: number, item: VirtualListItem): string | number {
    return item.id;
  }

  onItemClick(item: VirtualListItem): void {
    this.itemClick.emit(item);
  }

  onScrolledIndexChanged(event: any): void {
    this.scrolledIndexChanged.emit(event);
  }

  // Public methods for external control
  scrollToIndex(index: number): void {
    this.viewport?.scrollToIndex(index);
  }

  scrollToOffset(offset: number): void {
    this.viewport?.scrollToOffset(offset);
  }

  getRenderedRange(): { start: number; end: number } | null {
    return this.viewport?.getRenderedRange() || null;
  }
}
