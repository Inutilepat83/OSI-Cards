import { 
  ChangeDetectionStrategy, 
  Component, 
  EventEmitter, 
  Input, 
  Output, 
  inject, 
  ViewEncapsulation,
  ViewChild,
  ViewContainerRef,
  OnChanges,
  SimpleChanges,
  ComponentRef,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { CardAction, CardField, CardItem, CardSection } from '../../models';
import { SectionPluginRegistry } from '../../services/section-plugin-registry.service';
import { BaseSectionComponent, SectionInteraction } from '../sections/base-section.component';
import { DynamicSectionLoaderService } from './dynamic-section-loader.service';
import { resolveSectionType, isValidSectionType, SectionTypeInput } from '../../models/generated-section-types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  imports: [CommonModule],
  template: `
    <ng-container #container></ng-container>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class SectionRendererComponent implements OnChanges {
  @Input({ required: true }) section!: CardSection;
  @Output() sectionEvent = new EventEmitter<SectionRenderEvent>();

  @ViewChild('container', { read: ViewContainerRef, static: true }) 
  private container!: ViewContainerRef;

  private readonly loader = inject(DynamicSectionLoaderService);
  private readonly pluginRegistry = inject(SectionPluginRegistry);
  private readonly destroyRef = inject(DestroyRef);

  private currentComponentRef: ComponentRef<BaseSectionComponent> | null = null;
  private currentType: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['section']) {
      this.loadComponent();
    }
  }

  /**
   * Load the appropriate component for the current section
   */
  private loadComponent(): void {
    if (!this.section) {
      this.clearComponent();
      return;
    }

    const sectionType = this.section.type?.toLowerCase() || 'fallback';
    const resolvedType = this.loader.resolveType(sectionType);

    // Only recreate component if type changed
    if (this.currentType !== resolvedType) {
      this.clearComponent();
      this.createComponent(resolvedType);
      this.currentType = resolvedType;
    } else if (this.currentComponentRef) {
      // Just update the section input
      this.updateComponentInput();
    }
  }

  /**
   * Create the dynamic component
   */
  private createComponent(resolvedType: string): void {
    const componentClass = this.loader.getComponentForSection(this.section);
    
    if (!componentClass) {
      console.warn(`No component found for section type: ${resolvedType}`);
      return;
    }

    this.currentComponentRef = this.container.createComponent(componentClass);
    this.updateComponentInput();
    this.subscribeToComponentEvents();
  }

  /**
   * Update the section input on the component
   */
  private updateComponentInput(): void {
    if (this.currentComponentRef) {
      this.currentComponentRef.setInput('section', this.section);
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
        ...metadata
      }
    });
  }

  emitItemInteraction(item: CardItem | CardField | undefined, metadata?: Record<string, unknown>): void {
    if (!item) return;
    this.sectionEvent.emit({
      type: 'item',
      section: this.section,
      item,
      metadata: {
        sectionId: this.section?.id,
        sectionTitle: this.section?.title,
        ...metadata
      }
    });
  }

  emitActionInteraction(action: CardAction, metadata?: Record<string, unknown>): void {
    this.sectionEvent.emit({
      type: 'action',
      section: this.section,
      action,
      metadata: metadata ?? {}
    });
  }

  /**
   * Handle events from plugin components
   */
  onPluginSectionEvent(event: SectionRenderEvent): void {
    this.sectionEvent.emit(event);
  }
}
