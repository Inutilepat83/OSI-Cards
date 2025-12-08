# Masonry Grid System - Complete Explanation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Component Structure](#component-structure)
4. [Layout Algorithm](#layout-algorithm)
5. [Lifecycle & State Management](#lifecycle--state-management)
6. [Data Flow](#data-flow)
7. [Key Features](#key-features)
8. [Performance Optimizations](#performance-optimizations)
9. [Integration Points](#integration-points)
10. [Configuration](#configuration)

---

## System Overview

The **Masonry Grid Component** is a sophisticated Angular component that implements a responsive, two-pass masonry layout algorithm. It dynamically positions card sections in a grid layout that adapts to container width, section sizes, and content changes.

### Core Purpose
- Display multiple `CardSection` objects in a responsive grid
- Automatically calculate optimal positions based on actual content heights
- Support multi-column spans (sections can span 1, 2, or full width)
- Handle dynamic content loading and resizing
- Provide smooth animations and transitions

---

## Architecture

### Component Hierarchy
```
MasonryGridComponent
├── Container (div.masonry-container)
│   └── Items (div.masonry-item) [positioned absolutely]
│       └── SectionRendererComponent
│           └── Dynamic Section Components (based on section.type)
```

### Key Design Principles

1. **Two-Pass Layout Algorithm**
   - **Pass 1**: Render sections temporarily to measure actual heights
   - **Pass 2**: Calculate optimal positions using measured heights

2. **Absolute Positioning**
   - All items use `position: absolute` with calculated `left` and `top` values
   - Container uses `position: relative` as positioning context

3. **CSS Calc Expressions**
   - Width and left positions use CSS `calc()` for responsive calculations
   - Accounts for gaps, padding, and column spans

4. **Change Detection Strategy**
   - Uses `OnPush` for performance
   - Manually triggers change detection when needed

---

## Component Structure

### Inputs

```typescript
@Input() sections: CardSection[] = []           // Sections to display
@Input() gap = 16                               // Gap between items (px)
@Input() minColumnWidth = 260                   // Minimum column width (px)
@Input() maxColumns = 4                         // Maximum columns allowed
@Input() containerWidth?: number                 // Explicit container width (optional)
@Input() isStreaming = false                    // Streaming mode (disables transitions)
@Input() debug = false                          // Enable debug logging
```

### Outputs

```typescript
@Output() sectionEvent                           // Events from section components
@Output() layoutChange                           // Layout configuration changes
@Output() layoutCompleted                        // Layout calculation completed
@Output() layoutLog                              // Compatibility shim (not used)
```

### View References

```typescript
@ViewChild('container') containerRef             // Container element reference
@ViewChildren('itemRef') itemRefs               // All item element references
```

### Core Data Structures

#### PositionedSection
```typescript
interface PositionedSection {
  section: CardSection;      // Original section data
  key: string;              // Unique identifier
  colSpan: number;          // Columns this section spans (1, 2, or columns)
  left: string;             // CSS left position (calc expression)
  top: number;              // Top position in pixels
  width: string;            // CSS width (calc expression)
}
```

#### MasonryLayoutInfo
```typescript
interface MasonryLayoutInfo {
  breakpoint: Breakpoint;    // Current breakpoint (xs, sm, md, lg, xl)
  columns: number;           // Current column count
  containerWidth: number;    // Container width in pixels
}
```

---

## Layout Algorithm

### Overview: Two-Pass System

The layout algorithm uses a **two-pass approach** to ensure accurate positioning:

1. **Measurement Pass**: Render sections temporarily to measure actual DOM heights
2. **Layout Pass**: Calculate optimal positions using measured heights

### Step-by-Step Process

#### Phase 1: Initialization (`ngAfterViewInit`)

1. **Setup Observers**
   - Container `ResizeObserver` (watches container width changes)
   - Item `ResizeObserver` (watches individual item height changes - disabled by default)

2. **Initial Layout**
   - Wait for `requestAnimationFrame` to ensure DOM is ready
   - Check container width
   - Schedule first layout or create fallback

#### Phase 2: Layout Calculation (`calculateLayout`)

**Entry Point**: `calculateLayout()`

```typescript
calculateLayout() {
  // Guard: Prevent concurrent layouts
  if (isLayingOut) return;

  // Get container width
  const containerWidth = getContainerWidth();

  // Calculate column count based on width
  const columns = calculateColumns(containerWidth);

  // Check if we have measured heights
  if (!hasMeasuredHeights) {
    // FIRST PASS: Measure sections
    renderSectionsForMeasurement(columns, containerWidth);
  } else {
    // SECOND PASS: Layout with actual heights
    layoutWithActualHeights(columns, containerWidth);
  }
}
```

#### Phase 3: Measurement Pass (`renderSectionsForMeasurement`)

**Purpose**: Render sections temporarily to measure their actual heights

1. **Create Temporary Positions**
   ```typescript
   // Stack sections vertically with temporary positions
   top: index * 300  // Temporary spacing
   left: '0px'        // All at left edge
   ```

2. **Render to DOM**
   - Assign `positionedSections` array (triggers Angular change detection)
   - Force `detectChanges()` to render items
   - Set `isLayoutReady = false` (sections visible but not positioned)

3. **Wait for Rendering**
   - Use `requestAnimationFrame` + `setTimeout(100ms)` to allow content to render
   - Check for unloaded images

4. **Proceed to Layout Pass**
   - Call `layoutWithActualHeights()` after measurement delay

#### Phase 4: Layout Pass (`layoutWithActualHeights`)

**Purpose**: Calculate optimal positions using measured heights

**Algorithm**: Column-based First Fit Decreasing Height (FFDH)

1. **Measure Heights**
   ```typescript
   // Single pass: Read all heights from DOM
   actualHeights = new Map<string, number>();
   for each positioned section:
     height = element.offsetHeight
     actualHeights.set(key, Math.max(height, 50))  // Min 50px
   ```

2. **Calculate Column Spans**
   ```typescript
   // Determine how many columns each section should span
   for each section:
     colSpan = decideSpanForSection(section, columns)
     // Priority: preferredSpan > preferredColumns > colSpan > default(1)
   ```

3. **Place Sections (FFDH Algorithm)**
   ```typescript
   colHeights = [0, 0, 0, ...]  // Track height of each column

   for each section (in order):
     colSpan = sectionSpans.get(key)
     height = actualHeights.get(key)

     // Find best column position
     bestColumn = 0
     bestSpanHeight = Infinity

     // Try all valid starting columns
     for col = 0 to (columns - colSpan):
       // Calculate height of span (max of columns in span)
       spanHeight = Math.max(...colHeights.slice(col, col + colSpan))

       // Choose column with minimum span height
       if spanHeight < bestSpanHeight:
         bestColumn = col
         bestSpanHeight = spanHeight

     // Position section
     top = bestSpanHeight
     left = generateLeft(columns, bestColumn)
     width = generateWidth(columns, colSpan)

     // Update column heights
     for c = bestColumn to (bestColumn + colSpan):
       colHeights[c] = top + height + gap
   ```

4. **Calculate Container Height**
   ```typescript
   containerHeight = Math.max(...colHeights) + gap * 2
   ```

5. **Apply Format Adaptation** (optional)
   ```typescript
   // Switch sections to compact mode if too tall
   if height > 900 && section.canCompact:
     section.compactMode = true
   ```

6. **Update DOM**
   - Assign new `positionedSections` array
   - Set `isLayoutReady = true`
   - Apply CSS variables
   - Trigger change detection

### Column Span Decision Logic

The `decideSpanForSection()` method determines how many columns a section spans:

**Priority Order:**
1. `section.preferredSpan` (1-3) - Direct preference
2. `section.preferredColumns` (1-4) - Mapped to span (clamped to 3)
3. `section.colSpan` - Legacy support (clamped to valid range)
4. Default: 1 column

**Valid Spans:**
- 1 column (always valid)
- 2 columns (if columns >= 2)
- `columns` (full width, if columns >= 2)

### Column Count Calculation

```typescript
calculateColumns(containerWidth: number): number {
  let cols = 1;
  if (containerWidth >= 640) cols = 2;
  if (containerWidth >= 1024) cols = 3;
  return Math.min(cols, maxColumns);  // Clamp to maxColumns
}
```

**Breakpoints:**
- `< 640px`: 1 column
- `640-1023px`: 2 columns
- `≥ 1024px`: 3 columns (or maxColumns if set higher)

---

## Lifecycle & State Management

### Component Lifecycle

#### 1. **ngAfterViewInit** (Initialization)
- Setup ResizeObservers
- Schedule first layout
- Handle edge cases (zero width, no sections)

#### 2. **ngOnChanges** (Input Changes)
- **Sections Change**: Schedule layout (with fallback if needed)
- **ContainerWidth Change**: Schedule layout if valid
- **Guard**: Skip if already laying out (prevents loops)

#### 3. **ngOnDestroy** (Cleanup)
- Disconnect observers
- Clear timeouts
- Flush logs
- Clear image load timers

### State Variables

#### Layout State
```typescript
isLayingOut: boolean              // Prevents concurrent layouts
isLayoutReady: boolean            // Layout calculation complete
hasDoneFirstLayout: boolean       // First layout completed (enables animations)
layoutVersion: number             // Increments on each layout (for tracking)
```

#### Throttling State
```typescript
layoutCount: number                // Layout requests in current window
layoutWindowStart: number         // Start of throttling window
delayedLayoutScheduled: boolean    // Delayed layout for slow content
```

#### Feature Flags
```typescript
itemResizeEnabled: boolean         // Enable item resize observer (default: false)
formatsAdjustedForWidth: boolean  // Format adaptation completed
```

### State Transitions

```
[Initial]
  → ngAfterViewInit
  → scheduleLayout
  → calculateLayout
  → [Measuring] (isLayoutReady = false)
  → layoutWithActualHeights
  → [Ready] (isLayoutReady = true)

[Ready]
  → Input Change / Resize
  → scheduleLayout (debounced)
  → calculateLayout
  → [Measuring]
  → [Ready]
```

---

## Data Flow

### Input Flow

```
Parent Component
  ↓ (sections input)
MasonryGridComponent
  ↓ (ngOnChanges)
  ↓ (scheduleLayout - debounced)
  ↓ (calculateLayout)
  ↓ (renderSectionsForMeasurement OR layoutWithActualHeights)
  ↓ (positionedSections array)
Template (ngFor)
  ↓ (renders items)
DOM (absolute positioning)
```

### Output Flow

```
SectionRendererComponent
  ↓ (sectionEvent)
MasonryGridComponent
  ↓ (onSectionEvent)
  ↓ (sectionEvent.emit)
Parent Component
```

### Layout Event Flow

```
calculateLayout()
  ↓ (layoutWithActualHeights)
  ↓ (emitLayoutInfo)
  ↓ (layoutChange.emit)
  ↓ (layoutCompleted.emit)
Parent Component
```

### Measurement Flow

```
renderSectionsForMeasurement()
  ↓ (create temp positions)
  ↓ (positionedSections = temp)
  ↓ (cdr.detectChanges())
  ↓ (DOM renders)
  ↓ (requestAnimationFrame + setTimeout)
  ↓ (layoutWithActualHeights)
  ↓ (read offsetHeight)
  ↓ (calculate positions)
  ↓ (positionedSections = final)
  ↓ (cdr.detectChanges())
  ↓ (DOM updates)
```

---

## Key Features

### 1. Responsive Breakpoints

Automatically adjusts column count based on container width:
- **Mobile** (< 640px): 1 column
- **Tablet** (640-1023px): 2 columns
- **Desktop** (≥ 1024px): 3+ columns (up to maxColumns)

### 2. Multi-Column Spans

Sections can span multiple columns:
- **1 column**: Default, compact sections
- **2 columns**: Medium sections (most common)
- **Full width**: Wide sections (hero, header)

### 3. Fallback Layout

If container width is unavailable:
- Creates estimated layout using `estimateHeight()` hints
- Ensures sections are visible immediately
- Refines layout once measurements are available

### 4. Dynamic Content Handling

**Image Loading:**
- Detects unloaded images
- Schedules delayed layout (500ms) for slow-loading content
- Uses minimum height estimates during loading

**Content Changes:**
- Item resize observer (disabled by default) watches for height changes
- Throttled to prevent excessive layouts
- Only triggers on significant changes (>24px)

### 5. Format Adaptation

Automatically switches sections to compact mode:
- **Trigger**: Height > 900px
- **Condition**: `section.canCompact === true`
- **One-way**: Once compact, stays compact (locked)

### 6. Smooth Animations

**First Layout:**
- No transitions (snap into place)
- Prevents visual overlap during initial render

**Subsequent Layouts:**
- Smooth transitions (300ms ease-out)
- Transitions: `left`, `top`, `width`, `opacity`
- Staggered fade-in for initial load

**Streaming Mode:**
- Disables position transitions
- Only opacity transitions (0.3s)
- Prevents jarring movements during data streaming

### 7. Performance Optimizations

**Throttling & Debouncing:**
- Layout scheduling: 300ms debounce
- Resize events: 100ms throttle
- Item resize: 200ms throttle
- Excessive layout guard: Max 3 layouts per 500ms

**CSS Optimizations:**
- `contain: layout style paint` on items
- CSS variables for dynamic values
- No `will-change` (using top/left, not transform)

**Change Detection:**
- OnPush strategy
- Manual `detectChanges()` only when needed
- New array references to trigger updates

### 8. Accessibility

- ARIA roles: `role="grid"` and `role="gridcell"`
- ARIA labels: Dynamic labels with section counts and titles
- Semantic HTML structure

### 9. Logging System

**Structured Logging:**
- Buffers logs (up to 10 entries)
- Flushes on errors, buffer full, or 5-second timeout
- Dual output: LoggerService (localStorage) + optional server

**Debug Mode:**
- Detailed per-section logging
- Layout metrics
- Height measurements
- Position calculations

---

## Performance Optimizations

### 1. Layout Scheduling

**Debouncing:**
- All layout requests go through `scheduleLayout()`
- 300ms debounce prevents excessive calculations
- Cancels pending layouts before scheduling new ones

**Throttling:**
- Container resize: 100ms throttle, 10px threshold
- Item resize: 200ms throttle, 24px threshold
- Layout requests: Max 3 per 500ms window

### 2. Measurement Optimization

**Single-Pass Measurement:**
- Reads all heights in one loop
- Uses `offsetHeight` (faster than `getBoundingClientRect`)
- Caches measurements in Map

**Minimal Re-renders:**
- Only re-measures when sections change
- Reuses measurements when possible
- Fallback layout avoids measurement delay

### 3. DOM Updates

**Batch Updates:**
- Creates new array reference (triggers change detection once)
- Applies all CSS variables in single operation
- Format adaptation before change detection

**CSS Containment:**
- `contain: layout style paint` isolates item rendering
- Prevents layout thrashing

### 4. Memory Management

**Cleanup:**
- Disconnects observers on destroy
- Clears all timeouts
- Clears image load timers
- Flushes log buffer

---

## Integration Points

### 1. CardSection Model

The component expects `CardSection[]` with properties:
- `id`: Unique identifier
- `type`: Section type (determines rendering)
- `title`: Section title
- `preferredSpan`: Preferred column span (1-3)
- `preferredColumns`: Preferred columns (1-4)
- `colSpan`: Legacy column span
- `estimatedHeight`: Height hint ('short' | 'medium' | 'tall')
- `canCompact`: Whether section can use compact mode
- `compactMode`: Current compact mode state

### 2. SectionRendererComponent

Renders individual sections based on `section.type`:
- Dynamically loads appropriate section component
- Emits `SectionRenderEvent` for interactions
- Handles section-specific rendering logic

### 3. Grid Config Utilities

Uses `grid-config.util.ts` for:
- `generateLeftExpression()`: CSS calc for left position
- `generateWidthExpression()`: CSS calc for width
- Column span resolution
- Breakpoint calculations

### 4. LoggerService

Centralized logging:
- Stores logs in localStorage
- Provides structured logging API
- Handles log levels (error, warn, info, debug)

---

## Configuration

### Default Values

```typescript
gap = 16                    // 16px gap between items
minColumnWidth = 260        // Minimum 260px per column
maxColumns = 4              // Up to 4 columns
isStreaming = false         // Normal mode (animations enabled)
debug = false              // Debug logging disabled
```

### Customization

**Responsive Behavior:**
- Adjust `minColumnWidth` to change breakpoints
- Set `maxColumns` to limit maximum columns
- Modify `calculateColumns()` for custom breakpoints

**Spacing:**
- Set `gap` input for different spacing
- CSS variables: `--masonry-gap`, `--masonry-column-width`

**Performance:**
- Enable `itemResizeEnabled` for dynamic content (performance cost)
- Adjust debounce/throttle timings in code
- Disable logging by setting `ENABLE_LOGGING = false`

**Animations:**
- Set `isStreaming = true` to disable position transitions
- Modify CSS transition durations
- Respect `prefers-reduced-motion` (already implemented)

---

## Algorithm Details

### FFDH (First Fit Decreasing Height) Variant

The layout uses a column-based FFDH algorithm:

1. **Track Column Heights**: Array of current height for each column
2. **For Each Section**:
   - Determine column span (1, 2, or full width)
   - Find all valid starting columns
   - For each valid position, calculate span height (max of columns in span)
   - Choose position with minimum span height
   - Place section at that position
   - Update all columns in the span

3. **Optimization**: For ties, prefer rightmost column (better visual balance)

### Time Complexity

- **Measurement**: O(n) where n = number of sections
- **Layout Calculation**: O(n × c) where c = number of columns
- **Overall**: O(n × c) - efficient for typical use cases

### Space Complexity

- **Column Heights**: O(c)
- **Height Map**: O(n)
- **Positioned Sections**: O(n)
- **Overall**: O(n + c) - linear space complexity

---

## Edge Cases & Error Handling

### 1. Zero Container Width

- **Detection**: `getContainerWidth() <= 0`
- **Handling**: Creates fallback layout with estimated width
- **Recovery**: Retries after 500ms delay

### 2. No Sections

- **Detection**: `sections.length === 0`
- **Handling**: Sets empty `positionedSections`, height = 0
- **Output**: Emits layout completed with height 0

### 3. Missing DOM Elements

- **Detection**: `itemRefs.length === 0` during measurement
- **Handling**: Schedules layout retry
- **Fallback**: Uses estimated heights

### 4. Slow Content Loading

- **Detection**: Unloaded images, height < 100px
- **Handling**: Schedules delayed layout (500ms)
- **Prevention**: One-time delayed layout flag

### 5. Layout Timeout

- **Detection**: Layout not ready after 2 seconds
- **Handling**: Forces `isLayoutReady = true`
- **Result**: Sections visible even if not optimally positioned

### 6. Excessive Layout Requests

- **Detection**: More than 3 layouts in 500ms window
- **Handling**: Ignores additional requests, logs warning
- **Recovery**: Window resets after 500ms

---

## CSS Architecture

### Container Styles

```css
.masonry-container {
  position: relative;        /* Positioning context */
  width: 100%;
  min-height: 200px;
  opacity: 0;               /* Hidden until ready */
  padding: 16px;
  overflow: hidden;
}

.masonry-container--ready {
  opacity: 1;                /* Fade in when ready */
}
```

### Item Styles

```css
.masonry-item {
  position: absolute;         /* Absolute positioning */
  box-sizing: border-box;
  overflow: hidden;
  contain: layout style paint; /* Performance optimization */
}

/* Transitions only after first layout */
.masonry-container--animated .masonry-item {
  transition: left 0.3s ease-out,
              top 0.3s ease-out,
              width 0.3s ease-out;
}
```

### CSS Variables

```css
--masonry-columns: 3;              /* Current column count */
--masonry-gap: 16px;                /* Gap between items */
--masonry-column-width: 320px;      /* Calculated column width */
```

---

## Summary

The Masonry Grid System is a sophisticated, production-ready component that:

✅ **Accurately measures** content heights before positioning
✅ **Optimally places** sections using FFDH algorithm
✅ **Responds dynamically** to container and content changes
✅ **Performs efficiently** with throttling, debouncing, and CSS optimizations
✅ **Handles edge cases** gracefully with fallbacks and timeouts
✅ **Provides smooth UX** with animations and streaming support
✅ **Maintains accessibility** with ARIA labels and semantic HTML
✅ **Offers debugging** capabilities with structured logging

The two-pass measurement system ensures accurate layouts while the column-based FFDH algorithm provides optimal space utilization. Performance optimizations prevent layout thrashing, and comprehensive error handling ensures reliability.
