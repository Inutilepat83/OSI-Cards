import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
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
  implements AfterViewInit, OnDestroy, OnInit
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

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  /**
   * Render chart using Chart.js (if available)
   */
  private async renderChart(): Promise<void> {
    if (!this.chartCanvas) return;

    const chartData = (this as any).chartData;
    const chartType = (this as any).chartType || 'bar';

    if (!chartData) return;

    try {
      // Dynamic import of Chart.js
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      this.chartInstance = new Chart(this.chartCanvas.nativeElement, {
        type: chartType,
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
            },
          },
        },
      });
    } catch (error) {
      console.warn('Chart.js not available', error);
    }
  }

  /**
   * Destroy chart instance
   */
  private destroyChart(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
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
    const chartType = (section.meta as Record<string, unknown>)?.['chartType'] as
      | string
      | undefined;
    const isWideChart = chartType === 'line' || chartType === 'bar' || chartType === 'area';

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
