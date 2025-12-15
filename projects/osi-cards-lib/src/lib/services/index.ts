// ============================================================================
// CORE SERVICES
// ============================================================================
export * from './card-facade.service';
export * from './email-handler.service';
// Removed - implement in your app
// export * from './empty-state.service';
export { CardBusEvent, EventBusService, EventHandler } from './event-bus.service';
export * from './event-middleware.service';
export * from './i18n.service';
export * from './icon.service';
export * from './keyboard-shortcuts.service';
export * from './layout-worker.service';
export * from './magnetic-tilt.service';
export * from './retry-policy.service';
export * from './section-plugin-registry.service';
export * from './section-utils.service';
export * from './streaming.service';

// ============================================================================
// LAYOUT SERVICES (Architectural Improvement - Dec 2025)
// ============================================================================
export * from './layout-calculation.service';
export * from './layout-state-manager.service';
export * from './height-estimation.service';

// ============================================================================
// CONSOLIDATED SERVICES (Phase 3 Consolidation)
// ============================================================================

// Accessibility Service (merged: accessibility + focus-trap + live-announcer + reduced-motion)
export * from './accessibility.service';

// Animation Service (merged: animation-orchestrator + section-animation)
// Also available as separate services for backwards compatibility
// Removed - consolidated
// export * from './animation.service';

// Section Normalization Service (now includes caching from cached-section-normalization)
export * from './section-normalization.service';

// Section Completeness Service (validates section completeness for filtering)
export * from './section-completeness.service';

// Feature Flags Service (now includes migration flags from migration-flags.service)
export * from './feature-flags.service';
export { MIGRATION_FLAGS_TOKEN } from './feature-flags.service';

// Layout Optimizer Service (merged: layout-optimization + layout-analytics)
// export * from './layout-optimizer.service';  // Disabled: has pre-existing type errors

// ============================================================================
// LEGACY SERVICES (Backwards Compatibility)
// ============================================================================
// These re-export the consolidated services for backwards compatibility

// Animation services (now consolidated into animation.service.ts)
// export * from './animation-orchestrator.service';  // Disabled: duplicates animation.service exports
// export * from './section-animation.service';  // Disabled: duplicates animation.service exports

// Accessibility services (now consolidated into accessibility.service.ts)
// Re-exports for backwards compatibility (avoiding duplicates)
export { FocusTrapService } from './focus-trap.service';
export { LiveAnnouncerService } from './live-announcer.service';
export { ReducedMotionService } from './reduced-motion.service';

// Section services (caching now built into section-normalization.service.ts)
export * from './cached-section-normalization.service';

// Migration flags (now in feature-flags.service.ts)
export * from './migration-flags.service';
export { MIGRATION_FLAGS } from './migration-flags.service';

// Layout services (now consolidated into layout-optimizer.service.ts)
export {
  LayoutOptimizationConfig,
  LayoutOptimizationService,
  OptimizablePositionedSection,
  PositionedSection,
} from './layout-optimization.service';

// ============================================================================
// ADDITIONAL SERVICES
// ============================================================================
export { ErrorSeverity, ErrorTrackingService, TrackedError } from './error-tracking.service';
export { LogEntry, LogLevel, LoggerService, createLogger } from './logger.service';
// Removed - implement in your app
// export * from './offline-storage.service';
export * from './performance-metrics.service';
export { Toast, ToastService } from './toast.service';
export * from './touch-gestures.service';

// ============================================================================
// RE-EXPORTS FROM OTHER MODULES
// ============================================================================

// Dynamic loader from section-renderer
export {
  ComponentResolution,
  DynamicSectionLoaderService,
} from '../components/section-renderer/dynamic-section-loader.service';
export {
  LAZY_SECTION_TYPES,
  LazySectionLoaderService,
  LazySectionState,
  LazySectionType,
} from '../components/section-renderer/lazy-section-loader.service';

// Theme service from themes folder
export { ThemeService } from '../themes/theme.service';
