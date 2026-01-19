# Cursor Rules - Angular Library Development

A comprehensive rule system for Angular library development with OSI Cards, focusing on component architecture, testing, and best practices.

## What is This?

This repository contains a comprehensive rule system for Cursor AI that enforces:

✅ Test-Driven Development (TDD) workflows
✅ Angular component architecture (standalone, OnPush, signals)
✅ Component library patterns
✅ Frontend security best practices
✅ Production-grade error handling and logging
✅ Jasmine/Karma testing patterns
✅ Playwright E2E testing

## Structure

```
.cursor/rules/
├── patterns/                  # Angular-specific patterns
│   ├── angular-components.mdc    # Standalone components, OnPush, signals
│   ├── angular-library.mdc       # Library patterns, public API, providers
│   ├── shadow-dom.mdc            # Shadow DOM encapsulation
│   ├── scss-styling.mdc          # SCSS patterns, design tokens
│   ├── architecture.mdc          # Component architecture, SOLID
│   ├── testing.mdc               # Jasmine/Karma + Playwright
│   ├── security.mdc              # Frontend security (XSS, CSP)
│   └── error-handling.mdc        # Angular error handling
│
├── development/               # Development workflow
│   ├── tdd-planning.mdc          # Test planning requirements
│   ├── code-implementation.mdc   # Implementation workflow
│   ├── browser-testing-workflow.mdc # Browser testing
│   ├── log-analysis.mdc          # Log analysis
│   ├── consistency-enforcement.mdc # Consistency rules
│   └── comprehensive-qa-checklist.mdc # QA checklist
│
└── languages/                 # Language-specific implementations
    └── typescript/            # TypeScript / Angular
        ├── code-quality.mdc
        ├── testing.mdc          # Jasmine/Karma + Playwright
        ├── error-handling.mdc
        ├── validation.mdc       # Angular forms validation
        ├── dependencies.mdc
        ├── security.mdc         # Frontend security
        └── logging.mdc
```

## Key Features

### Angular Library Focus

The AI agent operates as an Angular library developer with:

- Deep knowledge of Angular component architecture
- Standalone components, OnPush change detection, signals
- Shadow DOM encapsulation patterns
- Component library best practices
- SCSS and design token patterns

### Testing

Enforces comprehensive testing:

- **Jasmine + Karma** for unit tests
- **Playwright** for E2E tests
- TDD workflow (Red-Green-Refactor)
- Component testing with TestBed
- Service testing patterns

### Architecture Patterns

Built-in support for:

- **Component Architecture** - Standalone components, OnPush
- **Service Layer** - Injectable services, dependency injection
- **Library Patterns** - Public API, providers, exports
- **Shadow DOM** - Style isolation, encapsulation
- **SOLID Principles** - Applied to Angular components

### Security

Frontend security guidance:

- XSS prevention (Angular's built-in protection)
- Content Security Policy (CSP)
- Input validation (Angular forms)
- URL validation
- Dependency security
- Secure error messages

## Supported Technologies

### Angular Library

Technologies covered:

- Angular 17-20 (standalone components, signals)
- TypeScript 5.8 (strict mode)
- Jasmine + Karma (unit testing)
- Playwright (E2E testing)
- SCSS (component styles, design tokens)
- Shadow DOM (style encapsulation)
- RxJS (reactive programming)

## How It Works

### Always Applied Rules

Core behavioral rules are always active:

- Agent persona and behavior
- TDD workflow requirements
- Browser testing requirements
- Log analysis requirements

### Pattern Rules

Angular-specific patterns in `patterns/` define:

- Component architecture patterns
- Library development patterns
- Testing patterns
- Security patterns
- Error handling patterns

### Language-Specific Rules

Files in `languages/typescript/` activate based on file extensions:

- `**/*.ts` → TypeScript rules
- `**/*.tsx` → TypeScript rules
- Angular-specific implementations

## Rule File Format

Each `.mdc` file uses frontmatter and Markdown:

```markdown
---
description: "Brief description"
globs: ["**/*.ext"]           # Optional: when to apply
alwaysApply: true             # Optional: always active
---

# Title

## Content

Rule content in Markdown...

**See also:** Links to related rules
```

## What You Get

### Definition of Done

Every task ensures:

✅ Project builds without errors/warnings
✅ All tests pass (Jasmine/Karma + Playwright)
✅ No console errors
✅ Browser tested (for UI changes)
✅ Logs analyzed
✅ No secrets exposed
✅ Changes documented with clear reasoning

### Code Review Process

Built-in iterative code review:

1. Complete task
2. Identify improvements
3. Implement optimizations
4. Repeat until satisfied

## Usage

Once installed, simply open your project in Cursor. The AI will automatically:

- Act as an Angular library developer
- Follow TDD workflows
- Apply Angular-specific best practices
- Enforce security and quality standards

No additional configuration needed!

## Documentation

- **Patterns**: See `patterns/` for Angular patterns
- **Development**: See `development/` for workflow guidance
- **Language-Specific**: See `languages/typescript/` for TypeScript/Angular rules

---

**Maintained with ❤️ for Angular library development**
