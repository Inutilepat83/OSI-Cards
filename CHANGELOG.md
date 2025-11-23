# Changelog

All notable changes to OSI Cards will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Command pattern for undo/redo functionality with keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- Input validation decorators for runtime validation of card inputs and section types
- Automatic retry logic and fallback strategies in ErrorHandlingService
- Rate limiting HTTP interceptor with token bucket algorithm
- Resource hints (preconnect, preload, dns-prefetch) for performance optimization
- LLMSimulationControlsComponent for better component separation
- PreviewControlsComponent for preview-related controls
- SystemStatsComponent for displaying system statistics
- Comprehensive validation decorators (@Validate, @ValidateCardType, @ValidateSectionType, etc.)

### Changed
- Replaced all console.log/error/warn statements with LoggingService calls across all files
- Enhanced ErrorHandlingService with automatic retry and fallback mechanisms
- Improved error recovery with configurable retry strategies

### Fixed
- Console statement cleanup across services and components

## [0.0.1] - 2025-01-XX

### Added
- Initial release of OSI Cards
- Core card rendering system with 20+ section types
- Masonry grid layout engine
- LLM streaming simulation
- NgRx state management
- Performance monitoring with Web Vitals
- Comprehensive test builders
- Architecture documentation
- Developer guide

### Security
- XSS protection utilities
- Input sanitization
- Security headers utilities

### Performance
- OnPush change detection strategy
- Virtual scrolling utilities
- Performance budgets
- Bundle size optimization tools

### Accessibility
- ARIA labels and live regions
- Keyboard navigation support
- Focus trap directive
- Skip link directive

---

## Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backwards compatible manner
- **PATCH** version for backwards compatible bug fixes

### Breaking Changes
Breaking changes will be clearly marked in the changelog with a `[BREAKING]` prefix.

### Migration Guides
For major version updates, migration guides will be provided in the `docs/` directory.

---

## Links

- [GitHub Releases](https://github.com/your-org/osi-cards/releases)
- [Documentation](./README.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Developer Guide](./docs/DEVELOPER_GUIDE.md)



