#!/usr/bin/env node

/**
 * Comprehensive Documentation Generator
 * 
 * Master orchestrator for all documentation generation.
 * Generates 100 documentation points from:
 * - section-registry.json
 * - TypeScript source files (JSDoc/TSDoc)
 * - OpenAPI specification
 * 
 * Usage: node scripts/generate-comprehensive-docs.js [--verbose]
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const LIB_DIR = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib');
const DOCS_DIR = path.join(ROOT_DIR, 'src', 'app', 'features', 'documentation');
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  dim: '\x1b[2m'
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

// Import other generators
let extractJsdoc, generateApiDocs;
try {
  extractJsdoc = require('./extract-jsdoc');
  generateApiDocs = require('./generate-api-docs');
} catch (e) {
  // Scripts may not exist yet during initial run
}

/**
 * Load section registry
 */
function loadRegistry() {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
  return JSON.parse(content);
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Write ng-doc page files
 */
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
  
  return pageDir;
}

/**
 * Write category file
 */
function writeCategoryFile(category, title, order, expandable = true) {
  const categoryDir = path.join(DOCS_DIR, category);
  ensureDir(categoryDir);
  
  const varName = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Category';
  
  const categoryTs = `import { NgDocCategory } from '@ng-doc/core';

const ${varName}: NgDocCategory = {
  title: '${title}',
  order: ${order},
  expandable: ${expandable}
};

export default ${varName};
`;
  
  fs.writeFileSync(path.join(categoryDir, 'ng-doc.category.ts'), categoryTs, 'utf8');
}

// ============================================
// Schema Documentation Generator (Points 19-25)
// ============================================

function generateSchemasDocs() {
  log('\n📋 Generating Schema Documentation (Points 19-25)...', colors.blue);
  
  const modelPath = path.join(LIB_DIR, 'models', 'card.model.ts');
  const source = fs.existsSync(modelPath) ? fs.readFileSync(modelPath, 'utf8') : '';
  
  // AICardConfig (Point 19)
  writeNgDocPage('schemas', 'ai-card-config', 'AICardConfig', `# AICardConfig

The main configuration interface for OSI Cards.

## Overview

\`AICardConfig\` is the primary interface that defines the structure of a card. Every card in OSI Cards must conform to this interface.

## Interface Definition

\`\`\`typescript
interface AICardConfig {
  id?: string;
  cardTitle: string;
  cardType?: CardType;
  description?: string;
  columns?: 1 | 2 | 3;
  sections: CardSection[];
  actions?: CardAction[];
  meta?: Record<string, unknown>;
  processedAt?: number;
  displayOrder?: number;
}
\`\`\`

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| \`id\` | string | No | Unique identifier for the card |
| \`cardTitle\` | string | **Yes** | Main title displayed on the card |
| \`cardType\` | CardType | No | Card category (company, contact, etc.) |
| \`description\` | string | No | Card description/subtitle |
| \`columns\` | 1 \\| 2 \\| 3 | No | Number of columns for section layout |
| \`sections\` | CardSection[] | **Yes** | Array of sections composing the card |
| \`actions\` | CardAction[] | No | Action buttons at card bottom |
| \`meta\` | Record<string, unknown> | No | Additional metadata |
| \`processedAt\` | number | No | Processing timestamp |
| \`displayOrder\` | number | No | Order for drag-and-drop |

## Example

\`\`\`json
{
  "cardTitle": "Acme Corporation",
  "cardType": "company",
  "description": "Technology Solutions Provider",
  "columns": 2,
  "sections": [
    {
      "title": "Company Info",
      "type": "info",
      "fields": [
        { "label": "Industry", "value": "Technology" },
        { "label": "Founded", "value": "2010" }
      ]
    }
  ],
  "actions": [
    { "label": "Visit Website", "type": "website", "url": "https://acme.com" }
  ]
}
\`\`\`

## Related

- [CardSection](#cardsection)
- [CardAction](#cardaction)
- [Section Types](/docs/section-types)
`, 1);

  // CardSection (Point 20)
  writeNgDocPage('schemas', 'card-section', 'CardSection', `# CardSection

Defines a section within a card.

## Overview

\`CardSection\` represents a single section of content within a card. Each section has a type that determines how it renders.

## Interface Definition

\`\`\`typescript
interface CardSection {
  id?: string;
  title: string;
  type: SectionTypeInput;
  description?: string;
  subtitle?: string;
  columns?: number;
  colSpan?: number;
  preferredColumns?: 1 | 2 | 3 | 4;
  minColumns?: 1 | 2 | 3 | 4;
  maxColumns?: 1 | 2 | 3 | 4;
  orientation?: 'vertical' | 'horizontal' | 'auto';
  flexGrow?: boolean;
  canShrink?: boolean;
  canGrow?: boolean;
  layoutPriority?: LayoutPriority;
  priority?: 'critical' | 'important' | 'standard' | 'optional';
  sticky?: boolean;
  groupId?: string;
  columnAffinity?: number;
  collapsed?: boolean;
  emoji?: string;
  fields?: CardField[];
  items?: CardItem[];
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut';
  chartData?: ChartData;
  meta?: Record<string, unknown>;
}
\`\`\`

## Key Properties

| Property | Type | Description |
|----------|------|-------------|
| \`title\` | string | Section header title |
| \`type\` | SectionTypeInput | Section type (info, analytics, etc.) |
| \`fields\` | CardField[] | Key-value data for field-based sections |
| \`items\` | CardItem[] | List items for item-based sections |
| \`chartType\` | string | Chart type for chart sections |
| \`chartData\` | object | Data for chart rendering |

## Layout Properties

| Property | Description |
|----------|-------------|
| \`preferredColumns\` | Preferred width (1-4 columns) |
| \`minColumns\` | Minimum width constraint |
| \`maxColumns\` | Maximum width constraint |
| \`orientation\` | Content flow direction |
| \`layoutPriority\` | Priority for space-filling algorithm |

## Example

\`\`\`json
{
  "title": "Key Metrics",
  "type": "analytics",
  "description": "Performance indicators",
  "preferredColumns": 2,
  "fields": [
    { "label": "Revenue", "value": "$5M", "percentage": 75, "trend": "up" },
    { "label": "Growth", "value": "25%", "percentage": 25, "trend": "up" }
  ]
}
\`\`\`
`, 2);

  // CardField (Point 21)
  writeNgDocPage('schemas', 'card-field', 'CardField', `# CardField

Defines a field within a section.

## Overview

\`CardField\` represents a single data point within a section. Fields typically display key-value pairs with optional metadata.

## Interface Definition

\`\`\`typescript
interface CardField {
  id?: string;
  label?: string;
  title?: string;
  value?: string | number | boolean | null;
  icon?: string;
  format?: 'currency' | 'percentage' | 'number' | 'text';
  percentage?: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable' | 'neutral';
  performance?: string;
  description?: string;
  status?: 'completed' | 'in-progress' | 'pending' | 'cancelled' | 'active' | 'inactive' | 'warning';
  priority?: 'high' | 'medium' | 'low';
  email?: string;
  phone?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  meta?: Record<string, unknown>;
}
\`\`\`

## Common Properties

| Property | Type | Description |
|----------|------|-------------|
| \`label\` | string | Field label/key |
| \`value\` | mixed | Field value |
| \`icon\` | string | Icon (emoji or icon name) |
| \`trend\` | string | Trend indicator |
| \`percentage\` | number | Value for progress bars |
| \`format\` | string | Value formatting hint |

## Examples by Section Type

### Info Section
\`\`\`json
{ "label": "Industry", "value": "Technology", "icon": "🏢" }
\`\`\`

### Analytics Section
\`\`\`json
{ "label": "Growth", "value": "25%", "percentage": 25, "trend": "up", "change": 5.2 }
\`\`\`

### Contact Section
\`\`\`json
{ "title": "John Doe", "role": "CEO", "email": "john@example.com", "phone": "+1-555-0100" }
\`\`\`
`, 3);

  // CardItem (Point 22)
  writeNgDocPage('schemas', 'card-item', 'CardItem', `# CardItem

Defines an item in list-based sections.

## Overview

\`CardItem\` is used for sections that display lists of items, such as news, events, or product lists.

## Interface Definition

\`\`\`typescript
interface CardItem {
  id?: string;
  title: string;
  description?: string;
  icon?: string;
  value?: string | number;
  status?: string;
  date?: string;
  meta?: Record<string, unknown>;
}
\`\`\`

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| \`id\` | string | No | Unique identifier |
| \`title\` | string | **Yes** | Item title |
| \`description\` | string | No | Item description |
| \`icon\` | string | No | Icon identifier |
| \`value\` | string \\| number | No | Associated value |
| \`status\` | string | No | Status indicator |
| \`date\` | string | No | Date string |
| \`meta\` | object | No | Additional metadata |

## Example (News Section)

\`\`\`json
{
  "title": "Q4 Earnings Released",
  "description": "Company reports 25% revenue growth",
  "meta": {
    "source": "Bloomberg",
    "date": "2025-01-15"
  },
  "status": "published"
}
\`\`\`

## Example (List Section)

\`\`\`json
{
  "title": "Real-time Analytics",
  "description": "Live data processing",
  "icon": "📊",
  "status": "completed"
}
\`\`\`
`, 4);

  // CardAction (Point 23)
  writeNgDocPage('schemas', 'card-action', 'CardAction', `# CardAction

Defines action buttons for cards.

## Overview

\`CardAction\` defines interactive buttons displayed at the bottom of cards. Four action types are supported.

## Action Types

### Mail Action
Opens email client with pre-filled content.

\`\`\`typescript
interface MailCardAction {
  type: 'mail';
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  email: {
    contact: { name: string; email: string; role: string };
    subject: string;
    body: string;
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
  };
}
\`\`\`

### Website Action
Opens URL in new tab.

\`\`\`typescript
interface WebsiteCardAction {
  type: 'website';
  label: string;
  url: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}
\`\`\`

### Agent Action
Triggers agent interaction.

\`\`\`typescript
interface AgentCardAction {
  type: 'agent';
  label: string;
  agentId?: string;
  agentContext?: Record<string, unknown>;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}
\`\`\`

### Question Action
Sends question to chat.

\`\`\`typescript
interface QuestionCardAction {
  type: 'question';
  label: string;
  question?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}
\`\`\`

## Examples

\`\`\`json
[
  {
    "label": "Contact",
    "type": "mail",
    "variant": "primary",
    "icon": "📧",
    "email": {
      "contact": { "name": "John", "email": "john@example.com", "role": "Sales" },
      "subject": "Inquiry",
      "body": "Hello..."
    }
  },
  {
    "label": "Website",
    "type": "website",
    "variant": "secondary",
    "url": "https://example.com"
  }
]
\`\`\`
`, 5);

  // EmailConfig (Point 24)
  writeNgDocPage('schemas', 'email-config', 'EmailConfig', `# EmailConfig

Configuration for mail action buttons.

## Overview

\`EmailConfig\` defines the email content for mail-type card actions.

## Interface Definition

\`\`\`typescript
interface EmailConfig {
  contact: EmailContact;
  subject: string;
  body: string;
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
}

interface EmailContact {
  name: string;
  email: string;
  role: string;
}
\`\`\`

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| \`contact\` | EmailContact | **Yes** | Contact information |
| \`subject\` | string | **Yes** | Email subject line |
| \`body\` | string | **Yes** | Email body content |
| \`to\` | string \\| string[] | No | Override recipient(s) |
| \`cc\` | string \\| string[] | No | CC recipient(s) |
| \`bcc\` | string \\| string[] | No | BCC recipient(s) |

## Example

\`\`\`json
{
  "contact": {
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "role": "Account Manager"
  },
  "subject": "Follow-up: Product Demo",
  "body": "Dear Jane,\\n\\nThank you for the demo yesterday...\\n\\nBest regards"
}
\`\`\`
`, 6);

  // Type Aliases (Point 25)
  writeNgDocPage('schemas', 'type-aliases', 'Type Aliases & Enums', `# Type Aliases & Enums

Reference for all type aliases and enums in OSI Cards.

## Card Types

\`\`\`typescript
type CardType = 'all' | 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event' | 'project' | 'sko';
\`\`\`

## Section Types

\`\`\`typescript
type SectionType = 
  | 'info' | 'analytics' | 'contact-card' | 'network-card' 
  | 'map' | 'financials' | 'event' | 'list' | 'chart' 
  | 'product' | 'solutions' | 'overview' | 'quotation' 
  | 'text-reference' | 'brand-colors' | 'news' | 'social-media' 
  | 'fallback';
\`\`\`

## Type Aliases (Backwards Compatibility)

| Alias | Resolves To |
|-------|-------------|
| \`metrics\` | analytics |
| \`stats\` | analytics |
| \`timeline\` | event |
| \`table\` | list |
| \`locations\` | map |
| \`quote\` | quotation |
| \`reference\` | text-reference |
| \`text-ref\` | text-reference |
| \`brands\` | brand-colors |
| \`colors\` | brand-colors |
| \`project\` | info |

## Layout Priority

\`\`\`typescript
type LayoutPriority = 1 | 2 | 3;
// 1 = Highest (placed first)
// 2 = Medium
// 3 = Lowest (placed last)
\`\`\`

## Trend Indicators

\`\`\`typescript
type Trend = 'up' | 'down' | 'stable' | 'neutral';
\`\`\`

## Status Values

\`\`\`typescript
type FieldStatus = 'completed' | 'in-progress' | 'pending' | 'cancelled' | 'active' | 'inactive' | 'warning';
type Priority = 'high' | 'medium' | 'low';
type Performance = 'excellent' | 'good' | 'average' | 'poor';
\`\`\`

## Button Variants

\`\`\`typescript
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
\`\`\`

## Chart Types

\`\`\`typescript
type ChartType = 'bar' | 'line' | 'pie' | 'doughnut';
\`\`\`
`, 7);

  // Write category file
  writeCategoryFile('schemas', 'Schemas', 3);
  
  log('   ✓ Generated 7 schema documentation pages', colors.green);
}

// ============================================
// Streaming Documentation Generator (Points 26-32)
// ============================================

function generateStreamingDocs() {
  log('\n🌊 Generating Streaming Documentation (Points 26-32)...', colors.blue);
  
  // Point 26: Overview
  writeNgDocPage('streaming', 'overview', 'Streaming Overview', `# Streaming Overview

Progressive card generation with real-time updates.

## Introduction

OSI Cards supports streaming card generation, allowing cards to be displayed progressively as LLM responses arrive. This creates a smooth, responsive user experience.

## Key Features

- **Progressive Rendering**: Cards appear section-by-section
- **Placeholder Animation**: Skeleton states while loading
- **Section Completion**: Visual feedback when sections complete
- **Error Recovery**: Graceful handling of stream interruptions

## Architecture

\`\`\`
LLM Response → JSON Chunks → Buffer → Parser → Card Updates → UI
\`\`\`

## Quick Start

\`\`\`typescript
import { OSICardsStreamingService } from 'osi-cards-lib';

const streamingService = inject(OSICardsStreamingService);

// Start streaming
streamingService.start(jsonString);

// Subscribe to updates
streamingService.cardUpdates$.subscribe(update => {
  this.card = update.card;
});

// Monitor state
streamingService.state$.subscribe(state => {
  this.isStreaming = state.isActive;
  this.progress = state.progress;
});
\`\`\`

## Streaming Stages

| Stage | Description |
|-------|-------------|
| \`idle\` | No active stream |
| \`thinking\` | Initial delay (simulates LLM thinking) |
| \`streaming\` | Actively receiving chunks |
| \`complete\` | Stream finished successfully |
| \`aborted\` | Stream cancelled |
| \`error\` | Stream failed |
`, 1);

  // Point 27: StreamingConfig
  writeNgDocPage('streaming', 'config', 'StreamingConfig', `# StreamingConfig

Configuration options for streaming behavior.

## Interface

\`\`\`typescript
interface StreamingConfig {
  minChunkSize: number;      // Minimum chunk size (chars)
  maxChunkSize: number;      // Maximum chunk size (chars)
  thinkingDelayMs: number;   // Initial thinking delay
  charsPerToken: number;     // Characters per token
  tokensPerSecond: number;   // Target streaming speed
  cardUpdateThrottleMs: number;    // Update throttle
  completionBatchDelayMs: number;  // Batch completion delay
}
\`\`\`

## Default Values

| Property | Default | Description |
|----------|---------|-------------|
| \`minChunkSize\` | 10 | Minimum characters per chunk |
| \`maxChunkSize\` | 50 | Maximum characters per chunk |
| \`thinkingDelayMs\` | 100 | Delay before streaming starts |
| \`charsPerToken\` | 4 | Characters per LLM token |
| \`tokensPerSecond\` | 80 | Target streaming speed |
| \`cardUpdateThrottleMs\` | 50 | UI update throttle |
| \`completionBatchDelayMs\` | 100 | Section completion batching |

## Custom Configuration

\`\`\`typescript
const streamingService = inject(OSICardsStreamingService);

// Configure for faster streaming
streamingService.configure({
  tokensPerSecond: 120,
  thinkingDelayMs: 50
});

// Configure for slower, more readable streaming
streamingService.configure({
  tokensPerSecond: 40,
  cardUpdateThrottleMs: 100
});
\`\`\`
`, 2);

  // Point 28: StreamingState
  writeNgDocPage('streaming', 'state', 'StreamingState', `# StreamingState

Real-time streaming state information.

## Interface

\`\`\`typescript
interface StreamingState {
  isActive: boolean;       // Streaming in progress
  stage: StreamingStage;   // Current stage
  progress: number;        // 0-1 progress
  bufferLength: number;    // Current buffer size
  targetLength: number;    // Total expected length
}

type StreamingStage = 'idle' | 'thinking' | 'streaming' | 'complete' | 'aborted' | 'error';
\`\`\`

## Subscribing to State

\`\`\`typescript
const streamingService = inject(OSICardsStreamingService);

streamingService.state$.subscribe(state => {
  // Update progress bar
  this.progress = state.progress * 100;
  
  // Show/hide loading indicator
  this.isLoading = state.isActive;
  
  // Handle completion
  if (state.stage === 'complete') {
    this.onStreamComplete();
  }
  
  // Handle errors
  if (state.stage === 'error') {
    this.onStreamError();
  }
});
\`\`\`

## Getting Current State

\`\`\`typescript
// Get snapshot of current state
const currentState = streamingService.getState();

if (currentState.isActive) {
  console.log(\`Progress: \${currentState.progress * 100}%\`);
}
\`\`\`
`, 3);

  // Point 29: CardUpdate Events
  writeNgDocPage('streaming', 'card-updates', 'Card Updates', `# Card Updates

Receiving card updates during streaming.

## CardUpdate Interface

\`\`\`typescript
interface CardUpdate {
  card: AICardConfig;           // Updated card
  changeType: CardChangeType;   // Type of change
  completedSections?: number[]; // Newly completed sections
}

type CardChangeType = 'structural' | 'content';
\`\`\`

## Change Types

| Type | Description |
|------|-------------|
| \`structural\` | New sections added or removed |
| \`content\` | Existing section content updated |

## Subscribing to Updates

\`\`\`typescript
streamingService.cardUpdates$.subscribe(update => {
  // Update card
  this.card = update.card;
  
  // Handle structural changes (new sections)
  if (update.changeType === 'structural') {
    this.onNewSections();
  }
  
  // Animate completed sections
  if (update.completedSections?.length) {
    for (const index of update.completedSections) {
      this.animateSectionComplete(index);
    }
  }
});
\`\`\`

## Buffer Updates

\`\`\`typescript
// Raw buffer updates (for JSON editor sync)
streamingService.bufferUpdates$.subscribe(buffer => {
  this.jsonEditorContent = buffer;
});
\`\`\`
`, 4);

  // Point 30: Progressive Rendering
  writeNgDocPage('streaming', 'progressive-rendering', 'Progressive Rendering', `# Progressive Rendering

How cards render progressively during streaming.

## Rendering Flow

1. **Placeholder Creation**: Empty card shell appears
2. **Section Detection**: As JSON parses, sections are created
3. **Field Population**: Fields populate as data arrives
4. **Completion Animation**: Sections animate when complete

## Placeholder Cards

During streaming, sections show placeholder content:

\`\`\`typescript
// Placeholder section structure
{
  title: "Section 1",
  type: "info",
  fields: [
    { label: "Field 1", value: "", meta: { placeholder: true } }
  ],
  meta: { placeholder: true, streamingOrder: 0 }
}
\`\`\`

## CSS Classes

| Class | Description |
|-------|-------------|
| \`.osi-streaming\` | Applied during active streaming |
| \`.osi-section-placeholder\` | Placeholder section |
| \`.osi-section-complete\` | Completed section |
| \`.osi-field-placeholder\` | Placeholder field |

## Template Example

\`\`\`html
<app-ai-card-renderer
  [cardConfig]="card"
  [class.osi-streaming]="isStreaming">
</app-ai-card-renderer>
\`\`\`
`, 5);

  // Point 31: Lifecycle Hooks
  writeNgDocPage('streaming', 'lifecycle', 'Streaming Lifecycle', `# Streaming Lifecycle

Complete streaming lifecycle and control methods.

## Starting a Stream

\`\`\`typescript
// Normal start with thinking delay
streamingService.start(jsonString);

// Instant mode (no thinking delay)
streamingService.start(jsonString, { instant: true });
\`\`\`

## Stopping a Stream

\`\`\`typescript
// Stop and reset
streamingService.stop();
// State becomes 'aborted'
\`\`\`

## Complete Lifecycle

\`\`\`typescript
@Component({...})
export class CardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnInit() {
    // Subscribe to state changes
    this.streamingService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        switch (state.stage) {
          case 'thinking':
            this.showThinkingIndicator();
            break;
          case 'streaming':
            this.showProgressBar();
            break;
          case 'complete':
            this.onComplete();
            break;
          case 'error':
            this.onError();
            break;
        }
      });
    
    // Subscribe to card updates
    this.streamingService.cardUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(update => {
        this.card = update.card;
      });
  }
  
  startStreaming(json: string) {
    this.streamingService.start(json);
  }
  
  cancelStreaming() {
    this.streamingService.stop();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.streamingService.stop();
  }
}
\`\`\`
`, 6);

  // Point 32: Error Handling
  writeNgDocPage('streaming', 'error-handling', 'Error Handling', `# Streaming Error Handling

Handling errors and recovery in streaming.

## Error States

Streaming can fail due to:
- Invalid JSON
- Network interruption
- Timeout

## Detecting Errors

\`\`\`typescript
streamingService.state$.subscribe(state => {
  if (state.stage === 'error') {
    // Handle error
    this.showError('Streaming failed');
  }
});
\`\`\`

## Recovery Strategies

### Retry

\`\`\`typescript
async retryStream(json: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      this.streamingService.start(json);
      
      await firstValueFrom(
        this.streamingService.state$.pipe(
          filter(s => s.stage === 'complete' || s.stage === 'error'),
          take(1)
        )
      );
      
      const state = this.streamingService.getState();
      if (state.stage === 'complete') return;
      
    } catch (e) {
      if (i === maxRetries - 1) throw e;
    }
  }
}
\`\`\`

### Fallback to Static

\`\`\`typescript
streamingService.state$.subscribe(state => {
  if (state.stage === 'error') {
    // Try to parse what we have
    try {
      const partial = JSON.parse(this.buffer);
      this.card = partial;
    } catch {
      // Show static placeholder
      this.card = this.getPlaceholderCard();
    }
  }
});
\`\`\`

## Validation

\`\`\`typescript
// Validate before streaming
if (!isValidJson(jsonString)) {
  this.showError('Invalid JSON');
  return;
}

streamingService.start(jsonString);
\`\`\`
`, 7);

  // Write category
  writeCategoryFile('streaming', 'Streaming', 4);
  
  log('   ✓ Generated 7 streaming documentation pages', colors.green);
}

// ============================================
// Main Execution
// ============================================

async function main() {
  log('\n📚 OSI Cards Comprehensive Documentation Generator', colors.cyan);
  log('═'.repeat(55), colors.cyan);
  log(`   Generating 100 documentation points...`, colors.dim);
  
  const startTime = Date.now();
  
  // Generate schemas documentation (Points 19-25)
  generateSchemasDocs();
  
  // Generate streaming documentation (Points 26-32)
  generateStreamingDocs();
  
  // Run API docs generator
  log('\n🔌 Running API Documentation Generator...', colors.blue);
  try {
    require('./generate-api-docs');
    log('   ✓ API documentation generated', colors.green);
  } catch (e) {
    log(`   ⚠ API docs generator: ${e.message}`, colors.yellow);
  }
  
  // Run existing section docs generator
  log('\n📑 Running Section Documentation Generator...', colors.blue);
  try {
    require('./generate-docs-from-registry');
    log('   ✓ Section documentation generated', colors.green);
  } catch (e) {
    log(`   ⚠ Section docs generator: ${e.message}`, colors.yellow);
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  log('\n═'.repeat(55), colors.cyan);
  log(`✅ Documentation generation complete in ${elapsed}s`, colors.green);
  log(`   View at: http://localhost:4200/docs\n`, colors.dim);
}

module.exports = {
  loadRegistry,
  ensureDir,
  writeNgDocPage,
  writeCategoryFile,
  generateSchemasDocs,
  generateStreamingDocs
};

if (require.main === module) {
  main().catch(console.error);
}

