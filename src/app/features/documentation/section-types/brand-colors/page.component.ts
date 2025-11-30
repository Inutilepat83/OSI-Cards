import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Brand Colors Section

Displays color swatches, brand palettes, and design system colors.

## Overview

The **Brand Colors Section** (\`type: "brand-colors"\`) is used for displays color swatches, brand palettes, and design system colors.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`brand-colors\` |
| Uses Fields | Yes |
| Uses Items | No |
| Default Columns | 2 |
| Supports Collapse | Yes |
| Aliases | \`brands\`, \`colors\` |


## Use Cases

- Brand assets
- Design systems
- Color palettes
- Style guides

## Data Schema

### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
| \`label\` | string | Color name/label |
| \`value\` | string | Color value (hex, rgb, etc.) |
| \`description\` | string | Color description/usage |
| \`category\` | string | Color category (primary, secondary, etc.) |



## Complete Example

\`\`\`json
{
  "title": "Brand Colors",
  "type": "brand-colors",
  "description": "Official brand color palette",
  "fields": [
    {
      "label": "Primary",
      "value": "#FF7900",
      "description": "Orange Brand Color"
    },
    {
      "label": "Secondary",
      "value": "#000000",
      "description": "Black"
    },
    {
      "label": "Accent",
      "value": "#4CAF50",
      "description": "Green Accent"
    },
    {
      "label": "Background",
      "value": "#FFFFFF",
      "description": "White Background"
    }
  ]
}
\`\`\`

## Minimal Example

\`\`\`json
{
  "title": "Colors",
  "type": "brand-colors",
  "fields": [
    {
      "label": "Primary",
      "value": "#000000"
    }
  ]
}
\`\`\`

## Best Practices

1. Include hex/RGB values
2. Show color names
3. Group by category
4. Enable copy-to-clipboard

## Component Information

- **Selector:** \`app-brand-colors-section\`
- **Component Path:** \`./lib/components/sections/brand-colors-section/brand-colors-section.component\`
- **Style Path:** \`./lib/styles/components/sections/_brand-colors.scss\`

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

@Component({
  selector: 'app-brand-colors-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrandColorsPageComponent {
  content = pageContent;
}

export default BrandColorsPageComponent;
