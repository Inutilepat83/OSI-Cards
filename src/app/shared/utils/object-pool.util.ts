/**
 * Object Pool Utility
 * Reuses frequently created objects to reduce GC pressure
 */

export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: ((obj: T) => void) | undefined;
  private maxSize: number;

  /**
   * Create an object pool
   *
   * @param createFn - Function to create new objects
   * @param resetFn - Optional function to reset objects before reuse
   * @param maxSize - Maximum pool size (default: 50)
   */
  constructor(createFn: () => T, resetFn?: (obj: T) => void, maxSize = 50) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  /**
   * Acquire an object from the pool
   */
  acquire(): T {
    if (this.pool.length > 0) {
      const obj = this.pool.pop()!;
      if (this.resetFn) {
        this.resetFn(obj);
      }
      return obj;
    }
    return this.createFn();
  }

  /**
   * Release an object back to the pool
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      if (this.resetFn) {
        this.resetFn(obj);
      }
      this.pool.push(obj);
    }
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.pool.length = 0;
  }

  /**
   * Get current pool size
   */
  get size(): number {
    return this.pool.length;
  }
}

/**
 * Create a pool for CardSection objects
 */
export function createCardSectionPool() {
  return new ObjectPool<any>(
    () => ({
      id: '',
      title: '',
      type: '',
      fields: [],
      items: [],
    }),
    (section) => {
      section.id = '';
      section.title = '';
      section.type = '';
      section.fields = [];
      section.items = [];
    },
    100
  );
}

/**
 * Create a pool for CardField objects
 */
export function createCardFieldPool() {
  return new ObjectPool<any>(
    () => ({
      label: '',
      value: '',
      id: '',
    }),
    (field) => {
      field.label = '';
      field.value = '';
      field.id = '';
    },
    200
  );
}
