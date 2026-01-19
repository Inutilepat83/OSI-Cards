/**
 * OSI Cards Components Barrel Export
 *
 * @module @osi-cards/lib/components
 */

// AI Card Renderer
export {
  AICardRendererComponent,
  StreamingStage,
  type CardFieldInteractionEvent,
} from './ai-card-renderer/ai-card-renderer.component';

// Card Parts
export { CardActionsComponent } from './card-actions/card-actions.component';
export { CardBodyComponent } from './card-body/card-body.component';
export { CardFooterComponent } from './card-footer/card-footer.component';
export { CardHeaderComponent } from './card-header/card-header.component';
export { CardPreviewComponent } from './card-preview/card-preview.component';
export { CardSectionListComponent } from './card-section-list/card-section-list.component';
export {
  CardSkeletonComponent,
  SkeletonSectionType,
} from './card-skeleton/card-skeleton.component';
export { CardStreamingIndicatorComponent } from './card-streaming-indicator/card-streaming-indicator.component';

// Section Components
export {
  SectionErrorBoundaryComponent,
  SectionError,
  ErrorBoundaryConfig as SectionErrorBoundaryConfig,
  DEFAULT_ERROR_BOUNDARY_CONFIG,
} from './section-error-boundary/section-error-boundary.component';
export {
  SectionRendererComponent,
  type SectionRenderEvent,
} from './section-renderer/section-renderer.component';
export { SectionSkeletonComponent } from './section-skeleton/section-skeleton.component';
export * from './sections';

// Section Renderer Services
export {
  ComponentResolution,
  DynamicSectionLoaderService,
} from './section-renderer/dynamic-section-loader.service';
export {
  LAZY_SECTION_TYPES,
  LazySectionLoaderService,
  LazySectionState,
  LazySectionType,
} from './section-renderer/lazy-section-loader.service';

// Grid & Layout
export { MasonryGridComponent } from './masonry-grid/masonry-grid.component';
export type { MasonryLayoutInfo } from './masonry-grid/masonry-grid.component';

// Container Components
export { OsiCardsComponent } from './osi-cards/osi-cards.component';
// Note: osi-cards-container has import issues, export separately if needed

// Error Boundary
export {
  ErrorBoundaryComponent,
  ErrorBoundaryConfig as GlobalErrorBoundaryConfig,
  ErrorBoundaryError,
  createErrorBoundaryConfig,
} from './error-boundary/error-boundary.component';

// Utility Components
export { SkipLinkComponent } from './skip-link/skip-link.component';

// Smart Grid - Simplified, maintainable grid component
export {
  SectionClickEvent,
  SmartGridComponent,
  SmartGridSection,
} from './smart-grid/smart-grid.component';

// Unified Renderers - Reusable field and item rendering
export * from './renderers';
