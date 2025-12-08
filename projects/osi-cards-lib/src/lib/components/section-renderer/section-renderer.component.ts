import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { CardAction, CardField, CardItem, CardSection } from '../../models';
import {
  isValidSectionType,
  resolveSectionType,
  SectionTypeInput,
} from '../../models/generated-section-types';
import { LoggerService } from '../../services/logger.service';
import { SectionPluginRegistry } from '../../services/section-plugin-registry.service';
import { BaseSectionComponent, SectionInteraction } from '../sections/base-section.component';
import { DynamicSectionLoaderService } from './dynamic-section-loader.service';
import { LazySectionLoaderService, LazySectionType } from './lazy-section-loader.service';
import { LazySectionPlaceholderComponent } from './lazy-section-placeholder.component';

/**
 * Interface for sections with custom field interaction output
 * Used by InfoSectionComponent
 */
interface InfoSectionComponentLike extends BaseSectionComponent {
  infoFieldInteraction?: Observable<{ field: CardField; sectionTitle?: string }>;
}

export interface SectionRenderEvent {
  type: 'field' | 'item' | 'action';
  section: CardSection;
  field?: CardField;
  item?: CardItem | CardField;
  action?: CardAction;
  metadata?: Record<string, unknown>;
}

/**
 * Dynamic Section Renderer Component
 *
 * This component dynamically loads and renders section components based on
 * the section type. It replaces the previous switch-statement approach with
 * a registry-based dynamic component resolution system.
 *
 * Features:
 * - Dynamic component loading via ViewContainerRef
 * - Type alias resolution (e.g., 'metrics' -> 'analytics')
 * - Plugin component support
 * - Automatic fallback for unknown types
 * - Component caching for performance
 */
@Component({
  selector: 'app-section-renderer',
  standalone: true,
  imports: [CommonModule, LazySectionPlaceholderComponent],
  template: `
    <!-- Lazy loading placeholder -->
    @if (isLazyLoading) {
      <app-lazy-section-placeholder
        [sectionType]="lazyType"
        [isLoading]="true"
        [error]="lazyLoadError"
        (retry)="retryLazyLoad()"
      >
      </app-lazy-section-placeholder>
    }

    <!-- Dynamic component container -->
    <ng-container #container></ng-container>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SectionRendererComponent implements OnChanges {
  @Input({ required: true }) section!: CardSection;
  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();

  @ViewChild('container', { read: ViewContainerRef, static: true })
  private container!: ViewContainerRef;

  private readonly loader = inject(DynamicSectionLoaderService);
  private readonly lazySectionLoader = inject(LazySectionLoaderService);
  private readonly pluginRegistry = inject(SectionPluginRegistry);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = inject(LoggerService);

  private currentComponentRef: ComponentRef<BaseSectionComponent> | null = null;
  private currentType: string | null = null;

  /** Lazy loading state */
  protected isLazyLoading = false;
  protected lazyLoadError: Error | null = null;
  protected lazyType: LazySectionType = 'chart';

  // FIX: Add theme input to propagate theming to child sections
  // Default to 'night' to ensure dark theme is applied if not provided
  @Input() theme: string = 'night';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['section']) {
      this.logger.debug('Section changed', {
        sectionType: this.section?.type,
        sectionTitle: this.section?.title,
        hasFields: !!this.section?.fields?.length,
        hasItems: !!this.section?.items?.length,
        fieldsCount: this.section?.fields?.length || 0,
        itemsCount: this.section?.items?.length || 0,
        sectionId: this.section?.id,
      });
      this.loadComponent();
    }
  }

  /**
   * Load the appropriate component for the current section
   * Handles both sync and lazy-loaded components
   */
  private loadComponent(): void {
    if (!this.section) {
      this.logger.warn('No section provided, clearing component');
      this.clearComponent();
      return;
    }

    const sectionType = this.section.type?.toLowerCase() || 'fallback';
    const resolvedType = this.loader.resolveType(sectionType);

    this.logger.debug('loadComponent', {
      sectionType,
      resolvedType,
      currentType: this.currentType,
      hasCurrentComponent: !!this.currentComponentRef,
    });

    // Only recreate component if type changed
    if (this.currentType !== resolvedType) {
      this.clearComponent();

      // Check if this is a lazy-loaded section
      const resolution = this.loader.resolveComponent(this.section);

      this.logger.debug('Component resolution', {
        isLazy: resolution.isLazy,
        hasComponent: !!resolution.component,
        hasLoadPromise: !!resolution.loadPromise,
      });

      if (resolution.isLazy && !resolution.component && resolution.loadPromise) {
        // Start lazy loading
        this.logger.debug('Starting lazy load', { resolvedType });
        this.startLazyLoad(resolvedType as LazySectionType, resolution.loadPromise);
      } else if (resolution.component) {
        // Sync component available - create immediately
        this.logger.debug('Creating sync component', {
          componentName: resolution.component.name || 'Unknown',
        });
        this.createComponentFromClass(resolution.component);
      } else {
        // CRITICAL: Always render a fallback component instead of leaving empty
        this.logger.warn('No component found for section type, using fallback', {
          resolvedType,
          sectionType: this.section?.type,
          sectionTitle: this.section?.title,
        });
        // Force fallback component creation
        const fallbackResolution = this.loader.resolveComponent({
          ...this.section,
          type: 'fallback',
        } as CardSection);
        if (fallbackResolution.component) {
          this.createComponentFromClass(fallbackResolution.component);
        } else {
          // Last resort: log error but still try to show something
          this.logger.error('Even fallback component not available', { resolvedType });
        }
      }

      this.currentType = resolvedType;
    } else if (this.currentComponentRef) {
      // Just update the section input
      this.logger.debug('Updating existing component input');
      this.updateComponentInput();
    }
  }

  /**
   * Start lazy loading a section component
   */
  private async startLazyLoad(
    type: LazySectionType,
    loadPromise: Promise<BaseSectionComponent['constructor']>
  ): Promise<void> {
    this.isLazyLoading = true;
    this.lazyLoadError = null;
    this.lazyType = type;
    this.cdr.markForCheck();

    try {
      const componentClass = await loadPromise;

      // Check if section type still matches (user might have changed it during load)
      if (
        this.section?.type?.toLowerCase() === type ||
        this.loader.resolveType(this.section?.type ?? '') === type
      ) {
        this.isLazyLoading = false;
        this.createComponentFromClass(componentClass as BaseSectionComponent['constructor']);
        this.cdr.markForCheck();
      }
    } catch (error) {
      this.isLazyLoading = false;
      this.lazyLoadError = error instanceof Error ? error : new Error(String(error));
      this.cdr.markForCheck();
    }
  }

  /**
   * Retry loading a failed lazy section
   */
  protected retryLazyLoad(): void {
    if (this.lazyType) {
      this.lazyLoadError = null;
      const loadPromise = this.lazySectionLoader.retryLoad(this.lazyType);
      this.startLazyLoad(this.lazyType, loadPromise);
    }
  }

  /**
   * Create the dynamic component
   * @internal Reserved for future use
   */
  private _createComponent(resolvedType: string): void {
    const componentClass = this.loader.getComponentForSection(this.section);

    if (!componentClass) {
      this.logger.warn('No component found for section type', { resolvedType });
      return;
    }

    this.createComponentFromClass(componentClass);
  }

  /**
   * Create a component from a component class
   */
  private createComponentFromClass(componentClass: unknown): void {
    if (!componentClass) {
      this.logger.warn('createComponentFromClass: componentClass is null/undefined');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.currentComponentRef = this.container.createComponent(componentClass as any);
      const instance = this.currentComponentRef.instance;
      const hostElement = this.currentComponentRef.location.nativeElement;

      this.logger.info('SectionRenderer: Component created successfully', {
        source: 'SectionRendererComponent',
        componentName: (componentClass as any).name || 'Unknown',
        hasInstance: !!instance,
        sectionType: this.section?.type,
        sectionTitle: this.section?.title,
        sectionId: this.section?.id,
        hostElementExists: !!hostElement,
        fieldsCount: this.section?.fields?.length || 0,
        itemsCount: this.section?.items?.length || 0,
      });

      this.updateComponentInput();
      this.subscribeToComponentEvents();
    } catch (error) {
      this.logger.error('Error creating component', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      this.currentComponentRef = null;
    }
  }

  /**
   * Update the section input on the component
   */
  private updateComponentInput(): void {
    if (this.currentComponentRef) {
      const instance = this.currentComponentRef.instance;
      const hostElement = this.currentComponentRef.location.nativeElement;

      this.logger.info('SectionRenderer: Updating component inputs', {
        source: 'SectionRendererComponent',
        sectionType: this.section?.type,
        sectionTitle: this.section?.title,
        sectionId: this.section?.id,
        hasSection: !!this.section,
        colSpan: this.section?._assignedColSpan,
        orientation: this.section?._assignedOrientation,
        fieldsCount: this.section?.fields?.length || 0,
        itemsCount: this.section?.items?.length || 0,
      });

      this.currentComponentRef.setInput('section', this.section);

      // Pass colSpan if component supports it (from section._assignedColSpan)
      // setInput() is safe to call even if input doesn't exist - Angular handles it gracefully
      if (this.section._assignedColSpan !== undefined) {
        this.currentComponentRef.setInput('colSpan', this.section._assignedColSpan);
      }

      // Pass orientation if component supports it (from section._assignedOrientation)
      if (this.section._assignedOrientation) {
        this.currentComponentRef.setInput('orientation', this.section._assignedOrientation);
      }

      // FIX: Pass theme to component
      this.currentComponentRef.setInput('theme', this.theme || 'night');

      // CRITICAL: Manually trigger change detection on the dynamically created component
      // setInput() should trigger change detection, but for OnPush components created dynamically,
      // we need to explicitly detect changes to ensure the view updates
      const childCdr = this.currentComponentRef.injector.get(ChangeDetectorRef);
      childCdr.detectChanges();

      // Also mark this component for check to ensure the section renderer updates
      this.cdr.markForCheck();

      // After change detection, check again
      setTimeout(() => {
        if (hostElement) {
          const afterCheck = {
            hostElementHeight: hostElement.offsetHeight,
            hostElementWidth: hostElement.offsetWidth,
            hostElementDisplay: window.getComputedStyle(hostElement).display,
            hostElementOpacity: window.getComputedStyle(hostElement).opacity,
            hostElementVisibility: window.getComputedStyle(hostElement).visibility,
            hostElementChildren: hostElement.children.length,
            instanceSectionFieldsCount: instance.section?.fields?.length || 0,
          };
          this.logger.debug('After change detection', afterCheck);
        }
      }, 100);
    } else {
      this.logger.warn('updateComponentInput: currentComponentRef is null');
    }
  }

  /**
   * Subscribe to component output events
   */
  private subscribeToComponentEvents(): void {
    if (!this.currentComponentRef) return;

    const instance = this.currentComponentRef.instance;

    // Subscribe to fieldInteraction
    if (instance.fieldInteraction) {
      instance.fieldInteraction
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event: SectionInteraction) => {
          this.emitFieldInteraction(event.field as CardField, event.metadata);
        });
    }

    // Subscribe to itemInteraction
    if (instance.itemInteraction) {
      instance.itemInteraction
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event: SectionInteraction) => {
          this.emitItemInteraction(event.item as CardItem, event.metadata);
        });
    }

    // Handle InfoSectionComponent's custom output
    const infoInstance = instance as InfoSectionComponentLike;
    if (infoInstance.infoFieldInteraction) {
      infoInstance.infoFieldInteraction
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event: { field: CardField; sectionTitle?: string }) => {
          this.emitFieldInteraction(event.field, { sectionTitle: event.sectionTitle });
        });
    }
  }

  /**
   * Clear the current component
   */
  private clearComponent(): void {
    if (this.currentComponentRef) {
      this.currentComponentRef.destroy();
      this.currentComponentRef = null;
    }
    this.container?.clear();
    this.currentType = null;
    this.isLazyLoading = false;
    this.lazyLoadError = null;
  }

  /**
   * Get the section type attribute for debugging/styling
   */
  get sectionTypeAttribute(): string {
    if (!this.section) return 'unknown';

    try {
      const typeLabel = (this.section.type ?? '').trim().toLowerCase();
      if (isValidSectionType(typeLabel as SectionTypeInput)) {
        return resolveSectionType(typeLabel as SectionTypeInput);
      }
      return typeLabel || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get the section ID attribute
   */
  get sectionIdAttribute(): string | null {
    return this.section?.id ? String(this.section.id) : null;
  }

  /**
   * Check if current section uses a plugin
   */
  get usesPlugin(): boolean {
    if (!this.section?.type) return false;
    return this.pluginRegistry.hasPlugin(this.section.type.toLowerCase());
  }

  /**
   * Get the resolved canonical type
   */
  get resolvedType(): string {
    if (!this.section?.type) return 'fallback';
    return this.loader.resolveType(this.section.type);
  }

  // Event emission methods

  emitFieldInteraction(field: CardField | undefined, metadata?: Record<string, unknown>): void {
    if (!field) return;
    this.sectionEvent.emit({
      type: 'field',
      section: this.section,
      field,
      metadata: {
        sectionId: this.section?.id,
        sectionTitle: this.section?.title,
        ...metadata,
      },
    });
  }

  emitItemInteraction(
    item: CardItem | CardField | undefined,
    metadata?: Record<string, unknown>
  ): void {
    if (!item) return;
    this.sectionEvent.emit({
      type: 'item',
      section: this.section,
      item,
      metadata: {
        sectionId: this.section?.id,
        sectionTitle: this.section?.title,
        ...metadata,
      },
    });
  }

  emitActionInteraction(action: CardAction, metadata?: Record<string, unknown>): void {
    this.sectionEvent.emit({
      type: 'action',
      section: this.section,
      action,
      metadata: metadata ?? {},
    });
  }

  /**
   * Handle events from plugin components
   */
  onPluginSectionEvent(event: SectionRenderEvent): void {
    this.sectionEvent.emit(event);
  }
}
