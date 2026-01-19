import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
  inject,
  isDevMode,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
// @ts-ignore - chart.js may not be installed yet, but it's in optionalDependencies
import type { ChartData, ChartOptions, ChartType } from 'chart.js';
// @ts-ignore - ng2-charts may not be installed yet, but it's in dependencies
import { BaseChartDirective } from 'ng2-charts';
import { CardSection } from '@osi-cards/models';
import { SectionLayoutPreferenceService } from '@osi-cards/services';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
// CRITICAL FIX: Import ChartSectionBaseComponent directly from source to avoid barrel export resolution issues in production builds
import { ChartSectionBaseComponent, ChartConfig } from '../abstract-section-bases';

// #region agent log
if (
  typeof window !== 'undefined' &&
  localStorage.getItem('__DISABLE_DEBUG_LOGGING') !== 'true' &&
  !(window as any).__DISABLE_DEBUG_LOGGING
) {
  fetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'chart-section.component.ts:22',
      message: 'Module evaluation START - chart-section.component.ts',
      data: { timestamp: Date.now(), moduleId: 'chart-section' },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'C',
    }),
  }).catch(() => {});
}
// #endregion

// #region agent log
if (
  typeof window !== 'undefined' &&
  localStorage.getItem('__DISABLE_DEBUG_LOGGING') !== 'true' &&
  !(window as any).__DISABLE_DEBUG_LOGGING
) {
  fetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'chart-section.component.ts:23',
      message: 'Import ChartSectionBaseComponent from barrel - checking value',
      data: {
        imported: typeof ChartSectionBaseComponent !== 'undefined',
        isConstructor: typeof ChartSectionBaseComponent === 'function',
        isUndefined: typeof ChartSectionBaseComponent === 'undefined',
        isNull: ChartSectionBaseComponent === null,
        name: ChartSectionBaseComponent?.name || 'undefined',
        baseClassAvailable: typeof BaseSectionComponent !== 'undefined',
        baseClassIsFunction: typeof BaseSectionComponent === 'function',
        baseClassName: BaseSectionComponent?.name || 'undefined',
        globalAvailable:
          typeof window !== 'undefined' &&
          typeof (window as any).__BaseSectionComponent !== 'undefined',
        globalForcedAvailable:
          typeof window !== 'undefined' &&
          typeof (window as any).__BaseSectionComponentForced !== 'undefined',
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run2',
      hypothesisId: 'B',
    }),
  }).catch(() => {});
}
// #endregion

/**
 * Chart Section Component
 *
 * Displays data visualizations using Chart.js library.
 * Supports bar, line, pie, and doughnut chart types.
 *
 * Note: Requires Chart.js library to be installed.
 */
// #region agent log
if (
  typeof window !== 'undefined' &&
  localStorage.getItem('__DISABLE_DEBUG_LOGGING') !== 'true' &&
  !(window as any).__DISABLE_DEBUG_LOGGING
) {
  fetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'chart-section.component.ts:40',
      message: 'CRITICAL: Before ChartSectionComponent extends ChartSectionBaseComponent',
      data: {
        baseClassAvailable: typeof ChartSectionBaseComponent !== 'undefined',
        baseClassIsFunction: typeof ChartSectionBaseComponent === 'function',
        baseClassName: ChartSectionBaseComponent?.name || 'undefined',
        baseClassIsNull: ChartSectionBaseComponent === null,
        baseClassIsUndefined: typeof ChartSectionBaseComponent === 'undefined',
        baseSectionAvailable: typeof BaseSectionComponent !== 'undefined',
        baseSectionIsFunction: typeof BaseSectionComponent === 'function',
        baseSectionName: BaseSectionComponent?.name || 'undefined',
        globalAvailable:
          typeof window !== 'undefined' &&
          typeof (window as any).__BaseSectionComponent !== 'undefined',
        globalForcedAvailable:
          typeof window !== 'undefined' &&
          typeof (window as any).__BaseSectionComponentForced !== 'undefined',
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run3',
      hypothesisId: 'B',
    }),
  }).catch(() => {});
}
// #endregion
@Component({
  selector: 'lib-chart-section',
  standalone: true,
  // @ts-ignore - BaseChartDirective may not be available until npm install
  imports: [CommonModule, BaseChartDirective, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './chart-section.component.html',
  styleUrl: './chart-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartSectionComponent
  extends ChartSectionBaseComponent
  implements AfterViewInit, OnDestroy, OnInit
{
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  @ViewChild(BaseChartDirective, { static: false }) chart?: BaseChartDirective;

  chartInitFailed = false;
  chartLoading = true;

  // Window width for responsive chart options
  private readonly windowWidth = signal<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  // Chart.js configuration
  chartData: ChartData<'bar' | 'line' | 'pie' | 'doughnut'> = {
    labels: [],
    datasets: [],
  };

  // Chart options - updated responsively based on window width
  chartOptions: ChartOptions = this.getChartOptions();

  // Chart.js chart type (different from base class computed chartType)
  chartJsType: ChartType = 'bar';

  /**
   * Get CSS variable value from computed style
   */
  private getCssVariable(variableName: string, fallback: string = '#000000'): string {
    if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
      return fallback;
    }

    try {
      const rootElement = document.documentElement;
      const computedStyle = getComputedStyle(rootElement);
      const value = computedStyle.getPropertyValue(variableName).trim();
      return value || fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Generate responsive chart options based on window width
   */
  private getChartOptions(): ChartOptions {
    const width = this.windowWidth();
    const isSmallScreen = width < 768; // md breakpoint
    const isVerySmallScreen = width < 480; // sm breakpoint
    const isExtraSmallScreen = width < 360; // xs breakpoint

    // Get theme colors from CSS variables
    const foregroundColor = this.getCssVariable('--foreground', '#ffffff');
    const backgroundColor = this.getCssVariable(
      '--card',
      this.getCssVariable('--background', '#1a1a1a')
    );
    const borderColor = this.getCssVariable('--border', 'rgba(255, 255, 255, 0.1)');
    const mutedForegroundColor = this.getCssVariable(
      '--muted-foreground',
      'rgba(255, 255, 255, 0.6)'
    );

    // Calculate responsive bar width and spacing based on screen size
    // Category percentage controls spacing between groups
    // Bar percentage controls width of individual bars within a group
    const getBarConfig = () => {
      if (isExtraSmallScreen) {
        return {
          categoryPercentage: 0.7, // Tighter spacing between groups
          barPercentage: 0.85, // Bars take 85% of available space in group
          maxBarThickness: 40, // Max bar thickness on very small screens
        };
      } else if (isVerySmallScreen) {
        return {
          categoryPercentage: 0.75,
          barPercentage: 0.85,
          maxBarThickness: 45,
        };
      } else if (isSmallScreen) {
        return {
          categoryPercentage: 0.8,
          barPercentage: 0.9,
          maxBarThickness: 50,
        };
      } else {
        return {
          categoryPercentage: 0.85, // More spacing between groups on larger screens
          barPercentage: 0.9, // Bars take 90% of available space in group
          maxBarThickness: undefined, // No max on larger screens
        };
      }
    };

    const barConfig = getBarConfig();

    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: isVerySmallScreen
          ? {
              top: 8,
              right: 4,
              bottom: 8, // Minimal bottom padding - Chart.js will add space for legend automatically
              left: 4,
            }
          : isSmallScreen
            ? {
                top: 8,
                right: 4,
                bottom: 8, // Minimal bottom padding - Chart.js will add space for legend automatically
                left: 8,
              }
            : {
                top: 8,
                right: 8,
                bottom: 8, // Small consistent padding
                left: 8,
              },
      },
      plugins: {
        legend: {
          display: true,
          position: isSmallScreen ? ('bottom' as const) : ('right' as const),
          align: isSmallScreen ? ('center' as const) : ('start' as const),
          labels: {
            boxWidth: isVerySmallScreen ? 10 : 12,
            boxHeight: isVerySmallScreen ? 10 : 12,
            padding: isVerySmallScreen ? 6 : isSmallScreen ? 8 : 15,
            font: {
              size: isVerySmallScreen ? 9 : isSmallScreen ? 10 : 12,
            },
            usePointStyle: false,
            color: foregroundColor, // Theme-aware font color
            // Don't override generateLabels - use Chart.js default which includes all datasets
            // The default implementation already includes all datasets, even those with small values
          },
          // Don't use fullSize - this can cause extra blank space
          // Chart.js will automatically calculate space needed for legend
          fullSize: false,
          // On small screens, reduce legend padding to minimize space
          ...(isSmallScreen && {
            maxWidth: undefined,
            maxHeight: undefined,
            // Reduce legend bottom spacing when at bottom
            ...(isSmallScreen && {
              rtl: false,
              textDirection: 'ltr' as const,
            }),
          }),
        },
        tooltip: {
          enabled: true,
          padding: isVerySmallScreen ? 6 : 8,
          titleFont: {
            size: isVerySmallScreen ? 11 : 12,
          },
          bodyFont: {
            size: isVerySmallScreen ? 10 : 11,
          },
          boxPadding: isVerySmallScreen ? 4 : 6,
          backgroundColor: backgroundColor, // Theme-aware tooltip background
          titleColor: foregroundColor, // Theme-aware tooltip title color
          bodyColor: foregroundColor, // Theme-aware tooltip body color
          borderColor: borderColor, // Theme-aware tooltip border color
          // Improve tooltip positioning on small screens
          ...(isSmallScreen && {
            position: 'nearest' as const,
            intersect: false,
          }),
        },
      },
      scales: {
        x: {
          ticks: {
            padding: isVerySmallScreen ? 2 : 4,
            font: {
              size: isVerySmallScreen ? 8 : isSmallScreen ? 9 : 11,
            },
            color: foregroundColor, // Theme-aware axis label color
            // Rotate labels on small screens to prevent overlap
            maxRotation: isVerySmallScreen ? 45 : isSmallScreen ? 30 : 0,
            minRotation: isVerySmallScreen ? 45 : isSmallScreen ? 30 : 0,
            // Auto-skip labels if they would overlap
            autoSkip: true,
            maxTicksLimit: isVerySmallScreen ? 5 : isSmallScreen ? 6 : undefined,
          },
          border: {
            display: false,
          },
          grid: {
            color: borderColor, // Theme-aware grid line color
            display: !isVerySmallScreen, // Hide grid on very small screens for cleaner look
          },
          // Responsive bar configuration for grouped bar charts
          ...(this.chartJsType === 'bar' && {
            categoryPercentage: barConfig.categoryPercentage,
            barPercentage: barConfig.barPercentage,
          }),
        },
        y: {
          ticks: {
            padding: isVerySmallScreen ? 2 : 4,
            font: {
              size: isVerySmallScreen ? 8 : isSmallScreen ? 9 : 11,
            },
            color: foregroundColor, // Theme-aware axis label color
            // Reduce number of ticks on small screens
            maxTicksLimit: isVerySmallScreen ? 5 : isSmallScreen ? 6 : undefined,
          },
          border: {
            display: false,
          },
          grid: {
            color: borderColor, // Theme-aware grid line color
            display: true,
          },
        },
      },
    };
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (typeof window !== 'undefined') {
      const newWidth = window.innerWidth;
      const oldWidth = this.windowWidth();

      // Calculate breakpoint changes to determine if bar config needs update
      const getBreakpoint = (w: number) => {
        if (w < 360) return 'xs';
        if (w < 480) return 'sm';
        if (w < 768) return 'md';
        return 'lg';
      };

      const oldBreakpoint = getBreakpoint(oldWidth);
      const newBreakpoint = getBreakpoint(newWidth);
      const breakpointChanged = oldBreakpoint !== newBreakpoint;

      // Only update if width changed significantly (avoid unnecessary updates)
      if (Math.abs(newWidth - oldWidth) > 10) {
        this.windowWidth.set(newWidth);
        // Update chart options with new responsive settings
        this.chartOptions = this.getChartOptions();

        // If breakpoint changed and we have bar chart, update data to apply new bar thickness
        if (breakpointChanged && this.chartJsType === 'bar' && this.chartConfig()) {
          this.updateChartData(this.chartConfig()!);
        }

        // Trigger change detection and update chart
        this.cdr.markForCheck();

        // Update chart after change detection
        setTimeout(() => {
          if (this.chart && this.chart.chart) {
            // Chart.js will pick up the new options from the binding
            this.chart.update('none'); // 'none' mode for smoother resize
          }
        }, 0);
      }
    }
  }

  ngOnInit(): void {
    // Initialize window width if available
    if (typeof window !== 'undefined') {
      this.windowWidth.set(window.innerWidth);
      this.chartOptions = this.getChartOptions();
    }

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
      if (isDevMode()) {
        console.warn('[ChartSection] Chart.js not available', error);
      }
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

      // Refresh chart options to get latest CSS variable values
      this.chartOptions = this.getChartOptions();

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
   * Get border radius for chart bars from CSS variable
   */
  private getBorderRadius(): number {
    if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
      return 8; // Default fallback
    }

    try {
      const rootElement = document.documentElement;
      const computedStyle = getComputedStyle(rootElement);
      const borderRadius =
        computedStyle.getPropertyValue('--osi-section-item-border-radius').trim() ||
        computedStyle.getPropertyValue('--section-item-border-radius').trim() ||
        computedStyle.getPropertyValue('--radius-md').trim() ||
        '8px';

      // Parse CSS value (e.g., "8px" -> 8)
      const match = borderRadius.match(/^(\d+(?:\.\d+)?)/);
      if (match && match[1]) {
        return parseFloat(match[1]);
      }

      return 8; // Default fallback
    } catch {
      return 8; // Default fallback
    }
  }

  /**
   * Update chart data from ChartConfig
   */
  private updateChartData(config: ChartConfig): void {
    if (!config || config.datasets.length === 0) {
      return;
    }

    // Get border radius for bar charts (rounded corners like section items)
    const borderRadius = this.getBorderRadius();

    // Get responsive bar configuration
    const width = this.windowWidth();
    const isSmallScreen = width < 768;
    const isVerySmallScreen = width < 480;
    const isExtraSmallScreen = width < 360;

    const maxBarThickness = isExtraSmallScreen
      ? 40
      : isVerySmallScreen
        ? 45
        : isSmallScreen
          ? 50
          : undefined;

    // Map ChartConfig to Chart.js format
    this.chartJsType = config.type as ChartType;
    this.chartData = {
      labels: config.labels,
      datasets: config.datasets.map((ds) => {
        const dataset: any = {
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.backgroundColor,
          borderColor: ds.borderColor,
          borderWidth: ds.borderWidth ?? 1,
        };

        // Add rounded borders for bar charts (like section items)
        if (config.type === 'bar') {
          dataset.borderRadius = borderRadius;
          dataset.borderSkipped = false; // Apply border radius to all corners
          // Apply max bar thickness for responsive sizing
          if (maxBarThickness !== undefined) {
            dataset.maxBarThickness = maxBarThickness;
          }
        }

        return dataset;
      }),
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
