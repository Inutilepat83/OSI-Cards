# 40 Points for Section Placement System

## Overview

This document defines 40 critical points that must be implemented for proper section placement in the masonry grid system. Each point addresses a specific aspect of layout calculation, performance, state management, or quality assurance.

---

## Points 1-10: Core Layout Algorithm

### Point 1: Pure Function - No Side Effects in Layout Calculation
**Description**: The layout calculation function must be a pure function that never calls `scheduleLayout` from within itself, preventing infinite loops and recursive scheduling.

**Implementation Requirements**:
- Layout calculation methods must not trigger new layout schedules
- Use `scheduleLayout()` only from external triggers (resize, changes, etc.)
- Return early if already laying out

**Code Example**:
```typescript
private calculateLayout(): void {
  // Point 1: Never calls scheduleLayout from inside
  if (this.isLayingOut) return;
  // ... layout logic
}
```

**Testing Criteria**: Verify no recursive `scheduleLayout` calls occur during layout calculation.

---

### Point 2: Simple Breakpoint Calculation
**Description**: Column calculation must be based solely on container width, not content or other factors. Use fixed breakpoints for predictable responsive behavior.

**Implementation Requirements**:
- Breakpoints: <640px → 1 column, 640-1023px → 2 columns, ≥1024px → 3 columns
- Clamp by `maxColumns` input
- No content-aware column calculation

**Code Example**:
```typescript
// Point 2: Simple breakpoint function - columns based only on container width
private calculateColumns(containerWidth: number): number {
  let cols = 1;
  if (containerWidth >= 640) cols = 2;
  if (containerWidth >= 1024) cols = 3;
  return Math.min(cols, this.maxColumns || 3);
}
```

**Testing Criteria**: Verify columns change only on width breakpoints, not content changes.

---

### Point 3: Span Restriction - Valid Range Only
**Description**: Section spans must be restricted to valid values: [1, 2, columns]. Invalid spans cause layout errors.

**Implementation Requirements**:
- Clamp spans to minimum 1, maximum `columns`
- Only allow spans of 1, 2, or full width (columns)
- Reject invalid span values

**Code Example**:
```typescript
// Point 3: Restrict spans to valid range [1, 2, columns]
const colSpan = Math.max(1, Math.min(section.preferredSpan || 1, columns));
```

**Testing Criteria**: Verify all sections have valid spans regardless of input.

---

### Point 4: Span Priority Logic
**Description**: Implement clear priority for span determination: `preferredSpan` > `preferredColumns` > default.

**Implementation Requirements**:
- Check `preferredSpan` first if defined
- Fall back to `preferredColumns` (mapped to span)
- Default to 1 if neither specified
- Map `preferredColumns` (1-4) to spans (1-3)

**Code Example**:
```typescript
// Point 4: Priority: preferredSpan > preferredColumns > default
if (section.preferredSpan !== undefined) {
  return Math.min(section.preferredSpan, columns);
}
if (section.preferredColumns !== undefined) {
  return Math.min(section.preferredColumns, columns);
}
return 1;
```

**Testing Criteria**: Verify priority order is respected in all scenarios.

---

### Point 5: Single Loop for Column Selection
**Description**: Use a single loop over all valid starting column positions when selecting placement. Avoid nested loops or multiple passes.

**Implementation Requirements**:
- Iterate once: `for (let col = 0; col <= columns - colSpan; col++)`
- Calculate all candidate positions in one pass
- Choose best position after single iteration

**Code Example**:
```typescript
// Point 5: Single loop over valid starting columns
let bestColumn = 0;
let bestSpanHeight = Infinity;
for (let col = 0; col <= columns - colSpan; col++) {
  const spanHeight = Math.max(...colHeights.slice(col, col + colSpan));
  if (spanHeight < bestSpanHeight) {
    bestSpanHeight = spanHeight;
    bestColumn = col;
  }
}
```

**Testing Criteria**: Verify O(n) complexity for column selection, not O(n²).

---

### Point 6: Calculate Span Height as Maximum
**Description**: When a section spans multiple columns, its placement height is the maximum height of all columns in the span.

**Implementation Requirements**:
- For span [col, col+span), find max height: `Math.max(...colHeights.slice(col, col + span))`
- This determines where the section will be placed
- Update all columns in span to same height after placement

**Code Example**:
```typescript
// Point 6: Calculate span height as max of columns in span
const spanHeight = Math.max(...colHeights.slice(col, col + colSpan));
```

**Testing Criteria**: Verify multi-column sections align correctly with column tops.

---

### Point 7: Choose Column with Minimal Span Height
**Description**: Select the column position that results in the lowest placement (minimal span height). For ties, prefer rightmost position.

**Implementation Requirements**:
- Compare span heights for all valid positions
- Choose position with minimum span height
- Tie-breaker: prefer higher column index (rightmost)

**Code Example**:
```typescript
// Point 7: Choose column with minimal span height; for ties, pick highest index
if (spanHeight < bestSpanHeight ||
    (spanHeight === bestSpanHeight && col > bestColumn)) {
  bestSpanHeight = spanHeight;
  bestColumn = col;
}
```

**Testing Criteria**: Verify sections are placed at optimal positions, minimizing gaps.

---

### Point 8: Flat Array for Column Heights
**Description**: Use a simple flat array to track column heights. Avoid complex data structures that add overhead.

**Implementation Requirements**:
- Use `Array(columns).fill(0)` for column heights
- Direct index access: `colHeights[columnIndex]`
- Update in-place: `colHeights[c] = newHeight`

**Code Example**:
```typescript
// Point 8: Flat array for colHeights
const colHeights = new Array(columns).fill(0);
// Update after placement
for (let c = bestColumn; c < bestColumn + colSpan; c++) {
  colHeights[c] = top + height + gap;
}
```

**Testing Criteria**: Verify array operations are O(1) and memory efficient.

---

### Point 9: Simple Container Height Calculation
**Description**: Container height is simply the maximum of all column heights. No complex calculations needed.

**Implementation Requirements**:
- Calculate: `Math.max(...colHeights, 0)`
- Add padding/gap if needed
- No additional overhead

**Code Example**:
```typescript
// Point 9: Compute container height simply
this.containerHeight = Math.max(...colHeights, 0);
```

**Testing Criteria**: Verify container height matches tallest column.

---

### Point 10: Single-Pass Layout Algorithm
**Description**: Complete layout calculation in a single pass over all sections. No multiple iterations or refinement passes in the core algorithm.

**Implementation Requirements**:
- Process each section once
- Calculate position, update column heights, move to next
- No backtracking or re-processing

**Code Example**:
```typescript
// Points 1-10: Pure single-pass layout algorithm
const newPositionedSections = this.sections.map((section, index) => {
  // Calculate position once
  // Update colHeights
  // Return positioned section
});
```

**Testing Criteria**: Verify layout completes in O(n) time for n sections.

---

## Points 11-20: Performance & Optimization

### Point 11: Height Cache Implementation
**Description**: Cache measured section heights to avoid re-measurement on subsequent layouts. Use Map with section keys.

**Implementation Requirements**:
- Cache key: section ID or generated key
- Store: `Map<string, number>`
- Invalidate on section changes
- Check cache before estimating

**Code Example**:
```typescript
// Point 11: Height cache implementation
private cachedHeights = new Map<string, number>();
const cachedHeight = this.cachedHeights.get(key);
if (cachedHeight) {
  return cachedHeight;
}
```

**Testing Criteria**: Verify cache hits reduce measurement operations.

---

### Point 12: Cache Invalidation Strategy
**Description**: Invalidate height cache when sections change, content updates, or container resizes significantly.

**Implementation Requirements**:
- Clear cache on section array reference change
- Invalidate specific keys on section updates
- Clear on major width changes (>100px difference)

**Code Example**:
```typescript
// Point 12: Cache invalidation on changes
if (changes['sections']) {
  this.cachedHeights.clear();
}
```

**Testing Criteria**: Verify cache is cleared when appropriate, maintained when not needed.

---

### Point 13: Debounce Layout Scheduling
**Description**: Debounce layout calculations with 150-300ms timeout to batch rapid changes and reduce computation.

**Implementation Requirements**:
- Use `setTimeout` with 150-300ms delay
- Cancel previous timeout before creating new one
- Batch multiple rapid changes into single layout

**Code Example**:
```typescript
// Point 13: Debounce with 150-300ms timeout
if (this.layoutTimeout) {
  clearTimeout(this.layoutTimeout);
}
this.layoutTimeout = window.setTimeout(() => {
  this.calculateLayout();
}, 300);
```

**Testing Criteria**: Verify rapid changes result in single layout calculation.

---

### Point 14: Cancel Pending Timers
**Description**: Always cancel pending layout timers before creating new ones to prevent multiple concurrent layouts.

**Implementation Requirements**:
- Check for existing timeout before scheduling
- Clear timeout: `clearTimeout(this.layoutTimeout)`
- Set timeout to `undefined` after clearing

**Code Example**:
```typescript
// Point 14: Cancel pending timer before creating new one
if (this.layoutTimeout) {
  clearTimeout(this.layoutTimeout);
  this.layoutTimeout = undefined;
}
```

**Testing Criteria**: Verify no overlapping timeout executions.

---

### Point 15: No Recursive scheduleLayout Calls
**Description**: Helper methods must never call `scheduleLayout()`. Only external triggers (resize, changes) should schedule layouts.

**Implementation Requirements**:
- Layout calculation methods: no `scheduleLayout()` calls
- Helper methods: no `scheduleLayout()` calls
- Only event handlers and lifecycle hooks schedule layouts

**Code Example**:
```typescript
// Point 15: No scheduleLayout calls from helper methods
private getContainerWidth(): number {
  // Helper method - no scheduleLayout() here
  return this.containerRef?.nativeElement?.clientWidth || 0;
}
```

**Testing Criteria**: Verify no recursive scheduling occurs.

---

### Point 16: Early Exit Conditions
**Description**: Exit layout calculation early when conditions are not met (zero width, no sections, etc.) to avoid unnecessary work.

**Implementation Requirements**:
- Check container width > 0
- Check sections array length > 0
- Return early with empty state if conditions fail

**Code Example**:
```typescript
// Point 16: Early exit conditions
if (containerWidth <= 0 || !this.sections || this.sections.length === 0) {
  this.positionedSections = [];
  this.containerHeight = 0;
  return;
}
```

**Testing Criteria**: Verify early exits prevent unnecessary calculations.

---

### Point 17: Hard Guard Against Concurrent Layouts
**Description**: Prevent concurrent layout calculations with a boolean guard flag. Ignore new layout requests if already laying out.

**Implementation Requirements**:
- Set `isLayingOut = true` at start
- Check guard at beginning: `if (this.isLayingOut) return;`
- Reset `isLayingOut = false` in finally block

**Code Example**:
```typescript
// Point 17: Hard guard - ignore if already laying out
if (this.isLayingOut) {
  return;
}
this.isLayingOut = true;
try {
  // layout logic
} finally {
  this.isLayingOut = false;
}
```

**Testing Criteria**: Verify only one layout runs at a time.

---

### Point 18: Memory Management - Cleanup Observers
**Description**: Properly disconnect ResizeObserver and other observers on component destruction to prevent memory leaks.

**Implementation Requirements**:
- Disconnect ResizeObserver in `ngOnDestroy`
- Clear all timers
- Remove event listeners
- Clear Maps and caches if needed

**Code Example**:
```typescript
// Point 18: Memory management - cleanup observers
ngOnDestroy(): void {
  this.resizeObserver?.disconnect();
  this.itemResizeObserver?.disconnect();
  if (this.layoutTimeout) {
    clearTimeout(this.layoutTimeout);
  }
}
```

**Testing Criteria**: Verify no memory leaks in long-running applications.

---

### Point 19: Memory Management - Limit Cache Size
**Description**: Limit height cache size to prevent unbounded memory growth. Implement LRU eviction or size limits.

**Implementation Requirements**:
- Set maximum cache size (e.g., 100 entries)
- Evict oldest entries when limit reached
- Or clear cache periodically

**Code Example**:
```typescript
// Point 19: Limit cache size
private readonly MAX_CACHE_SIZE = 100;
if (this.cachedHeights.size >= this.MAX_CACHE_SIZE) {
  const firstKey = this.cachedHeights.keys().next().value;
  this.cachedHeights.delete(firstKey);
}
```

**Testing Criteria**: Verify cache size stays bounded.

---

### Point 20: Minimal Logging
**Description**: Log only essential events (START and COMPLETE) in production. Detailed logging only in debug mode.

**Implementation Requirements**:
- Log layout start and completion
- Detailed logs only if `debug === true`
- Use appropriate log levels (info, debug, warn, error)

**Code Example**:
```typescript
// Point 20: Minimal logging - only START and complete
if (this.debug) {
  this.log('info', 'calculateLayout START', { ... });
}
// ... layout logic
this.log('info', 'Layout complete', { ... }); // Always log completion
```

**Testing Criteria**: Verify minimal logging in production, detailed in debug mode.

---

## Points 21-30: Height Management

### Point 21: Single-Pass Height Reading
**Description**: Read all section heights in a single pass. Avoid multiple DOM reads for the same elements.

**Implementation Requirements**:
- Iterate once over all item refs
- Read `offsetHeight` for each section
- Store in Map for later use
- No nested loops or repeated reads

**Code Example**:
```typescript
// Points 21, 22: Read heights once per section in single pass
const actualHeights = new Map<string, number>();
this.positionedSections.forEach((positioned, index) => {
  const element = itemRefArray[index]?.nativeElement;
  if (element) {
    actualHeights.set(positioned.key, element.offsetHeight);
  }
});
```

**Testing Criteria**: Verify each element is read exactly once.

---

### Point 22: Batch Height Measurement
**Description**: Measure all heights together in one batch operation, not individually as needed.

**Implementation Requirements**:
- Collect all elements first
- Measure all heights in sequence
- Store results before using

**Code Example**:
```typescript
// Point 22: Batch height measurement
const heights = new Map<string, number>();
itemRefArray.forEach((ref, index) => {
  const height = ref.nativeElement.offsetHeight;
  heights.set(sectionKeys[index], height);
});
// Use heights map for layout
```

**Testing Criteria**: Verify all measurements happen before layout calculation.

---

### Point 23: Use offsetHeight, Not getBoundingClientRect
**Description**: Use `element.offsetHeight` for height measurement. It's faster and more reliable than `getBoundingClientRect().height`.

**Implementation Requirements**:
- Always use `element.offsetHeight`
- Avoid `getBoundingClientRect()` for height
- `offsetHeight` includes padding, excludes margin

**Code Example**:
```typescript
// Point 23: Use offsetHeight, not getBoundingClientRect
const height = element.offsetHeight; // Fast and reliable
// NOT: element.getBoundingClientRect().height
```

**Testing Criteria**: Verify consistent height measurements using offsetHeight.

---

### Point 24: Height Estimation Service Integration
**Description**: Use centralized height estimation service for consistent estimates across the application.

**Implementation Requirements**:
- Inject `HeightEstimationService`
- Use `estimate(section, context)` method
- Pass container width, columns, colSpan as context

**Code Example**:
```typescript
// Point 24: Height estimation service integration
const estimatedHeight = this.heightEstimationService.estimate(section, {
  containerWidth: contentWidth,
  columns: columns,
  colSpan: colSpan,
});
```

**Testing Criteria**: Verify consistent height estimates from service.

---

### Point 25: Fallback Height Estimation
**Description**: Provide reasonable fallback height when estimation service fails or section type is unknown.

**Implementation Requirements**:
- Default height: 200px for unknown types
- Type-based defaults: charts (300px), cards (180px), etc.
- Never use 0 or undefined

**Code Example**:
```typescript
// Point 25: Fallback height estimation
const height = estimatedHeight || this.getDefaultHeight(section.type) || 200;
```

**Testing Criteria**: Verify all sections have valid heights.

---

### Point 26: CSS Aspect Ratios for Media
**Description**: Apply CSS aspect ratios to images, videos, and iframes to improve initial height estimates before content loads.

**Implementation Requirements**:
- Set `aspect-ratio: 16/9` for images and videos
- Set `aspect-ratio: 4/3` for charts/canvas
- Helps browser calculate height before content loads

**Code Example**:
```css
/* Point 26: CSS aspect ratios for heavy media */
.masonry-item img {
  aspect-ratio: 16 / 9;
}
.masonry-item canvas {
  aspect-ratio: 4 / 3;
}
```

**Testing Criteria**: Verify media elements have reasonable initial heights.

---

### Point 27: Cap Minimum Heights
**Description**: Enforce minimum height (e.g., 50px) to prevent sections from collapsing to zero height.

**Implementation Requirements**:
- Minimum height: `Math.max(measuredHeight, 50)`
- Apply to all height values
- Prevents layout errors from zero-height sections

**Code Example**:
```typescript
// Point 27: Cap minimum heights
const height = Math.max(element.offsetHeight, 50);
```

**Testing Criteria**: Verify no sections have height < 50px.

---

### Point 28: Height Learning/Adaptation
**Description**: Update height cache with actual measured heights to improve future estimates.

**Implementation Requirements**:
- After measurement, store in cache: `cachedHeights.set(key, actualHeight)`
- Use actual heights for future layouts
- Learn from real measurements

**Code Example**:
```typescript
// Point 28: Height learning - update cache with actual heights
const actualHeight = element.offsetHeight;
this.cachedHeights.set(sectionKey, actualHeight);
```

**Testing Criteria**: Verify cache improves over time with real measurements.

---

### Point 29: Calculate Spans Before Measuring Heights
**Description**: Determine column spans for all sections before measuring heights. This enables one-pass width/spans calculation.

**Implementation Requirements**:
- Calculate all spans first: `sectionSpans.set(key, decideSpanForSection(section, columns))`
- Then measure heights
- Use spans during height estimation

**Code Example**:
```typescript
// Point 29: Calculate spans before measuring heights
const sectionSpans = new Map<string, number>();
this.sections.forEach((section, index) => {
  const key = section.id || `section-${index}`;
  sectionSpans.set(key, this.decideSpanForSection(section, columns));
});
// Then measure heights with known spans
```

**Testing Criteria**: Verify spans are known before height measurement.

---

### Point 30: Height Validation
**Description**: Validate all heights are positive numbers before using in layout calculations.

**Implementation Requirements**:
- Check: `height > 0 && isFinite(height)`
- Replace invalid heights with fallback
- Log warnings for invalid heights

**Code Example**:
```typescript
// Point 30: Height validation
const height = element.offsetHeight;
if (!height || height <= 0 || !isFinite(height)) {
  this.logger.warn('Invalid height detected', { section, height });
  return 200; // Fallback
}
```

**Testing Criteria**: Verify all heights used in layout are valid numbers.

---

## Points 31-40: State Management & Quality

### Point 31: Format Adaptation - View-Level Flags
**Description**: Format adaptation (compact mode, etc.) should use view-level flags only, not modify section data directly.

**Implementation Requirements**:
- Use component-level flags: `formatsAdjustedForWidth`
- Don't mutate section objects
- Apply format changes via CSS classes or styles

**Code Example**:
```typescript
// Point 31: Format adaptation - view-level flags only
private formatsAdjustedForWidth = false;
if (!this.formatsAdjustedForWidth) {
  this.adaptSectionFormats(actualHeights, containerWidth);
  this.formatsAdjustedForWidth = true;
}
```

**Testing Criteria**: Verify section data remains unchanged.

---

### Point 32: Single Format Adjustment Pass
**Description**: Perform format adaptation only once per container width change, not on every layout.

**Implementation Requirements**:
- Check flag before adapting
- Set flag after adaptation
- Reset flag on width change

**Code Example**:
```typescript
// Point 32: Single format adjustment pass, only once per width
if (!this.formatsAdjustedForWidth) {
  this.adaptSectionFormats(actualHeights, containerWidth);
  this.formatsAdjustedForWidth = true;
}
```

**Testing Criteria**: Verify format adaptation runs once per width.

---

### Point 33: Simple Threshold Rule for Adaptation
**Description**: Use simple threshold rules (e.g., height > 900px) to trigger format adaptation, not complex logic.

**Implementation Requirements**:
- Single threshold check: `if (height > threshold)`
- Clear, predictable rules
- No nested conditions

**Code Example**:
```typescript
// Point 33: Simple threshold rule
if (height > 900 && section.canCompact && !section.compactMode) {
  section.compactMode = true;
}
```

**Testing Criteria**: Verify adaptation triggers at correct thresholds.

---

### Point 34: One-Way Format Adaptation
**Description**: Format adaptation should be one-way: once a section is compact, it stays compact. No toggling back.

**Implementation Requirements**:
- Check `compactModeLocked` flag
- Set flag after adaptation
- Never revert adaptation

**Code Example**:
```typescript
// Point 34: One-way adaptation - once compact, stay compact
if (height > 900 && !section.compactMode && !section.compactModeLocked) {
  section.compactMode = true;
  section.compactModeLocked = true;
}
```

**Testing Criteria**: Verify sections don't toggle formats.

---

### Point 35: Responsive Breakpoint Handling
**Description**: Handle responsive breakpoints smoothly with proper state updates and layout recalculation.

**Implementation Requirements**:
- Detect breakpoint changes
- Recalculate columns
- Update layout immediately

**Code Example**:
```typescript
// Point 35: Responsive breakpoint handling
const newColumns = this.calculateColumns(containerWidth);
if (newColumns !== this.currentColumns) {
  this.currentColumns = newColumns;
  this.scheduleLayout();
}
```

**Testing Criteria**: Verify smooth transitions between breakpoints.

---

### Point 36: Format Adaptation Reset on Width Change
**Description**: Reset format adaptation flags when container width changes significantly to allow re-adaptation.

**Implementation Requirements**:
- Track previous width
- Compare with current width
- Reset flags if difference > threshold (e.g., 100px)

**Code Example**:
```typescript
// Point 36: Reset format adaptation on significant width change
const widthDiff = Math.abs(containerWidth - this.lastWidth);
if (widthDiff > 100) {
  this.formatsAdjustedForWidth = false;
  this.lastWidth = containerWidth;
}
```

**Testing Criteria**: Verify formats re-adapt on major width changes.

---

### Point 37: Responsive Column Updates
**Description**: Update column count immediately when breakpoint changes, before layout calculation.

**Implementation Requirements**:
- Calculate columns first
- Update `currentColumns` property
- Use new column count in layout

**Code Example**:
```typescript
// Point 37: Responsive column updates
const columns = this.calculateColumns(containerWidth);
this.currentColumns = columns; // Update before layout
// Then use columns in layout calculation
```

**Testing Criteria**: Verify columns update before layout runs.

---

### Point 38: Container Width Stability Check
**Description**: Verify container width is stable before performing layout to avoid layout thrashing.

**Implementation Requirements**:
- Check width hasn't changed during calculation
- Abort if width changed significantly
- Re-schedule if width unstable

**Code Example**:
```typescript
// Point 38: Container width stability check
const initialWidth = this.getContainerWidth();
// ... layout calculation
const finalWidth = this.getContainerWidth();
if (Math.abs(finalWidth - initialWidth) > 10) {
  this.scheduleLayout(); // Recalculate if width changed
  return;
}
```

**Testing Criteria**: Verify layout doesn't run with unstable widths.

---

### Point 39: Animation/Transition Handling
**Description**: Use short transition durations (200-350ms) with ease-out timing for smooth, performant animations.

**Implementation Requirements**:
- CSS transitions: 200-350ms duration
- Easing: `ease-out` or `cubic-bezier(0.2, 0, 0.2, 1)`
- Disable during measurement
- Enable after first layout

**Code Example**:
```css
/* Point 39: Short transition durations (200-350ms) with ease-out */
.masonry-item {
  transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1);
}
```

**Testing Criteria**: Verify smooth 60fps animations.

---

### Point 40: Quality Metrics and Validation
**Description**: Calculate and validate layout quality metrics (utilization, gap count, etc.) to ensure optimal placement.

**Implementation Requirements**:
- Calculate space utilization percentage
- Count gaps/unused spaces
- Log metrics in debug mode
- Warn if quality is poor

**Code Example**:
```typescript
// Point 40: Quality metrics and validation
const utilization = (usedSpace / totalSpace) * 100;
const gapCount = this.countGaps(positionedSections);
if (utilization < 70) {
  this.logger.warn('Low layout utilization', { utilization, gapCount });
}
```

**Testing Criteria**: Verify quality metrics are calculated and logged.

---

## Additional Points (41-50): Extended Requirements

### Point 41: Error Handling - Invalid Section Data
**Description**: Handle invalid or missing section data gracefully without breaking layout.

**Implementation Requirements**:
- Validate section structure
- Provide defaults for missing fields
- Skip invalid sections with warning

**Code Example**:
```typescript
// Point 41: Error handling - invalid section data
if (!section || !section.id) {
  this.logger.warn('Invalid section data', { section });
  return null; // Skip invalid section
}
```

**Testing Criteria**: Verify layout continues with invalid sections.

---

### Point 42: Error Handling - DOM Measurement Failures
**Description**: Handle cases where DOM elements are not available for measurement.

**Implementation Requirements**:
- Check element exists before measurement
- Use fallback height if element missing
- Retry measurement if needed

**Code Example**:
```typescript
// Point 42: Error handling - DOM measurement failures
const element = itemRefArray[index]?.nativeElement;
if (!element) {
  return this.estimateHeight(section); // Fallback
}
```

**Testing Criteria**: Verify layout works when elements are missing.

---

### Point 43: Error Handling - Container Not Ready
**Description**: Handle cases where container element is not yet available in DOM.

**Implementation Requirements**:
- Check `containerRef?.nativeElement` exists
- Return early if not ready
- Schedule retry if needed

**Code Example**:
```typescript
// Point 43: Error handling - container not ready
if (!this.containerRef?.nativeElement) {
  setTimeout(() => this.scheduleLayout(), 100);
  return;
}
```

**Testing Criteria**: Verify graceful handling of missing container.

---

### Point 44: Error Handling - Zero or Negative Dimensions
**Description**: Validate and handle zero or negative container widths/heights.

**Implementation Requirements**:
- Check width > 0 before layout
- Check height > 0 after layout
- Provide fallback dimensions

**Code Example**:
```typescript
// Point 44: Error handling - zero or negative dimensions
if (containerWidth <= 0) {
  this.logger.warn('Invalid container width', { containerWidth });
  return;
}
```

**Testing Criteria**: Verify layout handles invalid dimensions.

---

### Point 45: Layout Versioning
**Description**: Increment layout version number after each completed layout for tracking and debugging.

**Implementation Requirements**:
- Maintain `layoutVersion` counter
- Increment after successful layout
- Emit version in `layoutCompleted` event

**Code Example**:
```typescript
// Point 45: Increment layout version after completion
this.layoutVersion++;
this.layoutCompleted.emit({
  version: this.layoutVersion,
  height: this.containerHeight
});
```

**Testing Criteria**: Verify version increments with each layout.

---

### Point 46: Debug Guards for Excessive Layouts
**Description**: Detect and prevent excessive layout requests (e.g., >3 in 500ms) to avoid performance issues.

**Implementation Requirements**:
- Track layout count in time window
- Block if threshold exceeded
- Log warning when blocking

**Code Example**:
```typescript
// Point 46: Debug guard - if more than 3 layouts in 500ms, log warning and ignore
if (this.layoutCount >= 3) {
  this.logger.warn('Excessive layout requests', { count: this.layoutCount });
  return;
}
```

**Testing Criteria**: Verify excessive layouts are prevented.

---

### Point 47: Performance Monitoring
**Description**: Track layout calculation performance and log metrics for optimization.

**Implementation Requirements**:
- Measure layout time: `performance.now()`
- Log duration in debug mode
- Track cache hit/miss rates

**Code Example**:
```typescript
// Point 47: Performance monitoring
const startTime = performance.now();
// ... layout calculation
const duration = performance.now() - startTime;
if (this.debug) {
  this.logger.debug('Layout performance', { duration, cacheHits, cacheMisses });
}
```

**Testing Criteria**: Verify performance metrics are tracked.

---

### Point 48: Complete Logging
**Description**: Log comprehensive layout information including all metrics, positions, and state.

**Implementation Requirements**:
- Log layout start and completion
- Include all relevant metrics
- Log section positions and dimensions
- Use structured logging format

**Code Example**:
```typescript
// Point 48: Complete logging with full metrics
this.log('info', 'Layout complete', {
  sections: this.positionedSections.length,
  columns,
  containerHeight: this.containerHeight,
  columnHeights: [...colHeights],
  positionedSectionsSample: this.positionedSections.slice(0, 3),
});
```

**Testing Criteria**: Verify comprehensive logging in debug mode.

---

### Point 49: Testing - Layout Correctness
**Description**: Verify layout correctness: all sections positioned, no overlaps, correct spans.

**Implementation Requirements**:
- Check all sections have positions
- Verify no overlapping sections
- Validate spans are correct
- Test with various section counts

**Code Example**:
```typescript
// Point 49: Testing - layout correctness
function validateLayout(positionedSections: PositionedSection[]): boolean {
  // Check all sections positioned
  if (positionedSections.length !== sections.length) return false;
  // Check no overlaps
  // Check spans valid
  return true;
}
```

**Testing Criteria**: Verify layout validation functions work correctly.

---

### Point 50: Testing - Performance Benchmarks
**Description**: Establish performance benchmarks and ensure layout meets targets (e.g., <16ms for 50 sections).

**Implementation Requirements**:
- Measure layout time for various section counts
- Target: <16ms for 50 sections
- Log warnings if targets not met
- Optimize if needed

**Code Example**:
```typescript
// Point 50: Testing - performance benchmarks
const duration = performance.now() - startTime;
const targetDuration = 16; // 60fps
if (duration > targetDuration) {
  this.logger.warn('Layout exceeded target duration', {
    duration,
    target: targetDuration,
    sections: this.sections.length
  });
}
```

**Testing Criteria**: Verify layout meets performance targets.

---

## Implementation Checklist

- [ ] Points 1-10: Core Layout Algorithm
- [ ] Points 11-20: Performance & Optimization
- [ ] Points 21-30: Height Management
- [ ] Points 31-40: State Management & Quality
- [ ] Points 41-50: Extended Requirements

## Testing Strategy

1. **Unit Tests**: Test each point in isolation
2. **Integration Tests**: Test point interactions
3. **Performance Tests**: Verify performance targets
4. **Edge Case Tests**: Test error handling points
5. **Visual Regression**: Verify layout correctness

## Maintenance

- Review points quarterly
- Update as requirements change
- Document any deviations
- Track performance metrics

---

**Last Updated**: 2025-01-XX
**Version**: 1.0
**Status**: Specification Complete
