import { AICardConfig } from '../../models';

export const eventTemplateVariants: AICardConfig[] = [
  {
    id: 'event-qbr-dsm',
    cardTitle: 'DSM Quarterly Business Review',
    cardSubtitle: 'Q3 2025 Client Performance & Roadmap',
    cardType: 'event',
    sections: [
      {
        id: 'event-overview',
        title: 'Event Overview',
        type: 'info',
        fields: [
          { id: 'eventName', label: 'Event Name', value: 'DSM Quarterly Business Review' },
          { id: 'eventType', label: 'Event Type', value: 'Client QBR' },
          { id: 'date', label: 'Date', value: '2025-08-20' },
          { id: 'time', label: 'Time', value: '10:00 AM - 12:00 PM CEST' },
          { id: 'location', label: 'Location', value: 'DSM HQ, Heerlen & Teams' },
          { id: 'format', label: 'Format', value: 'Hybrid' },
          { id: 'attendees', label: 'Attendees', value: 'Monica de Jong, Alice Martin, Pierre Dupont' },
          { id: 'status', label: 'Status', value: 'Confirmed' }
        ]
      },
      {
        id: 'performance-metrics',
        title: 'Key Performance Metrics',
        type: 'analytics',
        fields: [
          { id: 'connectivity-uptime', label: 'Network Uptime', value: '99.95%', percentage: 99, performance: 'excellent', trend: 'up', change: 0.05 },
          { id: 'ticket-resolution', label: 'Ticket Resolution Rate', value: '98%', percentage: 98, performance: 'excellent', trend: 'up', change: 3 },
          { id: 'sla-compliance', label: 'SLA Compliance', value: '100%', percentage: 100, performance: 'excellent', trend: 'stable', change: 0 },
          { id: 'csat-score', label: 'CSAT Score', value: '92%', percentage: 92, performance: 'excellent', trend: 'up', change: 5 }
        ]
      },
      {
        id: 'roadmap',
        title: 'Upcoming Initiatives',
        type: 'list',
        fields: [
          { id: 'sdwan-rollout', title: 'SD-WAN Rollout Phase II', value: 'Oct 2025', status: 'pending' },
          { id: 'cloud-optimization', title: 'Cloud Cost Optimization', value: 'Nov 2025', status: 'pending' },
          { id: 'security-enhancements', title: 'Enhanced Security Suite', value: 'Dec 2025', status: 'pending' }
        ]
      }
    ],
    actions: [
      { id: 'view-report', label: 'View QBR Deck', type: 'primary', icon: '📄', action: 'https://ob.orange.com/qbr/dsm' },
      { id: 'schedule-followup', label: 'Schedule Follow-Up', type: 'primary', icon: '📅', action: 'https://ob.orange.com/schedule/qbr-dsm' }
    ]
  },
  {
    id: 'event-maintenance-abinbev',
    cardTitle: 'AB InBev Network Maintenance',
    cardSubtitle: 'Global MPLS & SD-WAN Maintenance',
    cardType: 'event',
    sections: [
      {
        id: 'event-overview',
        title: 'Event Overview',
        type: 'info',
        fields: [
          { id: 'eventName', label: 'Event Name', value: 'AB InBev Network Maintenance' },
          { id: 'eventType', label: 'Event Type', value: 'Planned Maintenance' },
          { id: 'start', label: 'Start', value: '2025-08-15 22:00 CEST' },
          { id: 'end', label: 'End', value: '2025-08-16 04:00 CEST' },
          { id: 'duration', label: 'Duration', value: '6 hours' },
          { id: 'systems', label: 'Affected Systems', value: 'MPLS, SD-WAN Management' },
          { id: 'impact', label: 'Expected Impact', value: 'Intermittent Connectivity' },
          { id: 'support', label: 'Support Contact', value: '24/7 NOC' }
        ]
      },
      {
        id: 'pre-checks',
        title: 'Pre-Maintenance Checklist',
        type: 'list',
        fields: [
          { id: 'backup', title: 'Backup Configs', value: 'Completed', status: 'completed' },
          { id: 'notify', title: 'Notify Stakeholders', value: 'Sent 2025-08-10', status: 'completed' },
          { id: 'failover', title: 'Failover Test', value: 'Passed', status: 'completed' }
        ]
      },
      {
        id: 'post-checks',
        title: 'Post-Maintenance Validation',
        type: 'list',
        fields: [
          { id: 'connectivity-test', title: 'Connectivity Test', value: 'Pending', status: 'pending' },
          { id: 'sla-verification', title: 'SLA Verification', value: 'Pending', status: 'pending' }
        ]
      }
    ],
    actions: [
      { id: 'view-ops', label: 'View Ops Dashboard', type: 'primary', icon: '🔧', action: 'https://ob.orange.com/maintenance/abinbev' },
      { id: 'raise-issue', label: 'Report Issue', type: 'primary', icon: '🐞', action: 'https://ob.orange.com/issue/new' }
    ]
  },
  {
    id: 'event-innovation-akzo',
    cardTitle: 'Akzo Nobel Innovation Workshop',
    cardSubtitle: 'Sustainable Coatings & IoT Monitoring',
    cardType: 'event',
    sections: [
      {
        id: 'event-overview',
        title: 'Event Overview',
        type: 'info',
        fields: [
          { id: 'eventName', label: 'Event Name', value: 'Akzo Nobel Innovation Workshop' },
          { id: 'eventType', label: 'Event Type', value: 'Innovation Workshop' },
          { id: 'date', label: 'Date', value: '2025-09-10' },
          { id: 'time', label: 'Time', value: '09:00 AM - 1:00 PM CEST' },
          { id: 'duration', label: 'Duration', value: '4 hours' },
          { id: 'location', label: 'Location', value: 'Akzo R&D Center, Amsterdam' },
          { id: 'facilitator', label: 'Facilitator', value: 'OB Innovation Team' },
          { id: 'participants', label: 'Participants', value: '10 R&D Engineers' }
        ]
      },
      {
        id: 'agenda',
        title: 'Agenda',
        type: 'list',
        fields: [
          { id: 'intro', title: 'Intro & Objectives', value: '15 min', status: 'pending' },
          { id: 'session1', title: 'IoT Monitoring', value: '40 min', status: 'pending' },
          { id: 'session2', title: 'Data Analytics', value: '40 min', status: 'pending' },
          { id: 'wrapup', title: 'Action Items', value: '25 min', status: 'pending' }
        ]
      },
      {
        id: 'materials',
        title: 'Materials Provided',
        type: 'list',
        fields: [
          { id: 'demo-kits', title: 'IoT Kits', value: 'Provided', status: 'completed' },
          { id: 'dashboard-access', title: 'OB Dashboard', value: '1-year Access', status: 'completed' }
        ]
      }
    ],
    actions: [
      { id: 'view-prework', label: 'View Prework', type: 'primary', icon: '📚', action: 'https://ob.orange.com/workshops/innovation/prework' },
      { id: 'feedback', label: 'Give Feedback', type: 'primary', icon: '🗒️', action: 'https://ob.orange.com/workshops/feedback' }
    ]
  }
];

export default eventTemplateVariants;
