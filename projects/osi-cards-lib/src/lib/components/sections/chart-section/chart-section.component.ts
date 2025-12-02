import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';
import { SectionHeaderComponent, EmptyStateComponent, BadgeComponent } from '../../shared';

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
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, BadgeComponent],
  templateUrl: './chart-section.component.html',
  styleUrl: './chart-section.scss'
})
export class ChartSectionComponent extends BaseSectionComponent implements AfterViewInit, OnDestroy {
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
            }
          }
        }
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
}
