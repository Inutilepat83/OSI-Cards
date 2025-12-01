# OSI Cards Directives & Utilities

This document covers the standalone directives and utility functions provided by the OSI Cards library for common functionality like copy-to-clipboard, tooltips, theming, accessibility, performance optimization, validation, and retry mechanisms.

---

## Table of Contents

- [Directives](#directives)
  - [CopyToClipboardDirective](#copytoclipboarddirective)
  - [TooltipDirective](#tooltipdirective)
  - [OsiThemeDirective](#osithemidirective)
  - [OsiThemeContainerDirective](#osithemecontainerdirective)
- [Utilities](#utilities)
  - [Accessibility Utilities](#accessibility-utilities)
  - [Input Validation Utilities](#input-validation-utilities)
  - [Performance Utilities](#performance-utilities)
  - [Retry Utilities](#retry-utilities)

---

## Directives

### CopyToClipboardDirective

Enables one-click copy functionality for any element with feedback display.

**Selector:** `[appCopyToClipboard]`

**Location:** `projects/osi-cards-lib/src/lib/directives/copy-to-clipboard.directive.ts`

#### Basic Usage

```html
<!-- Copy element text content -->
<span [appCopyToClipboard]>contact@example.com</span>

<!-- Copy custom value -->
<button [appCopyToClipboard]="customValue" (copySuccess)="onCopied()">Copy Value</button>

<!-- With feedback message -->
<code appCopyToClipboard showFeedback="Copied!"> npm install osi-cards </code>
```

#### Inputs

| Input                | Type                | Default          | Description                                                   |
| -------------------- | ------------------- | ---------------- | ------------------------------------------------------------- |
| `appCopyToClipboard` | `string \| null`    | `null`           | Value to copy. If not provided, copies element's text content |
| `showFeedback`       | `string \| boolean` | `false`          | Feedback message to show on copy success                      |
| `feedbackDuration`   | `number`            | `2000`           | Duration to show feedback in milliseconds                     |
| `feedbackClass`      | `string`            | `'copy-success'` | CSS class to add during feedback                              |

#### Outputs

| Output        | Type                       | Description                                  |
| ------------- | -------------------------- | -------------------------------------------- |
| `copySuccess` | `EventEmitter<string>`     | Emitted when copy succeeds with copied text  |
| `copyError`   | `EventEmitter<string>`     | Emitted when copy fails with error message   |
| `copyResult`  | `EventEmitter<CopyResult>` | Emitted on any copy attempt with full result |

#### CopyResult Interface

```typescript
interface CopyResult {
  success: boolean;
  text: string;
  error?: string;
}
```

#### Example with Full Configuration

```typescript
@Component({
  template: `
    <div
      [appCopyToClipboard]="apiKey"
      showFeedback="API Key Copied!"
      [feedbackDuration]="3000"
      feedbackClass="copied-success"
      (copySuccess)="onCopied($event)"
      (copyError)="onError($event)"
    >
      {{ apiKey }}
    </div>
  `,
})
export class ApiKeyComponent {
  apiKey = 'sk-1234567890abcdef';

  onCopied(text: string) {
    console.log('Copied:', text);
  }

  onError(error: string) {
    console.error('Copy failed:', error);
  }
}
```

---

### TooltipDirective

Provides configurable tooltips for any element with multiple positions and animations.

**Selector:** `[appTooltip]`

**Location:** `projects/osi-cards-lib/src/lib/directives/tooltip.directive.ts`

#### Basic Usage

```html
<!-- Simple tooltip -->
<button appTooltip="Click to save">Save</button>

<!-- Positioned tooltip -->
<span [appTooltip]="helpText" tooltipPosition="bottom"> Help </span>

<!-- Delayed tooltip -->
<icon appTooltip="Settings" [tooltipDelay]="500" tooltipPosition="left"> ⚙️ </icon>
```

#### Inputs

| Input              | Type                                     | Default | Description                         |
| ------------------ | ---------------------------------------- | ------- | ----------------------------------- |
| `appTooltip`       | `string`                                 | `''`    | Tooltip text content                |
| `tooltipPosition`  | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Tooltip position                    |
| `tooltipDelay`     | `number`                                 | `300`   | Delay before showing (ms)           |
| `tooltipDuration`  | `number`                                 | `0`     | Auto-hide duration (0 = indefinite) |
| `tooltipClass`     | `string`                                 | `''`    | Custom CSS class                    |
| `tooltipDisabled`  | `boolean`                                | `false` | Disable tooltip                     |
| `tooltipShowArrow` | `boolean`                                | `true`  | Show arrow pointer                  |
| `tooltipMaxWidth`  | `number`                                 | `250`   | Maximum width in pixels             |

#### Styling

Tooltips use CSS custom properties for theming:

```css
:root {
  --osi-tooltip-bg: #1f2937;
  --osi-tooltip-color: #ffffff;
}
```

#### Example

```html
<button
  appTooltip="This action cannot be undone"
  tooltipPosition="bottom"
  [tooltipDelay]="200"
  tooltipClass="warning-tooltip"
>
  Delete
</button>
```

---

### OsiThemeDirective

Applies theme to a specific DOM subtree, allowing cards or sections to have independent themes from the global document theme.

**Selector:** `[osiTheme]`

**Location:** `projects/osi-cards-lib/src/lib/directives/scoped-theme.directive.ts`

#### Basic Usage

```html
<!-- Apply dark theme to this card only -->
<div osiTheme="dark">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</div>

<!-- Use a custom theme -->
<div [osiTheme]="myCustomTheme" [osiThemeIsolated]="true">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</div>

<!-- Follow global theme (default behavior) -->
<div osiTheme="inherit">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</div>
```

#### Inputs

| Input                 | Type                                                        | Default     | Description                       |
| --------------------- | ----------------------------------------------------------- | ----------- | --------------------------------- |
| `osiTheme`            | `ThemePreset \| string \| OSICardsThemeConfig \| 'inherit'` | `'inherit'` | Theme to apply                    |
| `osiThemeIsolated`    | `boolean`                                                   | `false`     | Isolate from global theme changes |
| `osiThemeTransitions` | `boolean`                                                   | `true`      | Enable theme change transitions   |
| `osiThemeVariables`   | `Record<string, string>`                                    | `undefined` | Additional CSS variables          |

#### Public Methods

```typescript
// Get the element
const element = osiThemeDirective.getElement();

// Get current theme
const theme = osiThemeDirective.getCurrentTheme();

// Manually refresh
osiThemeDirective.refresh();

// Set variables programmatically
osiThemeDirective.setVariables({
  '--custom-color': '#ff0000',
});

// Clear all theme styling
osiThemeDirective.clearTheme();
```

#### Example with Custom Theme

```typescript
@Component({
  template: `
    <div [osiTheme]="customTheme" [osiThemeVariables]="extraVars">
      <osi-cards [card]="card" />
    </div>
  `,
})
export class ThemedCardComponent {
  customTheme: OSICardsThemeConfig = {
    name: 'brand',
    colorScheme: 'light',
    variables: {
      '--osi-card-accent': '#6366f1',
      '--osi-card-background': '#fafafa',
    },
  };

  extraVars = {
    '--card-border-radius': '16px',
  };
}
```

---

### OsiThemeContainerDirective

Creates an isolated theme container with proper CSS containment for fully isolated theme contexts.

**Selector:** `[osiThemeContainer]`

**Location:** `projects/osi-cards-lib/src/lib/directives/scoped-theme.directive.ts`

#### Usage

```html
<div osiThemeContainer="dark">
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</div>
```

This directive automatically applies:

- `container-type: inline-size`
- `contain: layout style`
- The `osi-theme-container` CSS class

---

## Utilities

### Accessibility Utilities

Comprehensive accessibility helpers for WCAG compliance, focus management, keyboard navigation, and screen reader support.

**Location:** `projects/osi-cards-lib/src/lib/utils/accessibility.util.ts`

#### Focus Management

```typescript
import { getFocusableElements, trapFocus, moveFocus, createRovingTabindex } from 'osi-cards-lib';

// Get all focusable elements in a container
const focusable = getFocusableElements(containerElement);

// Trap focus within a modal
const releaseFocus = trapFocus(modalElement, {
  initialFocus: '#first-input', // Selector or element
  returnFocus: previousElement, // Where to return on release
  allowEscape: true, // Release on Escape key
});

// Later: release the focus trap
releaseFocus();

// Move focus to an element
moveFocus(element, {
  preventScroll: true,
  select: true, // For inputs
});

// Create roving tabindex for navigation
const roving = createRovingTabindex(container, '.menu-item');
// roving.setActive(index) - Set active item
// roving.handleKeydown(event) - Handle key events
// roving.destroy() - Clean up
```

#### Screen Reader Support

```typescript
import { announceToScreenReader, createLiveRegion } from 'osi-cards-lib';

// Announce a message
announceToScreenReader('Card loaded successfully', {
  priority: 'polite', // or 'assertive'
  clearAfter: 1000, // ms
});

// Create a persistent live region
const region = createLiveRegion('status-updates', 'polite');
region.announce('Processing...');
region.announce('Complete!');
region.destroy();
```

#### Color Contrast

```typescript
import {
  getContrastRatio,
  meetsContrastRequirement,
  getWCAGLevel,
  WCAG_CONTRAST,
} from 'osi-cards-lib';

// Calculate contrast ratio (1-21)
const ratio = getContrastRatio('#ffffff', '#000000'); // 21

// Check WCAG compliance
meetsContrastRequirement('#333', '#fff', 'AA_NORMAL'); // true
meetsContrastRequirement('#666', '#fff', 'AAA_NORMAL'); // false

// Get WCAG level
const level = getWCAGLevel('#333', '#fff'); // 'AA' | 'AAA' | 'Fail'

// WCAG requirements
WCAG_CONTRAST.AA_NORMAL; // 4.5
WCAG_CONTRAST.AA_LARGE; // 3
WCAG_CONTRAST.AAA_NORMAL; // 7
WCAG_CONTRAST.AAA_LARGE; // 4.5
```

#### ARIA Helpers

```typescript
import { setAriaAttributes, generateAriaId, linkAriaElements } from 'osi-cards-lib';

// Set ARIA attributes
setAriaAttributes(element, {
  label: 'Main navigation',
  expanded: false,
  hidden: null, // Removes attribute
});

// Generate unique ID
const id = generateAriaId('dialog'); // 'osi-1699999999999-abc1234'

// Link elements
linkAriaElements(trigger, panel, 'controls');
// Sets aria-controls on trigger pointing to panel
```

#### Keyboard Shortcuts

```typescript
import { registerShortcuts } from 'osi-cards-lib';

const unregister = registerShortcuts(
  {
    'Ctrl+S': (e) => save(),
    'Ctrl+Shift+P': (e) => openCommandPalette(),
    Escape: (e) => close(),
  },
  {
    scope: document, // Or a specific element
    preventDefault: true,
  }
);

// Later: unregister all shortcuts
unregister();
```

#### Motion Preferences

```typescript
import { prefersReducedMotion, watchReducedMotion } from 'osi-cards-lib';

// Check once
if (prefersReducedMotion()) {
  // Use static fallback
}

// Watch for changes
const unwatch = watchReducedMotion((prefersReduced) => {
  if (prefersReduced) {
    disableAnimations();
  } else {
    enableAnimations();
  }
});

// Later: stop watching
unwatch();
```

#### Skip Links

```typescript
import { createSkipLink } from 'osi-cards-lib';

// Create a skip link for keyboard navigation
const skipLink = createSkipLink('main-content', 'Skip to main content');
document.body.prepend(skipLink);
```

---

### Input Validation Utilities

Comprehensive input validation and sanitization for security, protecting against XSS, injection attacks, and malformed data.

**Location:** `projects/osi-cards-lib/src/lib/utils/input-validation.util.ts`

#### URL Validation

```typescript
import { validateUrl, isSafeUrl } from 'osi-cards-lib';

// Validate and sanitize URL
const result = validateUrl('https://example.com/path?query=value');
if (result.valid) {
  console.log('Safe URL:', result.sanitized);
} else {
  console.error('Invalid:', result.error);
}

// Quick check
if (isSafeUrl(userInput)) {
  window.open(userInput);
}

// With options
const result = validateUrl(url, {
  allowedProtocols: ['https:', 'mailto:'],
  allowRelative: true,
  allowDataUrls: false,
  maxLength: 2048,
});
```

#### Email Validation

```typescript
import { validateEmail, validateEmailConfig } from 'osi-cards-lib';

// Simple validation
if (validateEmail('user@example.com')) {
  // Valid email
}

// Validate email configuration
const result = validateEmailConfig({
  contact: { name: 'John', email: 'john@example.com' },
  cc: ['team@example.com'],
  subject: 'Hello',
  body: 'Message content',
});
```

#### HTML Sanitization

```typescript
import { sanitizeHtml, escapeHtml } from 'osi-cards-lib';

// Sanitize HTML (removes dangerous elements)
const safeHtml = sanitizeHtml('<script>alert("xss")</script><p>Hello</p>');
// Returns: '<p>Hello</p>'

// With options
const cleaned = sanitizeHtml(userContent, {
  allowedTags: ['p', 'br', 'b', 'i', 'a'],
  allowedAttributes: {
    a: ['href', 'title'],
    '*': ['class'],
  },
  allowLinks: true,
  stripHtml: false, // Set true to return plain text
});

// Escape HTML for display
const escaped = escapeHtml('<script>');
// Returns: '&lt;script&gt;'
```

#### Text Sanitization

```typescript
import { sanitizeText, sanitizeTitle } from 'osi-cards-lib';

// Sanitize general text
const cleanText = sanitizeText(userInput, 10000); // max length

// Sanitize title (shorter, escaped)
const cleanTitle = sanitizeTitle(rawTitle);
```

#### Card Configuration Validation

```typescript
import { validateCardConfig } from 'osi-cards-lib';

const result = validateCardConfig(untrustedConfig);
if (result.valid) {
  // Use result.sanitized safely
  renderCard(result.sanitized);
} else {
  console.error('Invalid config:', result.error);
}
```

#### CSP Compliance

```typescript
import { isCspCompliantElement, applyCspCompliantStyles } from 'osi-cards-lib';

// Check if element has no inline styles
if (!isCspCompliantElement(element)) {
  console.warn('Element has inline styles');
}

// Apply styles via CSS custom properties (CSP-safe)
applyCspCompliantStyles(element, {
  '--card-width': '300px',
  '--card-color': '#333',
});
```

---

### Performance Utilities

Collection of performance optimization utilities including debouncing, throttling, memoization, and lazy evaluation.

**Location:** `projects/osi-cards-lib/src/lib/utils/performance.util.ts`

#### Debounce

```typescript
import { debounce } from 'osi-cards-lib';

// Basic debounce
const handleResize = debounce(() => {
  recalculateLayout();
}, 150);

window.addEventListener('resize', handleResize);

// With options
const search = debounce(performSearch, 300, {
  leading: false, // Don't call on first invocation
  trailing: true, // Call on trailing edge
  maxWait: 1000, // Max time to wait
});

// Control methods
search.cancel(); // Cancel pending execution
search.flush(); // Execute immediately
search.pending(); // Check if pending
```

#### Throttle

```typescript
import { throttle } from 'osi-cards-lib';

// Limit to ~60fps
const handleScroll = throttle(() => {
  updateScrollPosition();
}, 16);

container.addEventListener('scroll', handleScroll, { passive: true });
```

#### RequestAnimationFrame Utilities

```typescript
import { raf, createFrameBatcher } from 'osi-cards-lib';

// RAF wrapper (only one frame scheduled at a time)
const updateLayout = raf(() => {
  element.style.transform = `translateY(${position}px)`;
});

updateLayout(); // Safe to call multiple times
updateLayout();
updateLayout(); // Only one frame scheduled

updateLayout.cancel(); // Cancel pending frame
updateLayout.pending(); // Check if pending

// Batch DOM reads/writes
const batch = createFrameBatcher();

batch.read(() => {
  const height = element.offsetHeight;
  batch.write(() => {
    element.style.height = `${height * 2}px`;
  });
});

batch.flush(); // Execute immediately if needed
```

#### Memoization

```typescript
import { memoize } from 'osi-cards-lib';

// Basic memoization
const expensiveCalc = memoize((a: number, b: number) => {
  console.log('Computing...');
  return a * b;
});

expensiveCalc(2, 3); // Computing... => 6
expensiveCalc(2, 3); // => 6 (cached)

// With options
const cachedFetch = memoize(fetchUserData, {
  maxSize: 100, // Max cache entries
  ttl: 60000, // Cache TTL in ms
  keyFn: (id) => `user-${id}`, // Custom cache key
});

// Cache control
cachedFetch.clear(); // Clear cache
cachedFetch.size(); // Get cache size
cachedFetch.has('user-123'); // Check if cached
```

#### Lazy Evaluation

```typescript
import { lazy } from 'osi-cards-lib';

const expensiveValue = lazy(() => {
  return computeExpensiveValue();
});

// Value computed on first access
const value1 = expensiveValue.get();

// Returns cached value
const value2 = expensiveValue.get();

// Reset to recompute
expensiveValue.reset();

// Check if computed
expensiveValue.isComputed();
```

#### Idle Callbacks

```typescript
import { whenIdle, createIdleQueue } from 'osi-cards-lib';

// Schedule during idle time
const cancel = whenIdle(
  () => {
    prefetchData();
  },
  { timeout: 1000 }
);

cancel(); // Cancel if needed

// Create idle queue
const queue = createIdleQueue<() => void>();

queue.add(() => console.log('Task 1'));
queue.add(() => console.log('Task 2'));
queue.add(() => console.log('Task 3'));

queue.start((task) => task()); // Process during idle time
queue.stop(); // Stop processing
queue.clear(); // Clear queue
queue.size(); // Get queue size
```

#### Performance Monitoring

```typescript
import { measureTime, createMarker } from 'osi-cards-lib';

// Measure execution time
const { result, duration } = measureTime(() => {
  return expensiveOperation();
});
console.log(`Took ${duration}ms`);

// Create performance marker
const marker = createMarker('card-render');

marker.start();
// ... rendering ...
marker.end();

const duration = marker.measure();
console.log(`Render took ${duration}ms`);
```

#### Object Pooling

```typescript
import { createObjectPool } from 'osi-cards-lib';

// Reduce GC pressure with object pooling
const pool = createObjectPool({
  create: () => ({ x: 0, y: 0, z: 0 }),
  reset: (obj) => {
    obj.x = 0;
    obj.y = 0;
    obj.z = 0;
  },
  maxSize: 100,
});

// Get object from pool (or create new)
const obj = pool.acquire();
obj.x = 10;

// Return to pool
pool.release(obj);

pool.clear(); // Clear pool
pool.size(); // Get pool size
```

---

### Retry Utilities

Configurable retry mechanisms for async operations with exponential backoff and circuit breaker pattern.

**Location:** `projects/osi-cards-lib/src/lib/utils/retry.util.ts`

#### Promise-based Retry

```typescript
import { retryWithBackoff, RetryConfig } from 'osi-cards-lib';

const config: Partial<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  useJitter: true,
  isRetryable: (error) => isNetworkError(error),
};

try {
  const result = await retryWithBackoff(
    () => fetchData(),
    config,
    (state) => {
      console.log(`Retry ${state.attempt}, waiting ${state.nextDelayMs}ms`);
    }
  );
} catch (error) {
  console.error('All retries exhausted:', error);
}
```

#### Observable-based Retry

```typescript
import { retryWithBackoff$ } from 'osi-cards-lib';

http
  .get('/api/data')
  .pipe(
    retryWithBackoff$(
      {
        maxRetries: 3,
        initialDelayMs: 1000,
      },
      (state) => {
        console.log(`Retry ${state.attempt}:`, state.lastError);
      }
    )
  )
  .subscribe({
    next: (data) => console.log(data),
    error: (err) => console.error('Failed after retries:', err),
  });
```

#### RetryConfig Interface

```typescript
interface RetryConfig {
  maxRetries: number; // Max retry attempts
  initialDelayMs: number; // Initial delay before first retry
  maxDelayMs: number; // Maximum delay between retries
  backoffMultiplier: number; // Exponential backoff multiplier
  useJitter: boolean; // Add random jitter to delay
  isRetryable?: (error: unknown) => boolean; // Custom retry predicate
}
```

#### RetryState Interface

```typescript
interface RetryState {
  attempt: number; // Current attempt (1-based)
  elapsedMs: number; // Total elapsed time
  lastError?: Error; // Last error encountered
  nextDelayMs: number; // Delay before next retry
  exhausted: boolean; // Whether max retries reached
}
```

#### Circuit Breaker

```typescript
import { CircuitBreaker, CircuitOpenError } from 'osi-cards-lib';

const breaker = new CircuitBreaker({
  failureThreshold: 5, // Open after 5 failures
  resetTimeoutMs: 30000, // Try half-open after 30s
  successThreshold: 2, // Close after 2 successes
});

try {
  const result = await breaker.execute(() => fetchData());
} catch (error) {
  if (error instanceof CircuitOpenError) {
    console.log('Circuit is open, skipping request');
  } else {
    console.error('Request failed:', error);
  }
}

// Check state
breaker.getState(); // 'closed' | 'open' | 'half-open'

// Reset breaker
breaker.reset();
```

#### Helper Functions

```typescript
import { isNetworkError, isRetryableHttpError } from 'osi-cards-lib';

// Check if error is network-related
isNetworkError(error); // true for network/timeout/connection errors

// Check if HTTP error is retryable
isRetryableHttpError(error); // true for 408, 429, 5xx errors
```

---

## Importing Utilities

All directives and utilities are exported from the main library entry point:

```typescript
import {
  // Directives
  CopyToClipboardDirective,
  TooltipDirective,
  OsiThemeDirective,
  OsiThemeContainerDirective,

  // Accessibility
  trapFocus,
  announceToScreenReader,
  getContrastRatio,

  // Validation
  validateUrl,
  sanitizeHtml,
  validateCardConfig,

  // Performance
  debounce,
  throttle,
  memoize,

  // Retry
  retryWithBackoff,
  CircuitBreaker,
} from 'osi-cards-lib';
```

---

## See Also

- [API.md](./API.md) - Complete API reference
- [BEST_PRACTICES.md](./BEST_PRACTICES.md) - Best practices including performance and accessibility
- [SERVICES.md](./SERVICES.md) - Service documentation
- [PRESETS.md](./PRESETS.md) - Preset and theming documentation

