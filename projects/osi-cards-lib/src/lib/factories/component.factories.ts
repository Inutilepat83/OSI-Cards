/**
 * Component Factories
 *
 * Factory functions for dynamic component creation.
 *
 * @example
 * ```typescript
 * import { createDynamicComponent } from '@osi-cards/factories';
 *
 * const componentRef = createDynamicComponent(MyComponent, container, injector);
 * ```
 */

import {
  ComponentRef,
  EnvironmentInjector,
  Type,
  ViewContainerRef,
  createComponent,
} from '@angular/core';

/**
 * Create dynamic component
 */
export function createDynamicComponent<T>(
  component: Type<T>,
  container: ViewContainerRef,
  environmentInjector: EnvironmentInjector
): ComponentRef<T> {
  return container.createComponent(component, {
    environmentInjector,
  });
}

/**
 * Create component with inputs
 */
export function createComponentWithInputs<T>(
  component: Type<T>,
  container: ViewContainerRef,
  environmentInjector: EnvironmentInjector,
  inputs: Partial<T>
): ComponentRef<T> {
  const componentRef = createDynamicComponent(component, container, environmentInjector);

  Object.assign(componentRef.instance, inputs);
  componentRef.changeDetectorRef.detectChanges();

  return componentRef;
}

/**
 * Create component at index
 */
export function createComponentAtIndex<T>(
  component: Type<T>,
  container: ViewContainerRef,
  environmentInjector: EnvironmentInjector,
  index: number
): ComponentRef<T> {
  return container.createComponent(component, {
    index,
    environmentInjector,
  });
}

/**
 * Remove component
 */
export function removeComponent(componentRef: ComponentRef<any>): void {
  componentRef.destroy();
}

/**
 * Clear container
 */
export function clearContainer(container: ViewContainerRef): void {
  container.clear();
}

/**
 * Component pool
 */
export class ComponentPool<T> {
  private pool: ComponentRef<T>[] = [];

  constructor(
    private component: Type<T>,
    private container: ViewContainerRef,
    private environmentInjector: EnvironmentInjector,
    private maxSize = 10
  ) {}

  acquire(): ComponentRef<T> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }

    return createDynamicComponent(this.component, this.container, this.environmentInjector);
  }

  release(componentRef: ComponentRef<T>): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(componentRef);
    } else {
      componentRef.destroy();
    }
  }

  clear(): void {
    this.pool.forEach((ref) => ref.destroy());
    this.pool = [];
  }

  size(): number {
    return this.pool.length;
  }
}



