import { 
  Component, 
  Input, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef,
  Inject,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, shareReplay } from 'rxjs/operators';

import { AICardConfig, CardField } from '../../../../models/card.model';
import { LocalCardConfigurationService } from '../../../../core/services/local-card-configuration.service';
import { IconService } from '../../../../shared/services/icon.service';
import { AICardRendererComponent } from '../../../../shared/components/ai-card-renderer.component';
import { MemoryManagementService } from '../../../../core/services/memory-management.service';
// // // import { PerformanceService } from '../../../../core/performance/performance.service';
import { FeatureFlagService } from '../../../../core/services/feature-flag.service';
import { AppState } from '../../../../store/app.state';
import * as CardsSelectors from '../../../../store/cards/cards.selectors';
import * as CardsActions from '../../../../store/cards/cards.actions';
import { PERFORMANCE_CONFIG, PerformanceConfig } from '../../../../core/config/performance.config';

@Component({
  selector: 'app-single-card',
  standalone: true,
  imports: [CommonModule, AICardRendererComponent],
  templateUrl: './single-card.component.html',
  styleUrls: ['./single-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleCardComponent implements OnInit, OnDestroy {
  @Input() set cardId(value: string) {
    this.cardId$.next(value);
  }
  
  private cardId$ = new BehaviorSubject<string>('');
  
    // Observables for reactive programming
  card$!: Observable<AICardConfig | null>;
  isLoading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  performanceMode$!: Observable<boolean>;
  
  // Current card value for template binding
  card: AICardConfig | null = null;
  
  // Performance tracking
  private componentStartTime = performance.now();
  private interactionCount = 0;

  constructor(
    private store: Store<AppState>,
    private cardService: LocalCardConfigurationService,
    private iconService: IconService,
    private memoryService: MemoryManagementService,
    // // // private performanceService: PerformanceService,
    private featureFlagService: FeatureFlagService,
    private cdr: ChangeDetectorRef,
    private destroyRef: DestroyRef,
    @Inject(PERFORMANCE_CONFIG) private performanceConfig: PerformanceConfig
  ) {
    // Initialize observables with performance optimizations
    this.setupObservables();
  }

  ngOnInit(): void {
    this.loadCard();
    // this.trackComponentPerformance();
  }

  ngOnDestroy(): void {
// this.performanceService.trackMetric('component_lifecycle', {
    //   componentName: 'SingleCardComponent',
    //   timeAlive: performance.now() - this.componentStartTime,
    //   interactionCount: this.interactionCount
    // });    this.memoryService.cleanupComponent(this);
  }

  private setupObservables(): void {
    // Setup reactive streams with performance optimizations
    this.isLoading$ = this.store.select(CardsSelectors.selectLoading)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        shareReplay(1)
      );

    this.error$ = this.store.select(CardsSelectors.selectError)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        shareReplay(1)
      );

    this.performanceMode$ = this.featureFlagService.getFlag('enablePerformanceMode')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        shareReplay(1)
      );

    // Optimized card loading with debouncing and memoization
    this.card$ = combineLatest([
      this.cardId$.pipe(
        debounceTime(this.performanceConfig.debounceTime),
        distinctUntilChanged()
      ),
      this.store.select(CardsSelectors.selectCards)
    ]).pipe(
      map(([cardId, cards]) => {
        if (!cardId || !cards.length) return null;
        return cards.find(card => card.id === cardId) || null;
      }),
      shareReplay(1),
      takeUntilDestroyed(this.destroyRef)
    );

    // Subscribe to update the card property for template binding
    this.card$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(card => {
      this.card = card;
      this.cdr.markForCheck();
    });
  }

  private loadCard(): void {
    // Dispatch action to load cards if not already loaded
    this.store.select(CardsSelectors.selectCards)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(cards => {
        if (cards.length === 0) {
          this.store.dispatch(CardsActions.loadCards());
        }
      });
  }

  // private trackComponentPerformance(): void {
  //   const initTime = performance.now() - this.componentStartTime;
  //   this.performanceService.trackMetric('component_init', {
  //     componentName: 'SingleCardComponent',
  //     initTime,
  //     cardId: this.cardId$.value
  //   });
  // }

  // onField(event: any): void {
  //   this.interactionCount++;
    
  //   // Performance-optimized event handling
  //   const startTime = performance.now();
    
  //   // Handle field click with debouncing for performance
  //   console.log('Field clicked:', event);
    
  //   // Track interaction performance
  //   // this.performanceService.trackUserInteraction('field_click', {
  //   //   cardId: this.card?.id,
  //   //   field: field.key
  //   // });
  // }

  getFieldIconClass(label: string): string {
    // Use memoization for expensive icon calculations
    return this.memoryService.getPooledObject(
      'iconClass',
      () => this.iconService.getFieldIconClass(label)
    );
  }

  getFieldIcon(label: string): string {
    // Use memoization for expensive icon calculations
    return this.memoryService.getPooledObject(
      'icon',
      () => this.iconService.getFieldIcon(label)
    );
  }

  // TrackBy function for performance optimization
  trackByFieldId = (index: number, field: CardField): string => {
    return field.id || `field-${index}`;
  };
}
