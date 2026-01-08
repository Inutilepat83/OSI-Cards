import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
// @ts-ignore - chart.js may not be installed yet, but it's in optionalDependencies
import type { ChartData, ChartOptions, ChartType } from 'chart.js';
// @ts-ignore - ng2-charts may not be installed yet, but it's in dependencies
import { BaseChartDirective } from 'ng2-charts';
import { CardSection } from '../../../models';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { ChartSectionBaseComponent, ChartConfig } from '../abstract-section-bases';

/**
 * Chart Section Component
 *
 * Displays data visualizations using Chart.js library.
 * Supports bar, line, pie, and doughnut chart types.
 *
 * Note: Requires Chart.js library to be installed.
 */
@Component({
  selector: 'lib-chart-section',
  standalone: true,
  // @ts-ignore - BaseChartDirective may not be available until npm install
  imports: [CommonModule, BaseChartDirective, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './chart-section.component.html',
  styleUrl: './chart-section.scss',
})
export class ChartSectionComponent
  extends ChartSectionBaseComponent
  implements AfterViewInit, OnDestroy, OnInit
{
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  @ViewChild(BaseChartDirective, { static: false }) chart?: BaseChartDirective;

  chartInitFailed = false;
  chartLoading = true;

  // Chart.js configuration
  chartData: ChartData<'bar' | 'line' | 'pie' | 'doughnut'> = {
    labels: [],
    datasets: [],
  };

  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
    scales: {
      x: {
        ticks: {
          padding: 4,
        },
        border: {
          display: false,
        },
      },
      y: {
        ticks: {
          padding: 4,
        },
        border: {
          display: false,
        },
      },
    },
  };

  // Chart.js chart type (different from base class computed chartType)
  chartJsType: ChartType = 'bar';

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('chart', (section: CardSection, availableColumns: number) => {
      return this.calculateChartLayoutPreferences(section, availableColumns);
    });

    // Watch for chart config changes and update chart
    effect(() => {
      const config = this.chartConfig();
      if (config && this.chartLibraryLoaded()) {
        this.updateChartData(config);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initializeChart();
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  /**
   * Load Chart.js library dynamically
   */
  protected override async loadChartLibrary(): Promise<void> {
    try {
      // Chart.js is loaded via ng2-charts, but we need to ensure it's available
      // Dynamic import of chart.js to ensure it's loaded
      // @ts-ignore - chart.js may not be installed yet
      await import('chart.js/auto');
      this.chartLibraryLoaded.set(true);
      this.chartError.set(null);
    } catch (error) {
      this.chartLibraryLoaded.set(false);
      this.chartError.set(
        error instanceof Error ? error.message : 'Failed to load Chart.js library'
      );
      this.chartInitFailed = true;
      this.chartLoading = false;
      console.warn('[ChartSection] Chart.js not available', error);
      throw error;
    }
  }

  /**
   * Initialize the chart
   */
  protected override async initializeChart(): Promise<void> {
    const config = this.chartConfig();
    if (!config || !this.hasValidData()) {
      this.chartLoading = false;
      this.chartInitFailed = true;
      return;
    }

    try {
      await this.loadChartLibrary();
      // Wait for next tick to ensure ViewChild is initialized
      await Promise.resolve();
      this.updateChartData(config);
      this.chartLoading = false;
      this.chartInitFailed = false;
      this.cdr.markForCheck();

      // Ensure chart renders after view init
      setTimeout(() => {
        if (this.chart && this.chart.chart) {
          this.chart.update();
        }
      }, 0);
    } catch (error) {
      this.chartInitFailed = true;
      this.chartLoading = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Update chart data from ChartConfig
   */
  private updateChartData(config: ChartConfig): void {
    if (!config || config.datasets.length === 0) {
      return;
    }

    // Map ChartConfig to Chart.js format
    this.chartJsType = config.type as ChartType;
    this.chartData = {
      labels: config.labels,
      datasets: config.datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.backgroundColor,
        borderColor: ds.borderColor,
        borderWidth: ds.borderWidth ?? 1,
      })),
    };

    // Update chart if it exists and is ready
    if (this.chart && this.chart.chart) {
      this.chart.update();
    }

    this.cdr.markForCheck();
  }

  /**
   * Update the chart with new data
   */
  protected override updateChart(): void {
    const config = this.chartConfig();
    if (config && this.chartLibraryLoaded()) {
      this.updateChartData(config);
    }
  }

  /**
   * Destroy the chart instance
   */
  protected override destroyChart(): void {
    if (this.chart?.chart) {
      // BaseChartDirective has a chart property that contains the Chart.js instance
      this.chart.chart.destroy();
    }
    this.chart = undefined;
    this.chartLibraryLoaded.set(false);
    this.chartError.set(null);
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

    // Charts benefit from wider layouts when space is available
    if (availableColumns >= 3) {
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
        // Charts can expand based on dataset count
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
