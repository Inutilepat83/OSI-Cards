/**
 * Drag and drop utilities
 * Allow users to reorder sections and cards via drag-and-drop
 */

export interface DragDropOptions {
  onDragStart?: (event: DragEvent, index: number) => void;
  onDragEnd?: (event: DragEvent) => void;
  onDragOver?: (event: DragEvent, index: number) => void;
  onDrop?: (event: DragEvent, fromIndex: number, toIndex: number) => void;
  dragHandleSelector?: string;
}

/**
 * Drag and drop manager
 */
export class DragDropManager {
  private draggedIndex: number | null = null;
  private options: DragDropOptions;

  constructor(options: DragDropOptions = {}) {
    this.options = options;
  }

  /**
   * Setup drag and drop for an element
   */
  setupDragDrop(element: HTMLElement, index: number): void {
    element.draggable = true;
    element.setAttribute('data-drag-index', String(index));

    element.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
    element.addEventListener('dragend', (e) => this.handleDragEnd(e));
    element.addEventListener('dragover', (e) => this.handleDragOver(e, index));
    element.addEventListener('drop', (e) => this.handleDrop(e, index));
  }

  private handleDragStart(event: DragEvent, index: number): void {
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
    if (this.options.onDragStart) {
      this.options.onDragStart(event, index);
    }
  }

  private handleDragEnd(event: DragEvent): void {
    this.draggedIndex = null;
    if (this.options.onDragEnd) {
      this.options.onDragEnd(event);
    }
  }

  private handleDragOver(event: DragEvent, index: number): void {
    if (this.draggedIndex === null || this.draggedIndex === index) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.options.onDragOver) {
      this.options.onDragOver(event, index);
    }
  }

  private handleDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    if (this.draggedIndex === null || this.draggedIndex === index) {
      return;
    }
    if (this.options.onDrop && this.draggedIndex !== null) {
      this.options.onDrop(event, this.draggedIndex, index);
    }
    this.draggedIndex = null;
  }
}


