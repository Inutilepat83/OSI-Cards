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
 * Displays data visualizations using Chart.js.
 * Supports: bar, line, pie, doughnut, area, radar charts.
 *
 * Note: Requires Chart.js to be installed.
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
  @ViewChild('chartCanvas', { static: false }) chartCanvas?: ElementRef<HTMLCanvasElement>;

  private chartInstance: any;
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
      if (!this.chartCanvas) {
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
   * Render chart using Chart.js (if available)
   */
  private async renderChart(): Promise<void> {
    // Prevent multiple simultaneous render calls
    if (this.isRendering) {
      return;
    }

    // Ensure canvas element exists
    if (!this.chartCanvas?.nativeElement) {
      console.warn('Chart canvas element not available');
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
      // Dynamic import of Chart.js
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      this.chartLibraryLoaded = true;
      this.chartError = null;

      // Ensure canvas is visible and has dimensions
      const canvas = this.chartCanvas.nativeElement;
      const canvasParent = canvas.parentElement;

      // Wait for container to have dimensions
      if (canvasParent) {
        const rect = canvasParent.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          // Use requestAnimationFrame for better timing
          this.isRendering = false;
          requestAnimationFrame(() => {
            setTimeout(() => this.renderChart(), 50);
          });
          return;
        }

        // Force canvas to match parent dimensions exactly
        canvas.width = rect.width;
        canvas.height = rect.height;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
      }

      // Check if canvas already has a Chart.js instance attached
      // This can happen if Chart.js was already initialized on this canvas
      const existingChart = Chart.getChart(canvas);
      if (existingChart) {
        existingChart.destroy();
      }

      // Destroy our tracked instance if it exists
      if (this.chartInstance) {
        try {
          this.chartInstance.destroy();
        } catch (error) {
          // Ignore errors during destruction
        }
        this.chartInstance = null;
      }

      // Check if data contains revenue/monetary values for currency formatting
      const isRevenueData = this.detectRevenueData(chartData);

      // Create chart instance
      this.chartInstance = new Chart(canvas, {
        type: chartType as any,
        data: chartData as any,
        options: this.getChartOptions(chartType, isRevenueData),
      });

      // Force chart resize and update to ensure it fills container
      setTimeout(() => {
        if (this.chartInstance) {
          this.chartInstance.resize();
          this.chartInstance.update('none');
        }
      }, 0);

      this.cdr.detectChanges();
    } catch (error) {
      this.chartLibraryLoaded = false;
      this.chartError = error instanceof Error ? error.message : 'Failed to load Chart.js library';
      console.error('Chart.js initialization error:', error);
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
    const isRevenueData = this.detectRevenueData(chartData);

    // Update chart data
    this.chartInstance.data = chartData as any;

    // Update options if needed
    const newOptions = this.getChartOptions(chartType, isRevenueData);
    this.chartInstance.options = newOptions;

    // Update chart
    this.chartInstance.update('none'); // 'none' mode for instant update without animation
  }

  /**
   * Detect if chart data contains revenue/monetary values
   */
  private detectRevenueData(chartData: any): boolean {
    if (!chartData?.datasets) return false;

    // Check if any dataset label contains revenue/money keywords
    const revenueKeywords = ['revenue', 'profit', 'cost', 'sales', 'income', '$', 'usd', 'eur'];
    return chartData.datasets.some((dataset: any) => {
      const label = (dataset.label || '').toLowerCase();
      return revenueKeywords.some((keyword) => label.includes(keyword));
    });
  }

  /**
   * Get chart options with enhanced configuration
   */
  private getChartOptions(chartType: string, isRevenueData: boolean): any {
    const baseOptions: any = {
      responsive: true,
      maintainAspectRatio: false, // Allow chart to fill container
      aspectRatio: 1, // Will be overridden by maintainAspectRatio: false
      animation: {
        duration: 500,
        easing: 'easeInOutQuart',
      },
      layout: {
        padding: {
          top: 2,
          bottom: 2,
          left: 2,
          right: 2,
        },
      },
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            boxWidth: 8,
            padding: 3,
            usePointStyle: true,
            font: {
              size: 9,
            },
          },
        },
        tooltip: {
          enabled: true,
          padding: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: {
            size: 11,
            weight: 'bold',
          },
          bodyFont: {
            size: 10,
          },
          cornerRadius: 4,
          displayColors: true,
          callbacks: {},
        },
      },
    };

    // Add currency formatting for revenue data
    if (isRevenueData) {
      baseOptions.plugins.tooltip.callbacks.label = (context: any) => {
        const label = context.dataset.label || '';
        const value = context.parsed.y ?? context.parsed;
        const formattedValue = this.formatCurrency(value);
        return `${label}: ${formattedValue}`;
      };
    }

    // Configure scales for cartesian charts (bar, line)
    if (chartType === 'bar' || chartType === 'line') {
      baseOptions.scales = {
        y: {
          beginAtZero: true,
          ticks: {
            callback: isRevenueData ? (value: any) => this.formatCurrency(value) : undefined,
            font: {
              size: 9,
            },
            padding: 0, // No padding to maximize chart area
            maxRotation: 0,
            autoSkip: true,
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false,
            lineWidth: 1,
          },
        },
        x: {
          ticks: {
            font: {
              size: 9,
            },
            padding: 0, // No padding to maximize chart area
            maxRotation: 0,
            autoSkip: true,
          },
          grid: {
            display: false,
          },
        },
      };
    }

    // Specific options for pie/doughnut charts
    if (chartType === 'pie' || chartType === 'doughnut') {
      baseOptions.plugins.tooltip.callbacks.label = (context: any) => {
        const label = context.label || '';
        const value = context.parsed;
        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
        const percentage = ((value / total) * 100).toFixed(1);
        const formattedValue = isRevenueData ? this.formatCurrency(value) : value;
        return `${label}: ${formattedValue} (${percentage}%)`;
      };
    }

    return baseOptions;
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
        this.chartInstance.destroy();
      } catch (error) {
        // Ignore errors during destruction (chart might already be destroyed)
        console.warn('Error destroying chart:', error);
      }
      this.chartInstance = null;
    }

    // Also check canvas directly for any attached Chart.js instance
    // This handles cases where Chart.js might have a reference we don't track
    if (this.chartCanvas?.nativeElement && this.chartLibraryLoaded) {
      try {
        // Use dynamic import to get Chart if available
        import('chart.js')
          .then((chartModule) => {
            if (chartModule.Chart) {
              const existingChart = chartModule.Chart.getChart(this.chartCanvas!.nativeElement);
              if (existingChart) {
                existingChart.destroy();
              }
            }
          })
          .catch(() => {
            // Chart.js might not be loaded, ignore
          });
      } catch (error) {
        // Ignore errors
      }
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
    // Use section.chartType directly instead of section.meta.chartType
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
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateChartLayoutPreferences(this.section, availableColumns);
  }
}
