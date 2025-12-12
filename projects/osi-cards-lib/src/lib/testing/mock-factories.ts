/**
 * Mock Factory Functions (Point 72)
 *
 * Type-safe mock factories for all services and models.
 * Provides consistent test data generation across the test suite.
 *
 * @example
 * ```typescript
 * import { createMockCard, createMockSection, MockFactory } from './mock-factories';
 *
 * // Create a mock card
 * const card = createMockCard({ cardTitle: 'Test Card' });
 *
 * // Create multiple mock sections
 * const sections = MockFactory.sections(3, { type: 'info' });
 * ```
 */

import { AICardConfig, CardSection } from '../models';

// =============================================================================
// TYPES
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface MockOptions {
  /** Seed for deterministic random values */
  seed?: number;
  /** Include optional fields */
  includeOptional?: boolean;
  /** Custom ID prefix */
  idPrefix?: string;
}

// =============================================================================
// UTILITIES
// =============================================================================

let idCounter = 0;

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = 'mock'): string {
  return `${prefix}-${++idCounter}-${Date.now().toString(36)}`;
}

/**
 * Reset ID counter (for test isolation)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Pick random item from array
 */
export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/**
 * Generate random number in range
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random string
 */
export function randomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (sourceValue !== undefined) {
      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null
      ) {
        result[key] = deepMerge(
          targetValue as object,
          sourceValue as DeepPartial<object>
        ) as T[keyof T];
      } else {
        result[key] = sourceValue as T[keyof T];
      }
    }
  }

  return result;
}

// =============================================================================
// SECTION MOCKS
// =============================================================================

/**
 * Create a mock field
 */
export function createMockField(
  overrides: DeepPartial<{ label: string; value: unknown; icon?: string }> = {}
): { label: string; value: unknown; icon?: string } {
  return deepMerge(
    {
      label: `Field ${randomNumber(1, 100)}`,
      value: `Value ${randomString(8)}`,
    },
    overrides
  );
}

/**
 * Create a mock item
 */
export function createMockItem(
  overrides: DeepPartial<{ title: string; description?: string; icon?: string }> = {}
): { title: string; description?: string; icon?: string } {
  return deepMerge(
    {
      title: `Item ${randomNumber(1, 100)}`,
      description: `Description for item ${randomString(8)}`,
    },
    overrides
  );
}

/**
 * Create a mock info section
 */
export function createMockInfoSection(overrides: DeepPartial<CardSection> = {}): CardSection {
  return deepMerge<CardSection>(
    {
      id: generateId('section'),
      type: 'info',
      title: 'Information',
      fields: [
        createMockField({ label: 'Status', value: 'Active' }) as CardField,
        createMockField({ label: 'Created', value: new Date().toISOString() }) as CardField,
        createMockField({ label: 'Updated', value: new Date().toISOString() }) as CardField,
      ],
    },
    overrides
  );
}

/**
 * Create a mock analytics section
 */
export function createMockAnalyticsSection(overrides: DeepPartial<CardSection> = {}): CardSection {
  return deepMerge<CardSection>(
    {
      id: generateId('section'),
      type: 'analytics',
      title: 'Analytics',
      fields: [
        createMockField({ label: 'Views', value: randomNumber(100, 10000) }) as CardField,
        createMockField({ label: 'Engagement', value: `${randomNumber(1, 100)}%` }) as CardField,
        createMockField({ label: 'Conversions', value: randomNumber(10, 500) }) as CardField,
      ],
    },
    overrides
  );
}

/**
 * Create a mock list section
 */
export function createMockListSection(overrides: DeepPartial<CardSection> = {}): CardSection {
  return deepMerge<CardSection>(
    {
      id: generateId('section'),
      type: 'list',
      title: 'Items',
      items: [
        createMockItem({ title: 'First Item' }),
        createMockItem({ title: 'Second Item' }),
        createMockItem({ title: 'Third Item' }),
      ],
    },
    overrides
  );
}

/**
 * Create a mock actions section
 */
export function createMockActionsSection(overrides: DeepPartial<CardSection> = {}): CardSection {
  return deepMerge<CardSection>(
    {
      id: generateId('section'),
      type: 'actions',
      title: 'Actions',
      actions: [
        { label: 'View Details', action: 'view', variant: 'primary' },
        { label: 'Edit', action: 'edit', variant: 'secondary' },
        { label: 'Delete', action: 'delete', variant: 'danger' },
      ],
    },
    overrides
  );
}

/**
 * Create a mock section of any type
 */
export function createMockSection(
  type: string = 'info',
  overrides: DeepPartial<CardSection> = {}
): CardSection {
  const factories: Record<string, (o: DeepPartial<CardSection>) => CardSection> = {
    info: createMockInfoSection,
    analytics: createMockAnalyticsSection,
    list: createMockListSection,
    actions: createMockActionsSection,
  };

  const factory = factories[type] || createMockInfoSection;
  return factory(overrides);
}

// =============================================================================
// CARD MOCKS
// =============================================================================

/**
 * Create a mock card configuration
 */
export function createMockCard(overrides: DeepPartial<AICardConfig> = {}): AICardConfig {
  const id = generateId('card');

  return deepMerge<AICardConfig>(
    {
      id,
      cardTitle: `Test Card ${id}`,
      description: 'A test card for unit testing',
      sections: [createMockInfoSection(), createMockAnalyticsSection(), createMockListSection()],
      theme: {
        preset: 'default',
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
      },
    },
    overrides
  );
}

/**
 * Create a minimal mock card
 */
export function createMinimalCard(overrides: DeepPartial<AICardConfig> = {}): AICardConfig {
  return deepMerge<AICardConfig>(
    {
      id: generateId('card'),
      cardTitle: 'Minimal Card',
      sections: [],
    },
    overrides
  );
}

/**
 * Create a complex mock card with many sections
 */
export function createComplexCard(sectionCount: number = 10): AICardConfig {
  const sections: CardSection[] = [];
  const types = ['info', 'analytics', 'list', 'actions'];

  for (let i = 0; i < sectionCount; i++) {
    sections.push(createMockSection(types[i % types.length]!));
  }

  return createMockCard({
    cardTitle: 'Complex Test Card',
    sections,
  });
}

// =============================================================================
// MOCK FACTORY CLASS
// =============================================================================

/**
 * Factory class for creating mock data
 */
export class MockFactory {
  private static options: MockOptions = {};

  /**
   * Configure factory options
   */
  static configure(options: MockOptions): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Reset factory state
   */
  static reset(): void {
    this.options = {};
    resetIdCounter();
  }

  /**
   * Create a single card
   */
  static card(overrides?: DeepPartial<AICardConfig>): AICardConfig {
    return createMockCard(overrides);
  }

  /**
   * Create multiple cards
   */
  static cards(count: number, overrides?: DeepPartial<AICardConfig>): AICardConfig[] {
    return Array.from({ length: count }, () => createMockCard(overrides));
  }

  /**
   * Create a single section
   */
  static section(type?: string, overrides?: DeepPartial<CardSection>): CardSection {
    return createMockSection(type, overrides);
  }

  /**
   * Create multiple sections
   */
  static sections(count: number, overrides?: DeepPartial<CardSection>): CardSection[] {
    const types = ['info', 'analytics', 'list', 'actions'];
    return Array.from({ length: count }, (_, i) =>
      createMockSection(types[i % types.length], overrides)
    );
  }

  /**
   * Create a single field
   */
  static field(overrides?: DeepPartial<{ label: string; value: unknown }>): {
    label: string;
    value: unknown;
  } {
    return createMockField(overrides);
  }

  /**
   * Create multiple fields
   */
  static fields(
    count: number,
    overrides?: DeepPartial<{ label: string; value: unknown }>
  ): { label: string; value: unknown }[] {
    return Array.from({ length: count }, () => createMockField(overrides));
  }

  /**
   * Create streaming card data (for testing streaming functionality)
   */
  static streamingCard(chunkCount: number = 5): {
    chunks: Partial<AICardConfig>[];
    final: AICardConfig;
  } {
    const final = createMockCard();
    const chunks: Partial<AICardConfig>[] = [];

    // First chunk: basic info
    chunks.push({
      id: final.id,
      cardTitle: final.cardTitle,
    });

    // Middle chunks: sections
    const sectionsPerChunk = Math.ceil((final.sections?.length || 0) / (chunkCount - 2));
    for (let i = 0; i < chunkCount - 2; i++) {
      const start = i * sectionsPerChunk;
      const end = start + sectionsPerChunk;
      chunks.push({
        sections: final.sections?.slice(start, end),
      });
    }

    // Last chunk: metadata
    chunks.push({
      metadata: final.metadata,
    });

    return { chunks, final };
  }
}

// =============================================================================
// SERVICE MOCKS
// =============================================================================

/**
 * Create a mock HTTP response
 */
export function createMockHttpResponse<T>(
  data: T,
  status: number = 200
): {
  body: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
} {
  return {
    body: data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      'content-type': 'application/json',
    },
  };
}

/**
 * Create a mock error response
 */
export function createMockErrorResponse(
  message: string,
  status: number = 500,
  code?: string
): {
  error: { message: string; code?: string };
  status: number;
  statusText: string;
} {
  return {
    error: { message, code },
    status,
    statusText: 'Error',
  };
}

/**
 * Create a mock event
 */
export function createMockEvent<T extends Event>(type: string, options: Partial<T> = {}): T {
  const event = new Event(type) as T;
  Object.assign(event, options);
  return event;
}

/**
 * Create a mock keyboard event
 */
export function createMockKeyboardEvent(
  type: 'keydown' | 'keyup' | 'keypress',
  key: string,
  options: Partial<KeyboardEvent> = {}
): KeyboardEvent {
  return new KeyboardEvent(type, {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
}

/**
 * Create a mock mouse event
 */
export function createMockMouseEvent(type: string, options: Partial<MouseEvent> = {}): MouseEvent {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    ...options,
  });
}

// =============================================================================
// FIXTURE BUILDERS
// =============================================================================

/**
 * Builder pattern for creating complex test fixtures
 */
export class CardBuilder {
  private card: AICardConfig;

  constructor() {
    this.card = createMinimalCard();
  }

  withTitle(title: string): this {
    this.card.cardTitle = title;
    return this;
  }

  withSubtitle(subtitle: string): this {
    this.card.description = subtitle;
    return this;
  }

  withSection(section: CardSection): this {
    if (!this.card.sections) {
      this.card.sections = [];
    }
    this.card.sections.push(section);
    return this;
  }

  withInfoSection(overrides?: DeepPartial<CardSection>): this {
    return this.withSection(createMockInfoSection(overrides));
  }

  withAnalyticsSection(overrides?: DeepPartial<CardSection>): this {
    return this.withSection(createMockAnalyticsSection(overrides));
  }

  withListSection(overrides?: DeepPartial<CardSection>): this {
    return this.withSection(createMockListSection(overrides));
  }

  withActionsSection(overrides?: DeepPartial<CardSection>): this {
    return this.withSection(createMockActionsSection(overrides));
  }

  withTheme(theme: AICardConfig['theme']): this {
    this.card.theme = theme;
    return this;
  }

  withMetadata(metadata: AICardConfig['metadata']): this {
    this.card.metadata = metadata;
    return this;
  }

  build(): AICardConfig {
    return { ...this.card };
  }
}

/**
 * Create a card builder
 */
export function cardBuilder(): CardBuilder {
  return new CardBuilder();
}
