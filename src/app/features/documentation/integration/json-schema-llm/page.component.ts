import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# JSON Schema for LLMs

Documentation for JSON Schema for LLMs.

## Overview

This section covers json schema for llms.

## Details

Content coming soon.

## Related

- [Getting Started](/docs/getting-started)
- [API Reference](/docs/api-reference)
`;

@Component({
  selector: 'app-json-schema-llm-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JsonSchemaLlmPageComponent {
  content = pageContent;
}

export default JsonSchemaLlmPageComponent;
