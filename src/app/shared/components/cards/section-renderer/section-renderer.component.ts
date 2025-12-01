import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardAction, CardField, CardItem, CardSection } from '../../../../models';
import { SectionLoaderService } from './section-loader.service';
import { SectionTypeResolverService } from './section-type-resolver.service';
import { AppConfigService } from '../../../../core/services/app-config.service';
import {
  SectionInteraction,
  InfoSectionComponent
} from '@osi-cards/sections';

/** Type alias for InfoSection field interaction */
type InfoSectionFieldInteraction = Parameters<InfoSectionComponent['fieldInteraction']['emit']>[0];
import { ErrorBoundaryComponent } from '../../../../core/error-boundary/error-boundary.component';
import { LoggingService } from '../../../../core/services/logging.service';

/**
 * Interface for dynamically loaded section component instances
 * All section components extend BaseSectionComponent and have these properties
 *
 * @deprecated Use SectionComponentInstance from './section-component.interface' instead
 * This local interface is kept for backward compatibility but will be removed
 */
interface SectionComponentInstance {
  section: CardSection;
  fieldInteraction?: EventEmitter<SectionInteraction<CardField>>;
  itemInteraction?: EventEmitter<SectionInteraction<CardItem>>;
  infoFieldInteraction?: EventEmitter<InfoSectionFieldInteraction>;
}

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
 *   (sectionEvent)="handleSectionEvent($event)">
 * </app-section-renderer>
 * ```
 *
 * @example
 * ```typescript
 * handleSectionEvent(event: SectionRenderEvent): void {
 *   if (event.type === 'field') {
 *     console.log('Field clicked:', event.field);
 *   } else if (event.type === 'item') {
 *     console.log('Item clicked:', event.item);
 *   } else if (event.type === 'action') {
 *     console.log('Action clicked:', event.action);
 *   }
 * }
 * ```
 */
@Component({
  selector: 'app-section-renderer',
  standalone: true,
  imports: [CommonModule, ErrorBoundaryComponent],
  templateUrl: './section-renderer.component.html',
  styleUrls: ['./section-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionRendererComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input()
  set section(value: CardSection | null) {
    // Validate section input
    if (value !== null && (!value || typeof value !== 'object')) {
      this.logger.warn(
        'Invalid section input: expected CardSection object or null',
        'SectionRendererComponent',
        { value }
      );
      this._section = null;
      return;
    }
    if (value && (!value.title || typeof value.title !== 'string')) {
      this.logger.warn(
        'Invalid section input: section must have a title',
        'SectionRendererComponent',
        { value }
      );
      this._section = null;
      return;
    }
    this._section = value;
  }
  get section(): CardSection | null {
    return this._section;
  }
  private _section: CardSection | null = null;
  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();

  @ViewChild('dynamicComponent', { read: ViewContainerRef }) dynamicComponent!: ViewContainerRef;

  private readonly sectionLoader = inject(SectionLoaderService);
  private readonly typeResolver = inject(SectionTypeResolverService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly appConfig = inject(AppConfigService);
  private readonly logger = inject(LoggingService);
  /**
   * Type for dynamically loaded section component instances
   * All section components implement SectionComponentInstance interface
   */
  private loadedComponent: ComponentRef<SectionComponentInstance> | null = null;
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
    if (!this.section || !event?.field) {
      return;
    }
    this.sectionEvent.emit({
      type: 'field',
      section: this.section,
      field: event.field,
      metadata: { sectionTitle: this.section.title },
    });
  }

  emitFieldInteraction(field: CardField, metadata?: Record<string, unknown>): void {
    if (!this.section) {
      return;
    }
    this.sectionEvent.emit({
      type: 'field',
      section: this.section,
      field,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title,
        ...metadata,
      },
    });
  }

  emitItemInteraction(item: CardItem | CardField, metadata?: Record<string, unknown>): void {
    if (!this.section) {
      return;
    }
    this.sectionEvent.emit({
      type: 'item',
      section: this.section,
      item,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title,
        ...metadata,
      },
    });
  }

  emitActionInteraction(action: CardAction, metadata?: Record<string, unknown>): void {
    if (!this.section) {
      return;
    }
    const event: SectionRenderEvent = {
      type: 'action',
      section: this.section,
      action,
    };
    if (metadata !== undefined) {
      event.metadata = metadata;
    }
    this.sectionEvent.emit(event);
  }

  ngOnInit(): void {
    // Component initialization - load after view init
    // If section is already set before view init, we'll load it in ngAfterViewInit
    if (this.section && this.isDebugMode) {
      this.logger.debug('ngOnInit - section already set', 'SectionRendererComponent', {
        sectionTitle: this.section.title,
      });
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
    if (changes.section) {
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
          this.logger.debug(
            'Section set before view init, will load in ngAfterViewInit',
            'SectionRendererComponent'
          );
        }
        return;
      }

      const newType = this.resolvedType;

      // Diagnostic logging
      if (this.isDebugMode) {
        this.logger.debug('Section changed', 'SectionRendererComponent', {
          sectionTitle: this.section.title,
          sectionType: this.section.type,
          resolvedType: newType,
          previousType: this.lastSectionType,
          hasLoadedComponent: !!this.loadedComponent,
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
            this.logger.warn(
              'Component instance is null, reloading component',
              'SectionRendererComponent'
            );
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
   *
   * This method handles the complete lifecycle of dynamic component loading:
   * 1. Validates prerequisites (view initialized, ViewContainerRef available, section exists)
   * 2. Resolves section type and loads appropriate component
   * 3. Sets up event subscriptions for component interactions
   * 4. Handles errors with fallback component loading
   *
   * @throws Will log errors but not throw exceptions to prevent component crashes
   * @private
   */
  private async loadComponent(): Promise<void> {
    // Validate prerequisites
    if (!this.validateLoadPrerequisites()) {
      return;
    }

    const sectionType = this.resolvedType;
    this.logComponentLoading(sectionType);

    try {
      const componentRef = await this.createAndSetupComponent(sectionType);
      if (componentRef) {
        this.loadedComponent = componentRef;
        this.lastSectionType = sectionType;
        this.logComponentLoaded(sectionType);
        this.cdr.markForCheck();
      }
    } catch (error) {
      await this.handleComponentLoadError(error, sectionType);
    }
  }

  /**
   * Validate prerequisites for component loading
   * @returns true if all prerequisites are met, false otherwise
   * @private
   */
  private validateLoadPrerequisites(): boolean {
    if (!this.viewInitialized) {
      if (this.isDebugMode) {
        this.logger.warn(
          'Cannot load component - view not initialized',
          'SectionRendererComponent'
        );
      }
      return false;
    }

    if (!this.dynamicComponent) {
      if (this.isDebugMode) {
        this.logger.warn(
          'Cannot load component - ViewContainerRef not available',
          'SectionRendererComponent'
        );
      }
      return false;
    }

    if (!this.section) {
      if (this.isDebugMode) {
        this.logger.warn('Cannot load component - section is null', 'SectionRendererComponent');
      }
      return false;
    }

    return true;
  }

  /**
   * Log component loading start
   * @param sectionType - The resolved section type
   * @private
   */
  private logComponentLoading(sectionType: string): void {
    if (this.isDebugMode && this.section) {
      this.logger.debug('Loading component for type', 'SectionRendererComponent', {
        sectionType,
        sectionTitle: this.section.title,
        sectionId: this.section.id,
        originalType: this.section.type,
      });
    }
  }

  /**
   * Log successful component load
   * @param sectionType - The resolved section type
   * @private
   */
  private logComponentLoaded(sectionType: string): void {
    if (this.isDebugMode) {
      this.logger.debug('Successfully loaded component', 'SectionRendererComponent', {
        sectionType,
      });
    }
  }

  /**
   * Create and setup component instance
   * @param sectionType - The resolved section type
   * @returns ComponentRef if successful, null otherwise
   * @private
   */
  private async createAndSetupComponent(
    sectionType: string
  ): Promise<ComponentRef<SectionComponentInstance> | null> {
    if (!this.dynamicComponent || !this.section) {
      return null;
    }

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
    const componentRef = this.dynamicComponent.createComponent(
      ComponentType
    ) as ComponentRef<SectionComponentInstance>;

    if (!componentRef?.instance) {
      throw new Error(`Failed to create component instance for type: ${sectionType}`);
    }

    // Set section input after component is created
    componentRef.instance.section = this.section;

    // Subscribe to component events
    this.subscribeToComponentEvents(componentRef.instance);

    return componentRef;
  }

  /**
   * Subscribe to component event emitters
   * @param instance - The component instance
   * @private
   */
  private subscribeToComponentEvents(instance: SectionComponentInstance): void {
    // Subscribe to field interaction events
    if (instance.fieldInteraction) {
      instance.fieldInteraction.subscribe((event: SectionInteraction<CardField>) => {
        if (event?.field) {
          this.emitFieldInteraction(event.field, event.metadata);
        }
      });
    }

    // Subscribe to item interaction events
    if (instance.itemInteraction) {
      instance.itemInteraction.subscribe((event: SectionInteraction<CardItem>) => {
        if (event?.item) {
          this.emitItemInteraction(event.item, event.metadata);
        }
      });
    }

    // Special handling for InfoSectionComponent
    if (instance.infoFieldInteraction) {
      instance.infoFieldInteraction.subscribe((event: InfoSectionFieldInteraction) => {
        this.onInfoFieldInteraction(event);
      });
    }
  }

  /**
   * Handle component loading errors with fallback
   * @param error - The error that occurred
   * @param sectionType - The section type that failed to load
   * @private
   */
  private async handleComponentLoadError(error: unknown, sectionType: string): Promise<void> {
    this.logger.error('Failed to load section component', 'SectionRendererComponent', {
      sectionType,
      sectionTitle: this.section?.title,
      sectionId: this.section?.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Attempt to load fallback component
    try {
      if (this.isDebugMode) {
        this.logger.debug('Attempting to load fallback component', 'SectionRendererComponent');
      }

      const fallbackRef = await this.loadFallbackComponent();
      if (fallbackRef) {
        this.loadedComponent = fallbackRef;
        this.lastSectionType = 'fallback';

        if (this.isDebugMode) {
          this.logger.debug('Successfully loaded fallback component', 'SectionRendererComponent');
        }

        this.cdr.markForCheck();
      }
    } catch (fallbackError) {
      this.logger.error('Failed to load fallback component', 'SectionRendererComponent', {
        error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        stack: fallbackError instanceof Error ? fallbackError.stack : undefined,
      });

      // Last resort: clear component and mark for check
      this.clearComponent();
    }
  }

  /**
   * Load fallback component
   * @returns ComponentRef if successful, null otherwise
   * @private
   */
  private async loadFallbackComponent(): Promise<ComponentRef<SectionComponentInstance> | null> {
    if (!this.dynamicComponent || !this.section) {
      return null;
    }

    const FallbackComponent = await this.sectionLoader.getComponentType('fallback');

    if (!FallbackComponent) {
      throw new Error('Fallback component type is null');
    }

    // Clear any partial component
    this.dynamicComponent.clear();
    this.cdr.detectChanges();

    const componentRef = this.dynamicComponent.createComponent(
      FallbackComponent
    ) as ComponentRef<SectionComponentInstance>;

    if (!componentRef?.instance) {
      throw new Error('Failed to create fallback component instance');
    }

    componentRef.instance.section = this.section;
    return componentRef;
  }

  /**
   * Clear loaded component
   * @private
   */
  private clearComponent(): void {
    if (this.dynamicComponent) {
      this.dynamicComponent.clear();
    }
    this.loadedComponent = null;
    this.cdr.markForCheck();
  }
}
