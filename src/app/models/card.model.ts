/**
 * Core AI Card Configuration Interface
 * Represents the complete structure of an AI-generated card
 */
export interface AICardConfig {
  /** Unique identifier for the card */
  id?: string;
  /** Main title displayed on the card */
  cardTitle: string;
  /** Optional subtitle for additional context */
  cardSubtitle?: string;
  /** Type of card determining its layout and behavior */
  cardType: 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'project' | 'event';
  /** Optional description of the card */
  description?: string;
  /** Array of sections containing the card's content */
  sections: CardSection[];
  /** Optional actions available on the card */
  actions?: CardAction[];
  /** Additional metadata for extensibility */
  meta?: Record<string, unknown>;
  /** Timestamp when the card was processed */
  processedAt?: number;
  /** Metadata specific to example cards */
  metadata?: {
    category: string;
    variant: string;
    complexity: string;
    useCase?: string;
    features?: string[];
  };
}

/**
 * Chart data structure for chart sections
 */
export interface ChartData {
  /** Labels for chart data points */
  labels?: string[];
  /** Data sets for the chart */
  datasets?: {
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

/**
 * Chart configuration options
 */
export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip?: {
      enabled?: boolean;
    };
  };
  scales?: {
    x?: {
      display?: boolean;
    };
    y?: {
      display?: boolean;
      beginAtZero?: boolean;
    };
  };
}

/**
 * Card section interface representing a content block within a card
 */
export interface CardSection {
  /** Unique identifier for the section */
  id?: string;
  /** Section title */
  title: string;
  /** Optional description for the section */
  description?: string;
  /** Type of section determining its layout and behavior */
  type: 'info' | 'overview' | 'list' | 'chart' | 'map' | 'analytics' | 'contact' | 'product' | 'solutions' | 'event' | 'financials' | 'network' | 'timeline' | 'gallery' | 'table' | 'metrics' | 'progress' | 'social' | 'testimonials' | 'stats' | 'calendar' | 'pricing' | 'features';
  /** Fields for info-type sections */
  fields?: CardField[];
  /** Items for list-type sections */
  items?: CardItem[];
  /** Chart data for chart-type sections */
  chartData?: ChartData;
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea';
  chartOptions?: ChartOptions;
  /** Map configuration */
  mapCenter?: { lat: number; lng: number };
  zoom?: number;
  markers?: { lat: number; lng: number; title?: string }[];
  /** Timeline events for timeline sections */
  timelineEvents?: TimelineEvent[];
  /** Gallery items for gallery sections */
  galleryItems?: GalleryItem[];
  /** Table configuration for table sections */
  tableColumns?: TableColumn[];
  tableRows?: TableRow[];
  /** Metrics for metrics sections */
  metrics?: Metric[];
  /** Progress items for progress sections */
  progressItems?: ProgressItem[];
  /** Social links for social sections */
  socialLinks?: SocialLink[];
  /** Testimonials for testimonials sections */
  testimonials?: Testimonial[];
  /** Calendar events for calendar sections */
  calendarEvents?: CalendarEvent[];
  /** Pricing tiers for pricing sections */
  pricingTiers?: PricingTier[];
  /** Features for features sections */
  features?: Feature[];
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Card field interface for displaying key-value data
 */
export interface CardField {
  /** Unique identifier for the field */
  id?: string;
  /** Field label */
  label: string;
  /** Field value (can be various types) */
  value: string | number | boolean | null;
  /** Field type for specialized rendering */
  type?: 'text' | 'number' | 'email' | 'url' | 'phone' | 'date' | 'currency' | 'percentage' | 'status' | 'rating' | 'progress' | 'tag' | 'avatar' | 'badge' | 'image';
  /** Optional icon for the field */
  icon?: string;
  /** Color for the value display */
  valueColor?: string;
  /** Background color for badges/tags */
  backgroundColor?: string;
  /** Percentage value for progress indicators */
  percentage?: number;
  /** Change value for trend indicators */
  change?: number;
  /** Trend direction indicator */
  trend?: 'up' | 'down' | 'neutral';
  /** Rating value (1-5) for rating fields */
  rating?: number;
  /** Maximum rating value */
  maxRating?: number;
  /** Whether the field is clickable */
  clickable?: boolean;
  /** Link URL for clickable fields */
  link?: string;
  /** Format string for value display */
  format?: string;
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Card item interface for list items
 */
export interface CardItem {
  /** Unique identifier for the item */
  id?: string;
  /** Item title */
  title: string;
  /** Optional item description */
  description?: string;
  /** Optional icon for the item */
  icon?: string;
  /** Optional value associated with the item */
  value?: string | number;
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Card action interface for interactive buttons
 */
export interface CardAction {
  /** Unique identifier for the action */
  id?: string;
  /** Action label */
  label: string;
  /** Optional icon for the action */
  icon?: string;
  /** Visual variant of the action button */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Timeline event interface for timeline sections
 */
export interface TimelineEvent {
  id?: string;
  date: string | Date;
  title: string;
  description?: string;
  icon?: string;
  status?: 'completed' | 'current' | 'upcoming';
  meta?: Record<string, unknown>;
}

/**
 * Gallery item interface for gallery sections
 */
export interface GalleryItem {
  id?: string;
  src: string;
  alt?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  meta?: Record<string, unknown>;
}

/**
 * Table column interface for table sections
 */
export interface TableColumn {
  key: string;
  header: string;
  type?: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'status' | 'icon';
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Table row interface for table sections
 */
export interface TableRow {
  id?: string;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Metric interface for metrics sections
 */
export interface Metric {
  id?: string;
  label: string;
  value: string | number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
  changeLabel?: string;
  color?: string;
  format?: 'number' | 'currency' | 'percentage';
  meta?: Record<string, unknown>;
}

/**
 * Progress item interface for progress sections
 */
export interface ProgressItem {
  id?: string;
  label: string;
  value: number;
  max?: number;
  color?: string;
  showValue?: boolean;
  format?: 'number' | 'percentage';
  meta?: Record<string, unknown>;
}

/**
 * Social link interface for social sections
 */
export interface SocialLink {
  id?: string;
  platform: string;
  url: string;
  username?: string;
  followers?: number;
  icon?: string;
  meta?: Record<string, unknown>;
}

/**
 * Testimonial interface for testimonials sections
 */
export interface Testimonial {
  id?: string;
  content: string;
  author: string;
  title?: string;
  company?: string;
  avatar?: string;
  rating?: number;
  date?: string | Date;
  meta?: Record<string, unknown>;
}

/**
 * Calendar event interface for calendar sections
 */
export interface CalendarEvent {
  id?: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  description?: string;
  location?: string;
  attendees?: string[];
  type?: 'meeting' | 'deadline' | 'event' | 'reminder';
  meta?: Record<string, unknown>;
}

/**
 * Pricing tier interface for pricing sections
 */
export interface PricingTier {
  id?: string;
  name: string;
  price: number;
  currency?: string;
  period?: 'month' | 'year' | 'one-time';
  features: string[];
  recommended?: boolean;
  badge?: string;
  meta?: Record<string, unknown>;
}

/**
 * Feature interface for features sections
 */
export interface Feature {
  id?: string;
  title: string;
  description?: string;
  icon?: string;
  status?: 'available' | 'coming-soon' | 'beta' | 'premium';
  meta?: Record<string, unknown>;
}

/**
 * Type guards for runtime type checking
 */
export class CardTypeGuards {
  /**
   * Checks if an object is a valid AICardConfig
   */
  static isAICardConfig(obj: unknown): obj is AICardConfig {
    if (!obj || typeof obj !== 'object') return false;
    const card = obj as Record<string, unknown>;
    
    return (
      typeof card['cardTitle'] === 'string' &&
      typeof card['cardType'] === 'string' &&
      Array.isArray(card['sections']) &&
      card['cardTitle'].length > 0 &&
      card['cardTitle'].length <= 200 &&
      ['company', 'contact', 'opportunity', 'product', 'analytics', 'event'].includes(card['cardType'] as string)
    );
  }

  /**
   * Checks if an object is a valid CardSection
   */
  static isCardSection(obj: unknown): obj is CardSection {
    if (!obj || typeof obj !== 'object') return false;
    const section = obj as Record<string, unknown>;
    
    return (
      typeof section['title'] === 'string' &&
      typeof section['type'] === 'string' &&
      section['title'].length > 0 &&
      section['title'].length <= 100
    );
  }

  /**
   * Checks if an object is a valid CardField
   */
  static isCardField(obj: unknown): obj is CardField {
    if (!obj || typeof obj !== 'object') return false;
    const field = obj as Record<string, unknown>;
    
    return (
      typeof field['label'] === 'string' &&
      field['value'] !== undefined &&
      field['label'].length > 0 &&
      field['label'].length <= 100
    );
  }
}

/**
 * Utility functions for working with card data
 */
export class CardUtils {
  /**
   * Safely extracts string value from unknown data
   */
  static safeString(value: unknown, maxLength = 1000): string {
    if (typeof value === 'string') {
      return value.substring(0, maxLength);
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  }

  /**
   * Safely extracts number value from unknown data
   */
  static safeNumber(value: unknown, defaultValue = 0): number {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Generates a unique ID for card elements
   */
  static generateId(prefix = 'item'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validates and sanitizes card configuration
   */
  static sanitizeCardConfig(config: unknown): AICardConfig | null {
    if (!CardTypeGuards.isAICardConfig(config)) {
      return null;
    }

    return {
      ...config,
      cardTitle: this.safeString(config.cardTitle, 200),
      cardSubtitle: config.cardSubtitle ? this.safeString(config.cardSubtitle, 500) : undefined,
      sections: config.sections.filter(CardTypeGuards.isCardSection).slice(0, 20),
      actions: config.actions?.slice(0, 10) || []
    };
  }
}
