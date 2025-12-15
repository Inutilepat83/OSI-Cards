import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { CardField, CardSection } from '../../../models';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { TrendDirection } from '../../../types';
import { trackByField } from '../../../utils/track-by.util';
import { EmptyStateComponent, SectionHeaderComponent, TrendIndicatorComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

/**
 * Info Section Component
 *
 * Displays key-value pairs in a clean, scannable format.
 * Perfect for structured data, metadata, and profile information.
 */
@Component({
  selector: 'lib-info-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, TrendIndicatorComponent],
  templateUrl: './info-section.component.html',
  styleUrl: './info-section.scss',
})
export class InfoSectionComponent extends BaseSectionComponent implements OnInit {
  /**
   * TrackBy function for fields
   */
  readonly trackByField = trackByField;

  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('info', (section: CardSection, availableColumns: number) => {
      return this.calculateInfoLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for info section based on section data.
   * This method can be called statically via the service.
   */
  private calculateInfoLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const fields = section.fields ?? [];
    const fieldCount = fields.length;
    const descriptionLength = section.description?.length ?? 0;

    // Calculate preferred columns based on content:
    // 1-3 fields = 1 column (compact)
    // 4-6 fields = 2 columns (comfortable)
    // 7+ fields = 3 columns (spacious)
    let preferredColumns: 1 | 2 | 3 | 4 = 1;
    if (fieldCount >= 4 && fieldCount <= 6) {
      preferredColumns = 2;
    } else if (fieldCount >= 7) {
      preferredColumns = 3;
    }

    // Adjust for description length
    if (descriptionLength > 200 && preferredColumns < 2) {
      preferredColumns = 2;
    }
    if (descriptionLength > 400 && preferredColumns < 3) {
      preferredColumns = 3;
    }

    // Respect explicit preferences from section data
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    // Constrain to available columns
    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 1) as 1 | 2 | 3 | 4,
      maxColumns: Math.min((section.maxColumns ?? 3) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true, // Info sections can shrink to 1 column to fill grid
      shrinkPriority: 20, // Higher priority for shrinking (promotes side-by-side placement)
      expandOnContent: {
        fieldCount: 7, // Expand to 3 columns at 7+ fields
        descriptionLength: 200, // Expand with long descriptions
      },
    };
  }

  /**
   * Get layout preferences for info section.
   * Uses the registered preference function via service, or calculates directly.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    // Try to get from service first (if registered)
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }

    // Fallback to direct calculation
    return this.calculateInfoLayoutPreferences(this.section, availableColumns);
  }

  /**
   * Get trend class (deprecated - kept for backward compatibility)
   */
  getTrendClass(trend?: string): string {
    if (!trend) return '';
    return `info-trend--${trend}`;
  }

  /**
   * Format change value
   */
  formatChange(change?: number): string {
    if (change === undefined || change === null) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  }

  /**
   * Map trend string to TrendDirection type
   */
  getTrendDirection(trend?: string): TrendDirection {
    if (!trend) return 'neutral';
    const trendLower = trend.toLowerCase();

    if (trendLower === 'up' || trendLower === 'increase' || trendLower === 'rising') return 'up';
    if (trendLower === 'down' || trendLower === 'decrease' || trendLower === 'falling')
      return 'down';
    if (trendLower === 'stable' || trendLower === 'flat' || trendLower === 'unchanged')
      return 'stable';

    return 'neutral';
  }

  /**
   * Check if a field is used in the header (should be excluded from KPI/facts grids)
   */
  private isHeaderField(field: CardField): boolean {
    const label = (field.label || field.name || '').toLowerCase();
    const headerKeywords = [
      'company',
      'name',
      'logo',
      'avatar',
      'website',
      'url',
      'ticker',
      'stock',
      'symbol',
    ];
    return headerKeywords.some((keyword) => label.includes(keyword)) || !!field.link;
  }

  /**
   * Get primary KPIs (2-4 most important metrics)
   * Prioritizes fields with trends, numeric values, or KPI-related labels
   * Excludes header fields (company name, logo, website, stock symbol)
   */
  get primaryKPIs(): CardField[] {
    if (!this.section.fields?.length) return [];

    const kpiKeywords = [
      'employee',
      'arr',
      'revenue',
      'funding',
      'stage',
      'valuation',
      'growth',
      'mrr',
      'customers',
      'users',
      'market cap',
      'headcount',
      'employees',
      'funding stage',
      'annual revenue',
      'monthly recurring',
    ];

    const fields = [...this.section.fields];
    const kpiFields: CardField[] = [];

    // Separate KPIs from other fields (excluding header fields)
    fields.forEach((field) => {
      if (this.isHeaderField(field)) return; // Skip header fields

      const label = (field.label || field.name || '').toLowerCase();
      const hasTrend = !!field.trend;
      const hasChange = field.change !== undefined && field.change !== null;
      const hasNumericValue =
        typeof field.value === 'number' ||
        (typeof field.value === 'string' &&
          !isNaN(Number(field.value)) &&
          field.value.trim() !== '');
      const isKPIKeyword = kpiKeywords.some((keyword) => label.includes(keyword));

      // Prioritize: fields with trends > fields with numeric values and KPI keywords > KPI keywords only
      if (hasTrend || hasChange || (hasNumericValue && isKPIKeyword) || isKPIKeyword) {
        kpiFields.push(field);
      }
    });

    // Sort KPIs: prioritize those with trends, then those with numeric values
    const sortedKPIs = kpiFields.sort((a, b) => {
      const aHasTrend = !!a.trend || a.change !== undefined ? 2 : 0;
      const bHasTrend = !!b.trend || b.change !== undefined ? 2 : 0;
      const aIsNumeric = typeof a.value === 'number' || !isNaN(Number(a.value)) ? 1 : 0;
      const bIsNumeric = typeof b.value === 'number' || !isNaN(Number(b.value)) ? 1 : 0;
      return bHasTrend + bIsNumeric - (aHasTrend + aIsNumeric);
    });

    // Return top 2-4 KPIs
    return sortedKPIs.slice(0, 4);
  }

  /**
   * Get secondary fields (everything else, excluding header fields and KPIs)
   */
  get secondaryFields(): CardField[] {
    if (!this.section.fields?.length) return [];
    const primaryKPIs = this.primaryKPIs;
    const kpiIds = new Set(
      primaryKPIs.map((kpi) => kpi.id || kpi.label || kpi.name || JSON.stringify(kpi))
    );
    return this.section.fields.filter(
      (field) =>
        !this.isHeaderField(field) &&
        !kpiIds.has(field.id || field.label || field.name || JSON.stringify(field))
    );
  }

  /**
   * Get company name from fields
   */
  getCompanyName(): string {
    const nameField = this.section.fields?.find(
      (f) =>
        f.label?.toLowerCase().includes('company') ||
        f.label?.toLowerCase().includes('name') ||
        f.name?.toLowerCase().includes('company')
    );
    return nameField?.value?.toString() || this.section.title || '';
  }

  /**
   * Get company logo/avatar from fields
   */
  getCompanyLogo(): string | null {
    const logoField = this.section.fields?.find(
      (f) =>
        f.label?.toLowerCase().includes('logo') ||
        f.label?.toLowerCase().includes('avatar') ||
        f.icon
    );
    return logoField?.icon || logoField?.value?.toString() || null;
  }

  /**
   * Get tagline/description from section or fields
   */
  getTagline(): string | null {
    return this.section.description || this.section.subtitle || null;
  }

  /**
   * Track tagline expansion state
   */
  isTaglineExpanded: boolean = false;

  /**
   * Toggle tagline expansion
   */
  toggleTaglineExpanded(): void {
    this.isTaglineExpanded = !this.isTaglineExpanded;
  }

  /**
   * Check if tagline needs "Show more" button
   */
  shouldShowTaglineExpandButton(): boolean {
    const tagline = this.getTagline();
    return !!(tagline && tagline.length > 100);
  }

  /**
   * Get website URL from fields
   */
  getWebsiteUrl(): string | null {
    const websiteField = this.section.fields?.find(
      (f) =>
        f.label?.toLowerCase().includes('website') ||
        f.label?.toLowerCase().includes('url') ||
        f.link
    );
    return websiteField?.link || websiteField?.value?.toString() || null;
  }

  /**
   * Get stock symbol from fields
   */
  getStockSymbol(): string | null {
    const tickerField = this.section.fields?.find(
      (f) =>
        f.label?.toLowerCase().includes('ticker') ||
        f.label?.toLowerCase().includes('stock') ||
        f.label?.toLowerCase().includes('symbol')
    );
    return tickerField?.value?.toString() || null;
  }

  /**
   * Check if header info is available
   */
  hasHeaderInfo(): boolean {
    return !!(this.getCompanyName() || this.getCompanyLogo() || this.getTagline());
  }

  /**
   * Check if header actions are available
   */
  hasHeaderActions(): boolean {
    return !!(this.getWebsiteUrl() || this.getStockSymbol());
  }

  /**
   * Format KPI value for display
   */
  formatKPIValue(field: CardField): string {
    if (field.value === null || field.value === undefined) return '—';

    if (field.format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(field.value));
    }

    if (field.format === 'percentage') {
      return `${Number(field.value).toFixed(1)}%`;
    }

    if (field.format === 'number') {
      return new Intl.NumberFormat('en-US').format(Number(field.value));
    }

    return field.value.toString();
  }

  /**
   * Open website URL
   */
  openWebsite(url: string): void {
    if (url && !url.startsWith('http')) {
      url = `https://${url}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  /**
   * Loading state (can be set externally or based on data availability)
   */
  isLoading = false;

  /**
   * UI state: expanded/collapsed
   */
  isExpanded = false;

  /**
   * Toggle expanded state
   */
  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  /**
   * Get collapsed facts (first 4 fields by default, can be adjusted via CSS)
   */
  get collapsedFacts(): CardField[] {
    const fields = this.secondaryFields;
    // Show 4 fields by default (works well on both mobile and desktop)
    // Can be adjusted via responsive breakpoints if needed
    const maxCollapsed = 4;
    return fields.slice(0, maxCollapsed);
  }

  /**
   * Get overflow facts (fields beyond collapsed view)
   */
  get overflowFacts(): CardField[] {
    const fields = this.secondaryFields;
    const maxCollapsed = 4;
    return fields.slice(maxCollapsed);
  }

  /**
   * Check if a field should be rendered as chips (multi-value field)
   */
  isChipField(field: CardField): boolean {
    const label = (field.label || field.name || '').toLowerCase();
    const chipKeywords = [
      'tech stack',
      'tags',
      'stack',
      'integrations',
      'offices',
      'global offices',
      'locations',
    ];
    return chipKeywords.some((keyword) => label.includes(keyword));
  }

  /**
   * Parse value to chips array
   * Splits by comma or semicolon and trims
   */
  parseToChips(value: string | number | boolean | null | undefined): string[] {
    if (value === null || value === undefined) return [];
    // Convert boolean to string representation
    if (typeof value === 'boolean') {
      return [value.toString()];
    }
    const str = value.toString().trim();
    if (!str) return [];
    // Split by comma or semicolon
    return str
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  /**
   * Get chips for collapsed view (max 3 chips + "+N" indicator)
   */
  getCollapsedChips(field: CardField): { chips: string[]; overflowCount: number } {
    const value: string | number | boolean | null | undefined = field.value;
    const allChips = this.parseToChips(value);
    const maxChips = 3;
    const chips = allChips.slice(0, maxChips);
    const overflowCount = Math.max(0, allChips.length - maxChips);
    return { chips, overflowCount };
  }

  /**
   * Get all chips for expanded view
   */
  getAllChips(field: CardField): string[] {
    const value: string | number | boolean | null | undefined = field.value;
    return this.parseToChips(value);
  }
}
