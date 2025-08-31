Demo card assets

This folder contains example card JSONs used by the OSI Cards demo UI.

Structure
- index.json: catalog of cards and available variants.
- <id>.variantX.json: individual card JSON describing layout, sections and actions.

Usage
- The app includes a `DemoCardLoaderService` which fetches cards by id and variant from `/assets/cards/demo`.
- Example API: `/assets/cards/demo/dsm-company.variant1.json`.

How to add a new card
1. Add your JSON file as `<your-id>.variant1.json` (and add variant2/3 as needed).
2. Update `index.json` to include the new card id and variants.

Notes
- These demo JSONs are intentionally permissive; consumers should validate shapes before rendering.
- Unit tests in `src/app/core/services/__tests__` verify schema compatibility for demo files.
