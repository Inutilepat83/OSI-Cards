export type CardType = 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event' | 'project';

export interface AICardConfig {
  id?: string;
  cardTitle: string;
  cardSubtitle?: string;
  cardType: CardType;
  description?: string;
  columns?: 1 | 2 | 3;
  sections: CardSection[];
  actions?: CardAction[];
  meta?: Record<string, unknown>;
  metadata?: {
    category: string;
    variant: string;
    complexity: string;
    useCase?: string;
    features?: string[];
  };
  processedAt?: number;
}

export interface CardSection {
  id: string;
  title: string;
  type:
    | 'info'
    | 'analytics'
    | 'contact-card'
    | 'network-card'
    | 'map'
    | 'financials'
    | 'locations'
    | 'event'
    | 'project'
    | 'list'
    | 'chart'
    | 'product'
    | 'solutions'
    | 'overview'
    | 'stats';
  description?: string;
  subtitle?: string;
  preferredColumns?: 1 | 2 | 3 | 4;
  columns?: number;
  colSpan?: number;
  width?: number;
  collapsed?: boolean;
  emoji?: string;
  fields?: CardField[];
  items?: CardItem[];
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut';
  chartData?: {
    labels?: string[];
    datasets?: {
      label?: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }[];
  };
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CardField {
  id: string;
  label?: string;
  title?: string;
  value?: string | number | boolean | null;
  icon?: string;
  format?: 'currency' | 'percentage' | 'number' | 'text';
  percentage?: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable' | 'neutral';
  performance?: string;
  chartData?: unknown;
  description?: string;
  name?: string;
  x?: number;
  y?: number;
  type?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  role?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  department?: string;
  location?: string;
  status?: 'completed' | 'in-progress' | 'pending' | 'cancelled' | 'active' | 'inactive' | 'warning';
  priority?: 'high' | 'medium' | 'low';
  date?: string;
  time?: string;
  assignee?: string;
  attendees?: number;
  category?: string;
  contact?: {
    name: string;
    role: string;
    email?: string;
    phone?: string;
  };
  reference?: {
    company: string;
    testimonial?: string;
    logo?: string;
  };
  benefits?: string[];
  deliveryTime?: string;
  complexity?: 'low' | 'medium' | 'high';
  teamSize?: string;
  outcomes?: string[];
  connections?: number;
  strength?: number;
  valueColor?: string;
  backgroundColor?: string;
  clickable?: boolean;
  link?: string;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CardItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  value?: string | number;
  status?: string;
  meta?: Record<string, unknown>;
}

export interface CardAction {
  id: string;
  label: string;
  type?: 'primary' | 'secondary';
  icon?: string;
  action?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  meta?: Record<string, unknown>;
}

export class CardTypeGuards {
  static isAICardConfig(obj: unknown): obj is AICardConfig {
    if (!obj || typeof obj !== 'object') return false;
    const card = obj as Record<string, unknown>;
    return (
      typeof card['cardTitle'] === 'string' &&
      typeof card['cardType'] === 'string' &&
      Array.isArray(card['sections']) &&
      card['cardTitle'].length > 0
    );
  }

  static isCardSection(obj: unknown): obj is CardSection {
    if (!obj || typeof obj !== 'object') return false;
    const section = obj as Record<string, unknown>;
    return typeof section['id'] === 'string' && typeof section['title'] === 'string' && typeof section['type'] === 'string';
  }

  static isCardField(obj: unknown): obj is CardField {
    if (!obj || typeof obj !== 'object') return false;
    const field = obj as Record<string, unknown>;
    return typeof field['id'] === 'string';
  }
}

export class CardUtils {
  static safeString(value: unknown, maxLength = 1000): string {
    if (typeof value === 'string') {
      return value.substring(0, maxLength);
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  }

  static safeNumber(value: unknown, defaultValue = 0): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  }

  static generateId(prefix = 'item'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  static sanitizeCardConfig(config: unknown): AICardConfig | null {
    if (!CardTypeGuards.isAICardConfig(config)) {
      return null;
    }

    return {
      ...config,
      cardTitle: this.safeString(config.cardTitle, 200),
      cardSubtitle: config.cardSubtitle ? this.safeString(config.cardSubtitle, 500) : undefined,
      sections: config.sections.filter(CardTypeGuards.isCardSection),
      actions: config.actions?.map((action) => ({ ...action, id: action.id ?? this.generateId('action') }))
    };
  }
}
