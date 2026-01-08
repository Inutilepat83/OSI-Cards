import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CardSection, CardField, CardItem, CompletionRules } from '../models/card.model';
import { resolveSectionType } from '../models/generated-section-types';
import { firstValueFrom } from 'rxjs';

/**
 * Interface for section definition from registry
 */
interface SectionDefinition {
  name?: string;
  rendering?: {
    usesFields?: boolean;
    usesItems?: boolean;
    usesChartData?: boolean;
  };
  completionRules?: CompletionRules;
}

/**
 * Interface for section registry structure
 */
interface SectionRegistry {
  sections?: Record<string, SectionDefinition>;
}

/**
 * Section Completeness Service
 *
 * Validates whether sections have the required data to be displayed.
 * Uses completion rules defined in section definitions to determine
 * if a section should be rendered or filtered out.
 *
 * @example
 * ```typescript
 * const service = inject(SectionCompletenessService);
 * const isComplete = service.isSectionComplete(section);
 * if (isComplete) {
 *   // Render section
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class SectionCompletenessService {
  private readonly http = inject(HttpClient);
  private registryCache: SectionRegistry | null = null;
  private registryLoadPromise: Promise<SectionRegistry> | null = null;

  /**
   * Check if a section is complete and should be displayed
   */
  isSectionComplete(section: CardSection): boolean {
    if (!section || !section.type) {
      return false;
    }

    const resolvedType = resolveSectionType(section.type);
    const definition = this.getSectionDefinitionSync(resolvedType);

    if (!definition) {
      // If no definition found, use default rules
      return this.validateWithDefaultRules(section);
    }

    const rules = definition.completionRules;
    if (!rules) {
      // If no completion rules defined, use default validation
      return this.validateWithDefaultRules(section);
    }

    return this.validateSectionCompleteness(section, rules, definition.rendering);
  }

  /**
   * Get section definition synchronously (from cache)
   */
  private getSectionDefinitionSync(type: string): SectionDefinition | null {
    if (!this.registryCache) {
      // Try to load synchronously if already loaded
      return null;
    }
    return this.registryCache.sections?.[type] ?? null;
  }

  /**
   * Get section definition (async, loads registry if needed)
   */
  async getSectionDefinition(type: string): Promise<SectionDefinition | null> {
    const registry = await this.loadRegistry();
    return registry.sections?.[type] ?? null;
  }

  /**
   * Load section registry from assets
   */
  private async loadRegistry(): Promise<SectionRegistry> {
    if (this.registryCache) {
      return this.registryCache;
    }

    if (this.registryLoadPromise) {
      return this.registryLoadPromise;
    }

    this.registryLoadPromise = firstValueFrom(
      this.http.get<SectionRegistry>('/assets/section-registry.json')
    )
      .then((registry) => {
        this.registryCache = registry;
        return registry;
      })
      .catch((error) => {
        console.warn('Failed to load section registry, using default rules:', error);
        this.registryCache = { sections: {} };
        return this.registryCache;
      })
      .finally(() => {
        this.registryLoadPromise = null;
      });

    return this.registryLoadPromise;
  }

  /**
   * Validate section completeness with specific rules
   */
  private validateSectionCompleteness(
    section: CardSection,
    rules: CompletionRules,
    rendering?: SectionDefinition['rendering']
  ): boolean {
    // Check chart data requirement
    if (rules.requireChartData) {
      if (
        !section.chartData ||
        !section.chartData.datasets ||
        section.chartData.datasets.length === 0
      ) {
        return false;
      }
      // Chart sections are complete if they have valid chartData
      return true;
    }

    // Check fields-based sections
    if (rendering?.usesFields) {
      if (!section.fields || section.fields.length === 0) {
        return false;
      }

      const validFields = this.getValidFields(section.fields, rules);
      const minFields = rules.minFields ?? 1;

      if (validFields.length < minFields) {
        return false;
      }

      // Check mandatory fields
      if (rules.mandatoryFields && rules.mandatoryFields.length > 0) {
        const hasMandatoryFields = validFields.some((field) =>
          rules.mandatoryFields!.every((mandatory) => this.hasFieldProperty(field, mandatory))
        );
        if (!hasMandatoryFields) {
          return false;
        }
      }

      return true;
    }

    // Check items-based sections
    if (rendering?.usesItems) {
      if (!section.items || section.items.length === 0) {
        return false;
      }

      const validItems = this.getValidItems(section.items, rules);
      const minItems = rules.minItems ?? 1;

      if (validItems.length < minItems) {
        return false;
      }

      // Check mandatory fields in items
      if (rules.mandatoryFields && rules.mandatoryFields.length > 0) {
        const hasMandatoryFields = validItems.some((item) =>
          rules.mandatoryFields!.every((mandatory) => this.hasItemProperty(item, mandatory))
        );
        if (!hasMandatoryFields) {
          return false;
        }
      }

      return true;
    }

    // Default: section is complete if it has a title and type
    return !!(section.title && section.type);
  }

  /**
   * Validate with default rules when no definition is found
   */
  private validateWithDefaultRules(section: CardSection): boolean {
    // Default: require at least one field or item
    if (section.fields && section.fields.length > 0) {
      const hasValidField = section.fields.some((field) => this.isFieldValueNonEmpty(field));
      return hasValidField;
    }

    if (section.items && section.items.length > 0) {
      const hasValidItem = section.items.some((item) => this.isItemValueNonEmpty(item));
      return hasValidItem;
    }

    if (section.chartData && section.chartData.datasets && section.chartData.datasets.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Get valid fields (non-empty if required)
   */
  private getValidFields(fields: CardField[], rules: CompletionRules): CardField[] {
    if (!rules.requireNonEmptyValues) {
      return fields;
    }

    return fields.filter((field) => this.isFieldValueNonEmpty(field));
  }

  /**
   * Get valid items (non-empty if required)
   */
  private getValidItems(items: CardItem[], rules: CompletionRules): CardItem[] {
    if (!rules.requireNonEmptyValues) {
      return items;
    }

    return items.filter((item) => this.isItemValueNonEmpty(item));
  }

  /**
   * Check if field has non-empty value
   * Checks common field properties used by different section types:
   * - value, label (standard fields)
   * - name, title (map, solutions sections)
   * - platform, handle, url (social-media sections)
   * - x, y, coordinates (map sections)
   */
  private isFieldValueNonEmpty(field: CardField): boolean {
    // Check standard value property
    if (field.value !== undefined && field.value !== null) {
      if (typeof field.value === 'string') {
        return field.value.trim().length > 0;
      }
      return true;
    }

    // Check label property
    if (field.label && field.label.trim().length > 0) {
      return true;
    }

    // Check common field properties used by different section types
    // Map sections: name, x, y, coordinates
    if (
      (field as any).name &&
      typeof (field as any).name === 'string' &&
      (field as any).name.trim().length > 0
    ) {
      return true;
    }

    // Solutions sections: title, description
    if (
      (field as any).title &&
      typeof (field as any).title === 'string' &&
      (field as any).title.trim().length > 0
    ) {
      return true;
    }
    if (
      (field as any).description &&
      typeof (field as any).description === 'string' &&
      (field as any).description.trim().length > 0
    ) {
      return true;
    }

    // Social-media sections: platform, handle, url
    if (
      (field as any).platform &&
      typeof (field as any).platform === 'string' &&
      (field as any).platform.trim().length > 0
    ) {
      return true;
    }
    if (
      (field as any).handle &&
      typeof (field as any).handle === 'string' &&
      (field as any).handle.trim().length > 0
    ) {
      return true;
    }
    if (
      (field as any).url &&
      typeof (field as any).url === 'string' &&
      (field as any).url.trim().length > 0
    ) {
      return true;
    }

    // Map sections: coordinates (object) or x/y (numbers)
    if ((field as any).coordinates && typeof (field as any).coordinates === 'object') {
      return true;
    }
    if (typeof (field as any).x === 'number' || typeof (field as any).y === 'number') {
      return true;
    }

    return false;
  }

  /**
   * Check if item has non-empty value
   * Checks common item properties used by different section types:
   * - title, description, value (standard items)
   * - platform, handle, url (social-media sections)
   */
  private isItemValueNonEmpty(item: CardItem): boolean {
    // Check standard properties
    if (item.title && item.title.trim().length > 0) {
      return true;
    }
    if (item.description && item.description.trim().length > 0) {
      return true;
    }
    if (item.value !== undefined && item.value !== null) {
      if (typeof item.value === 'string') {
        return item.value.trim().length > 0;
      }
      return true;
    }

    // Check social-media item properties: platform, handle, url
    if (
      (item as any).platform &&
      typeof (item as any).platform === 'string' &&
      (item as any).platform.trim().length > 0
    ) {
      return true;
    }
    if (
      (item as any).handle &&
      typeof (item as any).handle === 'string' &&
      (item as any).handle.trim().length > 0
    ) {
      return true;
    }
    if (
      (item as any).url &&
      typeof (item as any).url === 'string' &&
      (item as any).url.trim().length > 0
    ) {
      return true;
    }

    return false;
  }

  /**
   * Check if field has a specific property
   */
  private hasFieldProperty(field: CardField, property: string): boolean {
    return property in field && field[property as keyof CardField] !== undefined;
  }

  /**
   * Check if item has a specific property
   */
  private hasItemProperty(item: CardItem, property: string): boolean {
    return property in item && item[property as keyof CardItem] !== undefined;
  }

  /**
   * Validate fields completeness
   */
  validateFieldsCompleteness(fields: CardField[], rules: CompletionRules): boolean {
    if (!fields || fields.length === 0) {
      return false;
    }

    const validFields = this.getValidFields(fields, rules);
    const minFields = rules.minFields ?? 1;

    if (validFields.length < minFields) {
      return false;
    }

    if (rules.mandatoryFields && rules.mandatoryFields.length > 0) {
      return validFields.some((field) =>
        rules.mandatoryFields!.every((mandatory) => this.hasFieldProperty(field, mandatory))
      );
    }

    return true;
  }

  /**
   * Validate items completeness
   */
  validateItemsCompleteness(items: CardItem[], rules: CompletionRules): boolean {
    if (!items || items.length === 0) {
      return false;
    }

    const validItems = this.getValidItems(items, rules);
    const minItems = rules.minItems ?? 1;

    if (validItems.length < minItems) {
      return false;
    }

    if (rules.mandatoryFields && rules.mandatoryFields.length > 0) {
      return validItems.some((item) =>
        rules.mandatoryFields!.every((mandatory) => this.hasItemProperty(item, mandatory))
      );
    }

    return true;
  }
}
