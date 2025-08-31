export interface AICardConfig {
  id?: string;
  cardTitle: string;
  cardSubtitle?: string;
  cardType: 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event';
  sections: CardSection[];
  actions?: CardAction[];
  meta?: Record<string, any>;
}

export interface CardSection {
  id?: string;
  title: string;
  type:
    | 'info'
    | 'overview'
    | 'list'
    | 'chart'
    | 'map'
    | 'analytics'
    | 'contact'
    | 'product'
    | 'solutions'
    | 'event'
    | 'financials'
    | 'network';
  fields?: CardField[];
  items?: CardItem[];
  chartData?: any;
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea';
  chartOptions?: any;
  mapCenter?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; title?: string }>;
  meta?: Record<string, any>;
}

export interface CardField {
  id?: string;
  label: string;
  value: string | number | boolean | null;
  icon?: string;
  valueColor?: string;
  percentage?: number;
  performance?: string;
  meta?: Record<string, any>;
}

export interface CardItem {
  id?: string;
  title: string;
  description?: string;
  icon?: string;
  value?: string | number;
  meta?: Record<string, any>;
}

export interface CardAction {
  id?: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  meta?: Record<string, any>;
}
