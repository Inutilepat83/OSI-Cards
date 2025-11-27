/**
 * Card type identifier for categorizing cards
 */
export type CardType = 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event' | 'project' | 'sko';

/**
 * AI Card Configuration
 * 
 * Main configuration interface for AI-generated cards. Represents a complete card
 * with title, sections, actions, and metadata. This is the root interface for
 * all card data structures.
 * 
 * @example
 * ```typescript
 * const card: AICardConfig = {
 *   id: 'card-123',
 *   cardTitle: 'Company Overview',
 *   cardSubtitle: 'Q4 2024',
 *   cardType: 'company',
 *   sections: [
 *     { title: 'Company Info', type: 'info', fields: [...] }
 *   ],
 *   actions: [
 *     { label: 'Contact', type: 'mail', email: {...} }
 *   ]
 * };
 * ```
 */
export interface AICardConfig {
  /** Unique identifier for the card (auto-generated if not provided) */
  id?: string;
  /** Main title of the card (required) */
  cardTitle: string;
  /** Subtitle or secondary title */
  cardSubtitle?: string;
  /** Card type for categorization (optional - mainly for demo examples) */
  cardType?: CardType;
  /** Description of the card */
  description?: string;
  /** Number of columns for layout (1, 2, or 3) */
  columns?: 1 | 2 | 3;
  /** Array of card sections (required) */
  sections: CardSection[];
  /** Array of card actions (buttons) */
  actions?: CardAction[];
  /** Additional metadata */
  meta?: Record<string, unknown>;
  /** Timestamp when card was processed */
  processedAt?: number;
}

/**
 * Card Section
 * 
 * Represents a section within a card. Sections can contain fields, items, charts,
 * or other content depending on the section type. Each section has a type that
 * determines how it's rendered.
 * 
 * @example
 * ```typescript
 * const section: CardSection = {
 *   id: 'section-1',
 *   title: 'Company Information',
 *   type: 'info',
 *   fields: [
 *     { label: 'Industry', value: 'Technology' },
 *     { label: 'Employees', value: 500 }
 *   ]
 * };
 * ```
 */
export interface CardSection {
  /** Unique identifier for the section (auto-generated if not provided) */
  id?: string;
  /** Section title (required) */
  title: string;
  /** Section type determines rendering component and behavior */
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
  /** Additional metadata for the section */
  meta?: Record<string, unknown>;
  /** Allow additional properties for extensibility */
  [key: string]: unknown;
}

/**
 * Card Field
 * 
 * Represents a field within a section. Fields can display various types of data
 * including text, numbers, dates, contacts, locations, and more. The field type
 * and properties determine how the field is rendered.
 * 
 * @example
 * ```typescript
 * const field: CardField = {
 *   id: 'field-1',
 *   label: 'Revenue',
 *   value: 1000000,
 *   format: 'currency',
 *   trend: 'up',
 *   change: 15.5
 * };
 * ```
 */
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
  /** Allow additional properties for extensibility */
  [key: string]: unknown;
}

/**
 * Card Item
 * 
 * Represents an item within a section. Items are typically used in list, timeline,
 * or table sections. Each item has a title and optional description, icon, value,
 * and status.
 * 
 * @example
 * ```typescript
 * const item: CardItem = {
 *   id: 'item-1',
 *   title: 'Project Alpha',
 *   description: 'Q4 2024 initiative',
 *   icon: '🚀',
 *   status: 'in-progress'
 * };
 * ```
 */
export interface CardItem {
  /** Unique identifier for the item (auto-generated if not provided) */
  id?: string;
  /** Item title (required) */
  title: string;
  /** Item description */
  description?: string;
  /** Icon identifier (emoji, icon name, or image URL) */
  icon?: string;
  /** Item value (can be string or number) */
  value?: string | number;
  /** Item status */
  status?: string;
  /** Additional metadata */
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

/**
 * Card Type Guards
 * 
 * Utility class providing type guard functions for runtime type checking.
 * Useful for validating card data structures and ensuring type safety.
 * 
 * @example
 * ```typescript
 * if (CardTypeGuards.isAICardConfig(data)) {
 *   // TypeScript knows data is AICardConfig here
 *   console.log(data.cardTitle);
 * }
 * ```
 */
export class CardTypeGuards {
  /**
   * Type guard for AICardConfig
   * Validates that an object has the required properties of an AICardConfig
   */
  static isAICardConfig(obj: unknown): obj is AICardConfig {
    if (!obj || typeof obj !== 'object') return false;
    const card = obj as Record<string, unknown>;
    return (
      typeof card['cardTitle'] === 'string' &&
      Array.isArray(card['sections']) &&
      card['cardTitle'].length > 0
    );
  }

  /**
   * Type guard for CardSection
   * Validates that an object has the required properties of a CardSection
   */
  static isCardSection(obj: unknown): obj is CardSection {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    const section = obj as Record<string, unknown>;
    
    // Validate required properties
    const hasTitle = typeof section['title'] === 'string' && section['title'].length > 0;
    const hasType = typeof section['type'] === 'string';
    
    if (!hasTitle || !hasType) {
      return false;
    }
    
    // Validate type is a valid section type
    const validTypes: string[] = [
      'info', 'timeline', 'analytics', 'metrics', 'contact-card', 'network-card',
      'map', 'financials', 'locations', 'event', 'project', 'list', 'table',
      'chart', 'product', 'solutions', 'overview', 'stats', 'quotation',
      'reference', 'text-reference', 'text-ref', 'brand-colors'
    ];
    
    if (!validTypes.includes(section['type'] as string)) {
      return false;
    }
    
    // Validate optional array properties if present
    if (section['fields'] !== undefined && !Array.isArray(section['fields'])) {
      return false;
    }
    
    if (section['items'] !== undefined && !Array.isArray(section['items'])) {
      return false;
    }
    
    return true;
  }

  /**
   * Type guard for CardField
   * Validates that an object is a valid CardField with at least label/name and value
   */
  static isCardField(obj: unknown): obj is CardField {
    if (!obj || typeof obj !== 'object') return false;
    const field = obj as Record<string, unknown>;
    
    // CardField must have at least a label or name
    const hasLabelOrName = typeof field['label'] === 'string' || typeof field['name'] === 'string';
    
    // CardField must have a value (can be string, number, boolean, or object)
    const hasValue = field['value'] !== undefined && field['value'] !== null;
    
    return hasLabelOrName && hasValue;
  }

  /**
   * Type guard for CardItem
   * Validates that an object is a valid CardItem
   */
  static isCardItem(obj: unknown): obj is CardItem {
    if (!obj || typeof obj !== 'object') return false;
    const item = obj as Record<string, unknown>;
    
    // CardItem must have a title
    return typeof item['title'] === 'string' && item['title'].length > 0;
  }

  /**
   * Type guard for CardAction
   * Validates that an object is a valid CardAction
   */
  static isCardAction(obj: unknown): obj is CardAction {
    if (!obj || typeof obj !== 'object') return false;
    const action = obj as Record<string, unknown>;
    
    // CardAction must have a label
    if (typeof action['label'] !== 'string' || action['label'].length === 0) {
      return false;
    }
    
    // If type is specified, validate it
    if (action['type'] !== undefined) {
      const validTypes = ['mail', 'website', 'agent', 'question', 'primary', 'secondary'];
      if (!validTypes.includes(action['type'] as string)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Type guard for WebsiteCardAction
   * Validates that an action is a valid website action
   */
  static isWebsiteAction(obj: unknown): obj is WebsiteCardAction {
    if (!obj || typeof obj !== 'object') return false;
    const action = obj as Record<string, unknown>;
    
    if (action['type'] !== 'website') return false;
    
    // Must have url or action field with valid URL
    const url = action['url'] || action['action'];
    if (typeof url !== 'string' || url.length === 0) {
      return false;
    }
    
    // Validate URL format
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Type guard for AgentCardAction
   * Validates that an action is a valid agent action
   */
  static isAgentAction(obj: unknown): obj is AgentCardAction {
    if (!obj || typeof obj !== 'object') return false;
    const action = obj as Record<string, unknown>;
    return action['type'] === 'agent';
  }

  /**
   * Type guard for QuestionCardAction
   * Validates that an action is a valid question action
   */
  static isQuestionAction(obj: unknown): obj is QuestionCardAction {
    if (!obj || typeof obj !== 'object') return false;
    const action = obj as Record<string, unknown>;
    return action['type'] === 'question';
  }

  /**
   * Type guard to check if an action is a valid mail action
   * Validates that required fields (contact, subject, body) are present
   */
  static isMailAction(obj: unknown): obj is MailCardAction {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    const action = obj as Partial<MailCardAction>;
    
    // Must have type 'mail'
    if (action.type !== 'mail') return false;
    
    // Must have email property
    if (!action.email || typeof action.email !== 'object' || Array.isArray(action.email)) {
      return false;
    }
    
    // Use proper EmailConfig interface
    const email = action.email as Partial<import('./card.model').EmailConfig>;
    
    // Must have contact with name, email, and role
    if (!email.contact || typeof email.contact !== 'object' || Array.isArray(email.contact)) {
      return false;
    }
    
    const contact = email.contact as Partial<import('./card.model').EmailContact>;
    if (typeof contact.name !== 'string' || 
        typeof contact.email !== 'string' || 
        typeof contact.role !== 'string') {
      return false;
    }
    
    // Must have subject
    if (typeof email.subject !== 'string' || email.subject.length === 0) {
      return false;
    }
    
    // Must have body
    if (typeof email.body !== 'string' || email.body.length === 0) {
      return false;
    }
    
    return true;
  }
}

/**
 * Card Utilities
 * 
 * Utility class providing helper methods for card data manipulation, validation,
 * and sanitization. Includes safe type conversions, ID generation, and config
 * sanitization.
 * 
 * @example
 * ```typescript
 * // Generate safe string
 * const safe = CardUtils.safeString(userInput, 200);
 * 
 * // Generate ID
 * const id = CardUtils.generateId('card');
 * 
 * // Sanitize card config
 * const sanitized = CardUtils.sanitizeCardConfig(rawConfig);
 * ```
 */
export class CardUtils {
  /**
   * Convert value to safe string with optional max length
   * @param value - Value to convert
   * @param maxLength - Maximum length (default: 1000)
   * @returns Safe string representation
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
   * Convert value to safe number with optional default
   * @param value - Value to convert
   * @param defaultValue - Default value if conversion fails (default: 0)
   * @returns Safe number value
   */
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

  /**
   * Generate unique ID with optional prefix
   * @param prefix - ID prefix (default: 'item')
   * @returns Unique ID string
   * @deprecated Use generateId from card-utils.ts instead for consistency
   */
  static generateId(prefix = 'item'): string {
    // Delegate to the centralized implementation
    // Import would create circular dependency, so we keep implementation but mark as deprecated
    const randomString = Math.random().toString(36).slice(2, 9);
    return `${prefix}_${Date.now()}_${randomString}`;
  }

  /**
   * Ensure all sections have IDs, generating them if missing
   * @param sections - Array of sections
   * @returns Sections with guaranteed IDs
   */
  static ensureSectionIds(sections: CardSection[]): CardSection[] {
    return sections.map((section, sectionIndex) => ({
      ...section,
      id: section.id || this.generateId(`section_${sectionIndex}`),
      fields: section.fields ? this.ensureFieldIds(section.fields, sectionIndex) : undefined,
      items: section.items ? this.ensureItemIds(section.items, sectionIndex) : undefined
    }));
  }

  /**
   * Ensure all fields have IDs, generating them if missing
   * @param fields - Array of fields
   * @param sectionIndex - Index of parent section
   * @returns Fields with guaranteed IDs
   */
  static ensureFieldIds(fields: CardField[], sectionIndex: number): CardField[] {
    return fields.map((field, fieldIndex) => ({
      ...field,
      id: field.id || this.generateId(`field_${sectionIndex}_${fieldIndex}`)
    }));
  }

  /**
   * Ensure all items have IDs, generating them if missing
   * @param items - Array of items
   * @param sectionIndex - Index of parent section
   * @returns Items with guaranteed IDs
   */
  static ensureItemIds(items: CardItem[], sectionIndex: number): CardItem[] {
    return items.map((item, itemIndex) => ({
      ...item,
      id: item.id || this.generateId(`item_${sectionIndex}_${itemIndex}`)
    }));
  }

  /**
   * Sanitize card configuration, ensuring all required fields and limits
   * @param config - Card configuration to sanitize
   * @returns Sanitized AICardConfig or null if invalid
   */
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
