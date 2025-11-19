# OSI Cards – Copilot Working Agreement

## Mission
Keep every change synchronized with the Angular migration’s section-driven card experience, NgRx-backed store, and shared SCSS design tokens while calling out the architectural imports and service contracts you relied on before coding.

## Architecture Snapshot
- `AICardRendererComponent` arranges cards in the masonry grid and hands each card to `SectionRendererComponent`, whose `resolvedType` switch (info→overview, timeline→event, table→list, etc.) must be updated whenever a new section type is introduced.
- Section components (see `src/app/shared/components/cards/sections/*`) are `standalone: true`, use `OnPush`, and must export trackBy helpers plus `fieldInteraction` events that emit `{ field, metadata }` for upstream listeners.
- Internal field layouts are governed by the `MasonryGridComponent` heuristics that adapt column spans based on section content and text density; avoid enforcing column spans from individual sections so the renderer can keep cards compact.

## Data + State Flow
- `CardDataService` (see `core/services/card-data/card-data.service.ts`) keeps a `BehaviorSubject` of the active `CARD_DATA_PROVIDER` and exposes `getAllCards`, `getCardsByType`, and real-time streams with `shareReplay(1)` caching. If you bypass it, explain how caching and `ensureCardIds`/`removeAllIds` stay in sync with the store.
- The default provider is `ToonCardProvider` (assets under `assets/configs/*`), but the WebSocket provider (`websocket-card-provider.service.ts`) can be swapped via `switchProvider` for live edits. Document any provider switch and whether it supports `subscribeToUpdates`.
- The `cards` state bundle (`src/app/store/cards/cards.state.ts`) uses an entity adapter; keep reducers immutable, reuse `ensureCardIds` before upserting, and flow new actions through `generateCard`/`loadTemplate`/`searchCards` so selectors and effects stay stable.

## Section Development Checklist
1. Add the new section component under `shared/components/cards/sections/`, import `CommonModule` + `LucideIconsModule`, use `@include card`/`section-grid`, and wire `fieldInteraction` outputs the same way existing sections do (see `info`, `analytics`, `list`).
2. Register it in `SectionRendererComponent` (import, add to `imports`, append `*ngSwitchCase` and update `resolvedType` if needed). Explain any `title`-based overrides when adding new cases.
3. Update `CardSection['type']` union in `src/app/models/card.model.ts` and ensure TOON templates under `assets/configs` map to the correct `type` string.
4. Import the new SCSS file (naming: `_your-section.scss`) via `styles.scss`, include the shared mixins, and avoid inline font sizes—always use `var(--card-*)` tokens in `_variables.scss`.

## Styling & Tokens
- All cards must `@include card` from `_sections-base.scss`, use `metric-label`/`metric-value` mixins, and obey `_colors.scss` variables for day/night parity.
- Typography derives from `src/styles/core/_variables.scss`: prefer `--card-title-font-size`, `--card-value-font-size`, `--card-label-font-size`, etc., and never sprinkle raw `px` values (even in fullscreen helpers or media queries).
- Grid spacing, badges, and status indicators rely on classes such as `.status--success`, `.priority--high`, and `@include section-grid`; reusing these prevents layout drift.

## Tooling & Workflows
- Run the dev server with `npm start` (Angular CLI on `:4200`). When packaging, use `npm run build`. Troubleshoot layout issues with `npm test` (Karma) and use `npm run lint:fix` after SCSS changes to keep lint rules satisfied.
- When you need live DOM inspection or icons, rely on Browser MCP snapshots documented earlier; mention any failed tool use in your response so the reviewer knows what context was missing.

## Testing & Validation
- When you touch selectors, effects, or reducers, add targeted unit tests covering the same action flows as `cards.effects.ts` and `cards.state.ts` (load/generate/delete/search).
- For new templates or style adjustments, mention how you’d verify them via Playwright/Cypress (e.g., ensure `SectionRenderer` renders the new card type with `trackBy` and that typography tokens stay consistent).

## Communication
- Reference the files you inspected (e.g., `SectionRendererComponent`, `card-data.service.ts`, `_sections-base.scss`) when describing your approach so reviewers can follow the architectural reasoning.
- If you diverge from the React reference (e.g., you upgrade interpolation logic or add a provider), justify it and call out how you validated the result.
- End responses by soliciting feedback: “Anything unclear or missing in this set of instructions?”