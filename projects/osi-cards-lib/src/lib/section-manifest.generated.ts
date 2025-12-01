/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Generated from section-registry.json
 * Run: npm run generate:manifest
 */

export interface SectionManifestEntry {
  type: string;
  name: string;
  description: string;
  selector: string;
  componentPath: string;
  stylePath?: string;
  useCases: string[];
  bestPractices: string[];
  rendering: {
    usesFields: boolean;
    usesItems: boolean;
    usesChartData?: boolean;
    defaultColumns: number;
    supportsCollapse: boolean;
    supportsEmoji: boolean;
    requiresExternalLib?: string;
  };
  aliases: string[];
  isInternal: boolean;
}

/**
 * Complete manifest of all registered section types
 */
export const SECTION_MANIFEST: SectionManifestEntry[] = [
  {
    "type": "info",
    "name": "Info Section",
    "description": "Displays key-value pairs in a clean, scannable format. Ideal for metadata, contact information, and general data display.",
    "selector": "app-info-section",
    "componentPath": "./lib/components/sections/info-section.component",
    "stylePath": "./lib/styles/components/sections/_info.scss",
    "useCases": [
      "Company information",
      "Contact details",
      "Metadata display",
      "Key-value pairs"
    ],
    "bestPractices": [
      "Use for structured data with clear labels and values",
      "Keep labels concise and descriptive",
      "Use trend indicators for dynamic data",
      "Group related fields together"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": false,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": true
    },
    "aliases": [],
    "isInternal": false
  },
  {
    "type": "analytics",
    "name": "Analytics Section",
    "description": "Displays metrics with visual indicators, trends, and percentages. Perfect for KPIs, performance metrics, and statistical data.",
    "selector": "app-analytics-section",
    "componentPath": "./lib/components/sections/analytics-section/analytics-section.component",
    "stylePath": "./lib/styles/components/sections/_analytics.scss",
    "useCases": [
      "Performance metrics",
      "KPIs",
      "Growth statistics",
      "Analytics dashboards"
    ],
    "bestPractices": [
      "Include percentage values for better visualization",
      "Use trend indicators (up/down/stable)",
      "Show change values when available",
      "Group related metrics together"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": false,
      "defaultColumns": 2,
      "supportsCollapse": true,
      "supportsEmoji": true
    },
    "aliases": [
      "metrics",
      "stats"
    ],
    "isInternal": false
  },
  {
    "type": "contact-card",
    "name": "Contact Card Section",
    "description": "Displays person information with avatars, roles, contact details, and social links.",
    "selector": "app-contact-card-section",
    "componentPath": "./lib/components/sections/contact-card-section/contact-card-section.component",
    "stylePath": "./lib/styles/components/sections/_contact.scss",
    "useCases": [
      "Team members",
      "Key contacts",
      "Leadership",
      "Stakeholders"
    ],
    "bestPractices": [
      "Include name, role, and contact info",
      "Add avatar images when available",
      "Include social media links",
      "Group by department or role"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": false,
      "defaultColumns": 2,
      "supportsCollapse": true,
      "supportsEmoji": false
    },
    "aliases": [],
    "isInternal": false
  },
  {
    "type": "network-card",
    "name": "Network Card Section",
    "description": "Displays relationship graphs, network connections, and influence metrics.",
    "selector": "app-network-card-section",
    "componentPath": "./lib/components/sections/network-card-section/network-card-section.component",
    "stylePath": "./lib/styles/components/sections/_network.scss",
    "useCases": [
      "Org charts",
      "Relationship maps",
      "Network analysis",
      "Connection graphs"
    ],
    "bestPractices": [
      "Show relationships clearly",
      "Include connection types",
      "Add influence metrics",
      "Use visual hierarchy"
    ],
    "rendering": {
      "usesFields": false,
      "usesItems": true,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": false
    },
    "aliases": [],
    "isInternal": false
  },
  {
    "type": "map",
    "name": "Map Section",
    "description": "Displays geographic data with embedded maps, pins, and location information.",
    "selector": "app-map-section",
    "componentPath": "./lib/components/sections/map-section/map-section.component",
    "stylePath": "./lib/styles/components/sections/_map.scss",
    "useCases": [
      "Office locations",
      "Store finder",
      "Geographic data",
      "Location tracking"
    ],
    "bestPractices": [
      "Include coordinates or addresses",
      "Use proper location formats",
      "Add location metadata",
      "Ensure map accessibility"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": false,
      "defaultColumns": 1,
      "supportsCollapse": false,
      "supportsEmoji": false,
      "requiresExternalLib": "leaflet"
    },
    "aliases": [
      "locations"
    ],
    "isInternal": false
  },
  {
    "type": "financials",
    "name": "Financials Section",
    "description": "Displays financial data including revenue, expenses, P&L statements, and currency information.",
    "selector": "app-financials-section",
    "componentPath": "./lib/components/sections/financials-section/financials-section.component",
    "stylePath": "./lib/styles/components/sections/_financials.scss",
    "useCases": [
      "Financial reports",
      "Quarterly earnings",
      "Budget information",
      "Revenue tracking"
    ],
    "bestPractices": [
      "Use currency formatting",
      "Include time periods",
      "Show trends and changes",
      "Group by category"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": false,
      "defaultColumns": 2,
      "supportsCollapse": true,
      "supportsEmoji": false
    },
    "aliases": [],
    "isInternal": false
  },
  {
    "type": "event",
    "name": "Event Section",
    "description": "Displays chronological events, timelines, schedules, and calendar information.",
    "selector": "app-event-section",
    "componentPath": "./lib/components/sections/event-section/event-section.component",
    "stylePath": "./lib/styles/components/sections/_event.scss",
    "useCases": [
      "Event calendars",
      "Project timelines",
      "Schedules",
      "Milestones"
    ],
    "bestPractices": [
      "Include dates and times",
      "Add location information",
      "Use status for event state",
      "Chronological ordering"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": true,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": true
    },
    "aliases": [
      "timeline"
    ],
    "isInternal": false
  },
  {
    "type": "list",
    "name": "List Section",
    "description": "Displays structured lists and tables. Supports sorting, filtering, and item interactions.",
    "selector": "app-list-section",
    "componentPath": "./lib/components/sections/list-section/list-section.component",
    "stylePath": "./lib/styles/components/sections/_list.scss",
    "useCases": [
      "Product lists",
      "Employee rosters",
      "Inventory",
      "Task lists"
    ],
    "bestPractices": [
      "Use items array for list data",
      "Include titles and descriptions",
      "Add status badges when relevant",
      "Keep list items scannable"
    ],
    "rendering": {
      "usesFields": false,
      "usesItems": true,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": true
    },
    "aliases": [
      "table"
    ],
    "isInternal": false
  },
  {
    "type": "chart",
    "name": "Chart Section",
    "description": "Displays data visualizations including bar charts, line charts, pie charts, and more.",
    "selector": "app-chart-section",
    "componentPath": "./lib/components/sections/chart-section/chart-section.component",
    "stylePath": "./lib/styles/components/sections/_chart.scss",
    "useCases": [
      "Data visualization",
      "Analytics dashboards",
      "Statistical reports",
      "Trend analysis"
    ],
    "bestPractices": [
      "Provide proper chart configuration",
      "Include chart type specification",
      "Use appropriate data formats",
      "Ensure accessibility with labels"
    ],
    "rendering": {
      "usesFields": false,
      "usesItems": false,
      "usesChartData": true,
      "defaultColumns": 2,
      "supportsCollapse": false,
      "supportsEmoji": false,
      "requiresExternalLib": "chart.js"
    },
    "aliases": [],
    "isInternal": false
  },
  {
    "type": "product",
    "name": "Product Section",
    "description": "Displays product information, features, benefits, and pricing.",
    "selector": "app-product-section",
    "componentPath": "./lib/components/sections/product-section/product-section.component",
    "stylePath": "./lib/styles/components/sections/_product.scss",
    "useCases": [
      "Product catalogs",
      "Feature lists",
      "Product comparisons",
      "Pricing tables"
    ],
    "bestPractices": [
      "Highlight key features",
      "Include pricing when relevant",
      "Use descriptions for details",
      "Add status for availability"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": false,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": true
    },
    "aliases": [],
    "isInternal": false
  },
  {
    "type": "solutions",
    "name": "Solutions Section",
    "description": "Displays solution offerings, use cases, features, and benefits.",
    "selector": "app-solutions-section",
    "componentPath": "./lib/components/sections/solutions-section/solutions-section.component",
    "stylePath": "./lib/styles/components/sections/_solutions.scss",
    "useCases": [
      "Service offerings",
      "Solution portfolios",
      "Use cases",
      "Case studies"
    ],
    "bestPractices": [
      "Highlight key benefits",
      "Include use cases",
      "Add feature lists",
      "Show outcomes when available"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": true,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": false
    },
    "aliases": [],
    "isInternal": false
  },
  {
    "type": "overview",
    "name": "Overview Section",
    "description": "Displays high-level summaries, executive dashboards, and key highlights.",
    "selector": "app-overview-section",
    "componentPath": "./lib/components/sections/overview-section/overview-section.component",
    "stylePath": "./lib/styles/components/sections/_overview.scss",
    "useCases": [
      "Executive summaries",
      "Dashboard overviews",
      "Key highlights",
      "Quick insights"
    ],
    "bestPractices": [
      "Keep content high-level",
      "Focus on key metrics",
      "Use visual indicators",
      "Limit to essential information"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": false,
      "defaultColumns": 1,
      "supportsCollapse": false,
      "supportsEmoji": true
    },
    "aliases": [],
    "isInternal": false
  },
  {
    "type": "quotation",
    "name": "Quotation Section",
    "description": "Displays quotes, testimonials, highlighted text, and citations.",
    "selector": "app-quotation-section",
    "componentPath": "./lib/components/sections/quotation-section/quotation-section.component",
    "stylePath": "./lib/styles/components/sections/_quotation.scss",
    "useCases": [
      "Testimonials",
      "Quotes",
      "Citations",
      "Highlighted content"
    ],
    "bestPractices": [
      "Include source attribution",
      "Add author information",
      "Use for emphasis",
      "Include dates when relevant"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": false,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": false
    },
    "aliases": [
      "quote"
    ],
    "isInternal": false
  },
  {
    "type": "text-reference",
    "name": "Text Reference Section",
    "description": "Displays long-form text, paragraphs, articles, and reference content.",
    "selector": "app-text-reference-section",
    "componentPath": "./lib/components/sections/text-reference-section/text-reference-section.component",
    "stylePath": "./lib/styles/components/sections/_text-reference.scss",
    "useCases": [
      "Articles",
      "Blog posts",
      "Research summaries",
      "Long-form content"
    ],
    "bestPractices": [
      "Break into readable chunks",
      "Use proper formatting",
      "Include citations",
      "Add metadata for context"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": false,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": false
    },
    "aliases": [
      "reference",
      "text-ref"
    ],
    "isInternal": false
  },
  {
    "type": "brand-colors",
    "name": "Brand Colors Section",
    "description": "Displays color swatches, brand palettes, and design system colors.",
    "selector": "app-brand-colors-section",
    "componentPath": "./lib/components/sections/brand-colors-section/brand-colors-section.component",
    "stylePath": "./lib/styles/components/sections/_brand-colors.scss",
    "useCases": [
      "Brand assets",
      "Design systems",
      "Color palettes",
      "Style guides"
    ],
    "bestPractices": [
      "Include hex/RGB values",
      "Show color names",
      "Group by category",
      "Enable copy-to-clipboard"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": false,
      "defaultColumns": 2,
      "supportsCollapse": true,
      "supportsEmoji": false
    },
    "aliases": [
      "brands",
      "colors"
    ],
    "isInternal": false
  },
  {
    "type": "news",
    "name": "News Section",
    "description": "Displays news articles, headlines, and press releases. Supports source attribution and publication dates.",
    "selector": "app-news-section",
    "componentPath": "./lib/components/sections/news-section/news-section.component",
    "stylePath": "./lib/styles/components/sections/_news.scss",
    "useCases": [
      "News feeds",
      "Press releases",
      "Announcements",
      "Blog posts"
    ],
    "bestPractices": [
      "Include source and publication date in meta",
      "Keep headlines concise",
      "Use descriptions for summaries",
      "Include status for article state"
    ],
    "rendering": {
      "usesFields": false,
      "usesItems": true,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": false
    },
    "aliases": [],
    "isInternal": false
  },
  {
    "type": "social-media",
    "name": "Social Media Section",
    "description": "Displays social media posts, engagement metrics, and social feed content.",
    "selector": "app-social-media-section",
    "componentPath": "./lib/components/sections/social-media-section/social-media-section.component",
    "stylePath": "./lib/styles/components/sections/_social-media.scss",
    "useCases": [
      "Social feeds",
      "Engagement tracking",
      "Social monitoring",
      "Content aggregation"
    ],
    "bestPractices": [
      "Include platform information",
      "Show engagement metrics",
      "Add timestamps",
      "Include author information"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": true,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": true
    },
    "aliases": [],
    "isInternal": false
  },
  {
    "type": "fallback",
    "name": "Fallback Section",
    "description": "Default section renderer for unknown or unsupported section types.",
    "selector": "app-fallback-section",
    "componentPath": "./lib/components/sections/fallback-section/fallback-section.component",
    "stylePath": "./lib/styles/components/sections/_fallback.scss",
    "useCases": [
      "Unknown types",
      "Error handling",
      "Graceful degradation"
    ],
    "bestPractices": [
      "Display section data in readable format",
      "Show section type for debugging",
      "Provide helpful error messages"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": true,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": true
    },
    "aliases": [],
    "isInternal": true
  }
];

/**
 * Get manifest entry by section type
 */
export function getManifestEntry(type: string): SectionManifestEntry | undefined {
  const typeLower = type.toLowerCase();
  return SECTION_MANIFEST.find(s => 
    s.type === typeLower || s.aliases.includes(typeLower)
  );
}

/**
 * Get all public section types
 */
export function getPublicSectionTypes(): string[] {
  return SECTION_MANIFEST
    .filter(s => !s.isInternal)
    .map(s => s.type);
}

/**
 * Get sections that use external libraries
 */
export function getSectionsRequiringExternalLibs(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  
  SECTION_MANIFEST.forEach(s => {
    if (s.rendering.requiresExternalLib) {
      const lib = s.rendering.requiresExternalLib;
      if (!map.has(lib)) {
        map.set(lib, []);
      }
      map.get(lib)!.push(s.type);
    }
  });
  
  return map;
}

/**
 * Manifest metadata
 */
export const MANIFEST_META = {
  generatedAt: '2025-12-01T11:29:06.987Z',
  registryVersion: '1.0.0',
  totalSections: 18,
  publicSections: 17
};
