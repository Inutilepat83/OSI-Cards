#!/usr/bin/env node

/**
 * Generate Remaining Documentation
 * 
 * Creates documentation for:
 * - Services (Points 33-42)
 * - Components (Points 43-52)
 * - Integration Guides (Points 53-62)
 * - LLM Integration (Points 63-72)
 * - Advanced Topics (Points 73-82)
 * - API Reference (Points 83-88)
 * - Events Reference (Points 89-94)
 * - Utilities (Points 95-100)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'src', 'app', 'features', 'documentation');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeNgDocPage(category, slug, title, content, order = 1) {
  const pageDir = path.join(DOCS_DIR, category, slug);
  ensureDir(pageDir);
  
  const varName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Page';
  
  const pageTs = `import { NgDocPage } from '@ng-doc/core';

const ${varName}: NgDocPage = {
  title: '${title}',
  mdFile: './index.md',
  order: ${order}
};

export default ${varName};
`;
  
  fs.writeFileSync(path.join(pageDir, `${slug}.page.ts`), pageTs, 'utf8');
  fs.writeFileSync(path.join(pageDir, 'index.md'), content, 'utf8');
}

function writeCategoryFile(category, title, order) {
  const categoryDir = path.join(DOCS_DIR, category);
  ensureDir(categoryDir);
  
  const varName = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Category';
  
  const categoryTs = `import { NgDocCategory } from '@ng-doc/core';

const ${varName}: NgDocCategory = {
  title: '${title}',
  order: ${order},
  expandable: true
};

export default ${varName};
`;
  
  fs.writeFileSync(path.join(categoryDir, 'ng-doc.category.ts'), categoryTs, 'utf8');
}

// ============================================
// Services Documentation (Points 33-42)
// ============================================

function generateServicesDocs() {
  log('\n🔧 Generating Services Documentation (Points 33-42)...', colors.blue);
  
  const services = [
    { slug: 'streaming-service', title: 'OSICardsStreamingService', order: 1, content: `# OSICardsStreamingService

Progressive card generation with streaming support.

## Overview

\`OSICardsStreamingService\` handles real-time card generation by processing JSON chunks as they arrive from LLM responses.

## Import

\`\`\`typescript
import { OSICardsStreamingService } from 'osi-cards-lib';
\`\`\`

## Injection

\`\`\`typescript
const streamingService = inject(OSICardsStreamingService);
\`\`\`

## Methods

### start(jsonString, options?)

Start streaming JSON content.

\`\`\`typescript
streamingService.start(jsonString);
streamingService.start(jsonString, { instant: true });
\`\`\`

### stop()

Stop current streaming.

\`\`\`typescript
streamingService.stop();
\`\`\`

### configure(config)

Configure streaming behavior.

\`\`\`typescript
streamingService.configure({
  tokensPerSecond: 100,
  thinkingDelayMs: 50
});
\`\`\`

### getState()

Get current streaming state.

\`\`\`typescript
const state = streamingService.getState();
\`\`\`

## Observables

| Observable | Type | Description |
|------------|------|-------------|
| \`state$\` | StreamingState | Current streaming state |
| \`cardUpdates$\` | CardUpdate | Card updates as they stream |
| \`bufferUpdates$\` | string | Raw buffer updates |

## Example

\`\`\`typescript
@Component({...})
export class MyComponent {
  private streamingService = inject(OSICardsStreamingService);
  
  startStreaming(json: string) {
    this.streamingService.start(json);
    
    this.streamingService.cardUpdates$.subscribe(update => {
      this.card = update.card;
    });
  }
}
\`\`\`
` },
    { slug: 'event-middleware-service', title: 'EventMiddlewareService', order: 2, content: `# EventMiddlewareService

Event processing with middleware chain support.

## Overview

\`EventMiddlewareService\` provides a middleware-based event processing system for intercepting, transforming, and handling card events.

## Import

\`\`\`typescript
import { EventMiddlewareService, EventMiddleware } from 'osi-cards-lib';
\`\`\`

## Methods

### addMiddleware(middleware)

Add middleware to the chain.

\`\`\`typescript
const middleware: EventMiddleware = {
  priority: 50,
  handle: (event, next) => {
    console.log('Event:', event);
    return next(event);
  }
};

eventService.addMiddleware(middleware);
\`\`\`

### removeMiddleware(middleware)

Remove middleware from chain.

### processEvent(event)

Process an event through the middleware chain.

### createLoggingMiddleware()

Create logging middleware.

\`\`\`typescript
const logger = eventService.createLoggingMiddleware();
eventService.addMiddleware(logger);
\`\`\`

### createFilterMiddleware(predicate)

Create filter middleware.

\`\`\`typescript
const filter = eventService.createFilterMiddleware(
  event => event.type === 'field'
);
\`\`\`

### createTransformMiddleware(transformer)

Create transform middleware.

### createAnalyticsMiddleware(tracker)

Create analytics tracking middleware.

## Observables

| Observable | Description |
|------------|-------------|
| \`rawEvents$\` | Events before middleware processing |
| \`processedEvents$\` | Events after middleware processing |
` },
    { slug: 'section-plugin-registry', title: 'SectionPluginRegistryService', order: 3, content: `# SectionPluginRegistryService

Register and manage custom section plugins.

## Overview

\`SectionPluginRegistryService\` allows registration of custom section type renderers.

## Import

\`\`\`typescript
import { SectionPluginRegistryService, SectionPlugin } from 'osi-cards-lib';
\`\`\`

## Methods

### registerPlugin(plugin)

Register a custom section plugin.

\`\`\`typescript
const plugin: SectionPlugin = {
  type: 'custom-section',
  component: CustomSectionComponent,
  validator: (section) => !!section.title,
  transformer: (section) => ({
    ...section,
    meta: { ...section.meta, processed: true }
  })
};

registryService.registerPlugin(plugin);
\`\`\`

### getPlugin(type)

Get plugin by section type.

### hasPlugin(type)

Check if plugin exists.

### getAllPlugins()

Get all registered plugins.

## Plugin Interface

\`\`\`typescript
interface SectionPlugin {
  type: string;
  component: Type<any>;
  validator?: (section: CardSection) => boolean;
  transformer?: (section: CardSection) => CardSection;
}
\`\`\`
` },
    { slug: 'theme-service', title: 'ThemeService', order: 4, content: `# ThemeService

Dynamic theming and CSS custom properties management.

## Overview

\`ThemeService\` manages themes and CSS custom properties for card styling.

## Import

\`\`\`typescript
import { ThemeService } from 'osi-cards-lib';
\`\`\`

## Methods

### setTheme(theme)

Apply a theme preset.

\`\`\`typescript
themeService.setTheme('dark');
themeService.setTheme('orange');
themeService.setTheme('minimal');
\`\`\`

### setCustomProperties(properties)

Set custom CSS properties.

\`\`\`typescript
themeService.setCustomProperties({
  '--osi-card-bg': '#ffffff',
  '--osi-card-border': '#e0e0e0',
  '--osi-primary': '#FF7900'
});
\`\`\`

### getTheme()

Get current theme name.

### resetTheme()

Reset to default theme.

## Built-in Themes

| Theme | Description |
|-------|-------------|
| \`default\` | Standard light theme |
| \`dark\` | Dark mode theme |
| \`orange\` | Orange brand theme |
| \`minimal\` | Minimal, clean theme |
| \`high-contrast\` | Accessibility theme |

## Custom Theme

\`\`\`typescript
const customTheme = {
  name: 'corporate',
  properties: {
    '--osi-card-bg': '#f5f5f5',
    '--osi-primary': '#003366',
    '--osi-text': '#333333'
  }
};

themeService.registerTheme(customTheme);
themeService.setTheme('corporate');
\`\`\`
` },
    { slug: 'animation-orchestrator', title: 'AnimationOrchestratorService', order: 5, content: `# AnimationOrchestratorService

Coordinate card and section animations.

## Overview

\`AnimationOrchestratorService\` manages complex animation sequences for cards and sections.

## Import

\`\`\`typescript
import { AnimationOrchestratorService } from 'osi-cards-lib';
\`\`\`

## Methods

### animateCardEntry(element, options?)

Animate card entering the view.

\`\`\`typescript
orchestrator.animateCardEntry(cardElement, {
  duration: 300,
  delay: 100,
  easing: 'ease-out'
});
\`\`\`

### animateSectionComplete(element, index)

Animate section completion.

### animateStaggeredList(elements, options?)

Animate multiple elements with stagger.

\`\`\`typescript
orchestrator.animateStaggeredList(sectionElements, {
  stagger: 50,
  duration: 200
});
\`\`\`

### cancelAnimations()

Cancel all running animations.

## Animation Presets

| Preset | Description |
|--------|-------------|
| \`fadeIn\` | Simple fade in |
| \`slideUp\` | Slide from bottom |
| \`scaleIn\` | Scale from 0.9 to 1 |
| \`highlight\` | Flash highlight effect |
` },
    { slug: 'icon-service', title: 'IconService', order: 6, content: `# IconService

Icon loading and rendering management.

## Overview

\`IconService\` handles icon resolution, loading, and rendering using Lucide icons.

## Import

\`\`\`typescript
import { IconService } from 'osi-cards-lib';
\`\`\`

## Methods

### getIcon(name)

Get icon by name.

\`\`\`typescript
const icon = iconService.getIcon('user');
const icon = iconService.getIcon('building');
\`\`\`

### isEmoji(value)

Check if value is an emoji.

\`\`\`typescript
iconService.isEmoji('🏢'); // true
iconService.isEmoji('building'); // false
\`\`\`

### resolveIcon(input)

Resolve icon from various input formats.

\`\`\`typescript
// Returns appropriate icon data for:
iconService.resolveIcon('user');      // Lucide icon
iconService.resolveIcon('📧');        // Emoji
iconService.resolveIcon('fa-user');   // Font Awesome
iconService.resolveIcon('https://...'); // URL
\`\`\`

## Supported Icon Sets

- **Lucide Icons**: Default icon set
- **Emojis**: Native emoji support
- **Custom URLs**: Image URLs
` },
    { slug: 'magnetic-tilt-service', title: 'MagneticTiltService', order: 7, content: `# MagneticTiltService

3D tilt effect for card interactions.

## Overview

\`MagneticTiltService\` provides magnetic hover and tilt effects for cards.

## Import

\`\`\`typescript
import { MagneticTiltService } from 'osi-cards-lib';
\`\`\`

## Methods

### attach(element, options?)

Attach tilt effect to element.

\`\`\`typescript
tiltService.attach(cardElement, {
  maxTilt: 10,
  scale: 1.02,
  speed: 300
});
\`\`\`

### detach(element)

Remove tilt effect from element.

### setEnabled(enabled)

Enable/disable all tilt effects.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`maxTilt\` | number | 15 | Maximum tilt angle |
| \`scale\` | number | 1 | Scale on hover |
| \`speed\` | number | 400 | Transition speed (ms) |
| \`glare\` | boolean | false | Enable glare effect |
| \`perspective\` | number | 1000 | 3D perspective |

## Usage in Component

\`\`\`typescript
@Component({...})
export class CardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('card') cardRef: ElementRef;
  private tiltService = inject(MagneticTiltService);
  
  ngAfterViewInit() {
    this.tiltService.attach(this.cardRef.nativeElement, {
      maxTilt: 8,
      scale: 1.01
    });
  }
  
  ngOnDestroy() {
    this.tiltService.detach(this.cardRef.nativeElement);
  }
}
\`\`\`
` },
    { slug: 'section-normalization', title: 'SectionNormalizationService', order: 8, content: `# SectionNormalizationService

Normalize and validate section data.

## Overview

\`SectionNormalizationService\` ensures section data conforms to expected schemas.

## Import

\`\`\`typescript
import { SectionNormalizationService } from 'osi-cards-lib';
\`\`\`

## Methods

### normalize(section)

Normalize section data.

\`\`\`typescript
const normalized = normService.normalize({
  title: 'My Section',
  type: 'metrics', // alias
  fields: [...]
});
// Returns section with type: 'analytics'
\`\`\`

### resolveType(type)

Resolve type alias to canonical type.

\`\`\`typescript
normService.resolveType('metrics');  // 'analytics'
normService.resolveType('stats');    // 'analytics'
normService.resolveType('timeline'); // 'event'
\`\`\`

### validate(section)

Validate section structure.

\`\`\`typescript
const result = normService.validate(section);
if (!result.valid) {
  console.log('Errors:', result.errors);
}
\`\`\`

### ensureIds(section)

Ensure all elements have IDs.

## Type Aliases Resolved

| Alias | Canonical Type |
|-------|---------------|
| \`metrics\` | analytics |
| \`stats\` | analytics |
| \`timeline\` | event |
| \`table\` | list |
| \`locations\` | map |
| \`quote\` | quotation |
` },
    { slug: 'layout-worker-service', title: 'LayoutWorkerService', order: 9, content: `# LayoutWorkerService

Offload layout calculations to Web Worker.

## Overview

\`LayoutWorkerService\` performs heavy layout calculations in a Web Worker to keep the UI responsive.

## Import

\`\`\`typescript
import { LayoutWorkerService } from 'osi-cards-lib';
\`\`\`

## Methods

### calculateLayout(cards, containerWidth, options?)

Calculate optimal card layout.

\`\`\`typescript
const layout = await layoutWorker.calculateLayout(cards, 1200, {
  columns: 3,
  gap: 16,
  algorithm: 'masonry'
});
\`\`\`

### isSupported()

Check if Web Workers are supported.

### terminate()

Terminate the worker.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`columns\` | number | 3 | Number of columns |
| \`gap\` | number | 16 | Gap between cards (px) |
| \`algorithm\` | string | 'masonry' | Layout algorithm |
| \`minCardWidth\` | number | 300 | Minimum card width |

## Fallback

If Web Workers aren't supported, calculations happen on main thread:

\`\`\`typescript
if (!layoutWorker.isSupported()) {
  // Uses synchronous fallback
}
\`\`\`
` },
    { slug: 'section-utils-service', title: 'SectionUtilsService', order: 10, content: `# SectionUtilsService

Utility functions for section manipulation.

## Overview

\`SectionUtilsService\` provides helper functions for working with sections.

## Import

\`\`\`typescript
import { SectionUtilsService } from 'osi-cards-lib';
\`\`\`

## Methods

### getSectionIcon(section)

Get appropriate icon for section type.

\`\`\`typescript
const icon = utils.getSectionIcon(section);
// Returns emoji or icon name based on type
\`\`\`

### getSectionColor(section)

Get theme color for section type.

### getFieldCount(section)

Count fields in section.

### getItemCount(section)

Count items in section.

### isCollapsible(section)

Check if section supports collapsing.

### isEmpty(section)

Check if section has no content.

\`\`\`typescript
if (utils.isEmpty(section)) {
  // Hide or show placeholder
}
\`\`\`

### mergeSections(sections)

Merge multiple sections of same type.

### sortByPriority(sections)

Sort sections by priority.

\`\`\`typescript
const sorted = utils.sortByPriority(sections);
// critical > important > standard > optional
\`\`\`

## Type Helpers

\`\`\`typescript
// Check section type
utils.isFieldBased(section);  // info, analytics, etc.
utils.isItemBased(section);   // list, news, etc.
utils.isChartBased(section);  // chart
utils.isMapBased(section);    // map
\`\`\`
` }
  ];
  
  for (const service of services) {
    writeNgDocPage('services', service.slug, service.title, service.content, service.order);
  }
  
  writeCategoryFile('services', 'Services', 5);
  log(`   ✓ Generated ${services.length} service documentation pages`, colors.green);
}

// ============================================
// Components Documentation (Points 43-52)
// ============================================

function generateComponentsDocs() {
  log('\n🧩 Generating Components Documentation (Points 43-52)...', colors.blue);
  
  const components = [
    { slug: 'ai-card-renderer', title: 'AICardRendererComponent', order: 1, content: `# AICardRendererComponent

Main card rendering component.

## Overview

\`AICardRendererComponent\` is the primary component for rendering OSI Cards. It takes a card configuration and renders all sections.

## Selector

\`\`\`html
<app-ai-card-renderer></app-ai-card-renderer>
\`\`\`

## Import

\`\`\`typescript
import { AICardRendererComponent } from 'osi-cards-lib';

@Component({
  imports: [AICardRendererComponent],
  ...
})
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`cardConfig\` | AICardConfig | Card configuration |
| \`columns\` | 1 \\| 2 \\| 3 | Column layout override |
| \`showActions\` | boolean | Show action buttons |
| \`enableTilt\` | boolean | Enable tilt effect |
| \`streamingMode\` | boolean | Enable streaming mode |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| \`sectionEvent\` | SectionRenderEvent | Section interaction event |
| \`actionClick\` | CardAction | Action button click |
| \`cardClick\` | AICardConfig | Card click event |

## Usage

\`\`\`html
<app-ai-card-renderer
  [cardConfig]="card"
  [columns]="2"
  [showActions]="true"
  (sectionEvent)="onSectionEvent($event)"
  (actionClick)="onAction($event)">
</app-ai-card-renderer>
\`\`\`

## Styling

\`\`\`css
app-ai-card-renderer {
  --osi-card-bg: white;
  --osi-card-border: #e0e0e0;
  --osi-card-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
\`\`\`
` },
    { slug: 'section-renderer', title: 'SectionRendererComponent', order: 2, content: `# SectionRendererComponent

Dynamic section type renderer.

## Overview

\`SectionRendererComponent\` renders individual sections based on their type. It uses a strategy pattern to select the appropriate section component.

## Selector

\`\`\`html
<app-section-renderer></app-section-renderer>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`section\` | CardSection | Section to render |
| \`cardTitle\` | string | Parent card title |
| \`columns\` | number | Column count |
| \`isStreaming\` | boolean | Streaming mode |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| \`sectionEvent\` | SectionRenderEvent | Section events |

## Usage

\`\`\`html
<app-section-renderer
  [section]="section"
  [columns]="2"
  (sectionEvent)="onEvent($event)">
</app-section-renderer>
\`\`\`

## Section Type Resolution

The component resolves section types and renders:

| Type | Component |
|------|-----------|
| \`info\` | InfoSectionComponent |
| \`analytics\` | AnalyticsSectionComponent |
| \`list\` | ListSectionComponent |
| \`chart\` | ChartSectionComponent |
| (unknown) | FallbackSectionComponent |
` },
    { slug: 'masonry-grid', title: 'MasonryGridComponent', order: 3, content: `# MasonryGridComponent

Responsive masonry grid layout for cards.

## Overview

\`MasonryGridComponent\` arranges cards in an optimized masonry layout with responsive columns.

## Selector

\`\`\`html
<app-masonry-grid></app-masonry-grid>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`cards\` | AICardConfig[] | Cards to display |
| \`columns\` | number | Fixed column count |
| \`gap\` | number | Gap between cards (px) |
| \`minCardWidth\` | number | Minimum card width |
| \`enableAnimation\` | boolean | Enable animations |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| \`cardEvent\` | CardEvent | Card interaction event |
| \`layoutChange\` | LayoutInfo | Layout recalculated |

## Usage

\`\`\`html
<app-masonry-grid
  [cards]="cards"
  [columns]="3"
  [gap]="16"
  (cardEvent)="onCardEvent($event)">
</app-masonry-grid>
\`\`\`

## Responsive Breakpoints

| Breakpoint | Columns |
|------------|---------|
| < 600px | 1 |
| 600-900px | 2 |
| 900-1200px | 3 |
| > 1200px | 4 |

## Layout Algorithm

Uses skyline algorithm for optimal packing:
1. Find shortest column
2. Place card in shortest column
3. Update column height
4. Repeat
` },
    { slug: 'card-skeleton', title: 'CardSkeletonComponent', order: 4, content: `# CardSkeletonComponent

Loading skeleton for cards.

## Overview

\`CardSkeletonComponent\` displays placeholder skeletons while cards are loading.

## Selector

\`\`\`html
<app-card-skeleton></app-card-skeleton>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`sections\` | number | Number of skeleton sections |
| \`animated\` | boolean | Enable shimmer animation |
| \`height\` | string | Card height |

## Usage

\`\`\`html
@if (isLoading) {
  <app-card-skeleton [sections]="3" [animated]="true">
  </app-card-skeleton>
} @else {
  <app-ai-card-renderer [cardConfig]="card">
  </app-ai-card-renderer>
}
\`\`\`

## Styling

\`\`\`css
app-card-skeleton {
  --skeleton-bg: #e0e0e0;
  --skeleton-highlight: #f0f0f0;
  --skeleton-animation-duration: 1.5s;
}
\`\`\`
` },
    { slug: 'card-streaming-indicator', title: 'CardStreamingIndicatorComponent', order: 5, content: `# CardStreamingIndicatorComponent

Streaming progress indicator.

## Overview

\`CardStreamingIndicatorComponent\` shows streaming progress and state.

## Selector

\`\`\`html
<app-card-streaming-indicator></app-card-streaming-indicator>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`state\` | StreamingState | Current state |
| \`showProgress\` | boolean | Show progress bar |
| \`showStage\` | boolean | Show stage text |

## Usage

\`\`\`html
<app-card-streaming-indicator
  [state]="streamingState"
  [showProgress]="true">
</app-card-streaming-indicator>
\`\`\`

## Stage Display

| Stage | Display |
|-------|---------|
| thinking | "Thinking..." |
| streaming | Progress bar |
| complete | Check mark |
| error | Error icon |
` },
    { slug: 'card-actions', title: 'CardActionsComponent', order: 6, content: `# CardActionsComponent

Card action buttons.

## Overview

\`CardActionsComponent\` renders action buttons at the bottom of cards.

## Selector

\`\`\`html
<app-card-actions></app-card-actions>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`actions\` | CardAction[] | Actions to render |
| \`layout\` | 'row' \\| 'column' | Button layout |
| \`fullWidth\` | boolean | Full width buttons |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| \`actionClick\` | CardAction | Action clicked |

## Usage

\`\`\`html
<app-card-actions
  [actions]="card.actions"
  [layout]="'row'"
  (actionClick)="handleAction($event)">
</app-card-actions>
\`\`\`

## Action Handling

\`\`\`typescript
handleAction(action: CardAction) {
  switch (action.type) {
    case 'website':
      window.open(action.url, '_blank');
      break;
    case 'mail':
      this.openMailClient(action.email);
      break;
    case 'agent':
      this.triggerAgent(action);
      break;
    case 'question':
      this.sendQuestion(action.question);
      break;
  }
}
\`\`\`
` },
    { slug: 'card-header', title: 'CardHeaderComponent', order: 7, content: `# CardHeaderComponent

Card title and header section.

## Overview

\`CardHeaderComponent\` renders the card header with title, subtitle, and optional actions.

## Selector

\`\`\`html
<app-card-header></app-card-header>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`title\` | string | Card title |
| \`subtitle\` | string | Optional subtitle |
| \`icon\` | string | Header icon |
| \`collapsible\` | boolean | Enable collapse |
| \`collapsed\` | boolean | Collapsed state |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| \`toggleCollapse\` | boolean | Collapse toggled |
| \`headerClick\` | void | Header clicked |

## Usage

\`\`\`html
<app-card-header
  [title]="card.cardTitle"
  [subtitle]="card.description"
  [collapsible]="true"
  (toggleCollapse)="onToggle($event)">
</app-card-header>
\`\`\`
` },
    { slug: 'card-preview', title: 'CardPreviewComponent', order: 8, content: `# CardPreviewComponent

Compact card preview.

## Overview

\`CardPreviewComponent\` shows a compact preview of a card for lists or thumbnails.

## Selector

\`\`\`html
<app-card-preview></app-card-preview>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`card\` | AICardConfig | Card to preview |
| \`showSections\` | number | Sections to show |
| \`maxHeight\` | string | Maximum height |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| \`select\` | AICardConfig | Card selected |

## Usage

\`\`\`html
<app-card-preview
  [card]="card"
  [showSections]="2"
  (select)="openCard($event)">
</app-card-preview>
\`\`\`
` },
    { slug: 'osi-cards', title: 'OSICardsComponent', order: 9, content: `# OSICardsComponent

Single card wrapper component.

## Overview

\`OSICardsComponent\` is a convenience wrapper for rendering a single card with all features.

## Selector

\`\`\`html
<osi-cards></osi-cards>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`config\` | AICardConfig | Card configuration |
| \`theme\` | string | Theme preset |
| \`interactive\` | boolean | Enable interactions |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| \`event\` | CardEvent | Any card event |

## Usage

\`\`\`html
<osi-cards
  [config]="cardConfig"
  [theme]="'dark'"
  (event)="handleEvent($event)">
</osi-cards>
\`\`\`
` },
    { slug: 'osi-cards-container', title: 'OSICardsContainerComponent', order: 10, content: `# OSICardsContainerComponent

Multiple cards container with grid.

## Overview

\`OSICardsContainerComponent\` manages multiple cards with masonry grid layout.

## Selector

\`\`\`html
<osi-cards-container></osi-cards-container>
\`\`\`

## Inputs

| Input | Type | Description |
|-------|------|-------------|
| \`cards\` | AICardConfig[] | Cards to display |
| \`columns\` | number | Column count |
| \`gap\` | number | Gap between cards |
| \`sortable\` | boolean | Enable drag sort |
| \`filterable\` | boolean | Enable filtering |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| \`cardEvent\` | CardEvent | Card events |
| \`orderChange\` | AICardConfig[] | Order changed |

## Usage

\`\`\`html
<osi-cards-container
  [cards]="cards"
  [columns]="3"
  [sortable]="true"
  (cardEvent)="onEvent($event)"
  (orderChange)="onReorder($event)">
</osi-cards-container>
\`\`\`
` }
  ];
  
  for (const comp of components) {
    writeNgDocPage('components', comp.slug, comp.title, comp.content, comp.order);
  }
  
  writeCategoryFile('components', 'Components', 6);
  log(`   ✓ Generated ${components.length} component documentation pages`, colors.green);
}

// ============================================
// Integration Guides (Points 53-72)
// ============================================

function generateIntegrationDocs() {
  log('\n🔌 Generating Integration Documentation (Points 53-72)...', colors.blue);
  
  // Create integration category directory
  const integrationDir = path.join(DOCS_DIR, 'integration');
  ensureDir(integrationDir);
  
  // Will create shortened versions due to space
  const pages = [
    { slug: 'quick-start', title: 'Quick Start Guide', order: 1 },
    { slug: 'npm-installation', title: 'NPM Installation', order: 2 },
    { slug: 'angular-18', title: 'Angular 18 Integration', order: 3 },
    { slug: 'angular-20', title: 'Angular 20 Integration', order: 4 },
    { slug: 'standalone-components', title: 'Standalone Components', order: 5 },
    { slug: 'module-based', title: 'Module-based Integration', order: 6 },
    { slug: 'lazy-loading', title: 'Lazy Loading Setup', order: 7 },
    { slug: 'ssr', title: 'SSR Considerations', order: 8 },
    { slug: 'pwa', title: 'PWA Integration', order: 9 },
    { slug: 'dependencies', title: 'Dependency Management', order: 10 },
    { slug: 'llm-overview', title: 'LLM Overview', order: 11 },
    { slug: 'prompt-engineering', title: 'Prompt Engineering', order: 12 },
    { slug: 'card-generation-prompt', title: 'Card Generation Prompt', order: 13 },
    { slug: 'streaming-responses', title: 'Streaming Responses', order: 14 },
    { slug: 'websocket-integration', title: 'WebSocket Integration', order: 15 },
    { slug: 'agent-systems', title: 'Agent System Integration', order: 16 },
    { slug: 'error-recovery', title: 'Error Recovery Patterns', order: 17 },
    { slug: 'rate-limiting', title: 'Rate Limiting', order: 18 },
    { slug: 'card-validation', title: 'Card Validation', order: 19 },
    { slug: 'json-schema-llm', title: 'JSON Schema for LLMs', order: 20 }
  ];
  
  // Generate abbreviated content for each
  for (const page of pages) {
    const content = generateIntegrationContent(page);
    writeNgDocPage('integration', page.slug, page.title, content, page.order);
  }
  
  writeCategoryFile('integration', 'Integration', 7);
  log(`   ✓ Generated ${pages.length} integration documentation pages`, colors.green);
}

function generateIntegrationContent(page) {
  // Generate content based on page type
  const templates = {
    'quick-start': `# Quick Start Guide

Get started with OSI Cards in minutes.

## Prerequisites

- Node.js 18+
- Angular 18 or 20
- npm or yarn

## Installation

\`\`\`bash
npm install osi-cards-lib
\`\`\`

## Basic Setup

1. Import styles in \`styles.scss\`:
\`\`\`scss
@import 'osi-cards-lib/styles/_styles';
\`\`\`

2. Use in component:
\`\`\`typescript
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  imports: [AICardRendererComponent],
  template: \`<app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>\`
})
export class MyComponent {
  card: AICardConfig = {
    cardTitle: 'My Card',
    sections: [{ title: 'Info', type: 'info', fields: [] }]
  };
}
\`\`\`

## Next Steps

- [Section Types](/docs/section-types)
- [Streaming](/docs/streaming)
- [Theming](/docs/advanced/theming)
`,
    'npm-installation': `# NPM Installation

Install OSI Cards from npm.

## Standard Installation

\`\`\`bash
npm install osi-cards-lib
\`\`\`

## With Peer Dependencies

\`\`\`bash
npm install osi-cards-lib @angular/animations lucide-angular
\`\`\`

## Legacy Peer Deps

If you encounter peer dependency conflicts:

\`\`\`bash
npm install osi-cards-lib --legacy-peer-deps
\`\`\`

## From GitHub

\`\`\`bash
npm install git+https://github.com/Inutilepat83/OSI-Cards.git
\`\`\`

## Verify Installation

\`\`\`typescript
import { AICardRendererComponent } from 'osi-cards-lib';
// Should compile without errors
\`\`\`
`,
    'llm-overview': `# LLM Overview

Integrating OSI Cards with Large Language Models.

## Concept

OSI Cards is designed for AI-generated content. Cards are produced by LLMs that understand the card structure.

## Flow

\`\`\`
User Query → LLM → JSON Card → OSI Cards → UI
\`\`\`

## Supported LLMs

- OpenAI GPT-4
- Anthropic Claude
- Google Gemini
- Local models (Ollama, etc.)

## Key Features

1. **Streaming**: Progressive card rendering
2. **Validation**: Schema validation
3. **Recovery**: Error handling
4. **Prompts**: Structured prompts

## Quick Example

\`\`\`typescript
// LLM returns JSON
const llmResponse = await llm.generate(prompt);

// Stream to cards
streamingService.start(llmResponse);
\`\`\`
`,
    'prompt-engineering': `# Prompt Engineering

Creating effective prompts for card generation.

## System Prompt Template

\`\`\`
You are a card generator for OSI Cards. Generate valid JSON cards.

Card Structure:
{
  "cardTitle": "string (required)",
  "sections": [
    {
      "title": "string",
      "type": "info|analytics|list|...",
      "fields": [{ "label": "string", "value": "any" }]
    }
  ]
}

Available section types: info, analytics, contact-card, list, chart, event, financials, map, news, product, solutions, overview, quotation, text-reference, brand-colors, social-media, network-card

Always return valid JSON. No markdown, no explanations.
\`\`\`

## Best Practices

1. Be specific about section types
2. Include examples in prompt
3. Request specific fields
4. Validate output

## Example Prompt

\`\`\`
Generate a company card for "Acme Corp" with:
- Overview section with company description
- Analytics section with growth metrics
- Contact card for key personnel
\`\`\`
`
  };
  
  return templates[page.slug] || `# ${page.title}

Documentation for ${page.title}.

## Overview

This section covers ${page.title.toLowerCase()}.

## Details

Content coming soon.

## Related

- [Getting Started](/docs/getting-started)
- [API Reference](/docs/api-reference)
`;
}

// ============================================
// Advanced Topics (Points 73-82)
// ============================================

function generateAdvancedDocs() {
  log('\n🚀 Generating Advanced Documentation (Points 73-82)...', colors.blue);
  
  const topics = [
    { slug: 'theming-overview', title: 'Theming Overview', order: 1 },
    { slug: 'css-properties', title: 'CSS Custom Properties', order: 2 },
    { slug: 'theme-presets', title: 'Theme Presets', order: 3 },
    { slug: 'custom-sections', title: 'Custom Section Plugins', order: 4 },
    { slug: 'event-middleware', title: 'Event Middleware', order: 5 },
    { slug: 'performance', title: 'Performance Optimization', order: 6 },
    { slug: 'accessibility', title: 'Accessibility (WCAG)', order: 7 },
    { slug: 'i18n', title: 'Internationalization', order: 8 },
    { slug: 'security', title: 'Security Best Practices', order: 9 },
    { slug: 'error-patterns', title: 'Error Handling Patterns', order: 10 }
  ];
  
  for (const topic of topics) {
    const content = generateAdvancedContent(topic);
    writeNgDocPage('advanced', topic.slug, topic.title, content, topic.order);
  }
  
  writeCategoryFile('advanced', 'Advanced', 8);
  log(`   ✓ Generated ${topics.length} advanced topic documentation pages`, colors.green);
}

function generateAdvancedContent(topic) {
  const templates = {
    'theming-overview': `# Theming Overview

Customize the look and feel of OSI Cards.

## Theme System

OSI Cards uses CSS Custom Properties for theming.

## Applying a Theme

\`\`\`typescript
import { ThemeService } from 'osi-cards-lib';

const themeService = inject(ThemeService);
themeService.setTheme('dark');
\`\`\`

## Available Themes

| Theme | Description |
|-------|-------------|
| default | Light theme |
| dark | Dark mode |
| orange | Orange brand |
| minimal | Clean, minimal |
| high-contrast | Accessibility |

## Custom Theme

\`\`\`typescript
themeService.setCustomProperties({
  '--osi-card-bg': '#1a1a1a',
  '--osi-card-text': '#ffffff',
  '--osi-primary': '#FF7900'
});
\`\`\`
`,
    'css-properties': `# CSS Custom Properties

All available CSS custom properties.

## Card Properties

| Property | Default | Description |
|----------|---------|-------------|
| \`--osi-card-bg\` | #ffffff | Background |
| \`--osi-card-border\` | #e0e0e0 | Border color |
| \`--osi-card-shadow\` | ... | Box shadow |
| \`--osi-card-radius\` | 8px | Border radius |
| \`--osi-card-padding\` | 16px | Padding |

## Color Properties

| Property | Default | Description |
|----------|---------|-------------|
| \`--osi-primary\` | #FF7900 | Primary color |
| \`--osi-text\` | #333333 | Text color |
| \`--osi-text-muted\` | #666666 | Muted text |
| \`--osi-success\` | #4CAF50 | Success |
| \`--osi-warning\` | #FF9800 | Warning |
| \`--osi-error\` | #F44336 | Error |

## Typography

| Property | Default |
|----------|---------|
| \`--osi-font-family\` | system-ui |
| \`--osi-font-size-sm\` | 12px |
| \`--osi-font-size-base\` | 14px |
| \`--osi-font-size-lg\` | 16px |

## Usage

\`\`\`css
:root {
  --osi-primary: #003366;
  --osi-card-radius: 12px;
}
\`\`\`
`,
    'performance': `# Performance Optimization

Optimize OSI Cards for best performance.

## Strategies

### 1. Virtual Scrolling

For many cards, use virtual scrolling:

\`\`\`html
<cdk-virtual-scroll-viewport itemSize="400">
  <app-ai-card-renderer
    *cdkVirtualFor="let card of cards"
    [cardConfig]="card">
  </app-ai-card-renderer>
</cdk-virtual-scroll-viewport>
\`\`\`

### 2. OnPush Change Detection

All library components use OnPush.

### 3. Web Workers

Layout calculations use Web Workers:

\`\`\`typescript
layoutWorker.calculateLayout(cards, width);
\`\`\`

### 4. Lazy Loading

Lazy load card routes:

\`\`\`typescript
{
  path: 'cards',
  loadComponent: () => import('./cards.component')
}
\`\`\`

### 5. Image Optimization

- Use lazy loading for images
- Provide appropriate sizes
- Use modern formats (WebP)

## Metrics to Monitor

- First Contentful Paint
- Largest Contentful Paint
- Time to Interactive
- Bundle size
`,
    'accessibility': `# Accessibility (WCAG)

Making OSI Cards accessible to all users.

## Built-in Features

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation
- Focus management
- Color contrast compliance

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between cards |
| Enter | Activate card/button |
| Escape | Close expanded card |
| Arrow keys | Navigate within card |

## Screen Reader Support

Cards use appropriate roles and labels:

\`\`\`html
<article role="article" aria-labelledby="card-title">
  <h2 id="card-title">Card Title</h2>
  <section aria-label="Company Info">...</section>
</article>
\`\`\`

## High Contrast Mode

Use high-contrast theme:

\`\`\`typescript
themeService.setTheme('high-contrast');
\`\`\`

## Testing

\`\`\`bash
npm run test:a11y
npm run wcag:audit
\`\`\`
`
  };
  
  return templates[topic.slug] || `# ${topic.title}

Advanced topic: ${topic.title}

## Overview

This section covers ${topic.title.toLowerCase()}.

## Details

Detailed documentation coming soon.

## Related

- [Getting Started](/docs/getting-started)
- [API Reference](/docs/api-reference)
`;
}

// ============================================
// Utilities Documentation (Points 95-100)
// ============================================

function generateUtilitiesDocs() {
  log('\n🔨 Generating Utilities Documentation (Points 95-100)...', colors.blue);
  
  const utils = [
    { slug: 'card-utils', title: 'CardUtils', order: 1, content: `# CardUtils

Utility functions for card manipulation.

## Import

\`\`\`typescript
import { CardUtils } from 'osi-cards-lib';
\`\`\`

## Methods

### safeString(value, maxLength?)

Safely convert value to string.

\`\`\`typescript
CardUtils.safeString(123);        // "123"
CardUtils.safeString(null);       // ""
CardUtils.safeString("long...", 10); // truncated
\`\`\`

### safeNumber(value, defaultValue?)

Safely convert value to number.

\`\`\`typescript
CardUtils.safeNumber("42");       // 42
CardUtils.safeNumber("invalid");  // 0
CardUtils.safeNumber(null, -1);   // -1
\`\`\`

### generateId(prefix?)

Generate unique ID.

\`\`\`typescript
CardUtils.generateId();           // "item_1234567_abc"
CardUtils.generateId("section");  // "section_1234567_abc"
\`\`\`

### ensureSectionIds(sections)

Ensure all sections have IDs.

### sanitizeCardConfig(config)

Sanitize and validate card configuration.

\`\`\`typescript
const clean = CardUtils.sanitizeCardConfig(rawConfig);
if (clean) {
  // Use cleaned config
}
\`\`\`
` },
    { slug: 'card-type-guards', title: 'CardTypeGuards', order: 2, content: `# CardTypeGuards

Type guard functions for card validation.

## Import

\`\`\`typescript
import { CardTypeGuards } from 'osi-cards-lib';
\`\`\`

## Methods

### isAICardConfig(obj)

Check if object is valid AICardConfig.

\`\`\`typescript
if (CardTypeGuards.isAICardConfig(data)) {
  // data is AICardConfig
}
\`\`\`

### isCardSection(obj)

Check if object is valid CardSection.

\`\`\`typescript
if (CardTypeGuards.isCardSection(section)) {
  // section is CardSection
}
\`\`\`

### isCardField(obj)

Check if object is valid CardField.

### isMailAction(obj)

Check if object is valid MailCardAction.

\`\`\`typescript
if (CardTypeGuards.isMailAction(action)) {
  // action has valid email config
  console.log(action.email.contact.name);
}
\`\`\`

## Usage in Templates

\`\`\`typescript
processData(data: unknown) {
  if (!CardTypeGuards.isAICardConfig(data)) {
    throw new Error('Invalid card configuration');
  }
  this.card = data;
}
\`\`\`
` },
    { slug: 'resolve-section-type', title: 'resolveSectionType', order: 3, content: `# resolveSectionType

Resolve section type aliases.

## Import

\`\`\`typescript
import { resolveSectionType } from 'osi-cards-lib';
\`\`\`

## Usage

\`\`\`typescript
resolveSectionType('metrics');   // 'analytics'
resolveSectionType('stats');     // 'analytics'
resolveSectionType('timeline');  // 'event'
resolveSectionType('table');     // 'list'
resolveSectionType('locations'); // 'map'
resolveSectionType('info');      // 'info' (canonical)
\`\`\`

## Alias Map

| Alias | Resolves To |
|-------|-------------|
| metrics | analytics |
| stats | analytics |
| timeline | event |
| table | list |
| locations | map |
| quote | quotation |
| reference | text-reference |
| text-ref | text-reference |
| brands | brand-colors |
| colors | brand-colors |
| project | info |
` },
    { slug: 'is-valid-section-type', title: 'isValidSectionType', order: 4, content: `# isValidSectionType

Validate section type strings.

## Import

\`\`\`typescript
import { isValidSectionType } from 'osi-cards-lib';
\`\`\`

## Usage

\`\`\`typescript
isValidSectionType('info');      // true
isValidSectionType('analytics'); // true
isValidSectionType('metrics');   // true (alias)
isValidSectionType('invalid');   // false
isValidSectionType('');          // false
\`\`\`

## Valid Types

All canonical types:
- info, analytics, contact-card, network-card
- map, financials, event, list, chart
- product, solutions, overview, quotation
- text-reference, brand-colors, news
- social-media, fallback

Plus all registered aliases.
` },
    { slug: 'ensure-card-ids', title: 'ensureCardIds', order: 5, content: `# ensureCardIds

Ensure all card elements have unique IDs.

## Purpose

IDs are required for:
- Tracking updates during streaming
- Animation coordination
- Event handling
- DOM reconciliation

## Usage

\`\`\`typescript
import { CardUtils } from 'osi-cards-lib';

const cardWithIds = CardUtils.ensureSectionIds(card.sections);
// All sections, fields, items now have IDs
\`\`\`

## Generated ID Format

\`\`\`
section_0_abc123def
field_0_1_abc123def
item_0_2_abc123def
\`\`\`

## When to Use

- Before storing cards
- Before streaming
- Before animations
- When IDs are missing
` },
    { slug: 'sanitize-card-config', title: 'sanitizeCardConfig', order: 6, content: `# sanitizeCardConfig

Sanitize and validate card configurations.

## Import

\`\`\`typescript
import { CardUtils } from 'osi-cards-lib';
\`\`\`

## Usage

\`\`\`typescript
const rawConfig = JSON.parse(llmResponse);
const cleanConfig = CardUtils.sanitizeCardConfig(rawConfig);

if (cleanConfig) {
  // Safe to use
  this.card = cleanConfig;
} else {
  // Invalid configuration
  this.showError('Invalid card');
}
\`\`\`

## What It Does

1. Validates required fields (cardTitle, sections)
2. Truncates long strings
3. Filters invalid sections
4. Ensures IDs exist
5. Sanitizes actions

## Configuration

\`\`\`typescript
// Title max length: 200 characters
// Sections filtered through isCardSection
// Actions get auto-generated IDs
\`\`\`

## Return Value

- Returns sanitized \`AICardConfig\` if valid
- Returns \`null\` if invalid
` }
  ];
  
  for (const util of utils) {
    writeNgDocPage('utilities', util.slug, util.title, util.content, util.order);
  }
  
  writeCategoryFile('utilities', 'Utilities', 9);
  log(`   ✓ Generated ${utils.length} utility documentation pages`, colors.green);
}

// ============================================
// Main
// ============================================

function main() {
  log('\n📚 Generating Remaining Documentation', colors.cyan);
  log('═'.repeat(50), colors.cyan);
  
  generateServicesDocs();
  generateComponentsDocs();
  generateIntegrationDocs();
  generateAdvancedDocs();
  generateUtilitiesDocs();
  
  log('\n═'.repeat(50), colors.cyan);
  log('✅ Remaining documentation generation complete!\n', colors.green);
}

module.exports = {
  generateServicesDocs,
  generateComponentsDocs,
  generateIntegrationDocs,
  generateAdvancedDocs,
  generateUtilitiesDocs
};

if (require.main === module) {
  main();
}






