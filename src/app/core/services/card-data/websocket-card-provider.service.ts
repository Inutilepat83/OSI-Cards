import { Injectable, inject } from '@angular/core';
import { Observable, Subject, BehaviorSubject, NEVER } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { map, catchError, retry } from 'rxjs/operators';
import { AICardConfig } from '../../../models';
import { CardDataProvider } from './card-data-provider.interface';
import { LoggingService } from '../logging.service';

interface AllCardsMessage {
  type: 'all_cards';
  data: AICardConfig[];
}

interface CardCreatedMessage {
  type: 'card_created';
  data: AICardConfig;
}

interface CardUpdatedMessage {
  type: 'card_updated';
  data: AICardConfig;
}

interface CardDeletedMessage {
  type: 'card_deleted';
  data: AICardConfig;
}

type InboundSocketMessage = AllCardsMessage | CardCreatedMessage | CardUpdatedMessage | CardDeletedMessage;

interface GetAllCardsMessage {
  type: 'get_all_cards';
}

interface CreateCardMessage {
  type: 'create_card';
  data: AICardConfig;
}

interface UpdateCardMessage {
  type: 'update_card';
  data: AICardConfig;
}

interface DeleteCardMessage {
  type: 'delete_card';
  data: { id: string };
}

interface StreamCardSectionsMessage {
  type: 'stream_card_sections';
  data: { id: string };
}

type OutboundSocketMessage =
  | GetAllCardsMessage
  | CreateCardMessage
  | UpdateCardMessage
  | DeleteCardMessage
  | StreamCardSectionsMessage;

type SocketMessage = InboundSocketMessage | OutboundSocketMessage;

/**
 * WebSocket-based card data provider for real-time updates
 * Connects to a WebSocket server to receive live card data
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketCardProvider extends CardDataProvider {
  private readonly logger = inject(LoggingService);
  private socket$?: WebSocketSubject<SocketMessage>;
  private cardsSubject = new BehaviorSubject<AICardConfig[]>([]);
  private updatesSubject = new Subject<{
    type: 'created' | 'updated' | 'deleted';
    card: AICardConfig;
  }>();

  private isConnected = false;
  private wsUrl = 'ws://localhost:8080/cards'; // Configure as needed

  override readonly supportsRealtime = true;

  override initialize(): void {
    this.connect();
  }

  override destroy(): void {
    this.disconnect();
  }

  private connect(): void {
    if (this.isConnected) {
      return;
    }

  this.socket$ = webSocket<SocketMessage>({
      url: this.wsUrl,
      openObserver: {
        next: () => {
          this.logger.info('WebSocket connection opened', 'WebSocketCardProvider');
          this.isConnected = true;
          // Request initial card data
          this.sendMessage({ type: 'get_all_cards' });
        }
      },
      closeObserver: {
        next: () => {
          this.logger.info('WebSocket connection closed', 'WebSocketCardProvider');
          this.isConnected = false;
        }
      }
    });

    // Handle incoming messages
    this.socket$.pipe(
      retry({ delay: 5000, count: 5 }),
      catchError(error => {
        this.logger.error('WebSocket error', 'WebSocketCardProvider', error);
        this.isConnected = false;
        return NEVER;
      })
    ).subscribe({
      next: message => {
        if (this.isInboundMessage(message)) {
          this.handleMessage(message);
        } else {
          this.logger.warn('Received unexpected WebSocket payload', 'WebSocketCardProvider', message);
        }
      },
      error: subscriptionError => {
        this.logger.error('WebSocket subscription error', 'WebSocketCardProvider', subscriptionError);
        this.isConnected = false;
      }
    });
  }

  private disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
    this.isConnected = false;
  }

  private sendMessage(message: OutboundSocketMessage): void {
    if (this.socket$ && this.isConnected) {
      this.socket$.next(message);
    }
  }

  private isInboundMessage(message: SocketMessage): message is InboundSocketMessage {
    if (!message || typeof message !== 'object') {
      return false;
    }

    const type = (message as { type?: unknown }).type;
    return type === 'all_cards' || type === 'card_created' || type === 'card_updated' || type === 'card_deleted';
  }

  private handleMessage(message: InboundSocketMessage): void {
    switch (message.type) {
      case 'all_cards': {
        this.cardsSubject.next(Array.isArray(message.data) ? message.data : []);
        break;
      }

      case 'card_created': {
        const currentCards = this.cardsSubject.value;
        this.cardsSubject.next([...currentCards.filter(card => card.id !== message.data.id), message.data]);
        this.updatesSubject.next({
          type: 'created',
          card: message.data
        });
        break;
      }

      case 'card_updated': {
        const updatedCards = this.cardsSubject.value.map(card =>
          card.id === message.data.id ? message.data : card
        );
        this.cardsSubject.next(updatedCards);
        this.updatesSubject.next({
          type: 'updated',
          card: message.data
        });
        break;
      }

      case 'card_deleted': {
        const filteredCards = this.cardsSubject.value.filter(card =>
          card.id !== message.data.id
        );
        this.cardsSubject.next(filteredCards);
        this.updatesSubject.next({
          type: 'deleted',
          card: message.data
        });
        break;
      }

      default: {
        const exhaustiveCheck: never = message;
        this.logger.warn('Unknown WebSocket message payload', 'WebSocketCardProvider', exhaustiveCheck);
      }
    }
  }

  getAllCards(): Observable<AICardConfig[]> {
    if (!this.isConnected) {
      this.connect();
    }
    return this.cardsSubject.asObservable();
  }

  getCardsByType(cardType: string): Observable<AICardConfig[]> {
    return this.getAllCards().pipe(
      map(cards => cards.filter(card => card.cardType === cardType))
    );
  }

  getCardById(id: string): Observable<AICardConfig | null> {
    return this.getAllCards().pipe(
      map(cards => cards.find(card => card.id === id) || null)
    );
  }


  override subscribeToUpdates(): Observable<{
    type: 'created' | 'updated' | 'deleted';
    card: AICardConfig;
  }> {
    if (!this.isConnected) {
      this.connect();
    }
    return this.updatesSubject.asObservable();
  }

  /**
   * Send a new card to the server
   */
  createCard(card: AICardConfig): void {
    this.sendMessage({
      type: 'create_card',
      data: card
    });
  }

  /**
   * Update an existing card on the server
   */
  updateCard(card: AICardConfig): void {
    this.sendMessage({
      type: 'update_card',
      data: card
    });
  }

  /**
   * Delete a card on the server
   */
  deleteCard(cardId: string): void {
    this.sendMessage({
      type: 'delete_card',
      data: { id: cardId }
    });
  }

  /**
   * Check connection status
   */
  get isConnectedToServer(): boolean {
    return this.isConnected;
  }

  /**
   * Configure WebSocket URL
   */
  configureWebSocketUrl(url: string): void {
    if (this.isConnected) {
      this.disconnect();
    }
    this.wsUrl = url;
  }
}
