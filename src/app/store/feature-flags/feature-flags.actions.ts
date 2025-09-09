import { createAction, props } from '@ngrx/store';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'boolean' | 'string' | 'number' | 'json';
  value?: any;
  defaultValue: any;
  rules?: FeatureFlagRule[];
  tags?: string[];
  environment?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  rolloutPercentage?: number;
  targetAudience?: string[];
}

export interface FeatureFlagRule {
  id: string;
  condition: string; // e.g., "userType === 'premium'"
  value: any;
  enabled: boolean;
  priority: number;
}

export interface FeatureFlagOverride {
  flagId: string;
  userId?: string;
  sessionId?: string;
  value: any;
  expiresAt?: Date;
  reason?: string;
}

// Flag Management Actions
export const loadFeatureFlags = createAction('[Feature Flags] Load Feature Flags');

export const loadFeatureFlagsSuccess = createAction(
  '[Feature Flags] Load Feature Flags Success',
  props<{ flags: FeatureFlag[] }>()
);

export const loadFeatureFlagsFailure = createAction(
  '[Feature Flags] Load Feature Flags Failure',
  props<{ error: string }>()
);

export const createFeatureFlag = createAction(
  '[Feature Flags] Create Feature Flag',
  props<{ flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'> }>()
);

export const updateFeatureFlag = createAction(
  '[Feature Flags] Update Feature Flag',
  props<{ id: string; updates: Partial<FeatureFlag> }>()
);

export const deleteFeatureFlag = createAction(
  '[Feature Flags] Delete Feature Flag',
  props<{ id: string }>()
);

export const toggleFeatureFlag = createAction(
  '[Feature Flags] Toggle Feature Flag',
  props<{ id: string }>()
);

// Flag Evaluation Actions
export const evaluateFeatureFlag = createAction(
  '[Feature Flags] Evaluate Feature Flag',
  props<{ 
    flagId: string; 
    context?: Record<string, any>;
    userId?: string;
    sessionId?: string;
  }>()
);

export const evaluateAllFlags = createAction(
  '[Feature Flags] Evaluate All Flags',
  props<{ 
    context?: Record<string, any>;
    userId?: string;
    sessionId?: string;
  }>()
);

export const setFlagValue = createAction(
  '[Feature Flags] Set Flag Value',
  props<{ flagId: string; value: any }>()
);

// Override Actions
export const addFlagOverride = createAction(
  '[Feature Flags] Add Flag Override',
  props<{ override: FeatureFlagOverride }>()
);

export const removeFlagOverride = createAction(
  '[Feature Flags] Remove Flag Override',
  props<{ flagId: string; userId?: string; sessionId?: string }>()
);

export const clearAllOverrides = createAction('[Feature Flags] Clear All Overrides');

// Rollout Actions
export const startGradualRollout = createAction(
  '[Feature Flags] Start Gradual Rollout',
  props<{ 
    flagId: string; 
    targetPercentage: number; 
    duration: number; // in milliseconds
  }>()
);

export const updateRolloutPercentage = createAction(
  '[Feature Flags] Update Rollout Percentage',
  props<{ flagId: string; percentage: number }>()
);

export const completeRollout = createAction(
  '[Feature Flags] Complete Rollout',
  props<{ flagId: string }>()
);

// A/B Testing Integration
export const assignUserToVariant = createAction(
  '[Feature Flags] Assign User To Variant',
  props<{ 
    flagId: string; 
    userId: string; 
    variant: string;
    experimentId?: string;
  }>()
);

export const trackFlagInteraction = createAction(
  '[Feature Flags] Track Flag Interaction',
  props<{ 
    flagId: string; 
    action: string; 
    userId?: string;
    metadata?: Record<string, any>;
  }>()
);

// Environment Actions
export const switchEnvironment = createAction(
  '[Feature Flags] Switch Environment',
  props<{ environment: string }>()
);

export const syncEnvironmentFlags = createAction(
  '[Feature Flags] Sync Environment Flags',
  props<{ fromEnvironment: string; toEnvironment: string; flagIds?: string[] }>()
);

// Validation Actions
export const validateFlagRules = createAction(
  '[Feature Flags] Validate Flag Rules',
  props<{ flagId: string }>()
);

export const validateAllFlagRules = createAction('[Feature Flags] Validate All Flag Rules');

// Audit Actions
export const recordFlagChange = createAction(
  '[Feature Flags] Record Flag Change',
  props<{ 
    flagId: string; 
    change: string; 
    oldValue: any; 
    newValue: any;
    userId: string;
    reason?: string;
  }>()
);

export const exportFlagConfiguration = createAction(
  '[Feature Flags] Export Flag Configuration',
  props<{ environment?: string; format: 'json' | 'yaml' | 'csv' }>()
);

export const importFlagConfiguration = createAction(
  '[Feature Flags] Import Flag Configuration',
  props<{ configuration: any; merge: boolean }>()
);

// Cache Actions
export const refreshFlagCache = createAction('[Feature Flags] Refresh Flag Cache');

export const clearFlagCache = createAction('[Feature Flags] Clear Flag Cache');

export const updateCacheStrategy = createAction(
  '[Feature Flags] Update Cache Strategy',
  props<{ strategy: 'aggressive' | 'normal' | 'minimal' }>()
);

// Performance Actions
export const enableFlagPreloading = createAction(
  '[Feature Flags] Enable Flag Preloading',
  props<{ flagIds: string[] }>()
);

export const disableFlagPreloading = createAction('[Feature Flags] Disable Flag Preloading');

export const optimizeFlagEvaluation = createAction('[Feature Flags] Optimize Flag Evaluation');

// Error Handling Actions
export const flagEvaluationError = createAction(
  '[Feature Flags] Flag Evaluation Error',
  props<{ flagId: string; error: string; fallbackUsed: boolean }>()
);

export const flagLoadError = createAction(
  '[Feature Flags] Flag Load Error',
  props<{ error: string; retryAttempt: number }>()
);

// Real-time Updates
export const subscribeToFlagUpdates = createAction(
  '[Feature Flags] Subscribe To Flag Updates',
  props<{ flagIds?: string[] }>()
);

export const unsubscribeFromFlagUpdates = createAction('[Feature Flags] Unsubscribe From Flag Updates');

export const receiveFlagUpdate = createAction(
  '[Feature Flags] Receive Flag Update',
  props<{ flagId: string; newValue: any; timestamp: number }>()
);
