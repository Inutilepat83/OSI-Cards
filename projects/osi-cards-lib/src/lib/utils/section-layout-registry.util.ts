/**
 * Section Layout Registry
 * 
 * Auto-discovers layout configurations from section component classes.
 * No manual registration needed - just add layoutConfig to your component!
 * 
 * @example
 * ```typescript
 * // In your component:
 * export class MySectionComponent extends BaseSectionComponent {
 *   static readonly layoutConfig: SectionLayoutConfig = {
 *     preferredColumns: 2,
 *     minColumns: 1,
 *     maxColumns: 3,
 *   };
 * }
 * 
 * // Then add to section-components.map.ts:
 * 'my-section': MySectionComponent,
 * ```
 */

import { CardSection } from '../models/card.model';
import { SectionLayoutConfig, DEFAULT_LAYOUT_CONFIG } from '../components/sections/base-section.component';
import { SECTION_COMPONENT_MAP, getSectionComponent } from '../components/sections/section-components.map';

// Re-export for convenience
export { SectionLayoutConfig, DEFAULT_LAYOUT_CONFIG };

/**
 * Get layout configuration for a section type.
 * Reads directly from the component class's static layoutConfig.
 * 
 * @param type - Section type (e.g., 'analytics', 'overview')
 * @returns Layout configuration or default if not found
 */
export function getSectionLayoutConfig(type: string): SectionLayoutConfig {
  const componentClass = getSectionComponent(type);
  return componentClass?.layoutConfig ?? DEFAULT_LAYOUT_CONFIG;
}

/**
 * Check if a section type has a registered layout config
 */
export function hasLayoutConfig(type: string): boolean {
  const componentClass = getSectionComponent(type);
  return componentClass?.layoutConfig !== undefined;
}

/**
 * Get all registered section types
 */
export function getRegisteredSectionTypes(): string[] {
  return Object.keys(SECTION_COMPONENT_MAP);
}

/**
 * Calculate smart column span based on section content and layout config.
 * Uses the layoutConfig defined in the section component class.
 * 
 * @param section - The card section
 * @param maxColumns - Maximum available columns (default: 4)
 * @returns Optimal column span
 */
export function calculateSmartColumns(
  section: CardSection,
  maxColumns: number = 4
): number {
  const type = section.type?.toLowerCase() ?? 'info';
  const config = getSectionLayoutConfig(type);
  
  // Start with preferred columns
  let columns = config.preferredColumns;
  
  // Apply content-aware expansion rules
  columns = applyContentExpansion(section, config, columns);
  
  // Handle matchItemCount for horizontal layouts
  if (config.matchItemCount) {
    const itemCount = section.items?.length ?? section.fields?.length ?? 0;
    if (itemCount > 0) {
      columns = Math.min(itemCount, config.maxColumns);
    }
  }
  
  // Clamp to min/max bounds and available columns
  columns = Math.max(config.minColumns, columns);
  columns = Math.min(config.maxColumns, columns, maxColumns);
  
  // Also respect section-level overrides if present
  if (section.preferredColumns !== undefined) {
    columns = section.preferredColumns;
  }
  if (section.minColumns !== undefined) {
    columns = Math.max(section.minColumns, columns);
  }
  if (section.maxColumns !== undefined) {
    columns = Math.min(section.maxColumns, columns);
  }
  
  return Math.max(1, Math.min(columns, maxColumns));
}

/**
 * Apply content-based expansion rules from the config
 */
function applyContentExpansion(
  section: CardSection,
  config: SectionLayoutConfig,
  currentColumns: number
): number {
  let columns = currentColumns;
  
  // Expand based on field count
  if (config.expandOnFieldCount !== undefined) {
    const fieldCount = section.fields?.length ?? 0;
    if (fieldCount >= config.expandOnFieldCount) {
      columns = Math.min(columns + 1, config.maxColumns);
    }
  }
  
  // Expand based on item count
  if (config.expandOnItemCount !== undefined) {
    const itemCount = section.items?.length ?? 0;
    if (itemCount >= config.expandOnItemCount) {
      columns = Math.min(columns + 1, config.maxColumns);
    }
  }
  
  // Expand based on description length
  if (config.expandOnDescriptionLength !== undefined) {
    const descLength = section.description?.length ?? 0;
    if (descLength >= config.expandOnDescriptionLength) {
      columns = Math.min(columns + 1, config.maxColumns);
    }
  }
  
  return columns;
}

/**
 * Register a custom section layout configuration.
 * Use this for dynamically registered section types not in the component map.
 * 
 * @deprecated Prefer adding layoutConfig to your component class instead
 */
export function registerSectionLayout(type: string, config: SectionLayoutConfig): void {
  console.warn(
    `registerSectionLayout('${type}') is deprecated. ` +
    `Add 'static layoutConfig' to your component and include it in section-components.map.ts instead.`
  );
  // Store in a fallback map for backward compatibility
  CUSTOM_LAYOUT_CONFIGS.set(type.toLowerCase(), config);
}

// Fallback map for custom registrations (deprecated)
const CUSTOM_LAYOUT_CONFIGS = new Map<string, SectionLayoutConfig>();
