/**
 * Component Composition Utilities
 *
 * Utilities for composing and combining Angular components,
 * including HOC patterns, component factories, and dynamic composition.
 *
 * Features:
 * - Component factories
 * - Dynamic component loading
 * - Component wrapping
 * - Props merging
 * - Component registry
 *
 * @example
 * ```typescript
 * import { createComponentFactory, wrapComponent } from '@osi-cards/utils';
 *
 * const factory = createComponentFactory(MyComponent);
 * const instance = factory.create({ input1: 'value' });
 * ```
 */

import {
  Component,
  ComponentRef,
  ViewContainerRef,
  Type,
  Injector,
  EnvironmentInjector,
  createComponent,
  EnvironmentProviders,
} from '@angular/core';

/**
 * Component factory options
 */
export interface ComponentFactoryOptions {
  /**
   * Injector to use
   */
  injector?: Injector;

  /**
   * Environment injector
   */
  environmentInjector?: EnvironmentInjector;

  /**
   * Project content nodes
   */
  projectableNodes?: Node[][];
}

/**
 * Component factory
 *
 * Creates instances of a component with given inputs.
 */
export class ComponentFactory<T> {
  constructor(
    private componentType: Type<T>,
    private defaultOptions: ComponentFactoryOptions = {}
  ) {}

  /**
   * Create component instance
   *
   * @param inputs - Component inputs
   * @param container - View container ref
   * @param options - Factory options
   * @returns Component reference
   */
  create(
    inputs: Partial<T>,
    container: ViewContainerRef,
    options: ComponentFactoryOptions = {}
  ): ComponentRef<T> {
    const componentRef = container.createComponent(this.componentType, {
      injector: options.injector || this.defaultOptions.injector,
      environmentInjector: options.environmentInjector || this.defaultOptions.environmentInjector,
      projectableNodes: options.projectableNodes || this.defaultOptions.projectableNodes,
    });

    // Set inputs
    Object.entries(inputs).forEach(([key, value]) => {
      componentRef.setInput(key, value);
    });

    return componentRef;
  }

  /**
   * Create multiple instances
   *
   * @param inputsArray - Array of input objects
   * @param container - View container ref
   * @returns Array of component references
   */
  createMany(inputsArray: Array<Partial<T>>, container: ViewContainerRef): ComponentRef<T>[] {
    return inputsArray.map((inputs) => this.create(inputs, container));
  }
}

/**
 * Create component factory
 *
 * @param componentType - Component type
 * @param options - Default options
 * @returns Component factory instance
 *
 * @example
 * ```typescript
 * const cardFactory = createComponentFactory(CardComponent);
 * const card = cardFactory.create({ title: 'Hello' }, container);
 * ```
 */
export function createComponentFactory<T>(
  componentType: Type<T>,
  options?: ComponentFactoryOptions
): ComponentFactory<T> {
  return new ComponentFactory(componentType, options);
}

/**
 * Load component dynamically
 *
 * @param container - View container
 * @param componentType - Component to load
 * @param inputs - Component inputs
 * @returns Component reference
 */
export function loadComponentDynamic<T>(
  container: ViewContainerRef,
  componentType: Type<T>,
  inputs?: Partial<T>
): ComponentRef<T> {
  const factory = new ComponentFactory(componentType);
  return factory.create(inputs || {}, container);
}

/**
 * Replace component
 *
 * @param container - View container
 * @param oldRef - Old component reference
 * @param newType - New component type
 * @param inputs - New component inputs
 * @returns New component reference
 */
export function replaceComponent<T>(
  container: ViewContainerRef,
  oldRef: ComponentRef<any>,
  newType: Type<T>,
  inputs?: Partial<T>
): ComponentRef<T> {
  const index = container.indexOf(oldRef.hostView);
  oldRef.destroy();

  const newRef = loadComponentDynamic(container, newType, inputs);

  if (index >= 0) {
    container.move(newRef.hostView, index);
  }

  return newRef;
}

/**
 * Component registry for dynamic loading
 */
export class ComponentRegistry {
  private components = new Map<string, Type<any>>();

  /**
   * Register component
   *
   * @param name - Component name/key
   * @param componentType - Component type
   */
  register(name: string, componentType: Type<any>): void {
    this.components.set(name, componentType);
  }

  /**
   * Register multiple components
   *
   * @param components - Object mapping names to types
   */
  registerMany(components: Record<string, Type<any>>): void {
    Object.entries(components).forEach(([name, type]) => {
      this.register(name, type);
    });
  }

  /**
   * Get component type by name
   *
   * @param name - Component name
   * @returns Component type or undefined
   */
  get(name: string): Type<any> | undefined {
    return this.components.get(name);
  }

  /**
   * Check if component is registered
   *
   * @param name - Component name
   * @returns True if registered
   */
  has(name: string): boolean {
    return this.components.has(name);
  }

  /**
   * Load component by name
   *
   * @param name - Component name
   * @param container - View container
   * @param inputs - Component inputs
   * @returns Component reference or null
   */
  load(name: string, container: ViewContainerRef, inputs?: any): ComponentRef<any> | null {
    const componentType = this.get(name);

    if (!componentType) {
      console.error(`Component not found: ${name}`);
      return null;
    }

    return loadComponentDynamic(container, componentType, inputs);
  }

  /**
   * Get all registered component names
   *
   * @returns Array of component names
   */
  getNames(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Unregister component
   *
   * @param name - Component name
   * @returns True if component was registered
   */
  unregister(name: string): boolean {
    return this.components.delete(name);
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.components.clear();
  }
}

/**
 * Global component registry
 */
export const globalComponentRegistry = new ComponentRegistry();

/**
 * Create portal for component
 *
 * Creates a component in a portal for rendering elsewhere.
 */
export interface ComponentPortal<T> {
  component: ComponentRef<T>;
  attach: (container: ViewContainerRef) => void;
  detach: () => void;
  destroy: () => void;
}

/**
 * Higher-order component wrapper
 *
 * Wraps a component with additional functionality.
 *
 * @example
 * ```typescript
 * const EnhancedCard = withLoading(CardComponent);
 * ```
 */
export function withLoading<T>(componentType: Type<T>): Type<T> {
  // This would create a wrapper component with loading state
  // Implementation would use component composition patterns
  return componentType; // Simplified for example
}

/**
 * Merge component inputs
 *
 * @param defaults - Default inputs
 * @param overrides - Override inputs
 * @returns Merged inputs
 */
export function mergeInputs<T>(defaults: Partial<T>, overrides: Partial<T>): Partial<T> {
  return { ...defaults, ...overrides };
}

/**
 * Clone component reference
 *
 * @param ref - Component reference to clone
 * @param container - Target container
 * @returns New component reference
 */
export function cloneComponent<T>(
  ref: ComponentRef<T>,
  container: ViewContainerRef
): ComponentRef<T> {
  const inputs: any = {};

  // Extract inputs (simplified - would need reflection)
  Object.keys(ref.instance as any).forEach((key) => {
    inputs[key] = (ref.instance as any)[key];
  });

  return loadComponentDynamic(container, ref.componentType, inputs);
}
