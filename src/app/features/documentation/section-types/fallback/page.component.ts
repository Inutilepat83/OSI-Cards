import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# Fallback Section

Default section renderer for unknown or unsupported section types.

## Overview

The **Fallback Section** (\`type: "fallback"\`) is used for default section renderer for unknown or unsupported section types.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`fallback\` |
| Uses Fields | Yes |
| Uses Items | Yes |
| Default Columns | 1 |
| Supports Collapse | Yes |
| Aliases | None |


## Use Cases

- Unknown types
- Error handling
- Graceful degradation

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| (See CardField interface) | - | - |

### Items Schema

| Property | Type | Description |
|----------|------|-------------|
| (See CardItem interface) | - | - |

## Complete Example

\`\`\`json
{
  "title": "Unknown Section Type",
  "type": "unknown-custom-type",
  "description": "This section type is not recognized and will render using fallback",
  "fields": [
    {
      "label": "Custom Field 1",
      "value": "Some custom data"
    },
    {
      "label": "Numeric Data",
      "value": 42
    }
  ],
  "items": [
    {
      "title": "Custom Item 1",
      "description": "Description for custom item"
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Fallback",
  "type": "fallback"
}
\`\`\`

## Best Practices

1. Display section data in readable format
2. Show section type for debugging
3. Provide helpful error messages

## Component Information

- **Selector:** \`lib-fallback-section\`
- **Component Path:** \`./lib/components/sections/fallback-section/fallback-section.component\`


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  title: 'Unknown Section Type',
  type: 'unknown-custom-type',
  description: 'This section type is not recognized and will render using fallback',
  fields: [
    {
      label: 'Custom Field 1',
      value: 'Some custom data',
    },
    {
      label: 'Numeric Data',
      value: 42,
    },
  ],
  items: [
    {
      title: 'Custom Item 1',
      description: 'Description for custom item',
    },
  ],
};

/**
 * Fallback Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-fallback-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo
        [config]="demo"
        [type]="'fallback'"
        demoTitle="Live Preview"
        height="350px"
      ></app-docs-demo>
      <app-doc-page [content]="content"></app-doc-page>
    </div>
  `,
  styles: [
    `
      .section-docs {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FallbackPageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default FallbackPageComponent;
