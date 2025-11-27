import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewContainerRef, ViewChild, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, AfterViewInit, ChangeDetectorRef, Injector, ComponentRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardAction, CardField, CardItem, CardSection } from '../../../../models';
import { InfoSectionFieldInteraction } from '../sections/info-section.component';
import { SectionLoaderService } from './section-loader.service';
import { SectionTypeResolverService } from './section-type-resolver.service';
import { AppConfigService } from '../../../../core/services/app-config.service';
import { SectionInteraction } from '../sections/base-section.component';

/**
 * Event emitted when a section element is interacted with
 */
export interface SectionRenderEvent {
  type: 'field' | 'item' | 'action';
  section: CardSection;
  field?: CardField;
  item?: CardItem | CardField;
  action?: CardAction;
  metadata?: Record<string, unknown>;
}

/**
 * Section Renderer Component
 * 
 * Smart router component that dynamically loads and renders the appropriate section
 * component based on section type. Uses lazy loading for optimal bundle size and
 * provides a unified interface for section interactions.
 * 
 * Features:
 * - Dynamic component loading based on section type
 * - Type resolution with fallback handling
 * - Event aggregation and propagation
 * - Lazy loading for section components
 * - Change detection optimization
 * 
 * The component resolves section types using SectionTypeResolverService and loads
 * the appropriate section component dynamically using SectionLoaderService.
 * 
 * @example
 * ```html
 * <app-section-renderer
 *   [section]="mySection"
 *   (sectionEvent)="onSectionEvent($event)">
 * </app-section-renderer>
 * ```
 */
@Component({
  selector: 'app-section-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-renderer.component.html',
  styleUrls: ['./section-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionRendererComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() section: CardSection | null = null;
  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();
  
  @ViewChild('dynamicComponent', { read: ViewContainerRef }) dynamicComponent!: ViewContainerRef;
  
  private readonly sectionLoader = inject(SectionLoaderService);
  private readonly typeResolver = inject(SectionTypeResolverService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly injector = inject(Injector);
  private readonly appConfig = inject(AppConfigService);
  /**
   * Type for dynamically loaded section component instances
   * All section components extend BaseSectionComponent and have these properties
   */
  private loadedComponent: ComponentRef<{
    section: CardSection;
    fieldInteraction?: EventEmitter<SectionInteraction<CardField>>;
    itemInteraction?: EventEmitter<SectionInteraction<CardItem>>;
    infoFieldInteraction?: EventEmitter<InfoSectionFieldInteraction>;
  }> | null = null;
  private viewInitialized = false;
  private lastSectionType: string | null = null;
  
  /**
   * Check if debug mode is enabled via environment configuration
   */
  private get isDebugMode(): boolean {
    return this.appConfig.LOGGING.ENABLE_DEBUG;
  }

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
    if (!this.section) return;
    this.sectionEvent.emit({
      type: 'field',
      section: this.section,
      field: event.field,
      metadata: { sectionTitle: event.sectionTitle }
    });
  }

  emitFieldInteraction(field: CardField, metadata?: Record<string, unknown>): void {
    if (!this.section) return;
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
    if (!this.section) return;
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
    if (!this.section) return;
    this.sectionEvent.emit({
      type: 'action',
      section: this.section,
      action,
      metadata
    });
  }

  ngOnInit(): void {
    // Component initialization - load after view init
    // If section is already set before view init, we'll load it in ngAfterViewInit
    if (this.section && this.isDebugMode) {
      console.log('[SectionRenderer] ngOnInit - section already set:', this.section.title);
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    
    // Use setTimeout to ensure ViewContainerRef is fully initialized
    // This helps avoid timing issues with dynamic component loading
    setTimeout(() => {
      if (this.section) {
        // Only load if not already loaded or if type changed
        const currentType = this.resolvedType;
        if (!this.loadedComponent || currentType !== this.lastSectionType) {
          this.loadComponent();
        } else {
          // Ensure section is set on existing component
          if (this.loadedComponent.instance) {
            this.loadedComponent.instance.section = this.section;
            this.cdr.markForCheck();
          }
        }
      } else {
        this.cdr.markForCheck();
      }
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle section changes both before and after view initialization
    if (changes['section']) {
      if (!this.section) {
        // Clear component if section is null
        if (this.loadedComponent) {
          this.dynamicComponent?.clear();
          this.loadedComponent = null;
          this.lastSectionType = null;
        }
        this.cdr.markForCheck();
        return;
      }
      
      // If view is not initialized yet, wait for ngAfterViewInit
      if (!this.viewInitialized) {
        if (this.isDebugMode) {
          console.log('[SectionRenderer] Section set before view init, will load in ngAfterViewInit');
        }
        return;
      }
      
      const newType = this.resolvedType;
      
      // Diagnostic logging
      if (this.isDebugMode) {
        console.log('[SectionRenderer] Section changed:', {
          sectionTitle: this.section.title,
          sectionType: this.section.type,
          resolvedType: newType,
          previousType: this.lastSectionType,
          hasLoadedComponent: !!this.loadedComponent
        });
      }
      
      // Reload component if section type changed or if component not loaded yet
      if (newType !== this.lastSectionType || !this.loadedComponent) {
        this.lastSectionType = newType;
        this.loadComponent();
      } else if (this.loadedComponent) {
        // Just update the section input
        if (this.loadedComponent.instance) {
          this.loadedComponent.instance.section = this.section;
          this.cdr.markForCheck();
        } else {
          // Component instance is null, reload component
          if (this.isDebugMode) {
            console.warn('[SectionRenderer] Component instance is null, reloading component');
          }
          this.loadComponent();
        }
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
    if (!this.viewInitialized) {
      if (this.isDebugMode) {
        console.warn('[SectionRenderer] Cannot load component - view not initialized');
      }
      return;
    }
    
    if (!this.dynamicComponent) {
      if (this.isDebugMode) {
        console.warn('[SectionRenderer] Cannot load component - ViewContainerRef not available');
      }
      return;
    }
    
    if (!this.section) {
      if (this.isDebugMode) {
        console.warn('[SectionRenderer] Cannot load component - section is null');
      }
      return;
    }

    const sectionType = this.resolvedType;
    
    // Diagnostic logging
    if (this.isDebugMode) {
      console.log('[SectionRenderer] Loading component for type:', sectionType, {
        sectionTitle: this.section.title,
        sectionId: this.section.id,
        originalType: this.section.type
      });
    }
    
    try {
      const ComponentType = await this.sectionLoader.getComponentType(sectionType);
      
      if (!ComponentType) {
        throw new Error(`Component type is null for section type: ${sectionType}`);
      }
      
      // Clear previous component
      this.dynamicComponent.clear();
      
      // Ensure change detection has run before creating component
      this.cdr.detectChanges();
      
      // Create new component - ViewContainerRef's injector will be used automatically
      // This ensures the component has access to all providers in the component tree
      const componentRef = this.dynamicComponent.createComponent(ComponentType);
      
      if (!componentRef || !componentRef.instance) {
        throw new Error(`Failed to create component instance for type: ${sectionType}`);
      }
      
      // Set section input after component is created
      componentRef.instance.section = this.section;
      
      // Subscribe to component events - use EventEmitter's subscribe
      if (componentRef.instance.fieldInteraction) {
        componentRef.instance.fieldInteraction.subscribe((event: SectionInteraction<CardField>) => {
          if (event?.field) {
            this.emitFieldInteraction(event.field, event.metadata);
          }
        });
      }
      
      if (componentRef.instance.itemInteraction) {
        componentRef.instance.itemInteraction.subscribe((event: SectionInteraction<CardItem>) => {
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
      
      // Diagnostic logging
      if (this.isDebugMode) {
        console.log('[SectionRenderer] Successfully loaded component:', sectionType);
      }
      
      this.cdr.markForCheck();
    } catch (error) {
      console.error('[SectionRenderer] Failed to load section component:', {
        sectionType,
        sectionTitle: this.section?.title,
        sectionId: this.section?.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Load fallback component
      try {
        if (this.isDebugMode) {
          console.log('[SectionRenderer] Attempting to load fallback component');
        }
        
        const FallbackComponent = await this.sectionLoader.getComponentType('fallback');
        
        if (!FallbackComponent) {
          throw new Error('Fallback component type is null');
        }
        
        // Clear any partial component
        this.dynamicComponent.clear();
        this.cdr.detectChanges();
        
        const componentRef = this.dynamicComponent.createComponent(FallbackComponent);
        
        if (!componentRef || !componentRef.instance) {
          throw new Error('Failed to create fallback component instance');
        }
        
        componentRef.instance.section = this.section;
        this.loadedComponent = componentRef;
        this.lastSectionType = 'fallback';
        
        if (this.isDebugMode) {
          console.log('[SectionRenderer] Successfully loaded fallback component');
        }
        
        this.cdr.markForCheck();
      } catch (fallbackError) {
        console.error('[SectionRenderer] Failed to load fallback component:', {
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          stack: fallbackError instanceof Error ? fallbackError.stack : undefined
        });
        
        // Last resort: clear component and mark for check
        this.dynamicComponent?.clear();
        this.loadedComponent = null;
        this.cdr.markForCheck();
      }
    }
  }
}
