/**
 * Normalization Engine
 *
 * Unified data normalization with built-in caching.
 * Consolidates section-normalization and cached-section-normalization services.
 *
 * Features:
 * - Schema-based normalization
 * - Built-in LRU caching
 * - Validation with error collection
 * - Type coercion
 * - Default value injection
 *
 * @example
 * ```typescript
 * const normalizer = new NormalizationEngine();
 *
 * // Normalize a card
 * const result = normalizer.normalizeCard(rawData);
 * if (result.valid) {
 *   useCard(result.data);
 * } else {
 *   handleErrors(result.errors);
 * }
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

export interface NormalizationResult<T> {
  data: T;
  valid: boolean;
  errors: NormalizationError[];
  warnings: NormalizationWarning[];
  normalized: boolean;
  cached: boolean;
}

export interface NormalizationError {
  path: string;
  message: string;
  value?: unknown;
}

export interface NormalizationWarning {
  path: string;
  message: string;
  value?: unknown;
}

export interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: unknown;
  validate?: (value: unknown) => boolean;
  transform?: (value: unknown) => unknown;
}

export interface SectionSchema {
  type: string;
  fields?: Record<string, FieldSchema>;
  items?: FieldSchema;
  required?: string[];
}

export interface NormalizationConfig {
  /** Enable caching */
  cacheEnabled: boolean;
  /** Maximum cache size */
  cacheSize: number;
  /** Cache TTL in ms */
  cacheTTL: number;
  /** Strict mode (fail on unknown fields) */
  strict: boolean;
  /** Collect all errors vs fail fast */
  collectAllErrors: boolean;
}

const DEFAULT_CONFIG: NormalizationConfig = {
  cacheEnabled: true,
  cacheSize: 100,
  cacheTTL: 60000, // 1 minute
  strict: false,
  collectAllErrors: true,
};

// ============================================================================
// CACHE
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hash: string;
}

class NormalizationCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: string, data: T): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hash: key,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// NORMALIZATION ENGINE
// ============================================================================

export class NormalizationEngine {
  private readonly config: NormalizationConfig;
  private readonly cache: NormalizationCache<NormalizationResult<unknown>>;
  private readonly schemas = new Map<string, SectionSchema>();

  constructor(config: Partial<NormalizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new NormalizationCache(this.config.cacheSize, this.config.cacheTTL);
    this.registerDefaultSchemas();
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Normalize a card
   */
  normalizeCard(data: unknown): NormalizationResult<NormalizedCard> {
    const cacheKey = this.config.cacheEnabled ? this.hashData(data) : '';

    if (this.config.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return { ...cached, cached: true } as NormalizationResult<NormalizedCard>;
      }
    }

    const errors: NormalizationError[] = [];
    const warnings: NormalizationWarning[] = [];

    // Ensure object
    if (!data || typeof data !== 'object') {
      return this.errorResult('Card must be an object');
    }

    const input = data as Record<string, unknown>;

    // Normalize card structure
    const normalized: NormalizedCard = {
      id: this.normalizeString(input['id'], 'id', errors) || this.generateId(),
      cardTitle:
        this.normalizeString(input['cardTitle'] || input['title'], 'cardTitle', errors) ||
        'Untitled',
      sections: this.normalizeSections(input['sections'], errors, warnings),
      actions: this.normalizeActions(input['actions'], errors),
      metadata: this.normalizeMetadata(input['metadata'] || input['meta']),
    };

    const result: NormalizationResult<NormalizedCard> = {
      data: normalized,
      valid: errors.length === 0,
      errors,
      warnings,
      normalized: true,
      cached: false,
    };

    if (this.config.cacheEnabled && result.valid) {
      this.cache.set(cacheKey, result as NormalizationResult<unknown>);
    }

    return result;
  }

  /**
   * Normalize a single section
   */
  normalizeSection(data: unknown, index?: number): NormalizationResult<NormalizedSection> {
    const errors: NormalizationError[] = [];
    const warnings: NormalizationWarning[] = [];
    const path = index !== undefined ? `sections[${index}]` : 'section';

    if (!data || typeof data !== 'object') {
      return this.errorResult(`${path} must be an object`);
    }

    const input = data as Record<string, unknown>;
    const type = this.normalizeString(input['type'], `${path}.type`, errors) || 'overview';
    const schema = this.schemas.get(type);

    const normalized: NormalizedSection = {
      id: this.normalizeString(input['id'], `${path}.id`, errors) || this.generateId(),
      type,
      title: this.normalizeString(input['title'], `${path}.title`, errors),
      fields: this.normalizeFields(input['fields'], `${path}.fields`, errors, schema),
      items: this.normalizeItems(input['items'], `${path}.items`, errors, schema),
    };

    // Copy additional properties for specific section types
    if (input['chartType']) normalized.chartType = String(input['chartType']);
    if (input['data']) normalized.data = input['data'];
    if (input['description']) normalized.description = String(input['description']);

    return {
      data: normalized,
      valid: errors.length === 0,
      errors,
      warnings,
      normalized: true,
      cached: false,
    };
  }

  /**
   * Register a custom section schema
   */
  registerSchema(schema: SectionSchema): void {
    this.schemas.set(schema.type, schema);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.cacheSize,
    };
  }

  // ==========================================================================
  // PRIVATE NORMALIZATION METHODS
  // ==========================================================================

  private normalizeSections(
    data: unknown,
    errors: NormalizationError[],
    warnings: NormalizationWarning[]
  ): NormalizedSection[] {
    if (!data) return [];
    if (!Array.isArray(data)) {
      errors.push({ path: 'sections', message: 'sections must be an array', value: data });
      return [];
    }

    return data
      .map((s, i) => this.normalizeSection(s, i))
      .filter((r) => {
        if (!r.valid) {
          errors.push(...r.errors);
          warnings.push(...r.warnings);
        }
        return r.valid || !this.config.strict;
      })
      .map((r) => r.data);
  }

  private normalizeFields(
    data: unknown,
    path: string,
    errors: NormalizationError[],
    schema?: SectionSchema
  ): NormalizedField[] {
    if (!data) return [];
    if (!Array.isArray(data)) {
      if (this.config.strict) {
        errors.push({ path, message: 'fields must be an array', value: data });
      }
      return [];
    }

    return data
      .filter((f) => f && typeof f === 'object')
      .map((f, i) => {
        const field = f as Record<string, unknown>;
        return {
          label:
            this.normalizeString(field['label'] || field['name'], `${path}[${i}].label`, errors) ||
            '',
          value: this.normalizeValue(field['value'], `${path}[${i}].value`),
          type: this.normalizeString(field['type'], `${path}[${i}].type`, []),
        };
      })
      .filter((f) => f.label || f.value !== undefined);
  }

  private normalizeItems(
    data: unknown,
    path: string,
    errors: NormalizationError[],
    schema?: SectionSchema
  ): NormalizedItem[] {
    if (!data) return [];
    if (!Array.isArray(data)) {
      if (this.config.strict) {
        errors.push({ path, message: 'items must be an array', value: data });
      }
      return [];
    }

    return data
      .filter((item) => item && typeof item === 'object')
      .map((item, i) => {
        const it = item as Record<string, unknown>;
        return {
          id: this.normalizeString(it['id'], `${path}[${i}].id`, []) || this.generateId(),
          title:
            this.normalizeString(it['title'] || it['name'], `${path}[${i}].title`, errors) || '',
          description: this.normalizeString(it['description'], `${path}[${i}].description`, []),
          icon: this.normalizeString(it['icon'], `${path}[${i}].icon`, []),
          value: this.normalizeValue(it['value'], `${path}[${i}].value`),
        };
      })
      .filter((item) => item.title);
  }

  private normalizeActions(data: unknown, errors: NormalizationError[]): NormalizedAction[] {
    if (!data) return [];
    if (!Array.isArray(data)) return [];

    return data
      .filter((a) => a && typeof a === 'object')
      .map((a, i) => {
        const action = a as Record<string, unknown>;
        return {
          label:
            this.normalizeString(
              action['label'] || action['text'],
              `actions[${i}].label`,
              errors
            ) || 'Action',
          type: this.normalizeString(action['type'], `actions[${i}].type`, []) || 'primary',
          url: this.normalizeString(action['url'] || action['href'], `actions[${i}].url`, []),
        };
      });
  }

  private normalizeMetadata(data: unknown): Record<string, unknown> {
    if (!data || typeof data !== 'object') return {};
    return { ...(data as Record<string, unknown>) };
  }

  private normalizeString(
    value: unknown,
    path: string,
    errors: NormalizationError[]
  ): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);

    if (this.config.strict) {
      errors.push({ path, message: 'expected string', value });
    }
    return String(value);
  }

  private normalizeValue(value: unknown, path: string): string | number | boolean | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    return String(value);
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private registerDefaultSchemas(): void {
    // Overview section (replaces deprecated info section)
    this.registerSchema({
      type: 'overview',
      fields: {
        label: { type: 'string', required: true },
        value: { type: 'string', required: true },
      },
    });

    // List section
    this.registerSchema({
      type: 'list',
      items: { type: 'object' },
    });

    // Chart section
    this.registerSchema({
      type: 'chart',
      fields: {
        chartType: { type: 'string', default: 'bar' },
        data: { type: 'array', required: true },
      },
    });
  }

  private hashData(data: unknown): string {
    return JSON.stringify(data)
      .split('')
      .reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0)
      .toString(36);
  }

  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private errorResult<T>(message: string): NormalizationResult<T> {
    return {
      data: {} as T,
      valid: false,
      errors: [{ path: '', message }],
      warnings: [],
      normalized: false,
      cached: false,
    };
  }
}

// ============================================================================
// OUTPUT TYPES
// ============================================================================

export interface NormalizedCard {
  id: string;
  cardTitle: string;
  sections: NormalizedSection[];
  actions: NormalizedAction[];
  metadata: Record<string, unknown>;
}

export interface NormalizedSection {
  id: string;
  type: string;
  title?: string;
  fields: NormalizedField[];
  items: NormalizedItem[];
  chartType?: string;
  data?: unknown;
  description?: string;
}

export interface NormalizedField {
  label: string;
  value: string | number | boolean | undefined;
  type?: string;
}

export interface NormalizedItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  value?: string | number | boolean;
}

export interface NormalizedAction {
  label: string;
  type: string;
  url?: string;
}

// ============================================================================
// FACTORY
// ============================================================================

/** Create a NormalizationEngine with default config */
export function createNormalizer(config?: Partial<NormalizationConfig>): NormalizationEngine {
  return new NormalizationEngine(config);
}

/** Create a strict NormalizationEngine */
export function createStrictNormalizer(): NormalizationEngine {
  return new NormalizationEngine({ strict: true, collectAllErrors: false });
}
