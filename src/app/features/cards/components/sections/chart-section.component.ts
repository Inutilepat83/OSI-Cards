import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../../../models/card.model';
import { Chart, ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-chart-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-section.component.html',
  styleUrls: ['./chart-section.component.css']
})
export class ChartSectionComponent implements AfterViewInit, OnChanges {
  @Input() section?: CardSection;
  @Input() chartData?: ChartConfiguration['data'];
  @Input() chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea' = 'bar';
  @Input() chartOptions?: ChartConfiguration['options'];
  
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.initializeChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['section'] || changes['chartData'] || changes['chartType']) && this.chartCanvas) {
      this.updateChart();
    }
  }

  private initializeChart(): void {
    const data = this.section?.chartData || this.chartData;
    if (!data || !this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Determine chart type
    const type = this.section?.chartType || this.chartType || 'bar';
    
    // Merge any custom options
    const customOptions = this.section?.chartOptions || this.chartOptions || {};

    // Prepare chart configuration
    const chartConfig: ChartConfiguration = {
      type: type,
      data: {
        labels: data.labels || [],
        datasets: data.datasets || []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: 'rgba(255, 255, 255, 0.8)'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          },
          ...customOptions.plugins
        },
        scales: {
          x: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ...customOptions.scales?.x
          },
          y: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ...customOptions.scales?.y
          }
        },
        ...customOptions
      }
    };

    this.chart = new Chart(ctx, chartConfig);
  }

  private updateChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    this.initializeChart();
  }
}
