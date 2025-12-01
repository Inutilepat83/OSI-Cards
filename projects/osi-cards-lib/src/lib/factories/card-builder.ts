/**
 * Type-Safe Card Builder DSL (Improvement Plan Point #26)
 * 
 * Fluent API for constructing AICardConfig objects with compile-time validation.
 * Provides IntelliSense support and catches errors at build time.
 * 
 * @example
 * ```typescript
 * import { CardBuilder } from 'osi-cards-lib';
 * 
 * const card = CardBuilder.create('Company Overview')
 *   .withDescription('Acme Corp profile')
 *   .addInfoSection('Details')
 *     .field('Industry', 'Technology')
 *     .field('Employees', '500+')
 *     .field('Founded', '2010')
 *     .done()
 *   .addAnalyticsSection('Performance')
 *     .metric('Growth', '85%', { percentage: 85, trend: 'up' })
 *     .metric('Revenue', '$10M', { percentage: 100 })
 *     .done()
 *   .addAction('Contact', { type: 'mail', email: { to: 'info@acme.com' } })
 *   .build();
 * ```
 */

import {
  AICardConfig,
  CardSection,
  CardField,
  CardItem,
  CardAction,
  CardType,
  SectionTypeInput
} from '../models';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Field options for the builder
 */
export interface FieldOptions {
  icon?: string;
  format?: 'currency' | 'percentage' | 'number' | 'text';
  percentage?: number;
  trend?: 'up' | 'down' | 'stable' | 'neutral';
  change?: number;
  description?: string;
}

/**
 * Item options for the builder
 */
export interface ItemOptions {
  description?: string;
  value?: string | number;
  status?: string;
  badge?: string;
  icon?: string;
  url?: string;
  date?: string;
  meta?: Record<string, unknown>;
}

/**
 * Action options for the builder
 */
export interface ActionOptions {
  type?: 'mail' | 'website' | 'agent' | 'question';
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: string;
  url?: string;
  email?: {
    to?: string | string[];
    cc?: string | string[];
    subject?: string;
    body?: string;
    contact?: { name: string; email: string; role: string };
  };
  agentId?: string;
  question?: string;
}

/**
 * Section options for the builder
 */
export interface SectionOptions {
  description?: string;
  subtitle?: string;
  emoji?: string;
  columns?: number;
  preferredColumns?: 1 | 2 | 3 | 4;
  colSpan?: number;
  priority?: 'critical' | 'important' | 'standard' | 'optional';
  collapsed?: boolean;
}

// ============================================================================
// SECTION BUILDERS
// ============================================================================

/**
 * Base section builder
 */
export class SectionBuilder<T extends SectionTypeInput> {
  protected section: Partial<CardSection>;
  
  constructor(
    protected readonly parentBuilder: CardBuilder,
    protected readonly sectionType: T,
    title: string,
    options: SectionOptions = {}
  ) {
    this.section = {
      title,
      type: sectionType,
      fields: [],
      items: [],
      ...options
    };
  }
  
  /**
   * Add description
   */
  withDescription(description: string): this {
    this.section.description = description;
    return this;
  }
  
  /**
   * Add subtitle
   */
  withSubtitle(subtitle: string): this {
    this.section.subtitle = subtitle;
    return this;
  }
  
  /**
   * Add emoji
   */
  withEmoji(emoji: string): this {
    this.section.emoji = emoji;
    return this;
  }
  
  /**
   * Set column span
   */
  withColSpan(colSpan: number): this {
    this.section.colSpan = colSpan;
    return this;
  }
  
  /**
   * Set preferred columns
   */
  withPreferredColumns(columns: 1 | 2 | 3 | 4): this {
    this.section.preferredColumns = columns;
    return this;
  }
  
  /**
   * Set priority
   */
  withPriority(priority: 'critical' | 'important' | 'standard' | 'optional'): this {
    this.section.priority = priority;
    return this;
  }
  
  /**
   * Set collapsed state
   */
  collapsed(collapsed = true): this {
    this.section.collapsed = collapsed;
    return this;
  }
  
  /**
   * Add a field to the section
   */
  field(label: string, value: string | number | boolean, options: FieldOptions = {}): this {
    const field: CardField = {
      label,
      value: String(value),
      ...options
    };
    this.section.fields = [...(this.section.fields ?? []), field];
    return this;
  }
  
  /**
   * Add an item to the section
   */
  item(title: string, options: ItemOptions = {}): this {
    const item: CardItem = {
      title,
      ...options
    };
    this.section.items = [...(this.section.items ?? []), item];
    return this;
  }
  
  /**
   * Finish building this section and return to parent
   */
  done(): CardBuilder {
    this.parentBuilder['addBuiltSection'](this.section as CardSection);
    return this.parentBuilder;
  }
  
  /**
   * Build the section (for standalone use)
   */
  buildSection(): CardSection {
    return this.section as CardSection;
  }
}

/**
 * Info section builder with typed field helpers
 */
export class InfoSectionBuilder extends SectionBuilder<'info'> {
  constructor(parentBuilder: CardBuilder, title: string, options: SectionOptions = {}) {
    super(parentBuilder, 'info', title, options);
  }
  
  /**
   * Add a text field
   */
  text(label: string, value: string): this {
    return this.field(label, value, { format: 'text' });
  }
  
  /**
   * Add a number field
   */
  number(label: string, value: number): this {
    return this.field(label, value, { format: 'number' });
  }
  
  /**
   * Add a currency field
   */
  currency(label: string, value: string | number): this {
    return this.field(label, value, { format: 'currency' });
  }
  
  /**
   * Add a field with icon
   */
  withIcon(label: string, value: string, icon: string): this {
    return this.field(label, value, { icon });
  }
}

/**
 * Analytics section builder with metric helpers
 */
export class AnalyticsSectionBuilder extends SectionBuilder<'analytics'> {
  constructor(parentBuilder: CardBuilder, title: string, options: SectionOptions = {}) {
    super(parentBuilder, 'analytics', title, options);
  }
  
  /**
   * Add a metric with trend
   */
  metric(
    label: string, 
    value: string | number, 
    options: { percentage?: number; trend?: 'up' | 'down' | 'stable'; change?: number } = {}
  ): this {
    return this.field(label, value, {
      format: 'percentage',
      ...options
    });
  }
  
  /**
   * Add a KPI
   */
  kpi(label: string, value: string | number, target?: number): this {
    const percentage = target ? (Number(value) / target) * 100 : undefined;
    return this.field(label, value, { percentage });
  }
  
  /**
   * Add a growth metric
   */
  growth(label: string, value: number, previousValue: number): this {
    const change = ((value - previousValue) / previousValue) * 100;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    return this.field(label, `${value}`, { 
      percentage: Math.abs(change),
      trend,
      change
    });
  }
}

/**
 * List section builder with item helpers
 */
export class ListSectionBuilder extends SectionBuilder<'list'> {
  constructor(parentBuilder: CardBuilder, title: string, options: SectionOptions = {}) {
    super(parentBuilder, 'list', title, options);
  }
  
  /**
   * Add multiple items at once
   */
  items(items: Array<{ title: string } & ItemOptions>): this {
    for (const itemData of items) {
      this.item(itemData.title, itemData);
    }
    return this;
  }
  
  /**
   * Add a simple text item
   */
  textItem(title: string, description?: string): this {
    return this.item(title, { description });
  }
  
  /**
   * Add an item with status badge
   */
  statusItem(title: string, status: string, statusType: 'success' | 'warning' | 'error' | 'info' = 'info'): this {
    return this.item(title, { status, badge: statusType });
  }
}

/**
 * Event/Timeline section builder
 */
export class EventSectionBuilder extends SectionBuilder<'event'> {
  constructor(parentBuilder: CardBuilder, title: string, options: SectionOptions = {}) {
    super(parentBuilder, 'event', title, options);
  }
  
  /**
   * Add an event
   */
  event(title: string, date: string, options: ItemOptions = {}): this {
    return this.item(title, { date, ...options });
  }
  
  /**
   * Add a milestone
   */
  milestone(title: string, date: string, description?: string): this {
    return this.item(title, { date, description, badge: 'milestone' });
  }
}

/**
 * Contact card section builder
 */
export class ContactSectionBuilder extends SectionBuilder<'contact-card'> {
  constructor(parentBuilder: CardBuilder, title: string, options: SectionOptions = {}) {
    super(parentBuilder, 'contact-card', title, options);
  }
  
  /**
   * Add a contact
   */
  contact(name: string, role: string, options: { email?: string; phone?: string; avatar?: string } = {}): this {
    this.field('Name', name);
    this.field('Role', role);
    if (options.email) this.field('Email', options.email);
    if (options.phone) this.field('Phone', options.phone);
    return this;
  }
}

/**
 * Chart section builder
 */
export class ChartSectionBuilder extends SectionBuilder<'chart'> {
  constructor(parentBuilder: CardBuilder, title: string, options: SectionOptions = {}) {
    super(parentBuilder, 'chart', title, options);
  }
  
  /**
   * Set chart type
   */
  chartType(type: 'bar' | 'line' | 'pie' | 'doughnut'): this {
    this.section.chartType = type;
    return this;
  }
  
  /**
   * Set chart data
   */
  data(labels: string[], datasets: Array<{ label: string; data: number[]; backgroundColor?: string | string[] }>): this {
    this.section.chartData = { labels, datasets };
    return this;
  }
  
  /**
   * Add a simple bar chart
   */
  barChart(labels: string[], values: number[], label = 'Data'): this {
    return this.chartType('bar').data(labels, [{ label, data: values }]);
  }
  
  /**
   * Add a simple pie chart
   */
  pieChart(labels: string[], values: number[], colors?: string[]): this {
    return this.chartType('pie').data(labels, [{ 
      label: 'Distribution', 
      data: values,
      backgroundColor: colors
    }]);
  }
}

// ============================================================================
// MAIN CARD BUILDER
// ============================================================================

/**
 * Main Card Builder class
 * 
 * Provides a fluent API for constructing AICardConfig objects.
 */
export class CardBuilder {
  private config: Partial<AICardConfig>;
  private sections: CardSection[] = [];
  private actions: CardAction[] = [];
  
  private constructor(title: string) {
    this.config = {
      cardTitle: title,
      sections: [],
      actions: []
    };
  }
  
  /**
   * Create a new card builder
   */
  static create(title: string): CardBuilder {
    return new CardBuilder(title);
  }
  
  /**
   * Set card ID
   */
  withId(id: string): this {
    this.config.id = id;
    return this;
  }
  
  /**
   * Set card description
   */
  withDescription(description: string): this {
    this.config.description = description;
    return this;
  }
  
  /**
   * Set card type
   */
  withType(type: CardType): this {
    this.config.cardType = type;
    return this;
  }
  
  /**
   * Set column count
   */
  withColumns(columns: 1 | 2 | 3): this {
    this.config.columns = columns;
    return this;
  }
  
  /**
   * Set display order
   */
  withDisplayOrder(order: number): this {
    this.config.displayOrder = order;
    return this;
  }
  
  /**
   * Add metadata
   */
  withMeta(meta: Record<string, unknown>): this {
    this.config.meta = { ...(this.config.meta ?? {}), ...meta };
    return this;
  }
  
  // ============================================================================
  // SECTION BUILDERS
  // ============================================================================
  
  /**
   * Add an info section
   */
  addInfoSection(title: string, options: SectionOptions = {}): InfoSectionBuilder {
    return new InfoSectionBuilder(this, title, options);
  }
  
  /**
   * Add an analytics section
   */
  addAnalyticsSection(title: string, options: SectionOptions = {}): AnalyticsSectionBuilder {
    return new AnalyticsSectionBuilder(this, title, options);
  }
  
  /**
   * Add a list section
   */
  addListSection(title: string, options: SectionOptions = {}): ListSectionBuilder {
    return new ListSectionBuilder(this, title, options);
  }
  
  /**
   * Add an event/timeline section
   */
  addEventSection(title: string, options: SectionOptions = {}): EventSectionBuilder {
    return new EventSectionBuilder(this, title, options);
  }
  
  /**
   * Add a contact card section
   */
  addContactSection(title: string, options: SectionOptions = {}): ContactSectionBuilder {
    return new ContactSectionBuilder(this, title, options);
  }
  
  /**
   * Add a chart section
   */
  addChartSection(title: string, options: SectionOptions = {}): ChartSectionBuilder {
    return new ChartSectionBuilder(this, title, options);
  }
  
  /**
   * Add a generic section
   */
  addSection<T extends SectionTypeInput>(
    type: T, 
    title: string, 
    options: SectionOptions = {}
  ): SectionBuilder<T> {
    return new SectionBuilder(this, type, title, options);
  }
  
  /**
   * Add a pre-built section
   */
  addRawSection(section: CardSection): this {
    this.sections.push(section);
    return this;
  }
  
  /**
   * Internal method to add a built section
   */
  private addBuiltSection(section: CardSection): void {
    this.sections.push(section);
  }
  
  // ============================================================================
  // ACTION BUILDERS
  // ============================================================================
  
  /**
   * Add an action button
   */
  addAction(label: string, options: ActionOptions = {}): this {
    const action: CardAction = {
      label,
      ...options
    };
    this.actions.push(action);
    return this;
  }
  
  /**
   * Add a primary action
   */
  addPrimaryAction(label: string, options: Omit<ActionOptions, 'variant'> = {}): this {
    return this.addAction(label, { ...options, variant: 'primary' });
  }
  
  /**
   * Add a secondary action
   */
  addSecondaryAction(label: string, options: Omit<ActionOptions, 'variant'> = {}): this {
    return this.addAction(label, { ...options, variant: 'secondary' });
  }
  
  /**
   * Add a mail action
   */
  addMailAction(label: string, email: ActionOptions['email']): this {
    return this.addAction(label, { type: 'mail', email, icon: 'mail' });
  }
  
  /**
   * Add a website link action
   */
  addWebsiteAction(label: string, url: string): this {
    return this.addAction(label, { type: 'website', url, icon: 'external-link' });
  }
  
  // ============================================================================
  // BUILD
  // ============================================================================
  
  /**
   * Build the final AICardConfig
   */
  build(): AICardConfig {
    return {
      ...this.config,
      cardTitle: this.config.cardTitle!,
      sections: this.sections,
      actions: this.actions.length > 0 ? this.actions : undefined
    } as AICardConfig;
  }
  
  /**
   * Build and validate the card
   */
  buildValidated(): AICardConfig {
    const card = this.build();
    
    // Basic validation
    if (!card.cardTitle) {
      throw new Error('Card title is required');
    }
    
    if (card.sections.length === 0) {
      throw new Error('Card must have at least one section');
    }
    
    return card;
  }
  
  /**
   * Convert to JSON string
   */
  toJson(pretty = false): string {
    const card = this.build();
    return pretty ? JSON.stringify(card, null, 2) : JSON.stringify(card);
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick card builder function
 */
export function buildCard(title: string): CardBuilder {
  return CardBuilder.create(title);
}

/**
 * Create a simple info card
 */
export function createInfoCard(
  title: string,
  fields: Array<{ label: string; value: string | number }>
): AICardConfig {
  const builder = CardBuilder.create(title).addInfoSection('Information');
  
  for (const field of fields) {
    builder.field(field.label, field.value);
  }
  
  return builder.done().build();
}

/**
 * Create a simple analytics card
 */
export function createAnalyticsCard(
  title: string,
  metrics: Array<{ label: string; value: string | number; trend?: 'up' | 'down' | 'stable' }>
): AICardConfig {
  const builder = CardBuilder.create(title).addAnalyticsSection('Metrics');
  
  for (const metric of metrics) {
    builder.metric(metric.label, metric.value, { trend: metric.trend });
  }
  
  return builder.done().build();
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  CardBuilder,
  SectionBuilder,
  InfoSectionBuilder,
  AnalyticsSectionBuilder,
  ListSectionBuilder,
  EventSectionBuilder,
  ContactSectionBuilder,
  ChartSectionBuilder,
  buildCard,
  createInfoCard,
  createAnalyticsCard
};

