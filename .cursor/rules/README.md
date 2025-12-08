# Cursor Rules - Enterprise Backend Engineering Suite

A production-ready, extensible rule system for Cursor AI that transforms your coding assistant into a Senior Principal Backend Engineer with 20+ years of enterprise experience.

## 🎯 What is This?

This repository contains a comprehensive, language-agnostic rule system for Cursor AI that enforces:

✅ Test-Driven Development (TDD) workflows
✅ Clean Architecture and SOLID principles
✅ Enterprise security best practices
✅ Production-grade error handling and logging
✅ CQRS and Domain-Driven Design patterns
✅ Multi-language support (TypeScript/Angular, and extensible to more)

## 📁 Structure

```
.cursor/rules/
├── patterns/                  # Language-agnostic patterns & concepts
│   ├── architecture.mdc       # Clean Architecture, CQRS, DDD, SOLID
│   ├── error-handling.mdc     # Result pattern, RFC 7807
│   ├── testing.mdc            # TDD workflow, AAA pattern
│   ├── security.mdc           # Security principles
│   ├── api-design.mdc         # REST conventions
│   ├── input-sanitization.mdc # Validation concepts
│   └── cqrs.mdc               # Command/Query separation
│
├── development/               # Development workflow
│   ├── tdd-planning.mdc       # Test planning requirements
│   └── code-implementation.mdc # Implementation workflow
│
└── languages/                 # Language-specific implementations
    └── typescript/            # TypeScript / Angular (10 files)
        ├── code-quality.mdc
        ├── testing.mdc
        ├── error-handling.mdc
        ├── controllers.mdc
        ├── validation.mdc
        ├── dependencies.mdc
        ├── security.mdc
        ├── input-sanitization.mdc
        └── logging.mdc
```

## 🌟 Key Features

### 🤖 AI Persona

The AI agent operates as a Senior Principal Backend Engineer with:

- 20+ years of enterprise experience
- Deep knowledge of distributed systems
- High-availability production environment expertise
- Strong emphasis on asking clarifying questions (never assumes!)

### 🧪 Test-Driven Development (TDD)

Enforces a strict TDD workflow:

- **RED** - Write a failing test
- **GREEN** - Minimal code to pass
- **REFACTOR** - Clean up while keeping tests green

### 🏗️ Architecture Patterns

Built-in support for:

- **Vertical Slice Architecture** - Organize by feature, not layer
- **Clean Architecture** - Domain, Application, Infrastructure, API
- **CQRS** - Command/Query separation
- **Domain-Driven Design** - Aggregates, Value Objects, Domain Events

### 🛡️ Security First

Comprehensive security guidance:

- Input validation and sanitization
- SQL injection, XSS, and path traversal prevention
- Secrets management (no hardcoded credentials)
- HTTPS, CORS, and security headers
- JWT and OAuth2 patterns

### 📊 Code Quality

Enforces modern language features and best practices:

- TypeScript strict mode
- Modern TypeScript features (5.0+)
- Nullable reference types
- Async/await patterns
- Structured logging

## 🌍 Supported Languages

### TypeScript / Angular

10 comprehensive rule files covering:

| Category | Files |
|----------|-------|
| Core | code-quality, testing, error-handling, dependencies |
| Web | controllers, validation, input-sanitization |
| Infrastructure | logging |
| Security | security, input-sanitization |

**Technologies:**
- TypeScript 5.0+, Angular
- Jest/Vitest
- class-validator, Zod
- RxJS
- Angular Testing Utilities

## 🔧 How It Works

### Always Applied Rules

Core behavioral rules are always active:

- Agent persona and behavior
- TDD workflow requirements
- Rule flagging and retrospectives

### Pattern Rules

Language-agnostic concepts in `patterns/` define:

- What patterns to use
- When to apply them
- Universal best practices

### Language-Specific Rules

Files in `languages/*/` activate based on file extensions:

- `**/*.ts` → TypeScript rules
- `**/*.tsx` → TypeScript rules
- Implementation details for each pattern

## 🎨 Adding a New Language

The system is designed to be easily extensible. To add support for a new language:

1. Create `languages/your-language/` folder
2. Create `.mdc` files for your language's patterns
3. Set appropriate globs for file matching
4. Reference universal patterns from `../../patterns/`
5. Focus on language-specific implementations

## 📝 Rule File Format

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

## 🎓 What You Get

### Definition of Done

Every task ensures:

✅ Project builds without errors/warnings
✅ All tests pass
✅ No secrets exposed
✅ Changes documented with clear reasoning

### Code Review Process

Built-in iterative code review:

1. Complete task
2. Identify improvements
3. Implement optimizations
4. Repeat until satisfied

### Retrospective Protocol

After each task, the AI evaluates:

- Rule effectiveness
- Gaps encountered
- Contradictions
- Improvement proposals

## 💡 Benefits

| Benefit | Description |
|---------|-------------|
| Single Source of Truth | One place for all rule definitions |
| Easy Discovery | Clear, hierarchical folder structure |
| Language Agnostic | Patterns work for any language |
| Maintainable | Changes to patterns cascade to all languages |
| Scalable | Simple to add new languages and patterns |
| Consistent | Same methodologies across all languages |

## 🚀 Usage

Once installed, simply open your project in Cursor. The AI will automatically:

- Act as a Senior Principal Backend Engineer
- Follow TDD workflows
- Apply language-specific best practices
- Enforce security and quality standards

No additional configuration needed!

## 📚 Documentation

- **Patterns**: See `patterns/` for universal patterns
- **Development**: See `development/` for workflow guidance
- **Language-Specific**: See `languages/typescript/` for TypeScript/Angular rules

## 🤝 Contributing

Contributions are welcome! Whether you want to:

- 🌐 Add a new language
- 📚 Improve existing rules
- 🐛 Fix issues or gaps
- 💡 Suggest new patterns

When Adding Rules:

- Universal concepts → `patterns/`
- Language-specific → `languages/{lang}/`
- Always-active rules → root level with `alwaysApply: true` (rare)
- Development workflow → `development/` (rare)

---

**Maintained with ❤️ for enterprise-grade development**









