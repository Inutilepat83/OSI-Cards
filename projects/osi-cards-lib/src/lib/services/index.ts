export * from './accessibility.service';
export * from './animation-orchestrator.service';
export * from './card-facade.service';
export * from './email-handler.service';
export * from './empty-state.service';
export * from './event-middleware.service';
export * from './feature-flags.service';
export * from './icon.service';
export * from './layout-worker.service';
export * from './magnetic-tilt.service';
export * from './section-animation.service';
export * from './section-normalization.service';
export * from './section-plugin-registry.service';
export * from './section-utils.service';
export * from './streaming.service';
// Avoid duplicate CardEventType export - export selectively from event-bus
export * from './cached-section-normalization.service';
export { CardBusEvent, EventBusService, EventHandler } from './event-bus.service';
export * from './migration-flags.service';
export { MIGRATION_FLAGS } from './migration-flags.service';
export * from './reduced-motion.service';
export * from './retry-policy.service';

// New services (v1.6+)
export * from './error-tracking.service';
export * from './focus-trap.service';
export * from './i18n.service';
export * from './keyboard-shortcuts.service';
export * from './live-announcer.service';
export * from './offline-storage.service';
export * from './performance-metrics.service';
export * from './touch-gestures.service';

// Re-export dynamic loader from section-renderer
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

// Note: sse-streaming.service and offline-storage.service are available as separate imports if needed

// Re-export theme service from themes folder
export { ThemeService } from '../themes/theme.service';

// Layout optimization service
export {
  LayoutOptimizationConfig,
  LayoutOptimizationService,
  OptimizablePositionedSection,
  PositionedSection,
} from './layout-optimization.service';
