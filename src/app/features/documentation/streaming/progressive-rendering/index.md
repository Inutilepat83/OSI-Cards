# Progressive Rendering

How cards render progressively during streaming.

## Rendering Flow

1. **Placeholder Creation**: Empty card shell appears
2. **Section Detection**: As JSON parses, sections are created
3. **Field Population**: Fields populate as data arrives
4. **Completion Animation**: Sections animate when complete

## Placeholder Cards

During streaming, sections show placeholder content:

```typescript
// Placeholder section structure
{
  title: "Section 1",
  type: "info",
  fields: [
    { label: "Field 1", value: "", meta: { placeholder: true } }
  ],
  meta: { placeholder: true, streamingOrder: 0 }
}
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.osi-streaming` | Applied during active streaming |
| `.osi-section-placeholder` | Placeholder section |
| `.osi-section-complete` | Completed section |
| `.osi-field-placeholder` | Placeholder field |

## Template Example

```html
<app-ai-card-renderer
  [cardConfig]="card"
  [class.osi-streaming]="isStreaming">
</app-ai-card-renderer>
```
