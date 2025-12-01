import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# Card Validation

Documentation for Card Validation.

## Overview

This section covers card validation.

## Details

Content coming soon.

## Related

- [Getting Started](/docs/getting-started)
- [API Reference](/docs/api-reference)
`;

@Component({
  selector: 'app-card-validation-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardValidationPageComponent {
  content = pageContent;
}

export default CardValidationPageComponent;
