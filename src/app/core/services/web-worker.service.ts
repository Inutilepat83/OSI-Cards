import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { filter, map, timeout } from 'rxjs/operators';
import { AICardConfig } from '../../models/card.model';

export interface WorkerTask {
  id: string;
  type: string;
  payload: any;
  priority: 'low' | 'medium' | 'high';
  timeout?: number;
  retries?: number;
}

export interface WorkerResult {
  id: string;
  type: string;
  payload: any;
  error?: string;
  processingTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebWorkerService {
  private workers: Worker[] = [];
  private maxWorkers = navigator.hardwareConcurrency || 4;
  private currentWorkerIndex = 0;
  private isSupported = typeof Worker !== 'undefined';
  
  // Task management
  private taskQueue: WorkerTask[] = [];
  private activeTasks = new Map<string, WorkerTask>();
  private taskResults = new Subject<WorkerResult>();
  private workerStats = new BehaviorSubject({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageProcessingTime: 0,
    activeWorkers: 0
  });

  constructor() {
    this.initializeWorkers();
  }

  // Main public interface
  processCards(cards: AICardConfig[], priority: 'low' | 'medium' | 'high' = 'medium'): Observable<any> {
    return this.executeTask({
      id: this.generateTaskId(),
      type: 'PROCESS_CARDS',
      payload: { cards },
      priority,
      timeout: 30000 // 30 seconds
    });
  }

  validateCardConfig(config: AICardConfig): Observable<any> {
    return this.executeTask({
      id: this.generateTaskId(),
      type: 'VALIDATE_CONFIG',
      payload: { config },
      priority: 'high',
      timeout: 5000
    });
  }

  generateAnalytics(cards: AICardConfig[]): Observable<any> {
    return this.executeTask({
      id: this.generateTaskId(),
      type: 'GENERATE_ANALYTICS',
      payload: { cards },
      priority: 'low',
      timeout: 60000 // 1 minute for analytics
    });
  }

  optimizeImages(images: { url: string; quality: number }[]): Observable<any> {
    return this.executeTask({
      id: this.generateTaskId(),
      type: 'OPTIMIZE_IMAGES',
      payload: { images },
      priority: 'medium',
      timeout: 45000
    });
  }

  filterCards(cards: AICardConfig[], filters: any): Observable<any> {
    return this.executeTask({
      id: this.generateTaskId(),
      type: 'FILTER_CARDS',
      payload: { cards, filters },
      priority: 'high',
      timeout: 10000
    });
  }

  sortCards(cards: AICardConfig[], sortBy: string, sortOrder: 'asc' | 'desc'): Observable<any> {
    return this.executeTask({
      id: this.generateTaskId(),
      type: 'SORT_CARDS',
      payload: { cards, sortBy, sortOrder },
      priority: 'high',
      timeout: 10000
    });
  }

  // Worker management
  getWorkerStats(): Observable<any> {
    return this.workerStats.asObservable();
  }

  isWebWorkerSupported(): boolean {
    return this.isSupported;
  }

  // Fallback for environments without web worker support
  processCardsFallback(cards: AICardConfig[]): Observable<any> {
    return new Observable(observer => {
      setTimeout(() => {
        // Simplified synchronous processing
        const processedCards = cards.map(card => ({
          ...card,
          processedAt: Date.now(),
          complexity: this.calculateComplexityFallback(card)
        }));

        observer.next({
          type: 'CARDS_PROCESSED',
          payload: { cards: processedCards }
        });
        observer.complete();
      }, 100);
    });
  }

  // Private methods
  private initializeWorkers(): void {
    if (!this.isSupported) {
      console.warn('Web Workers not supported. Falling back to main thread processing.');
      return;
    }

    try {
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = new Worker(new URL('../workers/card-processing.worker.ts', import.meta.url), {
          type: 'module'
        });
        
        worker.onmessage = (event) => {
          this.handleWorkerMessage(event.data);
        };
        
        worker.onerror = (error) => {
          console.error('Worker error:', error);
          this.handleWorkerError(error);
        };
        
        this.workers.push(worker);
      }

      this.updateWorkerStats();
    } catch (error) {
      console.error('Failed to initialize workers:', error);
      this.isSupported = false;
    }
  }

  private executeTask(task: WorkerTask): Observable<WorkerResult> {
    if (!this.isSupported) {
      return this.executeFallback(task);
    }

    return new Observable(observer => {
      // Add task to queue and active tasks
      this.taskQueue.push(task);
      this.activeTasks.set(task.id, task);
      
      // Process queue
      this.processTaskQueue();
      
      // Listen for results
      const subscription = this.taskResults.pipe(
        filter(result => result.id === task.id),
        timeout(task.timeout || 30000),
        map(result => {
          this.activeTasks.delete(task.id);
          this.updateWorkerStats();
          return result;
        })
      ).subscribe({
        next: (result) => {
          if (result.error) {
            observer.error(new Error(result.error));
          } else {
            observer.next(result);
            observer.complete();
          }
          subscription.unsubscribe();
        },
        error: (error) => {
          this.activeTasks.delete(task.id);
          this.updateWorkerStats();
          observer.error(error);
          subscription.unsubscribe();
        }
      });
    });
  }

  private processTaskQueue(): void {
    if (this.taskQueue.length === 0) return;

    // Sort by priority
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Assign tasks to available workers
    while (this.taskQueue.length > 0 && this.getAvailableWorker()) {
      const task = this.taskQueue.shift()!;
      const worker = this.getAvailableWorker()!;
      
      worker.postMessage({
        id: task.id,
        type: task.type,
        payload: task.payload
      });
    }
  }

  private getAvailableWorker(): Worker | null {
    if (this.workers.length === 0) return null;
    
    // Simple round-robin assignment
    const worker = this.workers[this.currentWorkerIndex];
    this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  private handleWorkerMessage(data: WorkerResult): void {
    this.taskResults.next(data);
    
    // Update statistics
    const stats = this.workerStats.value;
    stats.completedTasks++;
    if (data.error) {
      stats.failedTasks++;
    }
    
    // Update average processing time
    const totalCompleted = stats.completedTasks;
    stats.averageProcessingTime = 
      (stats.averageProcessingTime * (totalCompleted - 1) + data.processingTime) / totalCompleted;
    
    this.workerStats.next(stats);
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('Worker encountered an error:', error);
    
    const stats = this.workerStats.value;
    stats.failedTasks++;
    this.workerStats.next(stats);
  }

  private updateWorkerStats(): void {
    const stats = this.workerStats.value;
    stats.totalTasks = stats.completedTasks + stats.failedTasks + this.activeTasks.size;
    stats.activeWorkers = this.workers.length;
    this.workerStats.next({ ...stats });
  }

  private executeFallback(task: WorkerTask): Observable<WorkerResult> {
    // Fallback implementation for when web workers are not available
    return new Observable(observer => {
      setTimeout(() => {
        const startTime = performance.now();
        
        try {
          let result: any;
          
          switch (task.type) {
            case 'PROCESS_CARDS':
              result = this.processCardsFallbackSync(task.payload.cards);
              break;
            case 'VALIDATE_CONFIG':
              result = this.validateCardConfigFallbackSync(task.payload.config);
              break;
            case 'FILTER_CARDS':
              result = this.filterCardsFallbackSync(task.payload.cards, task.payload.filters);
              break;
            case 'SORT_CARDS':
              result = this.sortCardsFallbackSync(task.payload.cards, task.payload.sortBy, task.payload.sortOrder);
              break;
            default:
              throw new Error(`Unsupported task type: ${task.type}`);
          }
          
          observer.next({
            id: task.id,
            type: task.type + '_COMPLETED',
            payload: result,
            processingTime: performance.now() - startTime
          });
          observer.complete();
        } catch (error) {
          observer.next({
            id: task.id,
            type: 'ERROR',
            payload: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTime: performance.now() - startTime
          });
          observer.complete();
        }
      }, 0);
    });
  }

  private processCardsFallbackSync(cards: AICardConfig[]): any {
    return {
      cards: cards.map(card => ({
        ...card,
        processedAt: Date.now(),
        complexity: this.calculateComplexityFallback(card)
      }))
    };
  }

  private validateCardConfigFallbackSync(config: AICardConfig): any {
    const errors: string[] = [];
    if (!config.cardTitle) errors.push('Title required');
    if (!config.sections || config.sections.length === 0) errors.push('At least one section required');
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      suggestions: []
    };
  }

  private filterCardsFallbackSync(cards: AICardConfig[], filters: any): any {
    let filtered = [...cards];
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(card => 
        card.cardTitle.toLowerCase().includes(query)
      );
    }
    
    return { cards: filtered };
  }

  private sortCardsFallbackSync(cards: AICardConfig[], sortBy: string, sortOrder: 'asc' | 'desc'): any {
    const sorted = [...cards].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'title') {
        comparison = a.cardTitle.localeCompare(b.cardTitle);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return { cards: sorted };
  }

  private calculateComplexityFallback(card: AICardConfig): number {
    const sectionCount = card.sections?.length || 0;
    const fieldCount = card.sections?.reduce((sum, section) => sum + (section.fields?.length || 0), 0) || 0;
    return Math.min((sectionCount + fieldCount) / 20, 1);
  }

  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  terminateWorkers(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.activeTasks.clear();
    this.taskQueue = [];
  }
}
