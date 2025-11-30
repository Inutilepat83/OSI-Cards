/**
 * OSI Cards Factory
 * 
 * Factory functions and builders for creating card configurations.
 * Provides a fluent API for constructing cards, sections, fields, and items.
 * 
 * @example
 * ```typescript
 * import { CardFactory, SectionFactory } from 'osi-cards-lib';
 * 
 * const card = CardFactory.create()
 *   .withTitle('Company Overview')
 *   .withSection(
 *     SectionFactory.create()
 *       .withType('info')
 *       .withTitle('Details')
 *       .withField({ label: 'Industry', value: 'Technology' })
 *       .build()
 *   )
 *   .build();
 * ```
 * 
 * @module factories
 */

import type { 
  AICardConfig, 
  CardSection, 
  CardField, 
  CardItem, 
  CardAction,
  CardType 
} from '../models/card.model';
import type { SectionTypeInput } from '../models/generated-section-types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Builder state for tracking required fields
 */
interface BuilderState {
  readonly hasTitle: boolean;
  readonly hasType: boolean;
  readonly hasSections: boolean;
}

/**
 * Card builder interface with fluent API
 */
export interface ICardBuilder {
  withId(id: string): ICardBuilder;
  withTitle(title: string): ICardBuilder;
  withDescription(description: string): ICardBuilder;
  withType(type: CardType): ICardBuilder;
  withColumns(columns: 1 | 2 | 3): ICardBuilder;
  withSection(section: CardSection): ICardBuilder;
  withSections(sections: CardSection[]): ICardBuilder;
  withAction(action: CardAction): ICardBuilder;
  withActions(actions: CardAction[]): ICardBuilder;
  withMeta(key: string, value: unknown): ICardBuilder;
  withDisplayOrder(order: number): ICardBuilder;
  build(): AICardConfig;
  isValid(): boolean;
}

/**
 * Section builder interface with fluent API
 */
export interface ISectionBuilder {
  withId(id: string): ISectionBuilder;
  withTitle(title: string): ISectionBuilder;
  withType(type: SectionTypeInput): ISectionBuilder;
  withDescription(description: string): ISectionBuilder;
  withSubtitle(subtitle: string): ISectionBuilder;
  withColumns(columns: number): ISectionBuilder;
  withColSpan(span: number): ISectionBuilder;
  withPreferredColumns(columns: 1 | 2 | 3 | 4): ISectionBuilder;
  withPriority(priority: 'critical' | 'important' | 'standard' | 'optional'): ISectionBuilder;
  withField(field: CardField): ISectionBuilder;
  withFields(fields: CardField[]): ISectionBuilder;
  withItem(item: CardItem): ISectionBuilder;
  withItems(items: CardItem[]): ISectionBuilder;
  withEmoji(emoji: string): ISectionBuilder;
  withCollapsed(collapsed: boolean): ISectionBuilder;
  withMeta(key: string, value: unknown): ISectionBuilder;
  build(): CardSection;
  isValid(): boolean;
}

// ============================================================================
// CARD BUILDER
// ============================================================================

/**
 * Fluent builder for AICardConfig
 */
class CardBuilder implements ICardBuilder {
  private config: Partial<AICardConfig> = {};
  private sections: CardSection[] = [];
  private actions: CardAction[] = [];
  private meta: Record<string, unknown> = {};

  /**
   * Set the card ID
   */
  withId(id: string): ICardBuilder {
    this.config.id = id;
    return this;
  }

  /**
   * Set the card title (required)
   */
  withTitle(title: string): ICardBuilder {
    this.config.cardTitle = title;
    return this;
  }

  /**
   * Set the card description
   */
  withDescription(description: string): ICardBuilder {
    this.config.description = description;
    return this;
  }

  /**
   * Set the card type
   */
  withType(type: CardType): ICardBuilder {
    this.config.cardType = type;
    return this;
  }

  /**
   * Set the number of columns
   */
  withColumns(columns: 1 | 2 | 3): ICardBuilder {
    this.config.columns = columns;
    return this;
  }

  /**
   * Add a single section
   */
  withSection(section: CardSection): ICardBuilder {
    this.sections.push(section);
    return this;
  }

  /**
   * Add multiple sections
   */
  withSections(sections: CardSection[]): ICardBuilder {
    this.sections.push(...sections);
    return this;
  }

  /**
   * Add a single action
   */
  withAction(action: CardAction): ICardBuilder {
    this.actions.push(action);
    return this;
  }

  /**
   * Add multiple actions
   */
  withActions(actions: CardAction[]): ICardBuilder {
    this.actions.push(...actions);
    return this;
  }

  /**
   * Add metadata
   */
  withMeta(key: string, value: unknown): ICardBuilder {
    this.meta[key] = value;
    return this;
  }

  /**
   * Set display order for sorting
   */
  withDisplayOrder(order: number): ICardBuilder {
    this.config.displayOrder = order;
    return this;
  }

  /**
   * Check if the builder has all required fields
   */
  isValid(): boolean {
    return Boolean(this.config.cardTitle && this.sections.length > 0);
  }

  /**
   * Build the final card configuration
   * @throws Error if required fields are missing
   */
  build(): AICardConfig {
    if (!this.config.cardTitle) {
      throw new Error('Card title is required. Use .withTitle() to set it.');
    }

    if (this.sections.length === 0) {
      throw new Error('At least one section is required. Use .withSection() to add one.');
    }

    const card: AICardConfig = {
      ...this.config,
      cardTitle: this.config.cardTitle,
      sections: this.sections,
    };

    if (this.actions.length > 0) {
      card.actions = this.actions;
    }

    if (Object.keys(this.meta).length > 0) {
      card.meta = this.meta;
    }

    return card;
  }
}

// ============================================================================
// SECTION BUILDER
// ============================================================================

/**
 * Fluent builder for CardSection
 */
class SectionBuilder implements ISectionBuilder {
  private section: Partial<CardSection> = {};
  private fields: CardField[] = [];
  private items: CardItem[] = [];
  private meta: Record<string, unknown> = {};

  /**
   * Set the section ID
   */
  withId(id: string): ISectionBuilder {
    this.section.id = id;
    return this;
  }

  /**
   * Set the section title (required)
   */
  withTitle(title: string): ISectionBuilder {
    this.section.title = title;
    return this;
  }

  /**
   * Set the section type (required)
   */
  withType(type: SectionTypeInput): ISectionBuilder {
    this.section.type = type;
    return this;
  }

  /**
   * Set the section description
   */
  withDescription(description: string): ISectionBuilder {
    this.section.description = description;
    return this;
  }

  /**
   * Set the section subtitle
   */
  withSubtitle(subtitle: string): ISectionBuilder {
    this.section.subtitle = subtitle;
    return this;
  }

  /**
   * Set the number of columns
   */
  withColumns(columns: number): ISectionBuilder {
    this.section.columns = columns;
    return this;
  }

  /**
   * Set explicit column span
   */
  withColSpan(span: number): ISectionBuilder {
    this.section.colSpan = span;
    return this;
  }

  /**
   * Set preferred column count
   */
  withPreferredColumns(columns: 1 | 2 | 3 | 4): ISectionBuilder {
    this.section.preferredColumns = columns;
    return this;
  }

  /**
   * Set layout priority
   */
  withPriority(priority: 'critical' | 'important' | 'standard' | 'optional'): ISectionBuilder {
    this.section.priority = priority;
    return this;
  }

  /**
   * Add a single field
   */
  withField(field: CardField): ISectionBuilder {
    this.fields.push(field);
    return this;
  }

  /**
   * Add multiple fields
   */
  withFields(fields: CardField[]): ISectionBuilder {
    this.fields.push(...fields);
    return this;
  }

  /**
   * Add a single item
   */
  withItem(item: CardItem): ISectionBuilder {
    this.items.push(item);
    return this;
  }

  /**
   * Add multiple items
   */
  withItems(items: CardItem[]): ISectionBuilder {
    this.items.push(...items);
    return this;
  }

  /**
   * Set section emoji
   */
  withEmoji(emoji: string): ISectionBuilder {
    this.section.emoji = emoji;
    return this;
  }

  /**
   * Set collapsed state
   */
  withCollapsed(collapsed: boolean): ISectionBuilder {
    this.section.collapsed = collapsed;
    return this;
  }

  /**
   * Add metadata
   */
  withMeta(key: string, value: unknown): ISectionBuilder {
    this.meta[key] = value;
    return this;
  }

  /**
   * Check if the builder has all required fields
   */
  isValid(): boolean {
    return Boolean(this.section.title && this.section.type);
  }

  /**
   * Build the final section configuration
   * @throws Error if required fields are missing
   */
  build(): CardSection {
    if (!this.section.title) {
      throw new Error('Section title is required. Use .withTitle() to set it.');
    }

    if (!this.section.type) {
      throw new Error('Section type is required. Use .withType() to set it.');
    }

    const section: CardSection = {
      ...this.section,
      title: this.section.title,
      type: this.section.type,
    };

    if (this.fields.length > 0) {
      section.fields = this.fields;
    }

    if (this.items.length > 0) {
      section.items = this.items;
    }

    if (Object.keys(this.meta).length > 0) {
      section.meta = this.meta;
    }

    return section;
  }
}

// ============================================================================
// FACTORY CLASSES
// ============================================================================

/**
 * Factory for creating card configurations
 * 
 * @example
 * ```typescript
 * const card = CardFactory.create()
 *   .withTitle('My Card')
 *   .withSection(mySection)
 *   .build();
 * 
 * // Or create from existing config
 * const newCard = CardFactory.fromConfig(existingCard)
 *   .withTitle('Updated Title')
 *   .build();
 * ```
 */
export class CardFactory {
  /**
   * Create a new card builder
   */
  static create(): ICardBuilder {
    return new CardBuilder();
  }

  /**
   * Create a card builder from existing config
   */
  static fromConfig(config: Partial<AICardConfig>): ICardBuilder {
    const builder = new CardBuilder();
    
    if (config.id) builder.withId(config.id);
    if (config.cardTitle) builder.withTitle(config.cardTitle);
    if (config.description) builder.withDescription(config.description);
    if (config.cardType) builder.withType(config.cardType);
    if (config.columns) builder.withColumns(config.columns);
    if (config.sections) builder.withSections(config.sections);
    if (config.actions) builder.withActions(config.actions);
    if (config.displayOrder !== undefined) builder.withDisplayOrder(config.displayOrder);
    
    if (config.meta) {
      Object.entries(config.meta).forEach(([key, value]) => {
        builder.withMeta(key, value);
      });
    }
    
    return builder;
  }

  /**
   * Create a minimal card with just title and one section
   */
  static minimal(title: string, section: CardSection): AICardConfig {
    return CardFactory.create()
      .withTitle(title)
      .withSection(section)
      .build();
  }

  /**
   * Clone a card configuration
   */
  static clone(config: AICardConfig): AICardConfig {
    return JSON.parse(JSON.stringify(config)) as AICardConfig;
  }
}

/**
 * Factory for creating section configurations
 * 
 * @example
 * ```typescript
 * const section = SectionFactory.create()
 *   .withType('info')
 *   .withTitle('Details')
 *   .withField({ label: 'Key', value: 'Value' })
 *   .build();
 * ```
 */
export class SectionFactory {
  /**
   * Create a new section builder
   */
  static create(): ISectionBuilder {
    return new SectionBuilder();
  }

  /**
   * Create a section builder from existing config
   */
  static fromConfig(config: Partial<CardSection>): ISectionBuilder {
    const builder = new SectionBuilder();
    
    if (config.id) builder.withId(config.id);
    if (config.title) builder.withTitle(config.title);
    if (config.type) builder.withType(config.type);
    if (config.description) builder.withDescription(config.description);
    if (config.subtitle) builder.withSubtitle(config.subtitle);
    if (config.columns) builder.withColumns(config.columns);
    if (config.colSpan) builder.withColSpan(config.colSpan);
    if (config.preferredColumns) builder.withPreferredColumns(config.preferredColumns);
    if (config.priority) builder.withPriority(config.priority);
    if (config.fields) builder.withFields(config.fields);
    if (config.items) builder.withItems(config.items);
    if (config.emoji) builder.withEmoji(config.emoji);
    if (config.collapsed !== undefined) builder.withCollapsed(config.collapsed);
    
    if (config.meta) {
      Object.entries(config.meta).forEach(([key, value]) => {
        builder.withMeta(key, value);
      });
    }
    
    return builder;
  }

  /**
   * Create a minimal section with just type and title
   */
  static minimal(type: SectionTypeInput, title: string): CardSection {
    return SectionFactory.create()
      .withType(type)
      .withTitle(title)
      .build();
  }

  /**
   * Create an info section
   */
  static info(title: string, fields: CardField[]): CardSection {
    return SectionFactory.create()
      .withType('info')
      .withTitle(title)
      .withFields(fields)
      .build();
  }

  /**
   * Create an analytics section
   */
  static analytics(title: string, fields: CardField[]): CardSection {
    return SectionFactory.create()
      .withType('analytics')
      .withTitle(title)
      .withFields(fields)
      .build();
  }

  /**
   * Create a list section
   */
  static list(title: string, items: CardItem[]): CardSection {
    return SectionFactory.create()
      .withType('list')
      .withTitle(title)
      .withItems(items)
      .build();
  }

  /**
   * Create a news section
   */
  static news(title: string, items: CardItem[]): CardSection {
    return SectionFactory.create()
      .withType('news')
      .withTitle(title)
      .withItems(items)
      .build();
  }

  /**
   * Clone a section configuration
   */
  static clone(config: CardSection): CardSection {
    return JSON.parse(JSON.stringify(config)) as CardSection;
  }
}

/**
 * Factory for creating field configurations
 */
export class FieldFactory {
  /**
   * Create a text field
   */
  static text(label: string, value: string): CardField {
    return { label, value, type: 'text' };
  }

  /**
   * Create a number field
   */
  static number(label: string, value: number): CardField {
    return { label, value, type: 'number', format: 'number' };
  }

  /**
   * Create a currency field
   */
  static currency(label: string, value: string | number): CardField {
    return { label, value, format: 'currency' };
  }

  /**
   * Create a percentage field
   */
  static percentage(label: string, value: number, percentage?: number): CardField {
    return { 
      label, 
      value: `${value}%`, 
      percentage: percentage ?? value,
      format: 'percentage' 
    };
  }

  /**
   * Create a field with trend indicator
   */
  static withTrend(
    label: string, 
    value: string | number, 
    trend: 'up' | 'down' | 'stable' | 'neutral',
    change?: number
  ): CardField {
    return { label, value, trend, change };
  }

  /**
   * Create a contact field
   */
  static contact(
    name: string,
    role: string,
    email?: string,
    phone?: string
  ): CardField {
    return { 
      label: name,
      title: name,
      value: role,
      role,
      email,
      phone
    };
  }

  /**
   * Create a link field
   */
  static link(label: string, url: string, value?: string): CardField {
    return { 
      label, 
      value: value ?? url, 
      link: url,
      clickable: true 
    };
  }

  /**
   * Create a status field
   */
  static status(
    label: string, 
    status: CardField['status'],
    value?: string
  ): CardField {
    return { label, value: value ?? status, status };
  }
}

/**
 * Factory for creating item configurations
 */
export class ItemFactory {
  /**
   * Create a basic item
   */
  static basic(title: string, description?: string): CardItem {
    return { title, description };
  }

  /**
   * Create an item with icon
   */
  static withIcon(title: string, icon: string, description?: string): CardItem {
    return { title, icon, description };
  }

  /**
   * Create a news item
   */
  static news(
    title: string, 
    description: string, 
    source?: string, 
    date?: string
  ): CardItem {
    return { 
      title, 
      description,
      meta: { source, date }
    };
  }

  /**
   * Create a list item with status
   */
  static withStatus(
    title: string, 
    status: string, 
    description?: string
  ): CardItem {
    return { title, status, description };
  }

  /**
   * Create an item with value
   */
  static withValue(title: string, value: string | number, description?: string): CardItem {
    return { title, value, description };
  }
}

/**
 * Factory for creating action configurations
 */
export class ActionFactory {
  /**
   * Create a primary action button
   */
  static primary(label: string, action?: string): CardAction {
    return { label, action, variant: 'primary' } as CardAction;
  }

  /**
   * Create a secondary action button
   */
  static secondary(label: string, action?: string): CardAction {
    return { label, action, variant: 'secondary' } as CardAction;
  }

  /**
   * Create a website link action
   */
  static website(label: string, url: string): CardAction {
    return { 
      label, 
      type: 'website', 
      url,
      variant: 'primary'
    } as CardAction;
  }

  /**
   * Create an email action
   */
  static email(
    label: string,
    contact: { name: string; email: string; role: string },
    subject: string,
    body: string
  ): CardAction {
    return {
      label,
      type: 'mail',
      variant: 'primary',
      email: { contact, subject, body }
    } as CardAction;
  }

  /**
   * Create an agent action
   */
  static agent(label: string, agentId?: string, context?: Record<string, unknown>): CardAction {
    return {
      label,
      type: 'agent',
      variant: 'outline',
      agentId,
      agentContext: context
    } as CardAction;
  }

  /**
   * Create a question action
   */
  static question(label: string, question?: string): CardAction {
    return {
      label,
      type: 'question',
      variant: 'ghost',
      question
    } as CardAction;
  }
}

