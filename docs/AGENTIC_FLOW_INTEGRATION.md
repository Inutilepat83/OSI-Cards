# OSI Cards Library - Agentic Flow Integration Guide

This guide explains how to integrate OSI Cards library with LLM-powered agentic flows, where router-triggered agents generate card data progressively during LLM responses.

## Overview

In an agentic flow integration:

1. **LLM Response** triggers a router action
2. **Router** calls an agentic flow service
3. **Agent Flow** starts executing and instantiates a card
4. **JSON Stream** flows from agent as it executes
5. **Card Component** receives partial JSON and updates progressively
6. **Card Completes** when agent flow finishes

## Architecture Flow

```
┌─────────────────┐
│  LLM Response   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Router Trigger │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Agent Flow Start│
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ Card Instantiate│◄─────┤  Card Component  │
└────────┬────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐
│  JSON Stream    │──────► Progressive Updates
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Card Complete  │
└─────────────────┘
```

## Quick Start

### Step 1: Configure Providers

Ensure you have the library providers configured in your `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards(), // Required for animations
    // ... other providers
  ],
};
```

### Step 2: Create Agent Flow Service

Create a service that executes agentic flows and emits JSON streams:

```typescript
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AICardConfig } from 'osi-cards-lib';

@Injectable({ providedIn: 'root' })
export class AgentFlowService {
  /**
   * Execute an agentic flow and emit card configuration progressively
   */
  executeAgentFlow(agentPrompt: string, context?: any): Observable<Partial<AICardConfig>> {
    const subject = new Subject<Partial<AICardConfig>>();

    // Simulate agent flow execution
    // In real implementation, this would connect to your LLM/agent system
    this.executeFlow(agentPrompt, context, (partialCard) => {
      subject.next(partialCard);
    })
      .then((completeCard) => {
        subject.next(completeCard);
        subject.complete();
      })
      .catch((error) => {
        subject.error(error);
      });

    return subject.asObservable();
  }

  private async executeFlow(
    prompt: string,
    context: any,
    onUpdate: (partial: Partial<AICardConfig>) => void
  ): Promise<AICardConfig> {
    // Your agent flow implementation
    // This is a placeholder - replace with your actual agent execution

    // Example: Emit initial card structure
    onUpdate({
      cardTitle: 'Loading...',
      sections: [],
    });

    // Simulate progressive updates
    await this.delay(500);
    onUpdate({
      cardTitle: 'Company Profile',
      sections: [{ title: 'Overview', type: 'overview', fields: [] }],
    });

    await this.delay(500);
    onUpdate({
      cardTitle: 'Company Profile',
      sections: [
        {
          title: 'Overview',
          type: 'overview',
          fields: [{ label: 'Name', value: 'Acme Corp' }],
        },
      ],
    });

    // Return complete card
    return {
      cardTitle: 'Company Profile',
      sections: [
        {
          title: 'Overview',
          type: 'overview',
          fields: [
            { label: 'Name', value: 'Acme Corp' },
            { label: 'Industry', value: 'Technology' },
          ],
        },
      ],
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### Step 3: Create Router-Triggered Component

Create a component that handles router-triggered agent flows:

```typescript
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AICardRendererComponent, AICardConfig, StreamingStage } from 'osi-cards-lib';
import { AgentFlowService } from './agent-flow.service';
import { merge, scan } from 'rxjs';

@Component({
  selector: 'app-agent-card-view',
  standalone: true,
  imports: [AICardRendererComponent],
  template: `
    <div class="card-container">
      <app-ai-card-renderer
        [cardConfig]="cardConfig"
        [streamingStage]="streamingStage"
        (fieldInteraction)="onFieldInteraction($event)"
      >
      </app-ai-card-renderer>
    </div>
  `,
})
export class AgentCardViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private agentFlowService = inject(AgentFlowService);
  private cdr = inject(ChangeDetectorRef);

  cardConfig: AICardConfig | null = null;
  streamingStage: StreamingStage = 'idle';

  ngOnInit(): void {
    // Get agent prompt from route params or query params
    const agentPrompt =
      this.route.snapshot.queryParams['prompt'] || this.route.snapshot.params['prompt'];

    if (agentPrompt) {
      this.executeAgentFlow(agentPrompt);
    }
  }

  private executeAgentFlow(prompt: string): void {
    this.streamingStage = 'thinking';
    this.cdr.markForCheck();

    // Initialize with empty card
    this.cardConfig = {
      cardTitle: 'Loading...',
      sections: [],
    };

    // Execute agent flow and accumulate updates
    this.agentFlowService
      .executeAgentFlow(prompt)
      .pipe(
        scan((acc: AICardConfig, update: Partial<AICardConfig>) => {
          // Merge partial updates into accumulated card
          return this.mergeCardConfig(acc, update);
        }, this.cardConfig)
      )
      .subscribe({
        next: (card) => {
          this.cardConfig = card;
          this.streamingStage = 'streaming';
          this.cdr.markForCheck();
        },
        complete: () => {
          this.streamingStage = 'complete';
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.streamingStage = 'error';
          console.error('Agent flow error:', error);
          this.cdr.markForCheck();
        },
      });
  }

  private mergeCardConfig(existing: AICardConfig, update: Partial<AICardConfig>): AICardConfig {
    return {
      ...existing,
      ...update,
      sections: update.sections || existing.sections,
    };
  }

  onFieldInteraction(event: any): void {
    console.log('Field interaction:', event);
  }
}
```

### Step 4: Configure Router

Add route configuration to trigger agent flows:

```typescript
import { Routes } from '@angular/router';
import { AgentCardViewComponent } from './agent-card-view.component';

export const routes: Routes = [
  {
    path: 'agent-card/:prompt',
    component: AgentCardViewComponent,
  },
  {
    path: 'agent-card',
    component: AgentCardViewComponent,
    // Can also use query params: /agent-card?prompt=...
  },
];
```

## Advanced Patterns

### Progressive Section Building

For agents that build sections incrementally:

```typescript
private mergeCardConfig(
  existing: AICardConfig,
  update: Partial<AICardConfig>
): AICardConfig {
  const merged: AICardConfig = {
    ...existing,
    ...update
  };

  // Merge sections progressively
  if (update.sections) {
    const sectionMap = new Map(
      existing.sections.map(s => [s.id || s.title, s])
    );

    update.sections.forEach(updateSection => {
      const key = updateSection.id || updateSection.title;
      const existingSection = sectionMap.get(key);

      if (existingSection) {
        // Merge fields into existing section
        sectionMap.set(key, {
          ...existingSection,
          ...updateSection,
          fields: [
            ...(existingSection.fields || []),
            ...(updateSection.fields || [])
          ]
        });
      } else {
        // Add new section
        sectionMap.set(key, updateSection);
      }
    });

    merged.sections = Array.from(sectionMap.values());
  }

  return merged;
}
```

### Agent Flow States

Track agent execution states:

```typescript
type AgentFlowState =
  | { status: 'idle' }
  | { status: 'thinking' }
  | { status: 'streaming'; card: Partial<AICardConfig> }
  | { status: 'complete'; card: AICardConfig }
  | { status: 'error'; error: Error };

@Component({...})
export class AgentCardViewComponent {
  flowState: AgentFlowState = { status: 'idle' };

  executeAgentFlow(prompt: string): void {
    this.flowState = { status: 'thinking' };

    this.agentFlowService.executeAgentFlow(prompt).subscribe({
      next: (update) => {
        this.flowState = {
          status: 'streaming',
          card: update
        };
        this.updateCardConfig(update);
      },
      complete: () => {
        this.flowState = {
          status: 'complete',
          card: this.cardConfig!
        };
      },
      error: (error) => {
        this.flowState = { status: 'error', error };
      }
    });
  }
}
```

### Error Handling and Retry

Handle agent flow failures:

```typescript
import { retry, catchError, timeout } from 'rxjs/operators';
import { of } from 'rxjs';

executeAgentFlow(prompt: string): void {
  this.agentFlowService.executeAgentFlow(prompt)
    .pipe(
      timeout(30000), // 30 second timeout
      retry({
        count: 3,
        delay: 1000
      }),
      catchError((error) => {
        console.error('Agent flow failed:', error);
        this.streamingStage = 'error';
        // Provide fallback card
        this.cardConfig = this.createErrorCard(error);
        return of(null);
      })
    )
    .subscribe({
      next: (update) => {
        if (update) {
          this.updateCardConfig(update);
        }
      }
    });
}

private createErrorCard(error: Error): AICardConfig {
  return {
    cardTitle: 'Error',
    sections: [
      {
        title: 'Error',
        type: 'info',
        fields: [
          {
            label: 'Message',
            value: error.message || 'An error occurred'
          }
        ]
      }
    ]
  };
}
```

### Router Guards for Pre-instantiation

Use route guards to pre-instantiate cards before agent starts:

```typescript
import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AgentFlowService } from './agent-flow.service';

@Injectable({ providedIn: 'root' })
export class AgentCardGuard implements CanActivate {
  private agentFlowService = inject(AgentFlowService);

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const prompt = route.params['prompt'] || route.queryParams['prompt'];

    if (prompt) {
      // Pre-validate prompt before navigating
      // Could also pre-instantiate skeleton card here
      return true;
    }

    return false;
  }
}
```

### Resolvers for Pre-loading

Use resolvers to start agent flow before component loads:

```typescript
import { Injectable, inject } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AgentFlowService } from './agent-flow.service';
import { AICardConfig } from 'osi-cards-lib';

@Injectable({ providedIn: 'root' })
export class AgentCardResolver implements Resolve<Observable<AICardConfig>> {
  private agentFlowService = inject(AgentFlowService);

  resolve(route: ActivatedRouteSnapshot): Observable<AICardConfig> {
    const prompt = route.params['prompt'] || route.queryParams['prompt'];

    if (prompt) {
      // Start agent flow immediately
      return this.agentFlowService.executeAgentFlow(prompt);
    }

    return of({ cardTitle: '', sections: [] });
  }
}
```

## Component Lifecycle During Agent Flow

### Initialization Sequence

```
1. Component Created
   ↓
2. ngOnInit() called
   ↓
3. Agent Flow Triggered
   ↓
4. Card Instantiated (empty/skeleton)
   ↓
5. StreamingStage: 'thinking'
   ↓
6. First JSON Update Received
   ↓
7. StreamingStage: 'streaming'
   ↓
8. Progressive Updates (cardConfig updates)
   ↓
9. Agent Flow Completes
   ↓
10. StreamingStage: 'complete'
```

### StreamingStage Values

- `'idle'`: Initial state, no agent active
- `'thinking'`: Agent flow started, no JSON yet
- `'streaming'`: Receiving partial JSON updates
- `'complete'`: Agent finished, card fully populated
- `'error'`: Agent flow failed
- `'aborted'`: Agent flow interrupted

## Best Practices

### 1. Initialize Card Early

Always instantiate a card structure (even if empty) before agent starts:

```typescript
this.cardConfig = {
  cardTitle: 'Loading...',
  sections: [],
};
this.streamingStage = 'thinking';
```

### 2. Use Change Detection Optimization

Use OnPush change detection and manually trigger updates:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentCardViewComponent {
  private cdr = inject(ChangeDetectorRef);

  onUpdate(card: Partial<AICardConfig>): void {
    this.cardConfig = this.mergeCardConfig(this.cardConfig, card);
    this.cdr.markForCheck(); // Trigger change detection
  }
}
```

### 3. Handle Interruptions

Allow users to cancel agent flows:

```typescript
private agentFlowSubscription?: Subscription;

executeAgentFlow(prompt: string): void {
  // Cancel previous flow if active
  this.agentFlowSubscription?.unsubscribe();

  this.agentFlowSubscription = this.agentFlowService
    .executeAgentFlow(prompt)
    .subscribe({...});
}

ngOnDestroy(): void {
  this.agentFlowSubscription?.unsubscribe();
}
```

### 4. Optimize JSON Merging

Use efficient merging strategies:

```typescript
// Good: Merge incrementally
private mergeCardConfig(existing: AICardConfig, update: Partial<AICardConfig>): AICardConfig {
  // Smart merging logic
}

// Avoid: Full replacement (causes flicker)
this.cardConfig = update as AICardConfig; // ❌ Don't do this
```

### 5. Provide Loading Feedback

Show skeleton or loading state:

```typescript
get showSkeleton(): boolean {
  return this.streamingStage === 'thinking' ||
         (this.streamingStage === 'streaming' && !this.cardConfig?.sections?.length);
}
```

## Complete Example

See `examples/agentic-flow-integration.example.ts` for a complete working example.

## Related Documentation

- [README.md](../README.md) - Library overview
- [SERVICES.md](./SERVICES.md) - Service documentation
- [IMPORT_EXAMPLE.md](../IMPORT_EXAMPLE.md) - Import examples

## Troubleshooting

### Card Not Updating

**Issue**: Card doesn't update during streaming

**Solution**:

- Ensure `ChangeDetectorRef.markForCheck()` is called after updates
- Verify `streamingStage` is being updated correctly
- Check that card merging logic preserves all fields

### Agent Flow Not Triggering

**Issue**: Router doesn't trigger agent flow

**Solution**:

- Verify route parameters are being read correctly
- Check router configuration
- Ensure component is being created on route navigation

### Performance Issues

**Issue**: Too many updates causing performance problems

**Solution**:

- Batch updates (use `debounceTime` or `throttleTime`)
- Use `OnPush` change detection
- Optimize card merging logic
- Limit update frequency from agent



