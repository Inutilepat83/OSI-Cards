/**
 * Property-Based Testing Utilities
 * Provides generators and utilities for property-based testing
 */

/**
 * Generator for arbitrary values
 */
export class Arbitrary<T> {
  constructor(private generator: () => T) {}

  /**
   * Generate a value
   */
  public generate(): T {
    return this.generator();
  }

  /**
   * Generate multiple values
   */
  public generateMany(count: number): T[] {
    return Array.from({ length: count }, () => this.generate());
  }

  /**
   * Map generator to new type
   */
  public map<U>(fn: (value: T) => U): Arbitrary<U> {
    return new Arbitrary(() => fn(this.generate()));
  }

  /**
   * Filter generated values
   */
  public filter(predicate: (value: T) => boolean): Arbitrary<T> {
    return new Arbitrary(() => {
      let value: T;
      let attempts = 0;
      const maxAttempts = 100;

      do {
        value = this.generate();
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Could not generate value satisfying predicate');
        }
      } while (!predicate(value));

      return value;
    });
  }

  /**
   * Chain generators
   */
  public chain<U>(fn: (value: T) => Arbitrary<U>): Arbitrary<U> {
    return new Arbitrary(() => fn(this.generate()).generate());
  }
}

/**
 * Property-based test generators
 */
export class Gen {
  /**
   * Generate random integer within range
   */
  public static integer(min: number = 0, max: number = 100): Arbitrary<number> {
    return new Arbitrary(() => Math.floor(Math.random() * (max - min + 1)) + min);
  }

  /**
   * Generate random boolean
   */
  public static boolean(): Arbitrary<boolean> {
    return new Arbitrary(() => Math.random() < 0.5);
  }

  /**
   * Generate random string
   */
  public static string(minLength: number = 0, maxLength: number = 50): Arbitrary<string> {
    return new Arbitrary(() => {
      const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    });
  }

  /**
   * Generate string matching pattern
   */
  public static stringMatching(pattern: RegExp): Arbitrary<string> {
    // Simplified - real implementation would generate strings matching regex
    return Gen.string(5, 20);
  }

  /**
   * Generate array of values
   */
  public static array<T>(
    gen: Arbitrary<T>,
    minLength: number = 0,
    maxLength: number = 10
  ): Arbitrary<T[]> {
    return new Arbitrary(() => {
      const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
      return gen.generateMany(length);
    });
  }

  /**
   * Generate one of several values
   */
  public static oneOf<T>(...values: T[]): Arbitrary<T> {
    return new Arbitrary(() => values[Math.floor(Math.random() * values.length)]);
  }

  /**
   * Generate constant value
   */
  public static constant<T>(value: T): Arbitrary<T> {
    return new Arbitrary(() => value);
  }

  /**
   * Generate object with generated properties
   */
  public static object<T extends Record<string, any>>(shape: {
    [K in keyof T]: Arbitrary<T[K]>;
  }): Arbitrary<T> {
    return new Arbitrary(() => {
      const result: any = {};
      Object.entries(shape).forEach(([key, gen]) => {
        result[key] = (gen as Arbitrary<any>).generate();
      });
      return result as T;
    });
  }

  /**
   * Generate optional value (may be undefined)
   */
  public static optional<T>(gen: Arbitrary<T>): Arbitrary<T | undefined> {
    return new Arbitrary(() => (Math.random() < 0.3 ? undefined : gen.generate()));
  }

  /**
   * Generate nullable value
   */
  public static nullable<T>(gen: Arbitrary<T>): Arbitrary<T | null> {
    return new Arbitrary(() => (Math.random() < 0.1 ? null : gen.generate()));
  }
}

/**
 * Property-based testing framework
 */
export class PropertyTest {
  /**
   * Run property test with generated values
   */
  public static forAll<T>(
    gen: Arbitrary<T>,
    property: (value: T) => boolean,
    options: { runs?: number; seed?: number } = {}
  ): { success: boolean; counterexample?: T; failedAfter?: number } {
    const runs = options.runs ?? 100;

    for (let i = 0; i < runs; i++) {
      const value = gen.generate();

      try {
        const result = property(value);
        if (!result) {
          return {
            success: false,
            counterexample: value,
            failedAfter: i + 1,
          };
        }
      } catch (error) {
        return {
          success: false,
          counterexample: value,
          failedAfter: i + 1,
        };
      }
    }

    return { success: true };
  }

  /**
   * Run property test with multiple generators
   */
  public static forAll2<T1, T2>(
    gen1: Arbitrary<T1>,
    gen2: Arbitrary<T2>,
    property: (v1: T1, v2: T2) => boolean,
    options: { runs?: number } = {}
  ): { success: boolean; counterexample?: [T1, T2]; failedAfter?: number } {
    const runs = options.runs ?? 100;

    for (let i = 0; i < runs; i++) {
      const v1 = gen1.generate();
      const v2 = gen2.generate();

      try {
        const result = property(v1, v2);
        if (!result) {
          return {
            success: false,
            counterexample: [v1, v2],
            failedAfter: i + 1,
          };
        }
      } catch (error) {
        return {
          success: false,
          counterexample: [v1, v2],
          failedAfter: i + 1,
        };
      }
    }

    return { success: true };
  }
}

/**
 * Generators for OSI Cards types
 */
export class CardGen {
  /**
   * Generate card ID
   */
  public static cardId(): Arbitrary<string> {
    return Gen.string(5, 20).map((s) => `card-${s}`);
  }

  /**
   * Generate section ID
   */
  public static sectionId(): Arbitrary<string> {
    return Gen.string(5, 20).map((s) => `section-${s}`);
  }

  /**
   * Generate field ID
   */
  public static fieldId(): Arbitrary<string> {
    return Gen.string(5, 20).map((s) => `field-${s}`);
  }

  /**
   * Generate section type
   */
  public static sectionType(): Arbitrary<string> {
    return Gen.oneOf(
      'info',
      'analytics',
      'chart',
      'map',
      'contact-card',
      'list',
      'timeline',
      'news',
      'product'
    );
  }

  /**
   * Generate card field
   */
  public static cardField(): Arbitrary<any> {
    const valueGen = new Arbitrary(() => {
      const type = Math.random();
      if (type < 0.5) return Gen.string(1, 50).generate();
      if (type < 0.8) return Gen.integer(0, 10000).generate();
      return Gen.boolean().generate();
    });

    return Gen.object({
      label: Gen.string(3, 30),
      value: valueGen,
    });
  }

  /**
   * Generate card section
   */
  public static cardSection(): Arbitrary<any> {
    return Gen.object({
      id: CardGen.sectionId(),
      title: Gen.string(5, 50),
      type: CardGen.sectionType(),
      description: Gen.optional(Gen.string(10, 200)),
      fields: Gen.array(CardGen.cardField(), 1, 10),
      colSpan: Gen.oneOf(1, 2, 3),
    });
  }

  /**
   * Generate card config
   */
  public static cardConfig(): Arbitrary<any> {
    return Gen.object({
      id: CardGen.cardId(),
      cardTitle: Gen.string(5, 100),
      description: Gen.optional(Gen.string(10, 300)),
      sections: Gen.array(CardGen.cardSection(), 1, 20),
      columns: Gen.oneOf(1, 2, 3),
    });
  }
}

/**
 * Example property tests
 */
export class CardProperties {
  /**
   * Property: All card IDs should be unique within a collection
   */
  public static uniqueCardIds(cards: any[]): boolean {
    const ids = cards.map((c) => c.id).filter((id) => id !== undefined);
    const uniqueIds = new Set(ids);
    return ids.length === uniqueIds.size;
  }

  /**
   * Property: Column span should never exceed available columns
   */
  public static validColumnSpan(section: any, maxColumns: number): boolean {
    if (section.colSpan === undefined) return true;
    return section.colSpan >= 1 && section.colSpan <= maxColumns;
  }

  /**
   * Property: Card title should never be empty
   */
  public static nonEmptyTitle(card: any): boolean {
    return typeof card.cardTitle === 'string' && card.cardTitle.trim().length > 0;
  }

  /**
   * Property: Sections array should not be empty
   */
  public static nonEmptySections(card: any): boolean {
    return Array.isArray(card.sections) && card.sections.length > 0;
  }

  /**
   * Property: Field percentages should be 0-100
   */
  public static validPercentage(field: any): boolean {
    if (field.percentage === undefined) return true;
    return field.percentage >= 0 && field.percentage <= 100;
  }
}

/**
 * Usage example
 *
 * @example
 * ```typescript
 * import { PropertyTest, CardGen, CardProperties } from '@osi-cards/testing';
 *
 * describe('Card Properties', () => {
 *   it('should have non-empty title', () => {
 *     const result = PropertyTest.forAll(
 *       CardGen.cardConfig(),
 *       CardProperties.nonEmptyTitle,
 *       { runs: 100 }
 *     );
 *
 *     expect(result.success).toBe(true);
 *   });
 *
 *   it('should have valid column spans', () => {
 *     const result = PropertyTest.forAll2(
 *       CardGen.cardSection(),
 *       Gen.integer(1, 4),
 *       (section, maxColumns) => CardProperties.validColumnSpan(section, maxColumns),
 *       { runs: 100 }
 *     );
 *
 *     expect(result.success).toBe(true);
 *   });
 * });
 * ```
 */
