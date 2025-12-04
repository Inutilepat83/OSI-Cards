import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewContainerRef,
  ComponentRef,
  inject,
  ChangeDetectorRef,
  AfterViewInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../models';
import { BaseSectionComponent } from '../sections/base-section.component';
import { SectionPluginRegistry } from '../../services/section-plugin-registry.service';
import { Subject, takeUntil } from 'rxjs';

/**
 * Wrapper component for dynamically loading and rendering plugin section components
 */
@Component({
  selector: 'app-plugin-section-wrapper',
  standalone: true,
  imports: [CommonModule],
  template: `<!-- Plugin component rendered dynamically -->`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginSectionWrapperComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) section!: CardSection;
  @Output() sectionEvent = new EventEmitter<any>();

  private readonly pluginRegistry = inject(SectionPluginRegistry);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  private componentRef: ComponentRef<BaseSectionComponent> | null = null;

  ngOnInit(): void {
    this.loadPlugin();
  }

  ngAfterViewInit(): void {
    // Ensure plugin is loaded after view init
    if (!this.componentRef) {
      this.loadPlugin();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  private loadPlugin(): void {
    if (!this.section) {
      return;
    }

    const componentType = this.pluginRegistry.getComponentForSection(this.section);
    if (!componentType) {
      console.warn(`No plugin registered for section type: ${this.section.type}`);
      return;
    }

    // Clear existing component
    if (this.componentRef) {
      this.componentRef.destroy();
    }

    // Create plugin component
    this.componentRef = this.viewContainer.createComponent(componentType);
    this.componentRef.instance.section = this.section;

    // Wire up event emitters
    if (this.componentRef.instance.fieldInteraction) {
      this.componentRef.instance.fieldInteraction
        .pipe(takeUntil(this.destroy$))
        .subscribe((event) => {
          this.sectionEvent.emit({
            type: 'field',
            section: this.section,
            field: event.field,
            metadata: event.metadata,
          });
        });
    }

    if (this.componentRef.instance.itemInteraction) {
      this.componentRef.instance.itemInteraction
        .pipe(takeUntil(this.destroy$))
        .subscribe((event) => {
          this.sectionEvent.emit({
            type: 'item',
            section: this.section,
            item: event.item,
            metadata: event.metadata,
          });
        });
    }

    this.cdr.markForCheck();
  }
}
