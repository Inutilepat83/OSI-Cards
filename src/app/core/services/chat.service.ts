import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoggingService } from './logging.service';
import { AppConfigService } from './app-config.service';

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'system';
  metadata?: Record<string, unknown>;
}

/**
 * Chat Service
 * 
 * Manages chat messages and interactions within the application.
 * This service can be extended to integrate with external chat systems,
 * messaging APIs, or real-time communication services.
 * 
 * @example
 * ```typescript
 * const chatService = inject(ChatService);
 * chatService.sendMessage('Hello, world!');
 * chatService.getMessages().subscribe(messages => {
 *   console.log('Chat messages:', messages);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly logger = inject(LoggingService);
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public readonly messages$: Observable<ChatMessage[]> = this.messagesSubject.asObservable();
  
  // Configuration for chat API integration
  private readonly chatApiUrl = this.config.ENV.API_URL ? `${this.config.ENV.API_URL}/chat` : '/api/chat';
  private readonly enableApiIntegration = this.config.FEATURES.EXPERIMENTAL || false;

  /**
   * Send a message to the chat
   * 
   * @param content - Message content to send
   * @param metadata - Optional metadata to attach to the message
   * @returns The created chat message
   */
  sendMessage(content: string, metadata?: Record<string, unknown>): ChatMessage {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      content,
      timestamp: new Date(),
      sender: 'user',
      metadata
    };

    this.logger.info('Chat message sent', 'ChatService', {
      messageId: message.id,
      contentLength: content.length,
      hasMetadata: !!metadata
    });

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);

    // Send message to chat API if integration is enabled
    if (this.enableApiIntegration) {
      this.sendMessageToApi(message).subscribe({
        next: (response) => {
          this.logger.debug('Chat message sent to API', 'ChatService', { response });
          // Optionally update message with server response
          if (response && response.id) {
            const updatedMessages = this.messagesSubject.value.map(msg =>
              msg.id === message.id ? { ...response, id: response.id } : msg
            );
            this.messagesSubject.next(updatedMessages);
          }
        },
        error: (error) => {
          this.logger.error('Failed to send chat message to API', 'ChatService', { error });
          // Message is still stored locally even if API call fails
        }
      });
    }

    return message;
  }

  /**
   * Get all chat messages
   * 
   * @returns Observable of chat messages
   */
  getMessages(): Observable<ChatMessage[]> {
    return this.messages$;
  }

  /**
   * Clear all chat messages
   */
  clearMessages(): void {
    this.logger.info('Chat messages cleared', 'ChatService');
    this.messagesSubject.next([]);
  }

  /**
   * Add a system message
   * 
   * @param content - System message content
   * @param metadata - Optional metadata
   */
  addSystemMessage(content: string, metadata?: Record<string, unknown>): void {
    const message: ChatMessage = {
      id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      content,
      timestamp: new Date(),
      sender: 'system',
      metadata
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  /**
   * Send message to chat API
   * 
   * @private
   */
  private sendMessageToApi(message: ChatMessage): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.chatApiUrl}/messages`, message).pipe(
      tap((response) => {
        this.logger.debug('Chat API response received', 'ChatService', { response });
      }),
      catchError((error) => {
        this.logger.error('Chat API error', 'ChatService', { error });
        // Return original message on error to maintain local state
        return of(message);
      })
    );
  }

  /**
   * Load chat history from API
   */
  loadChatHistory(): Observable<ChatMessage[]> {
    if (!this.enableApiIntegration) {
      return of([]);
    }

    return this.http.get<ChatMessage[]>(`${this.chatApiUrl}/messages`).pipe(
      tap((messages) => {
        this.messagesSubject.next(messages);
        this.logger.info('Chat history loaded', 'ChatService', { count: messages.length });
      }),
      catchError((error) => {
        this.logger.error('Failed to load chat history', 'ChatService', { error });
        return of([]);
      })
    );
  }

  /**
   * Delete a message
   */
  deleteMessage(messageId: string): void {
    const currentMessages = this.messagesSubject.value;
    const filtered = currentMessages.filter(msg => msg.id !== messageId);
    this.messagesSubject.next(filtered);

    if (this.enableApiIntegration) {
      this.http.delete(`${this.chatApiUrl}/messages/${messageId}`).pipe(
        catchError((error) => {
          this.logger.error('Failed to delete message from API', 'ChatService', { error });
          return of(null);
        })
      ).subscribe();
    }
  }
}


