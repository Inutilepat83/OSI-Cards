# Fix Plan: Reduce Calculations and Prevent Blinking

## Problems Identified

1. **Too Many Calculations**: Masonry grid recalculates on every update, even content-only changes
2. **Card Blinking**: Constant change detection and re-renders cause visual flickering
3. **Inefficient Updates**: Dispatches happening too frequently, even with debouncing

## Root Causes

1. **Change Detection**: Every dispatch triggers change detection, causing re-renders
2. **Masonry Recalculation**: `changeType='content'` still triggers some layout checks
3. **Object References**: New card objects on every update cause Angular to detect changes
4. **Multiple Update Paths**: Both store updates and local state updates happening simultaneously

## Solution Plan

### Phase 1: Stabilize Object References
**Goal**: Prevent unnecessary change detection by maintaining stable object references

1. **Cache Card Objects**
   - Keep a single card object reference during streaming
   - Only create new objects when structure actually changes
   - Mutate existing objects for content updates (in a controlled way)

2. **Immutable Updates Only for Structure**
   - Use immutable updates only when `changeType='structural'`
   - For `changeType='content'`, update existing objects in place
   - Use `Object.assign()` or direct property updates for content

### Phase 2: Reduce Dispatches
**Goal**: Only dispatch when absolutely necessary

1. **Batch Updates**
   - Collect multiple content updates
   - Dispatch only when:
     - Sections are first declared (placeholders)
     - A section completes (all fields/items filled)
     - Card is complete
   - Skip dispatches for intermediate content updates

2. **Use Local State for Content Updates**
   - Keep streaming content in local state (`llmPreviewCard`)
   - Only dispatch to store when structure changes
   - Let the preview component read from local state during streaming

### Phase 3: Optimize Masonry Grid
**Goal**: Prevent unnecessary recalculations

1. **Skip Layout on Content Updates**
   - When `changeType='content'`, skip all layout calculations
   - Only update section data, don't recalculate positions
   - Let sections expand naturally via CSS

2. **Debounce Layout Recalculations**
   - Even for structural changes, debounce by 50-100ms
   - Batch multiple structural changes together
   - Use `requestAnimationFrame` for smooth updates

3. **Prevent Flickering**
   - Use `OnPush` change detection (already done)
   - Avoid clearing/resetting state unnecessarily
   - Maintain stable section references

### Phase 4: Fix Placeholder Display
**Goal**: Ensure placeholders show correctly without flickering

1. **Create Placeholders Once**
   - When sections are declared, create placeholders immediately
   - Store in `llmPlaceholderCard` and never recreate
   - Update placeholder content in place

2. **Display Logic**
   - Always show `llmPreviewCard` during streaming (not store card)
   - Only switch to store card when streaming completes
   - Prevent switching between placeholder and real card

## Implementation Steps

### Step 1: Modify Streaming Logic
- Remove frequent dispatches
- Keep card in local state (`llmPreviewCard`)
- Only dispatch when structure changes

### Step 2: Update Masonry Grid
- Add flag to skip layout on content updates
- Only recalculate when explicitly requested
- Use stable section references

### Step 3: Fix Change Detection
- Use `markForCheck()` strategically
- Avoid unnecessary change detection cycles
- Batch updates using `requestAnimationFrame`

### Step 4: Test and Verify
- Verify placeholders appear immediately
- Verify no blinking during streaming
- Verify calculations only happen when needed

## Expected Behavior After Fix

1. **Placeholders**: Appear immediately when sections declared, no flickering
2. **Content Updates**: Smooth expansion, no recalculations
3. **Section Completion**: Single recalculation when section completes
4. **Final Card**: One final recalculation when complete
5. **No Blinking**: Stable references, minimal change detection

## Risk Assessment

- **Low Risk**: Changes are isolated to streaming logic
- **Medium Risk**: Need to ensure store and local state stay in sync
- **Mitigation**: Test thoroughly, keep fallback to store updates

