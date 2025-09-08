import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardConfig, CardField } from '../../models/card.model';
import { Subject, fromEvent, takeUntil, interval } from 'rxjs';

interface MousePosition {
  x: number;
  y: number;
}

@Component({
  selector: 'app-independent-card',
  template: `
    <div class="card-container" 
         #cardContainer 
         [style]="tiltStyle"
         (mouseenter)="onMouseEnter($event)"
         (mouseleave)="onMouseLeave()"
         (mousemove)="onMouseMove($event)">
      
      <div class="card-wrapper" [ngClass]="{'fullscreen': isFullscreen}">
        <!-- Card Header -->
        <div class="card-header">
          <div class="title-section">
            <h2 class="card-title">{{cardConfig.cardTitle}}</h2>
            <p *ngIf="cardConfig.cardSubtitle" class="card-subtitle">{{cardConfig.cardSubtitle}}</p>
          </div>
          
          <div class="card-actions">
            <button class="action-btn" (click)="toggleFullscreen()">
              <i [ngClass]="isFullscreen ? 'minimize-icon' : 'maximize-icon'"></i>
            </button>
          </div>
        </div>
        
        <!-- Card Content / Sections -->
        <div class="card-content">
          <ng-container *ngFor="let section of cardConfig.sections; trackBy: trackByIndex">
            <div class="card-section" [ngClass]="'section-type-' + section.type">
              <h3 class="section-title">{{section.title}}</h3>
              
              <!-- Info Section Type -->
              <div *ngIf="section.type === 'info' && section.fields" class="info-grid">
                <div *ngFor="let field of section.fields; trackBy: trackByIndex" 
                     class="info-field" 
                     (click)="onFieldClick(field)">
                  <div class="field-label">{{field.label}}</div>
                  <div class="field-value" [style.color]="field.valueColor">{{field.value}}</div>
                </div>
              </div>
              
              <!-- List Section Type -->
              <div *ngIf="section.type === 'list' && section.items" class="list-container">
                <div *ngFor="let item of section.items; trackBy: trackByIndex" class="list-item">
                  <i *ngIf="item.icon" [class]="item.icon + ' item-icon'"></i>
                  <div class="item-content">
                    <div class="item-title">{{item.title}}</div>
                    <div class="item-description">{{item.description}}</div>
                  </div>
                  <div *ngIf="item.value" class="item-value">{{item.value}}</div>
                </div>
              </div>
              
              <!-- Chart Section Placeholder -->
              <div *ngIf="section.type === 'chart'" class="chart-container">
                <div class="chart-placeholder">Chart would render here</div>
              </div>
              
              <!-- Map Section Placeholder -->
              <div *ngIf="section.type === 'map'" class="map-container">
                <div class="map-placeholder">Map would render here</div>
              </div>
              
              <!-- Other section types -->
              <div *ngIf="!['info', 'list', 'chart', 'map'].includes(section.type)" class="section-placeholder">
                {{section.type}} section would render here
              </div>
            </div>
          </ng-container>
        </div>
        
        <!-- Card Footer / Actions -->
        <div *ngIf="cardConfig.actions && cardConfig.actions.length > 0" class="card-footer">
          <button *ngFor="let action of cardConfig.actions; trackBy: trackByIndex"
                  class="card-action-btn"
                  [ngClass]="'btn-' + (action.variant || 'primary')"
                  (click)="onActionClick(action.label)">
            <i *ngIf="action.icon" [class]="action.icon + ' action-icon'"></i>
            <span>{{action.label}}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./ai-card-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule]
})
export class IndependentCardComponent implements OnInit, OnDestroy {
  @Input() cardConfig!: AICardConfig;
  @Input() isFullscreen = false;
  @Input() tiltEnabled = true;
  @Output() fieldInteraction = new EventEmitter<any>();
  @Output() cardInteraction = new EventEmitter<{ action: string, card: AICardConfig }>();
  @Output() fullscreenToggle = new EventEmitter<boolean>();
  
  @ViewChild('cardContainer') cardContainer!: ElementRef<HTMLElement>;
  
  // Independent state for this card only
  private isHovered = false;
  private mousePosition: MousePosition = { x: 0, y: 0 };
  private cardBounds!: DOMRect;
  private destroyed$ = new Subject<void>();
  
  // Tilt calculations
  tiltStyle: Record<string, string | number> = {};
  
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Start animation loop for this card only
    if (this.tiltEnabled) {
      interval(16).pipe(takeUntil(this.destroyed$)).subscribe(() => {
        this.updateTilt();
      });
    }
    
    // Handle window resize
    fromEvent(window, 'resize')
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.updateCardBounds();
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onMouseEnter(event: MouseEvent): void {
    this.isHovered = true;
    this.mousePosition = { x: event.clientX, y: event.clientY };
    this.updateCardBounds();
    this.cdr.markForCheck();
  }

  onMouseLeave(): void {
    this.isHovered = false;
    this.resetTilt();
    this.cdr.markForCheck();
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isHovered) {
      this.mousePosition = { x: event.clientX, y: event.clientY };
    }
  }

  private updateCardBounds(): void {
    if (this.cardContainer?.nativeElement) {
      this.cardBounds = this.cardContainer.nativeElement.getBoundingClientRect();
    }
  }

  private updateTilt(): void {
    if (!this.isHovered || !this.tiltEnabled || !this.cardBounds) {
      return;
    }

    const centerX = this.cardBounds.left + this.cardBounds.width / 2;
    const centerY = this.cardBounds.top + this.cardBounds.height / 2;
    
    const deltaX = this.mousePosition.x - centerX;
    const deltaY = this.mousePosition.y - centerY;
    
    // Calculate relative position (0 to 1)
    const relativeX = deltaX / (this.cardBounds.width / 2);
    const relativeY = deltaY / (this.cardBounds.height / 2);
    
    // Calculate tilt angles (limited to reasonable values)
    const maxTilt = 15; // degrees
    const rotateY = Math.max(-maxTilt, Math.min(maxTilt, relativeX * maxTilt));
    const rotateX = Math.max(-maxTilt, Math.min(maxTilt, -relativeY * maxTilt));
    
    // Calculate distance for glow effects
    const distance = Math.hypot(deltaX, deltaY);
    const maxDistance = Math.hypot(this.cardBounds.width / 2, this.cardBounds.height / 2);
    const intensity = Math.max(0, 1 - (distance / maxDistance));
    
    // Update tilt style
    this.tiltStyle = {
      '--tilt-x': `${rotateX}deg`,
      '--tilt-y': `${rotateY}deg`,
      '--glow-blur': `${intensity * 20}px`,
      '--glow-color': `rgba(255,121,0,${intensity * 0.5})`,
      '--reflection-opacity': intensity * 0.3,
      'transform': `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`,
      'box-shadow': `0 ${intensity * 20}px ${intensity * 40}px rgba(0,0,0,${intensity * 0.2})`
    };
    
    this.cdr.markForCheck();
  }

  private resetTilt(): void {
    this.tiltStyle = {
      '--tilt-x': '0deg',
      '--tilt-y': '0deg',
      '--glow-blur': '0px',
      '--glow-color': 'rgba(255,121,0,0)',
      '--reflection-opacity': 0,
      'transform': 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)',
      'box-shadow': '0 4px 8px rgba(0,0,0,0.1)'
    };
    this.cdr.markForCheck();
  }

  onFieldClick(field: CardField): void {
    this.fieldInteraction.emit({
      field: field,
      action: 'click'
    });
  }

  onActionClick(action: string): void {
    this.cardInteraction.emit({
      action: action,
      card: this.cardConfig
    });
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.fullscreenToggle.emit(this.isFullscreen);
    
    // Update bounds after layout change
    setTimeout(() => {
      this.updateCardBounds();
      this.cdr.markForCheck();
    }, 100);
  }

  trackByIndex(index: number, item: unknown): number {
    return index;
  }
}
