import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardSection } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

interface SolutionField extends CardField {
  category?: 'consulting' | 'technology' | 'managed' | 'training' | 'support' | string;
  benefits?: string[];
  deliveryTime?: string;
  complexity?: 'low' | 'medium' | 'high';
  teamSize?: string;
  outcomes?: string[];
}

interface SolutionInteraction {
  item: SolutionField;
  metadata?: Record<string, unknown>;
}

@Component({
  selector: 'app-solutions-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './solutions-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolutionsSectionComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() itemInteraction = new EventEmitter<SolutionInteraction>();

  private readonly categoryIconMap: Record<string, string> = {
    consulting: 'lightbulb',
    technology: 'zap',
    managed: 'settings',
    training: 'users',
    support: 'target',
    default: 'sparkles'
  };

  get fields(): SolutionField[] {
    return (this.section.fields as SolutionField[]) ?? [];
  }

  get hasFields(): boolean {
    return this.fields.length > 0;
  }

  get gridClass(): string {
    if (this.fields.length <= 1) {
      return 'grid grid-cols-1 gap-5';
    }
    return 'grid grid-cols-1 md:grid-cols-2 gap-5';
  }

  onSolutionClick(field: SolutionField): void {
    this.itemInteraction.emit({
      item: field,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title,
        category: field.category
      }
    });
  }

  getCategoryIcon(category?: string): string {
    if (!category) {
      return this.categoryIconMap['default'];
    }
    return this.categoryIconMap[category] ?? this.categoryIconMap['default'];
  }

  getComplexityClasses(complexity?: string): string {
    switch ((complexity ?? '').toLowerCase()) {
      case 'low':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'medium':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'high':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-muted/30 text-muted-foreground border-border/40';
    }
  }
}
