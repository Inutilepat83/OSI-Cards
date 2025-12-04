import { AICardConfig, CardSection, CardAction, CardField } from '../models';

/**
 * Contact Card Preset
 *
 * Factory functions for creating contact profile cards.
 */

/**
 * Options for contact card preset
 */
export interface ContactCardOptions {
  /** Contact name */
  name: string;
  /** Job title */
  jobTitle?: string;
  /** Company name */
  company?: string;
  /** Location */
  location?: string;
  /** Years of experience */
  experience?: string;
  /** Email address */
  email?: string;
  /** Phone number */
  phone?: string;
  /** LinkedIn URL */
  linkedIn?: string;
  /** Performance metrics */
  metrics?: Array<{
    label: string;
    value: string | number;
    percentage?: number;
    trend?: 'up' | 'down' | 'stable';
  }>;
  /** Custom sections */
  customSections?: CardSection[];
  /** Custom actions */
  customActions?: CardAction[];
}

/**
 * Create a basic contact card
 *
 * @param options - Contact card options
 * @returns AICardConfig for a contact card
 *
 * @example
 * ```typescript
 * const card = createContactCard({
 *   name: 'John Doe',
 *   jobTitle: 'Sales Director',
 *   email: 'john@example.com',
 *   phone: '+1 555 1234'
 * });
 * ```
 */
export function createContactCard(options: ContactCardOptions): AICardConfig {
  const {
    name,
    jobTitle,
    company,
    location,
    experience,
    email,
    phone,
    linkedIn,
    metrics = [],
    customSections = [],
    customActions = [],
  } = options;

  const profileFields: CardField[] = [];
  if (jobTitle) profileFields.push({ id: 'job-title', label: 'Job Title', value: jobTitle });
  if (company) profileFields.push({ id: 'company', label: 'Company', value: company });
  if (location) profileFields.push({ id: 'location', label: 'Location', value: location });
  if (experience) profileFields.push({ id: 'experience', label: 'Experience', value: experience });
  if (email) profileFields.push({ id: 'email', label: 'Email', value: email });
  if (phone) profileFields.push({ id: 'phone', label: 'Phone', value: phone });

  const sections: CardSection[] = [
    {
      id: 'professional-profile',
      title: 'Professional Profile',
      type: 'info',
      fields: profileFields,
    },
    ...(metrics.length > 0
      ? [
          {
            id: 'performance-metrics',
            title: 'Performance Metrics',
            type: 'analytics' as const,
            fields: metrics.map(
              (m, i): CardField => ({
                id: `metric-${i}`,
                label: m.label,
                value: m.value,
                percentage: m.percentage,
                trend: m.trend ?? 'up',
              })
            ),
          },
        ]
      : []),
    ...customSections,
  ];

  const actions: CardAction[] = [
    ...(email
      ? [
          {
            id: 'send-email',
            label: 'Send Email',
            type: 'mail' as const,
            variant: 'primary' as const,
            icon: 'mail',
            email: {
              to: email,
              subject: `Hello ${name.split(' ')[0]}`,
              body: `Dear ${name},\n\n`,
            },
          },
        ]
      : []),
    ...(linkedIn
      ? [
          {
            id: 'linkedin',
            label: 'LinkedIn',
            type: 'website' as const,
            variant: 'secondary' as const,
            icon: 'linkedin',
            url: linkedIn,
          },
        ]
      : []),
    ...customActions,
  ];

  return {
    id: `contact-${name.toLowerCase().replace(/\s+/g, '-')}`,
    cardTitle: name,
    cardType: 'contact',
    sections: sections.filter((s) => s.fields && s.fields.length > 0),
    actions: actions.length > 0 ? actions : undefined,
  };
}
