import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# isValidSectionType

Validate section type strings.

## Import

\`\`\`typescript
import { isValidSectionType } from 'osi-cards-lib';
\`\`\`

## Usage

\`\`\`typescript
isValidSectionType('info');      // true
isValidSectionType('analytics'); // true
isValidSectionType('metrics');   // true (alias)
isValidSectionType('invalid');   // false
isValidSectionType('');          // false
\`\`\`

## Valid Types

All canonical types:
- info, analytics, contact-card, network-card
- map, financials, event, list, chart
- product, solutions, overview, quotation
- text-reference, brand-colors, news
- social-media, fallback

Plus all registered aliases.
`;

@Component({
  selector: 'app-is-valid-section-type-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IsValidSectionTypePageComponent {
  content = pageContent;
}

export default IsValidSectionTypePageComponent;
