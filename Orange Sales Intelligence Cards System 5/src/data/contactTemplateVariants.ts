import { AICardConfig } from '../types';

// Orange Business Contact Templates: CRM-Driven Profiles
export const contactTemplateVariants: AICardConfig[] = [
  // Variant 1: CIO Contact
  {
    id: 'contact-cio',
    cardTitle: 'Monica de Jong',
    cardSubtitle: 'Chief Information Officer',
    cardType: 'Contact',
    sections: [
      // Priority 1: 2-column overview section
      {
        id: 'contact-overview',
        title: 'Contact Overview',
        type: 'info',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Monica de Jong' },
          { id: 'title', label: 'Title', value: 'Chief Information Officer' },
          { id: 'company', label: 'Company', value: 'DSM' },
          { id: 'department', label: 'Department', value: 'Information Technology' },
          { id: 'email', label: 'Email', value: 'monica.dejong@dsm.com' },
          { id: 'phone', label: 'Phone', value: '+31 (45) 578-2121' },
          { id: 'location', label: 'Location', value: 'Heerlen, Netherlands' },
          { id: 'languages', label: 'Languages', value: 'English, Dutch' }
        ]
      },
      // Priority 2: CRM summary
      {
        id: 'crm-summary',
        title: 'CRM Profile Summary',
        type: 'info',
        fields: [
          { id: 'contactOwner', label: 'Account Owner', value: 'Alice Martin', status: 'active' },
          { id: 'accountTier', label: 'Account Tier', value: 'Platinum', status: 'active' },
          { id: 'lastInteraction', label: 'Last Interaction', value: '2025-07-15' },
          { id: 'nextTaskDate', label: 'Next Task Date', value: '2025-08-05', status: 'pending' },
          { id: 'leadScore', label: 'Lead Score', value: '95/100', status: 'active' },
          { id: 'relationship', label: 'Relationship Status', value: 'Strategic Partner' }
        ]
      },
      // Priority 3: Contact details
      {
        id: 'contact-details',
        title: 'Contact Information',
        type: 'contact-card',
        fields: [
          { 
            id: 'monica-contact',
            name: 'Monica de Jong',
            role: 'Chief Information Officer',
            email: 'monica.dejong@dsm.com',
            phone: '+31 (45) 578-2121',
            status: 'active',
            department: 'Information Technology',
            location: 'Heerlen, Netherlands'
          }
        ]
      },
      // Priority 4: Engagement analytics
      {
        id: 'engagement-metrics',
        title: 'Engagement Analytics',
        type: 'analytics',
        fields: [
          { 
            id: 'emailOpens', 
            label: 'Email Opens', 
            value: '120', 
            percentage: 80, 
            performance: 'good',
            trend: 'up',
            change: 15
          },
          { 
            id: 'meetingCount', 
            label: 'Meetings Held', 
            value: '8', 
            percentage: 67, 
            performance: 'good',
            trend: 'stable',
            change: 2
          },
          { 
            id: 'responseTime', 
            label: 'Avg. Response Time (hrs)', 
            value: '24', 
            percentage: 50, 
            performance: 'warning',
            trend: 'down',
            change: -5
          },
          { 
            id: 'networkScore', 
            label: 'Network Influence', 
            value: '88', 
            percentage: 88, 
            performance: 'excellent',
            trend: 'up',
            change: 8
          }
        ]
      },
      // Priority 5: Recent interactions
      {
        id: 'interaction-history',
        title: 'Recent Interactions',
        type: 'list',
        fields: [
          { 
            id: 'interaction1', 
            title: 'Cloud Strategy Discussion', 
            description: 'Quarterly review of cloud migration roadmap',
            status: 'completed',
            date: '2025-07-15',
            assignee: 'Alice Martin'
          },
          { 
            id: 'interaction2', 
            title: 'Security Assessment Review', 
            description: 'Annual cybersecurity posture evaluation',
            status: 'in-progress',
            date: '2025-07-22',
            assignee: 'Alice Martin'
          },
          { 
            id: 'interaction3', 
            title: 'Digital Transformation Workshop', 
            description: 'Strategic planning session for Q4 initiatives',
            status: 'pending',
            date: '2025-08-05',
            assignee: 'Alice Martin'
          }
        ]
      }
    ],
    actions: [
      { 
        id: 'log-call', 
        label: 'Log Call', 
        type: 'primary', 
        icon: '📞', 
        action: 'https://crm.orange.com/logcall?contact=monica' 
      },
      { 
        id: 'create-task', 
        label: 'Create Task', 
        type: 'primary', 
        icon: '📝', 
        action: 'https://crm.orange.com/newtask?contact=monica' 
      },
      { 
        id: 'schedule-meeting', 
        label: 'Schedule Meeting', 
        type: 'primary', 
        icon: '📅', 
        action: 'https://calendar.orange.com/schedule?contact=monica' 
      }
    ]
  },

  // Variant 2: Procurement Lead Contact
  {
    id: 'contact-procurement',
    cardTitle: 'Anne-Marie Dupont',
    cardSubtitle: 'Head of Procurement',
    cardType: 'Contact',
    sections: [
      // Priority 1: 2-column overview section
      {
        id: 'contact-overview',
        title: 'Contact Overview',
        type: 'info',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Anne-Marie Dupont' },
          { id: 'title', label: 'Title', value: 'Head of Procurement' },
          { id: 'company', label: 'Company', value: 'AB InBev' },
          { id: 'department', label: 'Department', value: 'Procurement & Supply Chain' },
          { id: 'email', label: 'Email', value: 'anne.dupont@ab-inbev.com' },
          { id: 'phone', label: 'Phone', value: '+32 (16) 33-4444' },
          { id: 'location', label: 'Location', value: 'Leuven, Belgium' },
          { id: 'languages', label: 'Languages', value: 'French, English, Spanish' }
        ]
      },
      // Priority 2: CRM summary
      {
        id: 'crm-summary',
        title: 'CRM Profile Summary',
        type: 'info',
        fields: [
          { id: 'contactOwner', label: 'Account Owner', value: 'Bob Garcia', status: 'active' },
          { id: 'accountTier', label: 'Account Tier', value: 'Gold', status: 'active' },
          { id: 'lastInteraction', label: 'Last Interaction', value: '2025-07-10' },
          { id: 'nextTaskDate', label: 'Next Task Date', value: '2025-08-01', status: 'pending' },
          { id: 'leadScore', label: 'Lead Score', value: '82/100', status: 'active' },
          { id: 'procurement-authority', label: 'Procurement Authority', value: '€5M Budget' }
        ]
      },
      // Priority 3: Contact details
      {
        id: 'contact-details',
        title: 'Contact Information',
        type: 'contact-card',
        fields: [
          { 
            id: 'anne-contact',
            name: 'Anne-Marie Dupont',
            role: 'Head of Procurement',
            email: 'anne.dupont@ab-inbev.com',
            phone: '+32 (16) 33-4444',
            status: 'active',
            department: 'Procurement & Supply Chain',
            location: 'Leuven, Belgium'
          }
        ]
      },
      // Priority 4: Procurement engagement metrics
      {
        id: 'engagement-metrics',
        title: 'Procurement Engagement',
        type: 'analytics',
        fields: [
          { 
            id: 'rfpSubmissions', 
            label: 'RFP Submissions', 
            value: '15', 
            percentage: 75, 
            performance: 'good',
            trend: 'up',
            change: 25
          },
          { 
            id: 'responseRate', 
            label: 'Response Rate', 
            value: '65%', 
            percentage: 65, 
            performance: 'good',
            trend: 'stable',
            change: 3
          },
          { 
            id: 'vendorMeetings', 
            label: 'Vendor Meetings', 
            value: '5', 
            percentage: 42, 
            performance: 'warning',
            trend: 'down',
            change: -2
          },
          { 
            id: 'procurementInfluence', 
            label: 'Procurement Influence', 
            value: '72', 
            percentage: 72, 
            performance: 'good',
            trend: 'up',
            change: 6
          }
        ]
      },
      // Priority 5: Procurement activities
      {
        id: 'procurement-activities',
        title: 'Procurement Activities',
        type: 'list',
        fields: [
          { 
            id: 'activity1', 
            title: 'Global Network RFP', 
            description: 'Multi-year global network services procurement',
            status: 'in-progress',
            date: '2025-08-15',
            assignee: 'Bob Garcia',
            value: '€12M'
          },
          { 
            id: 'activity2', 
            title: 'Cloud Services Evaluation', 
            description: 'Assessment of hybrid cloud solutions',
            status: 'pending',
            date: '2025-09-01',
            assignee: 'Bob Garcia',
            value: '€8M'
          },
          { 
            id: 'activity3', 
            title: 'Security Solutions Review', 
            description: 'Cybersecurity vendor assessment',
            status: 'pending',
            date: '2025-09-15',
            assignee: 'Bob Garcia',
            value: '€3M'
          }
        ]
      }
    ],
    actions: [
      { 
        id: 'log-call', 
        label: 'Log Call', 
        type: 'primary', 
        icon: '📞', 
        action: 'https://crm.orange.com/logcall?contact=anne' 
      },
      { 
        id: 'submit-proposal', 
        label: 'Submit Proposal', 
        type: 'primary', 
        icon: '📋', 
        action: 'https://crm.orange.com/proposal?contact=anne' 
      },
      { 
        id: 'create-task', 
        label: 'Create Task', 
        type: 'primary', 
        icon: '📝', 
        action: 'https://crm.orange.com/newtask?contact=anne' 
      }
    ]
  },

  // Variant 3: Network Operations Contact
  {
    id: 'contact-network',
    cardTitle: 'Olivier Lefevre',
    cardSubtitle: 'Network Operations Manager',
    cardType: 'Contact',
    sections: [
      // Priority 1: 2-column overview section
      {
        id: 'contact-overview',
        title: 'Contact Overview',
        type: 'info',
        fields: [
          { id: 'name', label: 'Full Name', value: 'Olivier Lefevre' },
          { id: 'title', label: 'Title', value: 'Network Operations Manager' },
          { id: 'company', label: 'Company', value: 'Akzo Nobel' },
          { id: 'department', label: 'Department', value: 'IT Operations' },
          { id: 'email', label: 'Email', value: 'olivier.lefevre@akzonobel.com' },
          { id: 'phone', label: 'Phone', value: '+31 (20) 567-8901' },
          { id: 'location', label: 'Location', value: 'Amsterdam, Netherlands' },
          { id: 'certifications', label: 'Certifications', value: 'CISSP, CCNP' }
        ]
      },
      // Priority 2: CRM summary
      {
        id: 'crm-summary',
        title: 'CRM Profile Summary',
        type: 'info',
        fields: [
          { id: 'contactOwner', label: 'Account Owner', value: 'Clara Nguyen', status: 'active' },
          { id: 'accountTier', label: 'Account Tier', value: 'Silver', status: 'active' },
          { id: 'lastInteraction', label: 'Last Interaction', value: '2025-07-20' },
          { id: 'nextTaskDate', label: 'Next Task Date', value: '2025-08-07', status: 'pending' },
          { id: 'leadScore', label: 'Lead Score', value: '78/100', status: 'active' },
          { id: 'technical-expertise', label: 'Technical Expertise', value: 'Network Architecture' }
        ]
      },
      // Priority 3: Contact details
      {
        id: 'contact-details',
        title: 'Contact Information',
        type: 'contact-card',
        fields: [
          { 
            id: 'olivier-contact',
            name: 'Olivier Lefevre',
            role: 'Network Operations Manager',
            email: 'olivier.lefevre@akzonobel.com',
            phone: '+31 (20) 567-8901',
            status: 'active',
            department: 'IT Operations',
            location: 'Amsterdam, Netherlands'
          }
        ]
      },
      // Priority 4: Technical performance metrics
      {
        id: 'technical-metrics',
        title: 'Technical Performance',
        type: 'analytics',
        fields: [
          { 
            id: 'networkUptime', 
            label: 'Network Uptime', 
            value: '99.8%', 
            percentage: 98, 
            performance: 'excellent',
            trend: 'up',
            change: 2
          },
          { 
            id: 'incidentResponse', 
            label: 'Incident Response Time', 
            value: '15 min', 
            percentage: 85, 
            performance: 'excellent',
            trend: 'down',
            change: -3
          },
          { 
            id: 'securityAlerts', 
            label: 'Security Alerts', 
            value: '2', 
            percentage: 90, 
            performance: 'excellent',
            trend: 'down',
            change: -5
          },
          { 
            id: 'teamCollaboration', 
            label: 'Team Collaboration', 
            value: '80', 
            percentage: 80, 
            performance: 'good',
            trend: 'up',
            change: 10
          }
        ]
      },
      // Priority 5: Active network projects
      {
        id: 'network-projects',
        title: 'Active Network Projects',
        type: 'list',
        fields: [
          { 
            id: 'project1', 
            title: 'SD-WAN Migration', 
            description: 'Migrating legacy MPLS to SD-WAN infrastructure',
            status: 'in-progress',
            date: '2025-09-30',
            assignee: 'Clara Nguyen',
            priority: 'high'
          },
          { 
            id: 'project2', 
            title: 'Network Security Upgrade', 
            description: 'Implementing next-gen firewall solutions',
            status: 'pending',
            date: '2025-10-15',
            assignee: 'Clara Nguyen',
            priority: 'medium'
          },
          { 
            id: 'project3', 
            title: 'Bandwidth Optimization', 
            description: 'Optimizing network bandwidth usage across sites',
            status: 'completed',
            date: '2025-07-15',
            assignee: 'Clara Nguyen',
            priority: 'medium'
          }
        ]
      }
    ],
    actions: [
      { 
        id: 'log-call', 
        label: 'Log Call', 
        type: 'primary', 
        icon: '📞', 
        action: 'https://crm.orange.com/logcall?contact=olivier' 
      },
      { 
        id: 'technical-review', 
        label: 'Technical Review', 
        type: 'primary', 
        icon: '🔧', 
        action: 'https://crm.orange.com/technical?contact=olivier' 
      },
      { 
        id: 'create-task', 
        label: 'Create Task', 
        type: 'primary', 
        icon: '📝', 
        action: 'https://crm.orange.com/newtask?contact=olivier' 
      }
    ]
  }
];

export default contactTemplateVariants;