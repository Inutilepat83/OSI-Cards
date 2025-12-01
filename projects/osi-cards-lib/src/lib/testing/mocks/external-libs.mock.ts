/**
 * Mocks for External Library Dependencies
 * 
 * Provides mock implementations for optional external libraries
 * (Chart.js, Leaflet) to enable testing without requiring these dependencies.
 * 
 * @example
 * ```typescript
 * import { MockChartJS, MockLeaflet, setupMocks } from 'osi-cards-lib/testing';
 * 
 * beforeEach(() => {
 *   setupMocks();
 * });
 * ```
 */

// ============================================================================
// CHART.JS MOCK
// ============================================================================

/**
 * Mock Chart.js Chart class
 */
export class MockChart {
  public readonly canvas: HTMLCanvasElement | null = null;
  public readonly ctx: CanvasRenderingContext2D | null = null;
  public readonly config: MockChartConfiguration;
  public data: MockChartData;
  public options: Record<string, unknown>;

  private static instances: MockChart[] = [];

  constructor(
    context: string | HTMLCanvasElement | CanvasRenderingContext2D | null,
    config: MockChartConfiguration
  ) {
    this.config = config;
    this.data = config.data ?? { labels: [], datasets: [] };
    this.options = config.options ?? {};
    
    if (typeof context === 'string') {
      this.canvas = document.querySelector<HTMLCanvasElement>(context);
    } else if (context instanceof HTMLCanvasElement) {
      this.canvas = context;
    }
    
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    MockChart.instances.push(this);
  }

  public update(mode?: string): void {
    // Mock update
  }

  public render(): void {
    // Mock render
  }

  public destroy(): void {
    const index = MockChart.instances.indexOf(this);
    if (index > -1) {
      MockChart.instances.splice(index, 1);
    }
  }

  public resize(): void {
    // Mock resize
  }

  public reset(): void {
    // Mock reset
  }

  public stop(): void {
    // Mock stop
  }

  public toBase64Image(): string {
    return 'data:image/png;base64,mock';
  }

  public getDatasetMeta(index: number): MockDatasetMeta {
    return {
      type: 'bar',
      data: [],
      dataset: this.data.datasets?.[index] ?? null,
      controller: null,
      hidden: false,
      xAxisID: 'x',
      yAxisID: 'y',
    };
  }

  public static getChart(key: string | HTMLCanvasElement): MockChart | undefined {
    return MockChart.instances.find(c => c.canvas === key);
  }

  public static register(...items: unknown[]): void {
    // Mock register
  }

  public static unregister(...items: unknown[]): void {
    // Mock unregister
  }

  public static defaults = {
    font: {
      family: 'sans-serif',
      size: 12,
    },
    color: '#666',
    responsive: true,
    maintainAspectRatio: true,
  };
}

/**
 * Mock Chart configuration interface
 */
export interface MockChartConfiguration {
  type?: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'scatter' | 'bubble';
  data?: MockChartData;
  options?: Record<string, unknown>;
  plugins?: unknown[];
}

/**
 * Mock Chart data interface
 */
export interface MockChartData {
  labels?: string[];
  datasets?: MockChartDataset[];
}

/**
 * Mock Chart dataset interface
 */
export interface MockChartDataset {
  label?: string;
  data?: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  [key: string]: unknown;
}

/**
 * Mock dataset metadata
 */
export interface MockDatasetMeta {
  type: string;
  data: unknown[];
  dataset: MockChartDataset | null;
  controller: unknown;
  hidden: boolean;
  xAxisID: string;
  yAxisID: string;
}

// ============================================================================
// LEAFLET MOCK
// ============================================================================

/**
 * Mock Leaflet Map class
 */
export class MockLeafletMap {
  private _container: HTMLElement | null = null;
  private _center: [number, number] = [0, 0];
  private _zoom = 1;
  private _layers: MockLeafletLayer[] = [];
  private _eventHandlers = new Map<string, Array<(...args: unknown[]) => void>>();

  constructor(element: string | HTMLElement, options?: MockMapOptions) {
    if (typeof element === 'string') {
      this._container = document.getElementById(element);
    } else {
      this._container = element;
    }
    
    if (options?.center) {
      this._center = options.center;
    }
    if (options?.zoom) {
      this._zoom = options.zoom;
    }
  }

  public setView(center: [number, number], zoom?: number): this {
    this._center = center;
    if (zoom !== undefined) {
      this._zoom = zoom;
    }
    return this;
  }

  public getCenter(): { lat: number; lng: number } {
    return { lat: this._center[0], lng: this._center[1] };
  }

  public getZoom(): number {
    return this._zoom;
  }

  public setZoom(zoom: number): this {
    this._zoom = zoom;
    return this;
  }

  public zoomIn(delta?: number): this {
    this._zoom += delta ?? 1;
    return this;
  }

  public zoomOut(delta?: number): this {
    this._zoom -= delta ?? 1;
    return this;
  }

  public addLayer(layer: MockLeafletLayer): this {
    this._layers.push(layer);
    return this;
  }

  public removeLayer(layer: MockLeafletLayer): this {
    const index = this._layers.indexOf(layer);
    if (index > -1) {
      this._layers.splice(index, 1);
    }
    return this;
  }

  public hasLayer(layer: MockLeafletLayer): boolean {
    return this._layers.includes(layer);
  }

  public eachLayer(fn: (layer: MockLeafletLayer) => void): this {
    this._layers.forEach(fn);
    return this;
  }

  public fitBounds(bounds: [[number, number], [number, number]]): this {
    return this;
  }

  public panTo(latlng: [number, number]): this {
    this._center = latlng;
    return this;
  }

  public invalidateSize(): this {
    return this;
  }

  public remove(): void {
    this._layers = [];
    this._eventHandlers.clear();
  }

  public on(type: string, fn: (...args: unknown[]) => void): this {
    if (!this._eventHandlers.has(type)) {
      this._eventHandlers.set(type, []);
    }
    this._eventHandlers.get(type)!.push(fn);
    return this;
  }

  public off(type: string, fn?: (...args: unknown[]) => void): this {
    if (fn) {
      const handlers = this._eventHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(fn);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    } else {
      this._eventHandlers.delete(type);
    }
    return this;
  }

  public fire(type: string, data?: unknown): this {
    const handlers = this._eventHandlers.get(type);
    if (handlers) {
      handlers.forEach(fn => fn(data));
    }
    return this;
  }

  public getContainer(): HTMLElement | null {
    return this._container;
  }

  public getSize(): { x: number; y: number } {
    return { x: 800, y: 600 };
  }

  public getBounds(): { getNorthEast: () => { lat: number; lng: number }; getSouthWest: () => { lat: number; lng: number } } {
    return {
      getNorthEast: () => ({ lat: 90, lng: 180 }),
      getSouthWest: () => ({ lat: -90, lng: -180 }),
    };
  }
}

/**
 * Mock Leaflet layer base class
 */
export class MockLeafletLayer {
  protected _map: MockLeafletMap | null = null;

  public addTo(map: MockLeafletMap): this {
    this._map = map;
    map.addLayer(this);
    return this;
  }

  public remove(): this {
    if (this._map) {
      this._map.removeLayer(this);
      this._map = null;
    }
    return this;
  }

  public removeFrom(map: MockLeafletMap): this {
    map.removeLayer(this);
    return this;
  }
}

/**
 * Mock Leaflet Marker class
 */
export class MockLeafletMarker extends MockLeafletLayer {
  private _latlng: [number, number];
  private _options: MockMarkerOptions;
  private _popup: MockLeafletPopup | null = null;

  constructor(latlng: [number, number], options?: MockMarkerOptions) {
    super();
    this._latlng = latlng;
    this._options = options ?? {};
  }

  public getLatLng(): { lat: number; lng: number } {
    return { lat: this._latlng[0], lng: this._latlng[1] };
  }

  public setLatLng(latlng: [number, number]): this {
    this._latlng = latlng;
    return this;
  }

  public bindPopup(content: string | HTMLElement | MockLeafletPopup): this {
    if (content instanceof MockLeafletPopup) {
      this._popup = content;
    } else {
      this._popup = new MockLeafletPopup().setContent(String(content));
    }
    return this;
  }

  public openPopup(): this {
    return this;
  }

  public closePopup(): this {
    return this;
  }

  public getPopup(): MockLeafletPopup | null {
    return this._popup;
  }
}

/**
 * Mock Leaflet Popup class
 */
export class MockLeafletPopup extends MockLeafletLayer {
  private _content: string = '';
  private _latlng: [number, number] | null = null;

  public setContent(content: string): this {
    this._content = content;
    return this;
  }

  public getContent(): string {
    return this._content;
  }

  public setLatLng(latlng: [number, number]): this {
    this._latlng = latlng;
    return this;
  }

  public getLatLng(): { lat: number; lng: number } | null {
    if (this._latlng) {
      return { lat: this._latlng[0], lng: this._latlng[1] };
    }
    return null;
  }

  public openOn(map: MockLeafletMap): this {
    this.addTo(map);
    return this;
  }
}

/**
 * Mock Leaflet TileLayer class
 */
export class MockLeafletTileLayer extends MockLeafletLayer {
  private _url: string;
  private _options: MockTileLayerOptions;

  constructor(url: string, options?: MockTileLayerOptions) {
    super();
    this._url = url;
    this._options = options ?? {};
  }

  public setUrl(url: string): this {
    this._url = url;
    return this;
  }
}

/**
 * Mock map options
 */
export interface MockMapOptions {
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  [key: string]: unknown;
}

/**
 * Mock marker options
 */
export interface MockMarkerOptions {
  icon?: unknown;
  title?: string;
  alt?: string;
  draggable?: boolean;
  [key: string]: unknown;
}

/**
 * Mock tile layer options
 */
export interface MockTileLayerOptions {
  attribution?: string;
  maxZoom?: number;
  minZoom?: number;
  [key: string]: unknown;
}

// ============================================================================
// MOCK SETUP UTILITIES
// ============================================================================

/**
 * Mock Leaflet namespace
 */
export const MockL = {
  map: (element: string | HTMLElement, options?: MockMapOptions) => new MockLeafletMap(element, options),
  marker: (latlng: [number, number], options?: MockMarkerOptions) => new MockLeafletMarker(latlng, options),
  popup: () => new MockLeafletPopup(),
  tileLayer: (url: string, options?: MockTileLayerOptions) => new MockLeafletTileLayer(url, options),
  icon: (options: unknown) => options,
  divIcon: (options: unknown) => options,
  latLng: (lat: number, lng: number) => ({ lat, lng }),
  latLngBounds: (corner1: [number, number], corner2: [number, number]) => ({
    getNorthEast: () => ({ lat: corner2[0], lng: corner2[1] }),
    getSouthWest: () => ({ lat: corner1[0], lng: corner1[1] }),
    contains: () => true,
    extend: () => {},
  }),
};

/**
 * Setup all mocks on the global/window object
 */
export function setupExternalMocks(): void {
  if (typeof window !== 'undefined') {
    (window as unknown as { Chart: typeof MockChart }).Chart = MockChart;
    (window as unknown as { L: typeof MockL }).L = MockL;
  }
  if (typeof global !== 'undefined') {
    (global as unknown as { Chart: typeof MockChart }).Chart = MockChart;
    (global as unknown as { L: typeof MockL }).L = MockL;
  }
}

/**
 * Cleanup mocks from global/window object
 */
export function cleanupExternalMocks(): void {
  if (typeof window !== 'undefined') {
    delete (window as unknown as { Chart?: unknown }).Chart;
    delete (window as unknown as { L?: unknown }).L;
  }
  if (typeof global !== 'undefined') {
    delete (global as unknown as { Chart?: unknown }).Chart;
    delete (global as unknown as { L?: unknown }).L;
  }
}

/**
 * Check if Chart.js is available (mocked or real)
 */
export function isChartJSAvailable(): boolean {
  return typeof (window as unknown as { Chart?: unknown }).Chart !== 'undefined' ||
         typeof (global as unknown as { Chart?: unknown }).Chart !== 'undefined';
}

/**
 * Check if Leaflet is available (mocked or real)
 */
export function isLeafletAvailable(): boolean {
  return typeof (window as unknown as { L?: unknown }).L !== 'undefined' ||
         typeof (global as unknown as { L?: unknown }).L !== 'undefined';
}







