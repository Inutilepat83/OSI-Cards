import { createReducer, on } from '@ngrx/store';
import * as AnalyticsActions from './analytics.actions';

export interface Experiment {
  id: string;
  name: string;
  variant: string;
  startDate: Date;
  endDate?: Date;
  goals: string[];
  participants: number;
  conversions: number;
}

export interface ConversionFunnel {
  id: string;
  name: string;
  steps: {
    id: string;
    name: string;
    count: number;
    conversionRate: number;
  }[];
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackingConsent: boolean;
  consentTypes: string[];
  dataRetentionDays: number;
  anonymizeIPs: boolean;
  cookieConsent: boolean;
  realTimeEnabled: boolean;
  samplingRate: number;
}

export interface AnalyticsState {
  // Core Analytics Data
  events: AnalyticsActions.AnalyticsEvent[];
  userBehaviors: AnalyticsActions.UserBehavior[];
  performanceMetrics: AnalyticsActions.PerformanceMetrics[];
  
  // Session Management
  currentSessionId?: string;
  activeSessions: Record<string, AnalyticsActions.UserBehavior>;
  
  // A/B Testing
  experiments: Experiment[];
  userExperiments: Record<string, string[]>; // userId -> experimentIds
  
  // Conversion Tracking
  conversionFunnels: ConversionFunnel[];
  conversions: {
    goalId: string;
    userId?: string;
    sessionId: string;
    value?: number;
    timestamp: number;
  }[];
  
  // Page Analytics
  pageViews: {
    page: string;
    title: string;
    timestamp: number;
    sessionId: string;
    referrer?: string;
  }[];
  
  // Error Tracking
  errors: {
    id: string;
    error: string;
    stack?: string;
    timestamp: number;
    context?: Record<string, any>;
  }[];
  
  // Configuration
  config: AnalyticsConfig;
  
  // Real-time Data
  realTimeData: {
    activeUsers: number;
    currentPageViews: Record<string, number>;
    recentEvents: AnalyticsActions.AnalyticsEvent[];
    performanceAlerts: any[];
  };
  
  // Reports
  reports: {
    id: string;
    type: string;
    generatedAt: Date;
    data: any;
    parameters: Record<string, any>;
  }[];
  
  // Statistics
  statistics: {
    totalEvents: number;
    totalSessions: number;
    totalUsers: number;
    averageSessionDuration: number;
    bounceRate: number;
    topPages: { page: string; views: number }[];
    topEvents: { event: string; count: number }[];
    conversionRates: Record<string, number>;
  };
  
  // System Status
  isTracking: boolean;
  lastSync: number;
  syncErrors: string[];
}

export const initialState: AnalyticsState = {
  events: [],
  userBehaviors: [],
  performanceMetrics: [],
  activeSessions: {},
  experiments: [],
  userExperiments: {},
  conversionFunnels: [],
  conversions: [],
  pageViews: [],
  errors: [],
  config: {
    enabled: true,
    trackingConsent: false,
    consentTypes: [],
    dataRetentionDays: 365,
    anonymizeIPs: true,
    cookieConsent: false,
    realTimeEnabled: true,
    samplingRate: 1.0
  },
  realTimeData: {
    activeUsers: 0,
    currentPageViews: {},
    recentEvents: [],
    performanceAlerts: []
  },
  reports: [],
  statistics: {
    totalEvents: 0,
    totalSessions: 0,
    totalUsers: 0,
    averageSessionDuration: 0,
    bounceRate: 0,
    topPages: [],
    topEvents: [],
    conversionRates: {}
  },
  isTracking: false,
  lastSync: 0,
  syncErrors: []
};

export const reducer = createReducer(
  initialState,
  
  // Event Tracking
  on(AnalyticsActions.trackEvent, (state, { event }) => ({
    ...state,
    events: [
      ...state.events.slice(-9999), // Keep last 10k events
      event
    ],
    statistics: {
      ...state.statistics,
      totalEvents: state.statistics.totalEvents + 1
    }
  })),
  
  on(AnalyticsActions.trackPageView, (state, { page, title, referrer, metadata }) => {
    const pageView = {
      page,
      title,
      timestamp: Date.now(),
      sessionId: state.currentSessionId || 'unknown',
      referrer,
      metadata
    };
    
    return {
      ...state,
      pageViews: [...state.pageViews.slice(-999), pageView],
      realTimeData: {
        ...state.realTimeData,
        currentPageViews: {
          ...state.realTimeData.currentPageViews,
          [page]: (state.realTimeData.currentPageViews[page] || 0) + 1
        }
      }
    };
  }),
  
  on(AnalyticsActions.trackUserInteraction, (state, { element, action, context }) => {
    const event: AnalyticsActions.AnalyticsEvent = {
      id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user_interaction',
      category: 'ui',
      action,
      label: element,
      timestamp: Date.now(),
      sessionId: state.currentSessionId || 'unknown',
      metadata: context
    };
    
    return {
      ...state,
      events: [...state.events.slice(-9999), event]
    };
  }),
  
  on(AnalyticsActions.trackPerformanceMetric, (state, { metric }) => ({
    ...state,
    performanceMetrics: [
      ...state.performanceMetrics.slice(-999),
      metric
    ]
  })),
  
  on(AnalyticsActions.trackError, (state, { error, stack, context }) => {
    const errorRecord = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      error,
      stack,
      timestamp: Date.now(),
      context
    };
    
    return {
      ...state,
      errors: [...state.errors.slice(-499), errorRecord]
    };
  }),
  
  // Session Management
  on(AnalyticsActions.startSession, (state, { sessionId, userId, device, referrer }) => {
    const behavior: AnalyticsActions.UserBehavior = {
      sessionId,
      userId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      interactions: 0,
      timeSpent: 0,
      devices: [device],
      referrer
    };
    
    return {
      ...state,
      currentSessionId: sessionId,
      activeSessions: {
        ...state.activeSessions,
        [sessionId]: behavior
      },
      statistics: {
        ...state.statistics,
        totalSessions: state.statistics.totalSessions + 1
      }
    };
  }),
  
  on(AnalyticsActions.endSession, (state, { sessionId }) => {
    const session = state.activeSessions[sessionId];
    const updatedActiveSessions = { ...state.activeSessions };
    delete updatedActiveSessions[sessionId];
    
    return {
      ...state,
      activeSessions: updatedActiveSessions,
      userBehaviors: session ? [...state.userBehaviors, {
        ...session,
        timeSpent: Date.now() - session.startTime
      }] : state.userBehaviors,
      currentSessionId: state.currentSessionId === sessionId ? undefined : state.currentSessionId
    };
  }),
  
  on(AnalyticsActions.updateUserBehavior, (state, { sessionId, updates }) => ({
    ...state,
    activeSessions: {
      ...state.activeSessions,
      [sessionId]: {
        ...state.activeSessions[sessionId],
        ...updates,
        lastActivity: Date.now()
      }
    }
  })),
  
  // A/B Testing
  on(AnalyticsActions.assignExperiment, (state, { experimentId, variant, userId, sessionId }) => {
    const userExperiments = userId ? {
      ...state.userExperiments,
      [userId]: [...(state.userExperiments[userId] || []), experimentId]
    } : state.userExperiments;
    
    return {
      ...state,
      userExperiments
    };
  }),
  
  // Conversion Tracking
  on(AnalyticsActions.trackConversionGoal, (state, { goalId, value, currency, metadata }) => {
    const conversion = {
      goalId,
      userId: undefined, // Would be set from current user context
      sessionId: state.currentSessionId || 'unknown',
      value,
      timestamp: Date.now(),
      currency,
      metadata
    };
    
    return {
      ...state,
      conversions: [...state.conversions.slice(-999), conversion]
    };
  }),
  
  // Configuration
  on(AnalyticsActions.setAnalyticsEnabled, (state, { enabled }) => ({
    ...state,
    config: {
      ...state.config,
      enabled
    },
    isTracking: enabled
  })),
  
  on(AnalyticsActions.setTrackingConsent, (state, { hasConsent, consentTypes }) => ({
    ...state,
    config: {
      ...state.config,
      trackingConsent: hasConsent,
      consentTypes
    }
  })),
  
  on(AnalyticsActions.updateAnalyticsConfig, (state, { config }) => ({
    ...state,
    config: {
      ...state.config,
      ...config
    }
  })),
  
  // Real-time Data
  on(AnalyticsActions.receiveRealTimeUpdate, (state, { data }) => ({
    ...state,
    realTimeData: {
      ...state.realTimeData,
      ...data,
      recentEvents: [
        ...state.realTimeData.recentEvents.slice(-49),
        ...(data.events || [])
      ]
    }
  })),
  
  // Reports
  on(AnalyticsActions.generateReport, (state, { reportType, dateRange, parameters }) => {
    const report = {
      id: `report-${Date.now()}`,
      type: reportType,
      generatedAt: new Date(),
      data: {}, // Would be populated by effects
      parameters: parameters || {}
    };
    
    return {
      ...state,
      reports: [...state.reports.slice(-99), report]
    };
  }),
  
  // Cleanup
  on(AnalyticsActions.clearOldAnalyticsData, (state, { olderThan }) => ({
    ...state,
    events: state.events.filter(event => event.timestamp > olderThan),
    userBehaviors: state.userBehaviors.filter(behavior => behavior.startTime > olderThan),
    performanceMetrics: state.performanceMetrics.filter(metric => metric.timestamp > olderThan),
    pageViews: state.pageViews.filter(view => view.timestamp > olderThan),
    errors: state.errors.filter(error => error.timestamp > olderThan)
  })),
  
  on(AnalyticsActions.clearAllAnalyticsData, () => ({
    ...initialState,
    config: initialState.config // Preserve configuration
  })),
  
  // Privacy
  on(AnalyticsActions.deleteUserData, (state, { userId }) => ({
    ...state,
    events: state.events.filter(event => event.userId !== userId),
    userBehaviors: state.userBehaviors.filter(behavior => behavior.userId !== userId),
    userExperiments: Object.fromEntries(
      Object.entries(state.userExperiments).filter(([id]) => id !== userId)
    ),
    conversions: state.conversions.filter(conversion => conversion.userId !== userId)
  }))
);
