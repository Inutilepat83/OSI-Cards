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
    usesTableData?: boolean;
    defaultColumns: number;
    supportsCollapse: boolean;
    requiresExternalLib?: string;
    supportsEmoji?: boolean;
  };
  aliases: string[];
  isInternal: boolean;
}

/**
 * Complete manifest of all registered section types
 */
export const SECTION_MANIFEST: SectionManifestEntry[] = [
  {
    "type": "analytics",
    "name": "Analytics Section",
    "description": "Displays metrics with visual indicators, trends, and percentages. Perfect for KPIs, performance metrics, and statistical data.",
    "selector": "lib-analytics-section",
    "componentPath": "./lib/components/sections/analytics-section/analytics-section.component",
    "useCases": [
      "Performance metrics",
      "KPIs and dashboards",
      "Growth statistics",
      "Sales analytics",
      "Customer health scores"
    ],
    "bestPractices": [
      "Include percentage values for better visualization",
      "Use trend indicators (up/down/stable)",
      "Show change values when available",
      "Group related metrics together",
      "Use performance ratings for quick assessment"
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
      "stats",
      "kpi"
    ],
    "isInternal": false
  },
  {
    "type": "brand-colors",
    "name": "Brand Colors Section",
    "description": "Displays color swatches, brand palettes, and design system colors.",
    "selector": "lib-brand-colors-section",
    "componentPath": "./lib/components/sections/brand-colors-section/brand-colors-section.component",
    "useCases": [
      "Brand assets",
      "Design systems",
      "Color palettes",
      "Style guides",
      "Brand identity"
    ],
    "bestPractices": [
      "Include hex/RGB values",
      "Show color names",
      "Group by category",
      "Enable copy-to-clipboard",
      "Show usage guidelines"
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
      "colors",
      "palette"
    ],
    "isInternal": false
  },
  {
    "type": "chart",
    "name": "Chart Section",
    "description": "Displays data visualizations including bar charts, line charts, pie charts, and more.",
    "selector": "lib-chart-section",
    "componentPath": "./lib/components/sections/chart-section/chart-section.component",
    "useCases": [
      "Data visualization",
      "Analytics dashboards",
      "Statistical reports",
      "Trend analysis",
      "Performance tracking"
    ],
    "bestPractices": [
      "Provide proper chart configuration",
      "Include chart type specification",
      "Use appropriate data formats",
      "Ensure accessibility with labels",
      "Choose chart type based on data"
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
    "aliases": [
      "graph",
      "visualization"
    ],
    "isInternal": false
  },
  {
    "type": "contact-card",
    "name": "Contact Card Section",
    "description": "Displays person information with avatars, roles, contact details, and social links.",
    "selector": "lib-contact-card-section",
    "componentPath": "./lib/components/sections/contact-card-section/contact-card-section.component",
    "useCases": [
      "Team members",
      "Key contacts",
      "Leadership profiles",
      "Stakeholder directory",
      "Sales contacts"
    ],
    "bestPractices": [
      "Include name, role, and contact info",
      "Add avatar images when available",
      "Include social media links",
      "Group by department or role",
      "Show location for distributed teams"
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
    "selector": "lib-event-section",
    "componentPath": "./lib/components/sections/event-section/event-section.component",
    "useCases": [
      "Event calendars",
      "Project timelines",
      "Schedules",
      "Milestones",
      "Upcoming activities"
    ],
    "bestPractices": [
      "Include dates and times",
      "Add location information",
      "Use status for event state",
      "Chronological ordering",
      "Group by category or date"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": true,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": true
    },
    "aliases": [
      "calendar",
      "schedule"
    ],
    "isInternal": false
  },
  {
    "type": "faq",
    "name": "FAQ Section",
    "description": "Displays frequently asked questions with expandable answers.",
    "selector": "lib-faq-section",
    "componentPath": "./lib/components/sections/faq-section/faq-section.component",
    "useCases": [
      "Help content",
      "Support documentation",
      "Product FAQs",
      "Onboarding guides",
      "Knowledge base"
    ],
    "bestPractices": [
      "Keep questions clear and concise",
      "Provide comprehensive answers",
      "Group by category",
      "Order by frequency",
      "Include links for more info"
    ],
    "rendering": {
      "usesFields": false,
      "usesItems": true,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": true
    },
    "aliases": [
      "questions",
      "help"
    ],
    "isInternal": false
  },
  {
    "type": "financials",
    "name": "Financials Section",
    "description": "Displays financial data including revenue, expenses, P&L statements, and currency information.",
    "selector": "lib-financials-section",
    "componentPath": "./lib/components/sections/financials-section/financials-section.component",
    "useCases": [
      "Financial reports",
      "Quarterly earnings",
      "Budget information",
      "Revenue tracking",
      "Investment summaries"
    ],
    "bestPractices": [
      "Use currency formatting",
      "Include time periods",
      "Show trends and changes",
      "Group by category",
      "Highlight key metrics"
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
    "type": "gallery",
    "name": "Gallery Section",
    "description": "Displays image galleries, photo collections, and visual media.",
    "selector": "lib-gallery-section",
    "componentPath": "./lib/components/sections/gallery-section/gallery-section.component",
    "useCases": [
      "Photo galleries",
      "Product images",
      "Team photos",
      "Office tours",
      "Event coverage"
    ],
    "bestPractices": [
      "Include image URLs",
      "Add captions/alt text",
      "Optimize image sizes",
      "Use consistent aspect ratios",
      "Group related images"
    ],
    "rendering": {
      "usesFields": false,
      "usesItems": true,
      "defaultColumns": 2,
      "supportsCollapse": true,
      "supportsEmoji": false
    },
    "aliases": [
      "photos",
      "images"
    ],
    "isInternal": false
  },
  {
    "type": "list",
    "name": "List Section",
    "description": "Displays structured lists and tables. Supports sorting, filtering, and item interactions.",
    "selector": "lib-list-section",
    "componentPath": "./lib/components/sections/list-section/list-section.component",
    "useCases": [
      "Product lists",
      "Feature lists",
      "Task lists",
      "Inventory",
      "Requirements"
    ],
    "bestPractices": [
      "Use items array for list data",
      "Include titles and descriptions",
      "Add status badges when relevant",
      "Keep list items scannable",
      "Use icons for visual hierarchy"
    ],
    "rendering": {
      "usesFields": false,
      "usesItems": true,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": true
    },
    "aliases": [
      "checklist"
    ],
    "isInternal": false
  },
  {
    "type": "table",
    "name": "Table Section",
    "description": "Displays structured tabular data with sorting, filtering, and pagination capabilities.",
    "selector": "lib-table-section",
    "componentPath": "./lib/components/sections/table-section/table-section.component",
    "useCases": [
      "Data tables",
      "Sales reports",
      "Inventory lists",
      "Financial data",
      "User directories",
      "Product catalogs",
      "Transaction logs"
    ],
    "bestPractices": [
      "Provide tableData with columns and rows",
      "Define column types for proper sorting",
      "Mark sortable columns appropriately",
      "Keep column labels concise and clear",
      "Use appropriate column widths for readability",
      "Limit initial row count for performance"
    ],
    "rendering": {
      "usesFields": false,
      "usesItems": false,
      "usesTableData": true,
      "defaultColumns": 2,
      "supportsCollapse": false
    },
    "aliases": [
      "data-table",
      "grid"
    ],
    "isInternal": false
  },
  {
    "type": "map",
    "name": "Map Section",
    "description": "Displays geographic data with embedded maps, pins, and location information.",
    "selector": "lib-map-section",
    "componentPath": "./lib/components/sections/map-section/map-section.component",
    "useCases": [
      "Office locations",
      "Store finder",
      "Geographic data",
      "Location tracking",
      "Service coverage"
    ],
    "bestPractices": [
      "Include coordinates or addresses",
      "Use proper location formats",
      "Add location metadata",
      "Ensure map accessibility",
      "Show location types visually"
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
    "type": "network-card",
    "name": "Network Card Section",
    "description": "Displays relationship graphs, network connections, and influence metrics.",
    "selector": "lib-network-card-section",
    "componentPath": "./lib/components/sections/network-card-section/network-card-section.component",
    "useCases": [
      "Org charts",
      "Relationship maps",
      "Network analysis",
      "Partnership visualization",
      "Stakeholder mapping"
    ],
    "bestPractices": [
      "Show relationships clearly",
      "Include connection types",
      "Add influence metrics",
      "Use visual hierarchy",
      "Show connection strength"
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
    "type": "news",
    "name": "News Section",
    "description": "Displays news articles, headlines, and press releases. Supports source attribution and publication dates.",
    "selector": "lib-news-section",
    "componentPath": "./lib/components/sections/news-section/news-section.component",
    "useCases": [
      "News feeds",
      "Press releases",
      "Announcements",
      "Industry updates",
      "Company news"
    ],
    "bestPractices": [
      "Include source and publication date in meta",
      "Keep headlines concise",
      "Use descriptions for summaries",
      "Include status for article state",
      "Order chronologically"
    ],
    "rendering": {
      "usesFields": false,
      "usesItems": true,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": false
    },
    "aliases": [
      "press",
      "articles"
    ],
    "isInternal": false
  },
  {
    "type": "product",
    "name": "Product Section",
    "description": "Displays product information, features, benefits, and pricing.",
    "selector": "lib-product-section",
    "componentPath": "./lib/components/sections/product-section/product-section.component",
    "useCases": [
      "Product catalogs",
      "Feature lists",
      "Product comparisons",
      "Specifications",
      "Service offerings"
    ],
    "bestPractices": [
      "Highlight key features",
      "Include pricing when relevant",
      "Use descriptions for details",
      "Add status for availability",
      "Show version information"
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
    "type": "quotation",
    "name": "Quotation Section",
    "description": "Displays quotes, testimonials, highlighted text, and citations.",
    "selector": "lib-quotation-section",
    "componentPath": "./lib/components/sections/quotation-section/quotation-section.component",
    "useCases": [
      "Testimonials",
      "Customer quotes",
      "Citations",
      "Highlighted content",
      "Expert opinions"
    ],
    "bestPractices": [
      "Include source attribution",
      "Add author information",
      "Use for emphasis",
      "Include dates when relevant",
      "Show company/role context"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": false,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": false
    },
    "aliases": [
      "quote",
      "testimonial"
    ],
    "isInternal": false
  },
  {
    "type": "social-media",
    "name": "Social Media Section",
    "description": "Displays social media posts, engagement metrics, and social feed content.",
    "selector": "lib-social-media-section",
    "componentPath": "./lib/components/sections/social-media-section/social-media-section.component",
    "useCases": [
      "Social profiles",
      "Social feeds",
      "Engagement tracking",
      "Social monitoring",
      "Content aggregation"
    ],
    "bestPractices": [
      "Include platform information",
      "Show engagement metrics",
      "Add timestamps",
      "Include profile links",
      "Show follower counts"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": true,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": true
    },
    "aliases": [
      "social",
      "socials"
    ],
    "isInternal": false
  },
  {
    "type": "solutions",
    "name": "Solutions Section",
    "description": "Displays solution offerings, use cases, features, and benefits.",
    "selector": "lib-solutions-section",
    "componentPath": "./lib/components/sections/solutions-section/solutions-section.component",
    "useCases": [
      "Service offerings",
      "Solution portfolios",
      "Use cases",
      "Case studies",
      "Professional services"
    ],
    "bestPractices": [
      "Highlight key benefits",
      "Include use cases",
      "Add feature lists",
      "Show outcomes when available",
      "Include delivery timeframes"
    ],
    "rendering": {
      "usesFields": true,
      "usesItems": true,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": false
    },
    "aliases": [
      "services",
      "offerings"
    ],
    "isInternal": false
  },
  {
    "type": "text-reference",
    "name": "Text Reference Section",
    "description": "Displays long-form text, paragraphs, articles, and reference content.",
    "selector": "lib-text-reference-section",
    "componentPath": "./lib/components/sections/text-reference-section/text-reference-section.component",
    "useCases": [
      "Articles",
      "Documentation links",
      "Research summaries",
      "Reference materials",
      "Resource libraries"
    ],
    "bestPractices": [
      "Break into readable chunks",
      "Use proper formatting",
      "Include citations",
      "Add metadata for context",
      "Provide action links"
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
      "text-ref",
      "documentation"
    ],
    "isInternal": false
  },
  {
    "type": "timeline",
    "name": "Timeline Section",
    "description": "Displays chronological sequences of events, milestones, and historical data.",
    "selector": "lib-timeline-section",
    "componentPath": "./lib/components/sections/timeline-section/timeline-section.component",
    "useCases": [
      "Company history",
      "Project milestones",
      "Career history",
      "Product evolution",
      "Historical events"
    ],
    "bestPractices": [
      "Order chronologically",
      "Include dates clearly",
      "Use consistent formatting",
      "Highlight key milestones",
      "Keep descriptions concise"
    ],
    "rendering": {
      "usesFields": false,
      "usesItems": true,
      "defaultColumns": 1,
      "supportsCollapse": true,
      "supportsEmoji": true
    },
    "aliases": [
      "history",
      "milestones"
    ],
    "isInternal": false
  },
  {
    "type": "video",
    "name": "Video Section",
    "description": "Displays video content with thumbnails, durations, and playback controls.",
    "selector": "lib-video-section",
    "componentPath": "./lib/components/sections/video-section/video-section.component",
    "useCases": [
      "Product demos",
      "Training videos",
      "Webinar recordings",
      "Customer testimonials",
      "Tutorial content"
    ],
    "bestPractices": [
      "Include video thumbnails",
      "Show duration information",
      "Add descriptive titles",
      "Provide video URLs",
      "Group by category"
    ],
    "rendering": {
      "usesFields": false,
      "usesItems": true,
      "defaultColumns": 2,
      "supportsCollapse": true,
      "supportsEmoji": true
    },
    "aliases": [
      "videos",
      "media"
    ],
    "isInternal": false
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
  generatedAt: '2026-01-08T13:31:21.254Z',
  registryVersion: '1.5.46',
  totalSections: 20,
  publicSections: 20
};
