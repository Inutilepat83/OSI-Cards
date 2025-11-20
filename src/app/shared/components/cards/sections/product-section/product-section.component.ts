import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardSection } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

interface ProductField extends CardField {
  category?: 'pricing' | 'features' | 'process' | 'references' | 'contacts' | 'advantages' | string;
  benefits?: string[];
  outcomes?: string[];
  deliveryTime?: string;
  teamSize?: string;
  contact?: {
    name: string;
    role: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  reference?: {
    company: string;
    testimonial?: string;
    logo?: string;
  };
}

interface ProductFieldInteraction {
  field: ProductField;
  metadata?: Record<string, unknown>;
}

interface ProductCategoryGroup {
  key: string;
  title: string;
  icon: string;
  fields: ProductField[];
}

@Component({
  selector: 'app-product-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './product-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductSectionComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<ProductFieldInteraction>();

  private readonly categoryOrder: string[] = ['references', 'pricing', 'features', 'advantages', 'process', 'contacts'];

  private readonly categoryConfig: Record<string, { title: string; icon: string }> = {
    references: { title: 'Client References', icon: 'award' },
    pricing: { title: 'Pricing & Packages', icon: 'dollar-sign' },
    features: { title: 'Key Features', icon: 'zap' },
    advantages: { title: 'Competitive Advantages', icon: 'trending-up' },
    process: { title: 'Sales Process', icon: 'target' },
    contacts: { title: 'Internal Contacts', icon: 'users' },
    default: { title: 'Product Information', icon: 'box' }
  };

  readonly referenceStars = [1, 2, 3, 4, 5];

  get fields(): ProductField[] {
    return (this.section.fields as ProductField[]) ?? [];
  }

  get hasFields(): boolean {
    return this.fields.length > 0;
  }

  get categoryGroups(): ProductCategoryGroup[] {
    const groups = new Map<string, ProductField[]>();

    this.fields.forEach((field) => {
      const key = (field.category ?? 'default').toLowerCase();
      const bucket = groups.get(key) ?? [];
      bucket.push(field);
      groups.set(key, bucket);
    });

    const orderedKeys = Array.from(groups.keys()).sort((a, b) => {
      const orderA = this.categoryOrder.indexOf(a);
      const orderB = this.categoryOrder.indexOf(b);
      if (orderA === -1 && orderB === -1) {
        return a.localeCompare(b);
      }
      if (orderA === -1) {
        return 1;
      }
      if (orderB === -1) {
        return -1;
      }
      return orderA - orderB;
    });

    return orderedKeys.map((key) => {
      const config = this.categoryConfig[key] ?? this.categoryConfig['default'];
      return {
        key,
        title: config.title,
        icon: config.icon,
        fields: groups.get(key) ?? []
      };
    });
  }

  get referenceGroup(): ProductCategoryGroup | null {
    return this.categoryGroups.find((group) => group.key === 'references') ?? null;
  }

  get gridGroups(): ProductCategoryGroup[] {
    return this.categoryGroups.filter((group) => group.key !== 'references');
  }

  get summaryStats(): { label: string; value: number }[] {
    const totalReferences = this.fields.filter((field) => field.category === 'references').length;
    const totalContacts = this.fields.filter((field) => field.category === 'contacts').length;
    const totalAdvantages = this.fields.filter((field) => field.category === 'advantages').length;
    const totalFeatures = this.fields.filter((field) => field.category === 'features').length;

    return [
      { label: 'Features', value: totalFeatures },
      { label: 'References', value: totalReferences },
      { label: 'Contacts', value: totalContacts },
      { label: 'Advantages', value: totalAdvantages }
    ];
  }

  isContactField(field: ProductField): boolean {
    return !!field.contact;
  }

  isReferenceField(field: ProductField): boolean {
    return !!field.reference;
  }

  onFieldClick(field: ProductField): void {
    this.fieldInteraction.emit({
      field,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title,
        category: field.category
      }
    });
  }

  trackGroup = (_index: number, group: ProductCategoryGroup): string => group.key;

  trackField = (_index: number, field: ProductField): string => field.id ?? field.label ?? `product-field-${_index}`;

  getGroupBadgeLabel(group: ProductCategoryGroup): string {
    return `${group.fields.length} ${group.fields.length === 1 ? 'item' : 'items'}`;
  }

  getCategoryIconTone(group: ProductCategoryGroup): string {
    switch (group.key) {
      case 'pricing':
        return 'product-card__icon--pricing';
      case 'features':
        return 'product-card__icon--features';
      case 'process':
        return 'product-card__icon--process';
      case 'references':
        return 'product-card__icon--references';
      case 'contacts':
        return 'product-card__icon--contacts';
      case 'advantages':
        return 'product-card__icon--advantages';
      default:
        return 'product-card__icon--default';
    }
  }

  /**
   * Get display value, hiding "Streaming…" placeholder text
   */
  getDisplayValue(field: ProductField): string {
    const value = field.value;
    if (value === 'Streaming…' || value === 'Streaming...') {
      return '';
    }
    return value != null ? String(value) : '';
  }
}
