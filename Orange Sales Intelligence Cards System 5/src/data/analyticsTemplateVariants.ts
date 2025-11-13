import { AICardConfig } from '../types';

// Orange Business Analytics Templates: Product Interest & Performance Scoring
export const analyticsTemplateVariants: AICardConfig[] = [
  // Variant 1: Product Interest Scoring
  {
    id: 'analytics-product-interest',
    cardTitle: 'Product Interest Scores',
    cardSubtitle: 'CRM-Driven Interest & Engagement Metrics',
    cardType: 'Analytics',
    sections: [
      // Priority 1: 2-column overview section
      {
        id: 'analytics-overview',
        title: 'Analytics Overview',
        type: 'info',
        fields: [
          { id: 'reportName', label: 'Report Name', value: 'Product Interest Scores' },
          { id: 'reportType', label: 'Report Type', value: 'CRM Analytics' },
          { id: 'totalContacts', label: 'Total Contacts Engaged', value: '1,240' },
          { id: 'targetAccounts', label: 'Target Accounts', value: '85' },
          { id: 'surveyResponses', label: 'Survey Responses', value: '720' },
          { id: 'avgInterestScore', label: 'Avg. Interest Score', value: '78' },
          { id: 'generatedDate', label: 'Generated Date', value: '2025-07-30' },
          { id: 'lastUpdate', label: 'Last Update', value: '2025-07-30 14:30' }
        ]
      },
      {
        id: 'product-interest-scores',
        title: 'Top Product Interest Scores',
        type: 'analytics',
        columns: 2,
        fields: [
          { id: 'cloud-connect', label: 'Cloud Connect', value: '85', percentage: 85, performance: 'excellent' },
          { id: 'sd-wan', label: 'SD-WAN', value: '78', percentage: 78, performance: 'good' },
          { id: 'security-suite', label: 'Security Suite', value: '74', percentage: 74, performance: 'good' },
          { id: 'unified-comm', label: 'Unified Comms', value: '69', percentage: 69, performance: 'fair' }
        ]
      },
      {
        id: 'segment-breakdown',
        title: 'Interest by Segment',
        type: 'chart',
        fields: [
          { id: 'enterprise', label: 'Enterprise', value: 88, percentage: 88, color: '#FF7900' },
          { id: 'smb', label: 'SMB', value: 72, percentage: 72, color: '#FF9933' },
          { id: 'public', label: 'Public Sector', value: 65, percentage: 65, color: '#CC5F00' }
        ]
      },
      {
        id: 'geography-interest',
        title: 'Geographic Interest Heatmap',
        type: 'map',
        width: 2,
        fields: [
          { name: 'EMEA', x: 40, y: 30, value: 82 },
          { name: 'AMERICAS', x: 20, y: 60, value: 76 },
          { name: 'APAC', x: 75, y: 40, value: 70 }
        ]
      }
    ],
    actions: [
      { id: 'drill-down', label: 'Drill-Down Report', type: 'primary', icon: '🔍', action: 'https://crm.orange.com/analytics/product-interest' },
      { id: 'export', label: 'Export Scores', type: 'primary', icon: '📤', action: 'https://crm.orange.com/analytics/export-interest' }
    ]
  },

  // Variant 2: Service Usage Dashboard
  {
    id: 'analytics-service-usage',
    cardTitle: 'Service Usage & Adoption',
    cardSubtitle: 'Customer Usage Metrics',
    cardType: 'Analytics',
    sections: [
      // Priority 1: 2-column overview section
      {
        id: 'analytics-overview',
        title: 'Analytics Overview',
        type: 'info',
        fields: [
          { id: 'reportName', label: 'Report Name', value: 'Service Usage & Adoption' },
          { id: 'reportType', label: 'Report Type', value: 'Usage Analytics' },
          { id: 'activeUsers', label: 'Active Users', value: '14,500' },
          { id: 'avgSessions', label: 'Avg. Sessions/Month', value: '3.2' },
          { id: 'peakLoad', label: 'Peak Concurrent Sessions', value: '2,100' },
          { id: 'reportPeriod', label: 'Report Period', value: 'Q2 2025' },
          { id: 'generatedDate', label: 'Generated Date', value: '2025-07-30' },
          { id: 'nextUpdate', label: 'Next Update', value: '2025-10-30' }
        ]
      },
      {
        id: 'service-by-product',
        title: 'Usage by Product',
        type: 'analytics',
        columns: 2,
        fields: [
          { id: 'cloud-connect', label: 'Cloud Connect', value: '65%', percentage: 65, performance: 'good' },
          { id: 'sd-wan', label: 'SD-WAN', value: '58%', percentage: 58, performance: 'fair' },
          { id: 'security-suite', label: 'Security Suite', value: '47%', percentage: 47, performance: 'fair' },
          { id: 'unified-comm', label: 'Unified Comms', value: '52%', percentage: 52, performance: 'good' }
        ]
      },
      {
        id: 'trend-analysis',
        title: 'Usage Trend (6 Months)',
        type: 'chart',
        fields: [
          { id: 'month1', label: 'Jan', value: 50, color: '#FF7900' },
          { id: 'month2', label: 'Feb', value: 55, color: '#FF7900' },
          { id: 'month3', label: 'Mar', value: 60, color: '#FF7900' },
          { id: 'month4', label: 'Apr', value: 65, color: '#FF7900' },
          { id: 'month5', label: 'May', value: 70, color: '#FF7900' },
          { id: 'month6', label: 'Jun', value: 75, color: '#FF7900' }
        ]
      }
    ],
    actions: [
      { id: 'view-full', label: 'View Full Dashboard', type: 'primary', icon: '📊', action: 'https://crm.orange.com/analytics/service-usage' },
      { id: 'schedule', label: 'Schedule Update', type: 'primary', icon: '⏰', action: 'https://crm.orange.com/analytics/schedule' }
    ]
  }
];

export default analyticsTemplateVariants;