import { Injectable, OnDestroy } from '@angular/core';
import { AICardConfig } from '../../models';
import { CardChangeType, CardDiffUtil } from 'projects/osi-cards-lib/src/lib/utils/card-diff.util';

/**
 * Web Worker Service
 * Manages Web Workers for heavy computations
 */
@Injectable({
  providedIn: 'root',
})
export class WorkerService implements OnDestroy {
  private cardProcessingWorker: Worker | null = null;
  private workerSupported = typeof Worker !== 'undefined';

  /**
   * Initialize card processing worker
   */
  initializeWorker(): void {
    if (!this.workerSupported || this.cardProcessingWorker) {
      return;
    }

    try {
      // Create worker from blob (Angular doesn't support ?worker syntax directly)
      this.createWorkerFromBlob();
    } catch (error) {
      console.warn('Failed to initialize worker, falling back to main thread', error);
      this.workerSupported = false;
    }
  }

  /**
   * Process card diff in worker (if available) or main thread
   */
  async processCardDiff(
    oldCard: AICardConfig | null,
    newCard: AICardConfig
  ): Promise<{ changeType: CardChangeType; hasChanges: boolean }> {
    if (!this.workerSupported || !this.cardProcessingWorker) {
      // Fallback to main thread
      return CardDiffUtil.diffCards(oldCard, newCard);
    }

    try {
      const response = await this.sendWorkerMessage({
        type: 'PROCESS_CARD_DIFF',
        payload: { oldCard, newCard },
      });

      return response.payload as { changeType: CardChangeType; hasChanges: boolean };
    } catch (error) {
      console.warn('Worker processing failed, using main thread', error);
      return CardDiffUtil.diffCards(oldCard, newCard);
    }
  }

  /**
   * Normalize card data in worker
   */
  async normalizeCard(card: AICardConfig): Promise<AICardConfig> {
    if (!this.workerSupported || !this.cardProcessingWorker) {
      return card; // No normalization needed if worker unavailable
    }

    try {
      const response = await this.sendWorkerMessage({
        type: 'NORMALIZE_CARD',
        payload: { card },
      });

      return response.payload as AICardConfig;
    } catch (error) {
      console.warn('Worker normalization failed', error);
      return card;
    }
  }

  /**
   * Send message to worker
   */
  private sendWorkerMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.cardProcessingWorker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const requestId = `${Date.now()}-${Math.random()}`;
      message.requestId = requestId;

      const timeout = setTimeout(() => {
        this.cardProcessingWorker?.removeEventListener('message', handler);
        reject(new Error('Worker timeout'));
      }, 30000);

      const handler = (event: MessageEvent) => {
        if (event.data.requestId === requestId) {
          clearTimeout(timeout);
          this.cardProcessingWorker?.removeEventListener('message', handler);

          if (event.data.type === 'ERROR') {
            reject(new Error(event.data.error || 'Worker error'));
          } else {
            resolve(event.data);
          }
        }
      };

      this.cardProcessingWorker.addEventListener('message', handler);
      this.cardProcessingWorker.postMessage(message);
    });
  }

  /**
   * Create worker from blob (fallback)
   */
  private createWorkerFromBlob(): void {
    const workerCode = `
      function processCardDiff(oldCard, newCard) {
        const changes = [];
        if (oldCard && oldCard.cardTitle !== newCard.cardTitle) {
          changes.push('title');
        }
        if (oldCard && oldCard.sections?.length !== newCard.sections?.length) {
          changes.push('sections');
        }
        return {
          hasChanges: changes.length > 0,
          changes: changes,
          changeType: changes.length > 0 ? 'content' : 'none'
        };
      }

      function normalizeCardData(card) {
        return {
          ...card,
          sections: card.sections?.map((section) => ({
            ...section,
            id: section.id || section.type + '-' + Date.now()
          })) || []
        };
      }

      self.addEventListener('message', (event) => {
        const { type, payload } = event.data;
        let result;

        try {
          switch (type) {
            case 'PROCESS_CARD_DIFF':
              result = processCardDiff(payload.oldCard, payload.newCard);
              break;
            case 'NORMALIZE_CARD':
              result = normalizeCardData(payload.card);
              break;
            case 'BATCH_PROCESS':
              result = payload.cards.map((card) => normalizeCardData(card));
              break;
            default:
              throw new Error('Unknown worker task: ' + type);
          }

          self.postMessage({
            type: type + '_RESULT',
            payload: result,
            requestId: event.data.requestId
          });
        } catch (error) {
          self.postMessage({
            type: 'ERROR',
            error: error.message || 'Unknown error',
            requestId: event.data.requestId
          });
        }
      });
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    this.cardProcessingWorker = new Worker(url);
  }

  ngOnDestroy(): void {
    if (this.cardProcessingWorker) {
      this.cardProcessingWorker.terminate();
      this.cardProcessingWorker = null;
    }
  }
}
