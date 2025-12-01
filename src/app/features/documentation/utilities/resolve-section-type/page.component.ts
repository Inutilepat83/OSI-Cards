import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# resolveSectionType

Resolve section type aliases.

## Import

\`\`\`typescript
import { resolveSectionType } from 'osi-cards-lib';
\`\`\`

## Usage

\`\`\`typescript
resolveSectionType('metrics');   // 'analytics'
resolveSectionType('stats');     // 'analytics'
resolveSectionType('timeline');  // 'event'
resolveSectionType('table');     // 'list'
resolveSectionType('locations'); // 'map'
resolveSectionType('info');      // 'info' (canonical)
\`\`\`

## Alias Map

| Alias | Resolves To |
|-------|-------------|
| metrics | analytics |
| stats | analytics |
| timeline | event |
| table | list |
| locations | map |
| quote | quotation |
| reference | text-reference |
| text-ref | text-reference |
| brands | brand-colors |
| colors | brand-colors |
| project | info |
`;

@Component({
  selector: 'app-resolve-section-type-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResolveSectionTypePageComponent {
  content = pageContent;
}

export default ResolveSectionTypePageComponent;
