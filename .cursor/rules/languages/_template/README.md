# Adding a New Language

This template provides guidance for adding support for a new programming language to the Cursor Rules system.

## Steps to Add a Language

### 1. Create Language Directory

Create a new directory under `languages/`:

```bash
mkdir -p languages/your-language
```

### 2. Create Rule Files

Create `.mdc` files for your language's patterns. Recommended files:

- `code-quality.mdc` - Code quality standards, modern features
- `testing.mdc` - Testing framework and patterns
- `error-handling.mdc` - Error handling patterns
- `controllers.mdc` - Web framework controllers/endpoints
- `validation.mdc` - Input validation
- `dependencies.mdc` - Dependency injection/management
- `security.mdc` - Security-specific patterns
- `input-sanitization.mdc` - Input sanitization
- `logging.mdc` - Logging patterns

### 3. Set Appropriate Globs

In each `.mdc` file, set the `globs` field to match your language's file extensions:

```yaml
---
description: "Description of the rule"
globs: ["**/*.py"]  # For Python
# or
globs: ["**/*.go"]  # For Go
# etc.
---
```

### 4. Reference Universal Patterns

Reference patterns from `../../patterns/` when applicable:

```markdown
**See also:** `patterns/architecture.mdc`, `patterns/error-handling.mdc`
```

### 5. Focus on Language-Specific Details

- How to implement patterns in your language
- Language-specific libraries and frameworks
- Language idioms and best practices
- Framework-specific patterns (e.g., Django, Flask, Gin, Echo)

## Example: Python

```markdown
---
description: "Python code quality, PEP 8, type hints"
globs: ["**/*.py"]
---

# Python Code Quality

## PEP 8 Compliance

Follow PEP 8 style guide...

## Type Hints

Use type hints for better code clarity...

**See also:** `patterns/code-quality.mdc`, `testing.mdc`
```

## Example: Go

```markdown
---
description: "Go code quality, gofmt, idiomatic Go"
globs: ["**/*.go"]
---

# Go Code Quality

## Code Formatting

Use `gofmt` for formatting...

## Error Handling

Go's explicit error handling...

**See also:** `patterns/error-handling.mdc`, `testing.mdc`
```

## Testing Your Rules

1. Create a test file in your language
2. Open it in Cursor
3. Verify that the rules are being applied
4. Check that the AI follows the patterns

## Best Practices

- Keep language-specific rules focused on implementation details
- Reference universal patterns rather than duplicating them
- Use clear, descriptive file names
- Include code examples in your language
- Document language-specific libraries and tools

## Need Help?

Refer to existing language implementations (e.g., `languages/typescript/`) for examples of how to structure your rules.













