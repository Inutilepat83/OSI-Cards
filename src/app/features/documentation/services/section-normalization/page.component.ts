import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# SectionNormalizationService

Normalize and validate section data.

## Overview

\`SectionNormalizationService\` ensures section data conforms to expected schemas.

## Import

\`\`\`typescript
import { SectionNormalizationService } from 'osi-cards-lib';
\`\`\`

## Methods

### normalize(section)

Normalize section data.

\`\`\`typescript
const normalized = normService.normalize({
  title: 'My Section',
  type: 'metrics', // alias
  fields: [...]
});
// Returns section with type: 'analytics'
\`\`\`

### resolveType(type)

Resolve type alias to canonical type.

\`\`\`typescript
normService.resolveType('metrics');  // 'analytics'
normService.resolveType('stats');    // 'analytics'
normService.resolveType('timeline'); // 'event'
\`\`\`

### validate(section)

Validate section structure.

\`\`\`typescript
const result = normService.validate(section);
if (!result.valid) {
  console.log('Errors:', result.errors);
}
\`\`\`

### ensureIds(section)

Ensure all elements have IDs.

## Type Aliases Resolved

| Alias | Canonical Type |
|-------|---------------|
| \`metrics\` | analytics |
| \`stats\` | analytics |
| \`timeline\` | event |
| \`table\` | list |
| \`locations\` | map |
| \`quote\` | quotation |
`;

@Component({
  selector: 'app-section-normalization-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionNormalizationPageComponent {
  content = pageContent;
}

export default SectionNormalizationPageComponent;
