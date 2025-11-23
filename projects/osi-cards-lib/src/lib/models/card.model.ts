export type CardType = 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event' | 'project' | 'sko';

export interface AICardConfig {
  id?: string;
  cardTitle: string;
  cardSubtitle?: string;
  cardType?: CardType; // Optional - only for demo examples
  description?: string;
  columns?: 1 | 2 | 3;
  sections: CardSection[];
  actions?: CardAction[];
  meta?: Record<string, unknown>;
  processedAt?: number;
}

export interface CardSection {
  id?: string;
  title: string;
  type:
    | 'info'
    | 'timeline'
    | 'analytics'
    | 'metrics'
    | 'contact-card'
    | 'network-card'
    | 'map'
    | 'financials'
    | 'locations'
    | 'event'
    | 'project'
    | 'list'
    | 'table'
    | 'chart'
    | 'product'
    | 'solutions'
    | 'overview'
    | 'stats'
    | 'quotation'
    | 'reference'
    | 'text-reference'
    | 'text-ref'
    | 'brand-colors';
  description?: string;
  subtitle?: string;
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
  id?: string;
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
  id?: string;
  title: string;
  description?: string;
  icon?: string;
  value?: string | number;
  status?: string;
  meta?: Record<string, unknown>;
}

/**
 * Button type for card actions - comes from JSON 'type' field
 * - 'mail': Opens default email client with pre-filled recipient, subject, and body
 * - 'website': Opens URL in a new browser tab/window
 * - 'agent': Triggers an agent action (emits agentAction event for parent handling)
 * - 'question': Writes a new message to the chat (emits questionAction event for parent handling)
 * 
 * Legacy values ('primary', 'secondary') are supported for backward compatibility but should use 'variant' for styling
 */
export type CardActionButtonType = 'mail' | 'website' | 'agent' | 'question' | 'primary' | 'secondary';

/**
 * Email contact information - required for mail button type
 */
export interface EmailContact {
  name: string;
  email: string;
  role: string;
}

/**
 * Email configuration - required when type is 'mail'
 * Must include contact, subject, and body
 */
export interface EmailConfig {
  /** Contact information - required */
  contact: EmailContact;
  /** Email subject - required */
  subject: string;
  /** Email body - required */
  body: string;
  /** Direct recipient email(s) - optional, defaults to contact.email */
  to?: string | string[];
  /** CC recipient(s) - optional */
  cc?: string | string[];
  /** BCC recipient(s) - optional */
  bcc?: string | string[];
}

/**
 * Base card action properties shared by all action types
 */
interface BaseCardAction {
  id?: string;
  label: string;
  /** Icon identifier for the button (emoji, icon name, or image URL) */
  icon?: string;
  /** Legacy action property - URL string or action identifier */
  action?: string;
  /** Visual variant for button styling (primary, secondary, outline, ghost) */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Additional metadata for the action */
  meta?: Record<string, unknown>;
}

/**
 * Mail action - requires email configuration with contact, subject, and body
 */
export interface MailCardAction extends BaseCardAction {
  type: 'mail';
  /** Email configuration - required for mail type */
  email: EmailConfig;
}

/**
 * Website action - requires URL
 */
export interface WebsiteCardAction extends BaseCardAction {
  type: 'website';
  /** URL to open - can be in 'url' field or 'action' field when type is 'website' */
  url?: string;
}

/**
 * Agent action - optional agentId and context
 */
export interface AgentCardAction extends BaseCardAction {
  type: 'agent';
  /** Agent identifier - optional when type is 'agent' */
  agentId?: string;
  /** Additional context for agent action */
  agentContext?: Record<string, unknown>;
}

/**
 * Question action - optional pre-filled question
 */
export interface QuestionCardAction extends BaseCardAction {
  type: 'question';
  /** Pre-filled question text - optional when type is 'question' */
  question?: string;
}

/**
 * Legacy action types for backward compatibility
 */
export interface LegacyCardAction extends BaseCardAction {
  type?: 'primary' | 'secondary' | CardActionButtonType;
  /** Legacy email configuration - optional */
  email?: {
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject?: string;
    body?: string;
    contact?: {
      name?: string;
      email?: string;
      role?: string;
    };
  };
  url?: string;
  agentId?: string;
  agentContext?: Record<string, unknown>;
  question?: string;
}

/**
 * Card action button configuration
 * The 'type' field from JSON determines button behavior (mail, website, agent, question)
 * The 'variant' field determines visual styling (primary, secondary, outline, ghost)
 * 
 * @example
 * // Mail button - REQUIRES email.contact, email.subject, and email.body
 * {
 *   "label": "Send Email to Client",
 *   "type": "mail",
 *   "variant": "primary",
 *   "icon": "📧",
 *   "email": {
 *     "contact": {
 *       "name": "Robert Chen",
 *       "email": "robert.chen@manufacturing.com",
 *       "role": "Chief Information Officer"
 *     },
 *     "subject": "Orange Business Solutions - Recommended Solutions",
 *     "body": "Dear Robert Chen,\n\nI am pleased to present..."
 *   }
 * }
 * 
 * @example
 * // Website button
 * {
 *   "label": "Visit Website",
 *   "type": "website",
 *   "variant": "primary",
 *   "url": "https://example.com"
 * }
 * 
 * @example
 * // Agent button
 * {
 *   "label": "Contact Agent",
 *   "type": "agent",
 *   "variant": "outline",
 *   "agentId": "agent-123",
 *   "agentContext": { "context": "sales" }
 * }
 * 
 * @example
 * // Question button
 * {
 *   "label": "Ask Question",
 *   "type": "question",
 *   "variant": "ghost",
 *   "question": "What is the status?"
 * }
 */
export type CardAction = MailCardAction | WebsiteCardAction | AgentCardAction | QuestionCardAction | LegacyCardAction;

export class CardTypeGuards {
  static isAICardConfig(obj: unknown): obj is AICardConfig {
    if (!obj || typeof obj !== 'object') return false;
    const card = obj as Record<string, unknown>;
    return (
      typeof card['cardTitle'] === 'string' &&
      Array.isArray(card['sections']) &&
      card['cardTitle'].length > 0
    );
  }

  static isCardSection(obj: unknown): obj is CardSection {
    if (!obj || typeof obj !== 'object') return false;
    const section = obj as Record<string, unknown>;
    return typeof section['title'] === 'string' && typeof section['type'] === 'string';
  }

  static isCardField(obj: unknown): obj is CardField {
    if (!obj || typeof obj !== 'object') return false;
    // CardField can have any properties, just needs to be an object
    return true;
  }

  /**
   * Type guard to check if an action is a valid mail action
   * Validates that required fields (contact, subject, body) are present
   */
  static isMailAction(obj: unknown): obj is MailCardAction {
    if (!obj || typeof obj !== 'object') return false;
    const action = obj as Record<string, unknown>;
    
    // Must have type 'mail'
    if (action['type'] !== 'mail') return false;
    
    // Must have email property
    if (!action['email'] || typeof action['email'] !== 'object') return false;
    
    const email = action['email'] as Record<string, unknown>;
    
    // Must have contact with name, email, and role
    if (!email['contact'] || typeof email['contact'] !== 'object') return false;
    const contact = email['contact'] as Record<string, unknown>;
    if (typeof contact['name'] !== 'string' || 
        typeof contact['email'] !== 'string' || 
        typeof contact['role'] !== 'string') {
      return false;
    }
    
    // Must have subject
    if (typeof email['subject'] !== 'string') return false;
    
    // Must have body
    if (typeof email['body'] !== 'string') return false;
    
    return true;
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

  static ensureSectionIds(sections: CardSection[]): CardSection[] {
    return sections.map((section, sectionIndex) => ({
      ...section,
      id: section.id || this.generateId(`section_${sectionIndex}`),
      fields: section.fields ? this.ensureFieldIds(section.fields, sectionIndex) : undefined,
      items: section.items ? this.ensureItemIds(section.items, sectionIndex) : undefined
    }));
  }

  static ensureFieldIds(fields: CardField[], sectionIndex: number): CardField[] {
    return fields.map((field, fieldIndex) => ({
      ...field,
      id: field.id || this.generateId(`field_${sectionIndex}_${fieldIndex}`)
    }));
  }

  static ensureItemIds(items: CardItem[], sectionIndex: number): CardItem[] {
    return items.map((item, itemIndex) => ({
      ...item,
      id: item.id || this.generateId(`item_${sectionIndex}_${itemIndex}`)
    }));
  }

  static sanitizeCardConfig(config: unknown): AICardConfig | null {
    if (!CardTypeGuards.isAICardConfig(config)) {
      return null;
    }

    return {
      ...config,
      cardTitle: this.safeString(config.cardTitle, 200),
      cardSubtitle: config.cardSubtitle ? this.safeString(config.cardSubtitle, 500) : undefined,
      sections: this.ensureSectionIds(config.sections.filter(CardTypeGuards.isCardSection)),
      actions: config.actions?.map((action) => ({ ...action, id: action.id ?? this.generateId('action') }))
    };
  }
}




