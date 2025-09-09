import { createAction, props } from '@ngrx/store';

export interface AnalyticsEvent {
  id: string;
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface UserBehavior {
  sessionId: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  interactions: number;
  timeSpent: number;
  devices: string[];
  referrer?: string;
}

export interface PerformanceMetrics {
  id: string;
  metric: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

export interface ConversionFunnel {
  step: string;
  count: number;
  conversionRate: number;
  dropOffRate: number;
}

// Analytics Events Actions
export const trackEvent = createAction(
  '[Analytics] Track Event',
  props<{ event: AnalyticsEvent }>()
);

export const trackPageView = createAction(
  '[Analytics] Track Page View',
  props<{ 
    page: string; 
    title: string; 
    referrer?: string;
    metadata?: Record<string, any>;
  }>()
);

export const trackUserInteraction = createAction(
  '[Analytics] Track User Interaction',
  props<{ 
    element: string; 
    action: string; 
    context?: Record<string, any>;
  }>()
);

export const trackPerformanceMetric = createAction(
  '[Analytics] Track Performance Metric',
  props<{ metric: PerformanceMetrics }>()
);

export const trackError = createAction(
  '[Analytics] Track Error',
  props<{ 
    error: string; 
    stack?: string; 
    context?: Record<string, any>;
  }>()
);

export const trackCustomEvent = createAction(
  '[Analytics] Track Custom Event',
  props<{ 
    category: string;
    action: string;
    label?: string;
    value?: number;
    metadata?: Record<string, any>;
  }>()
);

// User Behavior Actions
export const startSession = createAction(
  '[Analytics] Start Session',
  props<{ 
    sessionId: string; 
    userId?: string; 
    device: string;
    referrer?: string;
  }>()
);

export const endSession = createAction(
  '[Analytics] End Session',
  props<{ sessionId: string }>()
);

export const updateUserBehavior = createAction(
  '[Analytics] Update User Behavior',
  props<{ sessionId: string; updates: Partial<UserBehavior> }>()
);

export const recordUserActivity = createAction(
  '[Analytics] Record User Activity',
  props<{ sessionId: string; activityType: string; timestamp: number }>()
);

// A/B Testing Actions
export const assignExperiment = createAction(
  '[Analytics] Assign Experiment',
  props<{ 
    experimentId: string; 
    variant: string; 
    userId?: string; 
    sessionId: string;
  }>()
);

export const trackExperimentGoal = createAction(
  '[Analytics] Track Experiment Goal',
  props<{ 
    experimentId: string; 
    goalId: string; 
    value?: number;
  }>()
);

// Conversion Tracking Actions
export const trackConversionStep = createAction(
  '[Analytics] Track Conversion Step',
  props<{ 
    funnelId: string; 
    step: string; 
    userId?: string; 
    sessionId: string;
    metadata?: Record<string, any>;
  }>()
);

export const trackConversionGoal = createAction(
  '[Analytics] Track Conversion Goal',
  props<{ 
    goalId: string; 
    value?: number; 
    currency?: string;
    metadata?: Record<string, any>;
  }>()
);

// Analytics Configuration Actions
export const setAnalyticsEnabled = createAction(
  '[Analytics] Set Analytics Enabled',
  props<{ enabled: boolean }>()
);

export const setTrackingConsent = createAction(
  '[Analytics] Set Tracking Consent',
  props<{ hasConsent: boolean; consentTypes: string[] }>()
);

export const updateAnalyticsConfig = createAction(
  '[Analytics] Update Analytics Config',
  props<{ config: Partial<any> }>()
);

// Data Export Actions
export const exportAnalyticsData = createAction(
  '[Analytics] Export Analytics Data',
  props<{ 
    dateRange: { start: Date; end: Date };
    format: 'json' | 'csv' | 'xlsx';
    filters?: Record<string, any>;
  }>()
);

export const generateReport = createAction(
  '[Analytics] Generate Report',
  props<{ 
    reportType: string;
    dateRange: { start: Date; end: Date };
    parameters?: Record<string, any>;
  }>()
);

// Real-time Analytics Actions
export const subscribeToRealTimeData = createAction(
  '[Analytics] Subscribe To Real Time Data',
  props<{ metrics: string[] }>()
);

export const unsubscribeFromRealTimeData = createAction(
  '[Analytics] Unsubscribe From Real Time Data'
);

export const receiveRealTimeUpdate = createAction(
  '[Analytics] Receive Real Time Update',
  props<{ data: any }>()
);

// Cleanup Actions
export const clearOldAnalyticsData = createAction(
  '[Analytics] Clear Old Analytics Data',
  props<{ olderThan: number }>()
);

export const clearAllAnalyticsData = createAction(
  '[Analytics] Clear All Analytics Data'
);

export const archiveAnalyticsData = createAction(
  '[Analytics] Archive Analytics Data',
  props<{ dateRange: { start: Date; end: Date } }>()
);

// GDPR/Privacy Actions
export const deleteUserData = createAction(
  '[Analytics] Delete User Data',
  props<{ userId: string }>()
);

export const anonymizeUserData = createAction(
  '[Analytics] Anonymize User Data',
  props<{ userId: string; retentionPeriod: number }>()
);

export const exportUserData = createAction(
  '[Analytics] Export User Data',
  props<{ userId: string; format: 'json' | 'csv' }>()
);
