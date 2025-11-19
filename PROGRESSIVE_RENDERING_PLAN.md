# Progressive Rendering System - Implementation Plan

## Current Problems

1. **Store-Driven Updates**: Every section completion dispatches to store → triggers change detection → re-renders entire component tree
2. **Object Reference Changes**: Even with in-place updates, Angular change detection sees changes and re-renders
3. **Masonry Grid Recalculation**: Layout recalculates even for content-only updates
4. **Section Component Re-renders**: Section components re-render when @Input changes, even if content is the same
5. **Cascading Updates**: One completion triggers multiple component re-renders down the tree

## Solution: Progressive Rendering Architecture

### Core Principles

1. **Separation of Concerns**: Separate data state from rendering state
2. **Local State Management**: Use local state for streaming updates, only sync to store when needed
3. **Direct DOM Updates**: For content updates, directly manipulate DOM without triggering Angular change detection
4. **Stable Object References**: Maintain stable references throughout the component tree
5. **Batched Updates**: Batch multiple completions into single update cycles

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    HomePageComponent                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Local Streaming State (llmPlaceholderCard)          │   │
│  │  - Placeholders created once                         │   │
│  │  - Sections updated in-place                         │   │
│  │  - Completion tracking                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Direct Update Channel (bypasses store)              │   │
│  │  - Updates sent directly to CardPreviewComponent     │   │
│  │  - No store dispatch for content updates             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 CardPreviewComponent                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Local Card State                                    │   │
│  │  - Receives direct updates from HomePage             │   │
│  │  - Maintains stable card reference                   │   │
│  │  - Only triggers change detection when needed        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              AICardRendererComponent                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Section Normalization & Caching                     │   │
│  │  - Normalized sections cached                        │   │
│  │  - TrackBy functions prevent re-renders              │   │
│  │  - Change type detection                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                MasonryGridComponent                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Smart Layout Management                             │   │
│  │  - Content updates: skip layout recalculation        │   │
│  │  - Structural updates: recalculate layout            │   │
│  │  - Height-only updates: minimal recalculation        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            Section Components (Info, List, etc.)             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Direct Content Updates                              │   │
│  │  - Use ViewChild to access DOM directly              │   │
│  │  - Update content without re-rendering component     │   │
│  │  - Only re-render on structural changes              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Direct Update Channel (HomePage → CardPreview)

**Goal**: Bypass store for streaming updates, send updates directly

**Changes**:
1. Add `@Output() streamingCardUpdate` to HomePageComponent
2. Add `@Input() streamingCard` to CardPreviewComponent
3. Update HomePageComponent to emit direct updates instead of dispatching to store
4. CardPreviewComponent receives direct updates and updates local state

**Benefits**:
- No store dispatch overhead
- Faster updates
- No cascading change detection

### Phase 2: Local State Management in CardPreview

**Goal**: Maintain stable card reference, only update when necessary

**Changes**:
1. Create local `_streamingCard` state in CardPreviewComponent
2. Use `Object.freeze()` or Proxy to detect actual changes
3. Only trigger change detection when structure changes
4. Use `markForCheck()` strategically, not on every update

**Benefits**:
- Stable object references
- Minimal change detection cycles
- Better performance

### Phase 3: Smart Section Updates

**Goal**: Update section content without full component re-render

**Changes**:
1. Add `@ViewChild` references to section components
2. Create `updateSectionContent()` method that directly updates DOM
3. Use `NgZone.runOutsideAngular()` for content updates
4. Only re-render component on structural changes (new fields/items)

**Benefits**:
- No component re-renders for content updates
- Smooth content transitions
- Better performance

### Phase 4: Enhanced Masonry Grid

**Goal**: Only recalculate layout when structure changes

**Changes**:
1. Improve `changeType` detection (content vs structural)
2. For content updates: skip layout recalculation entirely
3. Use ResizeObserver only for structural changes
4. Cache layout calculations

**Benefits**:
- No layout thrashing
- Smooth section expansion
- Better performance

### Phase 5: TrackBy Optimization

**Goal**: Prevent unnecessary re-renders with perfect trackBy functions

**Changes**:
1. Use section.id for trackBy in masonry grid
2. Use field.id/item.id for trackBy in section components
3. Ensure IDs are stable and unique
4. Test that trackBy prevents re-renders

**Benefits**:
- Angular skips re-rendering unchanged items
- Better performance
- Smoother animations

## Detailed Implementation

### 1. Direct Update Channel

```typescript
// HomePageComponent
@Output() streamingCardUpdate = new EventEmitter<{
  card: AICardConfig;
  changeType: CardChangeType;
  completedSections?: number[];
}>();

// In scheduleNextLlmChunk:
if (completedSections.length > 0) {
  this.updateCompletedSectionsOnly(parsed, completedSections);
  this.streamingCardUpdate.emit({
    card: this.llmPlaceholderCard!,
    changeType: 'content',
    completedSections
  });
}
```

### 2. Local State in CardPreview

```typescript
// CardPreviewComponent
private _streamingCard: AICardConfig | null = null;
private _streamingCardVersion = 0;

@Input() set streamingCard(value: AICardConfig | null) {
  if (value === this._streamingCard) {
    return; // No change
  }
  
  // Check if it's a content update or structural change
  const isContentUpdate = this._streamingCard && 
    this._streamingCard.sections?.length === value?.sections?.length;
  
  this._streamingCard = value;
  this._streamingCardVersion++;
  
  // Only trigger change detection for structural changes
  if (!isContentUpdate) {
    this.cdr.markForCheck();
  } else {
    // Content update: update directly without change detection
    this.updateContentDirectly(value);
  }
}
```

### 3. Direct DOM Updates

```typescript
// Section Component (e.g., InfoSectionComponent)
@ViewChild('sectionContent') sectionContent!: ElementRef;

updateContentDirectly(section: CardSection): void {
  this.ngZone.runOutsideAngular(() => {
    // Directly update DOM elements
    const fields = this.sectionContent.nativeElement.querySelectorAll('.field');
    section.fields?.forEach((field, index) => {
      const fieldElement = fields[index];
      if (fieldElement) {
        // Update field content directly
        fieldElement.querySelector('.field-value').textContent = field.value;
      }
    });
  });
}
```

### 4. Enhanced Masonry Grid

```typescript
// MasonryGridComponent
ngOnChanges(changes: SimpleChanges): void {
  if (changes['sections'] || changes['changeType']) {
    const isContentUpdate = this.changeType === 'content';
    
    if (isContentUpdate) {
      // Content update: skip ALL layout calculations
      // Sections will expand naturally via CSS
      return;
    }
    
    // Structural change: recalculate layout
    this.debouncedComputeLayout();
  }
}
```

## Testing Strategy

1. **Performance Testing**: Measure change detection cycles during streaming
2. **Visual Testing**: Ensure smooth transitions, no flickering
3. **Functional Testing**: Verify all sections render correctly
4. **Edge Cases**: Test rapid completions, partial completions, errors

## Success Criteria

1. ✅ No store dispatches during streaming (except initial placeholders)
2. ✅ Maximum 1 change detection cycle per 300ms during streaming
3. ✅ No masonry grid recalculations for content updates
4. ✅ Sections expand smoothly without repositioning
5. ✅ No component re-renders for content-only updates
6. ✅ Smooth, progressive construction from top to bottom

## Migration Path

1. Implement Phase 1 (Direct Update Channel) - test
2. Implement Phase 2 (Local State) - test
3. Implement Phase 3 (Smart Section Updates) - test
4. Implement Phase 4 (Enhanced Masonry) - test
5. Implement Phase 5 (TrackBy Optimization) - test
6. Remove old store-based update path
7. Performance testing and optimization

## Risk Mitigation

- **Risk**: Direct DOM updates might break Angular's change detection
  - **Mitigation**: Use NgZone.runOutsideAngular() and markForCheck() strategically

- **Risk**: TrackBy functions might not work correctly
  - **Mitigation**: Ensure stable IDs, test thoroughly

- **Risk**: Direct updates might cause state inconsistencies
  - **Mitigation**: Maintain single source of truth, sync to store on completion

