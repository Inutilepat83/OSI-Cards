/**
 * Test Data Builders
 * Provides fluent builders for creating test data
 */

import { AICardConfig, CardSection, CardField, CardItem, CardAction, SectionTypeInput } from '../models/card.model';

/**
 * Builder for creating test card configurations
 */
export class TestCardBuilder {
  private data: Partial<AICardConfig> = {
    sections: [],
  };

  /**
   * Create a new test card builder
   */
  public static create(): TestCardBuilder {
    return new TestCardBuilder();
  }

  /**
   * Set card ID
   */
  public withId(id: string): this {
    this.data.id = id;
    return this;
  }

  /**
   * Set card title
   */
  public withTitle(title: string): this {
    this.data.cardTitle = title;
    return this;
  }

  /**
   * Set card type
   */
  public withType(type: string): this {
    this.data.cardType = type as any;
    return this;
  }

  /**
   * Set card description
   */
  public withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  /**
   * Set column span
   */
  public withColumns(columns: 1 | 2 | 3): this {
    this.data.columns = columns;
    return this;
  }

  /**
   * Add a section
   */
  public withSection(section: CardSection): this {
    if (!this.data.sections) {
      this.data.sections = [];
    }
    this.data.sections.push(section);
    return this;
  }

  /**
   * Add multiple sections
   */
  public withSections(sections: CardSection[]): this {
    this.data.sections = sections;
    return this;
  }

  /**
   * Add an action
   */
  public withAction(action: CardAction): this {
    if (!this.data.actions) {
      this.data.actions = [];
    }
    this.data.actions.push(action);
    return this;
  }

  /**
   * Add metadata
   */
  public withMeta(meta: Record<string, unknown>): this {
    this.data.meta = { ...this.data.meta, ...meta };
    return this;
  }

  /**
   * Set as minimal card (for testing edge cases)
   */
  public asMinimal(): this {
    this.data = {
      cardTitle: 'Test Card',
      sections: [],
    };
    return this;
  }

  /**
   * Set as large card (for performance testing)
   */
  public asLarge(): this {
    const sections: CardSection[] = [];
    for (let i = 0; i < 50; i++) {
      sections.push({
        title: `Section ${i}`,
        type: 'info',
        fields: Array.from({ length: 10 }, (_, j) => ({
          label: `Field ${j}`,
          value: `Value ${j}`,
        })),
      });
    }
    this.data.sections = sections;
    return this;
  }

  /**
   * Build the card configuration
   */
  public build(): AICardConfig {
    if (!this.data.cardTitle) {
      this.data.cardTitle = 'Test Card';
    }
    if (!this.data.sections) {
      this.data.sections = [];
    }
    return this.data as AICardConfig;
  }
}

/**
 * Builder for creating test sections
 */
export class TestSectionBuilder {
  private data: Partial<CardSection> = {};

  /**
   * Create a new test section builder
   */
  public static create(): TestSectionBuilder {
    return new TestSectionBuilder();
  }

  /**
   * Set section ID
   */
  public withId(id: string): this {
    this.data.id = id;
    return this;
  }

  /**
   * Set section title
   */
  public withTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  /**
   * Set section type
   */
  public withType(type: SectionTypeInput): this {
    this.data.type = type;
    return this;
  }

  /**
   * Set section description
   */
  public withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  /**
   * Add a field
   */
  public withField(field: CardField): this {
    if (!this.data.fields) {
      this.data.fields = [];
    }
    this.data.fields.push(field);
    return this;
  }

  /**
   * Add multiple fields
   */
  public withFields(fields: CardField[]): this {
    this.data.fields = fields;
    return this;
  }

  /**
   * Add an item
   */
  public withItem(item: CardItem): this {
    if (!this.data.items) {
      this.data.items = [];
    }
    this.data.items.push(item);
    return this;
  }

  /**
   * Add multiple items
   */
  public withItems(items: CardItem[]): this {
    this.data.items = items;
    return this;
  }

  /**
   * Set column span
   */
  public withColSpan(colSpan: number): this {
    this.data.colSpan = colSpan;
    return this;
  }

  /**
   * Set as info section
   */
  public asInfo(): this {
    this.data.type = 'info';
    this.data.fields = [
      { label: 'Field 1', value: 'Value 1' },
      { label: 'Field 2', value: 'Value 2' },
    ];
    return this;
  }

  /**
   * Set as analytics section
   */
  public asAnalytics(): this {
    this.data.type = 'analytics';
    this.data.fields = [
      { label: 'Metric 1', value: '85%', percentage: 85, trend: 'up' as any },
      { label: 'Metric 2', value: '42', percentage: 42, trend: 'down' as any },
    ];
    return this;
  }

  /**
   * Set as list section
   */
  public asList(): this {
    this.data.type = 'list';
    this.data.items = [
      { title: 'Item 1' },
      { title: 'Item 2' },
      { title: 'Item 3' },
    ];
    return this;
  }

  /**
   * Build the section
   */
  public build(): CardSection {
    if (!this.data.type) {
      this.data.type = 'info';
    }
    if (!this.data.title) {
      this.data.title = 'Test Section';
    }
    return this.data as CardSection;
  }
}

/**
 * Builder for creating test fields
 */
export class TestFieldBuilder {
  private data: Partial<CardField> = {};

  /**
   * Create a new test field builder
   */
  public static create(): TestFieldBuilder {
    return new TestFieldBuilder();
  }

  /**
   * Set field ID
   */
  public withId(id: string): this {
    this.data.id = id;
    return this;
  }

  /**
   * Set field label
   */
  public withLabel(label: string): this {
    this.data.label = label;
    return this;
  }

  /**
   * Set field value
   */
  public withValue(value: string | number): this {
    this.data.value = value;
    return this;
  }

  /**
   * Set field type
   */
  public withType(type: string): this {
    this.data.type = type;
    return this;
  }

  /**
   * Set field percentage
   */
  public withPercentage(percentage: number): this {
    this.data.percentage = percentage;
    return this;
  }

  /**
   * Set field trend
   */
  public withTrend(trend: 'up' | 'down' | 'stable'): this {
    this.data.trend = trend as any;
    return this;
  }

  /**
   * Set field icon
   */
  public withIcon(icon: string): this {
    this.data.icon = icon;
    return this;
  }

  /**
   * Set field as clickable
   */
  public asClickable(): this {
    this.data.clickable = true;
    return this;
  }

  /**
   * Build the field
   */
  public build(): CardField {
    if (!this.data.label) {
      this.data.label = 'Test Field';
    }
    if (this.data.value === undefined) {
      this.data.value = 'Test Value';
    }
    return this.data as CardField;
  }
}

/**
 * Helper functions for common test scenarios
 */
export class TestDataHelpers {
  /**
   * Create a minimal valid card
   */
  public static createMinimalCard(): AICardConfig {
    return TestCardBuilder.create().asMinimal().build();
  }

  /**
   * Create a card with multiple section types
   */
  public static createCardWithMultipleSections(): AICardConfig {
    return TestCardBuilder.create()
      .withTitle('Multi-Section Card')
      .withSection(TestSectionBuilder.create().asInfo().build())
      .withSection(TestSectionBuilder.create().asAnalytics().build())
      .withSection(TestSectionBuilder.create().asList().build())
      .build();
  }

  /**
   * Create a large card for performance testing
   */
  public static createLargeCard(): AICardConfig {
    return TestCardBuilder.create().asLarge().build();
  }

  /**
   * Create an array of cards
   */
  public static createCards(count: number): AICardConfig[] {
    return Array.from({ length: count }, (_, i) =>
      TestCardBuilder.create()
        .withId(`card-${i}`)
        .withTitle(`Card ${i}`)
        .withSection(TestSectionBuilder.create().asInfo().build())
        .build()
    );
  }

  /**
   * Create a card with specific section count
   */
  public static createCardWithSections(sectionCount: number): AICardConfig {
    const builder = TestCardBuilder.create().withTitle('Test Card');

    for (let i = 0; i < sectionCount; i++) {
      builder.withSection(
        TestSectionBuilder.create()
          .withTitle(`Section ${i}`)
          .asInfo()
          .build()
      );
    }

    return builder.build();
  }

  /**
   * Create a streaming placeholder card
   */
  public static createStreamingCard(): AICardConfig {
    return TestCardBuilder.create()
      .withTitle('Loading...')
      .withSection(
        TestSectionBuilder.create()
          .withTitle('Loading...')
          .withType('info')
          .withField({
            label: '...',
            value: '...',
          })
          .build()
      )
      .build();
  }
}

/**
 * Export all builders
 */
export const TestBuilders = {
  Card: TestCardBuilder,
  Section: TestSectionBuilder,
  Field: TestFieldBuilder,
  Helpers: TestDataHelpers,
};

