import { AICardConfig, CardSection, CardAction, CardField, CardItem } from '../models';

/**
 * Company Card Preset
 *
 * Factory functions for creating company profile cards with common sections.
 */

/**
 * Options for company card preset
 */
export interface CompanyCardOptions {
  /** Company name */
  name: string;
  /** Company subtitle/description */
  subtitle?: string;
  /** Industry */
  industry?: string;
  /** Founded year */
  founded?: string;
  /** Number of employees */
  employees?: string;
  /** Headquarters location */
  headquarters?: string;
  /** Annual revenue */
  revenue?: string;
  /** Growth rate percentage */
  growthRate?: number;
  /** Market share percentage */
  marketShare?: number;
  /** Website URL */
  websiteUrl?: string;
  /** Additional custom sections */
  customSections?: CardSection[];
  /** Custom actions */
  customActions?: CardAction[];
}

/**
 * Create a basic company card
 *
 * @param options - Company card options
 * @returns AICardConfig for a company card
 *
 * @example
 * ```typescript
 * const card = createCompanyCard({
 *   name: 'Acme Corp',
 *   industry: 'Technology',
 *   employees: '500+',
 *   websiteUrl: 'https://acme.com'
 * });
 * ```
 */
export function createCompanyCard(options: CompanyCardOptions): AICardConfig {
  const {
    name,
    subtitle,
    industry,
    founded,
    employees,
    headquarters,
    revenue,
    growthRate,
    marketShare,
    websiteUrl,
    customSections = [],
    customActions = [],
  } = options;

  const overviewFields: CardField[] = [];
  if (industry) overviewFields.push({ id: 'industry', label: 'Industry', value: industry });
  if (founded) overviewFields.push({ id: 'founded', label: 'Founded', value: founded });
  if (employees) overviewFields.push({ id: 'employees', label: 'Employees', value: employees });
  if (headquarters)
    overviewFields.push({ id: 'headquarters', label: 'Headquarters', value: headquarters });
  if (revenue) overviewFields.push({ id: 'revenue', label: 'Annual Revenue', value: revenue });

  const sections: CardSection[] = [
    {
      id: 'company-overview',
      title: 'Company Overview',
      type: 'info',
      fields: overviewFields,
    },
    ...(growthRate || marketShare
      ? [
          {
            id: 'key-metrics',
            title: 'Key Metrics',
            type: 'analytics' as const,
            fields: [
              ...(growthRate
                ? [
                    {
                      id: 'growth-rate',
                      label: 'Growth Rate',
                      value: `${growthRate}% YoY`,
                      percentage: growthRate,
                      performance:
                        growthRate > 20
                          ? ('excellent' as const)
                          : growthRate > 10
                            ? ('good' as const)
                            : ('fair' as const),
                      trend: 'up' as const,
                    },
                  ]
                : []),
              ...(marketShare
                ? [
                    {
                      id: 'market-share',
                      label: 'Market Share',
                      value: `${marketShare}%`,
                      percentage: marketShare,
                      performance:
                        marketShare > 15
                          ? ('excellent' as const)
                          : marketShare > 10
                            ? ('good' as const)
                            : ('fair' as const),
                      trend: 'up' as const,
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
    ...customSections,
  ];

  const actions: CardAction[] = [
    ...(websiteUrl
      ? [
          {
            id: 'view-website',
            label: 'View Website',
            type: 'website' as const,
            variant: 'primary' as const,
            icon: 'globe',
            url: websiteUrl,
          },
        ]
      : []),
    ...customActions,
  ];

  return {
    id: `company-${name.toLowerCase().replace(/\s+/g, '-')}`,
    cardTitle: name,
    cardType: 'company',
    sections: sections.filter((s) => s.fields && s.fields.length > 0),
    actions: actions.length > 0 ? actions : undefined,
  };
}

/**
 * Create an enhanced company card with more sections
 */
export function createEnhancedCompanyCard(
  options: CompanyCardOptions & {
    financials?: Array<{ label: string; value: string | number }>;
    products?: Array<{ name: string; description?: string }>;
  }
): AICardConfig {
  const baseCard = createCompanyCard(options);

  const { financials = [], products = [] } = options;

  // Add financials section if provided
  if (financials.length > 0) {
    const financialFields: CardField[] = financials.map((f, i) => ({
      id: `financial-${i}`,
      label: f.label,
      value: f.value,
    }));
    baseCard.sections.push({
      id: 'financials',
      title: 'Financials',
      type: 'financials',
      fields: financialFields,
    });
  }

  // Add products section if provided
  if (products.length > 0) {
    const productItems: CardItem[] = products.map((p, i) => ({
      id: `product-${i}`,
      title: p.name,
      description: p.description,
    }));
    baseCard.sections.push({
      id: 'products',
      title: 'Products & Services',
      type: 'list',
      items: productItems,
    });
  }

  return baseCard;
}
