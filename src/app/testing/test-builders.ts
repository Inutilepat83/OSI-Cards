import { AICardConfig, CardAction, CardField, CardItem, CardSection, CardType } from '../models';

/**
 * Test data builders for creating test card configurations
 * Provides fluent API for building test data in a readable way
 */

/**
 * Builder for creating test CardField objects
 */
export class FieldBuilder {
  private field: Partial<CardField> = {};

  static create(): FieldBuilder {
    return new FieldBuilder();
  }

  withId(id: string): FieldBuilder {
    this.field.id = id;
    return this;
  }

  withLabel(label: string): FieldBuilder {
    this.field.label = label;
    return this;
  }

  withValue(value: string | number): FieldBuilder {
    this.field.value = value;
    return this;
  }

  withType(type: string): FieldBuilder {
    this.field.type = type;
    return this;
  }

  withTrend(trend: 'up' | 'down' | 'stable' | 'neutral'): FieldBuilder {
    this.field.trend = trend;
    return this;
  }

  withChange(change: number): FieldBuilder {
    this.field.change = change;
    return this;
  }

  withMeta(meta: Record<string, unknown>): FieldBuilder {
    this.field.meta = meta;
    return this;
  }

  build(): CardField {
    return {
      id: this.field.id || `field-${Date.now()}`,
      label: this.field.label || 'Test Field',
      value: this.field.value ?? 'Test Value',
      ...this.field,
    } as CardField;
  }
}

/**
 * Builder for creating test CardItem objects
 */
export class ItemBuilder {
  private item: Partial<CardItem> = {};

  static create(): ItemBuilder {
    return new ItemBuilder();
  }

  withId(id: string): ItemBuilder {
    this.item.id = id;
    return this;
  }

  withTitle(title: string): ItemBuilder {
    this.item.title = title;
    return this;
  }

  withDescription(description: string): ItemBuilder {
    this.item.description = description;
    return this;
  }

  withValue(value: string | number): ItemBuilder {
    this.item.value = value;
    return this;
  }

  withStatus(status: string): ItemBuilder {
    this.item.status = status;
    return this;
  }

  withDate(date: string): ItemBuilder {
    (this.item as any).date = date;
    return this;
  }

  withMeta(meta: Record<string, unknown>): ItemBuilder {
    this.item.meta = meta;
    return this;
  }

  build(): CardItem {
    return {
      id: this.item.id || `item-${Date.now()}`,
      title: this.item.title || 'Test Item',
      ...this.item,
    } as CardItem;
  }
}

/**
 * Builder for creating test CardSection objects
 */
export class SectionBuilder {
  private section: Partial<CardSection> = {};

  static create(): SectionBuilder {
    return new SectionBuilder();
  }

  withId(id: string): SectionBuilder {
    this.section.id = id;
    return this;
  }

  withTitle(title: string): SectionBuilder {
    this.section.title = title;
    return this;
  }

  withType(type: string): SectionBuilder {
    this.section.type = type as any;
    return this;
  }

  withDescription(description: string): SectionBuilder {
    this.section.description = description;
    return this;
  }

  withFields(fields: CardField[]): SectionBuilder {
    this.section.fields = fields;
    return this;
  }

  withItems(items: CardItem[]): SectionBuilder {
    this.section.items = items;
    return this;
  }

  withField(field: CardField): SectionBuilder {
    if (!this.section.fields) {
      this.section.fields = [];
    }
    this.section.fields.push(field);
    return this;
  }

  withItem(item: CardItem): SectionBuilder {
    if (!this.section.items) {
      this.section.items = [];
    }
    this.section.items.push(item);
    return this;
  }

  build(): CardSection {
    return {
      id: this.section.id || `section-${Date.now()}`,
      title: this.section.title || 'Test Section',
      type: this.section.type || 'overview',
      fields: this.section.fields || [],
      items: this.section.items || [],
      ...this.section,
    } as CardSection;
  }
}

/**
 * Builder for creating test AICardConfig objects
 */
export class CardBuilder {
  private card: Partial<AICardConfig> = {};

  static create(): CardBuilder {
    return new CardBuilder();
  }

  withId(id: string): CardBuilder {
    this.card.id = id;
    return this;
  }

  withTitle(title: string): CardBuilder {
    this.card.cardTitle = title;
    return this;
  }

  withType(type: CardType): CardBuilder {
    this.card.cardType = type;
    return this;
  }

  withDescription(description: string): CardBuilder {
    this.card.description = description;
    return this;
  }

  withSections(sections: CardSection[]): CardBuilder {
    this.card.sections = sections;
    return this;
  }

  withSection(section: CardSection): CardBuilder {
    if (!this.card.sections) {
      this.card.sections = [];
    }
    this.card.sections.push(section);
    return this;
  }

  withActions(actions: CardAction[]): CardBuilder {
    this.card.actions = actions;
    return this;
  }

  withAction(action: CardAction): CardBuilder {
    if (!this.card.actions) {
      this.card.actions = [];
    }
    this.card.actions.push(action);
    return this;
  }

  build(): AICardConfig {
    return {
      cardTitle: this.card.cardTitle || 'Test Card',
      sections: this.card.sections || [],
      ...this.card,
    } as AICardConfig;
  }
}

/**
 * Helper functions for creating common test scenarios
 */
export const TestCardFactory = {
  /**
   * Create a simple info card with basic fields
   */
  createSimpleInfoCard(): AICardConfig {
    return CardBuilder.create()
      .withTitle('Test Company')
      .withType('company')
      .withSection(
        SectionBuilder.create()
          .withTitle('Company Info')
          .withType('info')
          .withField(FieldBuilder.create().withLabel('Industry').withValue('Technology').build())
          .withField(FieldBuilder.create().withLabel('Employees').withValue('1000+').build())
          .build()
      )
      .build();
  },

  /**
   * Create an analytics card with metrics
   */
  createAnalyticsCard(): AICardConfig {
    return CardBuilder.create()
      .withTitle('Performance Metrics')
      .withSection(
        SectionBuilder.create()
          .withTitle('Key Metrics')
          .withType('analytics')
          .withField(
            FieldBuilder.create()
              .withLabel('Growth')
              .withValue('85%')
              .withTrend('up')
              .withChange(12)
              .build()
          )
          .withField(
            FieldBuilder.create()
              .withLabel('ROI')
              .withValue('120%')
              .withTrend('up')
              .withChange(8)
              .build()
          )
          .build()
      )
      .build();
  },

  /**
   * Create a card with multiple sections
   */
  createMultiSectionCard(): AICardConfig {
    return CardBuilder.create()
      .withTitle('Complete Profile')
      .withType('company')
      .withSection(
        SectionBuilder.create()
          .withTitle('Overview')
          .withType('overview')
          .withField(FieldBuilder.create().withLabel('Status').withValue('Active').build())
          .build()
      )
      .withSection(
        SectionBuilder.create()
          .withTitle('Analytics')
          .withType('analytics')
          .withField(FieldBuilder.create().withLabel('Revenue').withValue('$1M').build())
          .build()
      )
      .withSection(
        SectionBuilder.create()
          .withTitle('Contact List')
          .withType('list')
          .withItem(ItemBuilder.create().withTitle('John Doe').withDescription('CEO').build())
          .withItem(ItemBuilder.create().withTitle('Jane Smith').withDescription('CFO').build())
          .build()
      )
      .build();
  },
};
