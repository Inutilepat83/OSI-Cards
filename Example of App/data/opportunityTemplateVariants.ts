import { AICardConfig } from '../types';

// Orange Business Opportunity Templates: CRM-Driven & Service-Focused
export const opportunityTemplateVariants: AICardConfig[] = [
  // Variant 1: Enterprise Connectivity Deal
  {
    id: 'opportunity-enterprise-connectivity',
    cardTitle: 'Enterprise Connectivity Deployment',
    cardSubtitle: 'Global MPLS Expansion',
    cardType: 'Opportunity',
    sections: [
      // Priority 1: 2-column overview section
      {
        id: 'opportunity-overview',
        title: 'Opportunity Overview',
        type: 'info',
        fields: [
          { id: 'opportunityName', label: 'Opportunity Name', value: 'Enterprise Connectivity Deployment' },
          { id: 'opportunityOwner', label: 'Opportunity Owner', value: 'Pierre Dupont' },
          { id: 'account', label: 'Account', value: 'DSM' },
          { id: 'stage', label: 'Stage', value: 'Proposal', status: 'pending' },
          { id: 'value', label: 'Deal Value', value: '€3.8M' },
          { id: 'closeDate', label: 'Expected Close', value: '2025-09-30' },
          { id: 'winProbability', label: 'Win Probability', value: '78%' },
          { id: 'competitorCount', label: 'Competitors', value: '2 Active' }
        ]
      },
      // Priority 2: Products & Services
      {
        id: 'product-services',
        title: 'Products & Services',
        type: 'list',
        fields: [
          { id: 'mpls', title: 'Global MPLS', value: '200 Sites', status: 'active' },
          { id: 'sdwan', title: 'SD-WAN', value: '80 Sites', status: 'active' },
          { id: 'cloudConnect', title: 'Cloud Connect', value: 'AWS & Azure', status: 'active' }
        ]
      },
      // Priority 3: Engagement metrics
      {
        id: 'engagement-metrics',
        title: 'Engagement Metrics',
        type: 'analytics',
        fields: [
          { id: 'meetingsHeld', label: 'Meetings Held', value: '6', percentage: 60, performance: 'good', trend: 'up', change: 2 },
          { id: 'emailOpens', label: 'Email Opens', value: '220', percentage: 90, performance: 'excellent', trend: 'up', change: 15 },
          { id: 'responseRate', label: 'Response Rate', value: '68%', percentage: 68, performance: 'good', trend: 'stable', change: 3 },
          { id: 'demoRequests', label: 'Demo Requests', value: '3', percentage: 50, performance: 'warning', trend: 'down', change: -1 }
        ]
      },
      // Priority 4: Contract details
      {
        id: 'contract-details',
        title: 'Contract & Pricing',
        type: 'info',
        fields: [
          { id: 'contractType', label: 'Contract Type', value: '3-year term' },
          { id: 'paymentTerms', label: 'Payment Terms', value: 'Net 60' },
          { id: 'discount', label: 'Negotiated Discount', value: '12%' }
        ]
      }
    ],
    actions: [
      { id: 'view-proposal', label: 'View Proposal', type: 'primary', icon: '📄', action: 'https://crm.orange.com/opps/enterprise-connectivity' },
      { id: 'schedule-call', label: 'Schedule Call', type: 'primary', icon: '📞', action: 'https://crm.orange.com/opps/book?opp=enterprise-connectivity' }
    ]
  },

  // Variant 2: Cloud Migration Opportunity
  {
    id: 'opportunity-cloud-migration',
    cardTitle: 'Multi-Cloud Migration',
    cardSubtitle: 'IaaS & PaaS Consolidation',
    cardType: 'Opportunity',
    sections: [
      // Priority 1: 2-column overview section
      {
        id: 'opportunity-overview',
        title: 'Opportunity Overview',
        type: 'info',
        fields: [
          { id: 'opportunityName', label: 'Opportunity Name', value: 'Multi-Cloud Migration' },
          { id: 'opportunityOwner', label: 'Opportunity Owner', value: 'Sophie Laurent' },
          { id: 'account', label: 'Account', value: 'AB InBev' },
          { id: 'stage', label: 'Stage', value: 'Negotiation', status: 'active' },
          { id: 'value', label: 'Deal Value', value: '€1.1M' },
          { id: 'closeDate', label: 'Expected Close', value: '2025-08-15' },
          { id: 'winProbability', label: 'Win Probability', value: '82%' },
          { id: 'projectDuration', label: 'Project Duration', value: '18 months' }
        ]
      },
      // Priority 2: Cloud breakdown
      {
        id: 'cloud-breakdown',
        title: 'Cloud Service Breakdown',
        type: 'list',
        fields: [
          { id: 'iaas', title: 'IaaS', value: '60%', status: 'active' },
          { id: 'paas', title: 'PaaS', value: '25%', status: 'active' },
          { id: 'saas', title: 'SaaS', value: '15%', status: 'active' }
        ]
      },
      // Priority 3: Technical fit
      {
        id: 'technical-fit',
        title: 'Technical Fit & Risk',
        type: 'analytics',
        fields: [
          { id: 'fitScore', label: 'Fit Score', value: '88%', percentage: 88, performance: 'excellent', trend: 'up', change: 5 },
          { id: 'riskLevel', label: 'Risk Level', value: 'Medium', percentage: 50, performance: 'warning', trend: 'stable', change: 0 },
          { id: 'compliance', label: 'Compliance Ready', value: 'GDPR, ISO27001', percentage: 85, performance: 'good', trend: 'up', change: 10 },
          { id: 'integration', label: 'Integration Complexity', value: 'Moderate', percentage: 60, performance: 'warning', trend: 'stable', change: 0 }
        ]
      },
      // Priority 4: Recent activity
      {
        id: 'recent-activity',
        title: 'Recent Activity',
        type: 'list',
        fields: [
          { id: 'lastEmail', title: 'Last Email', value: '2025-07-22', status: 'completed' },
          { id: 'lastMeeting', title: 'Last Meeting', value: '2025-07-25', status: 'completed' },
          { id: 'nextAction', title: 'Next Action', value: 'Finalize SOW', status: 'pending' }
        ]
      }
    ],
    actions: [
      { id: 'view-docs', label: 'View Documents', type: 'primary', icon: '📂', action: 'https://crm.orange.com/opps/cloud-migration/docs' },
      { id: 'assign-task', label: 'Assign Task', type: 'primary', icon: '📝', action: 'https://crm.orange.com/opps/task/new?opp=cloud-migration' }
    ]
  },

  // Variant 3: Security Assessment Engagement
  {
    id: 'opportunity-security-assessment',
    cardTitle: 'Enterprise Security Assessment',
    cardSubtitle: 'Comprehensive Security Audit',
    cardType: 'Opportunity',
    sections: [
      // Priority 1: 2-column overview section
      {
        id: 'opportunity-overview',
        title: 'Opportunity Overview',
        type: 'info',
        fields: [
          { id: 'opportunityName', label: 'Opportunity Name', value: 'Enterprise Security Assessment' },
          { id: 'opportunityOwner', label: 'Opportunity Owner', value: 'Marc Renault' },
          { id: 'account', label: 'Account', value: 'Akzo Nobel' },
          { id: 'stage', label: 'Stage', value: 'Qualification', status: 'active' },
          { id: 'value', label: 'Deal Value', value: '€650K' },
          { id: 'closeDate', label: 'Expected Close', value: '2025-10-20' },
          { id: 'winProbability', label: 'Win Probability', value: '68%' },
          { id: 'assessmentType', label: 'Assessment Type', value: 'Comprehensive' }
        ]
      },
      // Priority 2: Assessment scope
      {
        id: 'service-scope',
        title: 'Assessment Scope',
        type: 'info',
        fields: [
          { id: 'networkAudit', label: 'Network Audit', value: 'Full Review' },
          { id: 'cloudAudit', label: 'Cloud Audit', value: 'IaaS & SaaS' },
          { id: 'complianceCheck', label: 'Compliance Check', value: 'GDPR, PCI-DSS' }
        ]
      },
      // Priority 3: Risk metrics
      {
        id: 'risk-metrics',
        title: 'Risk Metrics',
        type: 'analytics',
        fields: [
          { id: 'threatScore', label: 'Threat Score', value: '72%', percentage: 72, performance: 'good', trend: 'up', change: 8 },
          { id: 'vulnCount', label: 'Vulnerabilities Found', value: '15', percentage: 50, performance: 'warning', trend: 'down', change: -3 },
          { id: 'remediationReadiness', label: 'Remediation Readiness', value: 'Medium', percentage: 60, performance: 'warning', trend: 'up', change: 5 },
          { id: 'engagementScore', label: 'Engagement Score', value: '85%', percentage: 85, performance: 'excellent', trend: 'up', change: 12 }
        ]
      },
      // Priority 4: Next steps
      {
        id: 'next-steps',
        title: 'Next Steps',
        type: 'list',
        fields: [
          { id: 'proposalSent', title: 'Proposal Sent', value: '2025-07-28', status: 'completed' },
          { id: 'feedbackReceived', title: 'Client Feedback', value: 'Pending', status: 'pending' },
          { id: 'scheduleWorkshop', title: 'Schedule Workshop', value: 'TBD', status: 'pending' }
        ]
      }
    ],
    actions: [
      { id: 'download-report', label: 'Download Report', type: 'primary', icon: '📥', action: 'https://crm.orange.com/opps/security-assessment/report' },
      { id: 'create-note', label: 'Add CRM Note', type: 'primary', icon: '🗒️', action: 'https://crm.orange.com/opps/note/new?opp=security-assessment' }
    ]
  }
];

export default opportunityTemplateVariants;