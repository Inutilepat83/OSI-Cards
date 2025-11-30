import { Type } from '@angular/core';
import { BaseSectionComponent } from '../components/sections/base-section.component';

/**
 * Section component registration metadata
 */
export interface SectionComponentOptions {
  /**
   * The section type this component handles (e.g., 'info', 'analytics')
   */
  type: string;
  
  /**
   * Optional display name for the section
   */
  name?: string;
  
  /**
   * Optional description
   */
  description?: string;
  
  /**
   * Priority for component resolution (higher = higher priority)
   * Used when multiple components could handle the same type
   */
  priority?: number;
  
  /**
   * Whether this component should override built-in sections
   */
  override?: boolean;
  
  /**
   * Type aliases this component also handles
   */
  aliases?: string[];
}

/**
 * Registry of decorated section components
 * Populated at module load time by the decorator
 */
export const DECORATED_SECTION_COMPONENTS = new Map<string, {
  component: Type<BaseSectionComponent>;
  options: SectionComponentOptions;
}>();

/**
 * Decorator to mark a component as a section component
 * 
 * This decorator is used to auto-register section components
 * so they can be discovered at build time or runtime.
 * 
 * @example
 * ```typescript
 * @SectionComponent({ type: 'custom-section', name: 'Custom Section' })
 * @Component({
 *   selector: 'app-custom-section',
 *   ...
 * })
 * export class CustomSectionComponent extends BaseSectionComponent {
 *   // ...
 * }
 * ```
 */
export function SectionComponent(options: SectionComponentOptions) {
  return function<T extends Type<BaseSectionComponent>>(target: T): T {
    // Register the component
    const type = options.type.toLowerCase();
    DECORATED_SECTION_COMPONENTS.set(type, {
      component: target,
      options: {
        ...options,
        type,
        priority: options.priority ?? 0,
        override: options.override ?? false
      }
    });
    
    // Also register aliases
    if (options.aliases) {
      options.aliases.forEach(alias => {
        const aliasLower = alias.toLowerCase();
        if (!DECORATED_SECTION_COMPONENTS.has(aliasLower)) {
          DECORATED_SECTION_COMPONENTS.set(aliasLower, {
            component: target,
            options: {
              ...options,
              type: aliasLower,
              priority: (options.priority ?? 0) - 1 // Aliases have lower priority
            }
          });
        }
      });
    }
    
    // Add static metadata to the component class
    (target as any).__sectionType = type;
    (target as any).__sectionOptions = options;
    
    return target;
  };
}

/**
 * Get all registered section components
 */
export function getRegisteredSectionComponents(): Map<string, {
  component: Type<BaseSectionComponent>;
  options: SectionComponentOptions;
}> {
  return DECORATED_SECTION_COMPONENTS;
}

/**
 * Check if a type has a registered component
 */
export function hasRegisteredComponent(type: string): boolean {
  return DECORATED_SECTION_COMPONENTS.has(type.toLowerCase());
}

/**
 * Get the registered component for a type
 */
export function getRegisteredComponent(type: string): Type<BaseSectionComponent> | undefined {
  return DECORATED_SECTION_COMPONENTS.get(type.toLowerCase())?.component;
}

/**
 * Get all section types from registered components
 */
export function getRegisteredSectionTypes(): string[] {
  return Array.from(DECORATED_SECTION_COMPONENTS.keys());
}

