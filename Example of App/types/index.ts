// Base card field interface
export interface CardField {
  id: string;
  label: string;
  value: string;
  icon?: string;
  format?: 'currency' | 'percentage' | 'number' | 'text';
  percentage?: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}

// Info field interface (extends CardField)
export interface InfoField extends CardField {
  description?: string;
}

// Analytics field interface
export interface AnalyticsField {
  id: string;
  label: string;
  value: string;
  percentage?: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  chartData?: any[];
}

// Map field interface with real coordinates
export interface MapField {
  id: string;
  name: string;
  x: number; // longitude equivalent (0-100%)
  y: number; // latitude equivalent (0-100%)
  type: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Contact field interface
export interface ContactField {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  department?: string;
  location?: string;
}

// Financial field interface
export interface FinancialField {
  id: string;
  label: string;
  value: string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  format?: 'currency' | 'percentage' | 'number';
}

// Network field interface
export interface NetworkField {
  id: string;
  name: string;
  type: string;
  connections: number;
  strength: number;
}

// List field interface
export interface ListField {
  id: string;
  title: string;
  description?: string;
  value?: string;
  status?: 'completed' | 'in-progress' | 'pending' | 'cancelled';
  priority?: 'high' | 'medium' | 'low';
  date?: string;
  assignee?: string;
}

// Chart field interface
export interface ChartField {
  id: string;
  label: string;
  value: number;
  color?: string;
  category?: string;
}

// Event field interface
export interface EventField {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  attendees?: number;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  type?: 'meeting' | 'conference' | 'webinar' | 'training' | 'social' | 'partner' | 'client';
}

// Product field interface
export interface ProductField {
  id: string;
  label: string;
  value: string;
  category?: 'pricing' | 'features' | 'process' | 'references' | 'contacts' | 'advantages';
  priority?: 'high' | 'medium' | 'low';
  icon?: string;
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
}

// Solutions field interface
export interface SolutionField {
  id: string;
  title: string;
  description: string;
  category?: 'consulting' | 'technology' | 'managed' | 'training' | 'support';
  benefits?: string[];
  deliveryTime?: string;
  complexity?: 'low' | 'medium' | 'high';
  teamSize?: string;
  outcomes?: string[];
}

// Card section interface - Updated to include all section types
export interface AISectionConfig {
  id: string;
  title: string;
  type: 'info' | 'analytics' | 'contact-card' | 'network-card' | 'map' | 'financials' | 'locations' | 'event' | 'project' | 'list' | 'chart' | 'product' | 'solutions';
  fields: (InfoField | AnalyticsField | MapField | ContactField | FinancialField | NetworkField | ListField | ChartField | EventField | ProductField | SolutionField)[];
  columns?: number;
  width?: number;
  chartType?: 'bar' | 'pie' | 'line' | 'doughnut';
  preferredColumns?: 1 | 2 | 3 | 4; // Smart column allocation preference
}

// Legacy alias for backward compatibility
export interface CardSection extends AISectionConfig {}

// Card action interface
export interface CardAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary';
  icon: string;
  action: string;
}

// Main card types
export type CardType = 'Company' | 'Contact' | 'Opportunity' | 'Product' | 'Analytics' | 'Event';

// Main AI card configuration interface
export interface AICardConfig {
  id: string;
  cardTitle: string;
  cardSubtitle?: string;
  cardType: CardType;
  sections: AISectionConfig[];
  actions?: CardAction[];
  columns?: 1 | 2 | 3; // Grid span for individual cards
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Initialization result interface
export interface InitializationResult {
  success: boolean;
  initialCard: AICardConfig;
  warnings: string[];
}

// Template service interface
export interface TemplateService {
  getTemplate(type: string | CardType, variant: number): Promise<AICardConfig | null>;
  getAllTemplatesByType(type: CardType): Promise<AICardConfig[]>;
  validateCardConfig(config: AICardConfig): ValidationResult;
  generateCardId(): string;
  getAvailableCardTypes(): CardType[];
  getTemplateCount(type: CardType): number;
  exportTemplate(config: AICardConfig): Promise<string>;
  importTemplate(jsonString: string): Promise<AICardConfig>;
}

// Mouse tracking interfaces
export interface MousePosition {
  x: number;
  y: number;
}

export interface TiltCalculations {
  rotateX: number;
  rotateY: number;
  scale: number;
  glowBlur: number;
  glowOpacity: number;
  reflectionOpacity: number;
}

// Component prop interfaces
export interface AICardRendererProps {
  cardConfig: AICardConfig;
  onFieldInteraction?: (data: any) => void;
  onCardInteraction?: (action: string, card: AICardConfig) => void;
  className?: string;
  isFullscreen?: boolean;
  onFullscreenToggle?: (fullscreen: boolean) => void;
}

export interface SectionRendererProps {
  section: AISectionConfig;
  onFieldInteraction?: (sectionId: string, fieldId: string, interaction: string) => void;
}

// Particle system interfaces
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  opacity: number;
}

export interface ParticleSystemProps {
  isActive: boolean;
  mousePosition: MousePosition;
  containerBounds: DOMRect | null;
}

// Export utility types
export type FieldInteractionHandler = (sectionId: string, fieldId: string, interaction: string) => void;
export type CardInteractionHandler = (action: string, card: AICardConfig) => void;