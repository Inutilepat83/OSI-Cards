import { Injectable, inject, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CardSection, CardField, CardItem, CompletionRules } from '@osi-cards/models';
import { resolveSectionType } from '@osi-cards/models';
import { firstValueFrom } from 'rxjs';
import { sendDebugLogToFile } from '@osi-cards/lib/utils/debug-log-file.util';
import { safeDebugFetch } from '@osi-cards/utils';

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
 * @dependencies
 * - HttpClient: For loading section registry definitions
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
  // Cache completeness results to avoid recomputing same sections
  private completenessCache = new WeakMap<CardSection, boolean>();

  constructor() {
    // Preload registry on service initialization to avoid async delays
    // This ensures completeness checks work correctly on page refresh
    if (this.http) {
      this.loadRegistry().catch((error) => {
        if (isDevMode()) {
          console.warn('[SectionCompleteness] Failed to preload registry:', error);
        }
      });
    }
  }

  /**
   * Check if a section is complete and should be displayed
   * Uses WeakMap cache to avoid recomputing same sections
   */
  isSectionComplete(section: CardSection): boolean {
    const checkStart = performance.now();

    if (!section || !section.type) {
      return false;
    }

    // Check cache first
    const cached = this.completenessCache.get(section);
    if (cached !== undefined) {
      // Cache hit - return immediately without logging overhead
      return cached;
    }

    const resolvedType = resolveSectionType(section.type);
    const definition = this.getSectionDefinitionSync(resolvedType);
    const hasRegistryCache = !!this.registryCache;

    const validateStart = performance.now();
    // CRITICAL FIX: If registry not loaded, always use lenient default rules
    // This prevents sections from being filtered out during initial page load
    let result: boolean;
    if (!hasRegistryCache) {
      // Registry not loaded - use lenient rules to avoid filtering out valid sections
      result = this.validateWithDefaultRules(section);
    } else if (!definition) {
      // Registry loaded but definition not found - use lenient default rules
      result = this.validateWithDefaultRules(section);
    } else if (!definition.completionRules) {
      // Definition found but no completion rules - use lenient default rules
      result = this.validateWithDefaultRules(section);
    } else {
      // Definition found with completion rules - use specific rules
      result = this.validateSectionCompleteness(
        section,
        definition.completionRules,
        definition.rendering
      );
    }

    const totalDuration = performance.now() - checkStart;
    const validateDuration = performance.now() - validateStart;

    // #region agent log - log all completeness checks to identify filtering issues
    if (typeof window !== 'undefined' && totalDuration > 1) {
      // Only log if it took >1ms to avoid excessive logging
      sendDebugLogToFile({
        location: 'section-completeness.service.ts:isSectionComplete',
        message: 'Completeness check',
        data: {
          sectionType: section.type,
          resolvedType,
          result,
          hasDefinition: !!definition,
          hasRegistryCache,
          validateDuration,
          totalDuration,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'perf-debug',
        hypothesisId: 'M',
      });
    }
    // #endregion

    // Cache the result
    this.completenessCache.set(section, result);

    // Removed expensive fetch logging - was causing performance issues
    // Performance is monitored via other means

    return result;
  }

  /**
   * Clear completeness cache (useful when sections are mutated)
   */
  clearCache(): void {
    // WeakMap doesn't have clear() - entries are garbage collected when sections are no longer referenced
    // This method exists for API consistency and future implementation if needed
  }

  /**
   * Get section definition synchronously (from cache)
   */
  private getSectionDefinitionSync(type: string): SectionDefinition | null {
    if (!this.registryCache) {
      // #region agent log - registry not loaded
      if (typeof window !== 'undefined') {
        sendDebugLogToFile({
          location: 'section-completeness.service.ts:getSectionDefinitionSync',
          message: 'Registry not loaded',
          data: { type, hasHttp: !!this.http },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'perf-debug',
          hypothesisId: 'N',
        });
      }
      // #endregion
      // Try to load synchronously if already loaded
      return null;
    }
    const definition = this.registryCache.sections?.[type] ?? null;
    // #region agent log - definition lookup
    if (typeof window !== 'undefined' && !definition) {
      sendDebugLogToFile({
        location: 'section-completeness.service.ts:getSectionDefinitionSync',
        message: 'Definition not found in registry',
        data: {
          type,
          hasRegistry: !!this.registryCache,
          registryKeys: this.registryCache.sections
            ? Object.keys(this.registryCache.sections).slice(0, 10)
            : [],
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'perf-debug',
        hypothesisId: 'N',
      });
    }
    // #endregion
    return definition;
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

    // #region agent log - registry load start
    const loadStart = performance.now();
    if (typeof window !== 'undefined') {
      sendDebugLogToFile({
        location: 'section-completeness.service.ts:loadRegistry',
        message: 'Loading registry',
        data: { hasHttp: !!this.http },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'perf-debug',
        hypothesisId: 'N',
      });
    }
    // #endregion

    this.registryLoadPromise = firstValueFrom(
      this.http.get<SectionRegistry>('/assets/section-registry.json')
    )
      .then((registry) => {
        const loadDuration = performance.now() - loadStart;
        // #region agent log - registry loaded
        if (typeof window !== 'undefined') {
          sendDebugLogToFile({
            location: 'section-completeness.service.ts:loadRegistry',
            message: 'Registry loaded successfully',
            data: {
              loadDuration,
              sectionCount: registry.sections ? Object.keys(registry.sections).length : 0,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'perf-debug',
            hypothesisId: 'N',
          });
        }
        // #endregion
        this.registryCache = registry;
        return registry;
      })
      .catch((error) => {
        const loadDuration = performance.now() - loadStart;
        // #region agent log - registry load failed
        if (typeof window !== 'undefined') {
          sendDebugLogToFile({
            location: 'section-completeness.service.ts:loadRegistry',
            message: 'Registry load FAILED',
            data: { loadDuration, error: error.message || String(error), status: error.status },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'perf-debug',
            hypothesisId: 'N',
          });
        }
        // #endregion
        if (isDevMode()) {
          console.warn('Failed to load section registry, using default rules:', error);
        }
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
   * Uses lenient rules to avoid filtering out valid sections on page refresh
   */
  private validateWithDefaultRules(section: CardSection): boolean {
    // CRITICAL FIX: Always use lenient rules to avoid filtering out valid sections
    // This ensures sections render even if registry hasn't loaded or definition is missing
    // The component-level hasMinimalData check already ensures basic data exists

    // Very lenient: accept section if it has type and either fields, items, chartData, title, or description
    // This prevents premature filtering during initial load or when registry/definitions are unavailable
    // CRITICAL: Only require type - everything else is optional to be maximally lenient
    const hasBasicData =
      !!section.type && // Type is required
      ((section.fields && section.fields.length > 0) ||
        (section.items && section.items.length > 0) ||
        (section.chartData &&
          section.chartData.datasets &&
          section.chartData.datasets.length > 0) ||
        !!(section.title && section.title.trim().length > 0) || // Title is optional but preferred
        !!(section.description && section.description.trim().length > 0)); // Description also counts

    // #region agent log - default rules validation
    if (typeof window !== 'undefined') {
      safeDebugFetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
        location: 'section-completeness.service.ts:validateWithDefaultRules',
        message: 'Default rules validation',
        data: {
          sectionId: section.id,
          sectionType: section.type,
          hasBasicData,
          fieldCount: section.fields?.length || 0,
          itemCount: section.items?.length || 0,
          hasChartData: !!section.chartData,
          hasTitle: !!section.title,
          hasDescription: !!section.description,
          result: hasBasicData,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'empty-card-debug',
        hypothesisId: 'C',
      });
    }
    // #endregion

    if (!hasBasicData && isDevMode()) {
      console.warn('[SectionCompleteness] Section filtered (no basic data)', {
        sectionType: section.type,
        sectionTitle: section.title,
        hasFields: !!(section.fields && section.fields.length > 0),
        hasItems: !!(section.items && section.items.length > 0),
        hasChartData: !!(
          section.chartData &&
          section.chartData.datasets &&
          section.chartData.datasets.length > 0
        ),
        hasDescription: !!(section.description && section.description.trim().length > 0),
      });
    }
    return hasBasicData;
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
