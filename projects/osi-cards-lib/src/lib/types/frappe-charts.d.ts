declare module 'frappe-charts' {
  export interface ChartConfig {
    data?: {
      labels?: string[];
      datasets?: Array<{
        name?: string;
        chartType?: string;
        values?: number[];
      }>;
    };
    type?: string;
    height?: number;
    colors?: string[];
    [key: string]: unknown;
  }

  export default class Chart {
    constructor(container: string | HTMLElement, config: ChartConfig);
    update(config: ChartConfig): void;
    export(): void;
    addDataPoint?(): void;
    removeDataPoint?(): void;
  }
}
