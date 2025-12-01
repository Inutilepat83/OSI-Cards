/**
 * Interface segregation utilities
 * Split large interfaces into smaller, more focused interfaces
 */

/**
 * Base field interface
 */
export interface BaseField {
  id?: string;
  label?: string;
  title?: string;
  value?: string | number | boolean | null;
}

/**
 * Field with formatting
 */
export interface FormattedField extends BaseField {
  format?: 'currency' | 'percentage' | 'number' | 'text';
}

/**
 * Field with trends
 */
export interface TrendField extends BaseField {
  trend?: 'up' | 'down' | 'stable' | 'neutral';
  change?: number;
  percentage?: number;
}

/**
 * Field with status
 */
export interface StatusField extends BaseField {
  status?:
    | 'completed'
    | 'in-progress'
    | 'pending'
    | 'cancelled'
    | 'active'
    | 'inactive'
    | 'warning';
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Field with location
 */
export interface LocationField extends BaseField {
  address?: string;
  coordinates?: { lat: number; lng: number };
}

/**
 * Field with contact info
 */
export interface ContactField extends BaseField {
  role?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  department?: string;
  location?: string;
}

/**
 * Field with reference
 */
export interface ReferenceField extends BaseField {
  reference?: {
    company: string;
    testimonial?: string;
    logo?: string;
  };
}
