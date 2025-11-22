import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent } from '../base-section.component';

@Component({
  selector: 'app-fallback-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './fallback-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FallbackSectionComponent extends BaseSectionComponent<CardField> {
  // Fallback section - minimal implementation, inherits all base functionality
}
