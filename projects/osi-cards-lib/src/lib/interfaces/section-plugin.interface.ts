import { Type } from '@angular/core';
import { CardSection } from '../models';
import { BaseSectionComponent } from '../components/sections/base-section.component';

/**
 * Plugin metadata for a custom section type
 */
export interface SectionPluginMetadata {
  /** Unique identifier for the section type */
  type: string;
  /** Display name for the section type */
  name: string;
  /** Description of what this section type does */
  description?: string;
  /** Version of the plugin */
  version?: string;
  /** Author information */
  author?: string;
}

/**
 * Configuration options for a section plugin
 */
export interface SectionPluginConfig {
  /** Priority for plugin resolution (higher = higher priority) */
  priority?: number;
  /** Whether this plugin should override built-in sections with the same type */
  override?: boolean;
  /** Additional metadata */
  metadata?: Partial<SectionPluginMetadata>;
}

/**
 * Plugin interface that custom section components must implement
 * 
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-custom-section',
 *   standalone: true,
 *   template: `...`
 * })
 * export class CustomSectionComponent extends BaseSectionComponent implements SectionPlugin {
 *   static readonly PLUGIN_TYPE = 'custom-section';
 *   
 *   getPluginType(): string {
 *     return CustomSectionComponent.PLUGIN_TYPE;
 *   }
 *   
 *   canHandle(section: CardSection): boolean {
 *     return section.type === 'custom-section';
 *   }
 * }
 * ```
 */
export interface SectionPlugin {
  /**
   * Returns the section type this plugin handles
   */
  getPluginType(): string;

  /**
   * Determines if this plugin can handle the given section
   * @param section - The section to check
   * @returns True if this plugin can handle the section
   */
  canHandle(section: CardSection): boolean;
}

/**
 * Extended plugin interface with component type
 */
export interface RegisteredSectionPlugin extends SectionPluginMetadata {
  /** The component class that handles this section type */
  component: Type<BaseSectionComponent>;
  /** Configuration options */
  config: SectionPluginConfig;
  /** Priority for resolution (default: 0) */
  priority: number;
}








