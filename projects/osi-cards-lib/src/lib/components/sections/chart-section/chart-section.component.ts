/// <reference path="../../../types/frappe-charts.d.ts" />
import type { default as Chart } from 'frappe-charts';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CardSection } from '../../../models';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

/**
 * Chart Section Component
 *
 * Displays data visualizations using Frappe Charts.
 * Supports: bar, line, pie, percentage (doughnut), area charts.
 *
 * Note: Requires frappe-charts to be installed.
 */
@Component({
  selector: 'lib-chart-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './chart-section.component.html',
  styleUrl: './chart-section.scss',
})
export class ChartSectionComponent
  extends BaseSectionComponent
  implements AfterViewInit, OnDestroy, OnInit, OnChanges
{
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('chart', (section: CardSection, availableColumns: number) => {
      return this.calculateChartLayoutPreferences(section, availableColumns);
    });
  }

  @ViewChild('chartContainer', { static: false }) chartContainer?: ElementRef<HTMLDivElement>;

  private chartInstance: Awaited<ReturnType<typeof import('frappe-charts')>>['default'] | null = null;
  protected chartLibraryLoaded = false;
  protected chartError: string | null = null;
  private previousChartType: string | undefined;
  private previousChartDataHash: string | undefined;
  private isRendering = false;

  ngAfterViewInit(): void {
    // Use setTimeout to ensure ViewChild is fully initialized
    setTimeout(() => {
      this.renderChart();
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  override ngOnChanges(changes: SimpleChanges): void {
    // Call parent implementation for animation state management
    super.ngOnChanges(changes);

    if (changes['section']) {
      const currentChartType = this.section.chartType || 'bar';
      const currentDataHash = JSON.stringify(this.section.chartData);

      // Wait for ViewChild to be available if not already
      if (!this.chartContainer) {
        // If view isn't initialized yet, ngAfterViewInit will handle rendering
        this.previousChartType = currentChartType;
        this.previousChartDataHash = currentDataHash;
        return;
      }

      // If chart type changed, destroy and recreate
      if (this.previousChartType !== undefined && this.previousChartType !== currentChartType) {
        this.destroyChart();
        setTimeout(() => {
          this.renderChart();
        }, 0);
      }
      // If data changed but type is same, update existing chart
      else if (this.chartInstance && this.previousChartDataHash !== currentDataHash) {
        this.updateChart();
      }
      // Initial render case
      else if (!this.chartInstance && this.section.chartData) {
        setTimeout(() => {
          this.renderChart();
        }, 0);
      }

      this.previousChartType = currentChartType;
      this.previousChartDataHash = currentDataHash;
    }
  }

  /**
   * Render chart using Frappe Charts (if available)
   */
  private async renderChart(): Promise<void> {
    // Prevent multiple simultaneous render calls
    if (this.isRendering) {
      return;
    }

    // Ensure container element exists
    if (!this.chartContainer?.nativeElement) {
      console.warn('Chart container element not available');
      return;
    }

    const chartData = this.section.chartData;
    const chartType = this.section.chartType || 'bar';

    if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
      this.chartError = 'No chart data available';
      this.cdr.detectChanges();
      return;
    }

    this.isRendering = true;

    try {
      // Dynamic import of Frappe Charts

      const Chart = (await import('frappe-charts')).default;
      this.chartLibraryLoaded = true;
      this.chartError = null;

      // Ensure container is visible and has dimensions
      const container = this.chartContainer.nativeElement;
      const containerParent = container.parentElement;

      // Wait for container to have dimensions
      if (containerParent) {
        const rect = containerParent.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          // Use requestAnimationFrame for better timing
          this.isRendering = false;
          requestAnimationFrame(() => {
            setTimeout(() => this.renderChart(), 50);
          });
          return;
        }
      }

      // Destroy existing chart if it exists
      if (this.chartInstance) {
        try {
          // Frappe Charts doesn't have a destroy method, just clear the container
          container.innerHTML = '';
        } catch {
          // Ignore errors during destruction
        }
        this.chartInstance = null;
      }

      // Check if data contains revenue/monetary values for currency formatting
      const isRevenueData = this.detectRevenueData(chartData);

      // Convert Chart.js format to Frappe Charts format
      const frappeData = this.convertToFrappeFormat(chartData, chartType);

      // Map chart types: bar -> bar, line -> line, pie -> pie, doughnut -> percentage
      const frappeChartType = this.mapChartType(chartType);

      // Create chart instance with compact sizing
      this.chartInstance = new Chart(container, {
        data: frappeData,
        type: frappeChartType,
        height: 140, // Fixed compact height for chart area
        colors: this.extractColors(chartData),
        axisOptions: {
          xIsSeries: chartType === 'line' || (chartType as string) === 'area', // Line/area charts use series mode
        },
        tooltipOptions: {
          formatTooltipX: (d: unknown) => String(d),
          formatTooltipY: (d: unknown) => {
            return isRevenueData ? this.formatCurrency(d as number) : String(d);
          },
        },
        lineOptions: {
          dotSize: 3,
          hideDots: (chartType as string) === 'area', // Hide dots for area charts
        },
        barOptions: {
          spaceRatio: 0.3, // Compact bar spacing
        },
      });

      this.cdr.detectChanges();
    } catch (error) {
      this.chartLibraryLoaded = false;
      this.chartError =
        error instanceof Error ? error.message : 'Failed to load Frappe Charts library';
      console.error('Frappe Charts initialization error:', error);
      this.cdr.detectChanges();
    } finally {
      this.isRendering = false;
    }
  }

  /**
   * Update existing chart with new data
   */
  private updateChart(): void {
    if (!this.chartInstance || !this.section.chartData) {
      return;
    }

    const chartData = this.section.chartData;
    const chartType = this.section.chartType || 'bar';

    // Convert Chart.js format to Frappe Charts format
    const frappeData = this.convertToFrappeFormat(chartData, chartType);

    // Update chart data
    this.chartInstance.update({
      data: frappeData,
      type: this.mapChartType(this.section.chartType || 'bar'),
    });
  }

  /**
   * Convert Chart.js data format to Frappe Charts format
   */
  private convertToFrappeFormat(
    chartData: {
      labels?: string[];
      datasets?: {
        label?: string;
        data: (number | null)[];
        backgroundColor?: string | string[];
      }[];
    },
    chartType: string
  ): {
    labels: string[];
    datasets: { name?: string; values: number[] }[];
  } {
    if (!chartData.datasets || chartData.datasets.length === 0) {
      return {
        labels: chartData.labels || [],
        datasets: [],
      };
    }

    if (chartType === 'pie' || chartType === 'doughnut') {
      // Pie/percentage charts: simple array of values
      const firstDataset = chartData.datasets[0];
      if (!firstDataset) {
        return {
          labels: chartData.labels || [],
          datasets: [],
        };
      }
      // Filter out null values and convert to numbers
      const values = (firstDataset.data || []).filter((v): v is number => v !== null);
      return {
        labels: chartData.labels || [],
        datasets: [
          {
            values,
          },
        ],
      };
    } else {
      // Bar/line/area charts: labels + datasets
      const datasets = chartData.datasets.map((dataset) => ({
        name: dataset.label || '',
        // Filter out null values and convert to numbers
        values: (dataset.data || []).filter((v): v is number => v !== null),
      }));

      return {
        labels: chartData.labels || [],
        datasets,
      };
    }
  }

  /**
   * Map Chart.js chart types to Frappe Charts types
   */
  private mapChartType(chartType: string): string {
    const typeMap: Record<string, string> = {
      bar: 'bar',
      line: 'line',
      area: 'line', // Frappe uses line with area fill
      pie: 'pie',
      doughnut: 'percentage',
      radar: 'line', // Fallback to line for unsupported types
    };
    return typeMap[chartType] || 'bar';
  }

  /**
   * Extract colors from Chart.js format
   */
  private extractColors(chartData: {
    datasets?: {
      backgroundColor?: string | string[];
    }[];
  }): string[] | undefined {
    const colors: string[] = [];
    chartData.datasets?.forEach((dataset) => {
      if (Array.isArray(dataset.backgroundColor)) {
        colors.push(...dataset.backgroundColor);
      } else if (dataset.backgroundColor) {
        colors.push(dataset.backgroundColor);
      }
    });
    return colors.length > 0 ? colors : undefined;
  }

  /**
   * Detect if chart data contains revenue/monetary values
   */
  private detectRevenueData(chartData: {
    datasets?: {
      label?: string;
    }[];
  }): boolean {
    if (!chartData?.datasets) return false;

    // Check if any dataset label contains revenue/money keywords
    const revenueKeywords = ['revenue', 'profit', 'cost', 'sales', 'income', '$', 'usd', 'eur'];
    return chartData.datasets.some((dataset) => {
      const label = (dataset.label || '').toLowerCase();
      return revenueKeywords.some((keyword) => label.includes(keyword));
    });
  }

  /**
   * Format value as currency
   */
  private formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  }

  /**
   * Destroy chart instance
   */
  private destroyChart(): void {
    if (this.chartInstance) {
      try {
        // Frappe Charts doesn't have a destroy method, just clear the container
        if (this.chartContainer?.nativeElement) {
          this.chartContainer.nativeElement.innerHTML = '';
        }
      } catch (error) {
        // Ignore errors during destruction
        console.warn('Error destroying chart:', error);
      }
      this.chartInstance = null;
    }
  }

  /**
   * Calculate layout preferences for chart section based on content.
   * Chart sections: 2 cols default, can shrink to 1, expands to 3-4 for wide charts
   */
  private calculateChartLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    // Chart sections prefer 2 columns for optimal viewing
    // Can expand to 3-4 for wide charts, shrink to 1 for compact layouts
    let preferredColumns: 1 | 2 | 3 | 4 = 2;

    // Check if chart type suggests wider layout
    const chartType = section.chartType;
    const isWideChart = chartType === 'line' || chartType === 'bar';

    if (isWideChart && availableColumns >= 3) {
      preferredColumns = 3;
    }

    // Respect explicit preferences
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 1) as 1 | 2 | 3 | 4,
      maxColumns: Math.min((section.maxColumns ?? 4) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 25, // Higher priority for shrinking (promotes side-by-side placement)
      expandOnContent: {
        // Charts can expand based on data complexity
      },
    };
  }

  /**
   * Get layout preferences for chart section.
   */
  override getLayoutPreferences(availableColumns = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateChartLayoutPreferences(this.section, availableColumns);
  }
}
