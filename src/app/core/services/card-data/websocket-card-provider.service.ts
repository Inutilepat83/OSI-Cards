import { Injectable, inject } from '@angular/core';
import { Observable, Subject, BehaviorSubject, NEVER } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { map, catchError, retry, tap } from 'rxjs/operators';
import { AICardConfig } from '../../../models';
import { CardDataProvider } from './card-data-provider.interface';

/**
 * WebSocket-based card data provider for real-time updates
 * Connects to a WebSocket server to receive live card data
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketCardProvider extends CardDataProvider {
  private socket$?: WebSocketSubject<any>;
  private cardsSubject = new BehaviorSubject<AICardConfig[]>([]);
  private updatesSubject = new Subject<{
    type: 'created' | 'updated' | 'deleted';
    card: AICardConfig;
  }>();

  private isConnected = false;
  private wsUrl = 'ws://localhost:8080/cards'; // Configure as needed

  override get supportsRealtime(): boolean {
    return true;
  }

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

    this.socket$ = webSocket({
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
      next: (message) => this.handleMessage(message),
      error: (error) => {
        console.error('WebSocket subscription error:', error);
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

  private sendMessage(message: any): void {
    if (this.socket$ && this.isConnected) {
      this.socket$.next(message);
    }
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'all_cards':
        this.cardsSubject.next(message.data || []);
        break;
      
      case 'card_created':
        const currentCards = this.cardsSubject.value;
        this.cardsSubject.next([...currentCards, message.data]);
        this.updatesSubject.next({
          type: 'created',
          card: message.data
        });
        break;
      
      case 'card_updated':
        const updatedCards = this.cardsSubject.value.map(card => 
          card.id === message.data.id ? message.data : card
        );
        this.cardsSubject.next(updatedCards);
        this.updatesSubject.next({
          type: 'updated',
          card: message.data
        });
        break;
      
      case 'card_deleted':
        const filteredCards = this.cardsSubject.value.filter(card => 
          card.id !== message.data.id
        );
        this.cardsSubject.next(filteredCards);
        this.updatesSubject.next({
          type: 'deleted',
          card: message.data
        });
        break;
      
      default:
        console.warn('Unknown WebSocket message type:', message.type);
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
