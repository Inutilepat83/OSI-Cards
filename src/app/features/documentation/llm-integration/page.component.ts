import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDocPageComponent, NgDocRootPage } from '@ng-doc/app';
import { NgDocPageType } from '@ng-doc/core';
import pageConfig from './llm-integration.page';

const pageContent: string = `# LLM Integration Guide

This guide explains how to integrate OSI Cards with Large Language Models (LLMs) for dynamic card generation.

## Overview

OSI Cards is designed to work seamlessly with LLMs. Cards are **always AI-generated** by LLMs that understand the card structure, section types, and data schemas. This enables dynamic, context-aware card generation based on user queries, data analysis, or agent workflows.

## Architecture

\`\`\`
LLM Response
    ↓
Router/Agent Trigger
    ↓
LLM Streaming Service
    ↓
Card Generation (Progressive)
    ↓
Card Rendering (Real-time Updates)
\`\`\`

## Key Services

### LLMStreamingService

The core service for handling LLM streaming responses and progressive card generation.

\`\`\`typescript
import { inject } from '@angular/core';
import { LLMStreamingService } from './core/services/llm-streaming.service';

const streamingService = inject(LLMStreamingService);

// Start streaming from LLM JSON response
streamingService.start(llmJsonResponse);

// Subscribe to progressive card updates
streamingService.cardUpdates$.subscribe(update => {
  console.log('Card updated:', update.card);
  console.log('Change type:', update.changeType);
});

// Monitor streaming state
streamingService.state$.subscribe(state => {
  console.log('Stage:', state.stage); // 'thinking' | 'streaming' | 'complete'
  console.log('Progress:', state.progress);
});
\`\`\`

### AgentService

Service for triggering LLM agents and handling agent workflows.

\`\`\`typescript
import { inject } from '@angular/core';
import { AgentService } from './core/services/agent.service';

const agentService = inject(AgentService);

// Trigger an agent with context
const result = await agentService.triggerAgent('card-generator', {
  prompt: 'Generate a company card for Acme Corp',
  cardType: 'company',
  context: { userId: '123', sessionId: 'abc' }
});

if (result.success) {
  console.log('Agent executed:', result.executionId);
}
\`\`\`

### ChatService

Service for chat-based LLM interactions and card generation.

\`\`\`typescript
import { inject } from '@angular/core';
import { ChatService } from './core/services/chat.service';

const chatService = inject(ChatService);

// Send a message to LLM
chatService.sendMessage('Generate a card for TechCorp').subscribe(response => {
  console.log('LLM response:', response);
  // Process response and generate card
});
\`\`\`

## WebSocket Integration

For real-time LLM streaming, use the WebSocket provider:

\`\`\`typescript
import { inject } from '@angular/core';
import { CardDataService } from './core/services/card-data/card-data.service';
import { WebSocketCardProvider } from './core/services/card-data/websocket-card-provider.service';

const cardDataService = inject(CardDataService);
const wsProvider = inject(WebSocketCardProvider);

// Configure WebSocket URL
wsProvider.configureWebSocketUrl('ws://your-llm-server/stream');

// Switch to WebSocket provider
cardDataService.switchProvider(wsProvider);

// Cards will now stream in real-time from LLM
\`\`\`

## Card Structure for LLMs

LLMs should generate cards following this structure:

\`\`\`json
{
  "cardTitle": "Card Title",
  "cardSubtitle": "Optional Subtitle",
  "cardType": "company",
  "sections": [
    {
      "title": "Section Title",
      "type": "info",
      "fields": [
        {
          "label": "Label",
          "value": "Value"
        }
      ]
    }
  ],
  "actions": [
    {
      "label": "Action",
      "type": "primary",
      "action": "https://example.com"
    }
  ]
}
\`\`\`

## Prompt Engineering

### Basic Prompt

\`\`\`
Generate a card for [entity] with the following information:
- [Key information points]
- [Data to include]

Use appropriate section types from: info, analytics, list, chart, etc.
\`\`\`

### Advanced Prompt

\`\`\`
You are a card generation assistant. Generate a JSON card configuration for:

Entity: [entity name]
Type: [company|contact|event|product]
Context: [additional context]

Requirements:
1. Use 2-4 sections
2. Include relevant metrics if available
3. Add appropriate actions
4. Follow the AICardConfig schema

Return only valid JSON.
\`\`\`

## Streaming Card Generation

Cards are generated progressively as LLM responses stream in:

\`\`\`typescript
// LLM streams JSON chunks
const chunks = [
  '{"cardTitle":"Company',
  ' Profile","sections":[',
  '{"title":"Info","type":"info"',
  ',"fields":[]}]}'
];

// Service parses and merges progressively
chunks.forEach(chunk => {
  streamingService.processChunk(chunk);
});

// Card updates emit as sections complete
streamingService.cardUpdates$.subscribe(update => {
  // Update UI with partial card
  this.card = update.card;
});
\`\`\`

## Best Practices

1. **Structured Prompts**: Provide clear structure and examples in prompts
2. **Schema Validation**: Validate LLM responses against card schema
3. **Error Handling**: Handle malformed JSON gracefully
4. **Progressive Updates**: Show loading states during streaming
5. **Caching**: Cache generated cards to reduce LLM calls
6. **Rate Limiting**: Implement rate limiting for LLM requests

## Error Handling

\`\`\`typescript
streamingService.state$.subscribe(state => {
  if (state.stage === 'error') {
    console.error('Streaming error occurred');
    // Handle error, show fallback UI
  }
});

// Handle parsing errors
try {
  streamingService.start(llmResponse);
} catch (error) {
  if (error instanceof SyntaxError) {
    console.error('Invalid JSON from LLM:', error);
    // Request regeneration or show error
  }
}
\`\`\`

## Integration Examples

### OpenAI Integration

\`\`\`typescript
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: 'your-key' });

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{
    role: 'system',
    content: 'You are a card generation assistant. Generate JSON card configurations.'
  }, {
    role: 'user',
    content: 'Generate a company card for Acme Corp'
  }],
  response_format: { type: 'json_object' }
});

const cardJson = response.choices[0].message.content;
streamingService.start(cardJson);
\`\`\`

### Anthropic Claude Integration

\`\`\`typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: 'your-key' });

const message = await anthropic.messages.create({
  model: 'claude-3-opus-20240229',
  max_tokens: 4096,
  messages: [{
    role: 'user',
    content: 'Generate a JSON card for TechCorp following the AICardConfig schema'
  }]
});

const cardJson = message.content[0].text;
streamingService.start(cardJson);
\`\`\`

## Related Documentation

- [API Reference - LLMStreamingService](/docs/api/services/llmstreamingservice)
- [API Reference - AgentService](/docs/api/services/agentservice)
- [API Reference - ChatService](/docs/api/services/chatservice)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Section Types](/docs/section-types)
`;

@Component({
  selector: 'ng-doc-page-llm-integration',
  template: `<ng-doc-page></ng-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDocPageComponent],
  providers: [
    { provide: NgDocRootPage, useExisting: LlmIntegrationPageComponent }
  ],
  standalone: true
})
export class LlmIntegrationPageComponent extends NgDocRootPage {
  readonly pageType: NgDocPageType = 'guide';
  readonly pageContent: string = pageContent;
  readonly editSourceFileUrl?: string;
  readonly viewSourceFileUrl?: string;
  override readonly page = pageConfig;

  constructor() {
    super();
  }
}

export default LlmIntegrationPageComponent;
