import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Card Generation Prompt

Documentation for Card Generation Prompt.

## Overview

This section covers card generation prompt.

## Details

Content coming soon.

## Related

- [Getting Started](/docs/getting-started)
- [API Reference](/docs/api-reference)
`;

@Component({
  selector: 'app-card-generation-prompt-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardGenerationPromptPageComponent {
  content = pageContent;
}

export default CardGenerationPromptPageComponent;
