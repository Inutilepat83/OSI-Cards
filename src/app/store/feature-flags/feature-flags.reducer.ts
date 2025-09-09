import { createReducer, on } from '@ngrx/store';
import * as FeatureFlagsActions from './feature-flags.actions';

export interface FlagEvaluation {
  flagId: string;
  value: any;
  evaluatedAt: number;
  userId?: string;
  sessionId?: string;
  ruleMatched?: string;
  fallbackUsed: boolean;
}

export interface RolloutStatus {
  flagId: string;
  currentPercentage: number;
  targetPercentage: number;
  startTime: Date;
  estimatedCompletion?: Date;
  isActive: boolean;
}

export interface FlagAuditLog {
  id: string;
  flagId: string;
  action: string;
  oldValue: any;
  newValue: any;
  userId: string;
  timestamp: Date;
  reason?: string;
  environment: string;
}

export interface FeatureFlagsState {
  // Core flag data
  flags: FeatureFlagsActions.FeatureFlag[];
  evaluations: Record<string, FlagEvaluation>; // flagId -> evaluation
  overrides: FeatureFlagsActions.FeatureFlagOverride[];
  
  // Environment management
  currentEnvironment: string;
  availableEnvironments: string[];
  
  // Rollout management
  activeRollouts: RolloutStatus[];
  rolloutHistory: RolloutStatus[];
  
  // A/B Testing
  userVariants: Record<string, Record<string, string>>; // userId -> flagId -> variant
  flagInteractions: {
    flagId: string;
    action: string;
    userId?: string;
    timestamp: number;
    metadata?: Record<string, any>;
  }[];
  
  // Performance and caching
  cacheStrategy: 'aggressive' | 'normal' | 'minimal';
  preloadedFlags: Set<string>;
  lastCacheRefresh: number;
  evaluationCache: Record<string, { value: any; expiresAt: number }>;
  
  // Validation and errors
  validationErrors: Record<string, string[]>; // flagId -> errors
  evaluationErrors: {
    flagId: string;
    error: string;
    timestamp: number;
    fallbackUsed: boolean;
  }[];
  
  // Audit and compliance
  auditLog: FlagAuditLog[];
  changeRequests: {
    id: string;
    flagId: string;
    requestedChanges: Partial<FeatureFlagsActions.FeatureFlag>;
    requestedBy: string;
    requestedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: Date;
  }[];
  
  // Real-time subscriptions
  subscriptions: Set<string>; // flagIds being watched
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  lastUpdate: number;
  
  // Statistics
  statistics: {
    totalFlags: number;
    enabledFlags: number;
    flagsByEnvironment: Record<string, number>;
    evaluationsPerFlag: Record<string, number>;
    mostUsedFlags: { flagId: string; evaluations: number }[];
    rolloutSuccess: number;
    averageEvaluationTime: number;
  };
  
  // System state
  loading: boolean;
  error: string | null;
  lastSync: number;
  syncInProgress: boolean;
}

export const initialState: FeatureFlagsState = {
  flags: [],
  evaluations: {},
  overrides: [],
  currentEnvironment: 'development',
  availableEnvironments: ['development', 'staging', 'production'],
  activeRollouts: [],
  rolloutHistory: [],
  userVariants: {},
  flagInteractions: [],
  cacheStrategy: 'normal',
  preloadedFlags: new Set<string>(),
  lastCacheRefresh: 0,
  evaluationCache: {},
  validationErrors: {},
  evaluationErrors: [],
  auditLog: [],
  changeRequests: [],
  subscriptions: new Set<string>(),
  connectionStatus: 'disconnected' as const,
  lastUpdate: 0,
  statistics: {
    totalFlags: 0,
    enabledFlags: 0,
    flagsByEnvironment: {},
    evaluationsPerFlag: {},
    mostUsedFlags: [],
    rolloutSuccess: 0,
    averageEvaluationTime: 0
  },
  loading: false,
  error: null,
  lastSync: 0,
  syncInProgress: false
};

export const reducer = createReducer(
  initialState,
  
  // Flag Loading
  on(FeatureFlagsActions.loadFeatureFlags, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(FeatureFlagsActions.loadFeatureFlagsSuccess, (state, { flags }) => ({
    ...state,
    flags,
    loading: false,
    error: null,
    lastSync: Date.now(),
    statistics: {
      ...state.statistics,
      totalFlags: flags.length,
      enabledFlags: flags.filter(f => f.enabled).length,
      flagsByEnvironment: flags.reduce((acc, flag) => {
        const env = flag.environment || 'default';
        acc[env] = (acc[env] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    }
  })),
  
  on(FeatureFlagsActions.loadFeatureFlagsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Flag Management
  on(FeatureFlagsActions.createFeatureFlag, (state, { flag }) => {
    const newFlag: FeatureFlagsActions.FeatureFlag = {
      ...flag,
      id: `flag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return {
      ...state,
      flags: [...state.flags, newFlag],
      statistics: {
        ...state.statistics,
        totalFlags: state.statistics.totalFlags + 1,
        enabledFlags: newFlag.enabled ? state.statistics.enabledFlags + 1 : state.statistics.enabledFlags
      }
    };
  }),
  
  on(FeatureFlagsActions.updateFeatureFlag, (state, { id, updates }) => ({
    ...state,
    flags: state.flags.map(flag => 
      flag.id === id 
        ? { ...flag, ...updates, updatedAt: new Date() }
        : flag
    )
  })),
  
  on(FeatureFlagsActions.deleteFeatureFlag, (state, { id }) => ({
    ...state,
    flags: state.flags.filter(flag => flag.id !== id),
    evaluations: Object.fromEntries(
      Object.entries(state.evaluations).filter(([flagId]) => flagId !== id)
    ),
    overrides: state.overrides.filter(override => override.flagId !== id)
  })),
  
  on(FeatureFlagsActions.toggleFeatureFlag, (state, { id }) => ({
    ...state,
    flags: state.flags.map(flag => 
      flag.id === id 
        ? { ...flag, enabled: !flag.enabled, updatedAt: new Date() }
        : flag
    )
  })),
  
  // Flag Evaluation
  on(FeatureFlagsActions.evaluateFeatureFlag, (state, { flagId, context, userId, sessionId }) => {
    const flag = state.flags.find(f => f.id === flagId);
    if (!flag) return state;
    
    // Simple evaluation logic (in real implementation, this would be more sophisticated)
    const evaluation: FlagEvaluation = {
      flagId,
      value: flag.enabled ? (flag.value !== undefined ? flag.value : flag.defaultValue) : flag.defaultValue,
      evaluatedAt: Date.now(),
      userId,
      sessionId,
      fallbackUsed: !flag.enabled
    };
    
    return {
      ...state,
      evaluations: {
        ...state.evaluations,
        [flagId]: evaluation
      },
      statistics: {
        ...state.statistics,
        evaluationsPerFlag: {
          ...state.statistics.evaluationsPerFlag,
          [flagId]: (state.statistics.evaluationsPerFlag[flagId] || 0) + 1
        }
      }
    };
  }),
  
  on(FeatureFlagsActions.setFlagValue, (state, { flagId, value }) => ({
    ...state,
    flags: state.flags.map(flag => 
      flag.id === flagId 
        ? { ...flag, value, updatedAt: new Date() }
        : flag
    )
  })),
  
  // Overrides
  on(FeatureFlagsActions.addFlagOverride, (state, { override }) => ({
    ...state,
    overrides: [
      ...state.overrides.filter(o => 
        !(o.flagId === override.flagId && 
          o.userId === override.userId && 
          o.sessionId === override.sessionId)
      ),
      override
    ]
  })),
  
  on(FeatureFlagsActions.removeFlagOverride, (state, { flagId, userId, sessionId }) => ({
    ...state,
    overrides: state.overrides.filter(override => 
      !(override.flagId === flagId && 
        override.userId === userId && 
        override.sessionId === sessionId)
    )
  })),
  
  on(FeatureFlagsActions.clearAllOverrides, (state) => ({
    ...state,
    overrides: []
  })),
  
  // Rollouts
  on(FeatureFlagsActions.startGradualRollout, (state, { flagId, targetPercentage, duration }) => {
    const rollout: RolloutStatus = {
      flagId,
      currentPercentage: 0,
      targetPercentage,
      startTime: new Date(),
      estimatedCompletion: new Date(Date.now() + duration),
      isActive: true
    };
    
    return {
      ...state,
      activeRollouts: [
        ...state.activeRollouts.filter(r => r.flagId !== flagId),
        rollout
      ]
    };
  }),
  
  on(FeatureFlagsActions.updateRolloutPercentage, (state, { flagId, percentage }) => ({
    ...state,
    activeRollouts: state.activeRollouts.map(rollout => 
      rollout.flagId === flagId 
        ? { ...rollout, currentPercentage: percentage }
        : rollout
    )
  })),
  
  on(FeatureFlagsActions.completeRollout, (state, { flagId }) => {
    const completedRollout = state.activeRollouts.find(r => r.flagId === flagId);
    
    return {
      ...state,
      activeRollouts: state.activeRollouts.filter(r => r.flagId !== flagId),
      rolloutHistory: completedRollout 
        ? [...state.rolloutHistory.slice(-99), { ...completedRollout, isActive: false }]
        : state.rolloutHistory
    };
  }),
  
  // A/B Testing
  on(FeatureFlagsActions.assignUserToVariant, (state, { flagId, userId, variant }) => ({
    ...state,
    userVariants: {
      ...state.userVariants,
      [userId]: {
        ...state.userVariants[userId],
        [flagId]: variant
      }
    }
  })),
  
  on(FeatureFlagsActions.trackFlagInteraction, (state, { flagId, action, userId, metadata }) => ({
    ...state,
    flagInteractions: [
      ...state.flagInteractions.slice(-999),
      {
        flagId,
        action,
        userId,
        timestamp: Date.now(),
        metadata
      }
    ]
  })),
  
  // Environment
  on(FeatureFlagsActions.switchEnvironment, (state, { environment }) => ({
    ...state,
    currentEnvironment: environment,
    flags: [], // Clear flags when switching environments
    evaluations: {},
    lastSync: 0
  })),
  
  // Validation
  on(FeatureFlagsActions.validateFlagRules, (state, { flagId }) => {
    const flag = state.flags.find(f => f.id === flagId);
    const errors: string[] = [];
    
    if (flag?.rules) {
      flag.rules.forEach((rule, index) => {
        if (!rule.condition || rule.condition.trim().length === 0) {
          errors.push(`Rule ${index + 1}: Condition is required`);
        }
        // Add more validation logic here
      });
    }
    
    return {
      ...state,
      validationErrors: {
        ...state.validationErrors,
        [flagId]: errors
      }
    };
  }),
  
  // Audit
  on(FeatureFlagsActions.recordFlagChange, (state, { flagId, change, oldValue, newValue, userId, reason }) => {
    const auditEntry: FlagAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      flagId,
      action: change,
      oldValue,
      newValue,
      userId,
      timestamp: new Date(),
      reason,
      environment: state.currentEnvironment
    };
    
    return {
      ...state,
      auditLog: [...state.auditLog.slice(-999), auditEntry]
    };
  }),
  
  // Cache
  on(FeatureFlagsActions.refreshFlagCache, (state) => ({
    ...state,
    lastCacheRefresh: Date.now(),
    evaluationCache: {} // Clear evaluation cache on refresh
  })),
  
  on(FeatureFlagsActions.clearFlagCache, (state) => ({
    ...state,
    evaluationCache: {},
    preloadedFlags: new Set<string>()
  })),
  
  on(FeatureFlagsActions.updateCacheStrategy, (state, { strategy }) => ({
    ...state,
    cacheStrategy: strategy
  })),
  
  // Performance
  on(FeatureFlagsActions.enableFlagPreloading, (state, { flagIds }) => ({
    ...state,
    preloadedFlags: new Set([...state.preloadedFlags, ...flagIds])
  })),
  
  on(FeatureFlagsActions.disableFlagPreloading, (state) => ({
    ...state,
    preloadedFlags: new Set<string>()
  })),
  
  // Error Handling
  on(FeatureFlagsActions.flagEvaluationError, (state, { flagId, error, fallbackUsed }) => ({
    ...state,
    evaluationErrors: [
      ...state.evaluationErrors.slice(-99),
      {
        flagId,
        error,
        timestamp: Date.now(),
        fallbackUsed
      }
    ]
  })),
  
  // Real-time Updates
  on(FeatureFlagsActions.subscribeToFlagUpdates, (state, { flagIds }) => ({
    ...state,
    subscriptions: flagIds ? new Set<string>(flagIds) : new Set<string>(state.flags.map(f => f.id)),
    connectionStatus: 'connecting' as const
  })),
  
  on(FeatureFlagsActions.unsubscribeFromFlagUpdates, (state) => ({
    ...state,
    subscriptions: new Set<string>(),
    connectionStatus: 'disconnected' as const
  })),
  
  on(FeatureFlagsActions.receiveFlagUpdate, (state, { flagId, newValue, timestamp }) => ({
    ...state,
    flags: state.flags.map(flag => 
      flag.id === flagId 
        ? { ...flag, value: newValue, updatedAt: new Date(timestamp) }
        : flag
    ),
    lastUpdate: timestamp
  }))
);
