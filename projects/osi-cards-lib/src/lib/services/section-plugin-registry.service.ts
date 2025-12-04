import { Injectable, Type, inject } from '@angular/core';
import { CardSection } from '../models';
import { BaseSectionComponent } from '../components/sections/base-section.component';
import {
  SectionPlugin,
  RegisteredSectionPlugin,
  SectionPluginConfig,
  SectionPluginMetadata,
} from '../interfaces/section-plugin.interface';
import { FallbackSectionComponent } from '../components/sections/fallback-section/fallback-section.component';

/**
 * Registry service for managing custom section type plugins
 *
 * Allows external developers to register custom section components that extend
 * the library's built-in section types.
 *
 * @example
 * ```typescript
 * const registry = inject(SectionPluginRegistry);
 *
 * // Register a custom section plugin
 * registry.register({
 *   type: 'custom-section',
 *   name: 'Custom Section',
 *   description: 'A custom section type',
 *   component: CustomSectionComponent,
 *   config: {
 *     priority: 10,
 *     override: false
 *   }
 * });
 *
 * // Get a component for a section type
 * const component = registry.getComponent(section);
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class SectionPluginRegistry {
  private plugins = new Map<string, RegisteredSectionPlugin>();
  private readonly defaultFallback = FallbackSectionComponent;

  /**
   * Register a custom section plugin
   *
   * @param plugin - The plugin metadata and component
   * @throws Error if plugin type already exists and override is false
   */
  register(plugin: {
    type: string;
    name: string;
    description?: string;
    component: Type<BaseSectionComponent & SectionPlugin>;
    config?: SectionPluginConfig;
    metadata?: Partial<SectionPluginMetadata>;
  }): void {
    const { type, name, description, component, config = {}, metadata = {} } = plugin;

    // Check if plugin already exists
    if (this.plugins.has(type) && !config.override) {
      throw new Error(
        `Section plugin with type "${type}" is already registered. ` +
          `Set override: true in config to replace it.`
      );
    }

    // Validate component implements SectionPlugin
    const componentInstance = new component();
    if (!componentInstance.getPluginType || !componentInstance.canHandle) {
      console.warn(
        `Component ${component.name} does not properly implement SectionPlugin interface. ` +
          `It should extend BaseSectionComponent and implement SectionPlugin methods.`
      );
    }

    const registeredPlugin: RegisteredSectionPlugin = {
      type,
      name,
      description,
      component: component as Type<BaseSectionComponent>,
      config,
      priority: config.priority ?? 0,
      version: metadata.version,
      author: metadata.author,
    };

    this.plugins.set(type, registeredPlugin);
  }

  /**
   * Unregister a plugin
   *
   * @param type - The section type to unregister
   * @returns True if plugin was removed, false if not found
   */
  unregister(type: string): boolean {
    return this.plugins.delete(type);
  }

  /**
   * Get the component class for a given section type
   *
   * @param sectionType - The section type identifier
   * @returns The component class or null if not found
   */
  getComponent(sectionType: string): Type<BaseSectionComponent> | null {
    const plugin = this.plugins.get(sectionType);
    return plugin?.component ?? null;
  }

  /**
   * Get the component class for a section
   * Returns null if no plugin is registered (built-in sections will handle it)
   *
   * @param section - The card section
   * @returns The component class or null if no plugin registered
   */
  getComponentForSection(section: CardSection): Type<BaseSectionComponent> | null {
    const sectionType = section.type?.toLowerCase();

    if (!sectionType) {
      return null;
    }

    // Check if a plugin is registered for this type
    const plugin = this.plugins.get(sectionType);
    if (plugin) {
      return plugin.component;
    }

    // Return null to let built-in renderer handle it
    return null;
  }

  /**
   * Check if a plugin is registered for a section type
   *
   * @param type - The section type identifier
   * @returns True if a plugin is registered
   */
  hasPlugin(type: string): boolean {
    return this.plugins.has(type);
  }

  /**
   * Get all registered plugins
   *
   * @returns Array of registered plugin metadata
   */
  getPlugins(): RegisteredSectionPlugin[] {
    return Array.from(this.plugins.values()).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get plugin metadata for a specific type
   *
   * @param type - The section type identifier
   * @returns Plugin metadata or null if not found
   */
  getPluginMetadata(type: string): RegisteredSectionPlugin | null {
    return this.plugins.get(type) ?? null;
  }

  /**
   * Clear all registered plugins
   */
  clear(): void {
    this.plugins.clear();
  }

  /**
   * Register multiple plugins at once
   *
   * @param plugins - Array of plugins to register
   */
  registerAll(
    plugins: Array<{
      type: string;
      name: string;
      description?: string;
      component: Type<BaseSectionComponent & SectionPlugin>;
      config?: SectionPluginConfig;
      metadata?: Partial<SectionPluginMetadata>;
    }>
  ): void {
    plugins.forEach((plugin) => {
      try {
        this.register(plugin);
      } catch (error) {
        console.error(`Failed to register plugin "${plugin.type}":`, error);
      }
    });
  }
}
