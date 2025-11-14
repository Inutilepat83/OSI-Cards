# OSI Cards

OSI Cards is an Angular 17+ dashboard experience that renders heterogeneous card sections with a cohesive surface language, deterministic grid spacing, and NgRx-backed state management. Every card is authored as a standalone section component that declares its layout, typography, and data bindings, while `AICardRendererComponent` + `SectionRendererComponent` orchestrate the masonry presentation and routing between section types.

## Architecture Snapshot

- **Section rendering** is handled by `AICardRendererComponent`, which feeds card payloads to `SectionRendererComponent`. That component uses a `resolvedType` `switch` to render the right standalone section (info, overview, timeline, table, etc.) and exposes `fieldInteraction` events so downstream listeners can track user gestures.
- **Card data** flows through `CardDataService` (`core/services/card-data/card-data.service.ts`). It caches the active `CARD_DATA_PROVIDER`, exposes `getAllCards` / `getCardsByType`, and emits hot streams via `shareReplay(1)` so effects and selectors stay in sync. The default provider is the JSON-backed `JsonCardProvider`, but you've already got `websocket-card-provider.service.ts` ready for live edits when `switchProvider` is invoked.
- **State management** uses the `cards` bundle in `store/cards/cards.state.ts`. It relies on an entity adapter, immutable reducer updates, and helper utilities (`ensureCardIds`, `removeAllIds`). New card payloads are always pushed through the canonical actions (`generateCard`, `loadTemplate`, `searchCards`) so selectors can remain stable.
- **Field layouts** lean on `MasonryGridComponent` heuristics that calculate column spans based on text density; no single section forces a column span, which keeps the renderer agile across breakpoints.

## Surface & Motion Design System

- All cards reuse the central CSS variables defined under `styles/core/_variables.scss` and `styles/core/variables/_colors.scss`. These tokens drive border/fill colors, typography (`--card-title-font-size`, `--card-label-font-size`, `--card-value-font-size`, etc.), and spacing (`--card-padding`, `--card-gap`, `--section-card-gap`).
- Layout mixins such as `@include card` (from `styles/components/sections/_sections-base.scss`), `section-responsive-grid`, and typography helpers (`label-text`, `value-text`, etc.) ensure consistent padding, hover states, and transition timing across sections.
- Motion tokens are centralized in `styles/core/_animations.scss` and used throughout the SCSS modules under `styles/components/sections`. They power the subtle 0.22s transitions and strong focus on persistent borders + brand-aware hover accents.
- Surface layering is governed by `styles/core/_surface-layers.scss`, keeping day/night parity via `var(--card-background)` and controlled `box-shadow` tokens.
- The shared iconography lives in `src/app/shared/icons/lucide-icons.module.ts`, and every standalone section imports `CommonModule` + `LucideIconsModule` so icon assets stay consistent.

## Development Workflow

1. **Install dependencies**: `npm ci` (preferred for CI) or `npm install` locally.
2. **Serve locally**: `npm start` / `npx ng serve` (Angular CLI on `:4200`).
3. **Build**: `npm run build` (packaged artifacts end up under `dist/`).
4. **Lint**: `npm run lint` plus `npm run lint:fix` after SCSS tweaks to keep spacing and token usage in line.
5. **Tests**: `npm run test` (Karma unit tests) and, if needed, `npm run e2e` (Playwright/Cypress via `playwright.config.ts`).

When adding a new section:
- Create a standalone component under `src/app/shared/components/cards/sections/` with `standalone: true`, `OnPush`, and an exported `trackBy` helper.
- Wire `fieldInteraction` outputs that emit `{ field, metadata }` for upstream listeners.
- Avoid declaring column spans—let `MasonryGridComponent` determine them automatically.
- Import the shared mixins and tokens from `styles/styles.scss` (e.g., `@include card`, `@include section-grid`).

## Continuous Integration

The pipeline lives in `.github/workflows/ci-cd.yml` and includes the following jobs:

- **Lint & Format** – runs ESLint + style checks.
- **Unit Tests** – executes Jasmine/Karma suites via `npm run test`.
- **Build** – triggers `npm run build` to ensure bundling succeeds.
- **Security + Quality** – runs SonarQube, Snyk, vulnerability scanning, and container image validation when secrets are available.
- **Performance/Size** – evaluates payload size through `scripts/size-check.js`.
- **Cleanup** – reports job summaries and notifies downstream tools.

Workflow updates require `workflow` scope; CLI pushes touching `.github/workflows` must be coordinated with repo maintainers.

## Repository Hygiene

- Legacy architecture markers such as `ANTI_BLUR_OPTIMIZATIONS.md`, `STYLING_FRAMEWORK.md`, and others have been consolidated into this README so the repository's root stays focused on runnable code.
- `dist/`, `node_modules/`, and generated artifacts remain out of version control; only source and configuration files live under `src/`, `scripts/`, and `environments/`.

## Troubleshooting & Tips

- If `npm start` stalls, delete `node_modules/` and rerun `npm ci` (Angular CLI prompts happen when dependencies diverge).
- To update the card dataset dynamically, call `CardDataService.switchProvider(...)` with a `websocket-card-provider` instance and ensure it implements `subscribeToUpdates` if live edits are required.
- When adjusting typography or spacing, update the SCSS tokens under `styles/core/_variables.scss` before touching the section components.

## Want to Contribute?

1. Follow the `@mixin card` pattern plus typography mixins when editing or adding sections.
2. Keep reducers immutable in `store/cards/cards.state.ts` and use `ensureCardIds` before upserting.
3. Run the relevant tests (`npm run test`, `npm run lint`) before opening a PR.
4. Mention any new section types in `SectionRendererComponent` and `CardSection['type']` so templates and JSON configs align.

Anything unclear or missing in this set of instructions?