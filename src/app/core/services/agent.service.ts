import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { LoggingService } from './logging.service';
import { AppConfigService } from './app-config.service';
import { ErrorReportingService } from './error-reporting.service';

/**
 * Agent trigger result interface
 */
export interface AgentTriggerResult {
  success: boolean;
  agentId: string;
  executionId?: string;
  message?: string;
  data?: unknown;
}

/**
 * @ngDoc AgentService
 * @name AgentService
 * @description
 * Agent Service for LLM agent integration and card generation.
 * 
 * Handles agent triggering and execution based on card actions. This service
 * integrates with external agent systems, LLM services, and workflow automation
 * tools to generate cards dynamically.
 * 
 * ## Features
 * - Agent triggering with context
 * - API integration for external agent systems
 * - Error handling and logging
 * - Execution tracking
 * 
 * ## LLM Integration
 * This service works with LLM agents to generate card configurations.
 * Agents can be triggered from card actions or programmatically.
 * 
 * @example
 * ```typescript
 * import { inject } from '@angular/core';
 * import { AgentService } from './core/services/agent.service';
 * 
 * const agentService = inject(AgentService);
 * 
 * // Trigger an agent with context
 * const result = await agentService.triggerAgent('card-generator', {
 *   prompt: 'Generate a company card for Acme Corp',
 *   cardType: 'company'
 * });
 * 
 * if (result.success) {
 *   console.log('Agent executed:', result.executionId);
 * }
 * ```
 * 
 * @see {@link LLMStreamingService} for streaming card generation
 * @see {@link ChatService} for chat-based interactions
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private readonly logger = inject(LoggingService);
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly errorReporting = inject(ErrorReportingService);
  
  // Configuration for agent API integration
  private readonly agentApiUrl = this.config.ENV.API_URL ? `${this.config.ENV.API_URL}/agents` : '/api/agents';
  private readonly enableApiIntegration = this.config.FEATURES.EXPERIMENTAL || false;

  /**
   * Trigger an agent with the provided context
   * 
   * @param agentId - Unique identifier for the agent to trigger
   * @param context - Optional context data to pass to the agent
   * @returns Promise that resolves with the agent trigger result
   */
  async triggerAgent(agentId?: string, context?: Record<string, unknown>): Promise<AgentTriggerResult> {
    const finalAgentId = agentId || 'default';
    
    this.logger.info('Agent triggered', 'AgentService', {
      agentId: finalAgentId,
      context
    });

    // Send to API if integration is enabled
    if (this.enableApiIntegration && agentId) {
      try {
        const result = await this.triggerAgentViaApi(finalAgentId, context).toPromise();
        return result || { success: false, agentId: finalAgentId, message: 'No response from agent API' };
      } catch (error) {
        this.errorReporting.captureError(error, {
          component: 'AgentService',
          action: 'triggerAgent',
          state: { agentId: finalAgentId, context }
        });
        return {
          success: false,
          agentId: finalAgentId,
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Local execution (placeholder for future internal agent system)
    this.logger.debug('Agent executed locally', 'AgentService', {
      agentId: finalAgentId,
      context
    });

    return {
      success: true,
      agentId: finalAgentId,
      message: 'Agent triggered successfully (local execution)'
    };
  }

  /**
   * Trigger agent via API
   * 
   * @private
   */
  private triggerAgentViaApi(agentId: string, context?: Record<string, unknown>): Observable<AgentTriggerResult> {
    return this.http.post<AgentTriggerResult>(`${this.agentApiUrl}/${agentId}/trigger`, {
      context,
      timestamp: new Date().toISOString()
    }).pipe(
      tap((result) => {
        this.logger.info('Agent API response received', 'AgentService', { result });
      }),
      catchError((error) => {
        this.logger.error('Agent API error', 'AgentService', { error, agentId });
        return throwError(() => error);
      })
    );
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentId: string): Observable<{ status: string; lastExecution?: Date }> {
    if (!this.enableApiIntegration) {
      return of({ status: 'unknown' });
    }

    return this.http.get<{ status: string; lastExecution?: string }>(`${this.agentApiUrl}/${agentId}/status`).pipe(
      map((response) => ({
        status: response.status,
        lastExecution: response.lastExecution ? new Date(response.lastExecution) : undefined
      })),
      catchError((error) => {
        this.logger.error('Failed to get agent status', 'AgentService', { error, agentId });
        return of({ status: 'error' });
      })
    );
  }

  /**
   * Cancel agent execution
   */
  cancelAgent(executionId: string): Observable<boolean> {
    if (!this.enableApiIntegration) {
      return of(false);
    }

    return this.http.post<{ cancelled: boolean }>(`${this.agentApiUrl}/cancel`, { executionId }).pipe(
      map((response) => response.cancelled),
      catchError((error) => {
        this.logger.error('Failed to cancel agent', 'AgentService', { error, executionId });
        return of(false);
      })
    );
  }
}


