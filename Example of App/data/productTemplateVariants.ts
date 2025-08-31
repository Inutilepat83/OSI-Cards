import { AICardConfig } from '../types';

export const productTemplateVariants: AICardConfig[] = [
  // Variant 1: ICS Firewall As-a-Service
  {
    id: 'product-ics-firewall',
    cardTitle: 'ICS Firewall As-a-Service',
    cardSubtitle: 'Comprehensive Security for Industrial Control Systems',
    cardType: 'Product',
    sections: [
      // Priority 1: 2-column overview section
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
          // Pricing & Packages
          {
            id: 'basic-plan',
            label: 'Basic Plan',
            value: 'Contact Sales - Essential firewall features, basic support',
            category: 'pricing'
          },
          {
            id: 'advanced-plan',
            label: 'Advanced Plan',
            value: 'Contact Sales - Enhanced security features, priority support',
            category: 'pricing'
          },
          {
            id: 'enterprise-plan',
            label: 'Enterprise Plan',
            value: 'Contact Sales - Full suite of security features, dedicated support',
            category: 'pricing'
          },
          
          // Key Features
          {
            id: 'intrusion-detection',
            label: 'Intrusion Detection System',
            value: 'Real-time monitoring and threat detection',
            category: 'features'
          },
          {
            id: 'network-segmentation',
            label: 'Network Segmentation',
            value: 'Isolate critical systems to prevent lateral movement of threats',
            category: 'features'
          },
          {
            id: 'secure-remote-access',
            label: 'Secure Remote Access',
            value: 'VPN and encrypted connections for remote operations',
            category: 'features'
          },
          {
            id: 'compliance-management',
            label: 'Compliance Management',
            value: 'Ensure adherence to industry regulations and standards',
            category: 'features'
          },
          {
            id: 'incident-response',
            label: 'Incident Response',
            value: 'Automated alerts and rapid response protocols',
            category: 'features'
          },
          
          // Sales Process
          {
            id: 'initial-consultation',
            label: 'Initial Consultation',
            value: 'Understand client requirements and security needs',
            category: 'process'
          },
          {
            id: 'custom-demo',
            label: 'Custom Demo',
            value: 'Demonstrate product capabilities tailored to client environment',
            category: 'process'
          },
          {
            id: 'pilot-program',
            label: 'Pilot Program',
            value: '30-day trial with full support',
            category: 'process'
          },
          {
            id: 'full-deployment',
            label: 'Full Deployment',
            value: 'Complete implementation with training and support',
            category: 'process'
          },
          
          // Client References
          {
            id: 'manufacturing-ref',
            label: 'Global Manufacturing Leader',
            value: 'Enhanced security posture and compliance',
            category: 'references',
            reference: {
              company: 'Manufacturing Corp',
              testimonial: 'The ICS Firewall As-a-Service has significantly improved our security and compliance, reducing risks and operational disruptions.'
            }
          },
          {
            id: 'energy-ref',
            label: 'Energy Provider',
            value: 'Improved threat detection and response times',
            category: 'references',
            reference: {
              company: 'Energy Solutions Inc.',
              testimonial: 'Our security operations have become more efficient and effective, thanks to the advanced features of the ICS Firewall.'
            }
          },
          
          // Competitive Advantages
          {
            id: 'real-time-monitoring',
            label: 'Real-Time Monitoring',
            value: 'Continuous threat detection and response',
            category: 'advantages'
          },
          {
            id: 'compliance-support',
            label: 'Compliance Support',
            value: 'Ensures adherence to industry standards',
            category: 'advantages'
          },
          {
            id: 'scalability',
            label: 'Scalability',
            value: 'Flexible deployment options for various industrial environments',
            category: 'advantages'
          },
          
          // Internal Contacts
          {
            id: 'sales-director',
            label: 'Sales Director',
            value: 'Primary sales contact for enterprise deals',
            category: 'contacts',
            contact: {
              name: 'John Doe',
              role: 'Enterprise Sales Director',
              email: 'john.doe@orange.com',
              phone: '+1 123-456-7890'
            }
          },
          {
            id: 'solution-architect',
            label: 'Solution Architect',
            value: 'Technical consultation and implementation planning',
            category: 'contacts',
            contact: {
              name: 'Jane Smith',
              role: 'Principal Solution Architect',
              email: 'jane.smith@orange.com',
              phone: '+1 987-654-3210'
            }
          }
        ]
      },
      {
        id: 'performance-metrics',
        title: 'Performance Metrics',
        type: 'analytics',
        columns: 2,
        fields: [
          {
            id: 'uptime',
            label: 'Service Uptime',
            value: '99.99%',
            percentage: 99,
            performance: 'excellent'
          },
          {
            id: 'response-time',
            label: 'Incident Response Time',
            value: '5 minutes',
            percentage: 95,
            performance: 'excellent'
          },
          {
            id: 'customer-satisfaction',
            label: 'Customer Satisfaction',
            value: '4.7/5.0',
            percentage: 94,
            performance: 'excellent'
          }
        ]
      }
    ],
    actions: [
      {
        id: 'contact-sales',
        label: 'Contact Sales',
        type: 'primary',
        icon: '💼',
        action: 'https://orange.com/contact'
      },
      {
        id: 'request-demo',
        label: 'Request Demo',
        type: 'primary',
        icon: '▶️',
        action: 'https://orange.com/demo'
      }
    ]
  },

  // Variant 2: Connected Store Meraki Business Continuity
  {
    id: 'product-connected-store',
    cardTitle: 'Connected Store Meraki Business Continuity',
    cardSubtitle: 'Reliable Connectivity for Retail Environments',
    cardType: 'Product',
    sections: [
      // Priority 1: 2-column overview section
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
          { id: 'supportLevel', label: 'Support Level', value: '24/7 Enterprise Support' },
          { id: 'releaseDate', label: 'Release Date', value: '2021-01-01' },
          { id: 'version', label: 'Current Version', value: '2.0.0' }
        ]
      },
      {
        id: 'product-details',
        title: 'Product Details',
        type: 'product',
        fields: [
          // Pricing & Packages
          {
            id: 'basic-plan',
            label: 'Basic Plan',
            value: 'Contact Sales - Essential connectivity features, basic support',
            category: 'pricing'
          },
          {
            id: 'advanced-plan',
            label: 'Advanced Plan',
            value: 'Contact Sales - Enhanced connectivity features, priority support',
            category: 'pricing'
          },
          {
            id: 'enterprise-plan',
            label: 'Enterprise Plan',
            value: 'Contact Sales - Full suite of connectivity features, dedicated support',
            category: 'pricing'
          },
          
          // Key Features
          {
            id: 'cellular-backup',
            label: '3/4G Cellular Backup',
            value: 'Ensure continuous connectivity during outages',
            category: 'features'
          },
          {
            id: 'network-management',
            label: 'Centralized Network Management',
            value: 'Manage all store networks from a single dashboard',
            category: 'features'
          },
          {
            id: 'security-features',
            label: 'Advanced Security Features',
            value: 'Protect against cyber threats with built-in security',
            category: 'features'
          },
          {
            id: 'analytics',
            label: 'Real-time Analytics',
            value: 'Monitor network performance and customer behavior',
            category: 'features'
          },
          {
            id: 'scalability',
            label: 'Scalability',
            value: 'Easily expand connectivity to new store locations',
            category: 'features'
          },
          
          // Sales Process
          {
            id: 'initial-consultation',
            label: 'Initial Consultation',
            value: 'Understand client requirements and connectivity needs',
            category: 'process'
          },
          {
            id: 'custom-demo',
            label: 'Custom Demo',
            value: 'Demonstrate product capabilities tailored to client environment',
            category: 'process'
          },
          {
            id: 'pilot-program',
            label: 'Pilot Program',
            value: '30-day trial with full support',
            category: 'process'
          },
          {
            id: 'full-deployment',
            label: 'Full Deployment',
            value: 'Complete implementation with training and support',
            category: 'process'
          },
          
          // Client References
          {
            id: 'retail-chain-ref',
            label: 'Global Retail Chain',
            value: 'Improved network reliability and customer experience',
            category: 'references',
            reference: {
              company: 'Retail Corp',
              testimonial: 'The Connected Store solution has ensured our stores remain connected, even during outages, enhancing customer satisfaction.'
            }
          },
          {
            id: 'boutique-ref',
            label: 'Boutique Store',
            value: 'Enhanced security and network management',
            category: 'references',
            reference: {
              company: 'Boutique Inc.',
              testimonial: 'Our network management has become more efficient and secure, thanks to the advanced features of the Connected Store solution.'
            }
          },
          
          // Competitive Advantages
          {
            id: 'reliability',
            label: 'Reliability',
            value: 'Continuous connectivity with cellular backup',
            category: 'advantages'
          },
          {
            id: 'centralized-management',
            label: 'Centralized Management',
            value: 'Manage all store networks from a single dashboard',
            category: 'advantages'
          },
          {
            id: 'scalability',
            label: 'Scalability',
            value: 'Easily expand connectivity to new store locations',
            category: 'advantages'
          },
          
          // Internal Contacts
          {
            id: 'sales-director',
            label: 'Sales Director',
            value: 'Primary sales contact for enterprise deals',
            category: 'contacts',
            contact: {
              name: 'John Doe',
              role: 'Enterprise Sales Director',
              email: 'john.doe@orange.com',
              phone: '+1 123-456-7890'
            }
          },
          {
            id: 'solution-architect',
            label: 'Solution Architect',
            value: 'Technical consultation and implementation planning',
            category: 'contacts',
            contact: {
              name: 'Jane Smith',
              role: 'Principal Solution Architect',
              email: 'jane.smith@orange.com',
              phone: '+1 987-654-3210'
            }
          }
        ]
      },
      {
        id: 'performance-metrics',
        title: 'Performance Metrics',
        type: 'analytics',
        columns: 2,
        fields: [
          {
            id: 'uptime',
            label: 'Service Uptime',
            value: '99.99%',
            percentage: 99,
            performance: 'excellent'
          },
          {
            id: 'response-time',
            label: 'Incident Response Time',
            value: '5 minutes',
            percentage: 95,
            performance: 'excellent'
          },
          {
            id: 'customer-satisfaction',
            label: 'Customer Satisfaction',
            value: '4.7/5.0',
            percentage: 94,
            performance: 'excellent'
          }
        ]
      }
    ],
    actions: [
      {
        id: 'contact-sales',
        label: 'Contact Sales',
        type: 'primary',
        icon: '💼',
        action: 'https://orange.com/contact'
      },
      {
        id: 'request-demo',
        label: 'Request Demo',
        type: 'primary',
        icon: '▶️',
        action: 'https://orange.com/demo'
      }
    ]
  },

  // Variant 3: Flexible SD-WAN
  {
    id: 'product-flexible-sdwan',
    cardTitle: 'Flexible SD-WAN',
    cardSubtitle: 'Optimized Network Performance and Security',
    cardType: 'Product',
    sections: [
      // Priority 1: 2-column overview section
      {
        id: 'product-overview',
        title: 'Product Overview',
        type: 'info',
        fields: [
          { id: 'productName', label: 'Product Name', value: 'Flexible SD-WAN' },
          { id: 'category', label: 'Category', value: 'Network Optimization' },
          { id: 'industry', label: 'Target Industry', value: 'Enterprise' },
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
          // Pricing & Packages
          {
            id: 'basic-plan',
            label: 'Basic Plan',
            value: 'Contact Sales - Essential SD-WAN features, basic support',
            category: 'pricing'
          },
          {
            id: 'advanced-plan',
            label: 'Advanced Plan',
            value: 'Contact Sales - Enhanced SD-WAN features, priority support',
            category: 'pricing'
          },
          {
            id: 'enterprise-plan',
            label: 'Enterprise Plan',
            value: 'Contact Sales - Full suite of SD-WAN features, dedicated support',
            category: 'pricing'
          },
          
          // Key Features
          {
            id: 'network-optimization',
            label: 'Network Optimization',
            value: 'Dynamic path selection and bandwidth management',
            category: 'features'
          },
          {
            id: 'security-integration',
            label: 'Security Integration',
            value: 'Built-in security features to protect network traffic',
            category: 'features'
          },
          {
            id: 'cloud-connectivity',
            label: 'Cloud Connectivity',
            value: 'Seamless integration with major cloud providers',
            category: 'features'
          },
          {
            id: 'centralized-management',
            label: 'Centralized Management',
            value: 'Single dashboard for network monitoring and management',
            category: 'features'
          },
          {
            id: 'scalability',
            label: 'Scalability',
            value: 'Easily expand network capabilities as business grows',
            category: 'features'
          },
          
          // Sales Process
          {
            id: 'initial-consultation',
            label: 'Initial Consultation',
            value: 'Understand client requirements and network needs',
            category: 'process'
          },
          {
            id: 'custom-demo',
            label: 'Custom Demo',
            value: 'Demonstrate product capabilities tailored to client environment',
            category: 'process'
          },
          {
            id: 'pilot-program',
            label: 'Pilot Program',
            value: '30-day trial with full support',
            category: 'process'
          },
          {
            id: 'full-deployment',
            label: 'Full Deployment',
            value: 'Complete implementation with training and support',
            category: 'process'
          },
          
          // Client References
          {
            id: 'enterprise-ref',
            label: 'Global Enterprise',
            value: 'Improved network performance and security',
            category: 'references',
            reference: {
              company: 'Enterprise Corp',
              testimonial: 'The Flexible SD-WAN solution has optimized our network performance and enhanced security, leading to better business outcomes.'
            }
          },
          {
            id: 'tech-company-ref',
            label: 'Technology Company',
            value: 'Enhanced network efficiency and cost savings',
            category: 'references',
            reference: {
              company: 'Tech Solutions Inc.',
              testimonial: 'Our network operations have become more efficient and cost-effective with the Flexible SD-WAN solution.'
            }
          },
          
          // Competitive Advantages
          {
            id: 'performance',
            label: 'Performance',
            value: 'Optimized network performance with dynamic path selection',
            category: 'advantages'
          },
          {
            id: 'security',
            label: 'Security',
            value: 'Built-in security features to protect network traffic',
            category: 'advantages'
          },
          {
            id: 'scalability',
            label: 'Scalability',
            value: 'Easily expand network capabilities as business grows',
            category: 'advantages'
          },
          
          // Internal Contacts
          {
            id: 'sales-director',
            label: 'Sales Director',
            value: 'Primary sales contact for enterprise deals',
            category: 'contacts',
            contact: {
              name: 'John Doe',
              role: 'Enterprise Sales Director',
              email: 'john.doe@orange.com',
              phone: '+1 123-456-7890'
            }
          },
          {
            id: 'solution-architect',
            label: 'Solution Architect',
            value: 'Technical consultation and implementation planning',
            category: 'contacts',
            contact: {
              name: 'Jane Smith',
              role: 'Principal Solution Architect',
              email: 'jane.smith@orange.com',
              phone: '+1 987-654-3210'
            }
          }
        ]
      },
      {
        id: 'performance-metrics',
        title: 'Performance Metrics',
        type: 'analytics',
        columns: 2,
        fields: [
          {
            id: 'uptime',
            label: 'Service Uptime',
            value: '99.99%',
            percentage: 99,
            performance: 'excellent'
          },
          {
            id: 'response-time',
            label: 'Incident Response Time',
            value: '5 minutes',
            percentage: 95,
            performance: 'excellent'
          },
          {
            id: 'customer-satisfaction',
            label: 'Customer Satisfaction',
            value: '4.7/5.0',
            percentage: 94,
            performance: 'excellent'
          }
        ]
      }
    ],
    actions: [
      {
        id: 'contact-sales',
        label: 'Contact Sales',
        type: 'primary',
        icon: '💼',
        action: 'https://orange.com/contact'
      },
      {
        id: 'request-demo',
        label: 'Request Demo',
        type: 'primary',
        icon: '▶️',
        action: 'https://orange.com/demo'
      }
    ]
  }
];

export default productTemplateVariants;