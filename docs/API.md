# OSI Cards Library - API Reference

## Table of Contents

- [Components](#components)
- [Services](#services)
- [Models](#models)
- [Utilities](#utilities)
- [Types](#types)
- [Events](#events)

---

## Components

### AICardRendererComponent

The main card rendering component with support for streaming, tilt effects, and accessibility.

```typescript
import { AICardRendererComponent } from 'osi-cards-lib';
```

#### Inputs

| Input             | Type             | Default          | Description                        |
| ----------------- | ---------------- | ---------------- | ---------------------------------- |
| `cardConfig`      | `AICardConfig`   | `undefined`      | The card configuration to render   |
| `streamingStage`  | `StreamingStage` | `undefined`      | Current streaming stage            |
| `isStreaming`     | `boolean`        | `false`          | Whether the card is being streamed |
| `isFullscreen`    | `boolean`        | `false`          | Fullscreen display mode            |
| `tiltEnabled`     | `boolean`        | `true`           | Enable magnetic tilt effect        |
| `loadingMessages` | `string[]`       | Default messages | Custom loading messages            |
| `loadingTitle`    | `string`         | `'Analyzing...'` | Loading state title                |

#### Outputs

| Output         | Type                                      | Description                              |
| -------------- | ----------------------------------------- | ---------------------------------------- |
| `cardEvent`    | `EventEmitter<CardFieldInteractionEvent>` | Emitted on field/item interactions       |
| `actionClick`  | `EventEmitter<CardAction>`                | Emitted when an action button is clicked |
| `layoutChange` | `EventEmitter<MasonryLayoutInfo>`         | Emitted when layout changes              |

#### Example

```html
<app-ai-card-renderer
  [cardConfig]="card"
  [isStreaming]="isStreaming"
  [streamingStage]="currentStage"
  (cardEvent)="onCardInteraction($event)"
  (actionClick)="onAction($event)"
>
</app-ai-card-renderer>
```

---

### MasonryGridComponent

Responsive masonry grid layout for card sections.

```typescript
import { MasonryGridComponent } from 'osi-cards-lib';
```

#### Inputs

| Input         | Type            | Default | Description               |
| ------------- | --------------- | ------- | ------------------------- |
| `sections`    | `CardSection[]` | `[]`    | Sections to display       |
| `gap`         | `number`        | `12`    | Gap between sections (px) |
| `columns`     | `number`        | Auto    | Number of columns         |
| `isStreaming` | `boolean`       | `false` | Enable streaming mode     |

---

## Services

### CardFacadeService

Simplified API for common card operations.

```typescript
import { CardFacadeService } from 'osi-cards-lib';
```

#### Methods

| Method            | Parameters                              | Returns                    | Description           |
| ----------------- | --------------------------------------- | -------------------------- | --------------------- |
| `createCard`      | `options: CreateCardOptions`            | `AICardConfig`             | Create a new card     |
| `createEmptyCard` | `title?: string`                        | `AICardConfig`             | Create empty card     |
| `createErrorCard` | `error: Error \| string`                | `AICardConfig`             | Create error card     |
| `streamFromJson`  | `json: string, options?: StreamOptions` | `Observable<AICardConfig>` | Stream card from JSON |
| `validate`        | `card: Partial<AICardConfig>`           | `CardValidationResult`     | Validate card config  |
| `getStatistics`   | `card: AICardConfig`                    | `CardStatistics`           | Get card statistics   |

#### Example

```typescript
const cardFacade = inject(CardFacadeService);

// Create a card
const card = cardFacade.createCard({
  title: 'My Card',
  sections: [
    { title: 'Info', type: 'info', fields: [...] }
  ]
});

// Validate
const validation = cardFacade.validate(card);
if (!validation.valid) {
  console.error('Errors:', validation.errors);
}
```

---

### OSICardsStreamingService

Simulates LLM streaming for progressive card rendering.

```typescript
import { OSICardsStreamingService } from 'osi-cards-lib';
```

#### Properties

| Property         | Type                         | Description             |
| ---------------- | ---------------------------- | ----------------------- |
| `state$`         | `Observable<StreamingState>` | Current streaming state |
| `cardUpdates$`   | `Observable<CardUpdate>`     | Card update events      |
| `bufferUpdates$` | `Observable<string>`         | Raw buffer updates      |

#### Methods

| Method      | Parameters                                 | Description         |
| ----------- | ------------------------------------------ | ------------------- |
| `start`     | `json: string, options?: StreamingOptions` | Start streaming     |
| `stop`      |                                            | Stop streaming      |
| `configure` | `config: Partial<StreamingConfig>`         | Configure streaming |
| `getState`  |                                            | Get current state   |

---

### FeatureFlagsService

Runtime feature flag management.

```typescript
import { FeatureFlagsService, OSI_FEATURE_FLAGS } from 'osi-cards-lib';
```

#### Available Flags

| Flag              | Default | Description                   |
| ----------------- | ------- | ----------------------------- |
| `VIRTUAL_SCROLL`  | `false` | Use virtual scrolling         |
| `SKYLINE_PACKING` | `false` | Use skyline packing algorithm |
| `WEB_WORKERS`     | `false` | Offload layout to workers     |
| `FLIP_ANIMATIONS` | `true`  | Use FLIP animations           |
| `DEBUG_OVERLAY`   | `false` | Show debug overlay            |

#### Methods

| Method      | Parameters                   | Returns   | Description           |
| ----------- | ---------------------------- | --------- | --------------------- |
| `isEnabled` | `flag: FeatureFlagKey`       | `boolean` | Check if flag enabled |
| `enable`    | `flag: FeatureFlagKey`       | `boolean` | Enable a flag         |
| `disable`   | `flag: FeatureFlagKey`       | `boolean` | Disable a flag        |
| `toggle`    | `flag: FeatureFlagKey`       | `boolean` | Toggle a flag         |
| `configure` | `config: FeatureFlagsConfig` | `void`    | Set multiple flags    |

---

### AccessibilityService

Accessibility utilities for live announcements and focus management.

```typescript
import { AccessibilityService } from 'osi-cards-lib';
```

#### Methods

| Method         | Parameters                                              | Description                |
| -------------- | ------------------------------------------------------- | -------------------------- |
| `announce`     | `message: string, politeness?: 'polite' \| 'assertive'` | Announce to screen readers |
| `trapFocus`    | `container: HTMLElement, options?: FocusTrapOptions`    | Trap focus in container    |
| `releaseFocus` |                                                         | Release focus trap         |
| `focusElement` | `element: HTMLElement, scrollIntoView?: boolean`        | Focus an element           |

---

## Models

### AICardConfig

Main card configuration interface.

```typescript
interface AICardConfig {
  id?: string;
  cardTitle: string;
  description?: string;
  cardType?: 'company' | 'product' | 'person' | 'event' | 'generic';
  sections: CardSection[];
  actions?: CardAction[];
  meta?: Record<string, unknown>;
}
```

### CardSection

Section configuration interface.

```typescript
interface CardSection {
  id?: string;
  title: string;
  type: SectionType;
  description?: string;
  fields?: CardField[];
  items?: CardItem[];
  priority?: 'critical' | 'important' | 'standard' | 'low';
  columns?: number;
  preferredColumns?: number;
  colSpan?: number;
  collapsed?: boolean;
  collapsible?: boolean;
}
```

### CardField

Field configuration interface.

```typescript
interface CardField {
  id?: string;
  label?: string;
  value?: string | number | boolean | null;
  type?: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'url' | 'email' | 'phone';
  icon?: string;
  url?: string;
  meta?: Record<string, unknown>;
}
```

### CardAction

Action configuration interface.

```typescript
interface CardAction {
  id?: string;
  label: string;
  type?: 'mail' | 'website' | 'agent' | 'question' | 'custom';
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}
```

---

## Utilities

### Input Validation

Security-focused input validation and sanitization.

```typescript
import {
  validateUrl,
  validateEmail,
  sanitizeHtml,
  escapeHtml,
  validateCardConfig,
} from 'osi-cards-lib';
```

| Function             | Parameters                                         | Returns                                     | Description                |
| -------------------- | -------------------------------------------------- | ------------------------------------------- | -------------------------- |
| `validateUrl`        | `url: unknown, options?: UrlValidationOptions`     | `ValidationResult`                          | Validate and sanitize URLs |
| `validateEmail`      | `email: unknown`                                   | `boolean`                                   | Validate email address     |
| `sanitizeHtml`       | `html: unknown, options?: HtmlSanitizationOptions` | `string`                                    | Sanitize HTML content      |
| `escapeHtml`         | `text: unknown`                                    | `string`                                    | Escape HTML entities       |
| `validateCardConfig` | `config: unknown`                                  | `ValidationResult<Record<string, unknown>>` | Validate card config       |

---

## Types

### SectionType

Available section types.

```typescript
type SectionType =
  | 'info'
  | 'analytics'
  | 'chart'
  | 'list'
  | 'contact-card'
  | 'network-card'
  | 'map'
  | 'event'
  | 'product'
  | 'overview'
  | 'financials'
  | 'solutions'
  | 'quotation'
  | 'text-reference'
  | 'brand-colors'
  | 'news'
  | 'social-media'
  | 'fallback';
```

### StreamingStage

Streaming lifecycle stages.

```typescript
type StreamingStage = 'idle' | 'thinking' | 'streaming' | 'complete' | 'aborted' | 'error';
```

---

## Events

### CardFieldInteractionEvent

Emitted when users interact with card elements.

```typescript
interface CardFieldInteractionEvent {
  field?: CardField;
  item?: CardItem | CardField;
  action: 'click';
  sectionTitle?: string;
  metadata?: Record<string, unknown>;
}
```

### SectionRenderEvent

Emitted by section renderer.

```typescript
interface SectionRenderEvent {
  type: 'field' | 'item' | 'action' | 'navigation';
  section: CardSection;
  field?: CardField;
  item?: CardItem;
  action?: CardAction;
  metadata?: Record<string, unknown>;
}
```

---

## Provider Functions

### provideOSICards

Main provider function for configuring the library.

```typescript
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards({
      theme: 'light',
      animations: true,
      featureFlags: {
        virtualScroll: true,
      },
    }),
  ],
};
```

---

## CSS Custom Properties

The library exposes CSS custom properties for theming.

```css
:root {
  /* Colors */
  --osi-card-background: #ffffff;
  --osi-card-foreground: #1a1a1a;
  --osi-card-border: #e5e7eb;
  --osi-card-accent: #6366f1;

  /* Spacing */
  --osi-card-padding: 1rem;
  --osi-card-gap: 0.75rem;
  --osi-card-border-radius: 0.5rem;

  /* Typography */
  --osi-card-font-family: system-ui, sans-serif;
  --osi-card-title-size: 1.25rem;
  --osi-card-body-size: 0.875rem;

  /* Shadows */
  --osi-card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --osi-card-shadow-hover: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

---

## Troubleshooting

### Common Issues

#### Cards not rendering

- Ensure `provideOSICards()` is in your providers array
- Check that `cardConfig` has `cardTitle` and `sections` array

#### Animations not working

- Verify `provideAnimations()` is configured
- Check `prefers-reduced-motion` media query

#### Styles not applied

- Import the styles: `@import 'osi-cards-lib/styles/styles.scss';`
- Ensure proper encapsulation settings

For more help, see the [GitHub repository](https://github.com/Inutilepat83/OSI-Cards).
