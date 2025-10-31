import { AICardConfig } from '../../models';

export const productTemplateVariants: AICardConfig[] = [
  {
    id: 'product-ics-firewall',
    cardTitle: 'ICS Firewall As-a-Service',
    cardSubtitle: 'Comprehensive Security for Industrial Control Systems',
    cardType: 'product',
    sections: [
      {
        id: 'product-overview',
        title: 'Product Overview',
        type: 'info',
        fields: [
          { id: 'productName', label: 'Product Name', value: 'ICS Firewall As-a-Service' },
          { id: 'category', label: 'Category', value: 'Industrial Security' },
          { id: 'industry', label: 'Target Industry', value: 'Manufacturing, Energy, Utilities' },
          { id: 'deployment', label: 'Deployment', value: 'Cloud & On-premise' },
          { id: 'pricing', label: 'Starting Price', value: 'Contact Sales' },
          { id: 'supportLevel', label: 'Support Level', value: '24/7 Enterprise Support' },
          { id: 'releaseDate', label: 'Release Date', value: '2020-01-01' },
          { id: 'version', label: 'Current Version', value: '1.3.0' }
        ]
      },
      {
        id: 'product-details',
        title: 'Product Details',
        type: 'product',
        fields: [
          { id: 'basic-plan', label: 'Basic Plan', value: 'Contact Sales - Essential firewall features, basic support', category: 'pricing' },
          { id: 'advanced-plan', label: 'Advanced Plan', value: 'Contact Sales - Enhanced security features, priority support', category: 'pricing' },
          { id: 'enterprise-plan', label: 'Enterprise Plan', value: 'Contact Sales - Full suite of security features, dedicated support', category: 'pricing' },
          { id: 'intrusion-detection', label: 'Intrusion Detection System', value: 'Real-time monitoring and threat detection', category: 'features' },
          { id: 'network-segmentation', label: 'Network Segmentation', value: 'Isolate critical systems to prevent lateral movement of threats', category: 'features' },
          { id: 'secure-remote-access', label: 'Secure Remote Access', value: 'VPN and encrypted connections for remote operations', category: 'features' }
        ]
      },
      {
        id: 'performance-metrics',
        title: 'Performance Metrics',
        type: 'analytics',
        fields: [
          { id: 'uptime', label: 'Service Uptime', value: '99.99%', percentage: 99, performance: 'excellent' },
          { id: 'response-time', label: 'Incident Response Time', value: '5 minutes', percentage: 95, performance: 'excellent' },
          { id: 'customer-satisfaction', label: 'Customer Satisfaction', value: '4.7/5.0', percentage: 94, performance: 'excellent' }
        ]
      }
    ],
    actions: [
      { id: 'contact-sales', label: 'Contact Sales', type: 'primary', icon: '💼', action: 'https://orange.com/contact' },
      { id: 'request-demo', label: 'Request Demo', type: 'primary', icon: '▶️', action: 'https://orange.com/demo' }
    ]
  },
  {
    id: 'product-connected-store',
    cardTitle: 'Connected Store Meraki Business Continuity',
    cardSubtitle: 'Reliable Connectivity for Retail Environments',
    cardType: 'product',
    sections: [
      {
        id: 'product-overview',
        title: 'Product Overview',
        type: 'info',
        fields: [
          { id: 'productName', label: 'Product Name', value: 'Connected Store Meraki Business Continuity' },
          { id: 'category', label: 'Category', value: 'Retail Connectivity' },
          { id: 'industry', label: 'Target Industry', value: 'Retail' },
          { id: 'deployment', label: 'Deployment', value: 'Cloud & On-premise' },
          { id: 'pricing', label: 'Starting Price', value: 'Contact Sales' },
          { id: 'supportLevel', label: 'Support Level', value: '24/7 Enterprise Support' }
        ]
      },
      {
        id: 'product-details',
        title: 'Product Details',
        type: 'product',
        fields: [
          { id: 'cellular-backup', label: '3/4G Cellular Backup', value: 'Ensure continuous connectivity during outages', category: 'features' },
          { id: 'network-management', label: 'Centralized Network Management', value: 'Manage all store networks from a single dashboard', category: 'features' },
          { id: 'security-features', label: 'Advanced Security Features', value: 'Protect against cyber threats with built-in security', category: 'features' }
        ]
      },
      {
        id: 'performance-metrics',
        title: 'Performance Metrics',
        type: 'analytics',
        fields: [
          { id: 'uptime', label: 'Service Uptime', value: '99.99%', percentage: 99, performance: 'excellent' },
          { id: 'customer-satisfaction', label: 'Customer Satisfaction', value: '4.7/5.0', percentage: 94, performance: 'excellent' }
        ]
      }
    ],
    actions: [
      { id: 'contact-sales', label: 'Contact Sales', type: 'primary', icon: '💼', action: 'https://orange.com/contact' },
      { id: 'request-demo', label: 'Request Demo', type: 'primary', icon: '▶️', action: 'https://orange.com/demo' }
    ]
  },
  {
    id: 'product-flexible-sdwan',
    cardTitle: 'Flexible SD-WAN',
    cardSubtitle: 'Optimized Network Performance and Security',
    cardType: 'product',
    sections: [
      {
        id: 'product-overview',
        title: 'Product Overview',
        type: 'info',
        fields: [
          { id: 'productName', label: 'Product Name', value: 'Flexible SD-WAN' },
          { id: 'category', label: 'Category', value: 'Network Optimization' },
          { id: 'industry', label: 'Target Industry', value: 'Enterprise' },
          { id: 'deployment', label: 'Deployment', value: 'Cloud & On-premise' },
          { id: 'pricing', label: 'Starting Price', value: 'Contact Sales' }
        ]
      },
      {
        id: 'product-details',
        title: 'Product Details',
        type: 'product',
        fields: [
          { id: 'network-optimization', label: 'Network Optimization', value: 'Dynamic path selection and bandwidth management', category: 'features' },
          { id: 'security-integration', label: 'Security Integration', value: 'Built-in security features to protect network traffic', category: 'features' },
          { id: 'cloud-connectivity', label: 'Cloud Connectivity', value: 'Seamless integration with major cloud providers', category: 'features' }
        ]
      },
      {
        id: 'performance-metrics',
        title: 'Performance Metrics',
        type: 'analytics',
        fields: [
          { id: 'uptime', label: 'Service Uptime', value: '99.99%', percentage: 99, performance: 'excellent' },
          { id: 'response-time', label: 'Incident Response Time', value: '5 minutes', percentage: 95, performance: 'excellent' }
        ]
      }
    ],
    actions: [
      { id: 'contact-sales', label: 'Contact Sales', type: 'primary', icon: '💼', action: 'https://orange.com/contact' },
      { id: 'request-demo', label: 'Request Demo', type: 'primary', icon: '▶️', action: 'https://orange.com/demo' }
    ]
  }
];

export default productTemplateVariants;
