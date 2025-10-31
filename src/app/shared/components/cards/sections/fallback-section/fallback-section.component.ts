import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

@Component({
  selector: 'app-fallback-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './fallback-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FallbackSectionComponent {
  @Input({ required: true }) section!: CardSection;
}
