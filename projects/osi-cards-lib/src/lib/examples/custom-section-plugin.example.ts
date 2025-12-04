import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection, CardField } from '../models';
import {
  BaseSectionComponent,
  SectionInteraction,
} from '../components/sections/base-section.component';
import { SectionPlugin } from '../interfaces/section-plugin.interface';
import { LucideIconsModule } from '../icons';

/**
 * Example custom section plugin component
 *
 * This demonstrates how to create a custom section type that extends the library.
 *
 * @example
 * ```typescript
 * // Register the plugin in your app.config.ts or component
 * import { SectionPluginRegistry } from 'osi-cards-lib';
 * import { MyCustomSectionComponent } from './my-custom-section.component';
 *
 * const registry = inject(SectionPluginRegistry);
 *
 * registry.register({
 *   type: 'custom-section',
 *   name: 'Custom Section',
 *   description: 'A custom section for my domain',
 *   component: MyCustomSectionComponent,
 *   config: {
 *     priority: 10
 *   }
 * });
 * ```
 */
@Component({
  selector: 'app-example-custom-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="custom-section-card unified-card">
      <div class="section-header">
        <h3 class="section-title">{{ section.title }}</h3>
        <p *ngIf="section.description" class="section-description">
          {{ section.description }}
        </p>
      </div>

      <div class="custom-content" *ngIf="hasFields">
        <div
          *ngFor="let field of getFields(); trackBy: trackField"
          class="custom-field"
          (click)="emitFieldInteraction(field)"
        >
          <span class="field-label">{{ field.label }}:</span>
          <span class="field-value">{{ field.value }}</span>
        </div>
      </div>

      <div class="custom-empty" *ngIf="!hasFields">
        <p>No data available</p>
      </div>
    </div>
  `,
  styles: [
    `
      .custom-section-card {
        padding: 1rem;
      }

      .section-header {
        margin-bottom: 1rem;
      }

      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      .section-description {
        font-size: 0.875rem;
        color: var(--card-text-secondary, #666);
        margin: 0;
      }

      .custom-content {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .custom-field {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .custom-field:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }

      .field-label {
        font-weight: 500;
        color: var(--card-text-secondary, #666);
      }

      .field-value {
        font-weight: 600;
        color: var(--card-text-primary, #000);
      }

      .custom-empty {
        text-align: center;
        padding: 2rem;
        color: var(--card-text-secondary, #666);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleCustomSectionComponent extends BaseSectionComponent implements SectionPlugin {
  /**
   * Plugin type identifier - must match the type used in card configs
   */
  static readonly PLUGIN_TYPE = 'custom-section';

  /**
   * Returns the plugin type this component handles
   */
  getPluginType(): string {
    return ExampleCustomSectionComponent.PLUGIN_TYPE;
  }

  /**
   * Determines if this plugin can handle the given section
   */
  canHandle(section: CardSection): boolean {
    return section.type === ExampleCustomSectionComponent.PLUGIN_TYPE;
  }
}
