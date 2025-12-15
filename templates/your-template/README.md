# OSI Cards Template Configuration

This template defines architectural patterns and coding standards for the OSI Cards project.

## Files

- **`architect.yaml`** - Design patterns organized by file path
- **`RULES.yaml`** - Specific coding rules and standards
- **`project.json`** - Project metadata and configuration

## Quick Reference

### Checking Patterns

Ask AI: "What patterns apply to [file path]?"

### Validating Code

Ask AI: "Review [file path] for pattern compliance"

### Adding Patterns

1. Edit `architect.yaml` for design patterns
2. Edit `RULES.yaml` for coding rules
3. Patterns are applied automatically via MCP

## Pattern Hierarchy

1. **Global Patterns** (`**/*.ts`) - Apply to all TypeScript files
2. **Template Patterns** (path-specific) - Apply to matching file paths
3. **Project Patterns** - Override template patterns when needed

## Key Patterns

- **Service Layer** - Dependency injection, no direct DB access
- **Component** - Standalone, OnPush, proper lifecycle
- **RxJS** - Proper subscription management
- **Error Handling** - Centralized error tracking
- **Performance** - OnPush, memoization, lazy loading
- **Accessibility** - WCAG compliance

See `docs/development/ARCHITECT_MCP_SETUP.md` for full documentation.













