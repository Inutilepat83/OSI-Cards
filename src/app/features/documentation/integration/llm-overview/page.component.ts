import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../../doc-page.component';

const pageContent = `# LLM Overview

Integrating OSI Cards with Large Language Models.

## Concept

OSI Cards is designed for AI-generated content. Cards are produced by LLMs that understand the card structure.

## Flow

\`\`\`
User Query → LLM → JSON Card → OSI Cards → UI
\`\`\`

## Supported LLMs

- OpenAI GPT-4
- Anthropic Claude
- Google Gemini
- Local models (Ollama, etc.)

## Key Features

1. **Streaming**: Progressive card rendering
2. **Validation**: Schema validation
3. **Recovery**: Error handling
4. **Prompts**: Structured prompts

## Quick Example

\`\`\`typescript
// LLM returns JSON
const llmResponse = await llm.generate(prompt);

// Stream to cards
streamingService.start(llmResponse);
\`\`\`
`;

@Component({
  selector: 'app-llm-overview-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LlmOverviewPageComponent {
  content = pageContent;
}

export default LlmOverviewPageComponent;
