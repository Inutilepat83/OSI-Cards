import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  OnDestroy,
} from '@angular/core';
import { CardSection } from '../../../../models/card.model';
import { LazyLoader } from '../../../../core/performance/bundle-optimizer';
import { LoggerService } from '../../../../core/services/enhanced-logging.service';

@Component({
  selector: 'app-chart-section',
  templateUrl: './chart-section.component.html',
  styleUrls: ['./chart-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartSectionComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() section?: CardSection;
  @Input() chartData?: any;
  @Input() chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea' = 'bar';
  @Input() chartOptions?: any;

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: any = null;
  private chartModule: any = null;
  private readonly logger = this.loggerService.createChildLogger('ChartSection');
  private isLoading = false;

  constructor(private loggerService: LoggerService) {}

  ngAfterViewInit(): void {
    this.initializeChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['section'] || changes['chartData'] || changes['chartType']) && this.chartCanvas) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private async initializeChart(): Promise<void> {
    const data = this.section?.chartData || this.chartData;
    if (!data || !this.chartCanvas || this.isLoading) return;

    try {
      this.isLoading = true;
      this.logger.debug('Loading Chart.js module...');

      // Lazy load Chart.js
      this.chartModule = await LazyLoader.loadChartJs();
      const { Chart, registerables } = this.chartModule;

      // Register Chart.js components
      Chart.register(...registerables);

      const ctx = this.chartCanvas.nativeElement.getContext('2d');
      if (!ctx) return;

      // Determine chart type
      const type = this.section?.chartType || this.chartType || 'bar';

      // Merge any custom options
      const customOptions = this.section?.chartOptions || this.chartOptions || {};

      // Prepare chart configuration
      const chartConfig = {
        type: type,
        data: {
          labels: data.labels || [],
          datasets: data.datasets || [],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: 'rgba(255, 255, 255, 0.8)',
              },
            },
            tooltip: {
              mode: 'index',
              intersect: false,
            },
            ...customOptions.plugins,
          },
          scales: {
            x: {
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
              },
              ...customOptions.scales?.x,
            },
            y: {
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
              },
              ...customOptions.scales?.y,
            },
          },
          ...customOptions,
        },
      };

      this.chart = new Chart(ctx, chartConfig);
      this.logger.debug('Chart initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize chart', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async updateChart(): Promise<void> {
    if (this.chart) {
      this.chart.destroy();
    }
    await this.initializeChart();
  }
}
