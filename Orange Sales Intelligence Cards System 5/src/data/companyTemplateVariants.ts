import { AICardConfig } from '../types';

// Orange Business Client Templates: Companies with Enhanced ICT & Service Insights
export const companyTemplateVariants: AICardConfig[] = [
  // Variant 1: DSM (Royal DSM)
  {
    id: 'company-dsm',
    cardTitle: 'DSM',
        cardSubtitle: 'Nutrition, Health & Sustainable Living Leader',
    cardType: 'Company',
    columns: 2, // This card will span 2 columns in the grid
    sections: [
      // Priority 1: 2-column overview section
      {
        id: 'company-overview',
        title: 'Company Overview',
        type: 'info',
        preferredColumns: 2,
        fields: [
          { id: 'industry', label: 'Industry', value: 'Nutrition & Health' },
          { id: 'founded', label: 'Founded', value: '1902' },
          { id: 'employees', label: 'Employees', value: '23,000+' },
          { id: 'headquarters', label: 'Headquarters', value: 'Heerlen, Netherlands' },
          { id: 'revenue', label: 'Annual Revenue', value: '€12.1B' },
          { id: 'presence', label: 'Global Presence', value: '50+ Countries' },
          { id: 'ceo', label: 'CEO', value: 'Dimitri de Vreeze' },
          { id: 'stock', label: 'Stock Exchange', value: 'Euronext Amsterdam' }
        ]
      },
      // Priority 2: ICT investment overview
      {
        id: 'ict-spend',
        title: 'ICT Investment Profile',
        type: 'analytics',
        preferredColumns: 2,
        fields: [
          { id: 'annual-ict-budget', label: 'Annual ICT Budget', value: '€200M', percentage: 100, performance: 'excellent', trend: 'up', change: 8 },
          { id: 'cloud-investment', label: 'Cloud Investment', value: '€50M', percentage: 25, performance: 'good', trend: 'up', change: 15 },
          { id: 'digital-transformation', label: 'Digital Transformation', value: '€75M', percentage: 37, performance: 'excellent', trend: 'up', change: 22 },
          { id: 'security-spend', label: 'Cybersecurity Budget', value: '€25M', percentage: 12, performance: 'good', trend: 'stable', change: 5 }
        ]
      },
      // Priority 3: Cloud adoption status
      {
        id: 'cloud-services',
        title: 'Cloud Adoption',
        type: 'info',
        preferredColumns: 1,
        fields: [
          { id: 'iaas', label: 'IaaS Usage', value: '75%' },
          { id: 'paas', label: 'PaaS Usage', value: '60%' },
          { id: 'saas', label: 'SaaS Usage', value: '85%' },
          { id: 'hybrid-cloud', label: 'Hybrid Cloud', value: 'Active' },
          { id: 'multi-cloud', label: 'Multi-Cloud Strategy', value: 'AWS + Azure' }
        ]
      },
      // Priority 4: Network infrastructure
      {
        id: 'connectivity-profile',
        title: 'Network Infrastructure',
        type: 'chart',
        fields: [
          { id: 'sites-connected', label: 'Connected Sites', value: 120, color: '#FF7900' },
          { id: 'bandwidth', label: 'Total Bandwidth (Gbps)', value: 45, color: '#FF9933' },
          { id: 'sd-wan-coverage', label: 'SD-WAN Sites', value: 85, color: '#CC5F00' },
          { id: 'cloud-connections', label: 'Cloud Connections', value: 28, color: '#FFE6CC' }
        ]
      },
      // Priority 5: Innovation projects
      {
        id: 'eic-engagement',
        title: 'Innovation & EIC Projects',
        type: 'info',
        fields: [
          { id: 'eic-grants', label: 'EIC Grants Awarded', value: '€15M' },
          { id: 'pilot-projects', label: 'OB Pilot Projects', value: '5 Active' },
          { id: 'innovation-budget', label: 'Innovation Budget', value: '€3.2M' },
          { id: 'sustainability-focus', label: 'Sustainability Projects', value: '8 Initiatives' }
        ]
      },
      // Priority 6: Global locations (last to not overwhelm)
      {
        id: 'global-locations',
        title: 'Global Operations',
        type: 'map',
        preferredColumns: 2,
        fields: [
          { id: 'hq', name: 'DSM HQ - Heerlen', x: 52, y: 32, type: 'headquarters', address: 'Heerlen, Netherlands' },
          { id: 'ny-office', name: 'DSM North America', x: 25, y: 35, type: 'regional-office', address: 'New York, USA' },
          { id: 'singapore-office', name: 'DSM Asia Pacific', x: 80, y: 60, type: 'regional-office', address: 'Singapore' },
          { id: 'shanghai-office', name: 'DSM China', x: 83, y: 42, type: 'office', address: 'Shanghai, China' },
          { id: 'sao-paulo-office', name: 'DSM Latin America', x: 30, y: 70, type: 'office', address: 'São Paulo, Brazil' },
          { id: 'mumbai-office', name: 'DSM India', x: 70, y: 52, type: 'office', address: 'Mumbai, India' }
        ]
      }
    ],
    actions: [
      {
        id: 'website',
        label: 'Visit DSM',
        type: 'primary',
        icon: '🌐',
        action: 'https://www.dsm.com'
      },
      {
        id: 'contact-ob',
        label: 'Contact Orange Business',
        type: 'primary',
        icon: '📧',
        action: 'mailto:obclients@orange.com'
      }
    ]
  },

  // Variant 2: AB InBev
  {
    id: 'company-ab-inbev',
    cardTitle: 'AB InBev',
    cardSubtitle: "World's Leading Brewer & Beverage Company",
    cardType: 'Company',
    columns: 1, // This card will span 1 column
    sections: [
      // Priority 1: 2-column overview section
      {
        id: 'company-overview',
        title: 'Company Overview',
        type: 'info',
        fields: [
          { id: 'industry', label: 'Industry', value: 'Beverages & Brewing' },
          { id: 'founded', label: 'Founded', value: '2008' },
          { id: 'employees', label: 'Employees', value: '170,000+' },
          { id: 'headquarters', label: 'Headquarters', value: 'Leuven, Belgium' },
          { id: 'revenue', label: 'Annual Revenue', value: '$54.3B' },
          { id: 'brands', label: 'Global Brands', value: '500+ Brands' },
          { id: 'ceo', label: 'CEO', value: 'Michel Doukeris' },
          { id: 'stock', label: 'Stock Exchange', value: 'Euronext Brussels, NYSE' }
        ]
      },
      // Priority 2: ICT investment overview
      {
        id: 'ict-spend',
        title: 'Digital Transformation Investment',
        type: 'analytics',
        fields: [
          { id: 'digital-budget', label: 'Digital Budget', value: '€300M', percentage: 100, performance: 'excellent', trend: 'up', change: 12 },
          { id: 'iot-investment', label: 'IoT & Smart Brewing', value: '€70M', percentage: 23, performance: 'good', trend: 'up', change: 25 },
          { id: 'data-analytics', label: 'Data & Analytics', value: '€90M', percentage: 30, performance: 'excellent', trend: 'up', change: 18 },
          { id: 'automation', label: 'Automation & AI', value: '€65M', percentage: 22, performance: 'good', trend: 'up', change: 30 }
        ]
      },
      // Priority 3: Cloud services
      {
        id: 'cloud-services',
        title: 'Cloud Portfolio',
        type: 'list',
        fields: [
          { id: 'aws', title: 'AWS Infrastructure', value: 'Production Environment', status: 'completed' },
          { id: 'azure', title: 'Azure Development', value: 'Staging Environment', status: 'in-progress' },
          { id: 'gcp', title: 'Google Cloud', value: 'Pilot Projects', status: 'pending' },
          { id: 'hybrid', title: 'Hybrid Integration', value: 'Architecture Design', status: 'in-progress' }
        ]
      },
      // Priority 4: Network infrastructure
      {
        id: 'connectivity-infrastructure',
        title: 'Global Connectivity Infrastructure',
        type: 'chart',
        fields: [
          { id: 'wan-links', label: 'WAN Links', value: 85, color: '#FF7900' },
          { id: 'sd-wan', label: 'SD-WAN Sites', value: 65, color: '#FF9933' },
          { id: 'mpls', label: 'MPLS Connections', value: 45, color: '#CC5F00' },
          { id: 'internet', label: 'Internet Breakouts', value: 120, color: '#FFE6CC' }
        ]
      },
      // Priority 5: Innovation projects
      {
        id: 'eic-collaboration',
        title: 'Innovation & EIC Projects',
        type: 'info',
        fields: [
          { id: 'eic-grants', label: 'EIC Grants', value: '€12M' },
          { id: 'pilot-services', label: 'OB Pilot Services', value: '3 Running' },
          { id: 'sustainability-projects', label: 'Sustainability Projects', value: '6 Active' },
          { id: 'digital-innovation', label: 'Digital Innovation Budget', value: '€4.5M' }
        ]
      },
      // Priority 6: Global brewery network
      {
        id: 'brewery-locations',
        title: 'Global Brewery Network',
        type: 'map',
        fields: [
          { id: 'hq', name: 'AB InBev HQ - Leuven', x: 51, y: 32, type: 'headquarters', address: 'Leuven, Belgium' },
          { id: 'st-louis', name: 'Budweiser Brewery - St. Louis', x: 20, y: 38, type: 'brewery', address: 'St. Louis, USA' },
          { id: 'mexico-brewery', name: 'Corona Brewery - Mexico', x: 18, y: 50, type: 'brewery', address: 'Mexico City, Mexico' },
          { id: 'china-brewery', name: 'Harbin Brewery - China', x: 82, y: 35, type: 'brewery', address: 'Harbin, China' },
          { id: 'brazil-brewery', name: 'Brahma Brewery - Brazil', x: 32, y: 72, type: 'brewery', address: 'São Paulo, Brazil' },
          { id: 'uk-brewery', name: 'Stella Artois Brewery - UK', x: 50, y: 31, type: 'brewery', address: 'London, UK' },
          { id: 'africa-brewery', name: 'Castle Brewery - South Africa', x: 58, y: 78, type: 'brewery', address: 'Johannesburg, South Africa' }
        ]
      }
    ],
    actions: [
      {
        id: 'website',
        label: 'Visit AB InBev',
        type: 'primary',
        icon: '🌐',
        action: 'https://www.ab-inbev.com'
      },
      {
        id: 'contact-ob',
        label: 'Contact Orange Business',
        type: 'primary',
        icon: '📧',
        action: 'mailto:obclients@orange.com'
      }
    ]
  },

  // Variant 3: Akzo Nobel
  {
    id: 'company-akzo-nobel',
    cardTitle: 'Akzo Nobel',
    cardSubtitle: 'Global Paints & Coatings Innovator',
    cardType: 'Company',
    columns: 3, // This card will span the full width (3 columns)
    sections: [
      // Priority 1: 2-column overview section
      {
        id: 'company-overview',
        title: 'Company Overview',
        type: 'info',
        fields: [
          { id: 'industry', label: 'Industry', value: 'Paints & Coatings' },
          { id: 'founded', label: 'Founded', value: '1792' },
          { id: 'employees', label: 'Employees', value: '33,500+' },
          { id: 'headquarters', label: 'Headquarters', value: 'Amsterdam, Netherlands' },
          { id: 'revenue', label: 'Annual Revenue', value: '€10.9B' },
          { id: 'markets', label: 'Global Markets', value: '80+ Countries' },
          { id: 'ceo', label: 'CEO', value: 'Greg Poux-Guillaume' },
          { id: 'stock', label: 'Stock Exchange', value: 'Euronext Amsterdam' }
        ]
      },
      // Priority 2: ICT investment overview
      {
        id: 'ict-spend',
        title: 'ICT & Innovation Investment',
        type: 'analytics',
        fields: [
          { id: 'it-budget', label: 'IT Budget', value: '€180M', percentage: 100, performance: 'good', trend: 'up', change: 10 },
          { id: 'cloud-transformation', label: 'Cloud Transformation', value: '€60M', percentage: 33, performance: 'good', trend: 'up', change: 20 },
          { id: 'r-and-d-digital', label: 'Digital R&D', value: '€45M', percentage: 25, performance: 'excellent', trend: 'up', change: 35 },
          { id: 'automation', label: 'Manufacturing Automation', value: '€35M', percentage: 19, performance: 'good', trend: 'stable', change: 8 }
        ]
      },
      // Priority 3: Cloud environment
      {
        id: 'cloud-environment',
        title: 'Cloud Environment',
        type: 'info',
        fields: [
          { id: 'iaas', label: 'IaaS', value: '70%' },
          { id: 'paas', label: 'PaaS', value: '50%' },
          { id: 'saas', label: 'SaaS', value: '80%' },
          { id: 'automation', label: 'Process Automation', value: '65%' },
          { id: 'ai-integration', label: 'AI Integration', value: '45%' }
        ]
      },
      // Priority 4: Network infrastructure
      {
        id: 'connectivity-landscape',
        title: 'Network Infrastructure',
        type: 'chart',
        fields: [
          { id: 'connected-facilities', label: 'Connected Facilities', value: 60, color: '#FF7900' },
          { id: 'sd-wan-sites', label: 'SD-WAN Sites', value: 40, color: '#FF9933' },
          { id: 'cloud-connections', label: 'Cloud Connections', value: 25, color: '#CC5F00' },
          { id: 'iot-sensors', label: 'IoT Sensors', value: 1200, color: '#FFE6CC' }
        ]
      },
      // Priority 5: Innovation partnerships
      {
        id: 'eic-partnerships',
        title: 'EIC & R&D Partnerships',
        type: 'info',
        fields: [
          { id: 'eic-projects', label: 'EIC Funded Projects', value: '€10M' },
          { id: 'innovation-hubs', label: 'OB Innovation Hubs', value: '2 Locations' },
          { id: 'research-partnerships', label: 'Research Partnerships', value: '5 Universities' },
          { id: 'patent-applications', label: 'Digital Patents', value: '45 Filed' }
        ]
      },
      // Priority 6: Manufacturing network
      {
        id: 'manufacturing-network',
        title: 'Global Manufacturing Network',
        type: 'map',
        fields: [
          { id: 'hq', name: 'Akzo Nobel HQ - Amsterdam', x: 51, y: 30, type: 'headquarters', address: 'Amsterdam, Netherlands' },
          { id: 'chicago-plant', name: 'Chicago Manufacturing', x: 22, y: 36, type: 'manufacturing', address: 'Chicago, USA' },
          { id: 'sao-paulo-plant', name: 'São Paulo Plant', x: 32, y: 72, type: 'manufacturing', address: 'São Paulo, Brazil' },
          { id: 'shanghai-plant', name: 'Shanghai Facility', x: 83, y: 42, type: 'manufacturing', address: 'Shanghai, China' },
          { id: 'mumbai-plant', name: 'Mumbai Operations', x: 70, y: 52, type: 'manufacturing', address: 'Mumbai, India' },
          { id: 'germany-rd', name: 'R&D Center - Germany', x: 53, y: 31, type: 'research', address: 'Frankfurt, Germany' }
        ]
      }
    ],
    actions: [
      {
        id: 'website',
        label: 'Visit Akzo Nobel',
        type: 'primary',
        icon: '🌐',
        action: 'https://www.akzonobel.com'
      },
      {
        id: 'contact-ob',
        label: 'Contact Orange Business',
        type: 'primary',
        icon: '📧',
        action: 'mailto:obclients@orange.com'
      }
    ]
  }
];

export default companyTemplateVariants;