import { AICardConfig } from '../../models';

export const projectTemplateVariants: AICardConfig[] = [
  {
    id: 'project-mobile-app-redesign',
    cardTitle: 'Mobile App Redesign',
    cardSubtitle: 'UI/UX Improvement Initiative',
    cardType: 'project',
    sections: [
      {
        id: 'project-overview',
        title: 'Project Overview',
        type: 'info',
        fields: [
          { id: 'project-manager', label: 'Project Manager', value: 'Sarah Johnson' },
          { id: 'start-date', label: 'Start Date', value: '2024-08-01' },
          { id: 'end-date', label: 'Target Completion', value: '2024-11-30' },
          { id: 'status', label: 'Current Status', value: 'On Track' }
        ]
      },
      {
        id: 'team-members',
        title: 'Project Team',
        type: 'list',
        fields: [
          { id: 'pm', title: 'Sarah Johnson', value: 'Project Manager' },
          { id: 'lead-designer', title: 'Mike Chen', value: 'Lead Designer' },
          { id: 'dev', title: 'Alex Rodriguez', value: 'Senior Developer' },
          { id: 'qa', title: 'Emma Davis', value: 'QA Engineer' }
        ]
      },
      {
        id: 'key-milestones',
        title: 'Key Milestones',
        type: 'list',
        fields: [
          { id: 'design-complete', title: 'Design Phase Complete', value: 'Wireframes and mockups finalized' },
          { id: 'dev-started', title: 'Development Started', value: 'Core functionality implementation begun' },
          { id: 'beta-testing', title: 'Beta Testing', value: 'Internal testing phase scheduled' },
          { id: 'launch-prep', title: 'Launch Preparation', value: 'Final testing and deployment prep' }
        ]
      },
      {
        id: 'current-progress',
        title: 'Current Progress',
        type: 'analytics',
        fields: [
          { id: 'completion', label: 'Overall Completion', value: '65%', percentage: 65, trend: 'up', change: 5 },
          { id: 'days-remaining', label: 'Days Remaining', value: '45 days', percentage: 45, trend: 'down', change: -1 },
          { id: 'budget-used', label: 'Budget Utilized', value: '78.5%', percentage: 78, trend: 'up', change: 2 }
        ]
      }
    ],
    actions: [
      { id: 'view-details', label: 'View Details', type: 'primary' },
      { id: 'update-progress', label: 'Update Progress', type: 'secondary' },
      { id: 'schedule-meeting', label: 'Schedule Meeting', type: 'secondary' }
    ]
  },
  {
    id: 'project-analytics-dashboard',
    cardTitle: 'Project Analytics Dashboard',
    cardSubtitle: 'Multi-project Performance Tracking',
    cardType: 'project',
    sections: [
      {
        id: 'project-metrics',
        title: 'Project Metrics',
        type: 'analytics',
        fields: [
          { id: 'total-projects', label: 'Total Projects', value: '12', percentage: 100, trend: 'stable', change: 0 },
          { id: 'on-track', label: 'On Track', value: '10', percentage: 83, trend: 'up', change: 2 },
          { id: 'at-risk', label: 'At Risk', value: '2', percentage: 17, trend: 'down', change: -1 },
          { id: 'completed', label: 'Completed This Quarter', value: '4', percentage: 100, trend: 'up', change: 4 }
        ]
      },
      {
        id: 'resource-allocation',
        title: 'Resource Allocation',
        type: 'list',
        fields: [
          { id: 'dev-team', title: 'Development Team', value: '8 members' },
          { id: 'design-team', title: 'Design Team', value: '3 members' },
          { id: 'qa-team', title: 'QA Team', value: '2 members' },
          { id: 'pm-team', title: 'Project Managers', value: '2 members' }
        ]
      },
      {
        id: 'budget-overview',
        title: 'Budget Overview',
        type: 'analytics',
        fields: [
          { id: 'total-budget', label: 'Total Budget', value: '$1.2M', percentage: 100, trend: 'stable', change: 0 },
          { id: 'spent', label: 'Spent to Date', value: '$850K', percentage: 71, trend: 'up', change: 3 },
          { id: 'remaining', label: 'Remaining Budget', value: '$350K', percentage: 29, trend: 'down', change: -3 },
          { id: 'roi', label: 'Projected ROI', value: '245%', percentage: 100, trend: 'up', change: 12 }
        ]
      }
    ],
    actions: [
      { id: 'view-all-projects', label: 'View All Projects', type: 'primary' },
      { id: 'export-report', label: 'Export Report', type: 'secondary' }
    ]
  },
  {
    id: 'project-management-dashboard',
    cardTitle: 'Project Management Dashboard',
    cardSubtitle: 'Enterprise Project Portfolio Overview',
    cardType: 'project',
    sections: [
      {
        id: 'portfolio-status',
        title: 'Portfolio Status',
        type: 'analytics',
        fields: [
          { id: 'active-projects', label: 'Active Projects', value: '18', percentage: 100, trend: 'up', change: 2 },
          { id: 'on-schedule', label: 'On Schedule', value: '16', percentage: 89, trend: 'up', change: 1 },
          { id: 'delayed', label: 'Delayed', value: '2', percentage: 11, trend: 'up', change: 1 },
          { id: 'health-score', label: 'Portfolio Health', value: '87/100', percentage: 87, trend: 'up', change: 5 }
        ]
      },
      {
        id: 'upcoming-deliverables',
        title: 'Upcoming Deliverables',
        type: 'event',
        fields: [
          { id: 'phase1', label: 'Phase 1 Launch', value: '2025-12-10' },
          { id: 'phase2', label: 'Phase 2 Testing', value: '2026-01-15' },
          { id: 'phase3', label: 'Phase 3 Deployment', value: '2026-02-28' },
          { id: 'final', label: 'Final Go-Live', value: '2026-03-31' }
        ]
      },
      {
        id: 'top-risks',
        title: 'Top Risks & Issues',
        type: 'list',
        fields: [
          { id: 'risk1', title: 'Resource Constraint', value: 'High priority - Dev team shortage' },
          { id: 'risk2', title: 'Third-party Dependencies', value: 'Medium priority - API delays' },
          { id: 'issue1', title: 'Database Migration Delay', value: 'In progress - ETA +5 days' },
          { id: 'issue2', title: 'UAT Feedback Backlog', value: 'Resolved - 95% addressed' }
        ]
      },
      {
        id: 'key-performance',
        title: 'Key Performance Indicators',
        type: 'analytics',
        fields: [
          { id: 'schedule-performance', label: 'Schedule Performance', value: '0.95', percentage: 95, trend: 'stable', change: 0 },
          { id: 'cost-performance', label: 'Cost Performance', value: '0.92', percentage: 92, trend: 'up', change: 2 },
          { id: 'resource-efficiency', label: 'Resource Efficiency', value: '88%', percentage: 88, trend: 'up', change: 3 },
          { id: 'quality-score', label: 'Quality Score', value: '94%', percentage: 94, trend: 'up', change: 4 }
        ]
      }
    ],
    actions: [
      { id: 'view-portfolio', label: 'View Portfolio', type: 'primary' },
      { id: 'manage-risks', label: 'Manage Risks', type: 'secondary' },
      { id: 'team-calendar', label: 'Team Calendar', type: 'secondary' },
      { id: 'resource-planning', label: 'Resource Planning', type: 'secondary' }
    ]
  }
];
