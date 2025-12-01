export * from './icon.service';
export * from './section-normalization.service';
export * from './magnetic-tilt.service';
export * from './section-utils.service';
export * from './section-plugin-registry.service';
export * from './event-middleware.service';
export * from './streaming.service';
export * from './layout-worker.service';
export * from './animation-orchestrator.service';
export * from './section-animation.service';
export * from './card-facade.service';
export * from './feature-flags.service';
export * from './accessibility.service';
export * from './empty-state.service';
export * from './email-handler.service';
// Avoid duplicate CardEventType export - export selectively from event-bus
export { EventBusService, CardBusEvent, EventHandler } from './event-bus.service';
export * from './cached-section-normalization.service';
export * from './retry-policy.service';
export * from './reduced-motion.service';
export * from './migration-flags.service';
export { MIGRATION_FLAGS } from './migration-flags.service';

// Re-export dynamic loader from section-renderer
export { DynamicSectionLoaderService, ComponentResolution } from '../components/section-renderer/dynamic-section-loader.service';
export {
  LazySectionLoaderService,
  LazySectionType,
  LazySectionState,
  LAZY_SECTION_TYPES
} from '../components/section-renderer/lazy-section-loader.service';

// Note: sse-streaming.service and offline-storage.service are available as separate imports if needed

