/**
 * Abstract Base Classes for Section Patterns
 *
 * Provides specialized abstract base classes for different section types:
 * - FieldBasedSectionComponent: For sections that primarily display fields
 * - ItemBasedSectionComponent: For sections that primarily display items/lists
 * - ChartSectionBaseComponent: For sections with data visualizations
 * - MixedContentSectionComponent: For sections with both fields and items
 *
 * @module components/sections/abstract-section-bases
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
  signal,
  computed,
  OnInit,
  OnDestroy
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

import { BaseSectionComponent, SectionLayoutConfig, DEFAULT_LAYOUT_CONFIG } from './base-section.component';
import { CardField, CardItem, CardSection } from '../../models';

// ============================================================================
// FIELD-BASED SECTION
// ============================================================================

/**
 * Abstract base for sections that primarily display fields (key-value pairs).
 *
 * Use this for sections like:
 * - Info Section
 * - Analytics Section
 * - Financials Section
 * - Overview Section
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class InfoSectionComponent extends FieldBasedSectionComponent {
 *   static override readonly layoutConfig: SectionLayoutConfig = {
 *     preferredColumns: 1,
 *     minColumns: 1,
 *     maxColumns: 2,
 *     expandOnFieldCount: 6
 *   };
 * }
 * ```
 */
@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export abstract class FieldBasedSectionComponent extends BaseSectionComponent<CardField> {
  /**
   * Override in subclass to customize layout behavior
   */
  static readonly layoutConfig: SectionLayoutConfig = {
    ...DEFAULT_LAYOUT_CONFIG,
    expandOnFieldCount: 5
  };

  /**
   * Fields to display (computed from section)
   */
  readonly displayFields = computed(() => this.getDisplayFields());

  /**
   * Number of visible fields
   */
  readonly fieldCount = computed(() => this.displayFields().length);

  /**
   * Whether the section has displayable content
   */
  readonly hasContent = computed(() => this.fieldCount() > 0);

  /**
   * Get fields filtered for display (removes streaming placeholders)
   */
  protected getDisplayFields(): CardField[] {
    return this.getFields().filter(field => {
      const value = this.getFieldValue(field);
      return value !== undefined && value !== null && !this.isStreamingPlaceholder(value);
    });
  }

  /**
   * Format field value for display
   */
  protected formatFieldValue(field: CardField): string {
    const value = this.getFieldValue(field);

    if (value === null || value === undefined) {
      return '';
    }

    // Handle formatting based on field.format
    switch (field.format) {
      case 'currency':
        return this.formatCurrency(value);
      case 'percentage':
        return this.formatPercentage(value);
      case 'number':
        return this.formatNumber(value);
      default:
        return String(value);
    }
  }

  /**
   * Format value as currency
   */
  protected formatCurrency(value: unknown): string {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }
    return String(value);
  }

  /**
   * Format value as percentage
   */
  protected formatPercentage(value: unknown): string {
    if (typeof value === 'number') {
      return `${value}%`;
    }
    return String(value);
  }

  /**
   * Format value as number
   */
  protected formatNumber(value: unknown): string {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    return String(value);
  }

  /**
   * Handle field click
   */
  onFieldClick(field: CardField, index: number): void {
    this.emitFieldInteraction(field, {
      action: 'click',
      index
    });
  }
}

// ============================================================================
// ITEM-BASED SECTION
// ============================================================================

/**
 * Abstract base for sections that primarily display items (lists, cards).
 *
 * Use this for sections like:
 * - List Section
 * - News Section
 * - Network Card Section
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class ListSectionComponent extends ItemBasedSectionComponent {
 *   static override readonly layoutConfig: SectionLayoutConfig = {
 *     preferredColumns: 1,
 *     minColumns: 1,
 *     maxColumns: 2,
 *     expandOnItemCount: 4
 *   };
 * }
 * ```
 */
@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export abstract class ItemBasedSectionComponent extends BaseSectionComponent<CardItem> {
  /**
   * Override in subclass to customize layout behavior
   */
  static readonly layoutConfig: SectionLayoutConfig = {
    ...DEFAULT_LAYOUT_CONFIG,
    expandOnItemCount: 4
  };

  /**
   * Maximum items to show before "show more"
   */
  @Input() maxVisibleItems = 10;

  /**
   * Whether to show expand/collapse toggle
   */
  @Input() showExpandToggle = true;

  /**
   * Expanded state
   */
  protected isExpanded = signal(false);

  /**
   * Items to display (computed from section)
   */
  readonly displayItems = computed(() => this.getDisplayItems());

  /**
   * Total item count
   */
  readonly itemCount = computed(() => this.displayItems().length);

  /**
   * Visible items (respects maxVisibleItems when collapsed)
   */
  readonly visibleItems = computed(() => {
    const items = this.displayItems();
    if (this.isExpanded() || items.length <= this.maxVisibleItems) {
      return items;
    }
    return items.slice(0, this.maxVisibleItems);
  });

  /**
   * Whether there are more items to show
   */
  readonly hasMoreItems = computed(() =>
    this.displayItems().length > this.maxVisibleItems
  );

  /**
   * Number of hidden items
   */
  readonly hiddenItemCount = computed(() =>
    Math.max(0, this.displayItems().length - this.maxVisibleItems)
  );

  /**
   * Whether the section has displayable content
   */
  readonly hasContent = computed(() => this.itemCount() > 0);

  /**
   * Get items filtered for display
   */
  protected getDisplayItems(): CardItem[] {
    return this.getItems().filter(item => {
      const title = item.title;
      return title !== undefined && title !== null && !this.isStreamingPlaceholder(title);
    });
  }

  /**
   * Toggle expanded state
   */
  toggleExpanded(): void {
    this.isExpanded.update(v => !v);
  }

  /**
   * Expand to show all items
   */
  expand(): void {
    this.isExpanded.set(true);
  }

  /**
   * Collapse to show limited items
   */
  collapse(): void {
    this.isExpanded.set(false);
  }

  /**
   * Handle item click
   */
  onItemClick(item: CardItem, index: number): void {
    this.emitItemInteraction(item, {
      action: 'click',
      index
    });
  }

  /**
   * Handle item action (e.g., link click)
   */
  onItemAction(item: CardItem, action: string): void {
    this.emitItemInteraction(item, {
      action,
      url: item.url,
      linkText: item.linkText
    });
  }
}

// ============================================================================
// CHART SECTION
// ============================================================================

/**
 * Chart data interface
 */
export interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

/**
 * Chart configuration
 */
export interface ChartConfig {
  labels: string[];
  datasets: ChartDataset[];
  type: 'bar' | 'line' | 'pie' | 'doughnut';
}

/**
 * Abstract base for sections with data visualizations.
 *
 * Use this for:
 * - Chart Section
 * - Analytics sections with charts
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class ChartSectionComponent extends ChartSectionBaseComponent {
 *   static override readonly layoutConfig: SectionLayoutConfig = {
 *     preferredColumns: 2,
 *     minColumns: 1,
 *     maxColumns: 4
 *   };
 * }
 * ```
 */
@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export abstract class ChartSectionBaseComponent extends BaseSectionComponent {
  /**
   * Override in subclass to customize layout behavior
   */
  static readonly layoutConfig: SectionLayoutConfig = {
    ...DEFAULT_LAYOUT_CONFIG,
    preferredColumns: 2
  };

  /**
   * Whether the chart library is loaded
   */
  protected chartLibraryLoaded = signal(false);

  /**
   * Chart loading error
   */
  protected chartError = signal<string | null>(null);

  /**
   * Chart type (bar, line, pie, doughnut)
   */
  readonly chartType = computed(() =>
    this.section.chartType ?? 'bar'
  );

  /**
   * Processed chart configuration
   */
  readonly chartConfig = computed((): ChartConfig | null => {
    const chartData = this.section.chartData;
    if (!chartData) return null;

    return {
      type: this.chartType(),
      labels: chartData.labels ?? [],
      datasets: (chartData.datasets ?? []).map(ds => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.backgroundColor,
        borderColor: ds.borderColor,
        borderWidth: ds.borderWidth ?? 1
      }))
    };
  });

  /**
   * Whether the chart has valid data
   */
  readonly hasValidData = computed(() => {
    const config = this.chartConfig();
    return config !== null &&
           config.datasets.length > 0 &&
           config.datasets.some(ds => ds.data.length > 0);
  });

  /**
   * Total value across all datasets
   */
  readonly totalValue = computed(() => {
    const config = this.chartConfig();
    if (!config) return 0;

    return config.datasets.reduce((sum, ds) =>
      sum + ds.data.reduce((a, b) => a + b, 0), 0
    );
  });

  /**
   * Load the chart library dynamically
   */
  protected abstract loadChartLibrary(): Promise<void>;

  /**
   * Initialize the chart
   */
  protected abstract initializeChart(): void;

  /**
   * Update the chart with new data
   */
  protected abstract updateChart(): void;

  /**
   * Destroy the chart instance
   */
  protected abstract destroyChart(): void;
}

// ============================================================================
// MIXED CONTENT SECTION
// ============================================================================

/**
 * Abstract base for sections with both fields and items.
 *
 * Use this for:
 * - Event Section (event details + timeline items)
 * - Solutions Section (overview fields + solution items)
 * - Social Media Section (profile fields + posts)
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class EventSectionComponent extends MixedContentSectionComponent {
 *   static override readonly layoutConfig: SectionLayoutConfig = {
 *     preferredColumns: 1,
 *     minColumns: 1,
 *     maxColumns: 2
 *   };
 * }
 * ```
 */
@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export abstract class MixedContentSectionComponent extends BaseSectionComponent {
  /**
   * Override in subclass to customize layout behavior
   */
  static readonly layoutConfig: SectionLayoutConfig = DEFAULT_LAYOUT_CONFIG;

  /**
   * Fields to display
   */
  readonly displayFields = computed(() => this.getFilteredFields());

  /**
   * Items to display
   */
  readonly displayItems = computed(() => this.getFilteredItems());

  /**
   * Field count
   */
  readonly fieldCount = computed(() => this.displayFields().length);

  /**
   * Item count
   */
  readonly itemCount = computed(() => this.displayItems().length);

  /**
   * Whether section has any displayable content
   */
  readonly hasContent = computed(() =>
    this.fieldCount() > 0 || this.itemCount() > 0
  );

  /**
   * Whether section has both fields and items
   */
  readonly hasMixedContent = computed(() =>
    this.fieldCount() > 0 && this.itemCount() > 0
  );

  /**
   * Get filtered fields for display
   */
  protected getFilteredFields(): CardField[] {
    return this.getFields().filter(field => {
      const value = this.getFieldValue(field);
      return value !== undefined && value !== null && !this.isStreamingPlaceholder(value);
    });
  }

  /**
   * Get filtered items for display
   */
  protected getFilteredItems(): CardItem[] {
    return this.getItems().filter(item => {
      const title = item.title;
      return title !== undefined && title !== null && !this.isStreamingPlaceholder(title);
    });
  }

  /**
   * Handle field interaction
   */
  onFieldClick(field: CardField, index: number): void {
    this.emitFieldInteraction(field as CardField | CardItem, {
      action: 'click',
      index,
      contentType: 'field'
    });
  }

  /**
   * Handle item interaction
   */
  onItemClick(item: CardItem, index: number): void {
    this.emitItemInteraction(item as CardField | CardItem, {
      action: 'click',
      index,
      contentType: 'item'
    });
  }
}

// ============================================================================
// CONTACT/PROFILE SECTION
// ============================================================================

/**
 * Contact/Profile information interface
 */
export interface ContactInfo {
  name?: string;
  title?: string;
  role?: string;
  company?: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
  linkedIn?: string;
  twitter?: string;
}

/**
 * Abstract base for contact/profile sections.
 *
 * Use this for:
 * - Contact Card Section
 * - Profile sections
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class ContactCardSectionComponent extends ContactSectionBaseComponent {
 *   static override readonly layoutConfig: SectionLayoutConfig = {
 *     preferredColumns: 2,
 *     minColumns: 1,
 *     maxColumns: 2
 *   };
 * }
 * ```
 */
@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export abstract class ContactSectionBaseComponent extends FieldBasedSectionComponent {
  /**
   * Override in subclass to customize layout behavior
   */
  static override readonly layoutConfig: SectionLayoutConfig = {
    ...DEFAULT_LAYOUT_CONFIG,
    preferredColumns: 2,
    matchItemCount: true
  };

  /**
   * Extracted contact information
   */
  readonly contactInfo = computed((): ContactInfo => {
    const fields = this.getFields();
    const info: ContactInfo = {};

    for (const field of fields) {
      const label = (field.label ?? '').toLowerCase();
      const value = this.getFieldValue(field);

      if (typeof value !== 'string') continue;

      if (label.includes('name')) info.name = value;
      else if (label.includes('title') || label.includes('role')) info.title = value;
      else if (label.includes('company') || label.includes('organization')) info.company = value;
      else if (label.includes('email')) info.email = value;
      else if (label.includes('phone') || label.includes('tel')) info.phone = value;
      else if (label.includes('linkedin')) info.linkedIn = value;
      else if (label.includes('twitter')) info.twitter = value;
    }

    // Check for image URL in section metadata
    const sectionMeta = this.section.meta ?? {};
    if (typeof sectionMeta['imageUrl'] === 'string') {
      info.imageUrl = sectionMeta['imageUrl'];
    }

    return info;
  });

  /**
   * Get initials from name
   */
  readonly initials = computed(() => {
    const name = this.contactInfo().name;
    if (!name) return '';

    return name
      .split(' ')
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  /**
   * Handle email action
   */
  onEmailClick(): void {
    const email = this.contactInfo().email;
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  }

  /**
   * Handle phone action
   */
  onPhoneClick(): void {
    const phone = this.contactInfo().phone;
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }

  /**
   * Handle LinkedIn action
   */
  onLinkedInClick(): void {
    const linkedIn = this.contactInfo().linkedIn;
    if (linkedIn) {
      window.open(linkedIn, '_blank', 'noopener,noreferrer');
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  FieldBasedSectionComponent,
  ItemBasedSectionComponent,
  ChartSectionBaseComponent,
  MixedContentSectionComponent,
  ContactSectionBaseComponent
};



