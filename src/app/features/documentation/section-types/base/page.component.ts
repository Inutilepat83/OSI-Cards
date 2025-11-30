import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Base (Fallback) Section

The fallback section for unknown or custom section types.

## Use Cases

- Unknown section types
- Custom sections
- Raw data display
- Debugging

## Schema

\`\`\`typescript
interface BaseSection {
  type: string;  // Any type not matching known types
  title: string;
  [key: string]: any;  // Arbitrary additional properties
}
\`\`\`

## Example

\`\`\`typescript
const customSection = {
  title: 'Custom Data',
  type: 'custom-widget',  // Unknown type → renders as base
  data: { /* arbitrary data */ }
};
\`\`\`

## Behavior

When a section type is not recognized:
1. The section is rendered using the base template
2. A warning is logged (dev mode)
3. Available data is displayed in a simple format

## Custom Section Plugins

To handle custom types, register a plugin:

\`\`\`typescript
sectionPluginRegistry.register('custom-widget', CustomWidgetComponent);
\`\`\`

See [Custom Sections](/docs/advanced/custom-sections) for details.
`;

@Component({
  selector: 'app-section-types-base-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionTypesBasePageComponent {
  content = pageContent;
}

export default SectionTypesBasePageComponent;
