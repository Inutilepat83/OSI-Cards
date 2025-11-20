# TOON Mapping for OSI Cards

This document captures how the existing `AICardConfig`/`CardSection`/`CardField` shapes translate into the Token-Oriented Object Notation (TOON) that powers the new config pipeline.

## 1. High-level card shape
- **Header** – use `cardTitle:`, `cardSubtitle:`, `cardType:` (optional for demo cards), `description:`, `columns:` (1|2|3), plus metadata fields such as `meta:` or `metadata:` when needed.
- **Sections array** – declare with `sections[N]:` followed by hyphenated entries that mimic YAML-style objects. Always include `title` and `type`; optional Ant properties (`subtitle`, `description`, `columns`, `collapsed`, etc.) follow the same `key: value` pattern.
- **Actions array** – when actions are present, encode as `actions[M]{label,type,icon,action}:` with rows describing each action (see example below).

## 2. Section details
- **Primitive sections** (info, metrics, contact cards): use a table header when all fields share the same set of primitive keys. The header looks like `fields[K]{field1,field2}:` followed by rows such as `Dashboard Type,Operations Analytics`. This keeps TOON compact while retaining column order for LLMs.
- **Mixed or nested fields**: if fields include sub-objects (`contact`, `reference`) or vary in keys, fall back to list format (`fields[K]: - label: Foo`).
- **Charts and analytics**: complex payloads (e.g., `chartData`, `datasets`) can stay as nested TOON objects, relying on indentation rather than tables since objects do not need explicit tabular rows.

## 3. Field encoding tips
- Maintain the same `label`, `value`, `percentage`, `trend`, `change`, `performance`, etc. as in JSON so existing section components do not need mapping logic.
- Numeric values stay numeric; strings that include commas or structural tokens must be quoted per TOON quoting rules.
- Use `keyFolding: 'safe'` when encoding so single-key wrappers collapse (e.g., `metadata.category` becomes `metadata.category:`).

## 4. Sample conversion (derived from the analytics JSON templates, e.g. `src/assets/configs/analytics/analytics-enterprise-v3.json`)

```
cardTitle: Operational Efficiency Analytics
sections[2]:
  - title: Analytics Overview
    type: info
    fields[6]{label,value}:
      Dashboard Type,Operations Analytics
      Data Source,ERP & Operations Systems
      Update Frequency,Daily
      Time Range,Current Month
      Metrics Tracked,25+ KPIs
      Departments,All Operations
  - title: Efficiency Metrics
    type: analytics
    fields[4]{label,value,percentage,performance,trend,change}:
      Process Efficiency,87%,87,excellent,up,4
      Cost Reduction,15%,15,excellent,up,3
      Automation Rate,72%,72,good,up,8
      Resource Utilization,82%,82,good,stable,1
actions[2]{label,type,icon,action}:
  View Dashboard,primary,📊,#
  Generate Report,primary,📥,#
```

## 5. Tooling & workflow
- Run `npm run convert:toon` to regenerate TOON files from `src/assets/configs/**/*.json`. The script accepts substring filters (e.g., `npm run convert:toon analytics`) and `--dry-run` for validation before writing.
- Encourage contributors to keep the JSON artifacts aligned with the manifest; the `scripts/convert-configs-to-toon.js` utility can still regenerate `.toon` artifacts on demand when a TOON sample is required for documentation or export.

## 6. Future runtime mapping
- When consuming TOON payloads, decode them via `decode` from `@toon-format/toon`, then normalize into `AICardConfig` using `CardUtils.sanitizeCardConfig`. Maintain `ensureCardIds`, `removeAllIds`, and NgRx actions (`generateCard`, `loadTemplate`, `searchCards`) so selectors and effects remain stable.
- Consider a dedicated provider (e.g., `ToonCardProvider`) that feeds `CardDataService` with decoded TOON data, exposes `supportsRealtime`, and plugs into `switchProvider` for on-the-fly migration.

## 7. QA notes
- Validate the TOON files with `npx @toon-format/cli --decode path/to/file.toon` whenever you change the structure.
- For new section types or metadata, update `SectionRendererComponent`'s `resolvedType` and `CardSection['type']` union so the renderer stays in sync.