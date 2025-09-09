import { Component, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CardInteractionEvent } from './virtual-card-list/virtual-card-list.component';
import { CommonModule } from '@angular/common';
import { AICardConfig, CardField, CardItem, CardAction } from '../../models';
import { Subject, takeUntil, fromEvent } from 'rxjs';
import { MouseTrackingService, MagneticTiltService } from '../../core';
import { IconService } from '../services/icon.service';
import { TiltWrapperComponent } from './tilt-wrapper/tilt-wrapper.component';

@Component({
  selector: 'app-ai-card-renderer',
  standalone: true,
  imports: [CommonModule, TiltWrapperComponent],
  templateUrl: './ai-card-renderer.component.html',
  styleUrls: ['./ai-card-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AICardRendererComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() cardConfig!: AICardConfig;
  @Input() isFullscreen = false;
  @Input() tiltEnabled = true;
  @Output() fieldInteraction = new EventEmitter<CardInteractionEvent>();
  @Output() cardInteraction = new EventEmitter<CardInteractionEvent>();
  @Output() fullscreenToggle = new EventEmitter<boolean>();
  
  @ViewChild('cardContainer') cardContainer!: ElementRef<HTMLElement>;
  
  isHovered = false;
  isTiltActive = true;
  
  private destroyed$ = new Subject<void>();

  constructor(
    private el: ElementRef,
    private mouseTrackingService: MouseTrackingService,
    private magneticTiltService: MagneticTiltService,
    private iconService: IconService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isTiltActive = this.tiltEnabled;
  }
  
  ngAfterViewInit(): void {
    // Register the container element for mouse tracking
    if (this.cardContainer && this.cardContainer.nativeElement) {
      // Set up element position tracking on resize
      fromEvent(window, 'resize')
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => {
          // Trigger any necessary recalculations when container size changes
          this.cdr.markForCheck();
        });
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onMouseEnter(): void {
    this.isHovered = true;
    this.cdr.markForCheck();
  }

  onMouseLeave(): void {
    this.isHovered = false;
    this.cdr.markForCheck();
  }

  onFieldClick(field: CardField): void {
    this.fieldInteraction.emit({
      field: field,
      action: 'click',
      renderer: this
    });
  }

  onActionClick(action: string): void {
    this.cardInteraction.emit({
      action: action,
      card: this.cardConfig,
      renderer: this
    });
  }

  toggleFullscreen(): void {
    // Emit the toggle event to parent component
    this.fullscreenToggle.emit(!this.isFullscreen);
    
    // Allow time for layout to adjust before recalculating tilt
    setTimeout(() => {
      this.cdr.markForCheck();
    }, 100);
  }

  trackByIndex(index: number, item: unknown): number {
    return index;
  }

  // Section expand/collapse state map
  sectionState: Record<number, { expanded: boolean }> = {};

  isSectionExpanded(index: number, section: unknown): boolean {
    if (this.sectionState[index] === undefined) {
      // default: if section has `collapsed: true` set, start collapsed, otherwise expanded
      this.sectionState[index] = { expanded: !(section && typeof section === 'object' && section !== null && 'collapsed' in section && (section as Record<string, unknown>)['collapsed'] === true) };
    }
    return this.sectionState[index].expanded;
  }

  toggleSection(index: number): void {
    if (!this.sectionState[index]) {
      this.sectionState[index] = { expanded: true };
    }
    this.sectionState[index].expanded = !this.sectionState[index].expanded;
    this.cdr.markForCheck();
  }

  getFieldIconClass(label: string): string {
    return this.iconService.getFieldIconClass(label);
  }

  getFieldIcon(label: string): string {
    return this.iconService.getFieldIcon(label);
  }

  getFieldIconPath(field: CardField): string {
    // First check if the field has an explicit icon property from JSON
    if (field.icon) {
      return this.iconService.getFieldIcon(field.icon) || this.iconService.getFieldIcon(field.label);
    }
    // Fall back to label-based icon
    return this.iconService.getFieldIcon(field.label);
  }

  getItemIconPath(item: CardItem): string {
    // Use the item's icon property
    return this.iconService.getFieldIcon(item.icon || item.title);
  }

  getActionIconPath(action: CardAction): string {
    // Use the action's icon property
    return this.iconService.getFieldIcon(action.icon || action.label);
  }
}