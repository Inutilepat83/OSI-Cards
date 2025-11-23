# HomePageComponent Breakdown Plan

## Status
✅ **Components Created**: All required components have been created:
- `JsonEditorComponent` (already existed)
- `CardTypeSelectorComponent` (already existed)  
- `LLMSimulationControlsComponent` (newly created)
- `PreviewControlsComponent` (newly created)
- `SystemStatsComponent` (newly created)

## Remaining Integration Work

### 1. Integrate JsonEditorComponent
**Current State**: JSON editor logic is inline in HomePageComponent (lines ~200-250 in HTML, ~400-600 in TS)
**Action Required**:
- Replace inline textarea with `<app-json-editor>` component
- Move JSON validation logic to use component's `@Output` events
- Update `jsonInput`, `jsonError`, `jsonErrorPosition`, `jsonErrorSuggestion` bindings
- Remove duplicate `formatJson()` method (use component's method)

### 2. Integrate CardTypeSelectorComponent  
**Current State**: Card type selector is inline in HomePageComponent (lines ~75-100 in HTML)
**Action Required**:
- Replace inline card type buttons with `<app-card-type-selector>` component
- Bind `selectedType` and `cardTypes` inputs
- Handle `typeChange` event
- Remove duplicate card type selection logic

### 3. Integrate LLMSimulationControlsComponent
**Current State**: LLM simulation button is inline (lines ~180-187 in HTML)
**Action Required**:
- Replace inline button with `<app-llm-simulation-controls>` component
- Bind `isSimulating` input from `isSimulatingLLM` property
- Handle `simulationToggle` event to call `onSimulateLLMStart()`
- Remove duplicate button markup

### 4. Integrate PreviewControlsComponent
**Current State**: Preview controls are scattered throughout the template
**Action Required**:
- Find all preview-related buttons (fullscreen, export, etc.)
- Replace with `<app-preview-controls>` component
- Bind `isFullscreen` input
- Handle `toggleFullscreen` and `export` events
- Remove duplicate control markup

### 5. Integrate SystemStatsComponent
**Current State**: System stats display is inline (if present)
**Action Required**:
- Replace inline stats display with `<app-system-stats>` component
- Bind `stats` input from `systemStats` property
- Remove duplicate stats markup

### 6. Extract Remaining Logic
**Areas to Extract**:
- LLM simulation logic (lines ~1000-1300 in TS) → Could be a service
- Card generation logic (lines ~600-1000 in TS) → Already partially in services
- Template loading logic (lines ~400-600 in TS) → Could be a service method
- Section completion tracking (lines ~1100-1200 in TS) → Already in SectionCompletionService

## Estimated Impact
- **Lines Reduced**: ~500-800 lines from template + ~300-500 lines from TS = ~800-1300 lines
- **Final Size**: HomePageComponent should be ~1200-1700 lines (down from 2485)
- **Maintainability**: Significantly improved with clear component boundaries

## Next Steps
1. Update HomePageComponent imports to include new components
2. Replace inline markup with component tags
3. Wire up @Input/@Output bindings
4. Remove duplicate logic
5. Test integration
6. Refactor remaining logic into services if needed



