import { Injectable, Type, inject } from '@angular/core';
import { CardSection } from '../../models';
import { BaseSectionComponent } from '../sections/base-section.component';
import { SectionPluginRegistry } from '../../services/section-plugin-registry.service';
import { 
  SectionType, 
  SectionTypeInput, 
  resolveSectionType, 
  isValidSectionType,
  getSectionMetadata
} from '../../models/generated-section-types';
import { SECTION_COMPONENT_MAP, getSectionComponent } from './section-component-map.generated';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySectionComponent = Type<BaseSectionComponent<any>>;

/**
 * Service for dynamically loading section components
 * 
 * This service replaces the switch statement approach with a registry-based
 * dynamic component resolution system. It supports:
 * - Registry-based component mapping
 * - Type alias resolution
 * - Plugin component overrides
 * - Fallback to default component for unknown types
 */
@Injectable({
  providedIn: 'root'
})
export class DynamicSectionLoaderService {
  private readonly pluginRegistry = inject(SectionPluginRegistry);
  private readonly componentCache = new Map<string, AnySectionComponent>();

  /**
   * Get the component class for a section
   * 
   * Resolution order:
   * 1. Check plugin registry for custom overrides
   * 2. Resolve type aliases to canonical types
   * 3. Look up in generated component map
   * 4. Fall back to FallbackSectionComponent
   */
  getComponentForSection(section: CardSection): AnySectionComponent {
    if (!section?.type) {
      return this.getFallbackComponent();
    }

    const cacheKey = section.type.toLowerCase();
    
    // Check cache first
    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey)!;
    }

    // Check plugin registry for custom components
    const pluginComponent = this.pluginRegistry.getComponentForSection(section);
    if (pluginComponent) {
      this.componentCache.set(cacheKey, pluginComponent);
      return pluginComponent;
    }

    // Resolve type alias and get component from generated map
    const typeInput = section.type.toLowerCase() as SectionTypeInput;
    
    if (isValidSectionType(typeInput)) {
      const resolvedType = resolveSectionType(typeInput);
      const component = getSectionComponent(resolvedType);
      
      if (component) {
        this.componentCache.set(cacheKey, component);
        return component;
      }
    }

    // Fall back to fallback component
    return this.getFallbackComponent();
  }

  /**
   * Get the fallback component for unknown types
   */
  private getFallbackComponent(): AnySectionComponent {
    return SECTION_COMPONENT_MAP['fallback'];
  }

  /**
   * Resolve a section type to its canonical form
   */
  resolveType(type: string): SectionType {
    const typeInput = type.toLowerCase() as SectionTypeInput;
    
    if (isValidSectionType(typeInput)) {
      return resolveSectionType(typeInput);
    }
    
    return 'fallback';
  }

  /**
   * Check if a type is supported (either built-in or via plugin)
   */
  isTypeSupported(type: string): boolean {
    const typeInput = type.toLowerCase();
    
    // Check built-in types
    if (isValidSectionType(typeInput as SectionTypeInput)) {
      return true;
    }
    
    // Check plugin registry
    return this.pluginRegistry.hasPlugin(typeInput);
  }

  /**
   * Get metadata for a section type
   */
  getTypeMetadata(type: string) {
    const typeInput = type.toLowerCase() as SectionTypeInput;
    
    if (isValidSectionType(typeInput)) {
      return getSectionMetadata(typeInput);
    }
    
    return undefined;
  }

  /**
   * Clear the component cache (useful for testing or hot reload)
   */
  clearCache(): void {
    this.componentCache.clear();
  }

  /**
   * Get all supported section types (built-in + plugins)
   */
  getSupportedTypes(): string[] {
    const builtInTypes = Object.keys(SECTION_COMPONENT_MAP);
    const pluginTypes = this.pluginRegistry.getPlugins().map(p => p.type);
    
    return [...new Set([...builtInTypes, ...pluginTypes])];
  }
}

