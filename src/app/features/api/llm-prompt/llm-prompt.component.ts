import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LlmPromptService } from '../../../core/services/llm-prompt.service';

/**
 * API endpoint component for /api/llm_prompt
 * Returns the LLM system prompt as JSON
 *
 * This component serves the prompt by:
 * 1. Generating the prompt from section-registry.json
 * 2. Returning it as JSON in the component template
 * 3. The response is accessible via HTTP GET request
 */
@Component({
  selector: 'app-llm-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `<pre>{{ promptJson }}</pre>`,
  styles: [
    `
      :host {
        display: block;
        padding: 0;
        margin: 0;
      }
      pre {
        margin: 0;
        padding: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: 'Courier New', monospace;
        font-size: 12px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LlmPromptComponent implements OnInit {
  promptJson = '';

  constructor(private llmPromptService: LlmPromptService) {}

  ngOnInit(): void {
    // Get the prompt and format as JSON
    this.llmPromptService.getPromptJson().subscribe((response) => {
      this.promptJson = JSON.stringify(response, null, 2);
    });
  }
}

