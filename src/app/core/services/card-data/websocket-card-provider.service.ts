import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject, NEVER, EMPTY, from } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { map, catchError, retry, concatMap, delay } from 'rxjs/operators';
import { AICardConfig, CardSection } from '../../../models';
import { CardDataProvider } from './card-data-provider.interface';

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

type OutboundSocketMessage = GetAllCardsMessage | CreateCardMessage | UpdateCardMessage | DeleteCardMessage;

type SocketMessage = InboundSocketMessage | OutboundSocketMessage;

/**
 * WebSocket-based card data provider for real-time updates
 * Connects to a WebSocket server to receive live card data
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketCardProvider extends CardDataProvider {
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
          console.log('WebSocket connection opened');
          this.isConnected = true;
          // Request initial card data
          this.sendMessage({ type: 'get_all_cards' });
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket connection closed');
          this.isConnected = false;
        }
      }
    });

    // Handle incoming messages
    this.socket$.pipe(
      retry({ delay: 5000, count: 5 }),
      catchError(error => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        return NEVER;
      })
    ).subscribe({
      next: message => {
        if (this.isInboundMessage(message)) {
          this.handleMessage(message);
        } else {
          console.warn('Received unexpected WebSocket payload:', message);
        }
      },
      error: subscriptionError => {
        console.error('WebSocket subscription error:', subscriptionError);
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
        console.warn('Unknown WebSocket message payload:', exhaustiveCheck);
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

  /**
   * Get all cards with streaming (progressive loading)
   * WebSocket provider supports incremental card updates
   */
  override getAllCardsStreaming(): Observable<AICardConfig> {
    // Return incremental updates from WebSocket
    if (!this.isConnected) {
      this.connect();
    }
    
    // Emit existing cards first, then listen for updates
    return new Observable<AICardConfig>(observer => {
      // Emit current cards
      const currentCards = this.cardsSubject.value;
      currentCards.forEach(card => observer.next(card));

      // Subscribe to updates
      const subscription = this.updatesSubject.subscribe(update => {
        if (update.type === 'created' || update.type === 'updated') {
          observer.next(update.card);
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Get card sections with streaming (progressive section loading)
   * Supports section-level streaming from WebSocket
   */
  override getCardSectionsStreaming(cardId: string): Observable<CardSection> {
    // Request section streaming from server
    if (!this.isConnected) {
      this.connect();
    }

    // Send request for section streaming
    this.sendMessage({
      type: 'stream_card_sections',
      data: { id: cardId }
    } as any);

    // Listen for section updates
    return new Observable<CardSection>(observer => {
      // First, get the full card to extract sections
      this.getCardById(cardId).subscribe(card => {
        if (!card?.sections) {
          observer.complete();
          return;
        }

        // Stream sections with delay for visual effect
        from(card.sections).pipe(
          concatMap((section, index) => 
            from([section]).pipe(delay(index * 80)) // 80ms between sections
          )
        ).subscribe({
          next: section => observer.next(section),
          complete: () => observer.complete(),
          error: err => observer.error(err)
        });
      });

      // Also listen for real-time section updates
      const subscription = this.updatesSubject.subscribe(update => {
        if (update.type === 'updated' && update.card.id === cardId && update.card.sections) {
          // Emit new sections as they arrive
          update.card.sections.forEach(section => observer.next(section));
        }
      });

      return () => subscription.unsubscribe();
    });
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
