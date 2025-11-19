Plan: Diagnose Card Performance & Streaming

TL;DR Review the data provider + NgRx flow so we can stream JSON incrementally, audit the renderer stack for serialization & change-detection hotspots, and align configuration/budget signals before proposing caching/manifest/virtualization improvements.

Steps
1. Document the blocking fetch path in `src/app/core/services/card-data/card-data.service.ts`, `toon-card-provider.service.ts`, and `src/app/store/cards/cards.effects.ts`.
2. Audit `src/app/features/home/components/home-page/home-page.component.ts`, `src/app/shared/components/cards/ai-card-renderer.component.ts`, `card-preview.component.ts`, `section-renderer.component.ts`, `masonry-grid/masonry-grid.component.ts`, and `shared/utils/card-diff.util.ts` for heavy `JSON.stringify`, diff merges, or reflows.
3. Catalog performance/budget cues from `angular.json`, `src/environments/*.ts`, `core/services/performance.service.ts`, and `src/app/store/cards/cards.state.ts` (e.g., `trackPerformance` action) to prioritize targets.
4. Outline improvements such as manifest-driven asset discovery, incremental or streamed loads, diff hashing instead of repeated serialization, virtualization/throttled layout recalculations, and whether the WebSocket provider can replace static JSON.

Further Considerations
- Decide whether the progressive streaming in `CardPreviewComponent` should subscribe to incremental `CardDataService` outputs instead of re-slicing a whole card.
- Confirm any larger datasets under `src/assets/configs/*` that justify chunked loads or lazy-supported types.
- Determine what telemetry (e.g., `PerformanceService`, `trackPerformance`) needs wiring before measuring the impact of the proposed changes.
When