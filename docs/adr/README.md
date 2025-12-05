# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) documenting significant architectural decisions made in the OSI Cards project.

## What is an ADR?

An Architecture Decision Record captures an important architectural decision made along with its context and consequences.

## Format

Each ADR follows this structure:
- **Title:** Decision title
- **Status:** Proposed | Accepted | Deprecated | Superseded
- **Context:** Why this decision was needed
- **Decision:** What was decided
- **Consequences:** Impact of the decision
- **Alternatives:** Other options considered

## Current ADRs

1. [ADR-001: Component-Based Section Rendering](./ADR-001-component-sections.md)
2. [ADR-002: Masonry Grid Layout Strategy](./ADR-002-masonry-grid.md)
3. [ADR-003: LLM Streaming Architecture](./ADR-003-streaming-architecture.md)
4. [ADR-004: NgRx State Management](./ADR-004-ngrx-state.md)
5. [ADR-005: Layout Services Extraction](./ADR-005-layout-services.md) - NEW
6. [ADR-006: Utility Curation Strategy](./ADR-006-utility-curation.md) - NEW

## Creating New ADRs

When making significant architectural decisions:

1. Copy template: `cp ADR-000-template.md ADR-XXX-title.md`
2. Fill in sections
3. Discuss with team
4. Update status when decided
5. Link from README

---

**Last Updated:** December 4, 2025


