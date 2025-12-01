# Changelog

All notable changes to OSI Cards will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- TBD

## [1.5.3] - 2025-12-01

> Released: 2025-12-01T16:59:42.110Z

### ✨ Features

- **version**: add unified version management system (`d0ee086`)

### 🐛 Bug Fixes

- **build**: resolve TypeScript unused declaration errors (`e82f63f`)
- **ci**: simplify workflows and fix npm install flags (`44a2ad4`)
- **build**: disable font inlining to fix CI build (`ac6abb5`)
- **ci**: skip husky install in CI with --ignore-scripts (`d583e9b`)
- **ci**: add --legacy-peer-deps to fix npm dependency conflict (`ee71e2d`)
- **typescript**: fix index signature property access and duplicate imports (`aaa6164`)
- resolve build errors for npm publishing (`09af1f1`)

### ⚡ Performance

- **ci**: optimize GitHub Actions build times (`897bf8e`)

### 📚 Documentation

- add auto-monitoring and auto-fix scripts to push-code (`fd96b52`)
- add pipeline and deployment status checks to push-code (`56929d3`)
- update push-code checklist with practical workflow (`413b928`)

## [1.5.2] - 2025-12-01

> Released: 2025-12-01T13:24:45.764Z

### 🐛 Bug Fixes

- **build**: disable font inlining to fix CI build (`ac6abb5`)
- **ci**: skip husky install in CI with --ignore-scripts (`d583e9b`)
- **ci**: add --legacy-peer-deps to fix npm dependency conflict (`ee71e2d`)
- **typescript**: fix index signature property access and duplicate imports (`aaa6164`)
- resolve build errors for npm publishing (`09af1f1`)

### 📚 Documentation

- add auto-monitoring and auto-fix scripts to push-code (`fd96b52`)
- add pipeline and deployment status checks to push-code (`56929d3`)
- update push-code checklist with practical workflow (`413b928`)

## [1.2.2] - 2025-11-27

### Added
- TBD

## [1.2.1] - 2025-11-27

### Added
- TBD

## [1.2.0] - 2025-11-27

### Added
- Agent service for AI-powered interactions and chat functionality
- Chat service for conversational interfaces
- Web Vitals service for comprehensive performance monitoring
- CSP nonce service for enhanced security headers
- Focus management service for improved accessibility
- Toast service for user notifications
- Error boundary utilities for better error handling
- Image optimization utilities for performance
- Error messages utilities for consistent error handling
- Live region directive for accessibility announcements
- WebP image pipe for optimized image loading
- Dev tools components for development assistance
- Performance dashboard components
- Enhanced E2E test coverage with Playwright
- Comprehensive documentation in docs/ directory
- Library documentation in projects/osi-cards-lib/docs/
- Plugin system architecture for extensible section types
- Card spawner utilities for dynamic card generation
- Style validator utilities for runtime validation
- Event middleware service for event handling
- Section plugin registry service for plugin management
- Preset configurations for common card types
- Theme system for customizable styling
- Card body, header, and footer components for better structure
- Example implementations in library

### Changed
- Improved library structure with better component organization
- Enhanced TypeScript strict mode compliance
- Updated all documentation to reflect current architecture
- Improved error handling across all services
- Enhanced logging with structured logging service
- Better separation of concerns with modular components
- Updated build scripts and configuration
- Improved test coverage and test utilities

### Fixed
- TypeScript compilation errors
- Import/export issues in library
- Documentation inconsistencies
- Build and deployment scripts

## [1.1.3] - 2025-11-27

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
- Comprehensive documentation: Accessibility Guide, Security Best Practices, Bundle Optimization, Input Sanitization Audit, JSDoc Coverage, Request Cancellation, Test Coverage Improvements, Validation Decorators Usage
- IndexedDB cache service for offline data persistence
- Request queue service for managing concurrent requests
- Additional test coverage for components and services

### Changed
- Replaced all console.log/error/warn statements with LoggingService calls across all files
- Enhanced ErrorHandlingService with automatic retry and fallback mechanisms
- Improved error recovery with configurable retry strategies
- Updated architecture diagrams and documentation
- Enhanced integration guides and examples

### Fixed
- Console statement cleanup across services and components

## [0.0.1] - 2025-11-26

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

- [GitHub Releases](https://github.com/Inutilepat83/OSI-Cards/releases)
- [Documentation](./README.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Developer Guide](./docs/DEVELOPER_GUIDE.md)






