# OSI Cards - Services Reference

This guide documents all services provided by the OSI Cards library.

## Table of Contents

- [Core Services](#core-services)
  - [OSICardsStreamingService](#osicardsstreamingservice)
  - [CardFacadeService](#cardfacadeservice)
  - [SectionNormalizationService](#sectionnormalizationservice)
  - [DynamicSectionLoaderService](#dynamicsectionloaderservice)
  - [SectionPluginRegistry](#sectionpluginregistry)
- [Animation Services](#animation-services)
  - [AnimationOrchestratorService](#animationorchestratorservice)
  - [MagneticTiltService](#magnetictiltservice)
- [Event Services](#event-services)
  - [EventBusService](#eventbusservice)
  - [EventMiddlewareService](#eventmiddlewareservice)
- [Feature Management](#feature-management)
  - [FeatureFlagsService](#featureflagsservice)
- [Utility Services](#utility-services)
  - [IconService](#iconservice)
  - [ThemeService](#themeservice)

---

## Core Services

### OSICardsStreamingService

Provides progressive card generation with streaming support. Simulates LLM streaming behavior for realistic card generation experiences.

#### Basic Usage

```typescript
import { OSICardsStreamingService } from 'osi-cards-lib';

const streamingService = inject(OSICardsStreamingService);

// Start streaming
streamingService.start(jsonString);

// Subscribe to card updates
streamingService.cardUpdates$.subscribe(update => {
  console.log('Card updated:', update.card);
  console.log('Change type:', update.changeType); // 'structural' | 'content'
  console.log('Completed sections:', update.completedSections);
});

// Subscribe to state changes
streamingService.state$.subscribe(state => {
  console.log('Stage:', state.stage); // 'idle' | 'thinking' | 'streaming' | 'complete' | 'error'
  console.log('Progress:', state.progress); // 0-1
});

// Subscribe to raw buffer updates (for JSON editor sync)
streamingService.bufferUpdates$.subscribe(buffer => {
  console.log('Current buffer:', buffer);
});

// Stop streaming
streamingService.stop();
```

#### Configuration

```typescript
interface StreamingConfig {
  minChunkSize: number;        // Default: 10
  maxChunkSize: number;        // Default: 50
  thinkingDelayMs: number;     // Default: 100
  charsPerToken: number;       // Default: 4
  tokensPerSecond: number;     // Default: 80
  cardUpdateThrottleMs: number; // Default: 50
  completionBatchDelayMs: number; // Default: 100
}

// Configure streaming behavior
streamingService.configure({
  tokensPerSecond: 120, // Faster streaming
  thinkingDelayMs: 200  // Longer thinking delay
});
```

#### Instant Mode

```typescript
// Skip streaming simulation, parse instantly
streamingService.start(jsonString, { instant: true });
```

#### State Interface

```typescript
interface StreamingState {
  isActive: boolean;
  stage: 'idle' | 'thinking' | 'streaming' | 'complete' | 'aborted' | 'error';
  progress: number; // 0-1
  bufferLength: number;
  targetLength: number;
}
```

---

### CardFacadeService

High-level facade for card operations, combining streaming, validation, and event handling.

```typescript
import { CardFacadeService } from 'osi-cards-lib';

const cardFacade = inject(CardFacadeService);

// Load card from JSON
const card = await cardFacade.loadFromJson(jsonString);

// Stream card generation
await cardFacade.streamCard(jsonString);

// Validate card configuration
const errors = cardFacade.validate(cardConfig);

// Subscribe to card changes
cardFacade.card$.subscribe(card => {
  // Handle card updates
});
```

---

### SectionNormalizationService

Normalizes section configurations, resolves type aliases, and handles section prioritization.

#### Basic Usage

```typescript
import { SectionNormalizationService } from 'osi-cards-lib';

const normalization = inject(SectionNormalizationService);

// Normalize a single section
const normalizedSection = normalization.normalizeSection(section);

// Normalize and sort all sections
const sections = normalization.normalizeAndSortSections(card.sections);

// Sort sections by priority
const sortedSections = normalization.sortSections(sections);
```

#### Priority Bands

Sections are organized into priority bands for sorting and condensation:

| Band | Types | Condense Priority |
|------|-------|-------------------|
| `critical` | overview, contact-card | Never |
| `important` | analytics, chart, stats, financials | Last |
| `standard` | info, list, product, solutions, map | Always |
| `optional` | news, event, timeline, quotation | First |

```typescript
// Get priority band for a type
const band = normalization.getPriorityBandForType('analytics'); // 'important'

// Get section priority for sorting
const priority = normalization.getSectionPriority(section);

// Get condensation order
const order = normalization.getCondensationOrder(section);

// Apply condensation (collapse least important sections)
const condensed = normalization.applyCondensation(sections, maxVisible);
```

#### Layout Priority

```typescript
// Get layout priority (1-3) for row-first packing
const layoutPriority = normalization.getLayoutPriorityForSection(section);

// Map priority band to numeric layout priority
const numericPriority = normalization.mapPriorityBandToLayoutPriority('important'); // 1
```

#### Column Preferences

```typescript
// Get preferred columns for a section type
const columns = normalization.getPreferredColumnsForType('analytics'); // 2
```

---

### DynamicSectionLoaderService

Dynamically loads section components based on type.

```typescript
import { DynamicSectionLoaderService } from 'osi-cards-lib';

const loader = inject(DynamicSectionLoaderService);

// Get component for a section
const component = loader.getComponentForSection(section);

// Resolve type to canonical form
const resolved = loader.resolveType('metrics'); // 'analytics'

// Check if type is supported
const supported = loader.isTypeSupported('custom-type');

// Get type metadata
const metadata = loader.getTypeMetadata('analytics');

// Get all supported types (built-in + plugins)
const types = loader.getSupportedTypes();

// Clear component cache (for hot reload)
loader.clearCache();
```

See [Plugin System](./PLUGIN_SYSTEM.md) for detailed documentation.

---

### SectionPluginRegistry

Manages custom section type plugins.

```typescript
import { SectionPluginRegistry } from 'osi-cards-lib';

const registry = inject(SectionPluginRegistry);

// Register a plugin
registry.register({
  type: 'custom-section',
  name: 'Custom Section',
  description: 'A custom section type',
  component: CustomSectionComponent,
  config: { priority: 10, override: false },
  metadata: { version: '1.0.0', author: 'Developer' }
});

// Register multiple plugins
registry.registerAll([plugin1, plugin2]);

// Check if plugin exists
registry.hasPlugin('custom-section');

// Get all registered plugins
const plugins = registry.getPlugins();

// Get plugin metadata
const meta = registry.getPluginMetadata('custom-section');

// Unregister a plugin
registry.unregister('custom-section');

// Clear all plugins
registry.clear();
```

See [Plugin System](./PLUGIN_SYSTEM.md) for detailed documentation.

---

## Animation Services

### AnimationOrchestratorService

Coordinates animation sequences for card and section transitions.

#### Basic Usage

```typescript
import { AnimationOrchestratorService } from 'osi-cards-lib';

const orchestrator = inject(AnimationOrchestratorService);

// Orchestrate a predefined sequence
await orchestrator.orchestrate('card-entrance', cardElement);
await orchestrator.orchestrate('section-reveal', sectionElement);

// With options
await orchestrator.orchestrate('card-entrance', element, {
  delay: 100,
  speed: 1.5,
  skipSteps: ['sections-stagger']
});
```

#### Animation Sequences

| Sequence | Description |
|----------|-------------|
| `card-entrance` | Card fade in with sections stagger |
| `section-reveal` | Section enter with fields populate |
| `fields-populate` | Field stagger animation |
| `items-stagger` | Items enter animation |
| `chart-animate` | Chart data animation |
| `streaming-update` | Content fade during streaming |
| `layout-transition` | FLIP-based layout changes |
| `section-complete` | Section highlight on completion |
| `card-exit` | Card exit animation |

#### FLIP Layout Animations

```typescript
// Animate layout changes using FLIP technique
await orchestrator.animateLayoutChange(container, () => {
  // Your layout update code
  updateSectionOrder();
});
```

#### Custom Presets

```typescript
// Register a custom animation preset
orchestrator.registerPreset({
  name: 'custom-entrance',
  sequence: {
    steps: [
      {
        name: 'fade-in',
        target: [],
        animation: { keyframes: [...], timing: { duration: 300 } },
        delay: 100
      }
    ],
    onComplete: () => console.log('Animation complete')
  }
});

// Use custom preset
await orchestrator.orchestrate('custom-entrance', element);
```

#### State Management

```typescript
// Get current state
const state = orchestrator.getState();
console.log(state.isAnimating);
console.log(state.currentSequence);
console.log(state.reducedMotion);

// Observe state changes
orchestrator.state$.subscribe(state => {
  if (state.isAnimating) {
    // Show loading indicator
  }
});

// Control animations
orchestrator.setGlobalSpeed(2); // 2x speed
orchestrator.pauseAll();
orchestrator.resumeAll();
orchestrator.cancelAll();

// Wait for completion
await orchestrator.waitForCompletion();
```

---

### MagneticTiltService

Creates interactive 3D tilt effects on cards.

#### Basic Usage

```typescript
import { MagneticTiltService, TiltCalculations } from 'osi-cards-lib';

const tiltService = inject(MagneticTiltService);

// Calculate tilt from mouse position
element.addEventListener('mousemove', (event) => {
  tiltService.calculateTilt(
    { x: event.clientX, y: event.clientY },
    element
  );
});

// Reset on mouse leave
element.addEventListener('mouseleave', () => {
  tiltService.resetTilt();
});

// Subscribe to tilt calculations
tiltService.tiltCalculations$.subscribe((tilt: TiltCalculations) => {
  element.style.transform = `
    perspective(1000px)
    rotateX(${tilt.rotateX}deg)
    rotateY(${tilt.rotateY}deg)
  `;
  element.style.boxShadow = `
    0 0 ${tilt.glowBlur}px rgba(99, 102, 241, ${tilt.glowOpacity})
  `;
});
```

#### TiltCalculations Interface

```typescript
interface TiltCalculations {
  rotateX: number;         // Vertical tilt angle
  rotateY: number;         // Horizontal tilt angle
  glowBlur: number;        // Glow blur radius
  glowOpacity: number;     // Glow opacity
  reflectionOpacity: number; // Reflection intensity
}
```

#### Cache Management

```typescript
// Clear cache for specific element
tiltService.clearCache(element);

// Clear all cached elements
tiltService.clearCache();
```

---

## Event Services

### EventBusService

Centralized pub/sub system for application-wide communication.

```typescript
import { EventBusService } from 'osi-cards-lib';

const eventBus = inject(EventBusService);

// Emit events
eventBus.emit('card:created', { cardId: '123', title: 'Test' });
eventBus.emitCardCreated({ cardId: '123', title: 'Test', sectionCount: 3 });
eventBus.emitThemeChanged('day', 'night');

// Subscribe to events
eventBus.on('card:updated', (event) => console.log(event.payload));
eventBus.onAny(['card:created', 'card:updated'], handler);
eventBus.onCardLifecycle(handler);
eventBus.onStreaming(handler);
eventBus.onError(handler);

// Observables
eventBus.select('card:updated').subscribe(...);
eventBus.events$.subscribe(...);

// Event history
eventBus.getHistory('card:created', 10);
eventBus.replay(handler, 'card:created', 5);
eventBus.clearHistory();
```

See [Event System](./EVENT_SYSTEM.md) for detailed documentation.

---

### EventMiddlewareService

Middleware chain for event processing.

```typescript
import { EventMiddlewareService } from 'osi-cards-lib';

const middleware = inject(EventMiddlewareService);

// Add middleware
const remove = middleware.addMiddleware({
  priority: 100,
  handle: (event, next) => {
    console.log('Event:', event);
    return next(event);
  }
});

// Use built-in factories
middleware.addMiddleware(middleware.createLoggingMiddleware());
middleware.addMiddleware(middleware.createFilterMiddleware(e => e.type !== 'navigation'));
middleware.addMiddleware(middleware.createAnalyticsMiddleware(trackEvent));

// Subscribe to events
middleware.processedEvents$.subscribe(...);
middleware.rawEvents$.subscribe(...);

// Remove middleware
remove();
middleware.clearMiddleware();
```

See [Event System](./EVENT_SYSTEM.md) for detailed documentation.

---

## Feature Management

### FeatureFlagsService

Runtime feature flag system for controlling library behavior.

#### Basic Usage

```typescript
import { FeatureFlagsService, OSI_FEATURE_FLAGS } from 'osi-cards-lib';

const featureFlags = inject(FeatureFlagsService);

// Check if feature is enabled
if (featureFlags.isEnabled(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL)) {
  // Use virtual scrolling
}

// Enable/disable features
featureFlags.enable(OSI_FEATURE_FLAGS.SKYLINE_PACKING);
featureFlags.disable(OSI_FEATURE_FLAGS.WEB_WORKERS);
featureFlags.toggle(OSI_FEATURE_FLAGS.DEBUG_OVERLAY);

// Configure multiple flags
featureFlags.configure({
  virtualScroll: true,
  skylinePacking: true,
  perfLogging: false
});

// Reset to defaults
featureFlags.reset();
```

#### Available Flags

| Flag | Default | Mutable | Description |
|------|---------|---------|-------------|
| `virtualScroll` | false | ✓ | Use virtual scrolling for large lists |
| `skylinePacking` | false | ✓ | Use skyline packing algorithm |
| `webWorkers` | false | ✓ | Offload layout to Web Workers |
| `streamingV2` | false | ✗ | Experimental streaming optimizations |
| `signals` | false | ✗ | Use Angular signals |
| `containerQueries` | false | ✓ | CSS container queries |
| `flipAnimations` | true | ✓ | FLIP transition animations |
| `debugOverlay` | false | ✓ | Show debug overlay |
| `perfLogging` | false | ✓ | Log performance metrics |
| `strictValidation` | false | ✓ | Strict card validation |
| `plugins` | true | ✗ | Plugin system enabled |
| `shadowDom` | false | ✗ | Shadow DOM isolation |

#### Observing Flag Changes

```typescript
// Observe specific flag
featureFlags.observe(OSI_FEATURE_FLAGS.DEBUG_OVERLAY).subscribe(enabled => {
  if (enabled) showDebugOverlay();
});

// Get all current flags
const allFlags = featureFlags.getAll();

// Get flag metadata
const meta = featureFlags.getMeta(OSI_FEATURE_FLAGS.STREAMING_V2);
console.log(meta.experimental); // true
console.log(meta.mutable);      // false

// Get all experimental flags
const experimental = featureFlags.getExperimentalFlags();
```

#### URL Overrides

For testing, flags can be overridden via URL parameters:

```
?osi_flag_virtualScroll=true
?osi_flag_debugOverlay=true
?osi_debug=true  // Enables debugOverlay + perfLogging
```

#### Provider Configuration

```typescript
import { provideFeatureFlags } from 'osi-cards-lib';

export const appConfig = {
  providers: [
    provideFeatureFlags({
      virtualScroll: true,
      skylinePacking: true
    })
  ]
};
```

---

## Utility Services

### IconService

Maps field names to Lucide icons.

```typescript
import { IconService } from 'osi-cards-lib';

const iconService = inject(IconService);

// Get icon name for a field
const icon = iconService.getFieldIcon('email');     // 'mail'
const icon2 = iconService.getFieldIcon('revenue');  // 'dollar-sign'

// Get CSS class for styling
const iconClass = iconService.getFieldIconClass('email');   // 'text-blue-500'
const iconClass2 = iconService.getFieldIconClass('profit'); // 'text-green-600'
```

#### Icon Mappings

| Field Type | Icon | CSS Class |
|------------|------|-----------|
| email | mail | text-blue-500 |
| phone | phone | text-green-500 |
| address | map-pin | text-red-500 |
| revenue | dollar-sign | text-green-500 |
| profit | trending-up | text-green-600 |
| expenses | trending-down | text-red-500 |
| status | info | text-blue-500 |
| completed | check-circle | text-green-500 |
| failed | x-circle | text-red-500 |
| warning | alert-triangle | text-amber-500 |

---

### ThemeService

Programmatic theme control.

```typescript
import { ThemeService } from 'osi-cards-lib';

const themeService = inject(ThemeService);

// Set theme
themeService.setTheme('dark');
themeService.setTheme('light');

// Toggle theme
themeService.toggleTheme();

// Get current theme
const current = themeService.currentTheme; // 'light' | 'dark'

// Observe theme changes
themeService.theme$.subscribe(theme => {
  document.body.classList.toggle('dark', theme === 'dark');
});

// Apply theme preset
themeService.applyPreset('corporate');
themeService.applyPreset('minimal');

// Set CSS variables
themeService.setVariable('--card-bg', '#1a1a1a');
themeService.setVariables({
  '--card-bg': '#1a1a1a',
  '--card-text': '#ffffff'
});
```

See [Theming Guide](./THEMING_GUIDE.md) for detailed documentation.

---

## Related Documentation

- [API Reference](./API.md) - Full API documentation
- [Plugin System](./PLUGIN_SYSTEM.md) - Custom section plugins
- [Event System](./EVENT_SYSTEM.md) - Events and middleware
- [Section Registry](./SECTION_REGISTRY.md) - Section types and aliases
- [Theming Guide](./THEMING_GUIDE.md) - Theme customization
- [Best Practices](./BEST_PRACTICES.md) - Performance and accessibility



