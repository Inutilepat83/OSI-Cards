import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggingService } from './logging.service';

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
  private readonly messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public readonly messages$: Observable<ChatMessage[]> = this.messagesSubject.asObservable();

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

    // TODO: Implement actual chat message logic
    // This could integrate with:
    // - External chat APIs
    // - Real-time messaging services
    // - LLM services for intelligent responses
    // - WebSocket connections for live chat
    
    // Placeholder implementation
    // Future: Make API call to chat service
    // await this.http.post('/api/chat/messages', message);

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
}

