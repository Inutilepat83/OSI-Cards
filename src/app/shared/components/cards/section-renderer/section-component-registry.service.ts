import { Injectable, Type } from '@angular/core';
import { SectionComponentInstance } from './section-component.interface';

/**
 * Interface for section component loading strategies
 */
export interface ISectionComponentLoader {
  canHandle(sectionType: string): boolean;
  loadComponent(): Promise<Type<SectionComponentInstance>>;
}

/**
 * Section Component Registry Service
 *
 * Uses a registry-based strategy pattern to load section components.
 * This replaces the switch statement approach for better extensibility.
 */
@Injectable({
  providedIn: 'root',
})
export class SectionComponentRegistryService {
  private loaders = new Map<string, ISectionComponentLoader>();
  private typeMappings = new Map<string, string>(); // Maps aliases to primary types

  /**
   * Register a component loader for a section type
   */
  register(type: string, loader: ISectionComponentLoader, aliases: string[] = []): void {
    this.loaders.set(type, loader);

    // Register aliases
    aliases.forEach((alias) => {
      this.typeMappings.set(alias, type);
    });
  }

  /**
   * Get component type for a section type
   */
  async getComponentType(sectionType: string): Promise<Type<SectionComponentInstance>> {
    // Resolve alias to primary type
    const primaryType = this.typeMappings.get(sectionType) || sectionType;

    // Find loader that can handle this type
    const loader = this.loaders.get(primaryType);

    if (loader && loader.canHandle(primaryType)) {
      try {
        return await loader.loadComponent();
      } catch (error) {
        console.error(`Failed to load component for type: ${primaryType}`, error);
        return this.getFallbackComponent();
      }
    }

    // Fallback if no loader found
    return this.getFallbackComponent();
  }

  /**
   * Get fallback component
   */
  private async getFallbackComponent(): Promise<Type<SectionComponentInstance>> {
    const fallbackLoader = this.loaders.get('fallback');
    if (fallbackLoader) {
      return fallbackLoader.loadComponent();
    }

    // Default fallback - from library
    const module =
      await import('projects/osi-cards-lib/src/lib/components/sections/fallback-section/fallback-section.component');
    return module.FallbackSectionComponent;
  }

  /**
   * Check if a type is registered
   */
  hasType(type: string): boolean {
    const primaryType = this.typeMappings.get(type) || type;
    return this.loaders.has(primaryType);
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.loaders.clear();
    this.typeMappings.clear();
  }
}
