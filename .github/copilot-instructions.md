# OSI Cards - AI Agent Inst### Building & Testing
```bash
npm run start:safe              # Safe start with lint + timeout (recommended)
npm run start:timeout          # Start with 30s timeout
npm run start:timeout:short     # Start with 15s timeout  
npm start                       # Standard start (may hang on errors)
npm run test:watch              # TDD with Karma
npm run lint:fix                # Auto-fix ESLint issues
npm run analyze                 # Bundle analysis
npm run clean                   # Clean build artifacts
```

**Development Helper**: Use `./dev.sh [safe|quick|normal|clean]` for common workflows with built-in timeout protection.

### Build Error Handling
- **Timeout Script**: Use `npm run start:timeout` to automatically stop hung builds
- **Current Issues**: The project has compilation errors in `app.routes.optimized.ts` and `virtual-card-list.component.ts`
- **Safe Start**: Use `npm run start:safe` to lint first, then start with timeout
- **Manual Recovery**: Run `npm run clean && npm install` if builds fail consistently

## Code Quality & Error Prevention

### Always Check for Errors First
- **Before any code changes**: Run `npm run lint:fix` to identify issues
- **Use get_errors tool**: Check compile/lint errors in files before editing
- **Immediate feedback**: Timeouts detect compilation failures within 15-30 seconds
- **Auto-fix approach**: Prioritize fixing existing errors over adding new features

### Error Detection Patterns
- **TypeScript Errors**: Look for `error TS` patterns in build output
- **Import Issues**: Missing modules often indicate structural problems
- **Syntax Errors**: Malformed import statements, missing brackets, etc.
- **Build Process**: Always validate changes don't break compilation

### Proactive Error Fixing
- **Read error messages carefully**: TypeScript errors are usually specific and actionable
- **Fix import paths**: Many current errors are missing component/module imports
- **Validate file structure**: Ensure referenced files actually exist
- **Test immediately**: Use quick timeout scripts to validate fixes fastect Overview
OSI Cards is a sophisticated Angular 17+ card management system with interactive visualization capabilities. Core domain: JSON-based card configuration with real-time preview, 3D tilt effects, and multiple content types (charts, maps, analytics).

## Architecture Patterns

### State Management (NgRx)
- **Store Structure**: Multi-slice architecture in `src/app/store/` - cards, ui, performance, feature-flags, analytics
- **Example**: `AppState` interface in `store/app.state.ts` defines complete application state
- **Actions/Reducers**: Follow NgRx pattern with typed actions, use `createAction` and `createReducer`
- **Selectors**: Use memoized selectors for performance optimization

### Component Design
- **Always use `ChangeDetectionStrategy.OnPush`** - see examples in `features/home/components/`
- **Standalone Components**: No NgModules, use `standalone: true` and import dependencies directly
- **Signal-based**: Prefer Angular signals over traditional reactive patterns where appropriate
- **Memory Management**: Use `MemoryManagementService` for expensive objects (see `core/services/`)

### Card Configuration System
- **Schema**: `AICardConfig` interface in `models/card.model.ts` (444 lines) - comprehensive type definitions
- **Sections**: Typed section system with info, chart, map, list, analytics, contact, product, event types
- **Validation**: Runtime type validation with TypeScript strict mode
- **Examples**: Reference `assets/examples/` for valid configuration patterns

## Critical Development Workflows

### Building & Testing
```bash
npm run start:safe              # Safe start with lint + timeout (recommended)
npm run start:timeout          # Start with 5min timeout
npm run start:timeout:short     # Start with 2min timeout  
npm start                       # Standard start (may hang on errors)
npm run test:watch              # TDD with Karma
npm run lint:fix                # Auto-fix ESLint issues
npm run analyze                 # Bundle analysis
npm run clean                   # Clean build artifacts
```

### Build Error Handling
- **Timeout Script**: Use `npm run start:timeout` to automatically stop hung builds
- **Current Issues**: The project has compilation errors in `app.routes.optimized.ts` and `virtual-card-list.component.ts`
- **Safe Start**: Use `npm run start:safe` to lint first, then start with timeout
- **Manual Recovery**: Run `npm run clean && npm install` if builds fail consistently

### Performance Requirements
- **Object Pooling**: Use `MemoryManagementService.getPooledObject()` for expensive operations
- **TrackBy Functions**: Required for all `*ngFor` loops with dynamic data
- **Lazy Loading**: Feature modules use dynamic imports in routes (see `cards.routes.ts`)
- **Change Detection**: Profile with `environment.enableChangeDetectionProfiling`

## Project-Specific Conventions

### File Organization
- **Features**: Domain-driven in `src/app/features/` (cards, home, admin, analytics)
- **Core**: Cross-cutting concerns in `src/app/core/` (services, interceptors, state)
- **Models**: Centralized interfaces in `src/app/models/` with comprehensive TypeScript types
- **Store**: NgRx slices with actions, reducers, effects, selectors per feature

### Service Patterns
- **Injectable Root**: Core services use `providedIn: 'root'`
- **Memory Management**: Critical for card rendering performance - see `MemoryManagementService`
- **Error Handling**: Global error handler in `core/error/global-error-handler.ts`
- **Performance Monitoring**: Built-in performance tracking in `core/performance/`

### Card System Integration
- **Card Types**: 'company', 'contact', 'opportunity', 'product', 'analytics', 'project', 'event'
- **Section Processing**: Use `AICardRenderer` for display, handle all section types
- **3D Effects**: `TiltWrapper` component for interactive card animations
- **Configuration**: JSON files in `assets/examples/` follow strict schema

## Technology Integration
- **Charts**: Chart.js integration for analytics sections
- **Maps**: Leaflet integration for location-based content  
- **Material**: Angular Material + PrimeNG for UI components
- **Styling**: Tailwind CSS with custom design system
- **PWA**: Service worker integration for offline capabilities

## Testing Patterns
- **Unit Tests**: Jasmine + Karma, comprehensive coverage for models and services
- **Type Guards**: Test runtime validation in `card.model.spec.ts`
- **Performance**: Memory leak testing with `MemoryManagementService`
- **E2E**: Playwright tests in `e2e/` for critical user workflows

## Migration Context
This project was migrated from React/Vite to Angular. Legacy patterns from React should be avoided in favor of Angular-specific approaches (signals, OnPush, dependency injection).
