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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private chartInstance: any = null;
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
      // Handle different export patterns (default export, named export, or direct export)
      const frappeChartsModule = await import('frappe-charts');

      // Handle different module export patterns (CJS/ESM interop)
      // Frappe Charts exports Chart as default, but build tools may wrap it differently
      let Chart: unknown = null;

      const module = frappeChartsModule as {
        default?: unknown;
        Chart?: unknown;
        [key: string]: unknown;
      };

      // Pattern 1: Direct default export (most common for ESM)
      if (module.default) {
        if (typeof module.default === 'function') {
          Chart = module.default;
        } else if (
          typeof module.default === 'object' &&
          module.default !== null &&
          'Chart' in module.default &&
          typeof (module.default as { Chart?: unknown }).Chart === 'function'
        ) {
          // Default is an object containing Chart
          Chart = (module.default as { Chart: unknown }).Chart;
        } else if (
          typeof module.default === 'object' &&
          module.default !== null &&
          'default' in module.default &&
          typeof (module.default as { default?: unknown }).default === 'function'
        ) {
          // Nested default (some build tools)
          Chart = (module.default as { default: unknown }).default;
        }
      }

      // Pattern 2: Named export Chart (if default didn't work)
      if (!Chart && module.Chart && typeof module.Chart === 'function') {
        Chart = module.Chart;
      }

      // Pattern 3: Module itself is the Chart (unlikely but possible)
      if (!Chart && typeof frappeChartsModule === 'function') {
        Chart = frappeChartsModule;
      }

      // Validate that Chart is a constructor
      if (!Chart || typeof Chart !== 'function') {
        console.error('Frappe Charts module structure:', {
          module: frappeChartsModule,
          defaultType: typeof frappeChartsModule.default,
          hasChart: 'Chart' in frappeChartsModule,
          moduleKeys: Object.keys(frappeChartsModule),
        });
        throw new Error(
          'Chart is not a constructor. Frappe Charts library may not be loaded correctly. ' +
            'Please ensure frappe-charts is installed: npm install frappe-charts'
        );
      }

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

      // Ensure Chart is a constructor function before instantiating
      if (typeof Chart !== 'function' || !Chart.prototype) {
        throw new Error(
          'Chart is not a valid constructor. Received: ' +
            typeof Chart +
            '. Please ensure frappe-charts is properly installed.'
        );
      }

      // Create chart instance with compact sizing
      // Type assertion needed because Chart comes from dynamic import
      const ChartConstructor = Chart as new (
        container: HTMLElement,
        config: {
          data: unknown;
          type: string;
          height?: number;
          colors?: string[];
          axisOptions?: { xIsSeries?: boolean };
          tooltipOptions?: {
            formatTooltipX?: (d: unknown) => string;
            formatTooltipY?: (d: unknown) => string;
          };
          lineOptions?: { dotSize?: number; hideDots?: boolean };
          barOptions?: { spaceRatio?: number };
        }
      ) => unknown;

      this.chartInstance = new ChartConstructor(container, {
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

      // Fix Y-axis labels after chart is rendered
      // Use setTimeout to ensure chart is fully rendered
      setTimeout(() => {
        this.fixYAxisLabels(container);
        this.fixLegendLabels(container);
      }, 100);

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
    if (!this.chartInstance || !this.section.chartData || !this.chartContainer?.nativeElement) {
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

    // Fix Y-axis labels and legend after update
    setTimeout(() => {
      this.fixYAxisLabels(this.chartContainer!.nativeElement);
      this.fixLegendLabels(this.chartContainer!.nativeElement);
    }, 100);
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
   * Fix Y-axis label rendering issues
   */
  private fixYAxisLabels(container: HTMLElement): void {
    // Find all SVG text elements in the chart
    const allTexts = container.querySelectorAll('svg text, .frappe-chart text');

    allTexts.forEach((textEl) => {
      const element = textEl as SVGTextElement;
      const textContent = element.textContent?.trim() || '';

      // Check if this is likely a Y-axis label
      // Y-axis labels are typically numeric and positioned on the left side
      const isNumeric = /^[\d.,]+$/.test(textContent);
      const x = parseFloat(element.getAttribute('x') || '0');
      const y = parseFloat(element.getAttribute('y') || '0');

      // Y-axis labels are typically on the left side (x < 50) and have numeric content
      // or are part of the Y-axis structure
      const isYAxisLabel =
        (isNumeric && x < 100 && y > 0 && y < 200) || // Position-based detection
        element.getAttribute('class')?.includes('y-axis') ||
        element.closest('.y-axis, .axis-y, [class*="y-axis"]') !== null;

      if (isYAxisLabel) {
        // Ensure horizontal text orientation
        element.setAttribute('writing-mode', 'horizontal-tb');
        element.setAttribute('text-orientation', 'mixed');
        element.style.writingMode = 'horizontal-tb';
        element.style.textOrientation = 'mixed';
        element.style.transform = 'none';
        element.style.whiteSpace = 'nowrap';
        element.style.textAnchor = 'end';

        // Remove any rotation transforms
        const transform = element.getAttribute('transform') || '';
        if (transform.includes('rotate')) {
          element.setAttribute('transform', transform.replace(/rotate\([^)]*\)/g, '').trim());
        }
      }
    });
  }

  /**
   * Fix legend label truncation
   */
  private fixLegendLabels(container: HTMLElement): void {
    // Find all legend-related elements (both SVG and HTML)
    const legendContainers = container.querySelectorAll(
      '.frappe-chart .legend, .legend-item, [class*="legend"], .chart-legend'
    );

    legendContainers.forEach((containerEl) => {
      // Fix SVG text elements in legend
      const svgTexts = containerEl.querySelectorAll('text');
      svgTexts.forEach((textEl) => {
        const element = textEl as SVGTextElement;
        element.style.whiteSpace = 'nowrap';
        element.style.overflow = 'visible';
        element.style.textOverflow = 'clip';
        // Ensure text is not clipped
        if (element.getAttribute('clip-path')) {
          element.removeAttribute('clip-path');
        }
      });

      // Fix HTML text elements in legend
      const htmlTexts = containerEl.querySelectorAll('span, div, label');
      htmlTexts.forEach((textEl) => {
        const element = textEl as HTMLElement;
        element.style.whiteSpace = 'nowrap';
        element.style.overflow = 'visible';
        element.style.textOverflow = 'clip';
        element.style.maxWidth = 'none';
      });
    });

    // Also fix any text elements that might be part of legend structure
    const allLegendTexts = container.querySelectorAll(
      '.frappe-chart text, [class*="legend"] text, [class*="legend"] span, [class*="legend"] div'
    );

    allLegendTexts.forEach((textEl) => {
      const element = textEl as SVGTextElement | HTMLElement;
      if (element instanceof SVGTextElement) {
        element.style.whiteSpace = 'nowrap';
        element.style.overflow = 'visible';
        element.style.textOverflow = 'clip';
      } else if (element instanceof HTMLElement) {
        element.style.whiteSpace = 'nowrap';
        element.style.overflow = 'visible';
        element.style.textOverflow = 'clip';
        element.style.maxWidth = 'none';
      }
    });
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
