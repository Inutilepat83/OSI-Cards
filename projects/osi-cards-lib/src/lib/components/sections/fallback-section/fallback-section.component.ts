import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';

@Component({
  selector: 'app-fallback-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './fallback-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FallbackSectionComponent extends BaseSectionComponent<CardField> {
  /** Fallback section - flexible sizing */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 1,
    minColumns: 1,
    maxColumns: 4,
  };
  // Fallback section - minimal implementation, inherits all base functionality
}
