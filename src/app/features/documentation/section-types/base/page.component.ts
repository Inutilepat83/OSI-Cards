import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';
import { DocsDemoComponent } from '../../components';

const pageContent = `# base Section

Documentation for base section type.

## Overview

The **base Section** is used for documentation for base section type.

## Use Cases



## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: 'base';
  fields?: CardField[];
  
}
\`\`\`

## Example

\`\`\`json
{
  "title": "base Section Example",
  "type": "base",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
}
\`\`\`

## Best Practices



## Component Properties


### Outputs

- **fieldInteraction**: Output event
- **itemInteraction**: Output event


## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

const demoConfig = {
  "title": "base Section Example",
  "type": "base",
  "fields": [
    {
      "label": "Example Label",
      "value": "Example Value"
    }
  ]
};

/**
 * Base Section documentation page with live demo
 * Auto-generated - modifications may be overwritten
 */
@Component({
  selector: 'app-base-page',
  standalone: true,
  imports: [DocPageComponent, DocsDemoComponent],
  template: `
    <div class="section-docs">
      <app-docs-demo 
        [config]="demo" 
        [type]="'base'"
        demoTitle="Live Preview"
        height="350px"
      ></app-docs-demo>
      <app-doc-page [content]="content"></app-doc-page>
    </div>
  `,
  styles: [`
    .section-docs {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasePageComponent {
  content = pageContent;
  demo = demoConfig;
}

export default BasePageComponent;
