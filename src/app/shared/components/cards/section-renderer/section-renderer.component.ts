import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewContainerRef, ViewChild, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardAction, CardField, CardItem, CardSection } from '../../../../models';
import { InfoSectionFieldInteraction } from '../sections/info-section.component';
import { SectionLoaderService } from './section-loader.service';
import { SectionTypeResolverService } from './section-type-resolver.service';

export interface SectionRenderEvent {
  type: 'field' | 'item' | 'action';
  section: CardSection;
  field?: CardField;
  item?: CardItem | CardField;
  action?: CardAction;
  metadata?: Record<string, unknown>;
}

@Component({
  selector: 'app-section-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-renderer.component.html',
  styleUrls: ['./section-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionRendererComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input({ required: true }) section!: CardSection;
  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();
  
  @ViewChild('dynamicComponent', { read: ViewContainerRef }) dynamicComponent!: ViewContainerRef;
  
  private readonly sectionLoader = inject(SectionLoaderService);
  private readonly typeResolver = inject(SectionTypeResolverService);
  private readonly cdr = inject(ChangeDetectorRef);
  private loadedComponent: any = null;
  private viewInitialized = false;
  private lastSectionType: string | null = null;

  // Removed @HostBinding - will be set in template instead to avoid setAttribute errors
  get sectionTypeAttribute(): string {
    if (!this.section) {
      return 'unknown';
    }
    try {
      const typeLabel = (this.section.type ?? '').trim();
      const resolved = this.resolvedType;
      return (typeLabel || resolved || 'unknown').toLowerCase();
    } catch {
      return 'unknown';
    }
  }

  get sectionIdAttribute(): string | null {
    if (!this.section?.id) {
      return null;
    }
    try {
      return String(this.section.id);
    } catch {
      return null;
    }
  }

  get resolvedType(): string {
    if (!this.section) {
      return 'unknown';
    }
    return this.typeResolver.resolve(this.section);
  }

  onInfoFieldInteraction(event: InfoSectionFieldInteraction): void {
    this.sectionEvent.emit({
      type: 'field',
      section: this.section,
      field: event.field,
      metadata: { sectionTitle: event.sectionTitle }
    });
  }

  emitFieldInteraction(field: CardField, metadata?: Record<string, unknown>): void {
    this.sectionEvent.emit({
      type: 'field',
      section: this.section,
      field,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title,
        ...metadata
      }
    });
  }

  emitItemInteraction(item: CardItem | CardField, metadata?: Record<string, unknown>): void {
    this.sectionEvent.emit({
      type: 'item',
      section: this.section,
      item,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title,
        ...metadata
      }
    });
  }

  emitActionInteraction(action: CardAction, metadata?: Record<string, unknown>): void {
    this.sectionEvent.emit({
      type: 'action',
      section: this.section,
      action,
      metadata
    });
  }

  ngOnInit(): void {
    // Component initialization - load after view init
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.loadComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['section'] && this.viewInitialized) {
      const newType = this.resolvedType;
      // Reload component if section type changed or if component not loaded yet
      if (newType !== this.lastSectionType || !this.loadedComponent) {
        this.lastSectionType = newType;
        this.loadComponent();
      } else if (this.loadedComponent) {
        // Just update the section input
        this.loadedComponent.instance.section = this.section;
        this.cdr.markForCheck();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.loadedComponent) {
      this.dynamicComponent?.clear();
      this.loadedComponent = null;
    }
  }

  /**
   * Load component dynamically based on section type
   */
  private async loadComponent(): Promise<void> {
    if (!this.viewInitialized || !this.dynamicComponent) {
      return;
    }

    const sectionType = this.resolvedType;
    try {
      const ComponentType = await this.sectionLoader.getComponentType(sectionType);
      
      // Clear previous component
      this.dynamicComponent.clear();
      
      // Create new component
      const componentRef = this.dynamicComponent.createComponent(ComponentType);
      componentRef.instance.section = this.section;
      
      // Subscribe to component events - use EventEmitter's subscribe
      if (componentRef.instance.fieldInteraction) {
        componentRef.instance.fieldInteraction.subscribe((event: any) => {
          if (event?.field) {
            this.emitFieldInteraction(event.field, event.metadata);
          }
        });
      }
      
      if (componentRef.instance.itemInteraction) {
        componentRef.instance.itemInteraction.subscribe((event: any) => {
          if (event?.item) {
            this.emitItemInteraction(event.item, event.metadata);
          }
        });
      }
      
      // Special handling for InfoSectionComponent
      if (componentRef.instance.infoFieldInteraction) {
        componentRef.instance.infoFieldInteraction.subscribe((event: InfoSectionFieldInteraction) => {
          this.onInfoFieldInteraction(event);
        });
      }
      
      this.loadedComponent = componentRef;
      this.lastSectionType = sectionType;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Failed to load section component:', error);
      // Load fallback component
      try {
        const FallbackComponent = await this.sectionLoader.getComponentType('fallback');
        const componentRef = this.dynamicComponent.createComponent(FallbackComponent);
        componentRef.instance.section = this.section;
        this.loadedComponent = componentRef;
        this.lastSectionType = 'fallback';
        this.cdr.markForCheck();
      } catch (fallbackError) {
        console.error('Failed to load fallback component:', fallbackError);
      }
    }
  }
}
