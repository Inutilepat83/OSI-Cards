import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# CardUtils

Utility functions for card manipulation.

## Import

\`\`\`typescript
import { CardUtils } from 'osi-cards-lib';
\`\`\`

## Methods

### safeString(value, maxLength?)

Safely convert value to string.

\`\`\`typescript
CardUtils.safeString(123);        // "123"
CardUtils.safeString(null);       // ""
CardUtils.safeString("long...", 10); // truncated
\`\`\`

### safeNumber(value, defaultValue?)

Safely convert value to number.

\`\`\`typescript
CardUtils.safeNumber("42");       // 42
CardUtils.safeNumber("invalid");  // 0
CardUtils.safeNumber(null, -1);   // -1
\`\`\`

### generateId(prefix?)

Generate unique ID.

\`\`\`typescript
CardUtils.generateId();           // "item_1234567_abc"
CardUtils.generateId("section");  // "section_1234567_abc"
\`\`\`

### ensureSectionIds(sections)

Ensure all sections have IDs.

### sanitizeCardConfig(config)

Sanitize and validate card configuration.

\`\`\`typescript
const clean = CardUtils.sanitizeCardConfig(rawConfig);
if (clean) {
  // Use cleaned config
}
\`\`\`
`;

@Component({
  selector: 'app-card-utils-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardUtilsPageComponent {
  content = pageContent;
}

export default CardUtilsPageComponent;
