declare module 'frappe-charts' {
  export interface ChartConfig {
    // Add chart config properties as needed
    [key: string]: any;
  }

  export default class Chart {
    constructor(container: HTMLElement, config: ChartConfig);
    update(config: ChartConfig): void;
    export(): void;
  }
}

