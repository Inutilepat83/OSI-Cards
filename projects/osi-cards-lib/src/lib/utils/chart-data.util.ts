/**
 * Chart Data Utilities
 *
 * Utilities for preparing data for charts and visualizations.
 *
 * @example
 * ```typescript
 * import { prepareChartData, generateLabels, calculateTrend } from '@osi-cards/utils';
 *
 * const data = prepareChartData(values, labels);
 * const trend = calculateTrend(dataPoints);
 * ```
 */

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export function prepareChartData(
  values: number[],
  labels: string[],
  label = 'Dataset'
): ChartData {
  return {
    labels,
    datasets: [{
      label,
      data: values,
    }],
  };
}

export function generateLabels(count: number, prefix = 'Label'): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix} ${i + 1}`);
}

export function normalizeData(values: number[], min = 0, max = 100): number[] {
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = dataMax - dataMin;

  return values.map(v => {
    if (range === 0) return min;
    return min + ((v - dataMin) / range) * (max - min);
  });
}

export function binData(values: number[], binCount: number): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binSize = (max - min) / binCount;
  const bins = Array(binCount).fill(0);

  values.forEach(value => {
    const binIndex = Math.min(
      Math.floor((value - min) / binSize),
      binCount - 1
    );
    bins[binIndex]++;
  });

  return bins;
}

export function calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable';

  const first = values[0];
  const last = values[values.length - 1];
  const diff = last - first;
  const threshold = Math.abs(first) * 0.05;

  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'stable';
}

export function movingAverage(values: number[], windowSize: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = values.slice(start, i + 1);
    const avg = window.reduce((sum, v) => sum + v, 0) / window.length;
    result.push(avg);
  }

  return result;
}

export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

export function cumulativeSum(values: number[]): number[] {
  const result: number[] = [];
  let sum = 0;

  values.forEach(v => {
    sum += v;
    result.push(sum);
  });

  return result;
}

export function growthRate(values: number[]): number[] {
  const rates: number[] = [];

  for (let i = 1; i < values.length; i++) {
    const rate = ((values[i] - values[i - 1]) / values[i - 1]) * 100;
    rates.push(rate);
  }

  return rates;
}

