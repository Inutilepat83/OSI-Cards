# Agentic Flow Integration

This guide explains how to integrate OSI Cards with agentic workflows and AI-powered systems.

## **Overview**

OSI Cards is designed to work seamlessly with agentic flows, allowing AI systems to dynamically generate and update card configurations in real-time.

## **Streaming Updates**

The library supports real-time streaming updates through the `OSICardsStreamingService`:

```typescript
import { OSICardsStreamingService } from 'osi-cards-lib';

const streamingService = inject(OSICardsStreamingService);

// Subscribe to streaming updates
streamingService.stream$.subscribe(update => {
  // Handle streaming update
  console.log('Streaming update:', update);
});

// Start streaming
streamingService.startStreaming(config);
```

## **Dynamic Card Generation**

Cards can be generated dynamically from agent responses:

```typescript
import { CardFacadeService } from 'osi-cards-lib';

const cardFacade = inject(CardFacadeService);

// Generate card from agent response
async function generateCardFromAgent(agentResponse: string) {
  const cardConfig = await parseAgentResponse(agentResponse);
  const card = await cardFacade.createCard(cardConfig);
  return card;
}
```

## **Real-time Updates**

Update cards in real-time as agents process data:

```typescript
import { CardFacadeService } from 'osi-cards-lib';

const cardFacade = inject(CardFacadeService);

// Update card as agent processes
async function updateCardProgressively(cardId: string, updates: Partial<AICardConfig>) {
  await cardFacade.updateCard(cardId, updates);
}
```

## **Event Integration**

Integrate with agent workflows through the event system:

```typescript
import { EventMiddlewareService } from 'osi-cards-lib';

const eventService = inject(EventMiddlewareService);

// Add middleware to send events to agent
const agentMiddleware = eventService.createTransformMiddleware(event => {
  // Send to agent workflow
  sendToAgent({
    type: 'card_interaction',
    data: event
  });
  
  return event;
});

eventService.addMiddleware(agentMiddleware);
```

## **Streaming Configuration**

Configure streaming behavior:

```typescript
import { OSICardsStreamingService } from 'osi-cards-lib';

const streamingService = inject(OSICardsStreamingService);

// Configure streaming
streamingService.configure({
  bufferSize: 100,
  flushInterval: 1000,
  enableBatching: true
});
```

## **Best Practices**

1. **Incremental Updates**: Send incremental updates rather than full card replacements
2. **Error Handling**: Implement robust error handling for network failures
3. **State Management**: Use the streaming service's state management features
4. **Performance**: Batch updates when possible to reduce rendering overhead

## **Example: Agent Integration**

```typescript
import { Component, inject } from '@angular/core';
import { 
  CardFacadeService, 
  OSICardsStreamingService,
  EventMiddlewareService 
} from 'osi-cards-lib';

@Component({
  selector: 'app-agent-integration',
  standalone: true,
  template: `
    <app-ai-card-renderer
      [cardConfig]="card"
      (sectionEvent)="onEvent($event)">
    </app-ai-card-renderer>
  `
})
export class AgentIntegrationComponent {
  private cardFacade = inject(CardFacadeService);
  private streaming = inject(OSICardsStreamingService);
  private events = inject(EventMiddlewareService);
  
  card: AICardConfig | null = null;
  
  ngOnInit() {
    // Subscribe to agent updates
    this.streaming.stream$.subscribe(update => {
      if (this.card) {
        this.cardFacade.updateCard(this.card.id, update);
      } else {
        this.card = this.cardFacade.createCard(update);
      }
    });
    
    // Send events to agent
    this.events.processedEvents$.subscribe(event => {
      this.sendToAgent(event);
    });
  }
  
  onEvent(event: SectionRenderEvent) {
    // Handle user interactions
  }
  
  private sendToAgent(data: any) {
    // Send to your agent workflow
  }
}
```

## **Additional Resources**

- [Streaming Service Documentation](../docs/services/streaming-service/)
- [Event System Guide](./EVENTS.md)
- [Services Documentation](./SERVICES.md)
