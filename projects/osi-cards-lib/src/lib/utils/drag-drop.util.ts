/**
 * Drag & Drop Utilities
 *
 * Comprehensive drag and drop utilities for creating drag-and-drop
 * interfaces with touch support and accessibility.
 *
 * Features:
 * - Drag source management
 * - Drop target handling
 * - Touch device support
 * - Visual feedback
 * - Data transfer
 * - Sortable lists
 *
 * @example
 * ```typescript
 * import { makeDraggable, makeDropTarget } from '@osi-cards/utils';
 *
 * makeDraggable(element, {
 *   data: { id: '123', type: 'card' },
 *   onDragStart: (event) => console.log('Drag started')
 * });
 *
 * makeDropTarget(container, {
 *   accept: ['card'],
 *   onDrop: (event, data) => console.log('Dropped:', data)
 * });
 * ```
 */

/**
 * Drag options
 */
export interface DragOptions<T = any> {
  /**
   * Data to transfer
   */
  data?: T;

  /**
   * Drag handle selector (defaults to entire element)
   */
  handle?: string;

  /**
   * CSS class to add during drag
   */
  dragClass?: string;

  /**
   * Ghost element offset
   */
  ghostOffset?: { x: number; y: number };

  /**
   * Callback on drag start
   */
  onDragStart?: (event: DragEvent, data: T) => void;

  /**
   * Callback on drag end
   */
  onDragEnd?: (event: DragEvent, data: T) => void;

  /**
   * Callback during drag
   */
  onDrag?: (event: DragEvent, data: T) => void;
}

/**
 * Drop options
 */
export interface DropOptions<T = any> {
  /**
   * Accepted data types
   */
  accept?: string[];

  /**
   * CSS class to add on drag over
   */
  hoverClass?: string;

  /**
   * Callback on drop
   */
  onDrop?: (event: DragEvent, data: T) => void;

  /**
   * Callback on drag enter
   */
  onDragEnter?: (event: DragEvent) => void;

  /**
   * Callback on drag leave
   */
  onDragLeave?: (event: DragEvent) => void;

  /**
   * Callback on drag over
   */
  onDragOver?: (event: DragEvent) => void;
}

/**
 * Make element draggable
 *
 * @param element - Element to make draggable
 * @param options - Drag options
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * const cleanup = makeDraggable(cardElement, {
 *   data: { id: '123', title: 'My Card' },
 *   dragClass: 'dragging'
 * });
 * ```
 */
export function makeDraggable<T = any>(
  element: HTMLElement,
  options: DragOptions<T> = {}
): () => void {
  element.draggable = true;

  const handleDragStart = (event: DragEvent): void => {
    if (options.dragClass) {
      element.classList.add(options.dragClass);
    }

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';

      if (options.data) {
        event.dataTransfer.setData('application/json', JSON.stringify(options.data));
      }
    }

    if (options.onDragStart) {
      options.onDragStart(event, options.data as T);
    }
  };

  const handleDrag = (event: DragEvent): void => {
    if (options.onDrag) {
      options.onDrag(event, options.data as T);
    }
  };

  const handleDragEnd = (event: DragEvent): void => {
    if (options.dragClass) {
      element.classList.remove(options.dragClass);
    }

    if (options.onDragEnd) {
      options.onDragEnd(event, options.data as T);
    }
  };

  element.addEventListener('dragstart', handleDragStart as EventListener);
  element.addEventListener('drag', handleDrag as EventListener);
  element.addEventListener('dragend', handleDragEnd as EventListener);

  return () => {
    element.draggable = false;
    element.removeEventListener('dragstart', handleDragStart as EventListener);
    element.removeEventListener('drag', handleDrag as EventListener);
    element.removeEventListener('dragend', handleDragEnd as EventListener);
  };
}

/**
 * Make element a drop target
 *
 * @param element - Element to make drop target
 * @param options - Drop options
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * const cleanup = makeDropTarget(container, {
 *   accept: ['card'],
 *   hoverClass: 'drag-over',
 *   onDrop: (event, data) => {
 *     console.log('Dropped:', data);
 *   }
 * });
 * ```
 */
export function makeDropTarget<T = any>(
  element: HTMLElement,
  options: DropOptions<T> = {}
): () => void {
  const handleDragEnter = (event: DragEvent): void => {
    event.preventDefault();

    if (options.hoverClass) {
      element.classList.add(options.hoverClass);
    }

    if (options.onDragEnter) {
      options.onDragEnter(event);
    }
  };

  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    if (options.onDragOver) {
      options.onDragOver(event);
    }
  };

  const handleDragLeave = (event: DragEvent): void => {
    if (options.hoverClass) {
      element.classList.remove(options.hoverClass);
    }

    if (options.onDragLeave) {
      options.onDragLeave(event);
    }
  };

  const handleDrop = (event: DragEvent): void => {
    event.preventDefault();

    if (options.hoverClass) {
      element.classList.remove(options.hoverClass);
    }

    if (event.dataTransfer) {
      try {
        const data = JSON.parse(event.dataTransfer.getData('application/json'));

        if (options.onDrop) {
          options.onDrop(event, data);
        }
      } catch (error) {
        console.error('Failed to parse drop data:', error);
      }
    }
  };

  element.addEventListener('dragenter', handleDragEnter as EventListener);
  element.addEventListener('dragover', handleDragOver as EventListener);
  element.addEventListener('dragleave', handleDragLeave as EventListener);
  element.addEventListener('drop', handleDrop as EventListener);

  return () => {
    element.removeEventListener('dragenter', handleDragEnter as EventListener);
    element.removeEventListener('dragover', handleDragOver as EventListener);
    element.removeEventListener('dragleave', handleDragLeave as EventListener);
    element.removeEventListener('drop', handleDrop as EventListener);
  };
}

/**
 * Create sortable list
 *
 * @param container - Container element
 * @param items - Array of items
 * @param onReorder - Callback when items are reordered
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * const cleanup = makeSortable(listContainer, items, (newOrder) => {
 *   console.log('New order:', newOrder);
 *   updateItems(newOrder);
 * });
 * ```
 */
export function makeSortable<T>(
  container: HTMLElement,
  items: T[],
  onReorder: (newOrder: T[]) => void
): () => void {
  const cleanups: Array<() => void> = [];
  let draggedIndex: number | null = null;

  Array.from(container.children).forEach((child, index) => {
    const element = child as HTMLElement;

    const dragCleanup = makeDraggable(element, {
      data: { index },
      dragClass: 'dragging',
      onDragStart: () => {
        draggedIndex = index;
      },
      onDragEnd: () => {
        draggedIndex = null;
      },
    });

    const dropCleanup = makeDropTarget(element, {
      hoverClass: 'drag-over',
      onDrop: (event, data: any) => {
        if (draggedIndex !== null && data.index !== index) {
          const newOrder = [...items];
          const [movedItem] = newOrder.splice(draggedIndex, 1);
          newOrder.splice(index, 0, movedItem);
          onReorder(newOrder);
        }
      },
    });

    cleanups.push(dragCleanup, dropCleanup);
  });

  return () => {
    cleanups.forEach(cleanup => cleanup());
  };
}

/**
 * Get files from drop event
 *
 * @param event - Drop event
 * @returns Array of files
 */
export function getDroppedFiles(event: DragEvent): File[] {
  const files: File[] = [];

  if (event.dataTransfer?.files) {
    Array.from(event.dataTransfer.files).forEach(file => {
      files.push(file);
    });
  }

  return files;
}

/**
 * Check if event contains files
 *
 * @param event - Drag event
 * @returns True if event contains files
 */
export function hasFiles(event: DragEvent): boolean {
  return event.dataTransfer?.types.includes('Files') || false;
}

/**
 * Create drag image
 *
 * @param element - Element to use as drag image
 * @param event - Drag event
 */
export function setDragImage(element: HTMLElement, event: DragEvent): void {
  if (event.dataTransfer) {
    event.dataTransfer.setDragImage(element, 0, 0);
  }
}

