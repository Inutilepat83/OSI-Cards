import { AICardConfig, CardSection, CardAction } from '../models';

/**
 * Analytics Dashboard Preset
 * 
 * Factory functions for creating analytics dashboard cards.
 */

/**
 * Options for analytics dashboard preset
 */
export interface AnalyticsDashboardOptions {
  /** Dashboard title */
  title: string;
  /** Dashboard subtitle */
  subtitle?: string;
  /** Dashboard type */
  dashboardType?: string;
  /** Data source */
  dataSource?: string;
  /** Update frequency */
  updateFrequency?: string;
  /** Time range */
  timeRange?: string;
  /** Key performance indicators */
  kpis?: Array<{
    label: string;
    value: string | number;
    percentage?: number;
    performance?: 'excellent' | 'good' | 'fair' | 'poor';
    trend?: 'up' | 'down' | 'stable' | 'neutral';
  }>;
  /** Chart data (optional) */
  chartData?: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
    }>;
  };
  /** Dashboard URL */
  dashboardUrl?: string;
  /** Custom sections */
  customSections?: CardSection[];
  /** Custom actions */
  customActions?: CardAction[];
}

/**
 * Create an analytics dashboard card
 * 
 * @param options - Analytics dashboard options
 * @returns AICardConfig for an analytics dashboard
 * 
 * @example
 * ```typescript
 * const card = createAnalyticsDashboard({
 *   title: 'Sales Performance',
 *   kpis: [
 *     { label: 'Revenue', value: '$1.2M', percentage: 105, trend: 'up' },
 *     { label: 'Conversion Rate', value: '32%', percentage: 32, trend: 'up' }
 *   ]
 * });
 * ```
 */
export function createAnalyticsDashboard(options: AnalyticsDashboardOptions): AICardConfig {
  const {
    title,
    subtitle,
    dashboardType,
    dataSource,
    updateFrequency,
    timeRange,
    kpis = [],
    chartData,
    dashboardUrl,
    customSections = [],
    customActions = []
  } = options;

  const sections: CardSection[] = [
    ...(dashboardType || dataSource || updateFrequency || timeRange ? [{
      id: 'analytics-overview',
      title: 'Analytics Overview',
      type: 'info' as const,
      fields: [
        ...(dashboardType ? [{ id: 'dashboard-type', label: 'Dashboard Type', value: dashboardType }] : []),
        ...(dataSource ? [{ id: 'data-source', label: 'Data Source', value: dataSource }] : []),
        ...(updateFrequency ? [{ id: 'update-frequency', label: 'Update Frequency', value: updateFrequency }] : []),
        ...(timeRange ? [{ id: 'time-range', label: 'Time Range', value: timeRange }] : [])
      ].filter(Boolean)
    }] : []),
    ...(kpis.length > 0 ? [{
      id: 'kpis',
      title: 'Key Performance Indicators',
      type: 'analytics' as const,
      fields: kpis.map((kpi, i) => ({
        id: `kpi-${i}`,
        label: kpi.label,
        value: kpi.value,
        percentage: kpi.percentage,
        performance: kpi.performance || (kpi.percentage && kpi.percentage > 100 ? 'excellent' : 'good'),
        trend: kpi.trend || 'up'
      }))
    }] : []),
    ...(chartData ? [{
      id: 'chart',
      title: 'Performance Chart',
      type: 'chart' as const,
      chartType: 'bar' as const,
      chartData: {
        labels: chartData.labels,
        datasets: chartData.datasets.map(ds => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: 'rgba(255, 121, 0, 0.6)',
          borderColor: 'rgba(255, 121, 0, 1)',
          borderWidth: 2
        }))
      }
    }] : []),
    ...customSections
  ].filter(Boolean);

  const actions: CardAction[] = [
    ...(dashboardUrl ? [{
      id: 'view-dashboard',
      label: 'View Full Dashboard',
      type: 'website' as const,
      variant: 'primary' as const,
      icon: 'bar-chart',
      url: dashboardUrl
    }] : []),
    ...customActions
  ];

  return {
    id: `analytics-${title.toLowerCase().replace(/\s+/g, '-')}`,
    cardTitle: title,
    cardSubtitle: subtitle,
    cardType: 'analytics',
    sections: sections.filter(s => (s.fields && s.fields.length > 0) || s.chartData),
    actions: actions.length > 0 ? actions : undefined
  };
}

