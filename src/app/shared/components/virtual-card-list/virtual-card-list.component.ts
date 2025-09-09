import { 
  Component, 
  Input, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy, 
  ViewChild, 
  ElementRef, 
  AfterViewInit,
  TrackByFunction
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Store } from '@ngrx/store';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AICardConfig } from '../../../models/card.model';
import { AICardRendererComponent } from '../ai-card-renderer.component';
import { MemoryManagementService } from '../../../core/services/memory-management.service';
// // import { PerformanceService } from '../../../core/performance/performance.service';
import { AppState } from '../../../store/app.state';
import * as PerformanceActions from '../../../store/performance/performance.actions';


export interface CardInteractionEvent {
  renderer?: unknown;
  field?: unknown;
  action?: string;
  card?: AICardConfig;
}

@Component({
  selector: 'app-virtual-card-list',
  standalone: true,
  imports: [CommonModule, ScrollingModule, AICardRendererComponent],
  template: `
    <div class="virtual-scroll-container" 
         [class.performance-mode]="performanceMode"
         [class.reduced-motion]="reducedMotion">
      
      <!-- Header with statistics -->
      <div class="scroll-header" *ngIf="showStats">
        <span class="total-count">{{ cards.length }} cards</span>
        <span class="visible-range">Showing {{ visibleRange.start + 1 }}-{{ visibleRange.end }} of {{ cards.length }}</span>
      </div>
      
      <!-- Virtual Scroll Viewport -->
      <cdk-virtual-scroll-viewport
        #viewport
        [itemSize]="itemSize"
        [minBufferPx]="minBufferPx"
        [maxBufferPx]="maxBufferPx"
        class="card-viewport"
        (scrolledIndexChange)="onScrollIndexChange($event)">
        
        <!-- Virtual Card Items -->
        <div *cdkVirtualFor="let card of cards; 
                             trackBy: trackByCardId; 
                             templateCacheSize: templateCacheSize" 
             [attr.data-card-id]="card.id"
             [class.card-visible]="isCardVisible(card.id)"
             [class.card-optimized]="performanceMode">
          
          <app-ai-card-renderer 
            [cardConfig]="card"
            [isFullscreen]="false"
            [tiltEnabled]="!performanceMode && !reducedMotion"
            (fieldInteraction)="onFieldInteraction($event, card)"
            (cardInteraction)="onCardInteraction($event, card)">
          </app-ai-card-renderer>
          
          <!-- Performance overlay for debugging -->
          <div class="performance-overlay" *ngIf="showPerformanceOverlay">
            <small>
              Render: {{ getCardRenderTime(card.id) }}ms |
              Memory: {{ getCardMemoryUsage(card.id) }}kb
            </small>
          </div>
        </div>
        
        <!-- Loading indicator -->
        <div class="loading-indicator" *ngIf="isLoading">
          <div class="loading-spinner"></div>
          <span>Loading cards...</span>
        </div>
        
        <!-- Empty state -->
        <div class="empty-state" *ngIf="!isLoading && cards.length === 0">
          <h3>No cards found</h3>
          <p>Try adjusting your search criteria or adding new cards.</p>
        </div>
      </cdk-virtual-scroll-viewport>
      
      <!-- Scroll position indicator -->
      <div class="scroll-indicator" 
           *ngIf="showScrollIndicator"
           [style.width.%]="scrollPercentage">
      </div>
    </div>
  `,
  styleUrls: ['./virtual-card-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VirtualCardListComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() cards: AICardConfig[] = [];
  @Input() itemSize = 400;
  @Input() minBufferPx = 1600;
  @Input() maxBufferPx = 3200;
  @Input() templateCacheSize = 20;
  @Input() performanceMode = false;
  @Input() reducedMotion = false;
  @Input() showStats = true;
  @Input() showScrollIndicator = true;
  @Input() showPerformanceOverlay = false;
  @Input() isLoading = false;

  @ViewChild('viewport', { static: true }) viewport!: ElementRef;

  // Observables
  visibleCards$ = new BehaviorSubject<AICardConfig[]>([]);
  
  // State
  visibleRange = { start: 0, end: 10 };
  scrollPercentage = 0;
  visibleCardIds = new Set<string>();
  
  // Performance tracking
  private destroy$ = new Subject<void>();
  private intersectionObserver?: IntersectionObserver;
  private scrollStartTime = 0;
  private lastScrollPosition = 0;
  private renderTimes = new Map<string, number>();
  private memoryUsage = new Map<string, number>();

  constructor(
    private store: Store<AppState>,
    private memoryService: MemoryManagementService,
    // // private performanceService: PerformanceService
  ) {}

  ngOnInit(): void {
    this.destroy$ = this.memoryService.manageSubscription(this);
    // this.initializePerformanceTracking();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
    // this.setupScrollPerformanceTracking();
  }

  ngOnDestroy(): void {
    this.memoryService.cleanupComponent(this);
    this.intersectionObserver?.disconnect();
  }

  // TrackBy function for virtual scrolling optimization
  trackByCardId: TrackByFunction<AICardConfig> = (index: number, card: AICardConfig): string => {
    return card.id || `card-${index}`;
  };

  onScrollIndexChange(index: number): void {
    const startTime = performance.now();
    
    // Update visible range
    const bufferSize = Math.floor(this.minBufferPx / this.itemSize);
    this.visibleRange = {
      start: Math.max(0, index - bufferSize),
      end: Math.min(this.cards.length, index + bufferSize * 2)
    };
    
    // Update scroll percentage
    this.scrollPercentage = (index / Math.max(1, this.cards.length - 1)) * 100;
    
    // Track performance
    const scrollDuration = performance.now() - startTime;
    // this.performanceService.trackMetric('virtual_scroll_performance', {
    //   itemCount: this.cards.length,
    //   viewportHeight: this.viewport.nativeElement.offsetHeight,
    //   itemSize: this.itemSize
    // });
    
    // Dispatch to store
    this.store.dispatch(PerformanceActions.trackMetric({
      metric: {
        id: `scroll-${Date.now()}`,
        name: 'virtual_scroll',
        value: scrollDuration,
        timestamp: Date.now(),
        tags: {
          scrollIndex: index.toString(),
          totalCards: this.cards.length.toString()
        }
      }
    }));
  }

  onFieldInteraction(event: CardInteractionEvent, card: AICardConfig): void {
    const startTime = performance.now();
    
    // Handle field interaction
    console.log('Field interaction:', event, card);
    
    // Track interaction performance
    const processingTime = performance.now() - startTime;
    // this.performanceService.trackUserInteraction('field_interaction', {
    //   cardId: card.id,
    //   field: event.field
    // });
  }

  onCardInteraction(event: CardInteractionEvent, card: AICardConfig): void {
    const startTime = performance.now();
    
    // Handle card interaction
    console.log('Card interaction:', event, card);
    
    // Track interaction performance
    const processingTime = performance.now() - startTime;
    // this.performanceService.trackUserInteraction('card_interaction', {
    //   cardId: card.id,
    //   interaction: event.type
    // });
  }

  isCardVisible(cardId: string): boolean {
    return this.visibleCardIds.has(cardId);
  }

  getCardRenderTime(cardId: string): number {
    return this.renderTimes.get(cardId) || 0;
  }

  getCardMemoryUsage(cardId: string): number {
    return this.memoryUsage.get(cardId) || 0;
  }

  private setupIntersectionObserver(): void {
    const options = {
      root: this.viewport.nativeElement,
      rootMargin: '50px',
      threshold: [0, 0.25, 0.5, 0.75, 1]
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const cardId = entry.target.getAttribute('data-card-id');
        if (!cardId) return;

        if (entry.isIntersecting) {
          // Card became visible
          entry.target.classList.add('card-visible');
          this.visibleCardIds.add(cardId);
          
          // Start render time tracking
          const renderStart = performance.now();
          this.renderTimes.set(cardId, renderStart);
        } else {
          // Card became hidden
          entry.target.classList.remove('card-visible');
          this.visibleCardIds.delete(cardId);
          
          // Calculate final render time
          const renderStart = this.renderTimes.get(cardId);
          if (renderStart) {
            const totalRenderTime = performance.now() - renderStart;
            this.renderTimes.set(cardId, totalRenderTime);
          }
        }
      });
    }, options);

    // Start observing
    setTimeout(() => {
      const cardElements = this.viewport.nativeElement.querySelectorAll('.virtual-card-item');
      cardElements.forEach((element: Element) => {
        this.intersectionObserver?.observe(element);
      });
    }, 100);
  }

  // private setupScrollPerformanceTracking(): void {
  //   const viewport = this.viewport.nativeElement;
    
  //   viewport.addEventListener('scroll', () => {
  //     if (this.scrollStartTime === 0) {
  //       this.scrollStartTime = performance.now();
  //     }
      
  //     // Debounced scroll end detection
  //     clearTimeout((this as any).scrollTimeout);
  //     (this as any).scrollTimeout = setTimeout(() => {
  //       const scrollDuration = performance.now() - this.scrollStartTime;
  //       const scrollDistance = Math.abs(viewport.scrollTop - this.lastScrollPosition);
        
  //       // this.performanceService.trackMetric('scroll_performance', {
  //       //   duration: scrollDuration,
  //       //   distance: scrollDistance,
  //       //   fps: this.calculateScrollFPS()
  //       // });
        
  //       this.lastScrollPosition = viewport.scrollTop;
  //       this.scrollStartTime = 0;
  //     }, 150);
  //   }, { passive: true });
  // }

  private calculateScrollFPS(): number {
    // Simplified FPS calculation based on scroll smoothness
    return 60; // Placeholder - would need more sophisticated measurement
  }
}
